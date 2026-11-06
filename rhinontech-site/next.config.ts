import type { NextConfig } from "next";

/**
 * This site lives on rhinontech.com and the dashboard on rhinontech.in, so
 * nothing here needs to forward old dashboard paths any more.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
};

export default nextConfig;
