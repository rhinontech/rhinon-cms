import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Fixed-window, in-memory rate limiter.
 *
 * No dependency on purpose: the API runs as a single pm2 process per
 * environment, so a Map is enough. If this ever runs as several processes the
 * counters become per-process — multiply the limits by the instance count, or
 * move the store to Redis — it fails open by being looser, never by blocking
 * legitimate users.
 *
 * Keyed on req.ip, which is the real client address only because app.ts sets
 * `trust proxy` for the single nginx hop in front of us. Do not key on a raw
 * X-Forwarded-For header: the first entry is whatever the client chose to send.
 */
interface Options {
  /** Shown in logs, and part of the key so limiters do not share counters. */
  name: string;
  windowMs: number;
  max: number;
  /** Extra discriminator, e.g. the email being logged into. */
  key?: (req: Request) => string | undefined;
  message?: string;
}

const hits = new Map<string, { count: number; resetAt: number }>();

// Expired windows are swept on a timer so the Map cannot grow without bound
// under a scan from many addresses.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
}, 60_000).unref();

export function rateLimit(opts: Options): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const extra = opts.key?.(req);
    const key = `${opts.name}|${req.ip}${extra ? `|${extra}` : ""}`;
    const now = Date.now();

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    const remaining = Math.max(0, opts.max - entry.count);
    res.setHeader("RateLimit-Limit", String(opts.max));
    res.setHeader("RateLimit-Remaining", String(remaining));

    if (entry.count > opts.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ message: opts.message || "Too many requests. Please try again later." });
      return;
    }
    next();
  };
}

/** Baseline response headers for an API that serves JSON and a couple of tiny HTML pages. */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"); // public CMS API is read cross-origin
  next();
}

const minute = 60_000;
const hour = 60 * minute;

const emailOf = (req: Request) => {
  const v = req.body?.email ?? req.body?.personalEmail;
  return typeof v === "string" ? v.trim().toLowerCase().slice(0, 254) : undefined;
};

/** Login: tight per (IP, account) to stop guessing one password, looser per IP overall. */
export const loginLimiters = [
  rateLimit({ name: "login-account", windowMs: 15 * minute, max: 8, key: emailOf, message: "Too many sign-in attempts. Try again in a few minutes." }),
  rateLimit({ name: "login-ip", windowMs: 15 * minute, max: 60, message: "Too many sign-in attempts. Try again in a few minutes." }),
];

/** Workspace creation — each signup provisions roles, stages and an SES identity. */
export const signupLimiters = [
  rateLimit({ name: "signup-ip", windowMs: hour, max: Number(process.env.RATE_LIMIT_SIGNUP_MAX) || 5, message: "Too many workspaces created from this network. Try again later." }),
];

/** Anything that sends an email or checks a one-time token. */
export const emailFlowLimiter = rateLimit({ name: "email-flow", windowMs: hour, max: 10, key: emailOf });
export const tokenLimiter = rateLimit({ name: "token", windowMs: 15 * minute, max: 30 });
