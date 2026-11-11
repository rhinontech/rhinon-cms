// app/sitemap.ts
import type { MetadataRoute } from "next";
import { fetchApiBlogs } from "@/services/api";
import { getPublishedEvents } from "@/services/eventService";

const BASE_URL = "https://www.uppercurve.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Pages (Google ke liye fixed reliable dates)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date("2026-11-01"),
    },
    {
      url: `${BASE_URL}/courses/agentic-ai-launchpad`,
      lastModified: new Date("2026-11-01"),
    },
    {
      url: `${BASE_URL}/events`,
      lastModified: new Date("2026-11-01"),
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date("2026-11-01"),
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: new Date("2026-11-01"),
    },
  ];

  // 2. Fetch Dynamic Blogs from Backend
  const blogs = await fetchApiBlogs();
  const blogRoutes: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${BASE_URL}/blog/${blog.slug}`,
    lastModified: new Date(blog.updatedAt || blog.publishedAt || "2026-11-01"),
  }));

  // 3. Fetch Dynamic Events from Backend
  const events = await getPublishedEvents();
  const eventRoutes: MetadataRoute.Sitemap = events
    .filter((event) => Boolean(event.eventSlug || event.slug))
    .map((event) => ({
      url: `${BASE_URL}/events/${event.eventSlug || event.slug}`,
      lastModified: new Date(event.updatedAt || event.createdAt || "2026-11-01"),
    }));

  return [...staticRoutes, ...blogRoutes, ...eventRoutes];
}