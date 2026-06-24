import type { TrafficChannel } from "../models/PageView";

// Search engines → "Organic Search". The whole point of tracking organic marketing.
const SEARCH_HOSTS = [
  "google.", "bing.", "duckduckgo.", "yahoo.", "yandex.", "baidu.",
  "ecosia.", "brave.", "startpage.", "search.",
];

// Social networks → "Social".
const SOCIAL_HOSTS = [
  "linkedin.", "lnkd.in", "twitter.", "x.com", "t.co", "facebook.", "fb.com",
  "instagram.", "youtube.", "youtu.be", "reddit.", "pinterest.", "tiktok.",
  "whatsapp.", "telegram.", "t.me", "medium.", "quora.", "threads.",
];

// Common bot/crawler signatures — these views are excluded from all dashboard counts.
const BOT_PATTERNS = [
  "bot", "crawler", "spider", "crawl", "slurp", "mediapartners",
  "facebookexternalhit", "embedly", "quora link preview", "bitlybot",
  "vkshare", "w3c_validator", "pingdom", "lighthouse", "headlesschrome",
  "python-requests", "curl/", "wget/", "axios/", "node-fetch", "go-http-client",
  "monitoring", "uptime", "preview", "scanner", "semrush", "ahrefs", "dataforseo",
];

export function parseHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return true; // no UA at all is almost always automated traffic
  const lower = ua.toLowerCase();
  return BOT_PATTERNS.some((p) => lower.includes(p));
}

/**
 * Derive the high-level traffic channel from the referrer host and UTM params.
 * UTM medium wins when present (explicit campaign tagging), then we fall back to
 * referrer-host heuristics, then Direct when there's no referrer.
 *
 * `selfHosts` are the hosts that count as "us" (the configured site host + the origin
 * that actually sent the beacon, so localhost dev and prod both treat internal
 * navigation as Direct rather than Referral).
 */
export function classifyChannel(opts: {
  referrerHost: string | null;
  utmMedium?: string | null;
  selfHosts?: (string | null | undefined)[];
}): TrafficChannel {
  const { referrerHost, utmMedium, selfHosts } = opts;

  const medium = (utmMedium || "").toLowerCase();
  if (medium) {
    if (medium.includes("organic") || medium.includes("search")) return "Organic Search";
    if (medium.includes("social")) return "Social";
    if (medium === "referral") return "Referral";
    // cpc/email/affiliate/etc. are paid/known referrals from our POV
    return "Referral";
  }

  if (!referrerHost) return "Direct";

  // Same-site navigation isn't a new acquisition source; treat as Direct.
  const selfSet = new Set(
    (selfHosts || [])
      .filter((h): h is string => !!h)
      .map((h) => h.replace(/^www\./, "").toLowerCase())
  );
  if (selfSet.has(referrerHost)) return "Direct";

  if (SEARCH_HOSTS.some((h) => referrerHost.includes(h))) return "Organic Search";
  if (SOCIAL_HOSTS.some((h) => referrerHost.includes(h))) return "Social";
  return "Referral";
}
