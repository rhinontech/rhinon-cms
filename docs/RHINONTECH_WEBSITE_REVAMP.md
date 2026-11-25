# Rhinon Tech website revamp: niche, keywords and the full plan

**Date:** 26 November 2026
**Scope:** rhinontech.com (code in `rhinontech-site/`, Next.js 16) and how it presents the product at rhinontech.in.
**Replaces:** the positioning, sitemap and navigation sections of `docs/RHINONTECH_SITE_PLAN.md` (6 November). Its build notes still apply.

**Built from:**
- The product review, `docs/ADMIN_PANEL_LAUNCH_REVIEW.md` (24–25 November).
- The competitor study, `docs/RHINONTECH_SEO_COMPETITORS.md` (25 November).
- New keyword data from DataForSEO for Google India and the US (November 2026):
  - 175 niche searches;
  - 274 module searches;
  - two discovery runs;
  - two "who ranks" runs.
- The homepages of 9 competitors, read on 25 November.
- Checks of the live site on 25–26 November: screenshots, a throttled mobile speed test, HTML and JavaScript weight, the tracking container, and the code.

**How to read the numbers:**
- **Searches/mo** is DataForSEO's 12-month average.
- **Difficulty** is DataForSEO's keyword difficulty, 0 (easy) to 100.
- **Value per click** is the average Google Ads cost per click in US dollars. It shows how commercial a search is.
- **Change** is DataForSEO's change versus the same month a year earlier.

---

## Summary

### The niche

Rhinon Tech should be **the AI CRM for service businesses**. That means agencies, IT and software services firms, consultancies, and other B2B service teams of 5–50 people. India comes first and English-speaking markets second.

1. **It's where the product is strongest.** CRM and Projects (with the client portal) are the two modules the product review rates "Strong", and the hand-off from won deal to project to client portal already works.
2. **It's where demand is growing.** CRM is the fastest-growing large software category in both countries.
   - "crm software" is up 82% in the US (201,000 searches/mo) and 173% in India (74,000).
   - "ai crm" is up 171% in India.
3. **It's where Rhinon can win on Google.**
   - Agency and service-business searches are easy: 37 of 48 US searches have difficulty 20 or less.
   - They are also valuable: an average of $35 per click in the US, and up to $200.
4. **Nobody owns it.** HubSpot, Zoho, monday.com, HoneyBook, Productive and GoHighLevel each cover part of the client lifecycle. None carries a service client from the first website chat to a delivered project, in one app, with AI built in.

### The identity

- **Category:** "AI CRM for service businesses".
- **Promise:** "Win clients. Deliver the work. Keep them coming back."
- **Proof:** Rhinon Labs runs its own agency on it.
- **Words to avoid:** "AI workspace" and "business operating system". monday.com, Zoho and GoHighLevel already use them in their headlines.

### What changes

1. **The story leads with winning and delivering client work.** HR and payroll become "included for your team".
2. **Each product gets one name, the same on the site and in the app.** Three renames:
   - AI Chatbot → **AI Agent**;
   - Work → **Projects**;
   - Pages → **Docs**.
3. **New navigation:** Product, Solutions, AI, Compare, Pricing, Resources.
4. **About 60 new pages over 26 weeks, each aimed at one search with data behind it.** They break down as:
   - 5 solution pages;
   - 8 comparison pages;
   - 4 feature pages;
   - an India CRM page;
   - 2 free tools;
   - about 30 guides.
5. **Real product screenshots and short videos** replace the code-drawn mock-ups in the hero, alongside proof Rhinon can actually show.
6. **Speed.** On a throttled phone the home page takes 5.2 s to show its main content (LCP). The target is under 2.5 s.
7. **Conversion tracking.** Today there is none.

### Fix this week, before any redesign

| # | Problem | Evidence | Fix |
|---|---|---|---|
| 1 | The canonical tags, sitemap and robots.txt point to `www.rhinontech.com`, which permanently redirects to `rhinontech.com` | Checked 25 Nov: `www` returns 308 to the apex, but `<link rel="canonical">` and every sitemap `<loc>` use `www` | Set `NEXT_PUBLIC_SITE_URL=https://rhinontech.com` in Vercel and redeploy, or make `www` primary again |
| 2 | The home page's main content appears at 5.2 s on a phone | Lab test: first paint 1.7 s, main content (the H1) 5.2 s. The `.reveal` class sets `opacity: 0` until JavaScript runs | Don't wrap above-the-fold content in `Reveal` (section 7.3) |
| 3 | The site says "free for your whole team" in 8 places, but Free is 5 people | `config/plans.ts`: 5 seats, 50 emails and 20 AI drafts a day | Rewrite (launch review G0.1) |
| 4 | Sign-ups, demo bookings and contact leads aren't measured | GTM container `GTM-T8G5PP3T` loads GA4 (`G-M64NMV4Z5X`) but has 0 event tags and 0 conversion tags, and the site code pushes no events | Add GA4 key events and cross-domain tracking (section 7.6) |

**Status (26 November): done in code, built and verified locally, not deployed.**

| # | Fix | What changed | Still needed |
|---|---|---|---|
| 1 | Canonical host | The `SITE_URL` fallback is now `https://rhinontech.com`. The local build emits apex canonicals, `og:url`, sitemap URLs and the robots `Sitemap:` line | You: confirm `NEXT_PUBLIC_SITE_URL` isn't set to `www` in Vercel; resubmit the sitemap in Search Console after deploy |
| 2 | Hero speed | `.reveal` is visible by default. `Reveal` hides only blocks that start below the fold. The chat widget loads on first interaction or after about 6 s idle | Nothing. Local throttled test: main content 1.06 s, equal to first paint (live, same test: 4.9 s) |
| 3 | Free-plan claims | "Free for your whole team" and "No seats to count" replaced in about 50 places, including page metadata, FAQs, the schema offer, the sign-up modal and the Terms. Limits live in one constant (`content/plans.ts` → `FREE_PLAN`). Pricing now lists the limits and a "more than 5 people?" answer | You or legal: review the new Terms §4 wording. Phase 1: payroll "PF/PT/TDS" and inbox "assigned" copy |
| 4 | Conversion events | `lib/analytics.ts` pushes `signup_cta_click`, `signup_lead_submitted` (waits for GTM before the redirect), `contact_submitted` and `demo_booked` to `dataLayer` | You, in GTM: add Custom Event triggers and GA4 event tags for these four, mark them as key events in GA4, and set up cross-domain linking to rhinontech.in |

**Phase 1 status (26 November): built and verified locally, not yet committed.**

Built:
- **Category and copy:** "AI CRM for service businesses" across the home page, metadata, Open Graph images, footer and schema.
- **Product groups:** Win clients, Deliver the work, Run your team, with one colour each.
- **Renames:** AI Agent, Projects and Docs, with 301/308 redirects from `/product/chatbot`, `/product/work` and `/product/pages`.
- **Buttons:** navy primary buttons.
- **Navigation:** the top bar is Product, Rhinon AI, Pricing and Blog; Integrations and Security move into the Product menu and the footer.
- **New home page:** client loop, AI, built for, included, Rhinon Labs proof, pricing, FAQ with schema.
- **Pricing:** Free, Starter and Enterprise, plus a limits table driven by `content/plans.ts`.
- **About:** a new `/about` page.
- **Product pages:** titles and descriptions now target the §3.2 searches.
- **Inbox page:** rewritten to match the live product. No assignment, priority or status, and no inbound-address promise.
- **Payroll FAQ:** now says ESI isn't calculated and returns aren't filed.
- **Share images:** product alt text now comes from the product data.

Still open:
- real product screenshots (blocked on app UX U1–U6);
- the app's own renames (U3: Chatbot → AI Agent, Work → Projects, Pages → Docs);
- Solutions and Compare in the navigation (phase 2).

**Phase 1:** committed and pushed to beta as `4283636`.

**Phase 2, slice 1 (26 November): built and verified locally, uncommitted.**

Built:
- **Comparison pages (7) plus a hub at `/compare`:** Zoho One, HubSpot, Odoo, ClickUp, monday.com, HoneyBook and Chatbase.
  - Data lives in `content/compare.ts`, with a source list and a `lastChecked` date.
  - Values the competitor's page didn't show are marked "Not listed", never "No".
  - Each page has a "Choose them if" box.
- **Solution pages (5) plus a hub at `/solutions`:** agencies, consultancies, IT & software services, professional services, startups. Data lives in `content/solutions.ts`.
- **Navigation:** Solutions and Compare are in the top bar and the footer.
- **Home page:** the "Built for" cards now link to the solution pages.
- **Sitemap:** now 38 URLs. A comparison's last-modified date is its `lastChecked`.

Deferred:
- Teamwork comparison: its pages weren't read, so there are no verified facts yet.

