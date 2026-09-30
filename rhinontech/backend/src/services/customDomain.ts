import type { SESv2Client } from "@aws-sdk/client-sesv2";
import {
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
  DeleteEmailIdentityCommand,
} from "@aws-sdk/client-sesv2";
import crypto from "crypto";
import { Op, literal } from "sequelize";
import { Organization } from "../models/Organization";
import { Site } from "../models/Site";
import { PLAN_LIMITS } from "../config/plans";
import { planState } from "./usage";
import { client, inboundMxTarget, type DnsRecord } from "./sesProvisioning";
import { refreshSendingDomains } from "./siteSender";
import { runAsSystem, runForOrg } from "./tenantContext";

/**
 * A workspace sending from its own domain — prabhat@swiggy.com instead of
 * prabhat@swiggy.rhinontech.in.
 *
 * Ownership is proved the only way that cannot be faked: SES generates DKIM
 * tokens for the domain and the customer publishes them as CNAMEs in THEIR DNS.
 * Until SES sees them the domain is "pending" and nothing changes. When it does,
 * the workspace's default brand (Site.sendingDomain) is pointed at the domain, and
 * the existing brand-sender machinery rewrites every outbound address onto it.
 *
 * How many domains a workspace may hold is its plan's `customDomains`: none on
 * free, one on paid plans, unlimited only for the platform workspace, which runs
 * several brands (rhinonlabs.com, uppercurve.in, …) and needs a domain for each.
 * Every domain belongs to exactly one brand (Site), and a brand has one domain.
 *
 * The SES client is a parameter so the flow can be exercised with a stand-in;
 * production callers pass nothing and get the real one.
 */

export class CustomDomainError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

// Addresses nobody can verify, and domains it would be hostile to let one tenant claim.
const FREE_MAIL = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.in", "outlook.com", "hotmail.com", "live.com",
  "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com", "zoho.com", "rediffmail.com",
]);

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

/** Lowercases and validates; throws CustomDomainError with a reason a person can act on. */
export function normalizeDomain(input: unknown): string {
  const raw = String(input ?? "").trim().toLowerCase().replace(/\.$/, "");
  if (!raw) throw new CustomDomainError("Enter the domain you want to send from, e.g. acme.com.");
  if (/[\s/@:]/.test(raw)) throw new CustomDomainError("Enter just the domain (acme.com), not an email address or URL.");
  const labels = raw.split(".");
  if (labels.length < 2 || !labels.every((l) => LABEL.test(l)) || !/^[a-z]{2,}$/.test(labels[labels.length - 1])) {
    throw new CustomDomainError("That does not look like a valid domain name.");
  }
  if (raw.length > 253) throw new CustomDomainError("That domain name is too long.");
  if (FREE_MAIL.has(raw)) throw new CustomDomainError("That is a public mail provider. Use a domain your company owns.");

  const platform = (process.env.PLATFORM_EMAIL_DOMAIN || "rhinontech.in").toLowerCase();
  if (raw === platform || raw.endsWith(`.${platform}`)) {
    throw new CustomDomainError("That domain belongs to the platform. Use your own domain.");
  }
  return raw;
}

export function customDomainRecords(domain: string, dkimTokens: string[]): DnsRecord[] {
  const region = process.env.AWS_REGION || "ap-south-1";
  return [
    ...dkimTokens.map((token): DnsRecord => ({
      type: "CNAME",
      name: `${token}._domainkey.${domain}`,
      value: `${token}.dkim.amazonses.com`,
      purpose: "Proves you own the domain and signs your outgoing mail (DKIM). Required.",
    })),
    {
      type: "TXT",
      name: domain,
      value: "v=spf1 include:amazonses.com ~all",
      purpose: "Authorises our mail servers to send for your domain (SPF). If you already have an SPF record, add include:amazonses.com to it instead of creating a second one.",
    },
    {
      type: "TXT",
      name: `_dmarc.${domain}`,
      value: `v=DMARC1; p=none; adkim=s; aspf=s`,
      purpose: "Tells receivers how to treat unauthenticated mail claiming to be you (DMARC). Recommended.",
      optional: true,
    },
    {
      type: "MX",
      name: domain,
      value: inboundMxTarget(),
      priority: 10,
      purpose: `Only if you want replies to ${domain} addresses to arrive in this workspace's inbox. WARNING: this routes ALL mail for ${domain} here and replaces any existing mail provider (Google Workspace, Microsoft 365). Skip it if your domain already receives mail elsewhere.`,
      optional: true,
    },
  ];
}

