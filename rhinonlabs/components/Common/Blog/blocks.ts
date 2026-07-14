import type { BlogBlock } from "@/lib/api";

export interface TocItem {
  id: string;
  text: string;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z#0-9]+;/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

/** Strip anything executable from admin-authored HTML (belt and braces — authors are trusted). */
export function stripScripts(html: string): string {
  return (html || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function headingTextsFromHtml(html: string): string[] {
  const out: string[] = [];
  const re = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const text = m[1].replace(/<[^>]*>/g, "").trim();
    if (text) out.push(text);
  }
  return out;
}

/**
 * Builds the table of contents (H2s across paragraph blocks) with de-duplicated
 * anchor ids, in document order.
 */
export function extractToc(blocks: BlogBlock[]): TocItem[] {
  const seen = new Map<string, number>();
  const items: TocItem[] = [];
  for (const block of blocks) {
    if (block.type !== "paragraph") continue;
    for (const text of headingTextsFromHtml(block.html)) {
      const base = slugifyHeading(text);
      const count = (seen.get(base) || 0) + 1;
      seen.set(base, count);
      items.push({ id: count > 1 ? `${base}-${count}` : base, text });
    }
  }
  return items;
}

/**
 * Injects the same de-duplicated ids into <h2> tags. `seen` is shared across
 * blocks so ids line up with extractToc — pass one Map for the whole article.
 */
export function withHeadingIds(html: string, seen: Map<string, number>): string {
  return html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (_m, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]*>/g, "").trim();
    if (!text) return `<h2${attrs}>${inner}</h2>`;
    const base = slugifyHeading(text);
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    const id = count > 1 ? `${base}-${count}` : base;
    return `<h2${attrs} id="${id}">${inner}</h2>`;
  });
}

/** TOC for legacy markdown blogs — mirrors the ids MarkdownRenderer puts on its `## ` headings. */
export function extractTocFromMarkdown(markdown: string): TocItem[] {
  return (markdown || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("## "))
    .map((l) => {
      const text = l.slice(3).trim();
      return { id: slugifyHeading(text), text };
    })
    .filter((item) => item.text);
}

export function extractYouTubeId(url: string): string | null {
  const m = (url || "").match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}