**Phase 2, slice 2 (26 November): built and verified locally, uncommitted.**
- **Feature pages (4):** `/features/crm-with-project-management`, `/features/client-portal`, `/features/lead-management` and `/features/sales-pipeline`, from `content/features.ts`.
- **India page:** `/in/crm-software`.
- **Template:** `/templates/client-onboarding-checklist`, 24 steps.
- **Changelog:** `/changelog` (October and November, live features only).
- **Footer:** new Resources column.
- **Sitemap:** now 46 URLs.
- **`/customers/rhinon-labs`:** figures are aggregates read from the production database (read-only) on 26 November:
  - 5,503 leads; 10,268 outreach emails to 5,496 leads; 9,261 AI drafts;
  - 643 tasks across 9 projects; 127 project requests;
  - 20,188 inbox emails; 16 website chats; 11 people.
  - **Left out on purpose:** 0 deals and no deal → project conversions (stated on the page); the reply count of 32 (not published).
  - **An approval-flag gap:** leads show `draftApproved` = 0 everywhere, so the site's "nothing is sent without your approval" should be checked against how Outreach actually sends.

Still to build in phase 2:
- the AI email writer (public rate-limited endpoint and tool page implemented; pending beta deployment and verification);
- the Teamwork comparison (facts not checked yet);
- directory listings (your task).

### Being straight about "best in everything, now"

- **Ranking for all 11 modules at once won't work.** rhinontech.com has 53 referring domains; Zoho has 128,976 and HubSpot 398,775. Spreading that thin authority across hundreds of hard searches in two countries would win none of them. This plan puts it on searches the data says Rhinon can win.
- **SEO takes months.**
  - Comparison pages and Indian long-tail pages can rank in 1–3 months.
  - Commercial category pages take 3–9 months.
  - Head terms like "crm software" are a 12–24-month goal.
  - Section 8.4 lists what brings visibility in the first 30 days.
- **The site must not promise more than the product does.** These gaps exist today:
  - payroll isn't statutory-compliant;
  - the inbox has no assignment;
  - WhatsApp isn't built;
  - customer inbound email is broken (launch review G0.2).

  Section 2.6 lists what the site may and may not claim.

---

## 1. The niche

### 1.1 Five options, tested against the data

| Option | Market | Searches/mo (sum) | Change, last 3 months vs first 3 months of the year* | Median difficulty | Searches with difficulty ≤ 20 | Value per click |
|---|---|---:|---:|---:|---:|---:|
| AI agents for sales and support | US | 49,230 | +2940% | 23.5 | 19 of 46 | $44.90 |
| AI agents for sales and support | IN | 53,500 | +4959% | 34.5 | 5 of 24 | $1.77 |
| Agencies and service businesses | US | 32,260 | +135% | 12 | 37 of 48 | $35.01 |
| Agencies and service businesses | IN | 6,390 | +35% | 48 | 11 of 25 | $3.99 |
| All-in-one / Zoho alternative | US | 18,800 | +23% | 5.5 | 21 of 26 | $58.30 |
| All-in-one / Zoho alternative | IN | 22,630 | +623% | 35 | 5 of 15 | $2.49 |
| WhatsApp CRM (India) | IN | 14,870 | +231% | 15.5 | 6 of 10 | $2.31 |
| Help desk and live chat | US | 35,600 | +27% | 37.5 | 5 of 18 | $68.78 |
| Help desk and live chat | IN | 16,170 | +48% | 46.5 | 2 of 12 | $3.77 |

\* The change compares group totals. It is directional: a few searches that barely existed a year ago push the AI rows into the thousands of per cent.

**Excluded from the totals:**
- searches that are really brand names: "business suite" (Meta), "work os" (monday.com);
- a duplicate of "crm software": "client relationship management software";
- an informational term: "agentic ai";
- AI products Rhinon doesn't make (section 1.5).

| Option | Verdict |
|---|---|
| AI agents | **Use it as the "how", not the "who".** Demand is exploding, but specialists crowd the field. Rhinon's AI is text-based: a website agent, email drafts, lead research and rewriting. "AI built in" belongs in the promise. |
| Agencies and service businesses | **Who Rhinon is for.** In the US the searches are easy and valuable. In India people rarely search this way (section 1.4), so India demand is captured through general CRM searches instead. |
| All-in-one | **Supporting message only.** "business management software" is down 84% in the US and 85% in India. The big terms belong to brands. Zoho owns the angle in India. |
| WhatsApp CRM | **A product decision, not a page.** It has the most demand and lowest difficulty in India, but WhatsApp is stubbed in the product (launch review G2.4). |
| Help desk and live chat | **Avoid as a category.** "live chat software" is down 87% in the US and difficulty is higher. Present the chatbot as an AI agent instead. |

### 1.2 The decision: who it's for

| | |
|---|---|
| **Who** | B2B service firms of 5–50 people that win clients and deliver projects: digital and marketing agencies, software and IT services firms, consultancies, design studios, and B2B startups whose founders still sell |
| **Where** | India first (₹ pricing, IST, Indian English). Then English-speaking markets (US, UK, Australia, the Gulf) at USD prices |
| **Buyer** | The founder or head of operations, who uses it every day with 2–20 colleagues |
| **What they use today** | A free CRM, a cold-email tool, Trello or ClickUp, WhatsApp, spreadsheets, and email threads to update clients (launch review §3.4) |
| **Jobs to be done** | 1. Find and reach prospects without a sales team. 2. Never lose a lead or a reply. 3. Hand a won deal to delivery without retyping. 4. Keep clients informed without status calls. 5. Run the team without five more tools |
| **Not for, for now** | Enterprises; HR-first buyers who need statutory payroll; e-commerce; field service; anyone who needs to sell over WhatsApp today |

### 1.3 Why this niche wins

1. **It matches what's built.** The product review rates CRM and Projects with the client portal "Strong". The website chatbot creates CRM leads, a won deal converts to a project (`deals.ts#L310`), and clients follow the work in a portal.
2. **Rhinon already runs this loop.** In mid-November the platform workspace held 5,236 leads, plus campaigns, the inbox, and a chatbot on rhinonlabs.com. Rhinon Labs is an agency: the first case study already exists.
3. **Demand is growing where Rhinon is strong.**
   - "crm software": +82% in the US, +173% in India.
   - "best crm for small business": +128% in the US, +233% in India.
   - "crm with project management": +255% in India.
   - "lead management software": +175% in India.
4. **The searches are winnable.** In the US:
   - "crm for agencies" (1,000/mo) has difficulty 0;
   - "agency software" (2,400/mo) has difficulty 4;
   - "consulting crm" (480/mo) has difficulty 0;
   - eight "X alternative" searches have difficulty 0–2.

   The pages ranking for them are small specialists: Productive, Scoro, Ravetree, Clienthub, Dock.
5. **There is white space.** From each company's own pages, read 25 November:

| | Win clients: website AI agent, outreach, CRM | Deliver the work: projects and client portal | Team tools: chat, docs, HR |
|---|---|---|---|
| **HubSpot** | Yes: CRM, sequences, chatbot builder, help desk | Partial: tasks and a customer portal for tickets | No |
| **Zoho One** | Yes: CRM, Campaigns, SalesIQ, Desk | Yes: Projects (no client portal named) | Yes: Cliq, Writer, People, Payroll |
| **monday.com** | Partial: CRM; no chatbot or live chat named | Yes: work management (no client portal named) | Partial: Docs |
| **HoneyBook** | Partial: "CRM platform for small businesses"; proposals, invoices, contracts | Yes: "every client, project, and payment" | No |
| **Productive** | No lead capture named | Yes: resources, projects, finances | No |
| **GoHighLevel** | Yes: "capture, nurture and close new leads"; AI voice calls | Not on the page (page cut short) | No |
| **Rhinon Tech** | Yes: AI website agent, outreach sequences, CRM | Yes: projects, client portal, deal-to-project in one app | Yes: chat, meetings, docs, HR, payroll |

Zoho is the only one that covers all three, but as 45+ separate apps. Its own page says "a license is required for all employees". Rhinon does it in one app and is free for up to 5 people. HoneyBook's sign-up is limited to the US, Canada, the UK and Australia. GoHighLevel starts at $97 a month.

### 1.4 India and the US search differently

**India rarely searches for "agency software".**
- Agency searches barely register: "agency management software" 40/mo, "crm for agencies" 70.
- Indian buyers search for CRM in general, often with "India" added:

| Search (India) | Searches/mo | Change | Difficulty |
|---|---:|---:|---:|
| best crm software in india | 720 | +22% | 7 |
| crm software india | 480 | +51% | 7 |
| small business crm | 880 | +108% | 31 |
| best crm for small business | 720 | +233% | 28 |
| ai crm | 1,000 | +171% | 30 |
| lead management software | 720 | +175% | 26 |
| crm with project management | 170 | +255% | 9 |

India also searches heavily for WhatsApp tools: "whatsapp automation" (4,400, +86%, difficulty 3) and "whatsapp crm" (1,900, +50%, difficulty 14).

**The US searches for the niche directly, and the searches are easy and valuable:**

