import { BlogPost, BlogApiBlock, BlogFaq } from "@/components/Pages/Blog/blogData";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5003";

export const BLOG_DOMAIN = "uppercurve";

export interface ApiBlog {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
  coverImage?: string | null;
  tags?: string[];
  category?: string | null;
  readTime: string;
  publishedAt: string;
  content?: string;
  contentBlocks?: BlogApiBlock[];
  faqs?: BlogFaq[];
  metaTitle?: string | null;
  metaDescription?: string | null;
}

const CATEGORY_CHIP_MAP: Record<string, string> = {
  "Artificial Intelligence": "bg-indigo-50 border-indigo-100 text-indigo-600",
  "Careers & Interviews": "bg-cyan-50 border-cyan-100 text-cyan-600",
  "Product & Business": "bg-emerald-50 border-emerald-100 text-emerald-700",
  "Learning & Growth": "bg-purple-50 border-purple-100 text-purple-700",
  "Community & Events": "bg-amber-50 border-amber-100 text-amber-700",
  Tech: "bg-blue-50 border-blue-100 text-blue-600",
  Engineering: "bg-violet-50 border-violet-100 text-violet-700",
  General: "bg-slate-50 border-slate-200 text-slate-700",
};

const POSTER_GRADIENTS = [
  "bg-gradient-to-br from-indigo-500 via-indigo-700 to-slate-950",
  "bg-gradient-to-br from-cyan-400 via-sky-600 to-slate-950",
  "bg-gradient-to-br from-emerald-500 via-teal-700 to-slate-950",
  "bg-gradient-to-br from-purple-500 via-fuchsia-700 to-slate-950",
  "bg-gradient-to-br from-amber-500 via-orange-700 to-stone-950",
  "bg-gradient-to-br from-rose-500 via-pink-700 to-slate-950",
  "bg-gradient-to-br from-blue-600 via-sky-800 to-slate-950",
];

export function getCategoryChip(category: string): string {
  if (CATEGORY_CHIP_MAP[category]) {
    return CATEGORY_CHIP_MAP[category];
  }
  // Deterministic fallback based on string length
  const keys = Object.values(CATEGORY_CHIP_MAP);
  return keys[category.length % keys.length];
}

export function getGradientForSlug(slug: string, index = 0): string {
  let hash = index;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash + slug.charCodeAt(i)) % POSTER_GRADIENTS.length;
  }
  return POSTER_GRADIENTS[hash];
}

export function formatDateLabel(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

/**
 * Converts an ApiBlog model from the backend into a BlogPost suited for the UpperCurve UI.
 */
export function adaptApiBlogToBlogPost(apiBlog: ApiBlog, index = 0): BlogPost {
  const category = apiBlog.category?.trim() || "Community";
  const slug = apiBlog.slug;

  return {
    id: apiBlog.id,
    slug,
    title: apiBlog.title,
    excerpt: apiBlog.excerpt || "",
    category,
    chip: getCategoryChip(category),
    gradient: getGradientForSlug(slug, index),
    dateLabel: formatDateLabel(apiBlog.publishedAt),
    dateISO: apiBlog.publishedAt || new Date().toISOString(),
    readTime: apiBlog.readTime || "4 min read",
    coverImage: apiBlog.coverImage || null,
    authorName: apiBlog.authorName || "UpperCurve Academy",
    authorRole: apiBlog.authorRole || "Mentor",
    authorAvatar: apiBlog.authorAvatar || null,
    tags: apiBlog.tags || [],
    contentBlocks: apiBlog.contentBlocks || [],
    rawContent: apiBlog.content || "",
    faqs: apiBlog.faqs || [],
    metaTitle: apiBlog.metaTitle || null,
    metaDescription: apiBlog.metaDescription || null,
    content: [], // Will be handled dynamically by BlogDetails BlockRenderer
  };
}

/**
 * Fetch all published blogs for UpperCurve.
 * Endpoint: GET http://localhost:5003/public/blogs?domain=uppercurve
 */
export async function fetchApiBlogs(): Promise<ApiBlog[]> {
  try {
    const url = `${API_BASE}/public/blogs?domain=${BLOG_DOMAIN}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(`[API] Failed to fetch blogs: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return data as ApiBlog[];
    }
    return [];
  } catch (err) {
    console.error("[API] Network error fetching blogs:", err);
    return [];
  }
}

/**
 * Fetch a single published blog by slug for UpperCurve.
 * Endpoint: GET http://localhost:5003/public/blogs/:slug?domain=uppercurve
 */
export async function fetchApiBlogBySlug(slug: string): Promise<ApiBlog | null> {
  try {
    const url = `${API_BASE}/public/blogs/${encodeURIComponent(slug)}?domain=${BLOG_DOMAIN}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      console.error(`[API] Failed to fetch blog "${slug}": ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    return (data as ApiBlog) || null;
  } catch (err) {
    console.error(`[API] Network error fetching blog "${slug}":`, err);
    return null;
  }
}
