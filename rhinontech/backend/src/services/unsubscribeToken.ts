import crypto from "crypto";
import { env } from "../config/env";
import { currentOrganizationId } from "./tenantContext";

/**
 * Signed one-click unsubscribe links (RFC 8058).
 *
 * The List-Unsubscribe URL is hit by the receiving mail provider, not by the
 * recipient's browser, so it carries no session and no CSRF token. Without a
 * signature anyone could POST arbitrary addresses and silently suppress a
 * competitor's entire list, so the address is HMAC'd and the endpoint refuses
 * anything that does not verify.
 *
 * The signature also covers the ORGANIZATION that sent the mail. Suppression is
 * per workspace: someone opting out of one company's mail has said nothing about
 * another's, and recording the opt-out against the wrong workspace would leave
 * the sender free to mail them again. Links minted before workspaces existed
 * carry no org and keep verifying against the bare address (they belong to the
 * platform workspace).
 */
const SECRET = process.env.UNSUBSCRIBE_SECRET || env.jwtSecret;

export function signUnsubscribe(email: string, organizationId?: string | null): string {
  const address = email.trim().toLowerCase();
  return crypto
    .createHmac("sha256", SECRET)
    .update(organizationId ? `${organizationId}:${address}` : address)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyUnsubscribe(email: string, token: string, organizationId?: string | null): boolean {
  if (!email || !token) return false;
  const expected = signUnsubscribe(email, organizationId);
  // Lengths are fixed, but compare in constant time regardless.
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function query(email: string, organizationId: string | null): string {
  const address = email.trim().toLowerCase();
  const org = organizationId ? `&o=${encodeURIComponent(organizationId)}` : "";
  return `email=${encodeURIComponent(address)}${org}&t=${signUnsubscribe(address, organizationId)}`;
}

const apiBase = () => process.env.PUBLIC_API_URL || "https://api.rhinontech.in";

/** The URL mail providers POST to when the recipient clicks "Unsubscribe". */
export function oneClickUnsubscribeUrl(email: string, organizationId: string | null = currentOrganizationId()): string {
  return `${apiBase()}/public/unsubscribe/one-click?${query(email, organizationId)}`;
}

/**
 * The link a person clicks in the footer. Served by the API itself as a small
 * neutral page, so a workspace's recipients are never sent to another
 * company's website to opt out.
 */
export function unsubscribePageUrl(email: string, organizationId: string | null = currentOrganizationId()): string {
  return `${apiBase()}/public/unsubscribe/page?${query(email, organizationId)}`;
}