| Search (US) | Searches/mo | Change | Difficulty | Value per click |
|---|---:|---:|---:|---:|
| agency software | 2,400 | +50% | 4 | $39 |
| agency crm | 1,900 | −21% | 8 | $7 |
| crm for agencies | 1,000 | −19% | 0 | $70 |
| psa software | 1,600 | −32% | 22 | $151 |
| consulting crm | 480 | — | 0 | $33 |
| crm with project management | 720 | +23% | 5 | $61 |

**What this means for the site.**
- Run one English site.
- India pages capture searches with "India" in them.
- Solution and comparison pages carry the US demand.
- Positioning stays the same everywhere.

### 1.5 AI demand to watch: Rhinon can't serve it today

| Search | US searches/mo | India | Product signal |
|---|---:|---:|---|
| ai receptionist | 74,000 | 1,300 | Voice AI. Crowded and well funded; a later option |
| ai voice agent | 40,500 | 3,600 | Same |
| ai note taker | 22,200 | 2,400 | **Worth evaluating:** AI notes on top of the existing Meetings module |
| ai phone agent | 2,400 | — | Voice AI |
| whatsapp automation / chatbot / crm | 260 / 720 / 260 | 4,400 / 4,400 / 1,900 | **The biggest India gap:** a WhatsApp channel for the AI Agent and Inbox |

No pages until these products ship. This is input for the product roadmap.

---

## 2. Product identity

### 2.1 Positioning statement

- **Who it's for:** founders and operators of 5–50 person service businesses who juggle a CRM, a cold-email tool, a project tool and WhatsApp to win and serve clients.
- **What it is:** the AI CRM that carries each client from the first website chat to the delivered project, in one app, with team chat, docs and HR included.
- **How it's different:** in HubSpot or Zoho, projects and clients live in separate products. In Rhinon, a won deal becomes a project the client can follow in their own portal.
- **Price:** free for up to 5 people.

### 2.2 The category name

| Option | Do people search it? | Does someone already own it? | Is it clear? | Verdict |
|---|---|---|---|---|
| "One workspace for your whole company" (today) | No measurable demand | Zoho, monday.com, ClickUp say the same | Generic | Drop |
| "AI workspace" | India 4,400 (difficulty 4); US 2,900 (difficulty 30) | monday.com's H1: "The AI workspace for people and agents" | Vague | Not as the category. Fine as a guide topic |
| "Business operating system" | 260–390/mo | Zoho One's H1: "The Operating System for Business". GoHighLevel's: "The AI-powered business operating system" | Vague | Drop |
| **"AI CRM for service businesses"** | "ai crm": India 1,000, US 2,400. "crm for agencies": US 1,000 (difficulty 0) | HubSpot says "AI-powered CRM"; Kommo says "AI CRM" for messaging. Nobody says "for service businesses" | A product people know, plus who it's for | **Use** |

### 2.3 Messaging

| Element | Copy |
|---|---|
| Eyebrow / category | The AI CRM for agencies and service businesses |
| H1 (recommended) | Win clients. Deliver the work. Keep them coming back. |
| H1 options to test later | "The AI CRM that keeps going after 'won'." · "From first chat to finished project." |
| Sub-headline | Rhinon answers your website visitors with an AI agent, writes your follow-up emails, and turns every won deal into a project your client can track. Team chat, docs and HR are included. |
| Buttons | Get started free · Book a demo |
| Under the buttons | Free for up to 5 people · No credit card |
| Home title tag (54 characters) | AI CRM for Agencies & Service Businesses \| Rhinon Tech |
| Home meta description (149 characters) | Capture leads with an AI website agent, follow up with AI-written emails and turn won deals into projects clients can track. Free for up to 5 people. |

### 2.4 Three pillars, which also become the navigation

| Pillar | Promise | Products | Proof to show |
|---|---|---|---|
| **Win clients** | Every lead answered, followed up and tracked | AI Agent, Outreach, CRM, Inbox | An AI Agent conversation becoming a CRM lead; an outreach draft waiting for approval (real screenshots) |
| **Deliver the work** | A won deal becomes a project without retyping | Projects (with client portal), Chat & Meetings, Docs | The deal-to-project conversion; the client's portal view |
| **Keep them coming back** (home page story, not a menu column) | Clients see progress, and their questions get answered | Client portal, AI Agent help center and tickets | The portal timeline and the help center |
| **Run your team (included)** | Run a 5–50 person team without five more tools | HR, Attendance & Leave, Performance, Payroll | Offer-letter e-signing; a leave approval |

### 2.5 One name per product, on the site and in the app

| Site today | App today | New name, site and app | URL | One-line description |
|---|---|---|---|---|
| CRM | CRM | CRM | /product/crm | Leads, deals and every conversation on one timeline |
| Outreach | Outreach, Automation | Outreach | /product/outreach | AI-written email sequences you approve before they send |
| Inbox | Inbox | Inbox | /product/inbox | Your team's email next to your CRM |
| AI Chatbot | Chatbot | **AI Agent** | /product/ai-agent (301 from /product/chatbot) | Answers visitors, captures leads and hands off to your team |
| Work | Work | **Projects** | /product/projects (301 from /product/work) | Projects, tasks and a portal for your clients |
| Team Chat & Meetings | Chat, Meetings | Chat & Meetings | /product/chat | Channels, calls of up to 8 people, guest meeting links |
| Pages | Pages | **Docs** | /product/docs (301 from /product/pages) | Docs and notes in a tree, next to the work |
| HR & People | Team | HR | /product/hr | Hiring, records, offer letters and e-signing |
| Payroll | Payroll | Payroll | /product/payroll | Salary runs, payslips and reimbursements |
| Attendance & Leave | Team sub-menu | Attendance & Leave | /product/attendance | Clock-in, leave requests, approvals |
| Performance | Team sub-menu | Performance | /product/performance | Review cycles, goals and feedback |

The app has to change too. This is launch-review item U3, which is planned and not yet built.

### 2.6 What the site may claim

| Claim | Allowed? | Basis or condition |
|---|---|---|
| Free for up to 5 people, with 50 emails and 20 AI drafts a day | Yes | `config/plans.ts` |
| "Free for your whole team" / "No seats to count" | **No** | Contradicts the 5-person cap (G0.1). Today it appears in the layout description, the home hero, the home stats and pricing teaser, the closing call to action, and on /pricing |
| AI agent trained on your website, files and articles, with live hand-off, forms, tickets and a help center | Yes | Product review §2.3 |
| A won deal becomes a project; clients follow it in a portal | Yes | `deals.ts#L310`; client portal |
| Email sequences with waits, if/then branches, A/B splits, and LinkedIn and call tasks | Yes | Product review §2.3 |
| Team chat, group calls of up to 8 people, guest meeting links | Yes | Product review §2.3 |
| Offer letters and NDAs with e-signing | Yes | Product review §2.3 |
| Payroll "built for India", or statutory compliance | **No** | TDS is a manual amount, PT a flat ₹200, no ESI (G3.1). Say "salary runs, payslips and reimbursements; export for your CA" |
| A shared inbox with assignment | **Not yet** | No assignment (G2.3) |
| Receiving customer email on your workspace address | **Not yet** | G0.2 |
| WhatsApp | **Not yet** | Stubbed (G2.4) |
| "Your data is stored in India" | **After checking** | The API and Postgres run on a Hyderabad server and files are in S3 Mumbai. Confirm backups, the email region and where Gemini processes data before claiming it. Say "stored in India", never "never leaves India" |
| SOC 2, ISO 27001 | **No** | None held |
| Customer logos, quotes, ratings | Only real ones, with written permission | Site plan §0.4 |
| Integrations | Only those verified on production | Google and Microsoft calendar connection is unverified (§2.3) |

### 2.7 Visual identity

- **Keep:**
  - the rhino logo and navy `#002C70`;
  - Geist and Geist Mono;
  - the light theme;
  - the calm, ClickUp-like density.
- **Change:**
  1. **Icon colours.** Eleven different gradient icon colours become three group colours (section 6.3).
  2. **The main button.** It changes from near-black to brand navy, so the button carries the brand.
  3. **Gradients.** One gradient (navy to action blue) is used only for the hero glow and the closing call-to-action band. Drop the rainbow gradient on headline words.
  4. **Screenshots.** Real product screens go in one consistent product frame.
  5. **Illustrations.** Keep them for concepts only: the client loop and the hand-offs.
- **Don't retry** the dark, 3D particle hero. You rejected it on 12 November. The direction stays light and product-first.

---

## 3. Keywords

### 3.1 Fastest-growing searches Rhinon can serve

Single-search growth is noisy, because new searches show huge percentages. These are the consistent signals.

**US**

