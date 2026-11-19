// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/events/*/registered",
        "/events/*/feedback",
        "/certificates/",
      ],
    },
    sitemap: "https://www.uppercurve.in/sitemap.xml",
  };
}