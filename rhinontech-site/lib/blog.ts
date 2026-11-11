import { BRAND_SLUG, PUBLIC_API } from "@/components/site";

/* The blog is the Rhinon Tech brand's content in the admin panel's Content module. */

export type BlogBlock =
  | { id: string; type: "paragraph"; html: string }
  | { id: string; type: "image"; url: string; alt?: string; credit?: string }
  | { id: string; type: "video"; url: string; caption?: string }
  | { id: string; type: "youtube"; url: string; caption?: string };

export interface BlogFaq { question: string; answer: string }

export interface BlogSummary {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string | null;
  coverImage: string | null;
  tags: string[];
  category: string | null;
  readTime: string;
  publishedAt: string;
}

export interface Blog extends BlogSummary {
  content: string;
  contentBlocks: BlogBlock[];
  faqs: BlogFaq[];
  metaTitle: string | null;
  metaDescription: string | null;
}

// Return null only on 404 (not found); throw on other errors so Next.js keeps the last good cache.
async function getJSON<T>(path: string): Promise<T | null> {
  const res = await fetch(`${PUBLIC_API}${path}`, { next: { revalidate: 300 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Blog API failed (${res.status}) for ${path}`);
  return (await res.json()) as T;
}

export async function getBlogs(): Promise<BlogSummary[]> {
  return (await getJSON<BlogSummary[]>(`/blogs?domain=${BRAND_SLUG}`)) ?? [];
}

export async function getBlog(slug: string): Promise<Blog | null> {
  return getJSON<Blog>(`/blogs/${encodeURIComponent(slug)}?domain=${BRAND_SLUG}`);
}

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

const TONES = ["#7c5cff", "#2f5bff", "#e0489f", "#08a97a", "#f2761a", "#0ea5b7"];
/** A stable accent per category, so a topic always has the same colour. */
export function toneFor(category: string | null | undefined): string {
  const s = category || "Rhinon Tech";
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

export interface TocItem { id: string; text: string; level: 2 | 3 }

/** Gives every h2/h3 an id so the contents list can link to it, and returns that list. */
export function withHeadingIds(html: string, taken: Set<string>): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const out = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_m, lvl: string, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
    if (!text) return _m;
    let id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";
    let n = 2;
    const base = id;
    while (taken.has(id)) id = `${base}-${n++}`;
    taken.add(id);
    toc.push({ id, text, level: Number(lvl) as 2 | 3 });
    return `<h${lvl}${attrs.replace(/\sid="[^"]*"/i, "")} id="${id}">${inner}</h${lvl}>`;
  });
  return { html: out, toc };
}

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
