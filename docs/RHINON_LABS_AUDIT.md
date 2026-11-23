# Rhinon Labs — Website, SEO & Growth Audit

**Date:** 23 November 2026
**Site:** https://www.rhinonlabs.com
**Scope:** technical SEO, content, authority, brand and entity, AI search, conversion, measurement, positioning
**Method:** live crawl of all 46 sitemap URLs, review of the `rhinonlabs/` codebase (commit `3cbd252`), the public CMS API, and DataForSEO data for Google India and Google US. Sources and limits are listed in section 14.

---

## 1. Executive summary

**Objective:** turn rhinonlabs.com into a dependable source of qualified inbound leads in India and the US.

**Where Rhinon Labs stands:** the website has a sound technical base (server rendering, clean canonicals, schema, sitemap, llms.txt, fast desktop performance). Commercially, it is pre-traction:

- **Search visibility is effectively zero.** DataForSEO finds no ranking keywords in the top 100 for rhinonlabs.com in India or the US.
- **Google does not recognise the brand.** A search for "rhinonlabs" is rewritten to "Rhino Labs" and shows other companies. The site is not on page 1 for its own name.
- **There is no third-party trust.** All 31 linking domains are spam, the Google Business Profile has 0 reviews, and the site has no testimonials.
- **The lead form turns buyers away.** Every "Book a Free Discovery Call" button opens a form that requires an "Institution Type" whose only options are education categories (K-12 School, Preschool, Higher Education…).
- **Four published articles are blank** because of a data bug, and the About page returns 404.

Today almost every lead has to come from outbound and personal network. The fastest gains will not come from more content. They will come from fixing the form, repairing broken pages, publishing proof, and making the brand findable. After that, rankings for commercial terms depend on building genuine authority over the next 3–6 months.

### Scorecard

Scores are a judgement based on the evidence in this report.

| Area | Score | Summary |
|---|---|---|
| Technical foundation | 7/10 | Good base; three serious bugs (blank posts, About 404, proof hidden from crawlers) and heavy HTML |
| On-page SEO | 6/10 | Unique titles, one H1 per page, FAQs; cannibalisation and duplicated brand in titles |
| Content | 4/10 | 26 posts, 22 readable; mass-published, India-only, few sources, 4 blank |
| Authority (backlinks) | 0/10 | No editorial links; 31 spam domains |
| Brand / entity | 1/10 | Google confuses "Rhinon" with "Rhino" |
| Trust (E-E-A-T, proof) | 2/10 | No About page, no testimonials, 0 reviews, own products shown as clients |
| Conversion | 2/10 | Lead form blocks target buyers; no pricing signal |
| AI-search readiness | 4/10 | robots.txt and llms.txt done well; 0 AI mentions; proof hidden from AI crawlers |
| Measurement | 2/10 | GA4 records no lead events |
| Organic visibility (outcome) | 0/10 | 0 ranking keywords |

### The 10 issues that matter most

| ID | Issue | Severity | Effort |
|---|---|---|---|
| C-01 | Discovery-call form requires EdTech answers | Critical | 2–4 h |
| C-02 | Four live posts render without their article body | Critical | 0.5–1 day |
| C-03 | `/about` redirects to a 404; every author link points there | Critical | 1–2 days |
| C-04 | Google does not recognise the brand name | Critical | Ongoing |
| C-05 | No editorial backlinks; all 31 linking domains are spam | Critical | Ongoing |
| C-06 | Claims exceed proof (no testimonials, 0 reviews, own products shown as clients) | Critical | 2–4 weeks |
| H-01 | Case studies are invisible to crawlers (fetched in the browser only) | High | 2–4 h |
| H-02 | Blog posts compete with service pages for the same keywords | High | 1–2 days |
| H-03 | Headline terms get ~10 searches/month; no page targets "AI automation agency" | High | 2–3 days |
| H-04 | 15 of 26 posts have no service CTA; service pages link to blank posts | High | 0.5 day |

The full register of 38 issues is in section 4.

---

## 2. Current situation

| Item | Finding |
|---|---|
| Business | Product and automation studio in Hyderabad. Six services: MVP development, AI agents, workflow automation, internal dashboards, websites/web apps, mobile apps |
| Age in search | First backlink seen 6 Aug 2026; first blog post 17 Jul 2026 |
| Pages | 46 URLs in the sitemap: 11 core pages, 6 service pages, 26 blog posts, 3 case studies. All return 200 |
| Publishing cadence | 10 posts in Jul–Aug, 0 in Sep, 16 between 20 Oct and 16 Nov (10 of them between 11 and 16 Nov) |
| Organic rankings | 0 keywords in the top 100 (DataForSEO, Google India and US) |
| Brand search | Site not in the top 10 for "rhinon labs" or "rhinonlabs" |
| Backlinks | 33 links from 31 domains; backlink spam score 63/100; 0 editorial |
| Reviews | Google Business Profile exists ("Software company"), 0 reviews |
| AI assistants | 0 mentions of rhinonlabs.com in ChatGPT answers (DataForSEO LLM mentions) |
| Proof | 3 case studies (2 client projects, 1 own product), 0 testimonials |
| Performance (desktop lab) | Lighthouse 98 performance, 92 accessibility, 100 best practices, 100 SEO; LCP 0.98 s; CLS 0.003 |
| Lead path | Every primary CTA opens one booking form (`SchedulerCore`) |

---

## 3. Positioning analysis

### 3.1 What the site says about itself

The site describes the company in eight different ways. Visitors, Google, and AI assistants each get a different answer to "what does Rhinon Labs do?".

| Where | Message |
|---|---|
| Default title (`app/layout.tsx:63`) | "Ship Your Product 3x Faster Without Hiring a Tech Team" |
| Homepage title and Open Graph | "Custom AI Automation & Internal Dashboards" |
| Homepage Twitter card (`app/page.tsx:21`) | "AI MVP Development & Custom Software Studio" |
| Homepage H1 | "AI Automation & Custom Software that Scales Your Operations." |
| Hero eyebrow | "Your Go-To Operations Scaling Partner" |
| About page metadata | "…for Indian startups and SMBs" |
| Schema and llms.txt | "product and automation studio … for startups and growing businesses", area served "Worldwide" |
| `/build` | "Have a Startup Idea? Let's Build It." |

### 3.2 Who the site is for

Two different buyers share one funnel:

- **SMB operators** (owners, COOs, ops heads) who want automation, AI agents, and dashboards. They land on the homepage and service pages.
- **Aspiring and first-time founders** with an idea and no team. They land on `/build` and the MVP pages. The page's keyword notes even include students.

Both are valid markets, but they have different budgets, questions, and sales cycles. They need separate paths, messages, and form fields.

### 3.3 The site's words vs the words buyers search

Monthly Google searches, DataForSEO, November 2026.

| Term | Where the site uses it | India | US |
|---|---|---|---|
| custom dashboard development | Homepage title, dashboards service | 10 | — |
| internal tools development | Homepage positioning | 10 | — |
| AI automation agency | Not targeted by any page | 2,900 | 4,400 |
| AI agent development company | AI agents service and one blog post | 1,900 | 590 |
| MVP development services | MVP service | 590 | 320 |

The homepage leads with terms that almost nobody searches. The largest commercial term in the category has no page.

### 3.4 Claims vs evidence

| Claim on the site | Evidence found |
|---|---|
| "Trusted by 20+ startups and SMBs worldwide" (`lib/site.ts:40`, llms.txt) | 2 client case studies; 6 names in the logo strip, at least one of which is Rhinon's own platform |
| "Trusted by startups and SMBs across India" (hero) | Contradicts "worldwide" elsewhere |
| "Most of our clients recover the cost by reclaiming 50+ hours weekly … within the 90 days" (homepage FAQ) | No case study or testimonial mentions hours saved |
| Five-star row and three avatars labelled "Rhinon Labs client" (hero) | 0 Google reviews; no review-platform profile |
| "OUR CLIENTS — Real Results. Real Impact" (case-study grid) | Includes FurrCircle, which the site itself calls "our own flagship product" |
| AI agents and automation lead the homepage | 0 AI or automation case studies |

### 3.5 Strengths to build on

- **Real AI build experience.** The Rhinon Tech Company OS (AI lead research, outbound engine, RAG chatbot with live handoff, HR and payroll automation) is exactly what the AI-agents and internal-tools pages sell. Presented honestly as "built for our own company", it is the strongest proof available.
- **A construction niche already exists.** 2 of 3 client case studies are construction: Apexis Pro (drawings, snags, RFIs, handover) and SR Fitout (interior fit-out intake portal).
- **Buyer-friendly delivery promises.** Fixed scope, 2–4 weeks, weekly staging releases, full code ownership.
- **A strong technical base,** so fixes take effect quickly once authority grows.