| Search | Searches/mo | Change | Difficulty | Value per click | Page |
|---|---:|---:|---:|---:|---|
| customer support chatbot | 2,900 | +2983% | 47 | $55 | /product/ai-agent |
| ai agent for small business | 320 | +1082% | 0 | $20 | /product/ai-agent |
| chatbase alternative | 390 | +743% | 0 | $16 | /compare/chatbase-alternative |
| ai chatbot for small business | 140 | +700% | 11 | $26 | /product/ai-agent |
| zoho crm alternative | 170 | +540% | 2 | – | /compare/zoho-alternative |
| hubspot alternative | 170 | +420% | 0 | $73 | /compare/hubspot-alternative |
| clickup alternative | 480 | +171% | 2 | $27 | /compare/clickup-alternative |
| ai automation for small business | 260 | +129% | 6 | $23 | guide |
| odoo alternative | 260 | +129% | 0 | $26 | /compare/odoo-alternative |
| best crm for small business | 3,600 | +128% | 40 | $62 | /product/crm and a guide |
| sales pipeline software | 260 | +127% | 29 | $64 | /features/sales-pipeline |
| professional services automation | 260 | +86% | 13 | $201 | /solutions/professional-services |
| ai sales assistant | 480 | +85% | 15 | $75 | /product/outreach |
| agency dashboard | 720 | +83% | 13 | $26 | /solutions/agencies |
| ai for small business | 3,600 | +81% | 28 | $31 | guide |
| chatbot for website | 720 | +69% | 49 | $40 | /product/ai-agent |
| ai email assistant | 4,400 | +52% | 32 | $14 | /tools/ai-email-writer |
| agency software | 2,400 | +50% | 4 | $39 | /solutions/agencies |
| teamwork alternative | 320 | +50% | 0 | $41 | /compare/teamwork-alternative |

**India**

| Search | Searches/mo | Change | Difficulty | Page |
|---|---:|---:|---:|---|
| ai workspace | 4,400 | +376% | 4 | guide |
| crm with project management | 170 | +255% | 9 | /features/crm-with-project-management |
| best crm for small business | 720 | +233% | 28 | guide |
| ai crm software | 170 | +200% | – | / (home) |
| lead management software | 720 | +175% | 26 | /features/lead-management |
| ai crm | 1,000 | +171% | 30 | / (home) |
| small business crm | 880 | +108% | 31 | /product/crm |
| ai chatbot for business | 720 | +100% | 32 | /product/ai-agent |
| crm for startups | 110 | +100% | 43 | /solutions/startups |
| best hrms software in india | 2,900 | +89% | 0 | guide (phase 3, honest about payroll) |
| email management software | 480 | +89% | 13 | /product/inbox |
| customer support chatbot | 590 | +88% | 51 | /product/ai-agent |
| psa software | 320 | +86% | 15 | /solutions/professional-services |
| client portal | 590 | +85% | 16 | /features/client-portal |
| hrms software india | 3,600 | +52% | 3 | /product/hr (phase 3) |
| crm software india | 480 | +51% | 7 | /in/crm-software |

### 3.2 Which search each page targets

Each page has one primary search, and no two pages share one.

| Page | Primary search | Secondary searches | Data (India · US) | Phase |
|---|---|---|---|---|
| / | ai crm | crm for service business, ai crm software | ai crm: IN 1,000 (+171%, diff. 30) · US 2,400 (diff. 34) | 1 |
| /product/crm | small business crm | best crm for small business, crm software for small business | IN 880 (+108%, 31) · US 3,600 (46) | 1 |
| /product/outreach | cold email software | ai sales assistant, bulk email software, lead generation software | IN 390 (30) · US 260 (24); ai sales assistant US 480 (+85%, 15) | 1 |
| /product/ai-agent | ai chatbot for website | customer support chatbot, ai customer service agent, ai chatbot for small business, ai helpdesk | IN 590 (59) · US 720 (43); support chatbot US 2,900; agent US 1,600 (29, $143) | 1 |
| /product/inbox | email management software | team inbox (target "shared inbox" only after assignment ships) | IN 480 (+89%, 13); team inbox IN 260 (+86%, 14) | 1 |
| /product/projects | project management for agencies | agency project management software | US 170 (0); US 140 (12) | 1 |
| /product/chat | team chat app | online meeting software | weak data; links to the Slack and Teams comparison pages | 1 |
| /product/docs | internal wiki | knowledge management software | US 140 (1); US 720 (+14%, 29) | 1 |
| /product/hr | hr software for small business | hrms software india, employee onboarding | IN 590 (+50%, 3) · US 1,300 (14, $218); hrms india 3,600 (+52%, 3) | 1 (copy), 3 (push) |
| /product/attendance | leave management system | attendance management system, employee attendance app | IN 2,400 (0); IN 3,600 (7); IN 1,600 (0) | 3, after Q1/Q2 are fixed |
| /product/performance | performance management system | okr software | IN 2,400 (3) · US 880 (0) | 3 |
| /product/payroll | — | — | Deliberately not targeted (section 3.3) | — |
| /solutions/agencies | crm for agencies | agency crm, agency software, crm for marketing agencies, agency management software, agency dashboard | US 1,000 (0, $70); 1,900 (8); 2,400 (4); 390 (6); 170 (25, $121); 720 (13) | 2 |
| /solutions/consultancies | consulting crm | crm for consultants | IN 210 · US 480 (0); US 170 (0) | 2 |
| /solutions/it-services | crm for software companies | crm for it companies | IN 260 (+24%, 26) · US 210 | 2 |
| /solutions/professional-services | service business software | professional services software, professional services automation, psa software | US 320 (23, $143); 140 (16, $170); 260 (13, $201); 1,600 (22) | 2 |
| /solutions/startups | crm for startups | — | IN 110 (+100%) · US 390 (10, $96) | 2 |
| /features/crm-with-project-management | crm with project management | crm and project management software | IN 170 (+255%, 9) · US 720 (5) | 2 |
| /features/client-portal | client portal software | client portal (India) | US 590 (20, $48); IN 590 (+85%, 16) | 2 |
| /features/lead-management | lead management software | lead management system | IN 720 (+175%, 26); IN 1,300 (29) | 2 |
| /features/sales-pipeline | sales pipeline software | — | US 260 (+127%, 29, $64) | 2 |
| /compare/zoho-alternative | zoho alternative | zoho crm alternative, zoho one alternative | IN 260 (0) · US 320 (0); US 170 (+540%, 2) | 2 |
| /compare/hubspot-alternative | hubspot alternative | — | US 170 (+420%, 0) | 2 |
| /compare/odoo-alternative | odoo alternative | — | IN 140 · US 260 (+129%, 0) | 2 |
| /compare/clickup-alternative | clickup alternative | — | IN 210 (9) · US 480 (+171%, 2) | 2 |
| /compare/monday-alternative | monday alternative | — | US 260 (0) | 2 |
| /compare/honeybook-alternative | honeybook alternative | dubsado alternative | US 260 (0); US 90 (0) | 2 |
| /compare/teamwork-alternative | teamwork alternative | — | US 320 (+50%, 0) | 2 |
| /compare/chatbase-alternative | chatbase alternative | intercom alternative, tidio alternative | US 390 (+743%, 0); 70 (12, $137); 90 (0, $142) | 2 |
| /compare/notion-alternative, /compare/slack-alternative | notion alternative; slack alternative | — | IN 1,000 (+69%, 2); US 1,000 (2) | 3 |
| /in/crm-software | crm software india | indian crm software, crm india | IN 480 (+51%, 7); 480 (17); 390 (0) | 2 |
| /tools/ai-email-writer | ai email writer | ai email assistant | IN 33,100 (51) · US 4,400 (39); assistant US 4,400 (+52%, 32) | 2 |
| /templates/client-onboarding-checklist | client onboarding | client onboarding software | IN 390 (+23%, 11) · US 590 (14) | 2 |
| Guide: best CRM software in India | best crm software in india | best crm for small business (India) | IN 720 (7); IN 720 (+233%, 28) | 2 |
| Guide: AI for small business | ai for small business | ai automation for small business | US 3,600 (+81%, 28); US 260 (+129%, 6) | 3 |
| Guide: AI workspace explained | ai workspace | — | IN 4,400 (+376%, 4) · US 2,900 (30) | 3 |
| Guide: best HRMS software in India | best hrms software in india | — | IN 2,900 (+89%, 0) | 3 |
| Guide: best CRM software (long term) | best crm software | — | US 18,100 (25) | 3 |
| Guide: B2B sales for service firms | b2b sales | — | US 14,800 (18) | 3 |

### 3.3 Searches to avoid for now

| Search | Data | Why not |
|---|---|---|
| hrms | India 2,740,000, difficulty 41 | People looking for a government or employer portal; gov.in and nic.in sites lead it |
| payroll software, payroll software india | India 8,100; 1,300 | Buyers expect statutory compliance (G3.1) |
| crm, crm software | India 135,000 / 74,000; US 165,000 / 201,000; difficulty 58–75 | Salesforce, Zoho and HubSpot hold #1–4 with 129k–399k referring domains. Revisit in 12+ months |
| business suite, work os | US 18,100 and 14,800 | Brand searches for Meta Business Suite and monday.com |
| client portal (exact phrase, US) | 14,800, difficulty 59 | Mostly people logging into a portal; target "client portal software" instead |
| live chat software, help desk software | US 1,600 (−87%), 4,400 (−76%) | Falling, and difficulty 44–49 |
| ai receptionist, ai voice agent, ai note taker | US 74,000; 40,500; 22,200 | No such product (section 1.5) |
| whatsapp crm, automation, chatbot | India 1,900–4,400 | Not built yet. Product first, pages second |
| ai email writer as a product page | India 33,100 | People want a tool. Serve it with a free tool, not a product page |
| erp for small business | India 390, US 480 | Rhinon isn't an ERP: no accounting or inventory |

