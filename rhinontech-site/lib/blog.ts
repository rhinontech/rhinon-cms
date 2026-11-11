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
  updatedAt?: string | null;
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


export interface ProductGuideTarget {
  slug: string;
  name: string;
  short: string;
  group: string;
}

const GUIDE_STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from",
  "has", "have", "how", "in", "into", "is", "it", "its", "of", "on", "one",
  "or", "our", "out", "own", "so", "that", "the", "their", "them", "they",
  "this", "to", "up", "use", "way", "what", "when", "where", "who", "will",
  "with", "without", "you", "your", "all", "every", "just", "make", "makes",
  "more", "most", "some", "such", "than", "then", "these", "those", "very",
  "team", "teams", "company", "business", "software", "people", "work",
  "tool", "tools", "workspace", "rhinon", "tech", "whole", "single", "place",
]);

function tokenizeGuideText(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function stemGuideToken(token: string): string {
  if (token.length >= 5 && token.endsWith("s") && !token.endsWith("ss") && !token.endsWith("us")) {
    return token.slice(0, -1);
  }
  return token;
}

function normalizeGuidePhrase(text: string): string {
  return tokenizeGuideText(text).join(" ");
}

function hasWholePhrase(haystackPhrase: string, needlePhrase: string): boolean {
  if (!haystackPhrase || !needlePhrase) return false;
  return ` ${haystackPhrase} `.includes(` ${needlePhrase} `);
}

/**
 * Dynamically ranks and returns blog posts relevant to a product module based on
 * the product's slug, name, description, and group — with no hardcoded blog slugs.
 */
export function matchBlogsForProduct(
  product: ProductGuideTarget,
  posts: BlogSummary[],
  limit = 3,
): BlogSummary[] {
  const slugPhrase = normalizeGuidePhrase(product.slug);
  const namePhrase = normalizeGuidePhrase(product.name);
  const identityPhrases = Array.from(new Set([slugPhrase, namePhrase].filter(Boolean)));
  const identityTokenSet = new Set(identityPhrases.flatMap(tokenizeGuideText).map(stemGuideToken));
  const shortTokens = Array.from(
    new Set(
      tokenizeGuideText(product.short)
        .filter((t) => t.length >= 4 && !GUIDE_STOPWORDS.has(t))
        .map(stemGuideToken),
    ),
  ).filter((t) => !identityTokenSet.has(t));
  const groupToken = stemGuideToken(tokenizeGuideText(product.group)[0] ?? "");

  const scored: { post: BlogSummary; score: number }[] = [];

  for (const post of posts) {
    const titlePhrase = normalizeGuidePhrase(post.title);
    const postSlugPhrase = normalizeGuidePhrase(post.slug);
    const tagPhrases = (post.tags ?? []).map(normalizeGuidePhrase).filter(Boolean);
    const excerptPhrase = normalizeGuidePhrase(post.excerpt ?? "");
    const categoryTokens = new Set(tokenizeGuideText(post.category ?? "").map(stemGuideToken));
    const primaryTokenSet = new Set(
      [
        ...tokenizeGuideText(post.title),
        ...tokenizeGuideText(post.slug),
        ...(post.tags ?? []).flatMap(tokenizeGuideText),
      ].map(stemGuideToken),
    );
    const excerptTokenSet = new Set(tokenizeGuideText(post.excerpt ?? "").map(stemGuideToken));

    let identityScore = 0;
    for (const phrase of identityPhrases) {
      if (tagPhrases.some((t) => hasWholePhrase(t, phrase))) identityScore += 10;
      if (hasWholePhrase(postSlugPhrase, phrase)) identityScore += 8;
      if (hasWholePhrase(titlePhrase, phrase)) identityScore += 8;
      if (hasWholePhrase(excerptPhrase, phrase)) identityScore += 4;
    }

    let shortScore = 0;
    let shortHits = 0;
    for (const tok of shortTokens) {
      if (primaryTokenSet.has(tok)) {
        shortScore += 3;
        shortHits += 1;
      } else if (excerptTokenSet.has(tok)) {
        shortScore += 1;
      }
    }

    const relevant = identityScore >= 8 || (identityScore >= 4 && shortHits >= 1) || shortHits >= 2;
    if (!relevant) continue;

    const groupBonus = groupToken && categoryTokens.has(groupToken) ? 2 : 0;
    scored.push({ post, score: identityScore + shortScore + groupBonus });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      Date.parse(b.post.publishedAt) - Date.parse(a.post.publishedAt),
  );

  return scored.slice(0, limit).map((item) => item.post);
}
