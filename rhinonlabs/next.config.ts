import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Blog / case-study covers live in the public S3 bucket (content/ prefix).
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90, 95],
    remotePatterns: [
      { protocol: "https", hostname: "rhinontech-assets.s3.ap-south-1.amazonaws.com", pathname: "/content/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "github.com" },
    ],
  },
  // Permanent redirects for renamed URLs, so links and Google's index carry over.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "rhinonlabs.com",
          },
        ],
        destination: "https://www.rhinonlabs.com/:path*",
        permanent: true,
      },
      {
        source: "/blogs/ai-agents-vs-traditional-automatio",
        destination: "/blogs/ai-agents-vs-traditional-automation",
        permanent: true,
      },
      {
        source: "/startup",
        destination: "/build",
        permanent: true,
      },
      {
        source: "/about",
        destination: "/_about",
        permanent: true,
      },
      {
        source: "/blogs/mvp-development-cost-india-2026-guide",
        destination: "/blogs/mvp-development-cost-india-2027-guide",
        permanent: true,
      },
      {
        source: "/blogs/mobile-app-development-cost-startups-india",
        destination: "/blogs/mobile-app-development-cost-india-2027",
        permanent: true,
      },
    ];
  },
  // Security headers for browser protection, clickjacking defense, and MIME-sniffing prevention
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
