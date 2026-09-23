import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/blogs",
        destination: "/blog",
      },
      {
        source: "/blogs/:slug",
        destination: "/blog/:slug",
      },
      {
        source: "/job",
        destination: "/jobs",
      },
      {
        source: "/job/:slug*",
        destination: "/jobs/:slug*",
      },
    ];
  },
};

export default nextConfig;
