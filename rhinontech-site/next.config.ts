import type { NextConfig } from "next";

/** Where the dashboard lives once rhinontech.in is this marketing site. */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.rhinontech.in";

/**
 * rhinontech.in used to BE the dashboard, so emails already in people's inboxes
 * link to it: password resets, invites, onboarding and signing links, client
 * portals, campaign clicks. Every one of those paths forwards to the app with
 * its query string intact, so no old link breaks.
 */
const APP_PATHS = [
  "/auth/:path*",
  "/p/:path*",
  "/portal/:path*",
  "/portal",
  "/onboard/:path*",
  "/onboard",
  "/sign-documents/:path*",
  "/sign-documents",
  "/superadmin/:path*",
  "/admin/:path*",
  "/hr/:path*",
  "/employee/:path*",
];

const nextConfig: NextConfig = {
  async redirects() {
    return APP_PATHS.map((source) => ({
      source,
      destination: `${APP_URL}${source.replace(/\/:path\*$/, "/:path*")}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
