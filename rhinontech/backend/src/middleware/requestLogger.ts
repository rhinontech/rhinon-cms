import { NextFunction, Response } from "express";
import type { AuthRequest } from "./authenticate";

/**
 * Zero-dependency HTTP request logger.
 *
 * One line per request on completion, so the status and duration are real rather
 * than guessed at dispatch time:
 *
 *   POST   200  1.4s   /campaigns/a1b2/process        prabhat · {"postType":"FRAMEWORK"}
 *   GET    304   12ms  /campaigns                     prabhat
 *   POST   400   3ms   /campaigns/a1b2/process        prabhat ← Pick one of the five post types...
 *
 * Controlled by env:
 *   LOG_REQUESTS=off      disable entirely (default: on)
 *   LOG_BODY=on|off       request bodies (default: on in local dev/test, off everywhere else)
 *   LOG_SKIP=/health,/x   extra path prefixes to mute, comma-separated
 *   LOG_SLOW_MS=1000      threshold above which the duration is highlighted (default 1000)
 */

import { isDevOrTest } from "../config/env";
import crypto from "crypto";

const isProd = process.env.NODE_ENV === "production";
const enabled = (process.env.LOG_REQUESTS || "on").toLowerCase() !== "off";
// Bodies carry employee, payroll and customer data, so they are logged only in local
// development. NODE_ENV is not reliably set on our servers, so "not production" is
// the wrong test here — anything that is not explicitly dev/test counts as live.
const logBody = (process.env.LOG_BODY || (isDevOrTest ? "on" : "off")).toLowerCase() !== "off";
const slowMs = parseInt(process.env.LOG_SLOW_MS || "1000", 10);

// Colour only when a human is watching — piped output (pm2 logs, files) stays clean.
const color = !isProd && process.stdout.isTTY;
const c = (code: string, s: string) => (color ? `\x1b[${code}m${s}\x1b[0m` : s);
const dim = (s: string) => c("2", s);
const bold = (s: string) => c("1", s);

/**
 * High-frequency endpoints that would drown the useful lines. The tracking pixel
 * fires on every marketing email open and /health on every load-balancer probe.
 */
const DEFAULT_SKIP = ["/health", "/public/track"];
const skipPrefixes = [
  ...DEFAULT_SKIP,
  ...(process.env.LOG_SKIP || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
];

/** Never print these, at any nesting depth — they end up in scrollback and log files. */
const SECRET_KEYS =
  /^(password|newPassword|currentPassword|confirmPassword|token|accessToken|refreshToken|apiKey|api_key|secret|clientSecret|authorization|jwt|otp|resetToken|signature|code|mfaToken|recoveryCode|confirmSlug|t)$/i;

/** Fields that are legitimately huge and never worth reading inline. */
const BULKY_KEYS = /^(image|imageData|base64|file|fileData|content|html|pdf|buffer|websiteText|mediaData)$/i;

function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 4) return "…";

  if (typeof value === "string") {
    if (value.startsWith("data:")) return `<data-uri ${value.length}b>`;
    return value.length > 120 ? `${value.slice(0, 120)}…(${value.length}b)` : value;
  }
  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    if (value.length > 5) return [...value.slice(0, 5).map((v) => redact(v, depth + 1)), `…+${value.length - 5} more`];
    return value.map((v) => redact(v, depth + 1));
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEYS.test(k)) out[k] = "***";
    else if (BULKY_KEYS.test(k) && typeof v === "string") out[k] = `<${k} ${v.length}b>`;
    else out[k] = redact(v, depth + 1);
  }
  return out;
}

function formatBody(body: unknown): string {
  if (!body || typeof body !== "object" || Object.keys(body).length === 0) return "";
  try {
    const json = JSON.stringify(redact(body));
    return json.length > 300 ? `${json.slice(0, 300)}…` : json;
  } catch {
    return "<unserialisable body>";
  }
}

function statusColor(status: number): string {
  if (status >= 500) return "31"; // red
  if (status >= 400) return "33"; // yellow
  if (status >= 300) return "36"; // cyan
  return "32"; // green
}

function methodColor(method: string): string {
  switch (method) {
    case "GET":
      return "36";
    case "POST":
      return "32";
    case "PUT":
    case "PATCH":
      return "33";
    case "DELETE":
      return "31";
    default:
      return "37";
  }
}

function formatDuration(ms: number): string {
  const text = ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
  const padded = text.padStart(6);
  return ms >= slowMs ? c("33", padded) : dim(padded);
}

/**
 * Gives every request an id, echoes it in the `X-Request-Id` response header and
 * shows it in the log line. When a customer reports a failure, the id from their
 * browser's network tab finds the exact line — no guessing by time and user.
 * A caller-supplied id (from nginx or a client) is kept if it is well-formed.
 */
export function requestId(req: AuthRequest, res: Response, next: NextFunction) {
  const incoming = req.headers["x-request-id"];
  const id = typeof incoming === "string" && /^[\w-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
  (req as any).id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

/** Secrets that travel in query strings (verification and unsubscribe links). */
const redactQuery = (q: string) => q.replace(/([?&](?:token|t|key|secret|code)=)[^&]*/gi, "$1***");

export function requestLogger(req: AuthRequest, res: Response, next: NextFunction) {
  if (!enabled || skipPrefixes.some((p) => req.path.startsWith(p))) return next();

  const started = process.hrtime.bigint();
  // Captured up front: a route handler may mutate req.body before we log.
  const bodyText = logBody && req.method !== "GET" ? formatBody(req.body) : "";

  // Capture the response payload only when it turns out to be an error — that is
  // the message you actually want when a request fails, and it saves re-running
  // the call with a breakpoint.
  const originalJson = res.json.bind(res);
  let errorMessage = "";
  res.json = (payload: any) => {
    if (res.statusCode >= 400 && payload && typeof payload === "object") {
      errorMessage = String(payload.message || payload.error || "").slice(0, 200);
    }
    return originalJson(payload);
  };

  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const query = req.originalUrl.includes("?") ? dim(redactQuery(req.originalUrl.slice(req.originalUrl.indexOf("?")))) : "";

    const parts = [
      dim(String((req as any).id ?? "").slice(0, 8)),
      c(methodColor(req.method), req.method.padEnd(6)),
      c(statusColor(res.statusCode), bold(String(res.statusCode))),
      formatDuration(ms),
      `${req.path}${query}`,
    ];

    // Identity comes from authenticate(), so it is only present once that ran.
    const who = req.user ? dim(` ${req.user.fullName.split(" ")[0]}·${req.user.roleSlug}`) : "";
    const suffix = errorMessage
      ? ` ${c(statusColor(res.statusCode), "←")} ${errorMessage}`
      : bodyText
        ? ` ${dim(bodyText)}`
        : "";

    console.log(`${parts.join(" ")}${who}${suffix}`);
  });

  next();
}
