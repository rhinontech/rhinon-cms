// Minimal HTML → Markdown for blog/case-study content in llms-full.txt.
// Covers what the CMS editor produces (p, h2–h4, strong/em, a, ul/ol/li,
// blockquote, table, br, code). No dependency: the input is our own trusted HTML.

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘",
  rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…", middot: "·", bull: "•",
};

export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

const stripTags = (html: string) => html.replace(/<[^>]+>/g, "");

/** Inline formatting: links, bold, italics, code, line breaks. */
function inline(html: string, baseUrl: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, text: string) => {
      const label = stripTags(text).trim();
      const url = href.startsWith("/") ? `${baseUrl}${href}` : href;
      return label ? `[${label}](${url})` : url;
    })
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, t: string) => (t.trim() ? `**${t.trim()}**` : ""))
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, t: string) => (t.trim() ? `*${t.trim()}*` : ""))
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");
}

function clean(text: string): string {
  return decodeEntities(stripTags(text)).replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
}

function table(html: string, baseUrl: string): string {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) =>
    [...r[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) =>
      clean(inline(c[1], baseUrl)).replace(/\n+/g, " ").replace(/\|/g, "\\|"),
    ),
  ).filter((r) => r.length);
  if (!rows.length) return "";
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r: string[]) => [...r, ...Array(width - r.length).fill("")];
  const [head, ...body] = rows.map(pad);
  return [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...body.map((r) => `| ${r.join(" | ")} |`)].join("\n");
}

function list(html: string, ordered: boolean, baseUrl: string): string {
  return [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m, i) => `${ordered ? `${i + 1}.` : "-"} ${clean(inline(m[1], baseUrl)).replace(/\n+/g, " ")}`)
    .join("\n");
}

export function htmlToMarkdown(html: string, baseUrl = ""): string {
  if (!html) return "";
  const blocks: string[] = [];
  // Walk top-level block elements in order; anything between them is treated as a paragraph.
  const re = /<(h[1-6]|p|ul|ol|blockquote|table|pre|div)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  const push = (s: string) => { if (s.trim()) blocks.push(s.trim()); };
  while ((m = re.exec(html))) {
    const between = clean(inline(html.slice(last, m.index), baseUrl));
    if (between) push(between);
    last = re.lastIndex;
    const tag = m[1].toLowerCase();
    const inner = m[2];
    if (/^h[1-6]$/.test(tag)) {
      // Article title is the document's H1/H2 already — content headings start at ###
      const level = Math.min(6, Math.max(3, Number(tag[1]) + 1));
      push(`${"#".repeat(level)} ${clean(inline(inner, baseUrl))}`);
    } else if (tag === "ul" || tag === "ol") push(list(inner, tag === "ol", baseUrl));
    else if (tag === "blockquote") push(clean(inline(inner, baseUrl)).split("\n").map((l) => `> ${l}`).join("\n"));
    else if (tag === "table") push(table(inner, baseUrl));
    else if (tag === "pre") push("```\n" + decodeEntities(stripTags(inner)).trim() + "\n```");
    else if (tag === "div") push(htmlToMarkdown(inner, baseUrl));
    else push(clean(inline(inner, baseUrl)));
  }
  const tail = clean(inline(html.slice(last), baseUrl));
  if (tail) push(tail);
  return blocks.join("\n\n");
}
