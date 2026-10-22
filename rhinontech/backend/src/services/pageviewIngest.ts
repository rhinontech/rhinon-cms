import type { Request } from "express";
import { PageView } from "../models";
import { env } from "../config/env";
import { classifyChannel, parseHost, isBotUserAgent } from "./analytics";
import { clientIpFrom, isIpCompanyLookupEnabled, lookupCompanyByIp } from "./ipCompany";
import { extractClientIp, lookupIpLocationCached } from "./geolocation";

/**
 * Turns one tracker beacon into a PageView row. Shared by the legacy
 * POST /public/track (rhinonlabs.com, resolved to the platform workspace) and the
 * keyed POST /collect that customers' snippets use — the two differ only in who
 * decides the workspace and site, never in how a pageview is read.
 */

const str = (v: unknown, max = 512): string | null => {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s.slice(0, max);
};

/** The body arrives as JSON (fetch) or a JSON string (sendBeacon, text/plain). */
export function parseBeaconBody(raw: unknown): Record<string, any> {
  let b: any = raw;
  if (typeof b === "string") {
    try { b = JSON.parse(b); } catch { b = {}; }
  }
  return b && typeof b === "object" ? b : {};
}

export interface IngestOptions {
  siteId: string | null;
  /**
   * Resolve the visiting company from the IP. Off for customer workspaces: it is
   * a third-party lookup on a stranger's visitors, which is Rhinon's own
   * marketing signal, not something to do on a customer's behalf.
   */
  companyLookup: boolean;
}

/** Returns the stored view, or null when the beacon was junk and was ignored. */
export async function recordPageview(
  req: Request,
  b: Record<string, any>,
  opts: IngestOptions
): Promise<PageView | null> {
  // Path is required; strip any querystring/hash so grouping by page is clean.
  let path = str(b.path, 512);
  if (path) path = path.split("?")[0].split("#")[0];
  if (!path || !path.startsWith("/")) return null;

  const visitorId = str(b.visitorId, 64);
  const sessionId = str(b.sessionId, 64);
  if (!visitorId || !sessionId) return null;

  const referrer = str(b.referrer, 1024);
  const referrerHost = parseHost(referrer);
  const userAgent = str(req.headers["user-agent"], 1024);
  // The configured site host and the host that sent this beacon both count as
  // "us", so internal navigation reads as Direct (not Referral).
  const originHost = parseHost((req.headers.origin as string) || null);
  const selfHosts = [parseHost(env.siteUrl), originHost];

  const utmMedium = str(b.utmMedium, 256);
  const channel = classifyChannel({ referrerHost, utmMedium, selfHosts });
  const isBot = isBotUserAgent(userAgent);

  // Resolve the visiting organisation from the request IP, then let the IP go.
  // Bots are skipped — they'd burn lookup quota for no signal.
  let companyName: string | null = null;
  let companyDomain: string | null = null;
  if (opts.companyLookup && !isBot && isIpCompanyLookupEnabled()) {
    const ip = clientIpFrom(req.headers as any, req.socket?.remoteAddress);
    const hit = await lookupCompanyByIp(ip);
    if (hit) {
      companyName = hit.name;
      companyDomain = hit.domain;
    }
  }

  return PageView.create({
    siteId: opts.siteId,
    visitorId,
    sessionId,
    path,
    companyName,
    companyDomain,
    title: str(b.title, 512),
    referrer,
    referrerHost,
    channel,
    utmSource: str(b.utmSource, 256),
    utmMedium,
    utmCampaign: str(b.utmCampaign, 256),
    utmTerm: str(b.utmTerm, 256),
    utmContent: str(b.utmContent, 256),
    userAgent,
    isBot,
  });
}

/**
 * Geo is resolved AFTER responding: the beacon must never wait on a third-party
 * lookup. Bots are skipped — they only burn the rate limit. The lookup is cached
 * per IP, so a visitor reading several pages costs one call.
 */
export function enrichGeoInBackground(req: Request, view: PageView): void {
  if (view.isBot) return;
  void (async () => {
    try {
      const ip = extractClientIp(req);
      const geo = await lookupIpLocationCached(ip);
      if (!geo || (geo.latitude == null && geo.country == null)) return;
      await view.update({
        country: geo.country ?? null,
        region: geo.region ?? null,
        city: geo.city ?? null,
        latitude: geo.latitude ?? null,
        longitude: geo.longitude ?? null,
      });
    } catch (err) {
      console.error("Pageview geo enrichment failed:", err);
    }
  })();
}
