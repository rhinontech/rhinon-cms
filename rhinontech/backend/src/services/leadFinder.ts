import dns from "node:dns/promises";
import * as cheerio from "cheerio";
import { generateGroundedContent } from "./gemini";
import { fetchText, htmlToText } from "./chatbot/extract";
import { apolloCompany, CompanyInfo, hunterDomain, serperLinkedIn, snovDomain, SourcePerson } from "./leadSources";

/**
 * Lead Finder (free sources): company name or website in → the people who run it
 * and their most likely work emails out. Nothing is saved or emailed here; the
 * admin reviews the result and imports the rows it wants into the CRM.
 *
 *   1. Domain — given, or found by Gemini with Google Search grounding.
 *   2. Website — home/about/team/contact/careers pages, read with the chatbot's
 *      SSRF-guarded fetcher: emails shown on the site, and the page text.
 *   3. People — leadership named on the site plus a grounded web search.
 *   4. Emails — an address published on the site wins ("found"); else the
 *      company's own pattern learned from its published addresses ("pattern");
 *      else common patterns ("guess"). The domain's MX record is checked.
 *
 * What it can't do: confirm a guessed mailbox exists. That needs an SMTP probe
 * on port 25, which EC2 blocks — so guesses are labelled, never presented as
 * verified.
 */

export type EmailConfidence = "found" | "pattern" | "guess";

export interface FinderPerson {
  name: string;
  title: string | null;
  linkedinUrl: string | null;
  email: string | null;
  confidence: EmailConfidence | null;
  /** Other likely addresses when the main one is a guess. */
  alternatives: string[];
  /** Where we learned about this person (the first source). */
  source: PersonSource;
  /** Every source that named them — two or more is a cross-checked person. */
  sources: PersonSource[];
}

export type PersonSource = "website" | "web search" | "hunter" | "linkedin" | "snov";

export interface FinderResult {
  company: string;
  domain: string;
  website: string;
  /** The domain accepts mail (has MX records). */
  acceptsMail: boolean;
  /** Addresses published on the company's own pages. */
  publishedEmails: string[];
  /** The address format the company uses, when we could tell, e.g. "first.last". */
  pattern: Pattern | null;
  people: FinderPerson[];
  /** Company details from Apollo, when it knows the domain. */
  companyInfo: CompanyInfo | null;
  notes: string[];
}

const PATTERNS = ["first.last", "first", "firstlast", "flast", "f.last", "first_last", "firstl", "last"] as const;
type Pattern = (typeof PATTERNS)[number];

const PAGES = ["", "/about", "/about-us", "/team", "/our-team", "/leadership", "/company", "/contact", "/contact-us", "/careers"];
const GENERIC = /^(info|hello|hi|contact|support|sales|admin|team|careers|jobs|hr|office|enquiries|enquiry|help|noreply|no-reply|press|media|marketing|billing|accounts|privacy|legal|security)$/i;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

// ── helpers ────────────────────────────────────────────────────────────

