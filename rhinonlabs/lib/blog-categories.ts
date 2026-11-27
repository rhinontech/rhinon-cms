import { type Blog } from "@/lib/api";

export interface BlogCategory {
  slug: string;
  name: string;
  description: string;
  count: number;
}

/**
 * Converts any category string to a URL-friendly slug
 * e.g., "AI Agents" -> "ai-agents", "Cloud & DevOps" -> "cloud-devops"
 */
export function slugifyCategory(category: string): string {
  if (!category) return "general";
  return category
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Gets the slug for a blog's category dynamically.
 */
export function getCategorySlugForBlog(blog: Blog): string {
  if (!blog.category || !blog.category.trim()) {
    return "general";
  }
  return slugifyCategory(blog.category);
}

/**
 * Default descriptions for popular categories.
 * For any new category entered in the CMS, generates a professional dynamic description.
 */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "mvp-development": "Guides, cost breakdowns, and technical roadmaps for launching web and mobile MVPs in weeks.",
  "ai-agents": "Deep-dives into autonomous AI agents, enterprise use cases, architecture, and security protocols.",
  "workflow-automation": "Strategies for automating sales operations, team onboarding, tool integrations, and operational workflows.",
  "automation": "Actionable guides and technical architectures for end-to-end business automation.",
  "internal-dashboards": "Practical blueprints for replacing spreadsheets with custom operational dashboards and internal tools.",
  "projects": "Case studies, blueprints, and architecture breakdowns of custom software products.",
  "ai": "Artificial intelligence insights, practical workflows, and implementation strategies for modern startups.",
};

/**
 * Dynamically extracts all unique categories from the live database/blogs list.
 * Future-proof: Whether you have 26 blogs or 10,000 blogs with arbitrary categories,
 * this function automatically discovers and groups them without hardcoded limits.
 */
export function getDynamicCategories(blogs: Blog[]): BlogCategory[] {
  const map = new Map<string, { name: string; count: number }>();

  for (const blog of blogs) {
    const rawName = blog.category?.trim();
    if (!rawName) continue;
    const slug = slugifyCategory(rawName);

    const existing = map.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(slug, { name: rawName, count: 1 });
    }
  }

  const result: BlogCategory[] = [];
  for (const [slug, { name, count }] of map.entries()) {
    const description =
      CATEGORY_DESCRIPTIONS[slug] ||
      `Explore in-depth articles, actionable playbooks, and guides covering ${name}.`;

    result.push({
      slug,
      name,
      description,
      count,
    });
  }

  // Sort categories by post count descending
  return result.sort((a, b) => b.count - a.count);
}

/**
 * Finds a category dynamically from the blogs list given a slug.
 */
export function findCategoryBySlug(blogs: Blog[], slug: string): BlogCategory | undefined {
  const categories = getDynamicCategories(blogs);
  return categories.find((c) => c.slug === slug);
}
