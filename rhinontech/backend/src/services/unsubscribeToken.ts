import crypto from "crypto";
import { env } from "../config/env";

/**
 * Signed one-click unsubscribe links (RFC 8058).
 *
 * The List-Unsubscribe URL is hit by the receiving mail provider, not by the
 * recipient's browser, so it carries no session and no CSRF token. Without a
 * signature anyone could POST arbitrary addresses and silently suppress a
 * competitor's entire list, so the address is HMAC'd and the endpoint refuses
 * anything that does not verify.
 */
const SECRET = process.env.UNSUBSCRIBE_SECRET || env.jwtSecret;

export function signUnsubscribe(email: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(email.trim().toLowerCase())
    .digest("base64url")
    .slice(0, 32);
}

export function verifyUnsubscribe(email: string, token: string): boolean {
  if (!email || !token) return false;
  const expected = signUnsubscribe(email);
  // Lengths are fixed, but compare in constant time regardless.
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** The URL mail providers POST to when the recipient clicks "Unsubscribe". */
export function oneClickUnsubscribeUrl(email: string): string {
  const base = process.env.PUBLIC_API_URL || "https://api.rhinontech.in";
  const address = email.trim().toLowerCase();
  return `${base}/public/unsubscribe/one-click?email=${encodeURIComponent(address)}&t=${signUnsubscribe(address)}`;
}
