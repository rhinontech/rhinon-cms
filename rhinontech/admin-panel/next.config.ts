import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second checkout of the build output, for running a test build next to a
  // dev server without the two fighting over .next. Unset = the normal .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Lets phones on the LAN load dev resources (HMR) when testing responsiveness.
  allowedDevOrigins: ["192.168.0.2"],
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "Cache-Control", value: "no-store" },
        // Nobody else may frame the admin (clickjacking); our own pages still can.
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
  ],
};

export default nextConfig;
