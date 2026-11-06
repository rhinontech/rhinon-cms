import type { NextConfig } from "next";

/**
 * This site lives on rhinontech.com and the dashboard on rhinontech.in, so
 * nothing here needs to forward old dashboard paths any more.
 */
const nextConfig: NextConfig = {
  // A separate build folder, so a test build can run next to a dev server without the
  // two fighting over .next (Turbopack allows one cache writer at a time). Unset = .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
};

export default nextConfig;
