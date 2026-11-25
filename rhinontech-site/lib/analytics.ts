/**
 * Conversion events for Google Tag Manager (GTM-T8G5PP3T). Each call pushes a dataLayer
 * event; GTM turns it into a GA4 event. The GA4 event tags and the "Custom Event" triggers
 * live in the GTM container, not here (see docs/RHINONTECH_WEBSITE_REVAMP.md §7.6).
 *
 * Event names are the contract with GTM: rename one here and its tag stops firing.
 */
export type ConversionEvent =
  | "signup_cta_click" // a "Get started free" button opened the sign-up form
  | "signup_lead_submitted" // the sign-up form saved a lead and is sending the visitor to sign up
  | "contact_submitted" // the /contact form succeeded
  | "demo_booked" // the /demo scheduler confirmed a slot or recorded a request
  | "tool_used" // a free tool (e.g. the AI email writer) produced a result
  | "tool_signup"; // a visitor signed up from a free tool

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Fire-and-forget. Safe in development and when GTM is blocked: the push just goes nowhere. */
export function track(event: ConversionEvent, params: Params = {}): void {
  if (typeof window === "undefined") return;
  (window.dataLayer ||= []).push({ event, page_path: window.location.pathname, ...params });
}

/**
 * For events followed by a full-page navigation: waits until GTM reports the tags have run
 * (eventCallback), but never longer than `maxWaitMs`, so a blocked or slow GTM can't strand
 * the visitor.
 */
export function trackThen(event: ConversionEvent, params: Params, next: () => void, maxWaitMs = 400): void {
  if (typeof window === "undefined") return next();
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    next();
  };
  (window.dataLayer ||= []).push({ event, page_path: window.location.pathname, ...params, eventCallback: go, eventTimeout: maxWaitMs });
  window.setTimeout(go, maxWaitMs + 50);
}