### 3.6 Recommended position

- **Primary:** "AI automation agency for startups and SMBs. We build AI agents, workflow automations and internal tools in fixed-scope 2–4-week sprints." This matches the largest commercial demand in the category and the strongest real proof.
- **Secondary pillar:** MVP development for non-technical founders. Keep `/build` as a separate campaign funnel with its own form.
- **Market split:** India pages priced in ₹; a US page with USD pricing, time-zone overlap, and contract/IP terms.
- **Niche test:** a construction and fit-out software page backed by Apexis Pro and SR Fitout.

---

## 4. Issue register

**Severity scale**
- **Critical:** losing leads now or blocking all growth. Fix this week.
- **High:** significant ranking or conversion impact. Fix within 30 days.
- **Medium:** noticeable but secondary. Fix within 60–90 days.
- **Low:** hygiene.

| ID | Issue | Severity | Area | Effort | Owner |
|---|---|---|---|---|---|
| C-01 | Discovery-call form requires EdTech answers | Critical | Conversion | 2–4 h | Dev |
| C-02 | Four live posts render without their article body | Critical | Content / technical | 0.5–1 day | Dev |
| C-03 | `/about` redirects to a 404; author links point there | Critical | Trust / technical | 1–2 days | Dev + Founder |
| C-04 | Google does not recognise the brand name | Critical | Brand / entity | Ongoing | Founder + Marketing |
| C-05 | No editorial backlinks; all 31 linking domains are spam | Critical | Authority | Ongoing | Marketing |
| C-06 | Claims exceed proof | Critical | Trust / conversion | 2–4 weeks | Founder + Content |
| H-01 | Case studies fetched in the browser only, invisible to crawlers | High | Technical | 2–4 h | Dev |
| H-02 | Keyword cannibalisation (blogs vs service pages, blog vs blog) | High | On-page | 1–2 days | Content + Dev |
| H-03 | Positioning built on low-demand terms; messages conflict | High | Strategy | 2–3 days | Founder |
| H-04 | Stale related-content mapping: no service CTA on 15 posts | High | Conversion / linking | 0.5 day | Dev |
| H-05 | Thin contextual internal linking; no topic hubs | High | On-page | 2–3 days | Content |
| H-06 | Author signals broken (wrong brand, 404 URL, no bio) | High | E-E-A-T | 1 day | Dev + Founder |
| H-07 | Mass-published content with unsourced claims | High | Content quality | Ongoing | Content |
| H-08 | No conversion tracking | High | Measurement | 0.5–1 day | Dev |
| H-09 | Indexing not monitored; non-www URLs in Google's index | High | Technical | 0.5 day | Dev |
| H-10 | No visibility in AI search | High | GEO | Ongoing | Marketing |
| H-11 | Google Business Profile unused; address missing from site | High | Local / trust | 1 day | Founder |
| H-12 | No pricing signal; mixed currencies | High | Conversion | 1 day | Founder |
| H-13 | US expansion goal not supported by any page | High | Strategy | 3–5 days | Founder + Content |
| M-01 | Heavy pages (694 KB HTML, duplicated CSS, 281 KB JS) | Medium | Performance | 1–2 days | Dev |
| M-02 | Brand name duplicated in 4 titles | Medium | On-page | 15 min | Dev |
| M-03 | Meta descriptions too long or cut mid-word (7 pages) | Medium | On-page | 1 h | Content |
| M-04 | Stale or inconsistent years in titles; years in slugs | Medium | On-page | 0.5 day | Content + Dev |
| M-05 | Tool pages are thin; CRM ROI tool targets ~40 searches/month | Medium | Content | 1–2 days | Content |
| M-06 | Case-study pages are thin; titles are just project names | Medium | Content | 1 day each | Content |
| M-07 | Off-topic posts dilute topical focus | Medium | Content | 2 h | Content |
| M-08 | Inconsistent blog categories; category URLs are query strings | Medium | Architecture | 1 day | Dev + Content |
| M-09 | Wrong read times; "Updated on" shows the publish date | Medium | UX / trust | 1 h | Dev |
| M-10 | Privacy policy names no legal entity or privacy contact | Medium | Trust / compliance | 2 h | Founder |
| M-11 | Informative images without alt text; 4 MB+ source images | Medium | Accessibility / performance | 2–3 h | Dev |
| M-12 | Duplicated text in the DOM (marquee ×3, carousels ×2) | Medium | Technical | 1–2 h | Dev |
| M-13 | Generic copy that doesn't differentiate | Medium | Copy | 1–2 days | Founder + Content |
| L-01 | Two-hop redirect from `http://rhinonlabs.com` | Low | Technical | 15 min | Dev |
| L-02 | Service schema on every page; Organization schema incomplete | Low | Schema | 1–2 h | Dev |
| L-03 | Generic H1s on hub pages | Low | On-page | 30 min | Content |
| L-04 | Homepage depends on images hosted on Framer's CDN | Low | Technical | 30 min | Dev |
| L-05 | "Terms" and "Privacy Policy" in the booking form are not links | Low | Trust | 15 min | Dev |
| L-06 | Dead code and placeholder content that could be re-enabled by mistake | Low | Hygiene | 1 h | Dev |

---

## 5. Critical issues

### C-01 · The discovery-call form requires EdTech answers

**Severity:** Critical · **Area:** Conversion · **Effort:** 2–4 h · **Owner:** Dev

**Evidence**
- `rhinonlabs/components/Common/CTA/SchedulerCore.tsx:580–605` has a required **"Institution Type"** field. Its only options are Higher Education, Coaching & Training Institute, Consultants, EdTech, K-12 School, Preschool & Playschool, and Online Degree.
- `SchedulerCore.tsx:607–629` has a required **"Annual Lead Volume"** field (Under 10k, 10k–50k, 50k–100k, Above 100k).
- `SchedulerCore.tsx:564–578` makes **"Organization Website"** required, as a `type="url"` input that rejects addresses without `https://`.
- This form sits behind every primary CTA: the header, the hero, the homepage services section, `ElevateCTA`, the sticky call button on every blog post, the case-studies page, and `/schedule-call`.

**Why it matters:** a founder, SMB owner, or construction firm has no truthful answer to "Institution Type", so they either abandon or pick a random option. Every channel (SEO, LinkedIn, outbound, referrals) converts through this form, so it caps lead volume no matter how much traffic arrives. The answers collected are also useless for qualifying leads.

**Fix**
1. Replace "Institution Type" with **"What do you want to build?"**: MVP, AI agent, Workflow automation, Internal dashboard, Website, Mobile app, Not sure yet.
2. Replace "Annual Lead Volume" with optional **"Budget range"** and **"Ideal start date"**.
3. Make "Website" optional (first-time founders often have none) and accept it without `https://`.
4. Turn "Terms" and "Privacy Policy" into links (see L-05).
5. Update `PlatformLeadPayload` in `rhinonlabs/lib/api.ts:113–123` and the admin lead view to match.

**Expected impact:** the highest-leverage fix in this report. It raises booked calls from the traffic you already have.

**How to validate:** book a test call end to end. Once GA4 events are live (H-08), track form opened → call booked weekly.

---

### C-02 · Four live posts render without their article body

**Severity:** Critical · **Area:** Content / technical · **Effort:** 0.5–1 day · **Owner:** Dev

**Evidence:** each live page shows only one short appended paragraph plus the FAQs. The full article still exists in the CMS.

| Post | Words shown on the live page | Words stored in the CMS | Read time shown |
|---|---|---|---|
| `/blogs/how-long-does-it-take-to-build-an-mvp-india-guide` | 32 | 1,812 | 9 min |
| `/blogs/mobile-app-development-cost-startups-india` | 41 | 1,581 | 8 min |
| `/blogs/freelancer-vs-agency-for-mvp-india-guide` | 43 | 1,446 | 7 min |
| `/blogs/ai-agent-security-for-businesses-india-2027` | 47 | 1,409 | 7 min |

