import crypto from "crypto";
import { env } from "../config/env";
import { Organization } from "../models/Organization";
import { currentOrganizationId, runAsSystem } from "./tenantContext";
import { sendEmail } from "./mailer";
import { verifyEmailEmail } from "./emailTemplates";
import { transactionalBrand } from "./companyProfile";

/**
 * Workspace-owner email verification.
 *
 * Stateless: the link carries `<userId>.<expiry>.<hmac>`, so there is no token
 * table to clean up and a link cannot be replayed against another user. Clicking
 * it clears `settings.pendingEmailVerification` on the owner's organization —
 * the flag outbound sending checks before it will mail anyone.
 */
const TTL_MS = 48 * 60 * 60 * 1000;
const KEY = crypto.createHash("sha256").update(`email-verify:${env.jwtSecret}`).digest();

const sign = (payload: string) => crypto.createHmac("sha256", KEY).update(payload).digest("base64url");

export function signVerifyToken(userId: string, ttlMs = TTL_MS): string {
  const payload = `${userId}.${Date.now() + ttlMs}`;
  return `${payload}.${sign(payload)}`;
}

export function readVerifyToken(token: string): { userId: string } | null {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [userId, expiry, sig] = parts;
  const expected = sign(`${userId}.${expiry}`);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (!Number(expiry) || Number(expiry) < Date.now()) return null;
  return { userId };
}

const apiBase = () => process.env.PUBLIC_API_URL || "https://api.rhinontech.in";

export async function sendVerificationEmail(user: { id: string; fullName: string; personalEmail: string }, organizationId: string, workspaceName: string) {
  const verifyUrl = `${apiBase()}/auth/verify-email?token=${encodeURIComponent(signVerifyToken(user.id))}`;
  const { subject, html, text } = verifyEmailEmail({
    brand: await transactionalBrand(organizationId),
    fullName: user.fullName,
    verifyUrl,
    workspaceName,
  });
  await sendEmail({ to: user.personalEmail, subject, html, text });
}

/**
 * Why the current workspace may not send outreach/automation mail right now, or
 * null if it may. Account mail (password resets, invites) is deliberately NOT
 * gated — a user locked out of a password reset cannot verify anything.
 */
export async function outboundBlockedReason(organizationId: string | null = currentOrganizationId()): Promise<string | null> {
  if (!organizationId) return null;
  const org = await runAsSystem("outbound-gate", () => Organization.findByPk(organizationId, { attributes: ["id", "settings"] }));
  return org?.settings?.pendingEmailVerification
    ? "Confirm your email address to start sending. Check your inbox for the verification link."
    : null;
}
