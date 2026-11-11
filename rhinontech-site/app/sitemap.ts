import type { MetadataRoute } from "next";
import { SITE_URL } from "@/components/site";
import { PRODUCTS } from "@/content/products";
import { getBlogs } from "@/lib/blog";

// Real last-edited dates for static pages (bump a route's date when its content changes; never use bare new Date()).
const PRODUCT_LASTMOD_DEFAULT = "2026-11-11";
const STATIC_PAGE_LASTMOD: Record<string, string> = {
  "": "2026-11-11",
  "/product": "2026-11-11",
  "/ai": "2026-11-11",
  "/integrations": "2026-11-11",
  "/security": "2026-11-11",
  "/pricing": "2026-11-11",
  "/demo": "2026-11-11",
  "/contact": "2026-11-11",
  "/privacy-terms": "2026-11-11",
  "/blog": "2026-11-11",
  ...Object.fromEntries(PRODUCTS.map((p) => [`/product/${p.slug}`, PRODUCT_LASTMOD_DEFAULT])),
};

function parseIsoDate(iso?: string | null): Date | undefined {
  if (!iso) return undefined;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogs();
  const postDates = posts.map((p) => parseIsoDate(p.updatedAt) ?? parseIsoDate(p.publishedAt));
  const latestPostTime = Math.max(0, ...postDates.filter((d): d is Date => Boolean(d)).map((d) => d.getTime()));

  return [
    ...Object.entries(STATIC_PAGE_LASTMOD).map(([path, dateStr]) => {
      const staticDate = parseIsoDate(dateStr);
      const lastModified =
        path === "/blog" && latestPostTime > (staticDate?.getTime() ?? 0) ? new Date(latestPostTime) : staticDate;
      return {
        url: `${SITE_URL}${path}`,
        ...(lastModified ? { lastModified } : {}),
      };
    }),
    ...posts.map((p, index) => {
      const lastModified = postDates[index];
      return {
        url: `${SITE_URL}/blog/${p.slug}`,
        ...(lastModified ? { lastModified } : {}),
      };
    }),
  ];
}