- **Root cause:** `contentBlocks` for these rows is an array whose first element is the original block list stored as a JSON *string* (encoded twice for the security post), followed by an appended internal-link block (`mvp-cost-link-block2`, `furrcircle-link-block`, `mvp-cost-link-block`, `geo-link-block`). `normalizeBlog()` in `rhinonlabs/lib/api.ts:80–93` only unwraps the field when the whole field is a string, so the renderer skips element 0. The script that appended the link blocks is not in the repo, so it was a one-off data write.
- Google indexed these pages while they were intact. Its snippet for the freelancer post quotes "expect to pay between ₹50,000 and ₹1.5 lakh", text that is no longer on the page. The next crawl will find a near-empty page.
- Two service pages link **only** to these blank posts: `/services/mvp-development` → the MVP timeline post, and `/services/mobile-app-development` → the mobile cost post.

**Why it matters:** pages that lose their content get demoted or treated as soft 404s, and they drag down site-wide quality signals. Visitors arriving from service pages hit an empty article.

**Fix**
1. **Repair the data.** For each affected row, parse element 0 repeatedly until it is an array, then save `[...parsedBlocks, linkBlock]`. Then query blogs and case studies for any other row whose `contentBlocks` contains a non-object element.
2. **Harden `normalizeBlog()`** so it flattens string elements inside the array (parse until you reach an object or array). One bad write should never blank a page again.
3. **Validate on write.** Reject non-object blocks in the content API, and fix whatever tool appends link blocks so it writes proper arrays.
4. Request re-indexing of the 4 URLs in Google Search Console.
5. After the repair, merge the mobile cost post into the stronger one (see H-02).

**How to validate:** each live page shows more than 1,000 words of body text. GSC URL Inspection shows the article.

---

### C-03 · `/about` redirects to a 404, and every author link points there

**Severity:** Critical · **Area:** Trust / technical · **Effort:** 1–2 days · **Owner:** Dev + Founder

**Evidence**
- Verified on 23 Nov 2026: `https://www.rhinonlabs.com/about` → 308 → `/_about` → **404**.
- Cause: `rhinonlabs/next.config.ts:42–46` redirects `/about` to `/_about`, and `rhinonlabs/app/_about/` is a Next.js private folder. Folders starting with `_` are excluded from routing.
- The BlogPosting schema on all 26 posts sets `author.url` to `/about` (`rhinonlabs/app/blogs/[slug]/page.tsx:153`).
- The navigation has no About link.

**Why it matters:** for a services firm, About and Team are among the most-visited pages before a sales call. Buyers, especially in the US, check who is behind a company before they book. Google's quality guidelines look for who is responsible for a site. An author URL that 404s breaks the author's entity signals on every post.

**Fix**
1. Rename `app/_about` to `app/about` and delete the redirect.
2. Rebuild the content:
   - Founder story and photo.
   - Real team members. The Team component holds placeholder names ("Ryan Smith", "Levi Smith", "Eren Smith") and is commented out; keep it off until it has real people.
   - Company facts: legal entity, Hyderabad address, founding year.
   - How Rhinon Labs relates to Rhinon Tech.
   - Process, values, and LinkedIn links.
3. Add About to the header and footer.
4. Point `author.url` to a real author page (see H-06).

**How to validate:** `/about` returns 200 with real content. Google's Rich Results Test on any post shows a working author URL.

---

### C-04 · Google does not recognise the brand name

**Severity:** Critical · **Area:** Brand / entity · **Effort:** ongoing · **Owner:** Founder + Marketing

**Evidence** (Google India, 23 Nov 2026)
- **"rhinon labs":** rhinonlabs.com is not in the organic top 10. Results show the "Rhino Lab" workout app, a Miami IT agency called "Rhinolabs", and "Ranyn Labs". A knowledge panel for "Rhinon Labs — Software company" (your Google Business Profile) appears, with "Be the first to review".
- **"rhinonlabs"** (the exact domain name): Google rewrites the query to "Rhino Labs". Its AI Overview describes Rhino Labs Inc. (Santa Clara hardware), Rhino Security Labs (Seattle), and a supplement store. The knowledge panel is "Rhino Labs — Laboratory in Norman, Oklahoma". rhinonlabs.com does not appear.
- The Organization schema `sameAs` lists only LinkedIn, X, and Instagram, and none of those profiles shows up in the brand results. No Clutch, GoodFirms, Crunchbase, or directory profiles were found.

**Why it matters:** anyone who hears the name (a LinkedIn post, an outbound email, a referral, an event) and searches for it lands on other companies. This leaks leads from every channel, not just SEO. It also stops AI assistants from describing the company.

**Fix**
1. Create or complete entity profiles with the identical name, description, logo, URL, and address: Google Business Profile (see H-11), LinkedIn company page, Crunchbase, Clutch, GoodFirms, DesignRush, a GitHub organisation, and Product Hunt for the free tools.
2. Add every profile to `sameAs` in `rhinonlabs/lib/site.ts`.
3. Have the founder and team list "Rhinon Labs" (linked to the company page) in their LinkedIn headline and experience.
4. With client permission, add a "Designed & built by Rhinon Labs" footer credit linking to the site on SR Fitout, Apexis Pro, RichHarbor, and Al Rooha.
5. Stopgap: run a small branded Google Ads campaign on "rhinon labs" and "rhinonlabs" so prospects find you while organic catches up.
6. Write the name the same way everywhere: "Rhinon Labs", two words.

**How to validate:** check the brand results monthly. Target position 1 for "rhinon labs" and an appearance for "rhinonlabs". Watch branded impressions in GSC.

---

### C-05 · No editorial backlinks; all 31 linking domains are spam

**Severity:** Critical · **Area:** Authority · **Effort:** ongoing · **Owner:** Marketing

**Evidence** (DataForSEO Backlinks, 23 Nov 2026)
- 33 backlinks from 31 referring domains (28 main domains). First link seen 6 Aug 2026. Backlink spam score 63/100.
- Every referring domain is unrelated or spam, for example `betwinnermirror.com` (betting mirror), `thcradar.com`, `uncledspizza.com`, `homesforsaleoldgreenwichct.com`, `colonrejuvenatorsite.com`, `fashionclothingnews.com`, `merrigoldfinance.com`, and two link-selling SEO sites, `rank-seo-now.shop` and `seonix.agency`. Individual spam scores are 60–70.
- No links from clients, directories, media, or partners.

**Benchmark:** the pages ranking in India for "ai agent development company" average about 19 referring domains. For "ai automation agency" the average is about 47, and for "mobile app development company india" it is about 107.