### 3.4 AI search: AI Overviews, ChatGPT, Perplexity

**What we know** (from the two live Google results checked on 25 November):
- For "crm software" in India, Google's AI Overview cited Salesforce, Zoho, Wikipedia, G2, Capterra, PCMag and Keap.
- For "project management software" in the US, it cited Wikipedia, Reddit, Zapier, Atlassian, Microsoft and thedigitalprojectmanager.com.
- Reddit holds 25 of the top-10 spots across the US niche searches.

**What to do:**
1. **One entity description, everywhere.** "Rhinon Tech is an AI CRM for service businesses, made by Rhinon Labs in India." Use it on the site, schema, G2, LinkedIn and Crunchbase.
2. **Answer first.** The first two sentences of every page answer the search. Put comparison tables in HTML, not images.
3. **FAQ blocks** in plain question-and-answer form on every money page.
4. **Profiles with real reviews** on G2, Capterra and Techjockey.
5. **Founders take part on Reddit and LinkedIn** under their own names, saying where they work.
6. **Index and crawlers:**
   - submit the sitemap to Bing Webmaster Tools and ping IndexNow on publish (Bing's index feeds several AI assistants);
   - allow AI crawlers in robots.txt;
   - add `/llms.txt` if you like. It's cheap, but its impact is unproven.

---

## 4. Site architecture

### 4.1 Navigation

Desktop:

```
[Rhinon Tech]   Product ▾   Solutions ▾   AI   Compare ▾   Pricing   Resources ▾          Log in   [ Get started free ]
```

Product menu:

```
WIN CLIENTS                DELIVER THE WORK               RUN YOUR TEAM · included
AI Agent        paid       Projects & client portal       HR
Outreach                   Chat & Meetings                Attendance & Leave
CRM                        Docs                           Performance
Inbox                                                     Payroll
──────────────────────────────────────────────────────────────────────────────
How it fits together →      Rhinon AI →      Integrations →      Security →
```

The other menus:
- **Solutions:** Agencies · IT & software services · Consultancies · Professional services · Startups.
- **Compare:** Zoho One · HubSpot · Odoo · ClickUp · monday.com · HoneyBook · Teamwork · Chatbase · All comparisons.
- **Resources:** Guides · Free tools · Templates · Blog · Changelog · Help center.

Mobile:
- a menu button opens a full-screen sheet with the same groups as accordions, in the same order;
- "Get started free" stays pinned to the bottom.

Security moves from the top bar to the Product menu and the footer. It matters, but it isn't a first-click path for a small-business buyer.

### 4.2 Sitemap by phase

| Phase | Pages | Count |
|---|---|---:|
| **1. Core (weeks 1–6)** | Home; /product overview; 11 product pages (3 renamed); /ai; /pricing; /security; /integrations; /about (new); /contact; /demo; /legal/privacy, /legal/terms, /legal/dpa (when G0.4 is done); 404 | ~22 |
| **2. Demand capture (weeks 6–12)** | 5 solution pages; 8 comparison pages plus a hub; 4 feature pages; /in/crm-software; /tools/ai-email-writer; /templates/client-onboarding-checklist; /customers/rhinon-labs; /changelog | ~23 |
| **3. Content engine (weeks 12–26)** | About 24 guides; ongoing blog; 1–2 more tools (after checking their volume); India HR and attendance pages (after the product fixes); 4 more comparisons; real customer stories | ~35 |

That takes the site from 23 URLs today to about 80 by week 26.

### 4.3 URL rules

- Lowercase and hyphenated, with no dates or IDs.
- Keep `/product/<slug>`. Rename three now, with 301 redirects in `next.config.ts`:
  - `/product/chatbot` → `/product/ai-agent`;
  - `/product/work` → `/product/projects`;
  - `/product/pages` → `/product/docs`.

  With almost no rankings yet, renames cost nothing now and a lot later.
- One page per search. Every content brief checks that its primary search isn't already taken.
- One canonical host. Make the code, Vercel, the sitemap and Search Console agree on the apex `https://rhinontech.com`, which Vercel serves today.

### 4.4 Internal links

- **Product pages** link to their feature pages, two related solution pages and two or three guides.
- **Guides** link to one money page with a descriptive anchor, plus two sibling guides.
- **Comparison pages** link to the matching product pages and to pricing.
- **Solution pages** link to three or four products and to the case study.
- **Breadcrumbs** appear on every page below home, with `BreadcrumbList` schema.
- **The footer** lists every product, solution, comparison and resource page.
- **"Related" blocks** are generated from tags in the content files, not maintained by hand.

---

## 5. Page templates

### 5.1 Home

```
NAV
─────────────────────────────────────────────────────────────────────
EYEBROW   The AI CRM for agencies and service businesses
H1        Win clients. Deliver the work. Keep them coming back.
SUB       Rhinon answers your website visitors with an AI agent, writes your
          follow-ups, and turns every won deal into a project your client can track.
[Get started free]  [Book a demo]        Free for up to 5 people · No credit card
[ REAL PRODUCT FRAME: a deal marked Won → its project board → the client's portal,
  with 3 numbered callouts ]
─────────────────────────────────────────────────────────────────────
PROOF      "Rhinon Labs runs its agency on Rhinon" + real numbers;
           ratings and logos only once they're real and permitted
─────────────────────────────────────────────────────────────────────
THE LOOP   1 Win clients → 2 Deliver the work → 3 Keep them coming back
           (a real screenshot crop, 3 bullets and a link for each)
─────────────────────────────────────────────────────────────────────
AI THAT DOES THE LEGWORK   AI Agent answers and captures · Outreach drafts,
           you approve · CRM researches leads   ("you approve what goes out")
─────────────────────────────────────────────────────────────────────
BUILT FOR YOUR KIND OF BUSINESS   Agencies · IT & software services ·
           Consultancies · Professional services → solution pages
─────────────────────────────────────────────────────────────────────
INCLUDED FOR YOUR TEAM   Chat & Meetings · Docs · HR · Attendance & Leave ·
           Performance · Payroll (one compact strip)
─────────────────────────────────────────────────────────────────────
SWITCHING?   From Zoho, HubSpot or ClickUp → comparison pages and a short table
─────────────────────────────────────────────────────────────────────
PRICING      Free (5 people) · Starter · Enterprise → /pricing
─────────────────────────────────────────────────────────────────────
FAQ          What is Rhinon? Who is it for? Is it really free? Where is my data?
             How accurate is the AI? How do I move from my current tools?
─────────────────────────────────────────────────────────────────────
CTA BAND → FOOTER
```

**Remove** from today's home page:
- the "Eleven products. One login." grid of eleven equal tiles;
- the stats row (11 / 1 / ₹0 / 24/7), which isn't evidence;
- the orbit of eleven equal products. It becomes "the loop": website visitor → lead → deal → project → client portal → next project.

**Keep** "Built in, not bolted on", with real examples and the "you approve" guardrail.

### 5.2 Product page

1. **Breadcrumb.**
2. **H1:** the outcome plus the search, e.g. "An AI chatbot for your website that turns visitors into leads".
3. **Sub-headline, the two buttons, and a real screenshot.**
4. **How it works:** three steps, each with a screenshot.
5. **Four to six feature rows.** They alternate text and visual, and each answers one sub-question.
6. **"Works with the rest of Rhinon".** The hand-offs specific to this product, e.g. AI Agent → CRM lead → Outreach sequence.
7. **Proof.** A real quote when one exists; otherwise Rhinon Labs' own usage numbers.
8. **A small comparison** against the most common alternative, linking to its comparison page.
9. **What's free and what's paid.**
10. **Five to eight FAQs**, each answered in the first sentence.
11. **Closing call-to-action band.**

On 6 November you rejected a shared template because "every page looked the same". The fix is shared structure with each product's own visuals and copy: never one layout with different words swapped in.

### 5.3 Solution page (example: /solutions/agencies)

1. **H1:** "The AI CRM for agencies".
2. **The agency workflow** (pitch → win → kick-off → deliver → report → renew), mapped to Rhinon.
3. **Pains matched to features.**
4. **Ready-made setups:** agency pipeline stages, a project template, client portal settings.
5. **The Rhinon Labs case study.**
6. **A comparison block** against HoneyBook, Productive, Teamwork and GoHighLevel.
7. **"What a 10-person agency pays".**
8. **FAQs and the call to action.**

### 5.4 Comparison page (example: /compare/zoho-alternative)

1. **H1:** "Zoho One alternative for service businesses".
2. **A two-sentence honest verdict:** who should pick Zoho, and who should pick Rhinon.
3. **A feature table.** Use Yes / Partial / No, with a "checked on" date and links to their pages.
4. **Pricing side by side**, dated and linked.
5. **"Moving from Zoho":** what can be imported and how.
6. **"When Zoho is the better choice".** Honesty earns trust and AI citations.
7. **FAQs.**

Facts live in `content/compare/zoho.ts`, with source URLs and a `lastChecked` date. Never use a competitor's logo as decoration.

### 5.5 Feature page (example: /features/crm-with-project-management)

1. **An H1 that matches the search.**
2. **A 20–40 second product loop.**
3. **Steps and use cases.**
4. **A link up to the product page.**

### 5.6 Free tool (example: /tools/ai-email-writer)

- **Above the fold, the tool itself.** Fields: who you're writing to, your goal, tone and details. It produces an email with a copy button.
- **Three uses a day without signing up.**
- **The call to action:** "Send it as a sequence with Rhinon Outreach".
- **Below the tool:** a real guide (how to write cold emails that get replies, examples by industry) and FAQs.
- **The backend** is described in section 7.7.

### 5.7 Pricing

Plans mirror `config/plans.ts`:

| Plan | What's included | Price shown |
|---|---|---|
| **Free** | Up to 5 people, 50 emails and 20 AI drafts a day; everything except the AI Agent | ₹0 |
| **Starter** | 25 people, 500 emails and 200 AI drafts a day, 1 custom email domain, 1 AI Agent with 1,000 replies a day | "Talk to us" until checkout exists (G1.3); then test the launch review's §3.5 price range |
| **Enterprise** | Unlimited people, 3 AI Agents | "Talk to us" |

Also on the page:
- **Currency:** ₹ in India and $ elsewhere, on the same URL, with a visible switch.
- **A full limits table**, plus FAQs: what happens when you add a 6th person, data, cancelling.
- **Links** to the Zoho One and HubSpot comparisons.

### 5.8 Guides and blog

Each guide has:
- an introduction that answers the question;
- a table of contents;
- an author box with a real person, their role and LinkedIn;
- an "updated" date;
- original screenshots or data;
- examples from Indian and US service firms;
- one call to action that fits the topic;
- related guides and FAQs.

Length follows the search intent, not a word count.

### 5.9 Trust pages

- **/about:** who builds it (Rhinon Labs, the team, the city) and why, with real photos.
- **/security:**
  - keep today's content;
  - add the data location (once checked) and a sub-processor list (AWS, Google Gemini, Vercel);
  - add two-factor authentication, the audit log, export and deletion, and tenant isolation.
- **/customers/rhinon-labs:** real numbers. Re-check the 5,236-lead figure first.
- **/changelog:** monthly. It shows momentum and keeps the site fresh.
- **/legal:** privacy, terms and DPA (launch review G0.4).

---

## 6. UX and visual design

### 6.1 The current site, from screenshots taken 25–26 November

**What's right:**
- a clean, light layout;
- strong Geist display type;
- server-rendered HTML;
- every product page has its own visual;
- a clear pair of buttons;
- breadcrumbs on product pages.

**What's wrong:**
1. **The message is generic.** "One workspace for your whole company" and "Eleven products, one login" count features instead of describing an outcome. Zoho and monday.com make the same claim.
2. **There's no hierarchy between the 11 products.** They get equal tiles in 11 different gradient colours, so HR looks as important as CRM. Choice overload (Hick's law) slows the visitor down.
3. **The hero visual looks unfinished.** It's a code-drawn mock-up, and on a desktop's first paint it shows a mostly empty, faded chat panel.
4. **The chat widget gets in the way.** Its greeting opens by itself and covers the hero mock-up on mobile, and part of the CRM page hero on desktop.
5. **There's no proof:**
   - no logos, ratings, quotes or real screenshots;
   - the stats row isn't evidence.
