import {
  SESv2Client,
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
  PutEmailIdentityMailFromAttributesCommand,
} from "@aws-sdk/client-sesv2";
import { Organization } from "../models/Organization";

/**
 * Email provisioning for an organization's subdomain.
 *
 * Two modes, because they trade off against each other and the right one
 * depends on how much of our DNS we are willing to automate:
 *
 *   inherit  (default) — rhinontech.in is a verified DOMAIN identity, and SES lets
 *                        a verified domain send from any subdomain. So
 *                        aman@swiggy.rhinontech.in sends immediately, with zero
 *                        API calls and zero DNS writes. The cost: mail is signed
 *                        d=rhinontech.in, so every tenant shares one DKIM
 *                        reputation — one spammer's complaint rate is everyone's.
 *
 *                        NOTE: 'verified' in SES means ownership only. Until
 *                        2026-09-12 this domain had DKIM NOT_STARTED and no SPF
 *                        or DMARC at all, so there was nothing to inherit and
 *                        outbound mail was landing in spam. Enabling Easy DKIM,
 *                        SPF, a custom MAIL FROM and DMARC is a PREREQUISITE for
 *                        this mode, not an optimisation.
 *
 *   identity          — create a real SES identity per subdomain. Mail is signed
 *                        d=swiggy.rhinontech.in, which separates DKIM reputation
 *                        and allows a per-tenant DMARC policy. Costs three DKIM
 *                        CNAMEs + an MX record per org, which we can write
 *                        ourselves because we own the zone.
 *
 * Inbound is the same either way: wildcard MX on *.rhinontech.in pointing at the
 * SES inbound endpoint, with a catch-all receipt rule. A receipt rule scoped to
 * the apex does NOT reliably cover subdomains (SES distinguishes `example.com`
 * from `.example.com` in recipient conditions), so the catch-all is the safe
 * shape — and the webhook then has to reject recipients that aren't ours, which
 * it currently does not.
 */

export type SesMode = "inherit" | "identity";

export interface DnsRecord {
  type: "CNAME" | "MX" | "TXT";
  name: string;
  value: string;
  priority?: number;
  purpose: string;
}

export function sesMode(): SesMode {
  return process.env.SES_SUBDOMAIN_MODE === "identity" ? "identity" : "inherit";
}

function region(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-south-1";
}

function client(): SESv2Client | null {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) return null;
  return new SESv2Client({ region: region() });
}

/** The SES inbound endpoint for our region — the MX target for every subdomain. */
export function inboundMxTarget(): string {
  return `inbound-smtp.${region()}.amazonaws.com`;
}

/**
 * What the org's DNS needs. Under `inherit` this is informational (the wildcard
 * on the parent already covers it); under `identity` these are the records that
 * must exist before SES will verify.
 */
export function dnsRecordsFor(org: Organization, dkimTokens: string[] = []): DnsRecord[] {
  const records: DnsRecord[] = [
    {
      type: "MX",
      name: org.emailDomain,
      value: inboundMxTarget(),
      priority: 10,
      purpose: "Deliver replies to this workspace's inbox",
    },
  ];
  for (const token of dkimTokens) {
    records.push({
      type: "CNAME",
      name: `${token}._domainkey.${org.emailDomain}`,
      value: `${token}.dkim.amazonses.com`,
      purpose: "DKIM signing",
    });
  }
  return records;
}

/**
 * Writes the records into our own Route53 zone when one is configured, so the
 * customer does nothing. Optional by design: the SDK client is not a dependency
 * of this repo, so the import is dynamic and a missing package degrades to
 * "show the records in Settings" instead of breaking signup.
 */
async function writeToRoute53(records: DnsRecord[]): Promise<boolean> {
  const zoneId = process.env.ROUTE53_HOSTED_ZONE_ID;
  if (!zoneId) return false;

  let mod: any;
  try {
    // Indirect specifier: the package is optional, so TypeScript must not
    // resolve it at build time on machines that have not installed it.
    const optional = "@aws-sdk/client-route-53";
    mod = await import(optional);
  } catch {
    console.warn(
      "[SES] ROUTE53_HOSTED_ZONE_ID is set but @aws-sdk/client-route-53 is not installed — " +
        "skipping automatic DNS. Install it to finish zero-setup provisioning."
    );
    return false;
  }

  const r53 = new mod.Route53Client({ region: region() });
  await r53.send(
    new mod.ChangeResourceRecordSetsCommand({
      HostedZoneId: zoneId,
      ChangeBatch: {
        Changes: records.map((r) => ({
          Action: "UPSERT",
          ResourceRecordSet: {
            Name: r.name,
            Type: r.type,
            TTL: 1800,
            ResourceRecords: [
              { Value: r.type === "MX" ? `${r.priority ?? 10} ${r.value}` : r.value },
            ],
          },
        })),
      },
    })
  );
  return true;
}

