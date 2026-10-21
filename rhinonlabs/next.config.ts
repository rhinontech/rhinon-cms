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
    ];
  },
  /* config options here */
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "https",
  //       hostname: "images6.alphacoders.com",
  //     },
  //     {
  //       protocol: "https",
  //       hostname: "wallpapercave.com",
  //     },
  //     {
  //       protocol: "https",
  //       hostname: "wallpaper.forfun.com",
  //     },
  //   ],
  // },
};

export default nextConfig;
