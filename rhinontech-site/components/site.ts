import type { Metadata } from "next";

/** This marketing site. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.rhinontech.com").replace(/\/$/, "");

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
/** The workspace's name in the API (Settings, Developers). Public content is read from /public/<ORG_SLUG>/..., so it never depends on the "no key means the platform workspace" fallback. */
export const ORG_SLUG = "rhinontech";
export const PUBLIC_API = `${API_URL}/public/${ORG_SLUG}`;

export const links = {
  signup: `${APP_URL}/auth/signup`,
  login: `${APP_URL}/auth/login`,
  labs: "https://www.rhinonlabs.com",
  call: "/demo",
  privacy: "/privacy-terms",
  contact: "/contact",
};

/** Public key for the Rhinon Tech brand in the admin panel's Analytics. Safe in page source: it can only add a pageview, and only from www.rhinontech.com (or rhinontech.com). */
export const ANALYTICS_KEY = process.env.NEXT_PUBLIC_ANALYTICS_KEY || "rt_5c485857d3734c95e7517515";

export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Rhinon Tech: run your whole company from one workspace",
};

/**
 * Shared metadata builder so every page keeps its own Open Graph and Twitter tags
 * (Next.js shallow-replaces `openGraph`, otherwise child pages inherit the homepage).
 */
export function pageMeta({
  title,
  description,
  path,
  hasOgImage = false,
}: {
  title: string;
  description: string;
  path: string;
  hasOgImage?: boolean;
}): Metadata {
  const fullTitle = title.includes("Rhinon Tech") ? title : `${title} | Rhinon Tech`;
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: "Rhinon Tech",
      type: "website",
      locale: "en_IN",
      ...(hasOgImage ? {} : { images: [DEFAULT_OG_IMAGE] }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(hasOgImage ? {} : { images: [DEFAULT_OG_IMAGE.url] }),
    },
  };
}
