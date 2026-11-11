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
  async redirects() {
    return [
      {
        source: "/blogs",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/blogs/:slug*",
        destination: "/blog/:slug*",
        permanent: true,
      },
      {
        source: "/job",
        destination: "/jobs",
        permanent: true,
      },
      {
        source: "/job/:slug*",
        destination: "/jobs/:slug*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
