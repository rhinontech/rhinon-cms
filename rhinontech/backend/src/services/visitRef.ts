import crypto from "crypto";

import { env } from "../config/env";
import { Site } from "../models";

/**
 * Personalised links in campaign email, so a visit to our website can be tied
 * to the lead who clicked.
 *
 * The link carries an opaque code, never the email address: an address in a
 * URL ends up in the browser's history, server logs, analytics and the
 * Referer sent to the next site. The code is the lead id plus an HMAC, so it
 * cannot be guessed or forged into someone else's visit.
 */
const SECRET = process.env.VISIT_REF_SECRET || env.jwtSecret;
const TAG = 8; // bytes of HMAC kept: 64 bits is plenty against forging one link

const mac = (id: Buffer) => crypto.createHmac("sha256", SECRET).update(id).digest().subarray(0, TAG);

/** "r" value for a lead: 24 bytes as 32 URL-safe characters. */
export function signVisitRef(leadId: string): string {
  const id = Buffer.from(leadId.replace(/-/g, ""), "hex");
  return Buffer.concat([id, mac(id)]).toString("base64url");
}

/** The lead id inside a valid code, or null. */
export function verifyVisitRef(ref: unknown): string | null {
  if (typeof ref !== "string" || !/^[A-Za-z0-9_-]{32}$/.test(ref)) return null;
  const raw = Buffer.from(ref, "base64url");
  if (raw.length !== 16 + TAG) return null;
  const id = raw.subarray(0, 16);
  if (!crypto.timingSafeEqual(raw.subarray(16), mac(id))) return null;
  const hex = id.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const hostOf = (value: string) => {
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
};

/**
 * Our own websites: every brand's site plus its tracked domains, so only links
 * to them are personalised. A link to anyone else's site is left exactly as
 * written: the code would mean nothing there and would leak who clicked.
 */
export async function ownWebsiteHosts(): Promise<string[]> {
  const sites = await Site.findAll({ attributes: ["siteUrl", "trackedDomains"] });
  const hosts = new Set<string>();
  // The dashboard itself (rhinontech.in): campaigns link to it to sign people up.
  for (const url of env.frontendUrls) {
    const h = hostOf(url);
    if (h && h !== "localhost" && !/^\d/.test(h)) hosts.add(h);
  }
  for (const s of sites) {
    for (const value of [s.siteUrl, ...(s.trackedDomains ?? [])]) {
      const h = value && hostOf(value);
      if (h) hosts.add(h);
    }
  }
  return [...hosts];
}

/** Adds ?r=<code> to every link in `html` that points at one of `hosts`. */
export function personalizeLinks(html: string, ref: string, hosts: string[]): string {
  if (!hosts.length) return html;
  return html.replace(/(<a\b[^>]*\bhref=")([^"]+)(")/gi, (whole, open: string, href: string, close: string) => {
    const decoded = href.replace(/&amp;/g, "&");
    let url: URL;
    try {
      url = new URL(decoded);
    } catch {
      return whole;
    }
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const ours = hosts.some((h) => host === h || host.endsWith(`.${h}`));
    if (!ours || !/^https?:$/.test(url.protocol) || /unsubscribe/i.test(url.pathname)) return whole;
    url.searchParams.set("r", ref);
    return `${open}${url.toString().replace(/&/g, "&amp;")}${close}`;
  });
}

