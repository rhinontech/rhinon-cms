# Rhinon Tech marketing site — revamp plan

Status (2026-11-06): **phase 1 built locally, uncommitted** — home, /product, **11 individually designed
product pages** (one route and one set of components each, no shared template), /ai, /pricing, /security, /integrations, 404, sitemap, robots, OG image. Not yet built: solutions,
compare, blog, changelog, careers, contact/demo form, legal pages (footer links to rhinonlabs.com for
contact and privacy for now). Decisions: marketing site is **rhinontech.com** (bought on Route 53),
the app stays on **rhinontech.in**; palette is the logo navy `#002C70` plus an electric blue → violet →
pink gradient. Product UI is drawn in code (`components/ProductMocks.tsx`), not real screenshots.
Owner: Prabhat. Code: `rhinontech-site/` (Next.js 16).
The app it sells is the admin panel (`rhinontech/admin-panel`), signed into at
`rhinontech.in` (see `rhinontech-site/components/site.ts`).

Reference: ClickUp's site (clickup.com), for structure, density and motion —
**not** its brand. We do not copy their logo, illustrations, screenshots, copy
or exact colours; every visual is ours and every screenshot is our own product.

---

## 0. Blockers before any build

1. **Domain.** ~~`rhinontech.com` unregistered~~ — bought on Route 53 (2026-11-06). The site goes on
   `rhinontech.com`; the app stays on `rhinontech.in`. Still to do: point DNS at wherever it is hosted.
2. **Hosting.** The old Vercel account is locked behind `prabhat@rhinon.tech`.
   The site repo is now `github.com/prabhat-saleszium/rhinontech` (public).
   Host it on a new Vercel account with a working email, or on the EC2 box.
3. **Pricing.** No price list exists in code. Needed for the Pricing page.
4. **Proof.** Real customer logos, quotes and numbers. Without permission to
   use them, those sections ship empty-state-free (removed), never faked.

---

## 1. What we are selling (product = what tenants get)

From the module boundary (platform-only modules are never marketed):

| Product page | Admin module(s) | One-line promise |
|---|---|---|
| CRM | `crm` | Every lead and deal in one pipeline |
| Outreach | `outreach`, `automation` | AI cold email that sounds like you, sent on schedule |
| Inbox | `inbox` | Shared team inbox on your own domain |
| AI Chatbot | `chatbot` | Website bot trained on your docs, with live handoff and tickets |
| Work | `work` | Projects, tasks, boards, Gantt — client delivery without chaos |
| Team Chat & Meetings | `chat`, `meetings` | Chat, group calls and meeting links built in |
| HR & People | `employees`, `documents` | Onboarding, offer letters and e-signing |
| Payroll | `payroll` | Salary runs and payslips |
| Attendance & Leave | `attendance`, `leave` | Check-ins, leave requests, approvals |
| Performance | `performance` | Reviews and goals |
| Pages | `pages` | Landing pages without a developer |

Platform-wide features that get their own page (not a product): **Rhinon AI**
(Gemini across CRM, Outreach, Chatbot, letters), **Roles & Permissions**,
**Security**, **Integrations** (GitHub, Slack, AWS SES, Google).

Out of scope for marketing: Provisioning, Content, Startup Ideas, Docs access,
Deploy, Analytics.

---

## 2. Sitemap — 30 pages

| # | Page | Route |
|---|---|---|
| 1 | Home | `/` |
| 2–12 | 11 product pages (table above) | `/product/<slug>` e.g. `/product/crm` |
| 13 | All products overview | `/product` |
| 14 | Rhinon AI | `/ai` |
| 15 | Pricing | `/pricing` |
| 16–19 | Solutions: Agencies, Startups, Sales teams, HR teams | `/solutions/<slug>` |
| 20 | Integrations | `/integrations` |
| 21 | Security & trust | `/security` |
| 22 | Compare hub + 2 to start (vs Zoho, vs HubSpot) | `/compare/<slug>` |
| 23 | Customers / case studies | `/customers` (only once real ones exist) |
| 24 | About | `/about` |
| 25 | Contact & Book a demo | `/contact`, `/demo` |
| 26 | Blog (reuses the CMS blog API, new `domain`) | `/blog`, `/blog/<slug>` |
| 27 | Changelog | `/changelog` |
| 28 | Careers | `/careers` |
| 29 | Privacy, Terms, Cookies | `/legal/<slug>` |
| 30 | 404 | — |

