import { Request } from "express";

export interface GeoLocationResult {
  ip: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export function extractClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  const sockIp = req.socket?.remoteAddress || req.ip || "127.0.0.1";
  // Remove IPv6-mapped IPv4 prefix (e.g. ::ffff:127.0.0.1 -> 127.0.0.1)
  return sockIp.replace(/^::ffff:/, "");
}

export function isPrivateOrLocalIp(ip: string): boolean {
  const cleanIp = ip.trim();
  if (
    cleanIp === "127.0.0.1" ||
    cleanIp === "::1" ||
    cleanIp === "localhost" ||
    cleanIp === "0.0.0.0"
  ) {
    return true;
  }
  // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  if (
    cleanIp.startsWith("10.") ||
    cleanIp.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(cleanIp)
  ) {
    return true;
  }
  return false;
}

export async function lookupIpLocation(ip: string): Promise<GeoLocationResult> {
  const cleanIp = ip.trim().replace(/^::ffff:/, "");

  if (isPrivateOrLocalIp(cleanIp)) {
    return {
      ip: cleanIp,
      city: "Localhost",
      region: "Development",
      country: "Local",
      location: "Localhost / Dev",
      latitude: null,
      longitude: null,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,message,country,regionName,city,lat,lon`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { ip: cleanIp, location: null };
    }

    const data = (await res.json()) as any;
    if (data.status === "success") {
      const city = data.city || null;
      const region = data.regionName || null;
      const country = data.country || null;
      const locationParts = [city, region, country].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(", ") : null;

      return {
        ip: cleanIp,
        city,
        region,
        country,
        location,
        latitude: typeof data.lat === "number" ? data.lat : null,
        longitude: typeof data.lon === "number" ? data.lon : null,
      };
    }

    return { ip: cleanIp, location: null };
  } catch (err) {
    console.error(`Geolocation lookup failed for IP ${cleanIp}:`, err);
    return { ip: cleanIp, location: null };
  }
}


// ---------------------------------------------------------------------------
// Cached lookup for pageview tracking.
//
// Every pageview would otherwise be one ip-api call, and the free tier allows
// ~45/minute for the whole server. One visitor reading five pages is one IP, so
// caching by IP collapses almost all of that traffic. Entries are held in memory
// only — a restart just re-warms the cache.
// ---------------------------------------------------------------------------

interface CacheEntry {
  value: GeoLocationResult;
  expiresAt: number;
}

const GEO_CACHE = new Map<string, CacheEntry>();
const GEO_TTL_MS = 24 * 60 * 60 * 1000; // an IP's city does not move meaningfully within a day
const GEO_CACHE_MAX = 5000;

/**
 * lookupIpLocation with an in-memory TTL cache.
 *
 * Returns null rather than throwing when the lookup fails or is rate-limited, so a
 * tracking beacon never fails because geolocation did.
 */
export async function lookupIpLocationCached(ip: string): Promise<GeoLocationResult | null> {
  const key = ip.trim().replace(/^::ffff:/, "");
  if (!key) return null;

  const hit = GEO_CACHE.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  try {
    const value = await lookupIpLocation(key);

    // Cheapest eviction that keeps the map bounded: drop the oldest inserted key.
    if (GEO_CACHE.size >= GEO_CACHE_MAX) {
      const oldest = GEO_CACHE.keys().next().value;
      if (oldest) GEO_CACHE.delete(oldest);
    }
    GEO_CACHE.set(key, { value, expiresAt: Date.now() + GEO_TTL_MS });
    return value;
  } catch {
    return null;
  }
}
