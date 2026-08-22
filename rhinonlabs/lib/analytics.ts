// First-party, cookieless pageview tracking for rhinonlabs.
// Sends anonymous pageviews to the Rhinon Tech backend (POST /public/track), which the
// admin-panel Analytics module reads. No PII, no cross-site cookies — just two random ids
// kept in this browser to count unique visitors and sessions.
import { API_BASE } from "./api";

const VISITOR_KEY = "rl_vid"; // localStorage — stable per browser
const SESSION_KEY = "rl_sid"; // sessionStorage — resets each browsing session

function uuid(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getOrCreate(storage: Storage, key: string): string {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const id = uuid();
    storage.setItem(key, id);
    return id;
  } catch {
    // Storage blocked (private mode / consent tooling) — fall back to an ephemeral id.
    return uuid();
  }
}

interface PageviewPayload {
  visitorId: string;
  sessionId: string;
  path: string;
  title?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

function send(payload: PageviewPayload) {
  const url = `${API_BASE}/public/track`;
  const body = JSON.stringify(payload);

  // Primary: fetch with keepalive so it survives a quick navigation. CORS is already
  // configured for the rhinonlabs origin on the backend.
  try {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      mode: "cors",
    }).catch(() => fallbackBeacon(url, body));
  } catch {
    fallbackBeacon(url, body);
  }
}

// Fallback uses sendBeacon with a text/plain blob (a CORS-safelisted content type, so no
// preflight is needed). The backend's /track route parses text/plain bodies as JSON.
function fallbackBeacon(url: string, body: string) {
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "text/plain" }));
    }
  } catch {
    /* give up silently — analytics must never break the page */
  }
}

export function trackPageview(path: string) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const utm = (k: string) => params.get(k) || undefined;

  send({
    visitorId: getOrCreate(window.localStorage, VISITOR_KEY),
    sessionId: getOrCreate(window.sessionStorage, SESSION_KEY),
    path,
    title: document.title || undefined,
    referrer: document.referrer || undefined,
    utmSource: utm("utm_source"),
    utmMedium: utm("utm_medium"),
    utmCampaign: utm("utm_campaign"),
    utmTerm: utm("utm_term"),
    utmContent: utm("utm_content"),
  });
}

// Captures email from query params (e.g. ?email=...) and sends to backend for IP & Location tracking
export function trackEmailVisitor(email: string, path: string) {
  if (typeof window === "undefined" || !email) return;

  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return;

  const url = `${API_BASE}/public/visitors`;
  const body = JSON.stringify({
    email: cleanEmail,
    path,
    referrer: document.referrer || undefined,
  });

  try {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      mode: "cors",
    }).catch(() => fallbackBeacon(url, body));
  } catch {
    fallbackBeacon(url, body);
  }
}