6. **The navigation is missing paths.** There's no Solutions, Compare or Resources, while Security takes a top-level slot.
7. **Animations hide content.** `.reveal` sets `opacity: 0` until JavaScript runs. That causes the slow main-content time and blank sections on slow phones, such as the large empty area under the CRM page hero on first view.
8. **The copy contradicts the product.** "Free for your whole team" appears 8 times.

### 6.2 Principles for the revamp

1. **The product is the hero.** Show the real thing.
2. **One story per page.** Every section answers "what does this do for a service business?"
3. **Hierarchy over inventory.** Lead with three outcomes, not eleven modules.
4. **Proof before persuasion.** Every claim gets a screenshot, a number or a quote.
5. **Fast by default.** No content waits for JavaScript; motion only adds.
6. **Honest by design.** State limits and "not yet" plainly.

### 6.3 Design tokens

**Colour**

| Token | Value | Use |
|---|---|---|
| brand-navy | `#002C70` | Logo, primary button (white text, contrast 13.2:1), footer |
| action-blue | `#2F5BFF` | Links, focus rings, highlights (white text, contrast 5.2:1) |
| ink | `#0B1220` | Headings and body text |
| ink-soft | `#475467` | Secondary text |
| muted | `#667085` | Captions, metadata |
| surface / surface-subtle | `#FFFFFF` / `#F7F8FB` | Page and section backgrounds |
| line | `#E6E8EF` | Borders, dividers |
| group-win | `#6D4AFF` | Icon tiles for Win clients |
| group-deliver | `#0FA68E` | Icon tiles for Deliver the work |
| group-team | `#F2793D` | Icon tiles for Run your team |
| success / warning / error / info | `#12B76A` / `#F79009` / `#F04438` / `#2E90FA` | Status only |
| brand gradient | navy → action-blue | Hero glow and closing band only |

Group colours are for icons and small accents, never body text.

**Type: Geist Sans, plus Geist Mono for eyebrows and data labels**

| Style | Desktop | Mobile | Line height |
|---|---|---|---|
| Display (H1) | 72 px | 44 px | 1.04 |
| H2 | 48 px | 32 px | 1.12 |
| H3 | 28 px | 22 px | 1.2 |
| H4 | 20 px | 18 px | 1.3 |
| Body large | 19 px | 17 px | 1.6 |
| Body | 17 px | 16 px | 1.6 |
| Small | 14 px | 14 px | 1.5 |
| Eyebrow (mono, uppercase, tracking 0.08em) | 12.5 px | 12 px | 1.4 |

Keep body text to about 68 characters per line.

**Spacing, shape and motion**

- **Spacing:** a 4 px base, on a scale of 4, 8, 12, 16, 24, 32, 48, 64, 96 and 128.
  - Sections: 96 px of padding on desktop, 64 px on mobile.
  - Container: 1,200 px, with 24 px gutters (20 px on mobile).
- **Corner radius:**
  - 8 for inputs;
  - 12 for buttons and chips;
  - 16 for cards;
  - 24 for product frames and panels;
  - full pills only for badges.
- **Shadows:**
  - e1 `0 1px 2px rgba(16,24,40,.06)`;
  - e2 `0 12px 32px -12px rgba(16,24,40,.18)`;
  - product frame `0 40px 80px -24px rgba(0,44,112,.25)`.
- **Motion:**
  - 120 / 200 / 320 ms, easing `cubic-bezier(.2,.7,.2,1)`;
  - entrance motion only below the fold, moving at most 12 px;
  - never on the H1, the hero or the first screen;
  - everything off under `prefers-reduced-motion`.

### 6.4 Components

Build these once and reuse them:

| Component | Notes |
|---|---|
| Navigation and mega menu | Keyboard accessible |
| Hero | Two variants: home and product |
| Product frame | Real screenshot plus numbered callouts |
| Loop diagram | Inline SVG |
| Feature row | Text and visual, alternating |
| Proof strip | |
| Comparison table | Semantic `<table>`; stacks into cards on mobile |
| Pricing table | Includes the currency switch |
| Quote card | Real quotes only |
| FAQ | Native `<details>` |
| Closing call-to-action band | |
| Breadcrumbs | |
| Free-tool shell | Form, result, copy |
| Guide layout | Table of contents, author box, related guides |
| Sitemap-style footer | |

### 6.5 Product imagery

- **Screenshots** come from a seeded demo workspace with realistic Indian and global names and no real customer data:
  - captured at 2× resolution in the light theme;
  - cropped to the panel that matters;
  - with two or three callouts.
- **Three short loops** cover the core flows:
  - visitor to lead (AI Agent);
  - deal to project;
  - the client portal.
- **Loop format:**
  - MP4 or WebM, 15 s or less, 1.5 MB or less, muted, with a poster image;
  - plays when visible, pauses off-screen;
  - respects reduced motion.
- **Dependency:** the app's own UX fixes (launch review U1–U6) should land before the hero screenshots are taken. Otherwise the site advertises screens that are about to change.
- **Code-drawn mock-ups** stay only as small decorative tiles.

### 6.6 Accessibility and mobile

**Accessibility (WCAG 2.2 AA):**
- body-text contrast of at least 4.5:1;
- a visible 2 px action-blue focus ring;
- targets at least 24×24 px, and 44 px for primary touch controls;
- one H1 per page;
- a skip link;
- labelled form fields;
- alt text that says what a screenshot shows;
- reduced-motion support.