export interface ProvisionEmailResult {
  mode: SesMode;
  status: Organization["sesStatus"];
  records: DnsRecord[];
  dnsAutomated: boolean;
  message: string;
}

/**
 * Called after signup commits. Never throws into the signup path — a workspace
 * that exists but cannot send yet is recoverable; a signup that 500s is not.
 */
export async function provisionOrgEmailDomain(
  org: Organization
): Promise<ProvisionEmailResult> {
  const mode = sesMode();

  if (mode === "inherit") {
    await org.update({ sesStatus: "inherited", sesVerifiedAt: new Date() });
    return {
      mode,
      status: "inherited",
      records: dnsRecordsFor(org),
      dnsAutomated: true,
      message:
        `${org.emailDomain} inherits sending authorisation from the verified parent domain. ` +
        `Mail is signed d=${process.env.PLATFORM_EMAIL_DOMAIN || "rhinontech.in"}.`,
    };
  }

  const ses = client();
  if (!ses) {
    await org.update({ sesStatus: "failed" });
    return {
      mode,
      status: "failed",
      records: dnsRecordsFor(org),
      dnsAutomated: false,
      message: "AWS credentials are not configured, so the email identity was not created.",
    };
  }

  try {
    let dkimTokens: string[] = [];
    try {
      const created = await ses.send(
        new CreateEmailIdentityCommand({
          EmailIdentity: org.emailDomain,
          DkimSigningAttributes: { NextSigningKeyLength: "RSA_2048_BIT" },
        })
      );
      dkimTokens = created.DkimAttributes?.Tokens ?? [];
    } catch (err: any) {
      // Already exists (a re-run, or a re-created org on the same slug).
      if (err?.name !== "AlreadyExistsException") throw err;
      const existing = await ses.send(
        new GetEmailIdentityCommand({ EmailIdentity: org.emailDomain })
      );
      dkimTokens = existing.DkimAttributes?.Tokens ?? [];
    }

    // A custom MAIL FROM on the subdomain keeps SPF aligned with the visible
    // From address instead of falling back to amazonses.com.
    try {
      await ses.send(
        new PutEmailIdentityMailFromAttributesCommand({
          EmailIdentity: org.emailDomain,
          MailFromDomain: `mail.${org.emailDomain}`,
          BehaviorOnMxFailure: "USE_DEFAULT_VALUE",
        })
      );
    } catch (err: any) {
      console.warn(`[SES] MAIL FROM setup skipped for ${org.emailDomain}: ${err.message}`);
    }

    const records = dnsRecordsFor(org, dkimTokens);
    const dnsAutomated = await writeToRoute53(records).catch((err) => {
      console.error(`[SES] Route53 write failed for ${org.emailDomain}:`, err.message);
      return false;
    });

    await org.update({ sesStatus: "pending", sesIdentityArn: org.emailDomain });

    return {
      mode,
      status: "pending",
      records,
      dnsAutomated,
      message: dnsAutomated
        ? `${org.emailDomain} is provisioning. DKIM usually verifies within a few minutes.`
        : `${org.emailDomain} needs the DNS records below before it can send.`,
    };
  } catch (err: any) {
    console.error(`[SES] Provisioning failed for ${org.emailDomain}:`, err.message);
    await org.update({ sesStatus: "failed" });
    return {
      mode,
      status: "failed",
      records: dnsRecordsFor(org),
      dnsAutomated: false,
      message: err.message,
    };
  }
}

/** Polls SES for the identity's current verification state. */
export async function refreshSesStatus(org: Organization): Promise<Organization["sesStatus"]> {
  if (sesMode() === "inherit") return org.sesStatus;
  const ses = client();
  if (!ses) return org.sesStatus;

  try {
    const res = await ses.send(new GetEmailIdentityCommand({ EmailIdentity: org.emailDomain }));
    const verified = res.VerifiedForSendingStatus === true;
    const status = verified ? "verified" : "pending";
    await org.update({
      sesStatus: status,
      sesVerifiedAt: verified ? new Date() : org.sesVerifiedAt,
    });
    return status;
  } catch {
    return org.sesStatus;
  }
}
