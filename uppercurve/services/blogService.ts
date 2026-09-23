import { BlogPost } from "@/components/Pages/Blog/blogData";
import {
  fetchApiBlogs,
  fetchApiBlogBySlug,
  adaptApiBlogToBlogPost,
} from "./api";

/**
 * Retrieves all published blogs for UpperCurve strictly from the backend API.
 * Hits backend API: http://localhost:5003/public/blogs?domain=uppercurve
 */
export async function getBlogs(): Promise<BlogPost[]> {
  try {
    const apiBlogs = await fetchApiBlogs();
    if (apiBlogs && apiBlogs.length > 0) {
      return apiBlogs.map((b, idx) => adaptApiBlogToBlogPost(b, idx));
    }
  } catch (err) {
    console.error("getBlogs failed to fetch from API:", err);
  }

  return [];
}

/**
 * Retrieves a single published blog by slug for UpperCurve strictly from the backend API.
 * Hits backend API: http://localhost:5003/public/blogs/:slug?domain=uppercurve
 */
export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const apiBlog = await fetchApiBlogBySlug(slug);
    if (apiBlog) {
      return adaptApiBlogToBlogPost(apiBlog);
    }
  } catch (err) {
    console.error(`getBlogBySlug failed for "${slug}":`, err);
  }

  return null;
}

/**
 * Extracts unique categories and their counts from a list of blogs.
 */
export function getCategoriesWithCounts(posts: BlogPost[]): { category: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const post of posts) {
    const cat = post.category || "Community";
    counts[cat] = (counts[cat] || 0) + 1;
  }

  const result = [
    { category: "All Articles", count: posts.length },
    ...Object.entries(counts).map(([category, count]) => ({ category, count })),
  ];

  return result;
}

export * from "./api";
