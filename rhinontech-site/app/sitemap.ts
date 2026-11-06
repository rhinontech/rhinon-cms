import type { MetadataRoute } from "next";
import { SITE_URL } from "@/components/site";
import { PRODUCTS } from "@/content/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/product", "/ai", "/integrations", "/security", "/pricing", "/demo", "/contact", ...PRODUCTS.map((p) => `/product/${p.slug}`)];
  return pages.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : path.startsWith("/product/") ? 0.7 : 0.8,
  }));
}