Phase 1 (launch): 1, 2–13, 15, 20, 21, 24, 25, 29, 30 → **20 pages**.
Phase 2: AI, Solutions, Compare, Blog, Changelog. Phase 3: Customers, Careers.

---

## 3. Navigation (ClickUp-style mega menu)

`Logo · Product ▾ · Solutions ▾ · AI · Pricing · Resources ▾ — Log in · Book a demo · [Get started free]`

**Product mega menu** — three grouped columns plus a promo card:
- *Sell*: CRM, Outreach, Inbox, AI Chatbot
- *Deliver*: Work, Team Chat & Meetings, Pages
- *People*: HR & People, Payroll, Attendance & Leave, Performance
- Card: "Rhinon AI — built into every module" → `/ai`

**Solutions**: by team (Sales, HR, Agencies, Startups).
**Resources**: Blog, Changelog, Help (later), Security, Integrations.

Mobile: full-screen sheet, accordion per group. Sticky header turns solid with a
blur after 8px scroll.

Footer: 5 columns (Product, Solutions, Resources, Company, Legal), status of the
signup CTA again, socials, `© Rhinon Tech`.

---

## 4. Home page — section by section

1. **Hero.** Badge: "New · AI in every module". H1: *"One workspace to sell,
   deliver and run your company."* Sub: "CRM, outreach, chatbot, projects and HR
   in one place — so you stop paying for ten tools." CTAs: *Get started free* /
   *Book a demo*. Under it: product screenshot in a browser frame, tilting flat
   on scroll.
2. **Feature pill strip.** Clickable chips for all 11 products; each scrolls the
   tab demo below to that product.
3. **"Replace your stack."** Logos-style row of the tool categories we replace
   (CRM, cold email, live chat, PM, HR, payroll) collapsing into one Rhinon card.
   Text labels, not other companies' logos.
4. **Tabbed product demo.** Tabs: Sell / Deliver / People / AI. Each tab swaps a
   real screenshot or short loop video with 3 bullets and a link to its page.
5. **Rhinon AI band** (dark section). Three cards: drafts cold email, answers
   website visitors, rewrites letters. Typing animation inside each card.
6. **Numbers.** Only real ones (modules, uptime, emails sent) — remove if none.
7. **Built for teams like yours.** 4 solution cards.
8. **Security & control.** Roles you control, data isolated per workspace,
   encrypted secrets. Link to `/security`.
9. **Integrations grid.** GitHub, Slack, Google, AWS SES, WhatsApp, etc.
10. **Testimonials** — only with real, approved quotes.
11. **Pricing teaser.** Plans in short, link to `/pricing`.
12. **FAQ** (6–8 questions).
13. **Final CTA** on gradient: "Run your whole company from one tab."

---

## 5. Product pages — each one its own page

Revised 2026-11-06. The first build used one shared template with only the colour changing, which made
every product page feel the same. Each product now has its own route (`app/product/<slug>/page.tsx`)
and its own demo components (`components/product/<slug>.tsx`), with a different hero, theme and motion:

| Page | Theme | Hero | Signature motion |
|---|---|---|---|
| CRM | light, blue/violet | board with a deal dragged to Won by a cursor | scroll-driven lead lifecycle, sources converging |
| Outreach | dark | AI composer researches, types, gets approved, sends | pulse flow, scheduler dial, live feed |
| Inbox | warm light, cyan | inbox clearing to zero | status river, priority re-sort, address routing |
| AI Chatbot | sunset gradient | widget answering on a real-looking site | training, human handover, voice call |
| Work | mint | timeline building itself | task anatomy, list/board/calendar/team morph |
| Team Chat | dark navy | conversation with thread and reactions | six micro-demos, call grid, guest join |
| Pages | paper + serif | a page being written | page tree, pinboard, workspace switch |
| HR & People | lavender | hire travelling offer to day one | signature drawing, phone onboarding, offboarding |
| Payroll | amber | fan of payslips | run stepper, structure and donut, flip wall |
| Attendance | dark teal | clock-in ring | heatmap, leave flow, 10 pm auto-close |
| Performance | dark violet | three rings closing | cycle tabs, goals, review flow, team heat |

