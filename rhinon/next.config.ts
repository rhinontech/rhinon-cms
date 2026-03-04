import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Electron compatibility
  images: {
    unoptimized: true, // Disable image optimization for Electron
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.livechat-static.com',
      },
    ],
  },
  output: 'standalone', // Optimize for production builds
};

export default nextConfig;
