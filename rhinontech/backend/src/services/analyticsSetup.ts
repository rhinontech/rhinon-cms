import crypto from "crypto";
import { Organization, Site } from "../models";
import { runAsSystem } from "./tenantContext";

/**
 * Per-site tracking setup: the key a customer's snippet carries, the domains
 * allowed to report under it, and the lookup the collector runs per pageview.
 *
 * The key is public by design (it sits in page source), so it can only ever ADD
 * a pageview to one site. What stops it being replayed from elsewhere is the
 * domain list: the collector only accepts a beacon whose Origin is one of the
 * site's registered hostnames. That is a guard against stray or copy-pasted
 * snippets polluting a customer's numbers, not against a determined forger —
 * Origin is set by browsers, and a script outside one can claim anything.
 */

export const MAX_TRACKED_DOMAINS = 10;

const apiBase = () => (process.env.PUBLIC_API_URL || "https://api.rhinontech.in").replace(/\/+$/, "");

export const trackerScriptUrl = () => `${apiBase()}/t.js`;

export const newAnalyticsKey = () => `rt_${crypto.randomBytes(12).toString("hex")}`;

const HOST = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** "https://www.Acme.com/pricing?x" -> "acme.com". Null when it is not a hostname. */
export function normalizeDomain(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let value = input.trim().toLowerCase();
  if (!value) return null;
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, "").split(/[/?#]/)[0].replace(/:\d+$/, "").replace(/^www\./, "");
  if (value === "localhost") return value; // for trying the snippet before it goes live
  return HOST.test(value) ? value : null;
}

/** Host of a header value that may be an Origin or a full Referer URL. */
function hostOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function requestHost(origin: string | undefined, referer: string | undefined): string | null {
  return hostOf(origin) ?? hostOf(referer);
}

export function domainAllowed(host: string | null, domains: string[]): boolean {
  if (!host) return false;
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

/** The site's key, minting one the first time analytics is set up for it. */
export async function ensureAnalyticsKey(site: Site): Promise<string> {
  if (site.analyticsKey) return site.analyticsKey;
  await site.update({ analyticsKey: newAnalyticsKey() });
  return site.analyticsKey as string;
}

export interface TrackerTarget {
  organizationId: string;
  siteId: string;
  siteSlug: string;
  domains: string[];
  isPlatform: boolean;
}

// Every pageview resolves its key, so a short cache keeps that off the database.
// Changes made through the setup routes call forgetTracker(), so the only stale
// window is another process, bounded by the TTL.
const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { at: number; target: TrackerTarget | null }>();

export function forgetTracker(key?: string | null) {
  if (key) cache.delete(key);
  else cache.clear();
}

export async function resolveTrackerKey(key: string): Promise<TrackerTarget | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.target;

  const target = await runAsSystem("analytics:resolve-key", async () => {
    const site = await Site.findOne({ where: { analyticsKey: key } });
    const organizationId = (site as any)?.organizationId as string | undefined;
    if (!site || !organizationId) return null;
    const org = await Organization.findByPk(organizationId);
    // A suspended or scheduled-for-deletion workspace stops collecting.
    if (!org || org.status === "suspended" || org.settings?.deletionScheduledFor) return null;
    return {
      organizationId,
      siteId: site.id,
      siteSlug: site.slug,
      domains: site.trackedDomains ?? [],
      isPlatform: !!org.isPlatform,
    } satisfies TrackerTarget;
  });

  if (cache.size > 5000) cache.clear();
  cache.set(key, { at: Date.now(), target });
  return target;
}

// The most recent beacon each site refused for coming from an unlisted host. Kept
// in memory only: it exists so the setup screen can say "we heard from
// shop.example.com, which is not on your list" instead of a silent nothing.
const rejected = new Map<string, { host: string; at: number }>();

export function noteRejectedHost(siteId: string, host: string | null) {
  if (rejected.size > 5000) rejected.clear();
  rejected.set(siteId, { host: host ?? "(no origin)", at: Date.now() });
}

export function lastRejectedHost(siteId: string) {
  const r = rejected.get(siteId);
  return r && Date.now() - r.at < 24 * 3600_000 ? { host: r.host, at: new Date(r.at).toISOString() } : null;
}

/** The exact tag a customer pastes into <head>. */
export function installSnippet(key: string): string {
  return `<script async defer src="${trackerScriptUrl()}" data-key="${key}"></script>`;
}
