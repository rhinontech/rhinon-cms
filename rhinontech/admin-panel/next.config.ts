import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones on the LAN load dev resources (HMR) when testing responsiveness.
  allowedDevOrigins: ["192.168.0.2"],
  headers: async () => [
    {
      source: "/(.*)",
      headers: [{ key: "Cache-Control", value: "no-store" }],
    },
  ],
};

export default nextConfig;