type Entry = NonNullable<Organization["settings"]["emailDomains"]>[number];

const entriesOf = (org: Organization): Entry[] => org.settings?.emailDomains ?? [];

const save = (org: Organization, entries: Entry[], label: string) =>
  runAsSystem(label, () => org.update({ settings: { ...org.settings, emailDomains: entries } }));

export interface CustomDomainItem {
  domain: string;
  status: Entry["status"];
  siteId: string | null;
  records: DnsRecord[];
  message: string;
}

export interface CustomDomainView {
  domains: CustomDomainItem[];
  /** Null = unlimited. */
  limit: number | null;
  canAddMore: boolean;
}

const messageFor = (e: Entry) =>
  e.status === "verified"
    ? `${e.domain} is verified. Outgoing mail for this brand is sent from it.`
    : e.status === "failed"
      ? `Verification of ${e.domain} failed. Check the DNS records and try again.`
      : `Add the DNS records below at your domain's DNS provider. Verification usually completes within an hour of the records appearing.`;

export function customDomainView(org: Organization): CustomDomainView {
  const entries = entriesOf(org);
  const limit = org.isPlatform ? null : planState(org).limits.customDomains;
  return {
    domains: entries.map((e) => ({
      domain: e.domain, status: e.status, siteId: e.siteId,
      records: customDomainRecords(e.domain, e.dkimTokens), message: messageFor(e),
    })),
    limit,
    canAddMore: limit === null || entries.length < limit,
  };
}

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "brand";

export interface AddDomainInput {
  domain: unknown;
  /** An existing brand to send for. Omit for the workspace's default brand. */
  siteId?: string;
  /** Platform only: create a new brand alongside the domain. */
  brandName?: string;
}

export async function requestCustomDomain(org: Organization, input: AddDomainInput, ses: SESv2Client | null = client()): Promise<CustomDomainView> {
  const entries = entriesOf(org);
  const limit = org.isPlatform ? null : planState(org).limits.customDomains;
  if (limit === 0) {
    throw new CustomDomainError("Sending from your own domain is available on paid plans. Upgrade to use it.", 402);
  }
  if (limit !== null && entries.length >= limit) {
    throw new CustomDomainError(`Your plan includes ${limit} custom domain${limit === 1 ? "" : "s"}. Remove one or upgrade to add another.`, 409);
  }

  const domain = normalizeDomain(input.domain);
  if (entries.some((e) => e.domain === domain)) throw new CustomDomainError("That domain is already on this workspace.", 409);
  if (input.brandName && !org.isPlatform) {
    throw new CustomDomainError("Only the platform workspace can create additional brands.", 403);
  }

  // Nobody else may already hold it — as a custom domain, a tenant mail domain, or a brand's sending domain.
  const taken = await runAsSystem("custom-domain:conflict", async () => {
    const asOrg = await Organization.findOne({
      where: { [Op.or]: [{ customDomain: domain }, { emailDomain: domain }, literal(`"settings"->'emailDomains' @> '[{"domain":"${domain}"}]'::jsonb`)] },
      attributes: ["id"],
    });
    const asSite = await Site.findOne({ where: { sendingDomain: domain }, attributes: ["id"] });
    return !!asOrg || !!asSite;
  });
  if (taken) throw new CustomDomainError("That domain is already in use by a workspace.", 409);

  // Which brand it is for. Resolved before anything is created at SES.
  let site: Site | null = null;
  if (!input.brandName) {
    site = await runForOrg(org.id, () =>
      input.siteId ? Site.findByPk(input.siteId) : Site.findOne({ where: { isDefault: true } })
    );
    if (!site) throw new CustomDomainError(input.siteId ? "That brand does not exist in this workspace." : "This workspace has no brand to attach the domain to.", 404);
    if (site.sendingDomain || entries.some((e) => e.siteId === site!.id)) {
      throw new CustomDomainError(`${site.name} already has a sending domain. Choose another brand or remove that domain first.`, 409);
    }
  }

  if (!ses) throw new CustomDomainError("Email provisioning is not configured on this server.", 503);

  let tokens: string[] = [];
  try {
    const created = await ses.send(
      new CreateEmailIdentityCommand({ EmailIdentity: domain, DkimSigningAttributes: { NextSigningKeyLength: "RSA_2048_BIT" } })
    );
    tokens = created.DkimAttributes?.Tokens ?? [];
  } catch (err: any) {
    // The identity exists in our SES account but no workspace holds it: a request someone
    // else started, or a leftover. Either way it is not ours to hand to a new claimant.
    if (err?.name === "AlreadyExistsException") {
      throw new CustomDomainError("That domain has already been registered. Contact support if it is yours.", 409);
    }
    console.error(`[CustomDomain] SES refused ${domain}:`, err.message);
    throw new CustomDomainError("Could not register that domain with the email provider.", 502);
  }

  try {
    if (input.brandName) {
      site = await runForOrg(org.id, async () => {
        let slug = slugify(input.brandName!);
        if (await Site.findOne({ where: { slug }, attributes: ["id"] })) slug = `${slug}-${crypto.randomBytes(2).toString("hex")}`;
        return Site.create({ name: input.brandName!.trim().slice(0, 80), slug, isDefault: false, supportsCaseStudies: true, supportsEvents: false } as any);
      });
    }
    const entry: Entry = { domain, status: "pending", dkimTokens: tokens, siteId: site!.id, requestedAt: new Date().toISOString() };
    const all = [...entries, entry];
    await runAsSystem("custom-domain:save", () =>
      org.update({
        // The column holds the first domain: it is what inbound routing and the
        // uniqueness guarantee key on. Further domains route through their brand.
        ...(org.customDomain ? {} : { customDomain: domain }),
        settings: { ...org.settings, emailDomains: all },
      })
    );
  } catch (err: any) {
    // Do not leave a registered SES identity behind for a domain we failed to record.
    await ses.send(new DeleteEmailIdentityCommand({ EmailIdentity: domain })).catch(() => {});
    console.error(`[CustomDomain] Saving ${domain} failed:`, err.message);
    throw new CustomDomainError("Could not save that domain.", 500);
  }
  return customDomainView(org);
}