**Mobile:**
- the chat widget shows its launcher only, with no automatic greeting;
- product and solution pages get a pinned "Get started free" bar after the visitor scrolls halfway;
- tables become stacked cards.

---

## 7. Performance and engineering

### 7.1 Baseline, measured 25–26 November

| Measure | Home | CRM page | Pricing |
|---|---|---|---|
| HTML (brotli) | 22 KB | 20 KB | 15 KB |
| First-party JavaScript (brotli / uncompressed) | 206 / 643 KB in 12 files | 202 / 627 KB in 11 | 194 / 602 KB in 11 |
| CSS (brotli) | 23 KB | 23 KB | 23 KB |
| Mobile lab: first paint / main content (FCP / LCP) | 1.67 s / **5.20 s** (the main content is the H1) | 1.58 s / 1.58 s | — |
| Mobile lab: layout shift / approximate blocking time | 0 / 54 ms | 0.006 / 10 ms | — |
| Mobile lab: requests / script transferred, including third parties | 50 / 422 KB | 20 / 161 KB | — |
| Desktop: main content / requests / script | 0.43 s / 91 / 518 KB | — | — |
| Time to first byte (curl from India) | 217 ms | 148 ms | 131 ms |

**How the mobile lab test was run:**
- Chrome driven over the DevTools Protocol;
- a 412×915 phone over slow 4G (150 ms round trip, 1.6 Mbps);
- a 4× CPU slowdown.

These are lab numbers. Real-user (field) data needs Search Console, or PageSpeed Insights with an API key.

**Third-party hosts on the home page:**
- Google Tag Manager and Google Analytics;
- fonts.googleapis.com;
- the S3 assets bucket;
- api.rhinontech.in (the chat widget).

### 7.2 Budgets

| Measure | Budget | Home today |
|---|---|---|
| Main content time, mobile lab (LCP) | ≤ 2.5 s | 5.2 s |
| Main content time, real users, 75th percentile | ≤ 2.5 s | Unknown |
| Responsiveness, real users, 75th percentile (INP) | ≤ 200 ms | Unknown |
| Layout shift (CLS) | ≤ 0.1 | 0 |
| First-party JavaScript per page (brotli) | ≤ 130 KB | ~200 KB |
| All script on first load, mobile | ≤ 250 KB | 422 KB |
| Requests on first load, mobile | ≤ 35 | 50 |
| Hero image / video poster | ≤ 150 KB / ≤ 60 KB (AVIF or WebP) | — |
| Fonts | 2 self-hosted variable files, preloaded | Geist and Geist Mono are self-hosted ✓, but there's also a fonts.googleapis.com request |

### 7.3 Fixes, in order

1. **Make hero content visible without JavaScript.**
   - Remove `Reveal` from everything above the fold.
   - Change `Reveal` to a CSS scroll-driven animation (`animation-timeline: view()`) inside `@supports`, so content is simply visible where it isn't supported, and no JavaScript is needed.
   - Expected result: main content appears at first paint, about 1.7 s in the same test.
2. **Load the chat widget later.**
   - Load it after the first interaction, or once the browser is idle (5 s or more), instead of on mount.
   - No automatic greeting on mobile.
   - Measure whether it changes lead volume.
3. **Load Google Tag Manager without blocking the page.**
   - Use `next/script` with `afterInteractive`, or `lazyOnload`.
   - Queue `dataLayer` events so conversions still record.
   - Remove unused tags.
4. **Remove the fonts.googleapis.com request.** Find what makes it (probably the chat widget bundle), then self-host the font or drop it.
5. **Cut client JavaScript.**
   - Keep motion pieces as small client islands, and render sections on the server.
   - Lazy-load below-the-fold demos. `HomeLazyMocks` already does some of this.
6. **Serve real screenshots through `next/image`:**
   - AVIF or WebP, with `sizes`;
   - `priority` on the hero image only.
7. **Re-check the 9 November audit items** that may still be open (`docs/SEO_AUDIT_rhinontech.md`):
   - per-page Open Graph tags;
   - blog error handling in `lib/blog.ts`.

### 7.4 Where content lives

| Content | Where | Why |
|---|---|---|
| Product, solution, comparison, feature and tool pages | Typed TypeScript content files in `rhinontech-site/content/`, rendered by shared section components; each page keeps its own visuals | Reviewed in pull requests, type-checked, quick to add, without making every page look the same |
| Guides and blog | The existing CMS (blog API with `contentBlocks`) on the Rhinon Tech brand; add author profiles and `updatedAt` | Already built, and non-developers can publish |
| Changelog | Markdown files in the repo | Simple |
| Comparison facts | `content/compare/*.ts`, with source URLs and `lastChecked` | Every claim can be audited |

### 7.5 SEO plumbing

- **Metadata:**
  - one helper per page for the title, description, canonical, Open Graph and Twitter tags;
  - titles up to 60 characters, descriptions up to 155.
- **Canonical host:** fix #1 from the summary.
- **Sitemaps:**
  - a sitemap index split by page type, with real `lastmod` dates;
  - submitted to Google Search Console (domain property, verified by DNS TXT in Route 53) and to Bing Webmaster Tools;
  - IndexNow pinged on publish.
- **robots.txt:**
  - allow everything, including GPTBot, ClaudeBot, PerplexityBot and Google-Extended;
  - block preview and API routes.
- **Structured data:** one JSON-LD `@graph` per page.

  | Type | Contents |
  |---|---|
  | `Organization` | logo; `sameAs` LinkedIn, X, YouTube, G2, Capterra and Crunchbase; parent organization Rhinon Labs |
  | `WebSite` | — |
  | `SoftwareApplication` | `BusinessApplication`; operating system "Web"; Free offer at ₹0 / $0. Add other offers only once they have prices |
  | `BreadcrumbList` | — |
  | `FAQPage` | Google now shows FAQ rich results only for well-known government and health sites. Keep it for machine reading, but expect no stars |
  | `BlogPosting` | With a `Person` author |
  | `VideoObject` | For the product loops |

- **Open Graph images:** one per template (product name and its one-line promise), made with `next/og`.
- **Redirects:**
  - 301 for the three renamed URLs;
  - 410 for any page that's removed;
  - keep the custom 404.
- **International:**
  - one English site, so no hreflang;
  - prices switch between ₹ and $ on the same URL;
  - nothing else changes by visitor location.

### 7.6 Analytics and attribution

| GA4 key event | When it fires | Parameters |
|---|---|---|
| `signup_cta_click` | Any "Get started free" click | `placement`, `page_type`, `page_path` |
| `signup_completed` | A workspace is created | `plan`; sent from the backend (GA4 Measurement Protocol), or from the app using the cross-domain client ID |
| `demo_booked` | The /demo scheduler confirms | `page_path` |
| `contact_submitted` | The /contact form succeeds | `topic` |
| `tool_used` / `tool_signup` | A free tool produces output / someone signs up from a tool | `tool` |
| `agent_lead` | The website AI Agent captures a lead | `page_path` |

**How a sign-up gets traced back to its landing page:**
1. **Cross-domain linking.** Configure the GA4 linker in GTM for rhinontech.com → rhinontech.in, so a sign-up is credited to the page where the visitor landed.
2. **First-touch tracking.** Store the first UTM tags and the landing page in a first-party cookie.
3. **Pass it on.** Send that to sign-up and to `/public/web-leads`, and save it on the workspace and the CRM lead. Rhinon's own CRM then shows which pages produce customers.

**Consent:**
- a banner with Google Consent Mode v2 for EU and UK visitors;
- a privacy notice under India's DPDP Act, confirmed with legal (this ties to G0.4).

**Where to look:**
- Search Console for searches and pages;
- GA4 for events by page type;
- the CRM for leads by first page.

### 7.7 Free tools: backend and safety

- **The endpoint** lives on the existing backend under `/public/tools/*`. AGENTS.md says "public endpoints must be rate-limited", so:
  - a per-IP limit, e.g. 5 an hour and 20 a day;
  - a global daily cap;
  - a challenge (such as Cloudflare Turnstile) after 3 uses.
- **Inputs:**
  - length limits and validation;
  - nothing stored except counts, unless the user agrees.
- **The model:**
  - Gemini 2.5 Flash, with a cap on output length;
  - a system prompt built to resist prompt injection;
  - an alert when daily cost passes a threshold.
- **After the result:** "Send this as a sequence in Rhinon Outreach". The draft is kept in the browser and imported after sign-up.

### 7.8 Quality gates in CI

| Check | What it does |
|---|---|
| Lighthouse CI | Runs on four template URLs; fails the PR if main content exceeds 2.5 s in the lab or JavaScript goes over budget |
| Link checker | Catches broken links |
| Structured data | Validated on every build |
| Accessibility | axe checks |
| Screenshot comparison | Key templates at desktop width and at 500 px |

Keep the site pipeline separate from the backend's. Backend CI has been red since 23 October (G0.5).

---

## 8. Content and distribution

### 8.1 Content pillars

