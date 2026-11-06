import type { MetadataRoute } from "next";
import { SITE_URL } from "@/components/site";
import { PRODUCTS } from "@/content/products";
import { getBlogs } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/product", "/ai", "/integrations", "/security", "/pricing", "/demo", "/contact", "/privacy-terms", "/blog", ...PRODUCTS.map((p) => `/product/${p.slug}`)];
  const posts = await getBlogs();
  return [
    ...pages.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : path.startsWith("/product/") ? 0.7 : 0.8,
    })),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: new Date(p.publishedAt), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