/** Checks SES for every pending domain and, as each verifies, switches its brand onto it. */
export async function refreshCustomDomain(org: Organization, ses: SESv2Client | null = client()): Promise<CustomDomainView> {
  const entries = entriesOf(org);
  if (!ses || !entries.some((e) => e.status === "pending")) return customDomainView(org);

  let changed = false;
  const next: Entry[] = [];
  for (const entry of entries) {
    if (entry.status !== "pending") { next.push(entry); continue; }
    try {
      const res = await ses.send(new GetEmailIdentityCommand({ EmailIdentity: entry.domain }));
      if (res.DkimAttributes?.Status === "FAILED") {
        next.push({ ...entry, status: "failed" });
        changed = true;
      } else if (res.DkimAttributes?.Status === "SUCCESS" && res.VerifiedForSendingStatus === true) {
        next.push({ ...entry, status: "verified", verifiedAt: new Date().toISOString() });
        changed = true;
        // Point the brand at it; brandSender() then rewrites outbound addresses.
        await runForOrg(org.id, async () => {
          const site = entry.siteId ? await Site.findByPk(entry.siteId) : await Site.findOne({ where: { isDefault: true } });
          if (site && !site.sendingDomain) await site.update({ sendingDomain: entry.domain });
        });
      } else {
        next.push(entry);
      }
    } catch (err: any) {
      console.error(`[CustomDomain] Status check failed for ${entry.domain}:`, err.message);
      next.push(entry);
    }
  }

  if (changed) {
    await save(org, next, "custom-domain:refresh");
    await refreshSendingDomains().catch(() => {});
  }
  return customDomainView(org);
}

export async function removeCustomDomain(org: Organization, domainInput: unknown, ses: SESv2Client | null = client()): Promise<CustomDomainView> {
  const domain = String(domainInput ?? "").trim().toLowerCase();
  const entries = entriesOf(org);
  const entry = entries.find((e) => e.domain === domain);
  if (!entry) throw new CustomDomainError("That domain is not on this workspace.", 404);

  if (ses) {
    try {
      await ses.send(new DeleteEmailIdentityCommand({ EmailIdentity: domain }));
    } catch (err: any) {
      if (err?.name !== "NotFoundException") console.error(`[CustomDomain] SES delete failed for ${domain}:`, err.message);
    }
  }

  await runForOrg(org.id, async () => {
    const site = await Site.findOne({ where: { sendingDomain: domain } });
    if (site) await site.update({ sendingDomain: null });
  });

  const rest = entries.filter((e) => e.domain !== domain);
  await runAsSystem("custom-domain:remove", () =>
    org.update({
      // Hand the column to the next domain, or clear it, so a removed domain is free to claim.
      ...(org.customDomain === domain ? { customDomain: rest[0]?.domain ?? null } : {}),
      settings: { ...org.settings, emailDomains: rest },
    })
  );
  await refreshSendingDomains().catch(() => {});
  return customDomainView(org);
}
