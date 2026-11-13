import { env } from "../config/env";
import { getSalesMemory } from "../config/salesMemory";
import { generateBlogImage } from "./aiImage";

/**
 * Drafts a full blog post from a queued topic.
 *
 * Two model calls on purpose:
 *   1. research — grounded in live Google Search, returns plain notes (current
 *      numbers, what competing articles cover, what they miss). Grounding can't
 *      be combined with JSON output, hence the split.
 *   2. write — turns topic + research + house style into structured JSON in the
 *      exact shape the blog editor stores: one HTML document with inline images.
 *
 * The output is always saved as a Draft by the caller; nothing here publishes.
 */

const TEXT_MODEL = process.env.BLOG_AI_MODEL || "gemini-2.5-pro";
const FALLBACK_MODEL = "gemini-2.5-flash";
const API = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Who the post is written for. Without one the generator writes as Rhinon Labs (the
 * software studio), which is what it was built for; a brand's own profile swaps the
 * company description, the studio wording and the call to action.
 */
export interface BrandProfile {
  name: string;
  /** How the company is described to the model, e.g. "a business software company". */
  kind: string;
  about: string;
}

export const RHINONTECH_BRAND: BrandProfile = {
  name: "Rhinon Tech",
  kind: "a business software company",
  about: `Rhinon Tech is one workspace for a whole company, made by Rhinon Labs. It replaces a CRM, a cold-email tool, a shared inbox, a live-chat widget, a project tracker, team chat, a wiki, HR software, payroll and leave tracking with eleven connected products behind one login.
Products: CRM, Outreach (AI cold email), Inbox (shared team inbox), AI Chatbot (the one paid product), Work (projects, tasks, client portal), Team Chat & Meetings, Pages (docs and wiki), HR & People (records, onboarding, offer letters and NDAs signed in the app), Payroll (monthly runs and payslips, built for India with PF, PT and TDS), Attendance & Leave, Performance (review cycles and goals).
Everything except the AI chatbot is free for the whole team, with no time limit and no credit card. Rhinon AI is built into the modules: it researches leads, drafts emails, answers website visitors and rewrites sentences in letters, and a person approves before anything is sent. It runs on Google's Gemini models.
Voice: plain, practical, specific. Written for founders, operations leads and small-company managers, mostly in India. Never claim customer numbers, awards, certifications or benchmarks. Do not invent features.`,
};

/**
 * Rhinon Labs content brand — sourced from the site-brief SEO crawl.
 * Used for all rhinonlabs.com blog generation instead of the generic sales memory.
 */
export const RHINONLABS_BRAND: BrandProfile = {
  name: "Rhinon Labs",
  kind: "a custom software and AI automation studio",
  about: `Rhinon Labs is a product studio that builds custom internal dashboards, workflow automations, AI agents, MVPs and web/mobile apps for startups and SMBs in India, so they can scale operations without adding headcount. Internal dashboards are the top service by revenue.

POSITIONING — always present Rhinon Labs as:
- A "tech partner" or "product studio", NEVER an "agency"
- Premium, not cheap. Never use the words cheap, affordable, low-cost or budget.
- End-to-end: "we build it, we deploy it, we maintain it"
- A team that connects existing tools instead of replacing them

REAL PROOF (use these; do not invent others):
- FurrCircle: a pet-parent app on web, iOS and Android — Rhinon Labs built it in-house
- SR Fitout: a Bengaluru interiors studio — marketing site, project-intake portal and admin dashboard
- Apexis Pro: construction SaaS for drawings, snags, RFIs and handover on web and native mobile; client paid ₹4,00,000
- Delivery timeline: 2–4 weeks for a focused build (this is real and may be cited)
- Full ownership: the client owns 100% of the code, designs and infrastructure accounts

STATS YOU MUST NEVER CITE (owner confirmed unverified):
- "20+ startups and SMBs served", "85% less manual work", "98% workflows run without a human fix",
  "50+ tools connected", "80% of routine FAQs", "10 hrs/week saved per person", "50+ hours weekly",
  "100s of hours saved per month". Do not use these or any variation of them.

PRIMARY READER: Ops leads and COOs at growing Indian startups. They own the processes,
they're drowning in spreadsheets and disconnected tools, and they need visibility without
hiring more people. Secondary reader: non-technical founders scoping an MVP.

READER'S FEARS (address these):
1. Paying for a system nobody on the team actually uses
2. Getting locked in and not owning the code or accounts
3. Long timelines and scope creep
4. Disruption: having to rip out tools the team already relies on

SAY / NEVER SAY:
- Always: "without adding headcount", "studio", "tech partner", "product team", "end-to-end",
  "connect your existing tools instead of replacing them", "fixed scope", "weekly releases"
- Never: "agency" (for Rhinon Labs), "cheap", "affordable", "low-cost", "cutting-edge",
  "next-generation", "state-of-the-art", "revolutionize", "game-changer", "seamless", "unlock",
  "leverage" (as verb), "empower", "In today's fast-paced world", "Look no further"

MONEY PAGES (internal links should point here when relevant):
- /services/internal-dashboards — top priority
- /services/workflow-automation
- /services/ai-agents
- /services/mvp-development
- /schedule-call — conversion page

PRIMARY CTA: "Book a Free Discovery Call" linking to /schedule-call
SECONDARY CTA: "Assess My Idea" linking to /contact-us`,
};