Shared pieces live in `components/motion.tsx` (in-view loops, a gliding cursor, rings, counters, confetti,
auto-advancing tabs, sticky scroll story). Shared nav data stays in `content/products.ts`; page copy lives
in each page. Every demo loops only while on screen and rests on a finished frame under reduced motion.

## 6. Design system (inspired by ClickUp's feel, our own brand)

To be verified against the live clickup.com in a browser — the fetch could not
read their CSS, so nothing below claims to be their exact values.

- **Feel:** light, white-dominant pages; one dark band per page; vivid
  gradient accents on CTAs, badges and headline highlights; lots of real UI.
- **Colour tokens:** `--ink #0E0F1A`, `--muted #5B6070`, `--line #E7E8EE`,
  `--bg #FFFFFF`, `--bg-soft #F7F7FB`, `--night #0B0C1F`. Brand gradient:
  violet `#7B5CFF` → magenta `#E04DD6` → coral `#FF7A59` (ours; tune in Figma).
  One accent per product for its icon and page highlights.
- **Type:** one geometric sans for display + UI (e.g. Inter Display / Plus
  Jakarta Sans); 64–72px hero, 44–52px H2, 16–18px body.
- **Shape:** 12px buttons, 20–28px cards, soft shadows, 1px borders.
- **Dark mode:** not for v1 marketing pages.

## 7. Motion

All respect `prefers-reduced-motion`.
- Scroll reveal (fade + 12px rise), already in `components/Reveal.tsx`.
- Hero screenshot tilt-to-flat on scroll.
- Tabbed demo with auto-advance progress bar, pause on hover.
- Marquee for the integrations/pill strip.
- Typing effect in AI cards; counters on numbers.
- Mega menu: 150ms fade/slide; button hover lift.
- Library: CSS + IntersectionObserver first; add `motion` (Framer) only for the
  tab demo and layout transitions. No Lottie unless a designer supplies files.

---

## 8. Build & production readiness

- Next.js 16 App Router, static where possible (`generateStaticParams` for
  products/solutions/compare); blog via existing `/public/blogs?domain=…`.
- Forms (demo, contact) post to `/public/web-leads` with a new Site slug for
  this brand, so leads land in its CRM — needs a `Site` row on prod.
- SEO: per-page metadata, OG images, `sitemap.xml`, `robots.txt`, JSON-LD
  (Organization, SoftwareApplication, FAQPage), canonical URLs.
- Performance: Lighthouse ≥ 90 mobile, AVIF/WebP screenshots, lazy video.
- Accessibility: keyboard mega menu, focus rings, alt text, contrast AA.
- Analytics: our own `/t.js` snippet. Cookie notice only if we add 3rd-party.
- Legal: privacy/terms move off rhinonlabs.com onto this site.
- Visual check of every page at 375 / 768 / 1280 before launch.

## 9. Order of work

1. Decide domain, pricing, hosting (section 0).
2. Design tokens + Navbar/Footer/mega menu + 3 shared section components.
3. Home page.
4. Product template + 11 product content entries (screenshots from the app).
5. Pricing, Security, Integrations, About, Contact/Demo, Legal, 404.
6. SEO/perf/a11y pass → deploy → Phase 2 pages.

## 10. Open questions

- Domain: buy `rhinontech.com`, or launch on `rhinontech.in`?
- Plans and prices (per user? per module? free tier?).
- Which customers can be named?
- Is Rhinon Tech also an agency brand, or only the product? (Rhinon Labs covers
  services today.)
