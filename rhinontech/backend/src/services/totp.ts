import crypto from "crypto";
import { env } from "../config/env";

/**
 * Time-based one-time passwords (RFC 6238) for two-factor sign-in.
 *
 * Implemented directly on node:crypto — HMAC-SHA1, 6 digits, 30-second steps,
 * exactly what Google Authenticator, Authy and 1Password expect — so there is no
 * dependency to vet. The shared secret is encrypted at rest with AES-256-GCM
 * under MFA_ENCRYPTION_KEY (or a key derived from JWT_SECRET), so a database dump
 * alone does not hand over anyone's second factor.
 */
const STEP_SECONDS = 30;
const DIGITS = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Buffer {
  let bits = 0, value = 0;
  const bytes: number[] = [];
  for (const ch of text.replace(/=+$/, "").toUpperCase()) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error("Invalid base32 character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateSecret(): string {
  return base32Encode(crypto.randomBytes(20)); // 160 bits, the RFC's recommended size
}

export const stepFor = (time = Date.now()) => Math.floor(time / 1000 / STEP_SECONDS);

export function codeAt(secretBase32: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac("sha1", base32Decode(secretBase32)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/**
 * Checks a submitted code against the current step and one either side (clock
 * drift between phone and server). Returns the matching step so the caller can
 * refuse to accept the same step twice, or null.
 */
export function verifyCode(secretBase32: string, submitted: string, lastUsedStep: number | null = null, now = Date.now()): number | null {
  const code = String(submitted || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(code)) return null;
  const current = stepFor(now);
  for (const step of [current, current - 1, current + 1]) {
    if (lastUsedStep !== null && step <= lastUsedStep) continue; // replay
    const expected = Buffer.from(codeAt(secretBase32, step));
    const given = Buffer.from(code);
    if (expected.length === given.length && crypto.timingSafeEqual(expected, given)) return step;
  }
  return null;
}

export function otpauthUrl(secretBase32: string, account: string, issuer: string): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;
}

// ── secret at rest ──────────────────────────────────────────────────────────
const KEY = crypto
  .createHash("sha256")
  .update(process.env.MFA_ENCRYPTION_KEY || `totp-at-rest:${env.jwtSecret}`)
  .digest();

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), enc.toString("base64")].join(":");
}

export function decryptSecret(stored: string): string {
  const [version, iv, tag, data] = stored.split(":");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unrecognised secret format");
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

// ── recovery codes ──────────────────────────────────────────────────────────
const hashCode = (code: string) => crypto.createHash("sha256").update(code.replace(/-/g, "").toLowerCase()).digest("hex");

/** Eight single-use codes like `a1b2c-3d4e5`. Shown once; only hashes are stored. */
export function generateRecoveryCodes(count = 8): { codes: string[]; hashes: string[] } {
  const codes = Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(5).toString("hex");
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
  return { codes, hashes: codes.map(hashCode) };
}

/** Returns the remaining hashes if `submitted` matches one (which is consumed), else null. */
export function consumeRecoveryCode(hashes: string[] | null, submitted: string): string[] | null {
  const want = hashCode(String(submitted || ""));
  const idx = (hashes ?? []).indexOf(want);
  if (idx < 0) return null;
  return (hashes ?? []).filter((_, i) => i !== idx);
}

// ── guessing protection ─────────────────────────────────────────────────────
// A six-digit code has a million values; without a cap an attacker holding the
// password could simply try them. Five misses locks that account's second-factor
// step for 15 minutes. In memory, like the rate limiter — per process.
const misses = new Map<string, { count: number; until: number }>();
const MAX_MISSES = 5;
const LOCK_MS = 15 * 60_000;

export function mfaLocked(userId: string): boolean {
  const m = misses.get(userId);
  return !!m && m.count >= MAX_MISSES && m.until > Date.now();
}
export function mfaMiss(userId: string) {
  const m = misses.get(userId);
  const fresh = !m || m.until <= Date.now();
  misses.set(userId, { count: fresh ? 1 : m!.count + 1, until: Date.now() + LOCK_MS });
}
export function mfaClear(userId: string) {
  misses.delete(userId);
}
