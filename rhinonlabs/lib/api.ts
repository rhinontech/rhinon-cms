// Rhinon Tech backend — the same Postgres-backed API the admin-panel writes to.
// Content (blogs, case studies) and lead capture all flow through here.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.rhinontech.in";

export interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
  coverImage?: string | null;
  tags: string[];
  readTime: string;
  publishedAt: string;
}

export interface CaseStudyStat {
  value: string;
  suffix?: string;
  label: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  content?: string | null;
  slug: string;
  client?: string | null;
  industry?: string | null;
  category?: string | null;
  timeline?: string | null;
  liveLink?: string | null;
  date?: string | null;
  result?: string | null;
  quote?: string | null;
  image?: string | null;
  images?: string[];
  stats: CaseStudyStat[];
  displayOrder: number;
}

async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getBlogs(): Promise<Blog[]> {
  return (await getJSON<Blog[]>("/public/blogs")) ?? [];
}

export async function getBlog(slug: string): Promise<Blog | null> {
  return getJSON<Blog>(`/public/blogs/${encodeURIComponent(slug)}`);
}

export async function getCaseStudies(): Promise<CaseStudy[]> {
  return (await getJSON<CaseStudy[]>("/public/case-studies")) ?? [];
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  return getJSON<CaseStudy>(`/public/case-studies/${encodeURIComponent(slug)}`);
}
