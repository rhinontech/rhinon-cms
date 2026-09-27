export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string };

export type BlogApiBlock =
  | { id: string; type: "paragraph"; html: string }
  | { id: string; type: "image"; url: string; alt?: string; credit?: string }
  | { id: string; type: "video"; url: string; caption?: string }
  | { id: string; type: "youtube"; url: string; caption?: string };

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  /** Tailwind classes for the category chip on light backgrounds */
  chip: string;
  /** Tailwind gradient classes for the poster artwork */
  gradient: string;
  dateLabel: string;
  dateISO: string;
  readTime: string;
  content: ContentBlock[];
  coverImage?: string | null;
  authorName?: string;
  authorRole?: string;
  authorAvatar?: string | null;
  tags?: string[];
  contentBlocks?: BlogApiBlock[];
  rawContent?: string;
  faqs?: BlogFaq[];
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export const blogCategories = [
  "All Articles",
  "Artificial Intelligence",
  "Careers & Interviews",
  "Product & Business",
  "Learning & Growth",
  "Community & Events",
];

// No dummy blogs — all blogs are loaded dynamically from the backend API
export const blogPosts: BlogPost[] = [];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
