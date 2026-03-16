import crypto from "crypto";
import { decodeSession, SESSION_COOKIE } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

const MOBILE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.MOBILE_AUTH_SECRET || process.env.NEXTAUTH_SECRET || "rhinon-mobile-dev-secret";
}

function toBase64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url<T>(input: string): T | null {
  try {
    return JSON.parse(Buffer.from(input, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function parseCookies(raw: string | null) {
  if (!raw) return new Map<string, string>();
  return new Map(
    raw
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

export function issueMobileToken(user: SessionUser) {
  const payload = toBase64Url(
    JSON.stringify({
      user,
      exp: Date.now() + MOBILE_TOKEN_TTL_MS,
    })
  );

  return `${payload}.${sign(payload)}`;
}

export function verifyMobileToken(token: string): SessionUser | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;

  const decoded = fromBase64Url<{ user: SessionUser; exp: number }>(payload);
  if (!decoded || !decoded.user || !decoded.exp) return null;
  if (Date.now() > decoded.exp) return null;

  return decoded.user;
}

export function getRequestUser(req: Request): SessionUser | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerUser = verifyMobileToken(authHeader.slice("Bearer ".length));
    if (bearerUser) return bearerUser;
  }

  const cookies = parseCookies(req.headers.get("cookie"));
  const session = cookies.get(SESSION_COOKIE);
  return session ? decodeSession(session) : null;
}
