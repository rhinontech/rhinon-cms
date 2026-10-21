// Builds /llms.txt (curated index) and /llms-full.txt (full text) per the
// llmstxt.org proposal: plain Markdown that AI assistants and agents can read
// without rendering the site. Everything is generated from the same data the
// pages use, so it can't drift from what visitors see.
import { COMPANY, SITE_URL } from "@/lib/site";
import { services } from "@/lib/services";
import { faqs as generalFaqs } from "@/components/Common/FAQ/faqs";
import { getBlog, getBlogs, getCaseStudies, getCaseStudy, type Blog, type CaseStudy } from "@/lib/api";
import { htmlToMarkdown } from "@/lib/markdown";

const oneLine = (s: string | null | undefined) => (s || "").replace(/\s+/g, " ").trim();
const fmtDate = (d?: string | null) => {
  if (!d) return "";
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? "" : t.toISOString().slice(0, 10);
};

function contactLines(): string[] {
  return [
    `- [Contact Rhinon Labs](${SITE_URL}/contact-us): Phone / WhatsApp ${COMPANY.phone} (${COMPANY.whatsapp}).`,
    `- [Book a free discovery call](${SITE_URL}/schedule-call): 30-minute call over Google Meet to scope a project.`,
    `- [Have a startup idea?](${SITE_URL}/build): Submit an idea for Rhinon Labs to build with you.`,
  ];
}

function header(title: string): string[] {
  return [
    `# ${title}`,
    "",
    `> ${COMPANY.description}`,
    "",
    `Rhinon Labs is based in ${COMPANY.address.locality}, ${COMPANY.address.region}, ${COMPANY.address.countryName}, and works with clients worldwide. Key facts:`,
    "",
    ...COMPANY.facts.map((f) => `- ${f}`),
  ];
}

export async function buildLlmsTxt(): Promise<string> {
  const [blogs, caseStudies] = await Promise.all([getBlogs().catch(() => []), getCaseStudies().catch(() => [])]);

  return [
    ...header(COMPANY.name),
    "",
    "## Services",
    "",
    `- [All services](${SITE_URL}/services): Overview of everything Rhinon Labs builds.`,
    ...services.map((s) => `- [${s.name}](${SITE_URL}/services/${s.slug}): ${s.metaDescription}`),
    "",
    "## Case studies",
    "",
    ...(caseStudies.length
      ? caseStudies.map((cs) => `- [${oneLine(cs.title)}](${SITE_URL}/case-studies/${cs.slug}): ${oneLine(cs.description)}`)
      : [`- [Case studies](${SITE_URL}/case-studies): Products Rhinon Labs has built.`]),
    "",
    "## Blog",
    "",
    ...(blogs.length
      ? blogs.map((b) => `- [${oneLine(b.title)}](${SITE_URL}/blogs/${b.slug}): ${oneLine(b.excerpt)}`)
      : [`- [Blog](${SITE_URL}/blogs): Articles on MVPs, automation and AI for founders.`]),
    "",
    "## Contact",
    "",
    ...contactLines(),
    "",
    "## Optional",
    "",
    `- [Full content](${SITE_URL}/llms-full.txt): Every service page, case study, FAQ and blog post as one Markdown file.`,
    `- [Privacy Policy & Terms](${SITE_URL}/privacy-terms)`,
    "",
  ].join("\n");
}

function serviceSection(s: (typeof services)[number]): string[] {
  return [
    `### ${s.name}`,
    "",
    `URL: ${SITE_URL}/services/${s.slug}`,
    "",
    `**${s.headline} ${s.headlineAccent}.**`,
    "",
    s.intro,
    "",
    "**This is for you if:**",
    "",
    ...s.forYouIf.map((x) => `- ${x}`),
    "",
    "**What we build:**",
    "",
    ...s.builds.map((b) => `- **${b.title}** — ${b.description}`),
    "",
    "**How it works:**",
    "",
    ...s.process.map((p, i) => `${i + 1}. **${p.step}** — ${p.description}`),
    "",
    "**What you get:**",
    "",
    ...s.outcomes.map((o) => `- ${o}`),
    "",
    "**Frequently asked questions:**",
    "",
    ...s.faqs.flatMap((f) => [`**Q: ${f.question}**`, "", `A: ${f.answer}`, ""]),
  ];
}

