/** Where sign-up and sign-in live: the dashboard, on its own subdomain. */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.rhinontech.in";

export const links = {
  signup: `${APP_URL}/auth/signup`,
  login: `${APP_URL}/auth/login`,
  labs: "https://www.rhinonlabs.com",
  call: "https://www.rhinonlabs.com/schedule-call",
  privacy: "https://www.rhinonlabs.com/privacy-terms",
  contact: "https://www.rhinonlabs.com/contact-us",
};
