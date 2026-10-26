/**
 * Checks whether a mailbox exists WITHOUT sending it anything, through Abstract's
 * Email Reputation API (it talks to the receiving mail server for us — EC2 can't,
 * port 25 is blocked). Used by the Lead Finder to confirm guessed addresses.
 *
 *   verified — the mail server accepts this exact mailbox
 *   invalid  — the mail server says it doesn't exist
 *   catchall — the domain accepts every address, so "accepted" proves nothing
 *   unknown  — couldn't tell (server didn't answer, quota, timeout)
 *
 * Env: ABSTRACT_API_KEY (an Email Reputation key). Free plan: ~1 request/second,
 * a monthly quota — so calls are queued one at a time and answers cached a day.
 * ZEROBOUNCE_API_KEY, when set, answers whenever Abstract can't (quota spent,
 * no key, no clear answer), which roughly doubles the free checks a month.
 */

export type VerifyStatus = "verified" | "invalid" | "catchall" | "unknown";

export interface VerifyResult {
  email: string;
  status: VerifyStatus;
  /** Abstract's 0–1 quality score, when it gave one. */
  score: number | null;
  detail: string | null;
}

const ENDPOINT = "https://emailreputation.abstractapi.com/v1/";
const CACHE_MS = 24 * 60 * 60 * 1000;
const MIN_GAP_MS = 1100; // free plan: one request per second

const cache = new Map<string, { at: number; result: VerifyResult }>();
let queue: Promise<unknown> = Promise.resolve();
let lastCall = 0;

export const verifierConfigured = () => Boolean(process.env.ABSTRACT_API_KEY || process.env.ZEROBOUNCE_API_KEY);

/** One request at a time, at most one a second, whoever is asking. */
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastCall + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    return fn();
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function verifyEmail(raw: string): Promise<VerifyResult> {
  const email = raw.trim().toLowerCase();
  const hit = cache.get(email);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.result;

  let result = await abstractCheck(email);
  if (result.status === "unknown" && process.env.ZEROBOUNCE_API_KEY) {
    const zb = await zeroBounceCheck(email, process.env.ZEROBOUNCE_API_KEY);
    if (zb.status !== "unknown" || !process.env.ABSTRACT_API_KEY) result = zb;
  }

  // Don't cache "unknown": the next try may get a real answer.
  if (result.status !== "unknown") cache.set(email, { at: Date.now(), result });
  return result;
}

async function abstractCheck(email: string): Promise<VerifyResult> {
  const key = process.env.ABSTRACT_API_KEY;
  if (!key) return { email, status: "unknown", score: null, detail: "Email checking isn't set up (ABSTRACT_API_KEY)." };

  return throttled(async (): Promise<VerifyResult> => {
    try {
      const res = await fetch(`${ENDPOINT}?api_key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}`, {
        signal: AbortSignal.timeout(25_000),
      });
      const d = (await res.json().catch(() => ({}))) as any;
      if (!res.ok || d?.error) {
        const msg = d?.error?.message || `HTTP ${res.status}`;
        return { email, status: "unknown", score: null, detail: /quota|limit|credits/i.test(msg) ? "Monthly check limit reached." : msg };
      }
      const deliverability = d.email_deliverability ?? {};
      const quality = d.email_quality ?? {};
      const score = typeof quality.score === "number" ? quality.score : null;
      const detail = deliverability.status_detail ?? null;
      if (quality.is_catchall) return { email, status: "catchall", score, detail: "The domain accepts every address." };
      if (deliverability.status === "deliverable" && deliverability.is_smtp_valid) return { email, status: "verified", score, detail };
      if (deliverability.status === "undeliverable") return { email, status: "invalid", score, detail };
      return { email, status: "unknown", score, detail };
    } catch (err: any) {
      return { email, status: "unknown", score: null, detail: err?.name === "TimeoutError" ? "The mail server didn't answer in time." : "Check failed." };
    }
  });
}

/** ZeroBounce: valid / invalid / catch-all / unknown (+ spamtrap, abuse, do_not_mail → treated as invalid). */
async function zeroBounceCheck(email: string, key: string): Promise<VerifyResult> {
  try {
    const res = await fetch(
      `https://api.zerobounce.net/v2/validate?api_key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}&ip_address=`,
      { signal: AbortSignal.timeout(25_000) }
    );
    const d = (await res.json().catch(() => ({}))) as any;
    if (!res.ok || d?.error) {
      const msg = String(d?.error || `HTTP ${res.status}`);
      return { email, status: "unknown", score: null, detail: /credit/i.test(msg) ? "Monthly check limit reached." : msg };
    }
    const detail = d.sub_status || d.status || null;
    switch (d.status) {
      case "valid":
        return { email, status: "verified", score: null, detail };
      case "catch-all":
        return { email, status: "catchall", score: null, detail: "The domain accepts every address." };
      case "invalid":
      case "spamtrap":
      case "abuse":
      case "do_not_mail":
        return { email, status: "invalid", score: null, detail };
      default:
        return { email, status: "unknown", score: null, detail };
    }
  } catch (err: any) {
    return { email, status: "unknown", score: null, detail: err?.name === "TimeoutError" ? "The mail server didn't answer in time." : "Check failed." };
  }
}

/**
 * Tries a person's addresses in order and stops at the first verified one.
 * A catch-all domain answers "yes" to everything, so it stops there too —
 * further checks would only spend quota.
 */
export async function verifyFirstWorking(emails: string[]): Promise<{ best: VerifyResult | null; tried: VerifyResult[] }> {
  const tried: VerifyResult[] = [];
  for (const email of [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))].slice(0, 5)) {
    const r = await verifyEmail(email);
    tried.push(r);
    if (r.status === "verified" || r.status === "catchall") return { best: r, tried };
    if (r.status === "unknown" && /limit|set up/i.test(r.detail ?? "")) break; // no point trying the rest
  }
  return { best: null, tried };
}
