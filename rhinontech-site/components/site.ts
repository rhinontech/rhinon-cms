/** This marketing site. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rhinontech.com";

/** Where sign-up and sign-in live: the dashboard, on rhinontech.in. */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rhinontech.in";

export const links = {
  signup: `${APP_URL}/auth/signup`,
  login: `${APP_URL}/auth/login`,
  labs: "https://www.rhinonlabs.com",
  call: "https://www.rhinonlabs.com/schedule-call",
  privacy: "https://www.rhinonlabs.com/privacy-terms",
  contact: "https://www.rhinonlabs.com/contact-us",
};
