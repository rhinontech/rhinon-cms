import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Inline the CSS into the HTML instead of separate render-blocking files —
  // removes a round trip before first paint (Lighthouse "render-blocking").
  experimental: {
    inlineCss: true,
  },
  // Blog / case-study covers live in the public S3 bucket (content/ prefix).
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "rhinontech-assets.s3.ap-south-1.amazonaws.com", pathname: "/content/**" },
    ],
  },
  // Permanent redirects for renamed URLs, so links and Google's index carry over.
  async redirects() {
    return [
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
        ],
      },
    ];
  },
};

export default nextConfig;