function caseStudySection(cs: CaseStudy): string[] {
  const body = cs.contentBlocks?.length
    ? cs.contentBlocks.filter((b) => b.type === "paragraph").map((b) => htmlToMarkdown((b as { html: string }).html, SITE_URL)).join("\n\n")
    : (cs.content || "").trim();
  const meta = [
    cs.client && `Client: ${cs.client}`,
    cs.industry && `Industry: ${cs.industry}`,
    cs.timeline && `Timeline: ${cs.timeline}`,
    cs.liveLink && `Live: ${cs.liveLink}`,
  ].filter(Boolean);
  return [
    `### ${oneLine(cs.title)}`,
    "",
    `URL: ${SITE_URL}/case-studies/${cs.slug}`,
    ...(meta.length ? ["", meta.join(" · ")] : []),
    "",
    oneLine(cs.description),
    ...(cs.stats?.length ? ["", ...cs.stats.map((st) => `- **${st.value}${st.suffix ?? ""}** ${st.label}`)] : []),
    ...(cs.quote ? ["", `> ${oneLine(cs.quote)}`] : []),
    ...(body ? ["", body] : []),
    "",
  ];
}

function blogSection(b: Blog): string[] {
  const body = b.contentBlocks?.length
    ? b.contentBlocks.filter((x) => x.type === "paragraph").map((x) => htmlToMarkdown((x as { html: string }).html, SITE_URL)).join("\n\n")
    : (b.content || "").trim();
  const byline = [fmtDate(b.publishedAt) && `Published ${fmtDate(b.publishedAt)}`, b.authorName && `by ${b.authorName}${b.authorRole ? `, ${b.authorRole}` : ""}`]
    .filter(Boolean)
    .join(" ");
  return [
    `### ${oneLine(b.title)}`,
    "",
    `URL: ${SITE_URL}/blogs/${b.slug}${byline ? `  \n${byline}` : ""}`,
    "",
    `*${oneLine(b.excerpt)}*`,
    ...(body ? ["", body] : []),
    ...(b.faqs?.length ? ["", "**FAQs:**", "", ...b.faqs.flatMap((f) => [`**Q: ${f.question}**`, "", `A: ${f.answer}`, ""])] : [""]),
  ];
}

export async function buildLlmsFullTxt(): Promise<string> {
  // List endpoints return summaries; fetch each item for its full body (in parallel)
  const [blogList, caseList] = await Promise.all([getBlogs().catch(() => []), getCaseStudies().catch(() => [])]);
  const [blogs, caseStudies] = await Promise.all([
    Promise.all(blogList.map(async (b) => (await getBlog(b.slug).catch(() => null)) ?? b)),
    Promise.all(caseList.map(async (c) => (await getCaseStudy(c.slug).catch(() => null)) ?? c)),
  ]);

  return [
    ...header(`${COMPANY.name} — full content`),
    "",
    `This file contains the full text of ${SITE_URL}: services, case studies, FAQs and blog posts. The shorter index is at ${SITE_URL}/llms.txt.`,
    "",
    "## Contact",
    "",
    ...contactLines(),
    "",
    "## Services",
    "",
    ...services.flatMap(serviceSection),
    "## General FAQs",
    "",
    ...generalFaqs.flatMap((f) => [`**Q: ${f.question}**`, "", `A: ${f.answer}`, ""]),
    ...(caseStudies.length ? ["## Case studies", "", ...caseStudies.flatMap(caseStudySection)] : []),
    ...(blogs.length ? ["## Blog", "", ...blogs.flatMap(blogSection)] : []),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/** Plain-text response, cached at the CDN for an hour (content changes rarely). */
export function textResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