export interface TopicInput {
  title: string;
  keyword?: string | null;
  audience?: string | null;
  notes?: string | null;
  targetPage?: string | null;
  withImages: boolean;
  brand?: BrandProfile;
}

export interface LinkTarget {
  title: string;
  path: string;
}

export interface GeneratedDraft {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  tags: string[];
  html: string;
  faqs: { question: string; answer: string }[];
  coverImage: string | null;
  imageErrors: string[];
}

async function callGemini(model: string, body: unknown): Promise<any> {
  const res = await fetch(`${API}/${model}:generateContent?key=${env.geminiApiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as any;
  if (!res.ok) {
    const err: any = new Error(data?.error?.message || `Gemini error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Tries the configured (stronger) model first; falls back if the key can't use it. */
async function generate(body: unknown): Promise<string> {
  let data: any;
  try {
    data = await callGemini(TEXT_MODEL, body);
  } catch (err: any) {
    if (TEXT_MODEL === FALLBACK_MODEL || ![400, 403, 404, 429].includes(err.status)) throw err;
    data = await callGemini(FALLBACK_MODEL, body);
  }
  const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => p.text || "").join("").trim();
  if (!text) throw new Error("The model returned an empty response");
  return text;
}

async function research(topic: TopicInput): Promise<string> {
  const prompt = `You are researching a blog post for ${topic.brand ? topic.brand.kind : "a software studio"}'s website.
Topic: "${topic.title}"${topic.keyword ? `\nTarget search phrase: "${topic.keyword}"` : ""}${topic.audience ? `\nReader: ${topic.audience}` : ""}

Search the web and return concise research notes (plain text, bullet points):
- Current, specific facts and numbers (costs, timelines, tools, 2025-2026 data), each with the source name.
- What the top-ranking articles on this exact search cover, and the questions they leave unanswered.
- Common mistakes, edge cases and practical steps a practitioner would mention.
- Questions people actually ask about this (for an FAQ).
Do not write the article. Notes only.`;
  try {
    return await generate({ contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }] });
  } catch {
    return ""; // research is an enrichment; the writer can still work without it
  }
}

