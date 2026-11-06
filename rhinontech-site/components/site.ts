/** This marketing site. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rhinontech.com";

/** Where sign-up and sign-in live: the dashboard, on rhinontech.in. */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rhinontech.in";

/**
 * The Rhinon backend that books calls and stores enquiries. Development defaults to a local
 * backend so a test submission can never book a real slot or create a real lead.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "production" ? "https://api.rhinontech.in" : "http://localhost:5002");

/** The brand these forms file leads under in the CRM (falls back to the default brand if absent). */
export const BRAND_SLUG = "rhinontech";

export const links = {
  signup: `${APP_URL}/auth/signup`,
  login: `${APP_URL}/auth/login`,
  labs: "https://www.rhinonlabs.com",
  call: "/demo",
  privacy: "https://www.rhinonlabs.com/privacy-terms",
  contact: "/contact",
};