**Why it matters:** authority is the main constraint on rankings. Content and on-page fixes will not rank commercial pages without trustworthy links. Google mostly ignores spam links, but if any were bought (the two SEO-package domains suggest it's possible), that risks a manual action.

**Fix**
1. Confirm nobody bought a link package, and cancel any such service.
2. Mass disavow is not needed unless links were bought or GSC reports a manual action. If links were bought, disavow those domains.
3. Build 4–6 genuine links a month:
   - Client footer credits (C-04).
   - Clutch, GoodFirms, and DesignRush profiles.
   - Founder guest articles in Indian startup media (YourStory and Inc42 contributor programmes) and on automation and SaaS blogs.
   - Podcast guest spots.
   - Journalist-request platforms such as Qwoted and Featured.
   - Partner directories (n8n, Make, and Zapier expert listings; Supabase and Vercel showcases).
   - Free tools used as link magnets.
4. Ask to be included in the "top AI agencies in India" listicles that already rank (hexagondigital.in, torpedoweb.org, morismedia.in). These listicles also feed Google's AI Overviews.

**How to validate:** referring domains with a spam score under 30 grow by 4–6 a month. Track monthly in DataForSEO or Ahrefs.

---

### C-06 · Claims exceed proof

**Severity:** Critical · **Area:** Trust / conversion · **Effort:** 2–4 weeks · **Owner:** Founder + Content

**Evidence**
- **Testimonials:** none anywhere on the site. The spec in `rhinonlabs/Landing Page Changes.md` calls for a testimonials section; none is live.
- **Google reviews:** 0.
- **Case studies:** 3. One of them, FurrCircle, is described as "our own flagship product", yet the homepage grid above it is headed "OUR CLIENTS — Real Results. Real Impact" (`components/Pages/Home/CaseStudy/CaseStudies.tsx:40–45`).
- **Logo strip:** includes "Rhinon Tech — Admin dashboard", which is Rhinon's own platform. If "Saleszium — AI SaaS" is also a related product, it should be labelled that way.
- **Unverifiable claims:**
  - "Trusted by 20+ startups and SMBs worldwide" (`lib/site.ts:40`, llms.txt) vs "across India" in the hero.
  - "Most of our clients recover the cost by reclaiming 50+ hours weekly … within the 90 days" (homepage FAQ).
  - A five-star row with no rating source, and three avatars labelled "Rhinon Labs client" (`components/Pages/Home/Hero1/Hero.tsx:96–102`).
- **Impact section:** "Measurable Impact" lists inputs (2–4 weeks, weekly releases, 30+ tools), not client outcomes.
- **Lead services:** AI agents and workflow automation, which lead the homepage, have zero case studies (`relatedCaseStudies: []` in `lib/services.ts`).

**Why it matters:** B2B buyers, especially US buyers paying agency rates, buy on proof. Unverifiable statistics and decorative star ratings cost trust when a prospect checks. If the avatars are not real clients, they may also breach advertising rules (the US FTC rule on fake reviews and testimonials, and ASCI guidelines in India).

**Fix**
1. Collect at least 5 attributed testimonials (name, role, company, photo, written permission) from SR Fitout, Apexis Pro, RichHarbor, and Al Rooha. Show them on the homepage, service pages, and case studies.
2. Ask the same clients for Google reviews. Target 10 in 60 days.
3. Publish 2 new case studies:
   - RichHarbor or Al Rooha.
   - An AI/automation case study on the Rhinon Tech Company OS (AI lead research, outbound engine, RAG chatbot, HR automation), clearly labelled "built for our own company".
4. Rename the grid "Our work", or split it into "Client projects" and "Our products".
5. Remove or substantiate "20+", "50+ hours weekly", the star row, and the avatar labels. Replace them with real numbers from real projects.

**How to validate:** every claim on the site traces to a named source. 5 testimonials are live. Google reviews reach 10 or more.

---

## 6. High-priority issues

### H-01 · Case studies are fetched in the browser only, so crawlers can't see them

**Severity:** High · **Effort:** 2–4 h · **Owner:** Dev

**Evidence:** `CaseStudies` is a client component that fetches its data in `useEffect` (`components/Pages/Home/CaseStudy/CaseStudies.tsx:1, 15–21`). The server HTML of the homepage and all 6 service pages contains **zero links** to `/case-studies/*` (verified by fetching the raw HTML). AI crawlers (GPTBot, ClaudeBot, PerplexityBot) do not run JavaScript, and Google renders JavaScript later, in a second pass.

**Why it matters:** the site's strongest trust content is missing for the systems that decide rankings and AI citations, and no internal link value flows to the case studies.

**Fix:** fetch case studies on the server, the way `app/services/[slug]/page.tsx:51–54` already does for blogs, and pass them in as props. Keep `CaseStudies` purely presentational. Check for any other content fetched only in the browser.

**How to validate:** `curl -s https://www.rhinonlabs.com/ | grep "case-studies/"` returns links.

---

### H-02 · Pages compete with each other for the same keywords

**Severity:** High · **Effort:** 1–2 days · **Owner:** Content + Dev

| Intent / keyword | Competing pages | Fix |
|---|---|---|
| "ai agent development company" (1,900/mo India, KD 23) | `/services/ai-agents` (title "AI Agent Development Company for Businesses") vs `/blogs/ai-agent-development-company-guide` ("AI Agent Development Company: A Guide for Indian Startups") | The service page owns the term. Re-angle the post to "How to choose an AI agent development company (questions, costs, red flags)" and link it to the service page with that exact phrase |
| "custom dashboard development india" | `/services/internal-dashboards` vs `/blogs/custom-internal-dashboard-development-india` | The service page owns the term. Re-angle the post to "Internal dashboard cost in India (₹ ranges by scope)" |
| "mobile app development cost india" (880/mo) | `/blogs/mobile-app-development-cost-india-2027` vs `/blogs/mobile-app-development-cost-startups-india` | After the C-02 repair, merge the second into the first and 301 it |
| MVP cost vs timeline | `/blogs/mvp-development-cost-india-2027-guide` vs `/blogs/how-long-does-it-take-to-build-an-mvp-india-guide` (title says "Timelines & Costs") | Drop "Costs" from the timeline post's title and cross-link the two |
| Onboarding | `/blogs/automate-employee-onboarding-small-company`, `/blogs/automating-onboarding` (client onboarding), `/tools/employee-onboarding-checklist` | Make the titles clearly distinct (employee vs client onboarding) and link the employee post to the tool |

**Why it matters:** Google picks one URL per intent. Competing pages split the signals, and often the blog post outranks the service page, sending buyers to an article instead of a sales page.

**How to validate:** in GSC's Performance report, each target query maps to one URL.

---

### H-03 · Positioning is built on low-demand terms, and the messages conflict

**Severity:** High · **Effort:** 2–3 days · **Owner:** Founder

**Evidence:** see sections 3.1–3.3. The homepage leads with "Internal Dashboards" (about 10 searches/month in India). "AI automation agency" gets 2,900/month in India and 4,400/month in the US (KD 20/19, US cost per click $26.80), and no page targets it. The site uses eight different self-descriptions and serves two different buyers through one funnel.

**Note:** "AI automation agency" has mixed intent. Part of its results page is "how to start an AI automation agency" videos, so the buyer share of the 2,900 is smaller. It is still the largest commercial term in the category, and smaller competitors (for example Hevify Labs at `hevify.in/ai-automation-agency`) rank with dedicated pages.

**Why it matters:** positioning decides which searches you can win and whether visitors recognise themselves. Scattered messaging lowers conversion and confuses Google and AI assistants about what the company does.

**Fix**
1. Choose one primary positioning. The recommendation is in section 3.6.
2. Retitle the homepage, for example "AI Automation Agency for Startups & SMBs | Rhinon Labs", and align the H1 with it.
3. Use the same core sentence in the default title, Open Graph and Twitter tags, `lib/site.ts`, llms.txt, and the schema description.
4. Create an "AI automation agency" page, or make the homepage that page, with proof, process, pricing signal, and FAQs.
5. Keep `/build` as its own campaign funnel, with form fields suited to founders.
6. Test a construction and fit-out vertical page backed by the two construction case studies.

**How to validate:** GSC impressions for the "AI automation agency" query family; homepage conversion rate.

---

### H-04 · Stale related-content mapping: no service CTA on 15 posts

**Severity:** High · **Effort:** 0.5 day · **Owner:** Dev

**Evidence**
- The blog's "Matching Solution" banner and each service page's related reading are both driven by hand-maintained `relatedBlogs` arrays in `rhinonlabs/lib/services.ts` (lines 79, 123, 167–173, 217, 261, 305).
- Three slugs are wrong: `mvp-development-cost-india-2026-guide` (now `-2027-guide`), `ai-agent-security-for-businesses-india-2026` (now `-2027`), and the typo `ai-agents-vs-traditional-automatio`.
- Live check: **15 of 26 posts show no service CTA**, including every cost guide and the "AI agent development company" post. The full list is in Appendix A.
- Service pages:
  - `/services/mvp-development` links to 1 post, which is blank (C-02).
  - `/services/mobile-app-development` links to 1 post, which is also blank.
  - `/services/ai-agents` links to 1 of the 6 AI posts.
  - `/services/internal-dashboards` links to 2 older posts and none of the 3 November dashboard posts.

**Why it matters:** the posts with the highest buying intent have no path to a sales page, which costs conversions and starves the money pages of internal links.

**Fix**
1. Now: correct the arrays (Appendix B).
2. Durable fix: add a `service` field to Blog in the CMS editor and derive both mappings from it, or map by category.
3. Add a build-time check that fails if any `relatedBlogs` slug doesn't exist.

**How to validate:** every post shows a Matching Solution banner, and each service page lists 3–6 related posts.

---

### H-05 · Thin contextual internal linking and no topic hubs

**Severity:** High · **Effort:** 2–3 days · **Owner:** Content

**Evidence:** 16 of 26 posts contain exactly 1 internal link in the article body (all 10 July–August posts among them; for the 4 blank posts in C-02, that link is the appended block); the rest contain 2–6. No post links to a case study. The homepage links to no individual post or case study, only to the hub pages. There is no hub page per topic.

**Fix**
- Create a hub per cluster (MVP, AI agents, automation, dashboards). These can be "Guides" sections on the service pages.
- Give each post 3–5 contextual links: 1 service page with a descriptive anchor, 2 related posts, and 1 case study.
- Add server-rendered "Latest guides" and "Case studies" blocks to the homepage.

**How to validate:** every post has at least 3 in-body internal links, and a site crawl (for example with Screaming Frog) finds no orphan pages.

---

### H-06 · Author signals are broken

**Severity:** High · **Effort:** 1 day · **Owner:** Dev + Founder

**Evidence**
- 25 posts are bylined "Prabhat Patra — Founder @ Rhinon Tech", a different brand from the publisher (Rhinon Labs). One post is bylined "Rhinon Labs team — Product Studio".
- BlogPosting schema (`app/blogs/[slug]/page.tsx:149–158`):
  - `jobTitle` is "Founder @ Rhinon Tech".
  - `url` is `/about`, which returns 404 (C-03).
  - `sameAs` lists the company's LinkedIn and X pages, not the person's.
- The author role is hidden on the page (line 285 is commented out). There is no author bio box. The "Why trust our content" and "Reviewed by" blocks are commented out (lines 292–333). The fallback avatar is a GitHub image.
- Nothing on the site explains how Rhinon Labs relates to Rhinon Tech.

**Why it matters:** advice content on costs, security, and vendor choice needs a real, accountable author with visible experience. A byline naming a different brand muddies who the publisher is.

**Fix**
- Create an author page (`/authors/prabhat-patra` or a founder section on About) with bio, photo, LinkedIn, and projects shipped.
- Set `jobTitle` to "Founder, Rhinon Labs", and point `Person.sameAs` to the founder's own LinkedIn, X, and GitHub.
- Add a bio box under each post.
- Bring back an honest "How we write" note.
- Give the GEO post a named author.
- Explain the Rhinon Labs ↔ Rhinon Tech relationship on About, and add `parentOrganization` to the schema if it applies.

**How to validate:** Rich Results Test passes, and the author page is indexed.

---

### H-07 · Mass-published content with unsourced claims

**Severity:** High · **Effort:** ongoing · **Owner:** Content

**Evidence**
- **Cadence:** 16 posts between 20 Oct and 16 Nov, 10 of them in 11–16 Nov, produced with the admin AI Writer.
- **Unsourced facts:** the AI-agent security post says "On October 15, 2026, the Indian Computer Emergency Response Team (CERT-In) published an advisory…" and describes specific findings, with **0 external links**. All 16 posts published since 20 Oct have 0 external citations, except the GEO post (12). The July–August posts have 1–3 each.
- **Future-dated data:** titles and descriptions promise "2027 cost data (₹)" in November 2026.
- **Little first-hand evidence:** no post has images or diagrams in the body (cover images only), and few use screenshots or real project numbers.

**Why it matters:** Google's spam policies target content mass-produced mainly to rank, and its ranking systems reward first-hand experience. Unverifiable claims on security and cost topics lose trust when a reader checks. AI assistants prefer to cite pages that cite their own sources.

**Fix:** put every post through an editorial check before publishing:
- A human edit.
- At least 2 credible external citations for factual claims.
- At least 1 first-hand element (real numbers, a screenshot, a quote from a Rhinon project).
- No unverifiable statistics.

Verify the CERT-In advisory and link to it, or remove that section. Publish 1–2 posts a week. Refresh posts quarterly and show a "Last reviewed" date.

**How to validate:** the checklist is completed for every post; track engaged time in GA4 and impressions per post in GSC.

---

### H-08 · No conversion tracking

**Severity:** High · **Effort:** 0.5–1 day · **Owner:** Dev

**Evidence**
- GA4 (`G-HQ0812RTEQ`) only runs `gtag('config')`. No events fire for a booked call, a contact submission, a WhatsApp or phone click, or a tool completion (`components/Common/Analytics/GoogleAnalytics.tsx`).
- GA4 loads with `strategy="lazyOnload"`, which waits until the page is idle, so short visits often go unrecorded.
- Three trackers overlap: GA4, Rhinon `t.js` (`app/layout.tsx:135–140`), and `PageviewTracker` posting to `/public/track`.

**Why it matters:** without lead events you cannot tell which channel, page, or post produces leads, so content and SEO decisions are guesswork.

**Fix**
- Add GA4 key events: `generate_lead` (call booked, contact submitted), `book_call_open`, `click_whatsapp`, `click_phone`, `tool_complete`.
- Switch GA4 to `afterInteractive`.
- Link GA4 with GSC.
- Keep one first-party tracker.
- Store the source and UTM parameters on every lead (the payload already has a `source` field).

**How to validate:** events appear in GA4 DebugView, and a monthly "leads by landing page and channel" report exists.

---

### H-09 · Indexing is not monitored, and non-www URLs are in Google's index

**Severity:** High · **Effort:** 0.5 day · **Owner:** Dev

**Evidence**
- `site:rhinonlabs.com` and `site:rhinonlabs.com/blogs` each surface about 10 URLs on page 1. This is a rough method, and the full count needs GSC.
- Google lists 2 posts under the non-www host (`rhinonlabs.com/blogs/ai-agents-vs-traditional-automation`, `rhinonlabs.com/blogs/dependent-on-one-persons-memory`). The non-www → www redirect was added only recently.
- Google still shows an older title for `/services/ai-agents`.
- Verification status can't be confirmed from the code: there's no verification meta tag, though DNS verification is possible.

**Fix**
- Verify a GSC domain property (DNS) and Bing Webmaster Tools. Bing matters because ChatGPT search draws on Bing.
- Submit the sitemap to both.
- Review GSC's Pages report (crawled – not indexed, duplicates, soft 404s) and request indexing for the repaired posts.
- Watch the non-www URLs consolidate.
- IndexNow already pings on blog publish (`rhinontech/backend/src/services/indexNow.ts`); extend it to case-study and service updates.

**How to validate:** GSC's Pages report shows all 46 URLs indexed, or each exclusion is explained.

---

### H-10 · No visibility in AI search

**Severity:** High · **Effort:** ongoing · **Owner:** Marketing

**Evidence**
- DataForSEO LLM mentions: 0 mentions of rhinonlabs.com in ChatGPT answers.
- Google's AI Overview for "rhinonlabs" describes other companies.
- Google's AI Overview for "ai agent development company india" names Q3 Technologies, Webnox, Nimap, LeewayHertz, and Maruti Techlabs, citing a LinkedIn Pulse listicle and `integrax.in`.

**Already in place:** robots.txt explicitly allows AI crawlers; `/llms.txt` and `/llms-full.txt` exist; FAQ and Organization schema are in place.

**Gaps**
- Entity confusion (C-04).
- No third-party mentions or listicle inclusions.
- Case studies hidden from crawlers (H-01).
- No LinkedIn Pulse presence, although LinkedIn Pulse ranks in the top 3 for "mvp development cost india" and is cited in AI Overviews.

**Fix**
- Have the founder publish LinkedIn articles adapted from the best guides, linking back to the site.
- Contact listicle authors about inclusion.
- Get reviews on Clutch and GoodFirms (AI assistants cite them).
- Answer relevant Reddit and Quora threads genuinely.
- Keep the llms.txt facts in line with verified claims (drop "20+" unless it's true).
- Server-render all proof.

**How to validate:** quarterly checks in ChatGPT, Perplexity, and Gemini with prompts like "best AI automation agency in Hyderabad", plus DataForSEO LLM mentions.

---

### H-11 · Google Business Profile is unused, and the site shows no address

**Severity:** High · **Effort:** 1 day · **Owner:** Founder

**Evidence**
- A Google Business Profile exists ("Rhinon Labs — Software company", Hyderabad) with 0 reviews.
- A local pack appears for "ai automation agency" in India; the top entry is a Bengaluru agency rated 5.0 from 24 reviews.
- The site shows no street address or map. The footer has only "Send us an email", and the phone number appears only in the hero and on the contact page.

**Fix**
- Complete the profile: categories, services, description, photos, weekly posts, Q&A.
- Collect reviews (C-06).
- Show name, full address, phone, and email on the contact page and in the footer, exactly as on the profile.
- Add `ProfessionalService` schema with address and geo.
- Create a Hyderabad page only if there is real local work to show.

**How to validate:** the profile appears in local packs for "AI automation agency Hyderabad" and "software company Hyderabad"; track profile insights.

---

### H-12 · No pricing signal, and mixed currencies

**Severity:** High · **Effort:** 1 day · **Owner:** Founder

**Evidence**
- Service pages show no prices.
- The homepage FAQ answers "Is this expensive?" with "It's an investment…".
- Blog posts publish ₹ ranges (for example ₹4–25 lakh for an MVP), but the service pages don't.
- The homepage mixes currencies: a "₹18.4L" revenue card next to "see exactly where every dollar is stuck".

**Why it matters:** price anchors pre-qualify leads and help comparison shoppers decide. US buyers expect USD ranges.

**Fix**
- Show "starting at" packages, for example a fixed-fee automation audit, an MVP sprint from ₹X / $Y, and a retainer from a set monthly amount.
- Add a pricing FAQ.
- Use USD on US-facing pages.

**How to validate:** the share of leads whose budget fits, tracked in the CRM.

---

### H-13 · The US expansion goal isn't supported by any page

**Severity:** High · **Effort:** 3–5 days · **Owner:** Founder + Content

**Evidence**
- 12 of 26 post URLs contain "india", all cost content is in ₹, and the About metadata targets "Indian startups and SMBs". No page targets US buyers.
- US demand is meaningful:

| Keyword (US) | Monthly searches | Notes |
|---|---|---|
| ai automation agency | 4,400 | Cost per click $26.80 (vs $1.57 in India) |
| hire developers in india | 170 | Cost per click $161 |
| offshore software development company india | 140 | KD 18 |
| mvp development services | 320 | KD 7, cost per click $24.90 |

**Fix**
- Build a US funnel: an "Offshore AI & MVP team for US startups" page covering time-zone overlap, USD pricing, contract and IP/NDA terms, payment terms, and a case study relevant to US buyers.
- Publish guides written for US readers (for example "MVP development cost: US vs India teams").
- Target US founders on LinkedIn.
- Add hreflang only if you create true en-US and en-IN versions of the same pages.

**How to validate:** US sessions and leads in GA4; US impressions in GSC.

---

## 7. Medium-priority issues

### M-01 · Heavy pages put mobile performance at risk

**Evidence**
- The homepage HTML is about 694 KB uncompressed (about 83 KB over the wire with brotli):
  - 172 KB of inline CSS is duplicated again inside the 277 KB React Server Components payload. This is a side effect of `experimental.inlineCss: true` (`next.config.ts:6–8`).
  - Even `/privacy-terms` ships about 370 KB of HTML.
- JavaScript is 281 KB brotli across 15 chunks, and the total page weight is about 1.0 MB.
- Desktop Lighthouse is good (performance 98, LCP 0.98 s), but main-thread work is 2.6 s even unthrottled, which points to slow interactions (INP) on mid-range phones.
- Mobile field data (CrUX) couldn't be retrieved because the PageSpeed API quota was exhausted.

**Fix**
1. Check mobile Core Web Vitals in GSC.
2. Test turning off `inlineCss`, so CSS is cached across pages.
3. Reduce framer-motion use on the homepage.
4. Remove the duplicated DOM (M-12).
5. Confirm that the dynamically imported sections still deliver their text in the server HTML.

**Validate:** mobile LCP < 2.5 s and INP < 200 ms at p75 in CrUX.

### M-02 · Brand name duplicated in 4 titles

**Evidence:** the title template appends " | Rhinon Labs" to metadata that already contains "— Rhinon Labs":
- `/services/internal-dashboards`: "Custom Dashboard Development Services in India — Rhinon Labs | Rhinon Labs" (74 characters; `lib/services.ts:180`).
- `/tools`: "Free Tools for Founders & Small Teams — Rhinon Labs | Rhinon Labs".
- `/tools/crm-roi-calculator`: "Free CRM ROI Calculator — Rhinon Labs | Rhinon Labs".
- `/tools/employee-onboarding-checklist`: "Free Employee Onboarding Checklist Generator — Rhinon Labs | Rhinon Labs" (72 characters).

**Fix:** remove "— Rhinon Labs" from those four titles.

### M-03 · Meta descriptions too long or cut mid-word

**Evidence:** `/build` (173 characters), `/services/mvp-development` (169), `/blogs/spreadsheet-vs-dashboard-india` (170, ending mid-word "…in Indi"), `/blogs/mobile-app-development-cost-startups-india` (169), `/blogs/ai-agent-development-company-guide` (165), `/case-studies/furrcircle-…` (192), `/case-studies/srfitout` (190).

**Fix:** keep descriptions at 155 characters or fewer, as complete sentences.

### M-04 · Stale or inconsistent years in titles, and years in URLs

**Evidence**
- "AI Agents for Business: 7 Practical Use Cases **(2025)**", seen in November 2026.
- "Freelancer vs Agency for MVP in India **(2026** Costs & Guide)", whose description says "2027 cost data".
- "Spreadsheet vs Dashboard India … **(2026** Guide)".
- Three URLs contain a year (`mvp-development-cost-india-2027-guide`, `mobile-app-development-cost-india-2027`, `ai-agent-security-for-businesses-india-2027`), and one URL has already been changed from 2026 to 2027 with a redirect.

**Fix:** use year-free URLs, with 301s from the current ones. Put the year only in the title, keep it the same across title, description, and H1, and update it on a schedule.

### M-05 · Tool pages are thin, and one targets almost no demand

**Evidence**
- Page text: `/tools` 139 words, `/tools/crm-roi-calculator` 94, `/tools/employee-onboarding-checklist` 95. The tools themselves run in the browser.
- "crm roi calculator" gets about 40 searches/month in the US.
- "employee onboarding checklist" gets 480/month in the US (KD 2, cost per click $23) and averages 1,300/month in India. The India figure is spiky: 9,900 in Sep 2026, then 110 in Oct.

**Fix**
- Add 600–1,000 words of supporting content to each tool page: how to use it, the method, examples, and FAQs.
- Offer a downloadable template.
- Link the tools from related posts and promote them for links.
- Validate the search volume of any new calculator first (for example an "automation ROI" calculator).

### M-06 · Case-study pages are thin, and titles are just project names

**Evidence:** titles like "Apexis Pro | Rhinon Labs"; 400–620 words per page including site-wide text; descriptions over 190 characters.

**Fix:** use a consistent template:
- A title with outcome and service, for example "Apexis Pro: Construction Snagging & Handover SaaS (Web + iOS + Android) | Case Study".
- Client, problem, solution, stack, and timeline.
- Results with numbers.
- A client quote and screenshots.
- Links to the relevant service pages.

### M-07 · Off-topic posts dilute topical focus

**Evidence**
- `/blogs/generative-engine-optimization-strategies`: GEO is a marketing topic, and Rhinon Labs doesn't sell SEO. "Generative engine optimization" has KD 44–48, and the pages that rank for it average about 1,200 referring domains.
- `/blogs/event-registration-system` is a developer tutorial only loosely tied to the services.

**Fix:** reframe the GEO post around "how we build AI-readable product sites" or merge it into another post. Keep new content inside the four service clusters.

### M-08 · Inconsistent blog categories; category URLs are query strings

**Evidence**
- Categories include "AI" and "AI Agents" side by side, cost guides filed under "Projects", plus "People", "SEO", and "Operations".
- Breadcrumb schema points to `/blogs?category=AI`, a query string rather than a real category page.

**Fix:** use 4–5 categories that map to the services, each with a static, indexable category page (for example `/blogs/category/ai-agents`) that has an intro paragraph.

### M-09 · Wrong read times, and "Updated on" shows the publish date

**Evidence**
- Read times are stored as fixed strings: a 1,775-word post shows "4 min read", and blank posts show "7–9 min read".
- The byline says "Updated on" but renders `publishedAt` (`app/blogs/[slug]/page.tsx:288`).

**Fix:** calculate read time from word count (about 230 words per minute). Show "Published X · Updated Y" using the real dates.

### M-10 · Privacy policy names no legal entity or privacy contact

**Evidence:** `/privacy-terms` contains no company legal name, registered address, or privacy contact. No "Private Limited", "LLP", registered office, or GST text was found.

**Why it matters:** buyers' procurement checks look for it, and India's DPDP Act expects a contact for data requests.

**Fix:** add the legal entity, registered address, a privacy contact email, and a last-updated date.

### M-11 · Informative images without alt text, and oversized source images

**Evidence**
- 18 product screenshots on the homepage have `alt=""`.
- `/public` holds a 4.6 MB `assets/hero/3.png`, a 4.0 MB `assets/projects/alrooha/image.png`, and several other images of 1–3 MB.

**Fix:** write descriptive alt text for informative images. Compress the images or convert them to WebP/AVIF, and delete unused files.

### M-12 · Duplicated text in the DOM

**Evidence:** the "Sound familiar?" marquee items appear 3 times in the HTML, and the product cards appear twice (cloned for the infinite-scroll animation). Crawlers and screen readers get the repeated text.

**Fix:** mark the clones `aria-hidden="true"`, or animate a single set with CSS.

### M-13 · Generic copy that doesn't differentiate

**Evidence:** "Different systems that We Build", "Join us now and start transforming your vision into reality with expert support", "Your Go-To Operations Scaling Partner".

**Fix:** rewrite around specific outcomes and the real differentiators: fixed scope, weekly staging releases, full code ownership, AI-native delivery, and the in-house AI platform as proof.

---

## 8. Low-priority issues

| ID | Issue | Evidence | Fix |
|---|---|---|---|
| L-01 | Two-hop redirect | `http://rhinonlabs.com` → `https://rhinonlabs.com` → `https://www.rhinonlabs.com` | Configure the Vercel domain to send the apex straight to `https://www` |
| L-02 | Schema hygiene | Service + OfferCatalog schema is injected on every page, including the privacy page. Organization schema lacks `founder`, `foundingDate`, `legalName`, `email`, and a full address | Limit Service schema to service pages and complete the Organization node |
| L-03 | Generic H1s on hub pages | "Selected Works" (case studies), "The Founder's Journal" (blog), "Legal Transparency" (privacy) | Use descriptive H1s, for example "Case Studies: MVPs, AI Agents & Internal Tools We've Built" |
| L-04 | Third-party image dependency | The homepage loads 2 images from `framerusercontent.com`, left over from a Framer site | Host them on your own site |
| L-05 | Legal links missing in the booking form | "By proceeding, you agree to Rhinon Labs' Terms and Privacy Policy", where both are plain text (`SchedulerCore.tsx:657–659`) | Link both to `/privacy-terms` |
| L-06 | Dead code and placeholders | An unused old Hero with an 817 KB `heroVideo.mp4`; placeholder team names in the About Team component; a commented-out "Join 5,000+ Founders" newsletter CTA | Delete them, or keep them off until the content is real |

---

## 9. Keyword opportunity map

Verified data: DataForSEO Labs (Google), pulled 23 Nov 2026. Volumes are 12-month averages. KD = keyword difficulty (0–100). "Avg RDs" = average referring domains of the current top-10 pages.

| Keyword | India /mo | US /mo | KD (IN/US) | Avg RDs (IN) | Current page | Recommendation |
|---|---|---|---|---|---|---|
| ai automation agency | 2,900 | 4,400 | 20 / 19 | ~47 | None | New page or homepage retarget (H-03) |
| ai agent development company | 1,900 | 590 | 23 / — | ~19 | Service page + competing blog | Consolidate on the service page (H-02) |
| ai agents for business | 320 | 3,600* | 38 / 21 | ~589 | Blog | Strengthen with sources and proof |
| mobile app development company india | 3,600 | — | 34 | ~107 | Mobile service page | Long-term; needs authority |
| mobile app development cost india | 880 | — | — | ~14 | 2 competing blogs | Merge into one (H-02) |
| custom software development company india | 720 | — | 5 | ~218 | "How to choose" blog | Consider a dedicated landing page |
| mvp development services | 590 | 320 | 15 / 7 | ~15 | MVP service page | Primary target for the MVP page |
| mvp development company | 590 | 390 | — | ~4 | MVP service page | Secondary target |
| hire app developers india | 320 | — | 8 | ~49 | Blog | Keep; link to the mobile service |
| hire developers in india | — | 170 | — | — | None | US page (H-13) |
| offshore software development company india | — | 140 | — / 18 | — | None | US page (H-13) |
| workflow automation services | 170 | 170 | — / 18 | — | Automation service page | Keep |
| employee onboarding checklist | 1,300* | 480 | 19 / 2 | ~18 | Tool page | Add supporting content (M-05) |
| chatbot vs ai agent | 110 | 140 | — / 9 | — | Blog | Keep |
| n8n automation agency | 40 | 110 | — / 4 | — | None | Low-effort US page or section |
| custom dashboard development | 10 | — | — | — | Homepage title, service | Stop leading with it |
| internal tools development | 10 | — | — | — | Homepage | Stop leading with it |
| crm roi calculator | — | 40 | — | — | Tool page | Low value; promote as a lead magnet only |
| generative engine optimization | 2,400 | 4,400 | 48 / 44 | ~1,208 | Blog | Off-topic and out of reach (M-07) |

\* Spiky. "employee onboarding checklist" (India) hit 9,900 in Sep 2026 and 110 in Oct. "ai agents for business" (US) hit 18,100 in Aug 2026 and 1,600 in Oct.

---

## 10. Competitive landscape

What Google shows today (23 Nov 2026):

- **"ai automation agency" (India)**
  - Listicles: morismedia.in, legacyservices.in, hexagondigital.in, torpedoweb.org.
  - Agency service pages: acceron.in, bigagency.in, dpthub.com, hevify.in.
  - YouTube videos about *starting* an AI automation agency.
  - A local pack led by "Mrkhan – AI Automation Agency" (Bengaluru, 5.0 from 24 reviews).
- **"ai agent development company india"**
  - AI Overview citing a LinkedIn Pulse listicle, q3tech.com, webnox.in, integrax.in, nimapinfotech.com, and webshark.tech.
  - Organic: ampcome.com, agenticindia.in, softlabsgroup.com, revenuebase.ai, bigbrandbucket.com, growthhackers.digital, a LinkedIn post, noukha.in.
- **"mvp development cost india"**
  - databiqs.com, a LinkedIn Pulse article (#2), talentelgia.com, murmusoftwareinfotech.com, makeorbittech.in, kalptechnocrats.com, devtechnosys.com, shadhinlab.com.

**Takeaways**
1. Listicles and LinkedIn Pulse articles win both organic positions and AI Overview citations. Get included in the listicles, and publish on LinkedIn.
2. Small agencies rank with dedicated "AI automation agency" pages, so a dedicated page is the minimum requirement.
3. Local packs appear for agency searches, which makes Google reviews directly valuable.
4. Most cost guides that rank quote USD figures from established dev shops. First-hand, sourced ₹ data is a real differentiator, but only if it's credible.

---

## 11. What's already working (keep)

- Server-rendered pages with one H1 each, self-referencing canonicals, and unique titles and descriptions everywhere.
- A sitemap with real `lastmod` dates; robots.txt that welcomes AI crawlers; `/llms.txt` and `/llms-full.txt` generated from one source of truth (`lib/site.ts`).
- Organization, WebSite, Service, FAQPage, BreadcrumbList, BlogPosting, and WebApplication schema.
- IndexNow pings when a post is published.
- 308 redirects from non-www to www and from trailing slashes; a real 404 status for missing pages.
- Security headers. Desktop Lighthouse 98 / 92 / 100 / 100.
- 22 substantial posts (about 900–1,850 words) with FAQ sections and a table of contents.
- Service pages with a clear "for you if" section, process, outcomes, and FAQs.
- Free tools as a lead-magnet foundation.
- A Google Business Profile that already exists.

---

## 12. 90-day plan

### Week 1 — stop the leaks
- C-01: replace the booking-form fields.
- C-02: repair the 4 posts and harden `normalizeBlog()`.
- C-03: restore `/about` with a first real version.
- H-04: correct the `relatedBlogs` slugs (Appendix B).
- M-02 and M-03: fix the duplicate-brand titles and long descriptions.
- H-08: add GA4 lead events.
- H-09: verify GSC and Bing Webmaster Tools, submit the sitemap, and request indexing.
- C-06: email the four clients asking for testimonials and Google reviews.

### Weeks 2–4 — trust and structure
- H-01: server-render the case studies.
- H-02: merge the mobile cost posts and re-angle the two competing posts.
- H-03: decide the positioning, align the homepage and metadata, and create the "AI automation agency" page.
- H-06: create the author page and fix the author schema.
- H-11: complete the Google Business Profile and show the address on the site.
- C-04: create the LinkedIn, Crunchbase, Clutch, GoodFirms, and DesignRush profiles and add them to `sameAs`.
- C-05: get the first genuine links (client footer credits, directories).
- M-10: add the legal entity to the privacy policy.

### Weeks 5–8 — proof and demand capture
- C-06: publish 2 new case studies (Rhinon Tech Company OS and RichHarbor or Al Rooha) and put testimonials live.
- H-12: add pricing signals.
- H-13: publish the US page.
- H-05: do an internal-linking pass and add guide hubs to the service pages.
- H-07: run the quality check on all 26 posts (sources, years, first-hand detail).
- M-04, M-05, M-06: move to year-free URLs with 301s, add tool-page content, and apply the case-study template.

### Weeks 9–12 — authority and scale
- C-05: build 4–6 quality links a month and pitch listicle authors.
- H-10: publish 2 founder LinkedIn articles a month and take part genuinely in Reddit and Quora threads.
- M-01: do the performance work once mobile field data is reviewed.
- Publish 1–2 new posts a week targeting the keyword map (section 9).
- Review the KPIs monthly.

---

## 13. KPIs

| Metric | Baseline (23 Nov 2026) | 90-day target | Source |
|---|---|---|---|
| Booking-form completion rate | Not measured | Baseline set in week 1, then improving month on month | GA4 |
| Qualified leads from organic search per month | Not tracked (≈0) | 3–5 | GA4 + CRM |
| Indexed URLs | Unknown (`site:` suggests partial) | All 46, or exclusions explained | GSC |
| Non-brand keywords in top 100 | 0 | 50–100 | GSC / DataForSEO |
| Keywords in top 10 | 0 | 5–10 (long-tail) | GSC |
| Position for "rhinon labs" | Not in top 10 | 1 | Manual SERP check |
| Quality referring domains (spam score < 30) | 0 | 12–18 | DataForSEO / Ahrefs |
| Google reviews | 0 | 10+ | Google Business Profile |
| Attributed testimonials | 0 | 5+ | Site |
| Case studies with measured results | 0 of 3 | 5 | Site |
| AI-assistant mentions | 0 | First mentions for brand and Hyderabad queries | DataForSEO LLM mentions / manual prompts |
| Mobile Core Web Vitals (p75) | Unknown | LCP < 2.5 s, INP < 200 ms | GSC |

**Realistic outcome:** within 90 days the brand should be findable, the lead path unblocked, and the first long-tail rankings in place. For a new domain in a competitive category, steady organic lead flow typically takes 6–12 months, and its pace depends mostly on how fast genuine authority is built. In the short term, the biggest lead gains come from C-01, C-06, and C-04, because they improve conversion across every channel, including outbound and referrals.

---

## 14. Data sources and limitations

**Sources**
- A live fetch of all 46 sitemap URLs (Googlebot user agent), plus redirect, header, and HTML analysis, on 23 Nov 2026.
- Code review of `rhinonlabs/` at commit `3cbd252`.
- The public CMS API: `api.rhinontech.in/public/blogs?domain=rhinonlabs` and `/public/case-studies`.
- DataForSEO: Labs (ranked keywords, domain overview, keyword overview for India and US), SERP API (Google India and US), Backlinks API, LLM Mentions (ChatGPT), and Lighthouse (desktop).

**Limitations**
- No access to Google Search Console, GA4, CRM lead data, or social-media follower counts.
- Mobile field data (CrUX) couldn't be fetched because the public PageSpeed API quota was exhausted.
- Bing's index couldn't be checked: the `site:` operator isn't supported by the Bing SERP API.
- `site:` result counts are approximate.
- DataForSEO may miss very low-volume rankings. GSC is the source of truth for impressions.
- Search volumes are 12-month averages, and some are spiky (noted in section 9).
- The factual accuracy of individual blog claims (for example the CERT-In advisory) was not verified; the issue is that they cite no sources.

---

## Appendix A — Blog inventory (26 posts)

Article words are measured from the CMS body. In-body links are internal links inside the article. Service CTA is the "Matching Solution" banner on the live page.

| # | Post (`/blogs/…`) | Published | Article words | In-body links | Ext. links | Service CTA | Flags |
|---|---|---|---|---|---|---|---|
| 1 | time-triggered-email-automation | 17 Jul | 1,775 | 1 | 2 | Yes | Read time shows "4 min" |
| 2 | ai-agents-vs-traditional-automation | 17 Jul | 1,553 | 1 | 2 | No | Typo in `relatedBlogs`; indexed on non-www |
| 3 | automating-onboarding | 17 Jul | 1,850 | 1 | 2 | Yes | Title overlaps the employee-onboarding post |
| 4 | event-registration-system | 18 Jul | 1,682 | 1 | 3 | Yes | Loosely related to the services |
| 5 | automate-first-in-a-product-led-growth-motion | 4 Aug | 1,577 | 1 | 2 | Yes | — |
| 6 | chatbot-vs-ai-agent-real-difference | 4 Aug | 1,363 | 1 | 2 | Yes | — |
| 7 | zapier-vs-custom-automation | 4 Aug | 1,692 | 1 | 2 | Yes | — |
| 8 | why-arent-your-tools-talking-to-each-other | 4 Aug | 1,450 | 1 | 1 | Yes | — |
| 9 | dependent-on-one-persons-memory | 4 Aug | 1,419 | 1 | 1 | Yes | Indexed on non-www |
| 10 | who-actually-owns-ops-in-a-five-person-team | 5 Aug | 1,423 | 1 | 1 | Yes | — |
| 11 | mvp-development-cost-india-2027-guide | 20 Oct | 1,374 | 3 | 0 | No | Year in URL |
| 12 | mobile-app-development-cost-startups-india | 20 Oct | **41 live** (1,581 stored) | 1 | 0 | Yes | **Blank (C-02)**; competes with #24 |
| 13 | how-long-does-it-take-to-build-an-mvp-india-guide | 21 Oct | **32 live** (1,812 stored) | 1 | 0 | Yes | **Blank (C-02)**; overlaps #11 |
| 14 | ai-agent-security-for-businesses-india-2027 | 26 Oct | **47 live** (1,409 stored) | 1 | 0 | No | **Blank (C-02)**; unsourced CERT-In claims; year in URL |
| 15 | no-code-vs-custom-mvp-india-guide | 26 Oct | 899 | 1 | 0 | No | Shortest readable post |
| 16 | freelancer-vs-agency-for-mvp-india-guide | 1 Nov | **43 live** (1,446 stored) | 1 | 0 | No | **Blank (C-02)**; "2026" title vs "2027" description |
| 17 | internal-dashboards-operations-india-examples | 11 Nov | 1,125 | 3 | 0 | No | — |
| 18 | spreadsheet-vs-dashboard-india | 12 Nov | 1,507 | 2 | 0 | No | "(2026 Guide)"; description cut mid-word |
| 19 | custom-internal-dashboard-development-india | 12 Nov | 1,410 | 3 | 0 | No | Competes with `/services/internal-dashboards` |
| 20 | generative-engine-optimization-strategies | 13 Nov | 1,779 | 1 | 12 | No | Off-topic; author "Rhinon Labs team" |
| 21 | ai-agents-for-business-use-cases | 14 Nov | 1,632 | 4 | 0 | No | "(2025)" in title |
| 22 | ai-agent-development-company-guide | 15 Nov | 1,584 | 6 | 0 | No | Competes with `/services/ai-agents` |
| 23 | automate-employee-onboarding-small-company | 15 Nov | 1,478 | 5 | 0 | No | Should link to the onboarding tool |
| 24 | mobile-app-development-cost-india-2027 | 15 Nov | 1,473 | 5 | 0 | No | Year in URL |
| 25 | how-to-hire-app-developers-india-founders-guide | 15 Nov | 1,663 | 6 | 0 | No | — |
| 26 | how-to-choose-custom-software-development-company-india | 16 Nov | 1,761 | 2 | 0 | No | — |

All posts: author "Prabhat Patra — Founder @ Rhinon Tech" (except #20); cover image only, no in-body images.

---

## Appendix B — `relatedBlogs` corrections (`rhinonlabs/lib/services.ts`)

| Service | Change |
|---|---|
| `mvp-development` | Replace `mvp-development-cost-india-2026-guide` with `mvp-development-cost-india-2027-guide`. Add `no-code-vs-custom-mvp-india-guide`. Keep `how-long-does-it-take-to-build-an-mvp-india-guide` and add `freelancer-vs-agency-for-mvp-india-guide` once both are repaired (C-02) |
| `ai-agents` | Replace `ai-agents-vs-traditional-automatio` with `ai-agents-vs-traditional-automation`. Replace `ai-agent-security-for-businesses-india-2026` with `ai-agent-security-for-businesses-india-2027`. Add `ai-agent-development-company-guide` and `ai-agents-for-business-use-cases` |
| `workflow-automation` | Add `automate-employee-onboarding-small-company` |
| `internal-dashboards` | Add `custom-internal-dashboard-development-india`, `spreadsheet-vs-dashboard-india`, `internal-dashboards-operations-india-examples` |
| `web-development` | Add `how-to-choose-custom-software-development-company-india` |
| `mobile-app-development` | Add `mobile-app-development-cost-india-2027` and `how-to-hire-app-developers-india-founders-guide`. Remove `mobile-app-development-cost-startups-india` after the merge (H-02) |

Note: `getServiceByBlogSlug()` returns the first service whose list contains a slug, so list each post under one service only.