const styleGuide = (brand: string, studio: boolean) => `WRITING RULES (follow strictly):

VOICE & TONE:
- Write like an experienced founder/engineer explaining this to a peer: direct, specific, opinionated where justified.
- Open with the reader's actual problem or a concrete situation in 2-3 sentences. Never open with "In today's fast-paced world", "In the ever-evolving", "Are you looking to", or a definition.
- Use the contrast device: "doesn't X, it Y" and "X, not Y" ("in weeks, not months"). Short, declarative sentences. Occasional imperative ("Stop thinking about cost in a vacuum.").
- Banned words/phrases: delve, landscape, realm, leverage (as a verb), seamless, robust, game-changer, unlock, elevate, navigate the complexities, it's important to note, in conclusion, ultimately, furthermore, moreover, crucial, embark, revolutionize, cutting-edge, next-generation, state-of-the-art, empower.

FACTS & PROOF:
- Use concrete numbers, tool names, timeframes and examples (Indian startup context with INR where natural, USD where it's the norm).
- NEVER invent statistics. Use only: (a) numbers from the research notes with their source named inline, (b) the author's first-hand notes marked "in our experience" or "when we built…", or (c) well-established publicly known figures. No made-up percentages.
- Weave in the author's first-hand notes as real experience ("When we built…", "On one project…"). Do not fabricate client names unless they are in the ABOUT section.

STRUCTURE (also for GEO/AI-search citations):
- Write every <h2> as the question a reader would actually search. Put a complete 2-sentence answer in the first <p> directly under that heading — no warm-up. These two sentences must make sense copied out of context, because AI search tools lift them verbatim.
- Vary sentence length. Short paragraphs (1-4 sentences). No fluff summaries at the end of sections.
- Where the topic suits it, include a step-by-step section: one <h3> per step with the number in the heading text ("Step 1: Define the core workflow"), followed by <p> paragraphs. NEVER put headings, paragraphs or images inside <li> — list items hold a single line of plain or bold text only.
- Use 5-8 <h2> sections, <h3> sub-points where useful, bullet lists, and at most one table if it genuinely helps comparison.
- 1,800-2,400 words. End with a short, practical next step (not "In conclusion").
- Mention ${studio ? "the studio (Rhinon Labs)" : brand} at most twice, naturally, with one call to action linking to the target page.

SEO:
- Include the primary search phrase in the first 100 words, one <h2>, and the meta description — naturally, with normal capitalisation.
- After the body, include a visible FAQ section (this will be rendered separately — still include in html as <h2>Frequently Asked Questions</h2> followed by <h3> question / <p> answer pairs, 4-6 questions). These questions must be ones the reader would actually type into Google or ask an AI.`;

