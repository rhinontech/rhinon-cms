import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/**
 * This site lives on rhinontech.com and the dashboard on rhinontech.in, so
 * nothing here needs to forward old dashboard paths any more.
 */
const nextConfig: NextConfig = {
  // A separate build folder, so a test build can run next to a dev server without the
  // two fighting over .next (Turbopack allows one cache writer at a time). Unset = .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  experimental: {
    agentUpgrade: "security",
  },
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
  // Product renames (2026-11-26, docs/RHINONTECH_WEBSITE_REVAMP.md §2.5). Permanent, so search
  // engines move any signals the old URLs had; keep these indefinitely.
  async redirects() {
    return [
      // The backend's publish ping (IndexNow) and older links use /blogs; this site serves /blog.
      { source: "/blogs", destination: "/blog", permanent: true },
      { source: "/blogs/:slug*", destination: "/blog/:slug*", permanent: true },
      { source: "/product/chatbot/:path*", destination: "/product/ai-agent/:path*", permanent: true },
      { source: "/product/work/:path*", destination: "/product/projects/:path*", permanent: true },
      { source: "/product/pages/:path*", destination: "/product/docs/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
