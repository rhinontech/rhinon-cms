import { Site } from "../models";
import { currentSiteId } from "./siteContext";
import { runAsSystem } from "./tenantContext";

/**
 * Which domain a brand's outbound mail goes out from.
 *
 * Inbox replies, Outreach campaigns and Automation sequences all already decide
 * WHO sends (the user's mailbox, the campaign's sender, the rotation pool).
 * This decides which DOMAIN that address sits on, so a mail sent while working
 * in Uppercurve leaves as prabhat@uppercurve.in rather than
 * prabhat@rhinontech.in — same person, right brand.
 *
 * The local part is deliberately preserved. It matches how tenant addresses
 * already work (<prefix>@<slug>.rhinontech.in) and means no second mailbox has
 * to be provisioned per brand.
 *
 * A brand with no sendingDomain keeps the platform domain, which is what every
 * brand did before this existed.
 */

interface Entry {
  siteId: string;
  sendingDomain: string | null;
  isDefault: boolean;
}

let cache: Entry[] = [];
let loadedAt = 0;
const TTL_MS = 60_000;

/**
 * Refreshed on a timer rather than per send: isAuthenticatedSender() in
 * mailer.ts is synchronous and sits on the hot path of every message, and a DB
 * round trip per recipient would be a real cost on a campaign blast.
 */
export async function refreshSendingDomains(): Promise<void> {
  const sites = await runAsSystem("mail:sending-domains", () =>
    Site.findAll({ attributes: ["id", "sendingDomain", "isDefault"] })
  );
  cache = sites.map((site) => ({
    siteId: site.id,
    sendingDomain: site.sendingDomain ? site.sendingDomain.toLowerCase() : null,
    isDefault: site.isDefault,
  }));
  loadedAt = Date.now();
}

/**
 * Guarantees the cache is usable before a caller reads it.
 *
 * This used to fire the refresh without awaiting it, which made branding
 * non-deterministic: the call that noticed the cache was stale still used the
 * stale value, so the FIRST mail sent after a brand's domain changed — or after
 * a restart — went out on the wrong domain and every later one was correct.
 * A send is worth one query.
 */
export async function ensureSendingDomains(): Promise<void> {
  if (Date.now() - loadedAt <= TTL_MS) return;
  try {
    await refreshSendingDomains();
  } catch (err: any) {
    // Keep whatever is cached rather than failing the send outright; the
    // fallback is the platform domain, which is always deliverable.
    console.error("[Mail] Brand sending-domain refresh failed:", err.message);
  }
}

/** Every brand sending domain configured anywhere in the deployment. */
export function knownSendingDomains(): string[] {
  return cache.map((entry) => entry.sendingDomain).filter((d): d is string => !!d);
}

/**
 * Rewrites `address` onto the brand's sending domain.
 *
 * `siteId` is passed explicitly by the cron paths (a campaign or workflow knows
 * its own brand); request paths leave it out and the ambient site context —
 * the [domain] segment the user is working in — supplies it.
 *
 * Returns the address untouched when there is no brand, no sending domain for
 * it, or the input is not an address. Never throws: a send must not fail
 * because a brand lookup did.
 */
export async function brandSender(
  address: string | null | undefined,
  siteId?: string | null
): Promise<string | null> {
  if (!address || !address.includes("@")) return address ?? null;
  await ensureSendingDomains();

  const target = siteId ?? currentSiteId();
  if (!target) return address;

  const entry = cache.find((e) => e.siteId === target);
  if (!entry?.sendingDomain) return address;

  const localPart = address.split("@")[0];
  return `${localPart}@${entry.sendingDomain}`;
}

/**
 * Which brand an INBOUND message belongs to, decided by who it was sent to.
 *
 * Mail arriving at hello@uppercurve.in is Uppercurve's, whether or not the
 * sender is a known lead — so the recipient domain decides, and the lead's
 * brand is only a fallback for the shared platform domain.
 *
 * Anything on the platform domain (or a tenant subdomain of it) maps to the
 * workspace's default site, so a single-brand workspace needs no configuration
 * at all and existing rhinontech.in mail keeps landing where it always did.
 */
export async function siteIdForRecipient(address: string | null | undefined): Promise<string | null> {
  if (!address || !address.includes("@")) return null;
  await ensureSendingDomains();

  const domain = address.split("@")[1]?.toLowerCase() ?? "";
  if (!domain) return null;

  const branded = cache.find((e) => e.sendingDomain === domain);
  if (branded) return branded.siteId;

  const platform = (process.env.PLATFORM_EMAIL_DOMAIN || "rhinontech.in").toLowerCase();
  if (domain === platform || domain.endsWith(`.${platform}`)) {
    return cache.find((e) => e.isDefault)?.siteId ?? null;
  }

  return null;
}

/**
 * Every address that is the same mailbox as `address`, across brands.
 *
 * prabhat@rhinontech.in and prabhat@uppercurve.in are one person's mail, not
 * two. The Inbox stores ownerEmail as the address a message was sent from or
 * delivered to, so without this a message sent under Uppercurve would vanish
 * from its own sender's Sent folder, and a reply to it would never appear at
 * all.
 */
export function mailboxVariants(address: string | null | undefined): string[] {
  if (!address || !address.includes("@")) return address ? [address] : [];
  const localPart = address.split("@")[0];
  const variants = new Set([address.toLowerCase()]);
  for (const entry of cache) {
    if (entry.sendingDomain) variants.add(`${localPart}@${entry.sendingDomain}`.toLowerCase());
  }
  return [...variants];
}