const ascii = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, "")
    .replace(/['-]/g, "")
    .trim();

function nameParts(full: string): { first: string; last: string } | null {
  // Drop titles and initials-only tokens ("Dr.", "Mr", "A.").
  const parts = ascii(full.replace(/\b(dr|mr|mrs|ms|prof)\.?\s+/gi, ""))
    .split(/\s+/)
    .filter((p) => p.length > 1);
  if (!parts.length) return null;
  return { first: parts[0], last: parts.length > 1 ? parts[parts.length - 1] : "" };
}

function emailFor(pattern: Pattern, first: string, last: string, domain: string): string | null {
  if (!last && pattern !== "first") return null;
  const local = {
    "first.last": `${first}.${last}`,
    first,
    firstlast: `${first}${last}`,
    flast: `${first[0]}${last}`,
    "f.last": `${first[0]}.${last}`,
    first_last: `${first}_${last}`,
    firstl: `${first}${last[0] ?? ""}`,
    last,
  }[pattern];
  return local ? `${local}@${domain}` : null;
}

/** Which pattern produced this local part for this person, if any. */
function patternOf(local: string, first: string, last: string): Pattern | null {
  for (const p of PATTERNS) {
    const e = emailFor(p, first, last, "x");
    if (e && e.split("@")[0] === local) return p;
  }
  return null;
}

function normalizeDomain(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  try {
    const host = new URL(raw.includes("://") ? raw : `https://${raw}`).hostname.replace(/^www\./, "");
    return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) ? host : null;
  } catch {
    return null;
  }
}

/** First JSON object or array in a model reply (it sometimes wraps it in prose or fences). */
function parseJson<T>(text: string): T | null {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  try {
    return JSON.parse(m ? m[1] : text) as T;
  } catch {
    return null;
  }
}

async function acceptsMail(domain: string): Promise<boolean> {
  try {
    return (await dns.resolveMx(domain)).length > 0;
  } catch {
    return false;
  }
}

// ── steps ──────────────────────────────────────────────────────────────

async function findDomain(company: string): Promise<{ domain: string; name: string } | null> {
  const reply = await generateGroundedContent(
    `Find the official website of the company "${company}". Reply with JSON only: {"name": "<official company name>", "website": "<homepage URL>"}. ` +
      `Use the company's own site, not a directory, social profile or news article. If you can't find it, reply {"website": null}.`,
    { fallback: false }
  ).catch(() => "");
  const d = parseJson<{ name?: string; website?: string | null }>(reply);
  const domain = d?.website ? normalizeDomain(d.website) : null;
  return domain ? { domain, name: d?.name?.trim() || company } : null;
}

async function readSite(domain: string): Promise<{ emails: Set<string>; text: string; linkedin: Map<string, string>; title: string }> {
  const emails = new Set<string>();
  const linkedin = new Map<string, string>(); // profile URL → link text
  const texts: string[] = [];
  let title = "";
  let pagesRead = 0;
  for (const path of PAGES) {
    if (pagesRead >= 6) break;
    const url = `https://${domain}${path}`;
    let body: string;
    try {
      ({ body } = await fetchText(url));
    } catch {
      continue; // missing page, blocked, or not HTML — try the next one
    }
    pagesRead++;
    const $ = cheerio.load(body);
    $('a[href^="mailto:"]').each((_, a) => {
      const addr = decodeURIComponent(($(a).attr("href") ?? "").slice(7).split("?")[0]).trim().toLowerCase();
      if (addr) emails.add(addr);
    });
    $('a[href*="linkedin.com/in/"]').each((_, a) => {
      const href = ($(a).attr("href") ?? "").split("?")[0];
      if (href) linkedin.set(href, $(a).text().trim() || $(a).attr("aria-label") || "");
    });
    const page = htmlToText(body);
    if (!title) title = page.title;
    for (const m of page.text.match(EMAIL_RE) ?? []) emails.add(m.toLowerCase());
    texts.push(`--- ${path || "/"} ---\n${page.text.slice(0, 5000)}`);
  }
  return { emails, text: texts.join("\n\n").slice(0, 20_000), linkedin, title };
}

interface RawPerson {
  name: string;
  title?: string | null;
  linkedin?: string | null;
}

const SHAPE = `JSON array only: [{"name":"","title":"","linkedin":"<linkedin.com/in URL or null>"}]. Empty array if none found.`;

/**
 * Several grounded searches at once, each looking somewhere different, so
 * small companies that aren't on "leadership" pages still turn up someone.
 */
async function findPeople(company: string, domain: string, siteText: string): Promise<{ site: RawPerson[]; web: RawPerson[] }> {
  const ask = (prompt: string) =>
    generateGroundedContent(prompt, { fallback: false })
      .then((t) => parseJson<RawPerson[]>(t) ?? [])
      .then((list) => (Array.isArray(list) ? list : []))
      .catch(() => [] as RawPerson[]);
  const who = `${company} (website ${domain})`;
  const [site, ...web] = await Promise.all([
    siteText
      ? ask(
          `From this text taken from ${domain}'s own website, list the people who work there with their job titles. ` +
            `Only people actually named in the text; do not add anyone. JSON array only: [{"name":"","title":""}]. Empty array if none.\n\n${siteText}`
        )
      : Promise.resolve([] as RawPerson[]),
    ask(
      `Who are the founders and senior leaders (CEO, CTO, COO, heads of departments) of ${who}? ` +
        `Only people you find evidence for, current roles only. ${SHAPE}`
    ),
    ask(
      `Search LinkedIn (linkedin.com/in profiles) for people who currently work at ${who}. ` +
        `Prefer founders, owners, directors, managers and anyone in sales, marketing or partnerships. Up to 15 people. ${SHAPE}`
    ),
    ask(
      `Find the founders, directors or owners of ${who} from company registries and startup databases ` +
        `(MCA / Zauba / Tofler for India, Companies House, OpenCorporates, Crunchbase, Tracxn, YC, Product Hunt, AngelList/Wellfound). ${SHAPE}`
    ),
    ask(
      `Find people from ${who} named in news articles, interviews, podcasts, funding announcements, conference talks, ` +
        `job posts ("reach out to …"), GitHub or X/Twitter bios. Current employees only. ${SHAPE}`
    ),
  ]);
  let found = web.flat();
  if (!site.length && !found.length) {
    // Nothing anywhere: one wider try that accepts anyone tied to the company.
    found = await ask(
      `I need any real person connected to ${company} — its website is ${domain}. Search the web broadly: the founder, owner, ` +
        `the person who registered or runs it, anyone who posts on its behalf, or anyone who lists it as their employer. ` +
        `Also try searching just the domain "${domain}". Only real people with evidence. ${SHAPE}`
    );
  }
  return { site, web: found };
}

/** Shared inboxes small companies usually read, used when no person is found. */
const ROLE_INBOXES = ["founders", "founder", "ceo", "hello", "contact", "sales"];

/**
 * The email format the company uses, from public "email format" pages
 * (RocketReach, Hunter and similar publish e.g. "first@acme.com (82%)").
 * Only accepted when it names one of our known patterns.
 */
async function publicPattern(company: string, domain: string): Promise<{ pattern: Pattern; evidence: string } | null> {
  const reply = await generateGroundedContent(
    `What email address format does ${company} (${domain}) use for its employees? Look for public email-format data ` +
      `(e.g. RocketReach, Hunter, ContactOut) or real employee addresses at @${domain}. ` +
      `Reply with JSON only: {"pattern": one of ${JSON.stringify(PATTERNS)} or null, "evidence": "<short source note>"}. ` +
      `Use null unless you found real evidence for ${domain}.`,
    { fallback: false }
  ).catch(() => "");
  const d = parseJson<{ pattern?: string | null; evidence?: string }>(reply);
  return d?.pattern && (PATTERNS as readonly string[]).includes(d.pattern)
    ? { pattern: d.pattern as Pattern, evidence: (d.evidence ?? "").slice(0, 160) }
    : null;
}

// ── main ───────────────────────────────────────────────────────────────

export async function findLeads(input: { company?: string; website?: string }): Promise<FinderResult> {
  const notes: string[] = [];
  let company = (input.company ?? "").trim();
  let domain = input.website ? normalizeDomain(input.website) : null;

  if (!domain) {
    if (!company) throw new Error("Give a company name or its website.");
    const found = await findDomain(company);
    if (!found) throw new Error(`Couldn't find a website for "${company}". Try giving its website instead.`);
    domain = found.domain;
    company = found.name;
    notes.push(`Website found by search: ${domain}`);
  }

  // Everything that only needs the domain runs at once.
  const [site, mx, hunter, snov, apollo] = await Promise.all([
    readSite(domain),
    acceptsMail(domain),
    hunterDomain(domain),
    snovDomain(domain),
    apolloCompany(domain),
  ]);
  if (!company) company = apollo?.name || site.title.split(/[|–—-]/)[0].trim() || domain;
  if (!site.text) notes.push("The website couldn't be read (blocked or not public), so only web search was used.");
  if (!mx) notes.push(`${domain} has no mail servers (MX) — addresses at this domain won't receive mail.`);

  const published = [
    ...new Set([...site.emails, ...hunter.generic, ...snov.generic].filter((e) => e.endsWith(`@${domain}`) || e.endsWith(`.${domain}`))),
  ];
  const [{ site: sitePeople, web: webPeople }, linkedInPeople] = await Promise.all([
    findPeople(company, domain, site.text),
    serperLinkedIn(company, domain),
  ]);

  // Merge people by normalised name. Each source that names someone is recorded,
  // so a person two tools agree on ranks above one only a search mentioned.
  const people = new Map<string, FinderPerson>();
  const add = (p: RawPerson | SourcePerson, source: PersonSource, email?: string | null) => {
    const parts = p?.name ? nameParts(p.name) : null;
    if (!parts) return;
    const key = `${parts.first} ${parts.last}`;
    const raw = p.linkedin ?? null;
    const linkedinUrl = raw && /linkedin\.com\/in\//.test(raw) ? raw.split("?")[0] : null;
    const mail = email && email.endsWith(`@${domain}`) ? email : null;
    const existing = people.get(key);
    if (existing) {
      existing.title ||= p.title?.trim() || null;
      existing.linkedinUrl ||= linkedinUrl;
      if (!existing.sources.includes(source)) existing.sources.push(source);
      if (mail && !existing.email) {
        existing.email = mail;
        existing.confidence = "found";
      }
      return;
    }
    people.set(key, {
      name: p.name.trim(),
      title: p.title?.trim() || null,
      linkedinUrl,
      email: mail,
      confidence: mail ? "found" : null,
      alternatives: [],
      source,
      sources: [source],
    });
  };
  hunter.people.forEach((p) => add(p, "hunter", p.email));
  snov.people.forEach((p) => add(p, "snov", p.email));
  sitePeople.forEach((p) => add(p, "website"));
  // LinkedIn profiles linked from their own site (team pages often link them).
  for (const [url, text] of site.linkedin) {
    const slug = url.match(/linkedin\.com\/in\/([^/]+)/)?.[1] ?? "";
    const fromSlug = decodeURIComponent(slug).replace(/-[0-9a-z]*\d[0-9a-z]*$/i, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const name = /\s/.test(text.trim()) && text.trim().length < 60 ? text.trim() : fromSlug;
    if (name) add({ name, linkedin: url }, "website");
  }
  linkedInPeople.forEach((p) => add(p, "linkedin"));
  webPeople.forEach((p) => add(p, "web search"));

  // Learn the company's pattern from published addresses that belong to a named person.
  const votes = new Map<Pattern, number>();
  const personal = published.filter((e) => !GENERIC.test(e.split("@")[0]));
  for (const p of people.values()) {
    const parts = nameParts(p.name)!;
    for (const e of p.email ? [p.email] : personal) {
      const pat = patternOf(e.split("@")[0], parts.first, parts.last);
      if (pat) {
        p.email = e;
        p.confidence = "found";
        votes.set(pat, (votes.get(pat) ?? 0) + 1);
      }
    }
  }
  let pattern: Pattern | null = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  if (pattern) notes.push(`Learned from their website: addresses look like ${pattern}@${domain}.`);
  else if (hunter.pattern && (PATTERNS as readonly string[]).includes(hunter.pattern)) {
    pattern = hunter.pattern as Pattern;
    notes.push(`Hunter says addresses look like ${pattern}@${domain}.`);
  } else if (people.size) {
    const pub = await publicPattern(company, domain);
    if (pub) {
      pattern = pub.pattern;
      notes.push(`Public email-format data says ${pattern}@${domain}${pub.evidence ? ` (${pub.evidence})` : ""}.`);
    }
  }

  for (const p of people.values()) {
    if (p.email) continue;
    const { first, last } = nameParts(p.name)!;
    if (pattern) {
      p.email = emailFor(pattern, first, last, domain);
      p.confidence = p.email ? "pattern" : null;
      // Many companies accept several forms (paul@ and paul.copplestone@), so keep the usual ones too.
      p.alternatives = (["first", "first.last", "flast"] as Pattern[])
        .map((pt) => emailFor(pt, first, last, domain))
        .filter((e): e is string => Boolean(e) && e !== p.email);
    }
    if (!p.email) {
      // Most common at small companies first.
      const guesses = (["first", "first.last", "flast", "firstlast"] as Pattern[])
        .map((pt) => emailFor(pt, first, last, domain))
        .filter((e): e is string => Boolean(e));
      p.email = guesses[0] ?? null;
      p.alternatives = guesses.slice(1);
      p.confidence = p.email ? "guess" : null;
    }
  }

  if (!people.size && mx) {
    // Last resort: shared inboxes. Published ones first, then the usual names to check with Verify.
    const publishedGeneric = published.filter((e) => GENERIC.test(e.split("@")[0]) || e.startsWith("founder"));
    for (const e of publishedGeneric) {
      people.set(e, { name: "Team inbox", title: "Listed on their website", linkedinUrl: null, email: e, confidence: "found", alternatives: [], source: "website", sources: ["website"] });
    }
    const guesses = ROLE_INBOXES.map((local) => `${local}@${domain}`).filter((e) => !publishedGeneric.includes(e));
    people.set("role", {
      name: "Founder / team inbox",
      title: "No named person found — an inbox small teams usually read",
      linkedinUrl: null,
      email: guesses[0],
      confidence: "guess",
      alternatives: guesses.slice(1),
      source: "web search",
      sources: ["web search"],
    });
    notes.push("No named person found anywhere, so shared inboxes are listed. Use Verify to find the one that exists.");
  }

  const rank: Record<string, number> = { found: 0, pattern: 1, guess: 2 };
  return {
    company,
    domain,
    website: `https://${domain}`,
    acceptsMail: mx,
    publishedEmails: published,
    pattern,
    people: [...people.values()].sort(
      (a, b) => b.sources.length - a.sources.length || (rank[a.confidence ?? "z"] ?? 3) - (rank[b.confidence ?? "z"] ?? 3)
    ),
    companyInfo: apollo,
    notes,
  };
}
