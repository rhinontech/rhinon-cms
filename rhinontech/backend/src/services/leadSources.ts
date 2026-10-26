/**
 * Third-party lead sources used by the Lead Finder, each on its free plan.
 * Every function returns [] / null when its key is missing, the quota is spent
 * or the call fails, so the finder simply carries on with what it has.
 *
 *   HUNTER_API_KEY            Hunter domain search — people + emails at a domain
 *   SERPER_API_KEY            Serper (Google results) — real LinkedIn profiles
 *   SNOV_CLIENT_ID / _SECRET  Snov domain emails
 *   APOLLO_API_KEY            Apollo organisation enrich (free plan: company only)
 */

export interface SourcePerson {
  name: string;
  title: string | null;
  linkedin: string | null;
  email: string | null;
  /** 0–100 when the source rates its email. */
  emailScore: number | null;
}

export interface CompanyInfo {
  name: string | null;
  employees: number | null;
  linkedin: string | null;
  industry: string | null;
}

const TIMEOUT = 20_000;

async function getJson(url: string, init?: RequestInit): Promise<any | null> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) {
      console.warn(`[LeadSources] ${new URL(url).host} → HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`[LeadSources] ${new URL(url).host} failed: ${err?.message}`);
    return null;
  }
}

/** Hunter domain search: named people with emails Hunter has seen or derived. */
export async function hunterDomain(domain: string): Promise<{ people: SourcePerson[]; pattern: string | null; generic: string[] }> {
  const key = process.env.HUNTER_API_KEY;
  if (!key) return { people: [], pattern: null, generic: [] };
  const d = await getJson(`https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=10&api_key=${encodeURIComponent(key)}`);
  const emails: any[] = d?.data?.emails ?? [];
  const people: SourcePerson[] = [];
  const generic: string[] = [];
  for (const e of emails) {
    if (!e?.value) continue;
    const name = [e.first_name, e.last_name].filter(Boolean).join(" ").trim();
    if (!name) {
      generic.push(String(e.value).toLowerCase());
      continue;
    }
    people.push({
      name,
      title: e.position || null,
      linkedin: e.linkedin || null,
      email: String(e.value).toLowerCase(),
      emailScore: typeof e.confidence === "number" ? e.confidence : null,
    });
  }
  // Hunter writes patterns as "{first}.{last}"; the finder uses "first.last".
  const pattern = typeof d?.data?.pattern === "string" ? d.data.pattern.replace(/[{}]/g, "").replace(/^f$/, "first") : null;
  return { people, pattern, generic };
}

/**
 * LinkedIn profiles through Google (Serper). Only results whose title or
 * snippet mentions the company are kept — a bare name match pulls in strangers.
 */
export async function serperLinkedIn(company: string, domain: string): Promise<SourcePerson[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];
  const brand = domain.split(".")[0];
  const d = await getJson("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: `site:linkedin.com/in ("${company}" OR "${domain}")`, num: 10 }),
  });
  const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const needles = [squash(company), squash(brand)].filter((n) => n.length >= 4);
  const out: SourcePerson[] = [];
  for (const r of (d?.organic ?? []) as any[]) {
    const link = String(r.link ?? "");
    if (!/linkedin\.com\/in\//.test(link)) continue;
    const hay = squash(`${r.title ?? ""} ${r.snippet ?? ""}`);
    if (!needles.some((n) => hay.includes(n))) continue;
    // "Venkat Chennamsetty - Owner - Slick Blinds LLC | LinkedIn"
    const [namePart, ...rest] = String(r.title ?? "").replace(/\s*\|\s*LinkedIn.*$/i, "").split(/\s+[-–|]\s+/);
    const name = namePart?.trim() ?? "";
    // Profiles named after the company ("Owner at slick blinds") aren't a person.
    if (!name || squash(name).includes(needles[0] ?? "\0") || !/\s/.test(name)) continue;
    out.push({ name, title: rest.join(" · ").trim() || null, linkedin: link.split("?")[0], email: null, emailScore: null });
  }
  return out;
}

let snovToken: { value: string; until: number } | null = null;

async function snovAuth(): Promise<string | null> {
  const id = process.env.SNOV_CLIENT_ID;
  const secret = process.env.SNOV_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (snovToken && snovToken.until > Date.now()) return snovToken.value;
  const d = await getJson("https://api.snov.io/v1/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: id, client_secret: secret }),
  });
  if (!d?.access_token) return null;
  snovToken = { value: d.access_token, until: Date.now() + ((d.expires_in ?? 3600) - 60) * 1000 };
  return snovToken.value;
}

/** Snov: addresses it has seen at the domain (personal ones carry a name when known). */
export async function snovDomain(domain: string): Promise<{ people: SourcePerson[]; generic: string[] }> {
  const token = await snovAuth();
  if (!token) return { people: [], generic: [] };
  const d = await getJson(`https://api.snov.io/v2/domain-emails-with-info?domain=${encodeURIComponent(domain)}&type=all&limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const people: SourcePerson[] = [];
  const generic: string[] = [];
  for (const e of (d?.emails ?? d?.data ?? []) as any[]) {
    const email = String(e?.email ?? "").toLowerCase();
    if (!email) continue;
    const name = [e.firstName, e.lastName].filter(Boolean).join(" ").trim();
    if (name) people.push({ name, title: e.position || null, linkedin: null, email, emailScore: null });
    else generic.push(email);
  }
  return { people, generic };
}

/** Apollo organisation enrich — the one Apollo endpoint the free plan allows. */
export async function apolloCompany(domain: string): Promise<CompanyInfo | null> {
  const key = process.env.APOLLO_API_KEY;
  if (!key) return null;
  const d = await getJson(`https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`, {
    headers: { "X-Api-Key": key },
  });
  const o = d?.organization;
  if (!o) return null;
  return {
    name: o.name ?? null,
    employees: typeof o.estimated_num_employees === "number" ? o.estimated_num_employees : null,
    linkedin: o.linkedin_url ?? null,
    industry: o.industry ?? null,
  };
}
