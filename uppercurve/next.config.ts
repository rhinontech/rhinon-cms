import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Event banners and speaker photos are remote: seeded stock photography
    // today, uploads to our own buckets once editors replace them.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "rhinontech-assets.s3.ap-south-1.amazonaws.com" },
      { protocol: "https", hostname: "uppercurve-assets.s3.ap-south-1.amazonaws.com" },
    ],
  },
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