function buildWritePrompt(topic: TopicInput, notes: string, links: LinkTarget[], company: string): string {
  return `You are writing a blog post for the ${topic.brand?.name ?? "Rhinon Labs"} website.

ABOUT THE COMPANY (for context and the CTA only):
${company.slice(0, 2500)}

TOPIC: "${topic.title}"
${topic.keyword ? `PRIMARY SEARCH PHRASE: "${topic.keyword}" — use it in the title, the first 100 words, one <h2>, and the meta description, naturally, with normal capitalisation (write "MVP development cost in India", never the raw lowercase phrase).` : ""}
${topic.audience ? `READER: ${topic.audience}` : ""}
${topic.notes ? `AUTHOR'S FIRST-HAND NOTES (use these, they make the post credible):\n${topic.notes}` : ""}
${topic.targetPage ? `TARGET PAGE for the call to action: ${topic.targetPage}` : ""}

RESEARCH NOTES:
${notes || "(none — rely on well-established knowledge, avoid specific statistics)"}

INTERNAL LINKS you may use (2-4 of them, only where genuinely relevant, as <a href="PATH">natural anchor text</a>):
${links.map((l) => `- ${l.title} -> ${l.path}`).join("\n") || "- (none)"}

${styleGuide(topic.brand?.name ?? "Rhinon Labs", !topic.brand)}

IMAGES: ${topic.withImages ? `Place 2-3 image markers where a visual genuinely helps (a process diagram-like illustration, a comparison, a concept). A marker is its own paragraph exactly like <p>[[IMAGE 1]]</p>, numbered from 1. For each, provide a detailed visual prompt describing an editorial illustration (no text in the image) and descriptive alt text.` : "Do not include image markers."}

Return ONLY a JSON object with this shape:
{
  "title": "compelling title, max 65 chars, includes the search phrase",
  "slug": "short-kebab-case-slug",
  "excerpt": "1-2 sentence summary for the blog card, max 200 chars",
  "metaTitle": "max 60 chars",
  "metaDescription": "max 155 chars, includes the search phrase, written to earn the click",
  "category": "one short category, e.g. ${topic.brand ? "Sales, Inbox, People, AI, Projects" : "MVP Development, Automation, AI Agents"}",
  "tags": ["3-6 lowercase tags"],
  "html": "the full article body as HTML using only h2, h3, p, ul, ol, li, strong, em, a, blockquote, table, thead, tbody, tr, th, td. No <h1>, no title repeated at the top, no inline styles.",
  "faqs": [{"question": "...", "answer": "2-4 sentence answer"}],
  "images": [{"marker": 1, "prompt": "...", "alt": "..."}],
  "coverPrompt": "visual prompt for the 16:9 cover illustration, no text"
}
Include 4-5 FAQs that are not already answered verbatim in the body.`;
}

/**
 * The editor (TipTap) cannot hold a heading inside a list item: it splits the
 * item, leaving an empty "1." or bullet above every heading. If the model still
 * wraps steps as <li><h3>…</h3><p>…</p></li>, unwrap them into numbered <h3>
 * steps. Lists made only of simple items are left alone.
 */
export function unwrapBlockLists(html: string): string {
  return html.replace(/<(ol|ul)\b[^>]*>([\s\S]*?)<\/\1>/gi, (whole, tag: string, inner: string) => {
    if (!/<li\b[^>]*>\s*<(h[1-6]|p|img|blockquote|table)\b/i.test(inner)) return whole;
    const items = inner.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) || [];
    return items
      .map((li, i) => {
        let body = li.replace(/^<li\b[^>]*>/i, "").replace(/<\/li>$/i, "").trim();
        if (tag.toLowerCase() === "ol") {
          // Number the step in its heading so the order survives the unwrap.
          body = body.replace(/<h([2-6])\b[^>]*>\s*(?!step\s*\d)/i, (_m, lvl) => `<h${lvl}>Step ${i + 1}: `);
        }
        if (!/^<(h[1-6]|p|img|blockquote|table)\b/i.test(body)) body = `<p>${body}</p>`;
        return body;
      })
      .join("\n");
  });
}

/** Keeps only the markup the editor and site render; drops scripts, handlers and styles. */
function sanitizeHtml(html: string): string {
  return unwrapBlockLists(html)
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?(h1|html|body|head|div|span|section|article)\b[^>]*>/gi, "")
    .replace(/\s(on\w+|style|class|id)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
    .trim();
}

function parseJson(text: string): any {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("The model did not return valid JSON");
    return JSON.parse(m[0]);
  }
}

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export async function generateBlogDraft(topic: TopicInput, links: LinkTarget[]): Promise<GeneratedDraft> {
  if (!env.geminiApiKey) throw new Error("GEMINI_API_KEY not configured");

  const notes = await research(topic);
  const raw = await generate({
    contents: [{ parts: [{ text: buildWritePrompt(topic, notes, links, topic.brand ? topic.brand.about : getSalesMemory()) }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.8 },
  });
  const out = parseJson(raw);
  if (!out?.title || !out?.html) throw new Error("The draft came back without a title or body");

  let html = sanitizeHtml(String(out.html));
  const imageErrors: string[] = [];
  let coverImage: string | null = null;

  const images: { marker: number; prompt: string; alt: string }[] = Array.isArray(out.images) ? out.images : [];
  if (topic.withImages) {
    // Sequential: image calls are slow and rate-limited; a burst tends to 429.
    for (const img of images) {
      const marker = new RegExp(`<p>\\s*\\[\\[IMAGE ${Number(img.marker)}\\]\\]\\s*</p>`, "g");
      try {
        const url = await generateBlogImage(String(img.prompt || out.title));
        html = html.replace(marker, `<img src="${url}" alt="${escapeAttr(String(img.alt || ""))}">`);
      } catch (err: any) {
        imageErrors.push(`Image ${img.marker}: ${err.message}`);
      }
    }
    try {
      coverImage = await generateBlogImage(String(out.coverPrompt || `Cover illustration for an article titled "${out.title}"`));
    } catch (err: any) {
      imageErrors.push(`Cover: ${err.message}`);
    }
  }
  // Any marker that didn't get an image is removed rather than left in the draft.
  html = html.replace(/<p>\s*\[\[IMAGE \d+\]\]\s*<\/p>/g, "");

  return {
    title: String(out.title).slice(0, 250),
    slug: String(out.slug || out.title),
    excerpt: String(out.excerpt || "").slice(0, 400),
    metaTitle: String(out.metaTitle || out.title).slice(0, 70),
    metaDescription: String(out.metaDescription || out.excerpt || "").slice(0, 170),
    category: String(out.category || "").slice(0, 60),
    tags: (Array.isArray(out.tags) ? out.tags : []).map((t: unknown) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 6),
    html,
    faqs: (Array.isArray(out.faqs) ? out.faqs : [])
      .filter((f: any) => f?.question && f?.answer)
      .map((f: any) => ({ question: String(f.question), answer: String(f.answer) }))
      .slice(0, 6),
    coverImage,
    imageErrors,
  };
}

/** ~200 words per minute, matching the editor's computeReadTimeFromHtml. */
export function readTimeFor(html: string): string {
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}