| Pillar | What it covers |
|---|---|
| **Win clients** | CRM for small business (India and US); lead management; cold email for agencies; setting up an AI chatbot for your website; AI for small business; AI automation for small business |
| **Deliver the work** | Client onboarding checklist; client portal guide; agency project management; CRM with project management; the deal-to-project hand-off |
| **Run a service business** | Agency dashboards and KPIs; PSA explained; CRM for consultants; reporting to clients |
| **Running a small business in India** | Best CRM software in India; best HRMS software in India (honest about payroll); leave management guide |
| **Comparisons** | 8 pages in phase 2, 4 more in phase 3 |

### 8.2 26-week calendar

| Month | Deliverables |
|---|---|
| 1 | The four fixes; identity sign-off; tokens; navigation; home and pricing rebuilt |
| 2 | 11 product pages rebuilt; the 3 renames with redirects; comparisons for Zoho, HubSpot, ClickUp and Odoo; /solutions/agencies; G2 and Capterra profiles live; first 10 reviews requested |
| 3 | 4 more solution pages; 4 more comparisons; 4 feature pages; /in/crm-software; the AI email writer; the onboarding template; the Rhinon Labs case study; 4 guides |
| 4 | 6 guides; changelog; Product Hunt launch, once proof assets exist |
| 5 | 6 guides; India HR and attendance pages, if Q1/Q2 and the claims are fixed; 2 comparisons |
| 6 | 6 guides; refresh the top 10 pages using Search Console data; a second tool, if its volume checks out |

### 8.3 Credibility and proof

- **Authors:** product leads and founders, with real profiles. Someone who runs the agency at Rhinon Labs reviews the content.
- **Original data:**
  - **Product statistics:** anonymised and aggregated, e.g. the median time from won deal to project kick-off. Use them only where the terms allow.
  - **A survey:** a yearly "State of Indian service businesses" survey of 100+ firms, used for digital PR.
- **Case studies:** Rhinon Labs first, then three early customers.
- **Reviews:**
  - ask active workspaces to review on G2, Capterra and Techjockey;
  - never offer incentives that break a platform's rules.

### 8.4 What brings visibility in the first 30 days

1. **Fix the canonical host and submit the sitemaps** to Google and Bing. This takes days.
2. **Publish four comparison pages** for Zoho, HubSpot, ClickUp and Odoo. They have difficulty 0–2 in the US, so they index and rank fastest.
3. **List Rhinon in software directories:**
   - G2;
   - Capterra, GetApp and Software Advice (one Gartner Digital Markets listing covers all three);
   - Techjockey, SoftwareSuggest and SaaSworthy;
   - a Product Hunt "coming soon" page.

   This brings referral visits, links and AI citations straight away.
4. **Founder posts on LinkedIn** three times a week, showing the product (deal to project, the AI Agent) and Rhinon Labs behind the scenes.
5. **Answer questions on Reddit** in r/agency, r/smallbusiness, r/CRM and r/IndianStartups, saying who you work for. No link-dropping.
6. **A small Google Ads test, only once events fire.**
   - India: "crm software india", "ai crm" and "small business crm", at $1.85–$4.21 per click.
   - US: "crm for agencies", at $70 per click.
   - Run it for two weeks with a fixed budget, measuring sign-ups and activation.

### 8.5 Links

- **Assets worth linking to:** the free tools, templates, the survey report, and the comparison data.
- **Partners:** integration partners, agency communities, Indian startup programmes, and co-marketing with Rhinon Labs clients.
- **Target:** from 53 to 200 referring domains in 6 months. digisme.in ranks #4 for "crm software india" with 196.
- **Never:** paid link schemes or spam directories. The Rhinon Labs audit found spam backlinks; don't repeat that.

---

## 9. Roadmap and owners

The product is built by 3 engineers (launch review §2.1). The site needs a named owner and a content writer.

| Phase | Weeks | Deliverables | Owner | Done when |
|---|---|---|---|---|
| **0. Fix** | 1 | Canonical host; hero speed; claims; GA4 events and cross-domain tracking; Search Console and Bing verified | Site engineer, founder | Home main content ≤ 2.5 s in the lab; events visible in GA4 DebugView; sitemap accepted |
| **1. Identity and core** | 1–6 | Positioning signed off; tokens; navigation; home; pricing; the product page template and all 11 pages; 3 renames and redirects; /about; legal pages linked | Founder (copy), designer, engineer | All core pages on the new template; budgets pass in CI |
| **2. Demand capture** | 6–12 | 5 solution pages; 8 comparisons; 4 feature pages; the India CRM page; the AI email writer; the onboarding template; the Rhinon Labs case study; directory listings | Founder, writer, engineer | 23 new pages indexed; 10+ reviews; tool rate limits tested |
| **3. Content engine** | 12–26 | About 24 guides; India HR and attendance pages (if the product is ready); 4 more comparisons; customer stories; a monthly refresh | Writer, with founder review | At least 1.5 pages a week; monthly Search Console review |

**Dependencies:**

| Before this happens | This must be done |
|---|---|
| The new names go live | App renames (U3) |
| Hero screenshots are taken | App UX fixes (U1–U6) |
| Prices are published | Payments (G1.3) |
| The legal pages ship | Legal documents (G0.4) |
| Rhinon claims "stored in India" | The data-location check |

---

## 10. Targets

These are targets to test, not forecasts.

| Measure | Today | Week 12 | Week 26 | Month 12 |
|---|---|---|---|---|
| Tracked searches in the top 100 (449: 274 module + 175 niche) | 0 | 30 | 100 | 250 |
| Tracked searches in the top 10 | 0 | 3 | 15 | 50 |
| Referring domains | 53 | 100 | 200 | 400 |
| Indexed pages | 23 | 45 | 80 | 120 |
| Organic sign-ups a month | Not measured | Baseline set in week 4 | 3× baseline | 8× baseline |
| Home main content, mobile lab | 5.2 s | ≤ 2.5 s | ≤ 2.5 s | ≤ 2.5 s |
| G2 and Capterra reviews | Not listed (check) | 10 | 30 | 75 |

---

## 11. Risks

| Risk | Effect | What to do |
|---|---|---|
| **The site outruns the product.** Stop-ship issues G0.1–G0.5 are open, and customer inbound email is broken | Traffic turns into churn and bad reviews | Fix Tier 0 before any paid acquisition. Never promote the Inbox until G0.2 and G2.3 ship |
| **Three people, two jobs** | Content stalls | Name a site owner; hire a contract writer who knows SaaS/CRM; cap work at 2–3 pages a week |
| **Over-promising the AI** | Trust and legal risk | Demonstrable claims only; "you approve what goes out" |
| **Brand confusion** between Rhinon Tech, Rhinon Labs and "Rhino" | Split authority; wrong results for brand searches | One entity description; `Organization` schema with `sameAs`; the Labs ↔ Tech relationship stated on both sites |
| **No rank-tracking budget**: $0.10 of DataForSEO credit left | Progress can't be measured | Top up about $20–50 a month, or rely on Search Console for owned rankings |
| **AI answers take clicks from informational searches** | Guides send less traffic | Weight the plan toward comparison, solution and product pages; earn AI citations (section 3.4) |
| **Thin or copied comparison claims** | Legal and credibility risk | Dated, sourced facts; an honest "when they're the better choice" section |

---

## Appendix: method and data

**DataForSEO calls for this plan** (about $0.19):

| Call | Count | Cost | Covered |
|---|---|---|---|
| `keyword_overview` | 2 | $0.064 | 175 niche searches, US and India |
| `serp_competitors` | 2 | $0.053 | 52 US and 35 India niche searches |
| `keyword_ideas` | 2 | $0.072 | Filtered to growth of 50% or more |

- The module data (274 searches, with monthly trend, difficulty and intent) came from the competitor study's calls, which cost $0.71.
- About $0.10 of credit is left.

**Caveats:**
- **Growth figures:** the "change" column compares the latest month with the same month a year earlier, so single searches are noisy. Brand-new searches show thousands of per cent. The plan relies on signals that repeat across related searches and both countries.
- **Conflicting volumes:** where two endpoints disagreed, this plan uses the ranked-keywords reading. Example: "crm with project management" in the US is 720 in one and 480 in the other.
- **The discovery runs were mostly noise.** They expanded into generic "sales", job and portal-login searches. Only 17 relevant US searches survived the filter, and none for India.
- **Live Google results came back degraded** on 25 November (see `docs/RHINONTECH_SEO_COMPETITORS.md` §7). Rankings here come from DataForSEO's stored Google data.

**Competitor homepages:**
- read on 25 November: HubSpot, Zoho One, monday.com, HoneyBook, Productive, GoHighLevel, Kommo and Chatbase;
- copilot.com turned out to be Microsoft Copilot, so it was excluded;
- parts of the HubSpot, monday.com, HoneyBook and Productive pages were read through a summary.

**The live site:**
- screenshots with headless Chrome at 1440 and 500 px;
- the mobile lab test over the Chrome DevTools Protocol (section 7.1);
- page weight measured with curl (brotli);
- the GTM container parsed from its public URL.
