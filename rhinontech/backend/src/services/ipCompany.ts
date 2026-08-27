/**
 * Reverse-IP company lookup — the "which companies are on our site" signal.
 *
 * Deliberately resolve-and-discard: the caller hands us a request IP, we return
 * an organisation, and the address itself is never persisted. That keeps the
 * pageview tracker cookieless and consent-free (an IP is personal data under
 * GDPR/DPDP; a company name is not) while still producing the intent signal.
 *
 * No API key configured means this quietly returns null and everything upstream
 * carries on — the feature is additive, never load-bearing.
 */

export interface CompanyHit {
  name: string;
  domain: string | null;
}

const PROVIDER = (process.env.IP_COMPANY_PROVIDER || "ipinfo").toLowerCase();
const API_KEY = process.env.IP_COMPANY_API_KEY || process.env.IPINFO_TOKEN || "";

/** Consumer ISPs resolve for almost every visit and mean nothing as intent. */
const ISP_NOISE = [
  "jio", "airtel", "vodafone", "bsnl", "comcast", "verizon", "at&t", "t-mobile",
  "spectrum", "charter", "cox communications", "bt group", "sky broadband",
  "telecom", "broadband", "cellular", "wireless", "isp", "internet service",
  "amazon technologies", "amazon.com", "google llc", "microsoft corporation",
  "cloudflare", "digitalocean", "linode", "hetzner", "ovh",
];

function looksLikeNoise(name: string): boolean {
  const n = name.toLowerCase();
  return ISP_NOISE.some((bad) => n.includes(bad));
}

// Same office hits the site all day; one lookup per address per hour is plenty.
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 5000;
const cache = new Map<string, { at: number; hit: CompanyHit | null }>();

function cacheGet(ip: string): { hit: CompanyHit | null } | undefined {
  const entry = cache.get(ip);
  if (!entry) return undefined;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(ip);
    return undefined;
  }
  return entry;
}

function cacheSet(ip: string, hit: CompanyHit | null) {
  // Crude bound: drop the oldest insertion when full. Good enough for a cache
  // whose entries all expire within the hour anyway.
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(ip, { at: Date.now(), hit });
}

/** Private, loopback and link-local ranges never resolve to anything useful. */
function isPrivateIp(ip: string): boolean {
  return (
    !ip ||
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("169.254.") ||
    ip.startsWith("fc") ||
    ip.startsWith("fd") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

export function isIpCompanyLookupEnabled(): boolean {
  return Boolean(API_KEY);
}

/** Normalises whatever the request gave us into a bare address. */
export function clientIpFrom(headers: Record<string, any>, fallback?: string): string {
  const forwarded = (headers["x-forwarded-for"] || "").toString();
  const raw = forwarded.split(",")[0].trim() || fallback || "";
  return raw.replace(/^::ffff:/, "").trim();
}

export async function lookupCompanyByIp(ip: string): Promise<CompanyHit | null> {
  if (!API_KEY || !ip || isPrivateIp(ip)) return null;

  const cached = cacheGet(ip);
  if (cached) return cached.hit;

  try {
    // 2.5s ceiling: this runs inside a pageview beacon and must never hold it up.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const url =
      PROVIDER === "ipapi"
        ? `https://pro.ip-api.com/json/${encodeURIComponent(ip)}?key=${API_KEY}&fields=status,org,as`
        : `https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${API_KEY}`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      cacheSet(ip, null);
      return null;
    }

    const data: any = await res.json();

    let name: string | null = null;
    let domain: string | null = null;

    if (PROVIDER === "ipapi") {
      if (data?.status !== "success") { cacheSet(ip, null); return null; }
      name = data.org || null;
    } else {
      // ipinfo: the paid company object when available, else the ASN org string
      // (which carries a leading "AS#####" that is not part of the name).
      name = data?.company?.name || data?.org || null;
      domain = data?.company?.domain || null;
      if (name) name = name.replace(/^AS\d+\s+/i, "").trim();
    }

    if (!name || looksLikeNoise(name)) {
      cacheSet(ip, null);
      return null;
    }

    const hit: CompanyHit = { name, domain: domain || null };
    cacheSet(ip, hit);
    return hit;
  } catch {
    // Timeouts and provider outages are non-events for an additive signal.
    cacheSet(ip, null);
    return null;
  }
}
