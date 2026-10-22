import { Organization, Site } from "../models";
import { runAsSystem, runForOrg } from "./tenantContext";

/**
 * Which workspace an inbound email belongs to, decided by the address it was
 * sent TO.
 *
 * SES delivers every tenant's mail through one catch-all receipt rule, so the
 * webhook sees mail for all of them in one stream. The recipient's domain is the
 * only thing that says whose it is, and it has to be an exact match — a suffix
 * test would let `evil.rhinontech.in.attacker.com` or an unprovisioned
 * subdomain land in someone's inbox. Mail to an address we do not own is dropped
 * rather than filed anywhere.
 */
export interface InboundTarget {
  organizationId: string;
  siteId: string | null;
  /** Lowercased address, as it should be stored as the mailbox owner. */
  address: string;
}

const platformDomain = () => (process.env.PLATFORM_EMAIL_DOMAIN || "rhinontech.in").toLowerCase();

async function defaultSiteId(organizationId: string): Promise<string | null> {
  const site = await runForOrg(organizationId, () =>
    Site.findOne({ where: { isDefault: true }, attributes: ["id"] })
  );
  return site?.id ?? null;
}

export async function resolveInboundRecipient(rawAddress: string | null | undefined): Promise<InboundTarget | null> {
  const address = (rawAddress || "").trim().toLowerCase();
  const at = address.lastIndexOf("@");
  if (at < 1) return null;
  const domain = address.slice(at + 1);
  if (!domain) return null;

  return runAsSystem("inbound:resolve-recipient", async () => {
    // 1. A workspace's own mail domain: <slug>.rhinontech.in, or its custom domain.
    let org = await Organization.findOne({ where: { emailDomain: domain } });
    if (!org) {
      // Only a VERIFIED custom domain routes mail: a claim nobody has proved they
      // own (no DKIM published) must not be able to receive anything.
      const claimed = await Organization.findOne({ where: { customDomain: domain } });
      if (claimed?.settings?.emailDomains?.some((e) => e.domain === domain && e.status === "verified")) org = claimed;
    }

    // 2. The bare platform domain belongs to the platform workspace.
    if (!org && domain === platformDomain()) {
      org = await Organization.findOne({ where: { isPlatform: true } });
    }

    if (org) {
      if (org.status === "suspended") return null;
      return { organizationId: org.id, siteId: await defaultSiteId(org.id), address };
    }

    // 3. A brand's sending domain (uppercurve.in). Only reachable when a Site row
    //    names it, and nothing in the API can set that column — it is written by
    //    an operator — so a tenant cannot claim a domain it does not own.
    const site = await Site.findOne({ where: { sendingDomain: domain } });
    if (site) {
      const organizationId = (site as any).organizationId as string | null;
      if (!organizationId) return null;
      const owner = await Organization.findByPk(organizationId);
      if (!owner || owner.status === "suspended") return null;
      return { organizationId, siteId: site.id, address };
    }

    return null;
  });
}
