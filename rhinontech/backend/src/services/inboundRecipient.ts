import { Organization, Site } from "../models";
import { runAsSystem } from "./tenantContext";
import { siteIdForRecipient } from "./siteSender";

/**
 * Which workspace an inbound email belongs to, decided by the address it was
 * delivered TO (SES's envelope recipient, not the To/Cc headers: a Cc, a Bcc or a
 * mailing-list copy is still mail for our address).
 *
 * The webhook used to file a row per To-header address with no organization at
 * all. Every inbox read is scoped to the signed-in user's organization, so mail
 * that arrived after the last boot-time "adopt orphan rows" pass was invisible to
 * everyone, and mail addressed through an alias (GitHub notifications Cc a user)
 * was filed under an address nobody owns.
 *
 * An exact domain match is required — a suffix test would let
 * `rhinontech.in.attacker.com` land in someone's inbox. Mail for an address we do
 * not own is dropped (it stays in S3), not filed.
 */
export interface InboundTarget {
  organizationId: string;
  /** Lowercased address, stored as the mailbox owner. */
  address: string;
  siteId: string | null;
}

const platformDomain = () => (process.env.PLATFORM_EMAIL_DOMAIN || "rhinontech.in").toLowerCase();

export async function resolveInboundRecipient(raw: string | null | undefined): Promise<InboundTarget | null> {
  const address = (raw || "").trim().toLowerCase();
  const at = address.lastIndexOf("@");
  if (at < 1) return null;
  const domain = address.slice(at + 1);
  if (!domain) return null;

  return runAsSystem("inbound:resolve-recipient", async () => {
    // 1. A workspace's own mail domain (<slug>.rhinontech.in).
    let org = await Organization.findOne({ where: { emailDomain: domain } });

    // 2. The bare platform domain belongs to the platform workspace.
    if (!org && domain === platformDomain()) {
      org = await Organization.findOne({ where: { isPlatform: true } });
    }

    // 3. A brand's sending domain (uppercurve.in). Only an operator can set
    //    Site.sendingDomain, so a tenant cannot claim a domain it does not own.
    if (!org) {
      const site = await Site.findOne({ where: { sendingDomain: domain } });
      const organizationId = (site as any)?.organizationId as string | undefined;
      if (organizationId) org = await Organization.findByPk(organizationId);
    }

    if (!org || org.status === "suspended") return null;
    return { organizationId: org.id, address, siteId: await siteIdForRecipient(address) };
  });
}
