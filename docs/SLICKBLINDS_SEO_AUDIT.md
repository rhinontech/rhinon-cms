# Slick Blinds — SEO & Growth Audit

**Date:** 25 November 2026
**Site:** https://slickblinds.com (sitemap: https://slickblinds.com/sitemap.xml)
**Scope:** technical SEO, architecture, indexing, keywords, on-page, content, competitors, backlinks, internal linking, schema, speed, organic visibility, conversion, AI search
**Method:** a live crawl of all 58 sitemap URLs plus every internal link (62 URLs), with HTTP headers, HTML, schema and text analysis. Pages were also rendered in headless Chrome, both as screenshots and as rendered DOM. Other inputs were 39 historical URLs from the Wayback Machine, WHOIS and DNS lookups, the public Google Tag Manager container, a lab performance probe, and web searches for brand, competitor and citation checks. Ranking, keyword-volume and backlink data could not be pulled (see section 14).

---

## 1. Executive summary

**Objective:** turn slickblinds.com into a dependable source of in-home consultation bookings, nationally and for each dealer market.

**Where Slick Blinds stands:** the site is a modern, server-rendered Next.js build. Its foundations are clean: one canonical host, self-referencing canonicals, a logical product taxonomy, Organization, Service and Breadcrumb schema, a 2-step lead form, and AI crawlers allowed. The problems sit in the parts that drive local leads and trust:

- **The URL migration broke old links.** The city pages moved from `/locations/Houston,TX/` to `/houston-tx/` sometime after March 2026. All 14 archived old city URLs now return 404 with no redirect. 19 older URLs (2017 and 2024 versions) return blank pages instead of redirecting.
- **The 20 city (dealer) pages are invisible inside the site.** Not one internal link points to them, and there is no locations hub. They exist only in the sitemap.
- **The city pages are near-duplicate templates.** Some pairs share 92–94% of their text. 17 of 20 show no address. 11 of 20 show a phone number from another state or metro. Testimonials are reused across states: one review appears on Minnesota, Texas, Tennessee and Nebraska pages.
- **Pages that don't exist return HTTP 200.** These are soft 404s: any mistyped or old URL under the dynamic routes shows a blank page instead of a 404.
- **There is nothing for research-stage buyers.** The site has no pricing guidance, no guides and no comparisons. The SERPs for cost and comparison questions are held by aggregators (Angi, HomeAdvisor, Thumbtack) and online retailers.
- **Trust signals are thin or unverifiable.** The site has no people, no founding year and no showroom photos. It claims "15 locations", "17 cities" (in llms.txt) and has 19 city pages. A "4.9/5 by 1000's" Google rating appears with no link to the profile. The warranty is only available as a PDF on another domain.

**The fastest gains are fixes, not new content:** redirects, the 404 behaviour, a locations hub, real local data on the city pages, and checking the phone numbers. Rankings for commercial terms then depend on local proof (reviews, photos, consistent citations) and on a small set of genuinely useful guides, starting with cost.

### Scorecard

Scores are a judgement based on the evidence in this report.

| Area | Score | Summary |
|---|---|---|
| Technical foundation | 6/10 | SSR, HTTPS/HSTS, canonicals and parameter handling are solid. Soft 404s, unredirected legacy URLs, uncached HTML, no CDN |
| Architecture & internal linking | 3/10 | Logical product tree. City and room pages orphaned. Menu links invisible to crawlers |
| On-page | 5/10 | Unique titles and descriptions on core pages. City titles random and unbranded, descriptions up to 538 chars, H1 typos |
| Content | 3/10 | Generic product copy. No guides, no pricing. Duplicate room and city templates. 174-question FAQ with 53 duplicates |
| Local SEO | 2/10 | 20 city pages but no hub. 17 without address, 11 with out-of-area phones, reused reviews, inconsistent citations |
| Trust / E-E-A-T | 3/10 | Reviews present but reused and undated. No people or story. Warranty in a PDF. Conflicting company facts |
| Structured data | 5/10 | Good Organization, WebSite, Breadcrumb and Service graph. Invalid Product on 14 pages. No LocalBusiness on 17 city pages |
| Performance | 5/10 | CLS ≈ 0, AVIF images, lean first-party JS (~165 KB). ~960 KB of third-party tag JS. HTML rendered on every request |
| Conversion & measurement | 6/10 | 2-step form on consultation and city pages, call buttons, GA4 and Ads conversions. Weak homepage hero CTA, no price anchor, stale "Spring" promo |
| AI-search readiness | 4/10 | AI crawlers allowed and content is SSR. llms.txt points to non-existent pages, facts are inconsistent, little third-party corroboration |
| Organic visibility (outcome) | n/a | Not measurable without Search Console. Third-party data unavailable (section 14) |

### The 10 issues that matter most

| ID | Issue | Severity | Effort |
|---|---|---|---|
| C-01 | Old URLs return 404 or blank pages instead of redirecting (14 city URLs, 22 older URLs) | Critical | 2–4 h |
| C-02 | All 20 city pages are orphaned; no locations hub | Critical | 1–2 days |
| C-03 | City pages are near-duplicate templates with thin local signals | Critical | 2–4 weeks (rolling) |
| H-01 | Non-existent URLs return HTTP 200 (soft 404s) | High | 0.5–1 day |
| H-02 | 11 of 20 city pages show an out-of-market phone number | High | 1–2 days |
| H-03 | Testimonials reused across states; rating claims unverifiable | High | 2–3 days |
| H-04 | No pricing guidance anywhere | High | 3–5 days |
| H-09 | Mega-menu links render only on hover, so crawlers can't follow them | High | 0.5 day |
| H-07 | Inconsistent citations (4+ addresses) and a small off-site footprint | High | Ongoing |
| H-05 | No guides or comparisons for research-stage searches | High | Ongoing |

The full register of 34 issues is in section 4. Section 4 also maps every issue to the 14-point audit framework.

### Expected outcome (realistic)

- **Weeks 1–6:** the redirect and 404 fixes show up in Search Console as Google recrawls: the 404 and soft-404 counts fall and redirected URLs consolidate. This is hygiene and recovery, not growth.
- **Months 2–4:** once the city pages are linked, de-duplicated and tied to real dealer data, expect them to be indexed reliably and to start earning impressions for "{product} {city}" queries. Movement in the map (local pack) results will come mostly from Google Business Profile work: reviews, categories and consistent NAP.
- **Months 3–6:** the cost guide and comparison guides can start ranking for long-tail informational queries, and they become citable by AI answers.
- **No traffic forecast is given.** There is no baseline (no Search Console or GA4 access, and DataForSEO was unavailable). Capture the baseline in week 1 (section 13) and set numeric targets from it.

---

## 2. Business and current situation

### 2.1 What the business is (as the site presents it)

- **Slick Blinds LLC** has its HQ at 16718 House & Hahl Rd Suite E2, Cypress, TX 77433. It uses a national number (+1 800-348-6530) and support@slickblinds.com.
- It sells custom blinds, shades, shutters, drapes, motorization and outdoor shades through a **free in-home consultation → precise measurement → professional installation** model.
- **Own product lines:**
  - **Vara** is premium ("luxury") and **Rassa** is "everyday/affordable".
  - **Gamana Tech** is motorization: Matter-compatible, with a 5-year motor warranty.
  - Named products include Nupoly (faux wood and poly shutters), Majestic Wood, Designer Weave (roller), Thermacell (honeycomb), Dualview (zebra) and Estate (hardwood shutters).
  - Warranty names vary: "SlickShield Worry-Free" and "Limited Lifetime".
- **Dealer network:** there are 20 city pages for 19 markets in TX, MN, NC, OH, GA, MI, TN, NE, FL, CA and CT, each with a "Dealer details" block. A `/become-a-dealer/` page recruits dealers with "up to 30–40% profit margins" and "optional territory exclusivity".
- **Two audiences:** homeowners (B2C) and prospective dealers (B2B).
- **Likely core customer:** new-home buyers in suburban, master-planned communities. The evidence is the "Enter to win $1500 worth of shades for your new home!" offer on 18 of 20 city pages, and service areas such as Bridgeland, Fairfield, Prosper, Manvel and The Woodlands. (Apple Valley runs a dated offer instead: "Buy One Shade, Get One FREE… by November 30, 2026".) *Confirm this with Bitrix24 data before building the strategy around it (section 3).*

### 2.2 Site history (why legacy URLs matter)

| Period | Evidence | URL pattern |
|---|---|---|
| Domain registered 12 Mar 2017 (GoDaddy) | WHOIS | — |
| 2017–2022 static site | Wayback captures | `/Blinds.html`, `/Curtains.html`, `/Verticals.html`, `/freeblinds.html`, `/Warranty.html`… |
| ~2024 rebuild | Wayback, Nov 2024 | `/about-us`, `/contact-us`, `/warranty`, `/termsandconditions`, `/promo`, `/Vara`, `/Gamana%20Tech/...` |
| By Mar 2026 | Wayback, 6 Mar 2026 | `/locations/Houston,TX/` (14 captured) |
| Now (Nov 2026) | Live crawl | `/houston-tx/`, `/products/{category}/{product}/` |

### 2.3 Stack and measurement

| Layer | Finding |
|---|---|
| Framework | Next.js App Router (React Server Components), `trailingSlash` enabled |
| Hosting | One Azure VM (IP 74.235.99.201, Microsoft), nginx 1.24 on Ubuntu, no CDN in front |
| Assets | Azure Blob Storage (`slickblindsprod.blob.core.windows.net`). The file naming (`Name_hash.webp`) suggests a headless CMS such as Strapi |
| Images | `next/image` on the same VM (AVIF output, 1-day cache) |
| Lead capture | Bitrix24 CRM web form (`slickblinds.bitrix24.in`, India-hosted portal), rendered client-side. 2 steps: product, ZIP, name, email, phone |
| Tags | GTM `GTM-TK8ZHCND`: GA4 `G-6G9H3BQMKZ`, Google Ads conversion tags for **two** accounts (AW-17492848711 ×4, AW-18546495223 ×3), a `google_form_lead` GA4 event and a custom `generate_lead` push. Meta pixel and Microsoft Clarity also load |
| Paid search | `/lps-houston-tx/` is a paid landing page that is also indexable and in the sitemap |

---

## 3. Positioning analysis

### 3.1 What the site says about itself
"Custom Window Treatments, Designed Around You." It offers premium and affordable collections, free in-home design consultation, expert installation and a lifetime warranty, "nationwide" through "local experts". This is the same promise Budget Blinds, 3 Day Blinds, Gotcha Covered and every Hunter Douglas dealer makes. Nothing in the hero or meta copy says why Slick Blinds rather than them.

### 3.2 Strengths the site under-uses
1. **Motorization as standard, not an upsell.** Gamana Tech is Matter-compatible, works with Alexa, Google and Siri, offers solar charging and carries a 5-year motor warranty. Several reviews mention app control. Few local competitors lead with this.
2. **Zebra and triple shades.** These are popular, less commoditised products, and the reviews repeatedly mention zebra shades.
3. **Value against national brands.** For example, a Houston review says: "after getting quotes from several vendors charging nearly double… we were thrilled to find Slick Blinds."
4. **New-home timing.** The $1,500 new-home offer, shown on 18 city pages, suggests a channel (new-construction buyers) that most competitors treat generically.

### 3.3 Recommended position (to validate)
> **"Custom blinds, shades and shutters for new and growing homes, smart-ready from day one. Measured, made and installed by your local Slick Blinds dealer."**

Validate it first. Pull the share of Bitrix24 leads and closed deals from new-construction homes, the average order size, and the products most sold per market. If new construction is not the core, lead with motorization plus value instead. Either way, every city page, the homepage hero and the About page should carry one concrete differentiator. Today they say "premium" and "stress-free".

---

## 4. Issue register

**Severity scale**
- **Critical:** losing leads or equity now, or blocking local growth. Fix this week or start now.
- **High:** significant ranking, trust or conversion impact. Fix within 30 days.
- **Medium:** noticeable but secondary. Fix within 60–90 days.
- **Low:** hygiene.

**Priority:** P1 = week 1 · P2 = weeks 2–4 · P3 = weeks 5–8 · P4 = weeks 9–12.

| ID | Issue | Severity | Priority | Area | Effort | Owner |
|---|---|---|---|---|---|---|
| C-01 | Old URLs return 404 or blank pages instead of redirecting | Critical | P1 | Technical / indexing | 2–4 h | Dev |
| C-02 | City pages orphaned; no locations hub | Critical | P2 | Architecture / linking | 1–2 days | Dev + Content |
| C-03 | City pages are near-duplicate templates with thin local signals | Critical | P2–P3 | Local / content | 2–4 weeks | Content + Dealer ops |
| H-01 | Non-existent URLs return HTTP 200 (soft 404s) | High | P1 | Technical | 0.5–1 day | Dev |
| H-02 | 11 of 20 city pages show an out-of-market phone number | High | P1 | Local / conversion | 1–2 days | Dealer ops |
| H-03 | Testimonials reused across states; rating claims unverifiable | High | P2 | Trust / compliance | 2–3 days | Marketing + Dev |
| H-04 | No pricing guidance anywhere | High | P3 | Content / conversion | 3–5 days | Owner + Content |
| H-05 | No guides or comparisons for research-stage searches | High | P3 | Content | Ongoing | Content |
| H-06 | Weak E-E-A-T; inconsistent company facts | High | P2 | Trust | 2–3 days | Owner + Content |
| H-07 | Inconsistent citations; small off-site footprint | High | P2–P4 | Local / authority | Ongoing | Marketing |
| H-08 | City titles and H1s target random products and a wrong place name | High | P2 | On-page | 0.5 day | Content + Dev |
| H-09 | Mega-menu links render only on hover; crawlers can't follow them | High | P2 | Architecture | 0.5 day | Dev |
| M-01 | Shop-by-room pages are orphaned near-duplicates | Medium | P4 | Content / architecture | 3–5 days | Content |
| M-02 | ~1.2 MB JS per page, ~82% third-party tags | Medium | P4 | Performance | 1–2 days | Dev + Marketing |
| M-03 | HTML not cached; no CDN | Medium | P4 | Performance / infra | 1–2 days | Dev |
| M-04 | Invalid Product schema; LocalBusiness missing on 17 city pages | Medium | P2 | Schema | 0.5–1 day | Dev |
| M-05 | 70% of images have empty alt, including all real photos | Medium | P2 | Images / accessibility | 1 day | Content |
| M-06 | Gallery is thin, uncaptioned and barely linked | Medium | P3 | Content | 1–2 days | Content |
| M-07 | Product pages are generic: no specs, prices or product FAQs | Medium | P3 | Content | 1 day per page | Content |
| M-08 | FAQ page: 174 Q&As, 53 duplicates, city questions on the global page | Medium | P3 | Content | 0.5 day | Content |
| M-09 | Visible QA defects (placeholder H2, stale promo, wrong OG tags, typos) | Medium | P1 | Quality | 2–3 h | Content + Dev |
| M-10 | Warranty only in a PDF on another domain; naming inconsistent | Medium | P3 | Trust / content | 0.5–1 day | Owner + Dev |
| M-11 | Dealer page reuses consumer copy and lacks program detail | Medium | P4 | B2B conversion | 1–2 days | Owner + Content |
| M-12 | llms.txt points AI crawlers to non-existent pages and products | Medium | P1 | AI search | 1–2 h | Dev |
| M-13 | Measurement: two Ads accounts, no lead-quality feedback | Medium | P2 | Measurement | 1 day | Marketing |
| M-14 | Homepage has no primary consultation CTA or form above the fold | Medium | P2 | Conversion | 0.5–1 day | Dev + Marketing |
| L-01 | Two-hop redirect from `http://www` | Low | P4 | Technical | 15 min | Dev |
| L-02 | nginx version disclosed in `Server` header | Low | P4 | Security hygiene | 5 min | Dev |
| L-03 | Sitemap: no lastmod; careers missing; noindex candidates included | Low | P2 | Indexing | 1 h | Dev |
| L-04 | HowTo schema (rich result retired); FAQ rich results unavailable | Low | P4 | Schema | 30 min | Dev |
| L-05 | Job page lacks JobPosting schema | Low | P4 | Schema | 1 h | Dev |
| L-06 | Root error boundary replaces the page with raw "Loading chunk failed" text | Low | P4 | Resilience | 2–3 h | Dev |
| L-07 | 7 CTA links point to `/free-consultation` without the slash (internal 301) | Low | P4 | Linking | 15 min | Dev |
| L-08 | Brand written three ways; robots.txt carries obsolete directives | Low | P4 | Consistency | 30 min | Content + Dev |

### Coverage of the 14-point framework

| # | Framework area | Where it is covered |
|---|---|---|
| 1 | Technical SEO | C-01, H-01, M-03, L-01, L-02, L-06 |
| 2 | Website architecture | C-02, H-09, M-01 |
| 3 | Indexing and crawling | C-01, H-01, L-03, L-08, section 11 |
| 4 | Keyword research and mapping | H-08, section 9 (volumes pending; see section 14) |
| 5 | On-page SEO | H-08, M-09, L-08 |
| 6 | Content quality | C-03, H-04, H-05, M-06, M-07, M-08 |
| 7 | Competitor analysis | Section 10 |
| 8 | Backlink profile | H-07; data limitation in section 14 |
| 9 | Internal linking | C-02, H-09, M-01, M-06, L-07 |
| 10 | Schema | M-04, L-04, L-05 |
| 11 | Page speed / Core Web Vitals | M-02, M-03, Appendix D |
| 12 | Organic traffic and rankings | Section 13 (baseline to capture); section 14 |
| 13 | Conversion and lead generation | H-02, H-03, H-04, M-10, M-11, M-13, M-14 |
| 14 | AI search visibility | M-12, H-05, H-06, H-07 |

---

## 5. Critical issues

### C-01 · Old URLs return 404 or blank pages instead of redirecting

**Severity:** Critical · **Priority:** P1 · **Area:** Technical / indexing · **Effort:** 2–4 h · **Owner:** Dev

**Evidence:** the Wayback Machine holds 39 archived HTML URLs from earlier versions of the site. Each one was requested live on 25 Nov 2026:

| Result today | Count | Examples |
|---|---|---|
| **404, no redirect** | 17 | All 14 old city URLs (`/locations/Houston,TX/`, `/locations/Austin,TX/`, `/locations/Prosper,TX/`…) and three `/Gamana%20Tech/...` sub-pages |
| **200 with a blank page** (header and footer only, title "Slick Blinds", `noindex`) | 19 | `/contact-us`, `/warranty`, `/termsandconditions`, `/promo`, `/Vara` (capital V), `/Gamana%20Tech`, `/Blinds.html`, `/Shades.html`, `/Shutters.html`, `/Curtains.html`, `/Verticals.html`, `/about.html`, `/contact.html`, `/gallery.html`, `/services.html`, `/freeblinds.html`, `/index.html`, `/Terms.html`, `/Warranty.html` |
| Redirects correctly | 2 (+ homepage) | `/about-us`, `/privacy-policy` |

The same cities now live at `/houston-tx/`, `/austin-tx/` and so on, but nothing connects the old address to the new one.

**Why it matters:** anything that still points to these URLs now lands on an error. That includes Google's index, dealers' Google Business Profiles, directory listings, old ads and emails, social posts and other websites. Rankings and link equity those URLs earned are not passed to the new pages. The city URLs changed most recently, so their rankings and GBP links are the most likely to be live and the most valuable. The domain dates back to 2017, so even the `.html` URLs may still carry links.

**Recommended solution:** 301-redirect every legacy URL to its closest live page, then update the links you control.

**Implementation steps**
1. Add the rules in **Appendix A** to the nginx `server` block for `slickblinds.com` (port 443), above the location that proxies to Next.js. Run `nginx -t` and reload.
2. Add the generic `/locations/{City},{ST}/` rule (Appendix A, Next.js middleware). It catches city URLs the archive didn't capture (e.g. Apple Valley, Manvel, San Antonio, South Windsor).
3. In Google Search Console, export the URLs under **Pages → Not found (404)** and **Soft 404**. Add any missing ones to the map.
4. Update each dealer's GBP **Website** field to the new city URL, with UTM tags (e.g. `?utm_source=google&utm_medium=organic&utm_campaign=gbp-houston`). Do the same on Yelp, Facebook and any directory listing.

**Expected impact:** recovers whatever rankings and link equity the old URLs still hold, and stops sending GBP and directory visitors to error pages. The size of the gain can't be quantified without Search Console or backlink data.

**How to validate:** `curl -sI "https://slickblinds.com/locations/Houston,TX/"` should return `301` with `location: https://slickblinds.com/houston-tx/`. Run the full Appendix A list through a status checker: every URL should be a single 301 hop to a 200 page. Over 2–6 weeks, the Search Console 404 report should stop listing these URLs.

---

### C-02 · All 20 city pages are orphaned; there is no locations hub

**Severity:** Critical · **Priority:** P2 · **Area:** Architecture / internal linking · **Effort:** 1–2 days · **Owner:** Dev + Content

**Evidence**
- In a crawl of all 62 URLs, **no internal link points to any of the 20 city pages** (Appendix B). They are reachable only through the sitemap.
- There is no hub. `/locations/` returns a blank 200 page (a soft 404).
- Neither the server HTML nor the browser-rendered page has an "Areas we serve" block, a "Find a dealer" link or any city link in the header, footer or menus.
- The same applies to the eight shop-by-room pages (M-01).

**Why it matters:** internal links are how Google discovers pages, judges their importance and understands what they cover. A page that appears only in a sitemap, and that looks like a template variant of 19 others (C-03), is the classic candidate for "Discovered/Crawled – currently not indexed". These are Slick Blinds' local landing pages. They should rank for "custom blinds Houston" or "shutters Prosper TX", and dealers' GBP profiles should point to them.

**Recommended solution:** a crawlable locations architecture. **Keep the current city URLs** (they just moved; another move adds risk).

**Implementation steps**
1. Build `/locations/` ("Areas We Serve" / "Find a Dealer"). Group dealers by state, then by city. For each, show the city link, local phone, address (or "service-area business") and the towns served. Add a ZIP lookup that routes to the right city page.
2. Link `/locations/` from the header ("Find a Dealer") and the footer. Add a footer block listing every city, or one link per state.
3. Link city pages contextually:
   - from `/free-consultation/` ("Serving Houston, Cypress, The Woodlands, Prosper…")
   - from About
   - from product pages ("Available from our dealers in…")
   - between neighbouring cities ("Also serving Cypress and The Woodlands")
4. Add breadcrumbs (Home › Locations › Texas › Houston) and make BreadcrumbList match.
5. Remove `/lps-houston-tx/` from the sitemap and set it to `noindex` (see C-03). Don't link it.

**Expected impact:** city pages get crawled and indexed reliably, and authority flows to them from the homepage and product pages. This is a prerequisite for any city page to rank.

**How to validate:** in a re-crawl, every city page should have at least 3 internal links in (hub, footer or state page, plus one contextual link). Search Console URL Inspection on 3 city pages should report "URL is on Google". In the Pages report, city URLs should leave the "not indexed" buckets.

---

### C-03 · City pages are near-duplicate templates with thin local signals

**Severity:** Critical · **Priority:** P2–P3 · **Area:** Local SEO / content · **Effort:** 2–4 weeks, rolling by market · **Owner:** Content + Dealer ops

**Evidence**
- **Duplication.** After removing sitewide header and footer text, some pairs of city pages share most of their 5-word phrases: Manvel/Woodland **94%**, Cypress/Houston **92%**, Apple Valley/Manvel **79%**. The average across all pairs is 42% (Appendix B).
- **Template body.** On most city pages, everything after the hero is the same template: "Why {City} Homeowners Love Working With Us… Our team lives and works in your community — we know local homes best", then identical product cards, collections and FAQ. Three pages carry some city-specific copy: Austin (45 sentences found on no other city page, mostly a local FAQ), Prosper (38, mostly local reviews) and the Houston paid page (30). They are the model to extend. By contrast, `/houston-tx/` has only 4 sentences not found elsewhere.
- **No address.** 17 of 20 pages show no street address. Only Apple Valley, Prosper and South Windsor do, and only those three carry LocalBusiness schema.
- **No local proof.** There are no team names or photos, no local install photos, no communities or HOAs, no map and no link to the location's Google Business Profile.
- **Undated, reused reviews.** Every review shows the hard-coded text "5 months ago" (stored as `"date":"5 months ago"`), and reviews are reused across states (H-03).
- **Wrong place name.** `/woodland-tx/` targets "Woodland, TX", but its own service area lists "The Woodlands, Spring, Conroe, Magnolia". Searchers type "The Woodlands".
- **Two Houston pages.** `/houston-tx/` and `/lps-houston-tx/` are 60% similar and target the same query. The second one is a paid landing page, yet it is indexable and in the sitemap.

**Why it matters:** local organic rankings reward proof of real local presence: an address or GBP, local reviews, local work and local knowledge. Pages that swap the city name into the same template match what Google's spam policies describe as doorway pages ("substantially similar to each other… targeted at specific regions or cities"). Today the city pages give Google, and the homeowner, no reason to choose Slick Blinds over Budget Blinds of Cypress or a local shutter company that shows its team, address and reviews.

**Recommended solution:** rebuild the city template around **real dealer data**. Start with the 3–5 markets that bring the most revenue (probably Houston/Cypress, Prosper and The Woodlands; confirm in Bitrix24).

**Implementation steps** (each block must be unique per city)
1. **Dealer card:** dealer or consultant name and photo, address (or "serving {towns}" for service-area businesses), a local phone number (H-02), hours, a link to that location's GBP, and an embedded map.
2. **Local proof:** 3–6 reviews from *that* location's GBP with real dates and a source link; the review count and rating; at least 4 captioned local install photos (e.g. "Dualview zebra shades, Bridgeland, Cypress").
3. **Local relevance:** communities served (e.g. Bridgeland, Towne Lake and Fairfield for Cypress), climate notes (heat and humidity point to poly shutters and cellular shades), builder and new-construction timing, and HOA notes where relevant.
4. **Local FAQ:** 3–5 questions unique to the market. Move the city questions currently on `/faqs/` here (M-08).
5. **Fix place names:** rename Woodland to **The Woodlands, TX** in the title, H1 and copy now. When the page is rebuilt, move it to `/the-woodlands-tx/` with a 301 and update Appendix A.
6. **Paid landing page:** set `/lps-houston-tx/` to `noindex` and remove it from the sitemap. Keep it for ads.
7. **No dealer, no page.** Where a market no longer has an active dealer, redirect its page to `/locations/` instead of keeping an empty promise.

**Expected impact:** the biggest single lever for local organic visibility, plus better conversion, because visitors see a real local team.

**How to validate:**
- Re-run the duplicate check: no two city pages should be above 30% similar.
- Each page should show an address or GBP link, at least 3 local reviews and at least 4 local photos.
- In Search Console, impressions per city page for "{product} {city}" queries should trend up over 8–12 weeks.

---

## 6. High-priority issues

### H-01 · Non-existent URLs return HTTP 200 (soft 404s)

**Severity:** High · **Priority:** P1 · **Area:** Technical · **Effort:** 0.5–1 day · **Owner:** Dev

**Evidence**
- These URLs all return **200** with a blank page titled "Slick Blinds": `/this-page-does-not-exist-xyz/`, `/products/blinds/not-a-real-blind/`, `/products/shop-by-room/garage/`, `/blog/`, `/locations/`, `/contact-us/`, `/HOUSTON-TX/`, `/sitemap_index.xml`, `/image-sitemap.xml`.
- These pages carry **two contradictory robots tags** (`noindex` and `index, follow`) and a canonical pointing to the junk URL itself.
- URLs that don't match any dynamic route (e.g. `/locations/Austin,TX/`, `/Products/Blinds/`) correctly return **404 "Page not found"**.
- This pattern matches Next.js calling `notFound()` *after streaming has started*, which happens under a `loading.tsx` or Suspense boundary. The headers have already been sent with status 200, so Next.js can only inject a `noindex` tag.

**Why it matters:** Google reports these URLs as soft 404s and keeps recrawling them. They also hide real breakage: old links look healthy to any monitor because they return 200 (C-01). A user who follows a bad link sees an empty page with no message and no way forward.

**Recommended solution and steps**
1. For dynamic segments with a known slug set (`[city]`, `products/[category]/[product]`, `products/shop-by-room/[room]`), export `generateStaticParams()` and set `export const dynamicParams = false`. Unknown slugs then return a real 404 at the routing layer.
2. If new CMS slugs must go live without a redeploy, keep `dynamicParams`. Instead, run the CMS lookup and `notFound()` before any Suspense boundary: remove `loading.tsx` from those segments, or do the existence check at the top of the page or in `generateMetadata`.
3. Remove the global `robots: { index: true, follow: true }` from the root layout metadata. It is the default anyway, and it creates the contradictory pair on error pages.
4. Make the 404 page useful: links to the categories, "Find a dealer", the consultation CTA and the phone number.

**Expected impact:** cleaner crawling and an honest error signal, so the redirects in C-01 can be verified and maintained.

**How to validate:** `curl -s -o /dev/null -w '%{http_code}' https://slickblinds.com/products/blinds/not-a-real-blind/` → `404`. The same for `/random-xyz/`. The Search Console soft-404 count should trend to about 0.

---

### H-02 · 11 of 20 city pages show an out-of-market phone number

**Severity:** High (Critical if any number is wrong) · **Priority:** P1 · **Area:** Local / conversion · **Effort:** 1–2 days · **Owner:** Dealer ops

**Evidence:** these are the local numbers shown in each city page's "Call us on" block (Appendix B):

| City page | Number shown | Area code belongs to |
|---|---|---|
| Austin, TX | 919-793-6943 | Raleigh, NC |
| Charlotte, NC | 203-710-2241 | Connecticut |
| Cumming, GA | 847-722-4385 | Illinois (Chicago north suburbs) |
| Detroit, MI | 716-547-9605 | Buffalo, NY |
| Nashville, TN | 507-210-9975 | Southern Minnesota |
| Orlando, FL | 704-402-4173 | Charlotte, NC |
| Raleigh, NC | 925-548-2346 | East Bay, CA |
| Woodbury, MN | 847-345-8165 | Illinois |
| Manvel, TX **and** Woodland, TX | 860-655-7837 (same number) | Hartford, CT |
| San Antonio, TX | 214-215-4292 | Dallas, TX |

The Houston and Cypress pages use a Houston (713) number.

**Why it matters:**
- If any of these is a copy-paste error, that page is sending leads to the wrong person today.
- If they are dealers' personal mobile numbers, they still undercut trust ("why is my Orlando blinds company calling from North Carolina?").
- They also break NAP consistency with each location's GBP, which is a local ranking input.

**Recommended solution and steps**
1. Call-test all 20 numbers this week and log the results.
2. Give each dealer a local-area-code tracking number (e.g. CallRail) that forwards to the dealer. Use that same number on the city page, the location's GBP and every citation.
3. Store the phone number per dealer in the CMS as the single source of truth, and output it in LocalBusiness schema (M-04).

**Expected impact:** no lost calls, more trust, and consistent local signals. Call tracking also gives you lead attribution per city.

**How to validate:** keep a call-test log for all 20 numbers. Each city page phone should match the GBP phone, and the area code should match the market.

---

### H-03 · Testimonials reused across states; rating claims unverifiable

**Severity:** High · **Priority:** P2 · **Area:** Trust / compliance · **Effort:** 2–3 days · **Owner:** Marketing + Dev

**Evidence**
- **20 of 61** reviewer names on city pages appear on more than one page, across states:
  - "Vince R": Apple Valley MN, Manvel TX, Nashville TN, Omaha NE and Woodland TX.
  - "Laura Koppe": Houston TX, Cypress TX and South Windsor CT.
  - "Joseph Mathew": Charlotte NC, Orlando FL and South Windsor CT.
- Every review date is fixed text ("5 months ago"), so it will always say that.
- The sitewide badge "Google ★ Rated 4.9/5 by 1000's of happy homes" doesn't link to a Google profile or give a review count.
- "98% Service Quality / 97% Installation / 99% Recommend" has no stated source.

**Why it matters:** a Connecticut homeowner reading a Houston customer's review on "their" local page is being misled about the local dealer's record. The FTC's rule on consumer reviews and testimonials (16 CFR Part 465, in force since October 2024) targets reviews that misrepresent the reviewer's experience, so take legal advice on how reviews are presented. Unverifiable claims also lower trust, and neither Google nor AI assistants can corroborate them.

**Recommended solution and steps**
1. Show each review with the reviewer's city and the dealer location, a real date and a source link.
2. On city pages, show only that location's reviews. Pull them from its GBP through the Places API or a review platform.
3. Replace "1000's" with an exact count and a link to the profile. Source the percentage stats or remove them.

**Expected impact:** restores credibility, reduces compliance risk, and makes the reviews usable evidence.

**How to validate:** no reviewer appears on pages in two different states, and every review shows its date, location and source link.

---

### H-04 · No pricing guidance anywhere

**Severity:** High · **Priority:** P3 · **Area:** Content / conversion · **Effort:** 3–5 days · **Owner:** Owner + Content

**Evidence:**
- No page gives a price, a range or a "starting at" figure.
- The FAQ answer to "What does it cost to get blinds or shades from Slick Blinds?" says only "Pricing depends on the product, window size… We provide a quote after consultation."
- In a web search for "how much do custom blinds cost per window" (25 Nov 2026), the results came from Thumbtack, Angi, HomeAdvisor, Fixr, Blindster, Blindsgalore, Bankrate and This Old House. No local installer appeared.

**Why it matters:** cost is the first research question in this category. Buyers who can't get a ballpark figure either leave or rule themselves out, and aggregators capture that traffic and resell the lead. Honest ranges are also one of the most reliable ways to get cited in AI Overviews and ChatGPT answers about cost.

**Recommended solution and steps**
1. Publish `/guides/custom-window-treatment-cost/` with typical **per-window ranges by product**: faux wood, wood, roller, zebra, cellular, Roman, triple, poly shutters, hardwood shutters, and the motorization add-on.
2. Base the ranges on your own Bitrix24 quotes: the median and the typical range for a standard window size.
3. Explain what moves the price, and include a sample whole-home quote, for example a new 4-bedroom home.
4. Add a short "Typical price range" box to each product page that links to the guide.

**Expected impact:** captures high-intent research traffic, pre-qualifies leads, and gives AI answers a citable source.

**How to validate:**
- Search Console shows the guide earning impressions for "{product} cost" queries within 6–10 weeks.
- GA4 tracks the path from guide to consultation booking.

---

### H-05 · No guides or comparisons for research-stage searches

**Severity:** High · **Priority:** P3 · **Area:** Content · **Effort:** Ongoing · **Owner:** Content

**Evidence:**
- The sitemap has 58 URLs: 13 core pages, 17 category and product pages, 20 city pages and 8 room pages.
- There is no blog, guide or comparison page. `/blog/` is a soft 404.
- Product pages describe what Slick Blinds sells, not which option a buyer should choose.

**Why it matters:** most purchases start with questions:
- zebra or roller shades?
- faux or real wood?
- which blinds are best for a bedroom, or for Texas heat?
- is motorization worth it?
- when should I order for a new build?

Without content for those questions, the site can only compete on commercial terms. There, franchises and aggregators with far more authority win. Guides are also what AI answers cite.

**Recommended solution and steps:**
1. Create a `/guides/` hub.
2. Publish 12 pieces in 90 days (list in section 9).
3. Write each one from real installation experience: photos, quotes from named consultants, local examples.
4. Link each guide to the matching product page and to the consultation CTA.
5. Do not mass-produce.

**Expected impact:** a new organic entry point, internal links into product pages, and AI-citable material. This builds over 3–6 months.

**How to validate:**
- Guides are indexed.
- Search Console impressions and clicks for informational queries grow.
- GA4 shows assisted conversions where a guide led to a consultation.

---

### H-06 · Weak E-E-A-T; inconsistent company facts

**Severity:** High · **Priority:** P2 · **Area:** Trust · **Effort:** 2–3 days · **Owner:** Owner + Content

**Evidence**

The About page (694 words) is missing:
- the owners' or leaders' names and photos
- the founding year
- a team
- showroom or warehouse photos
- how products are made or sourced
- certifications, licences or insurance

Its three testimonials are all from Prosper, TX.

Company facts conflict:

| Fact | Where | Claim |
|---|---|---|
| Locations | About, consultation page | "15 Locations Served" |
| Locations | llms.txt | "17 US cities" |
| Locations | Sitemap | 19 city markets |
| Hours | Consultation page | Mon–Fri 9 am–6 pm |
| Hours | City pages | Mon–Fri 9:00 AM–5:00 PM |
| Support | Consultation page | "Online support 24/7" |
| Experience | Site | "10+ Years of Expertise" (no founding year stated; domain registered March 2017) |

**Why it matters:** homeowners let the installer into their home. Google's quality guidelines and AI systems weigh who runs a business, and contradictory facts make the business harder to trust and to describe.

**Recommended solution and steps**
1. Rebuild About around:
   - the founding story and year
   - leadership photos with LinkedIn links
   - the Cypress HQ (photos)
   - how the Vara, Rassa and Gamana lines are made or sourced
   - a warranty summary
   - certifications held (e.g. WCMA "Best for Kids" on cordless products, only if certified), insurance
   - the dealer network map
2. Keep one "company facts" record in the CMS covering locations, hours, founding year and review count. Feed it into the site, schema, llms.txt, GBP and directories.

**Expected impact:** higher trust and conversion, and a consistent entity for Google and AI assistants.

**How to validate:**
- About shows people, a year and an address.
- A crawl finds no conflicting facts.

---

### H-07 · Inconsistent citations and a small off-site footprint

**Severity:** High · **Priority:** P2–P4 · **Area:** Local / authority · **Effort:** Ongoing · **Owner:** Marketing

**Evidence** (web search, not Google, 25 Nov 2026; verify each)

Directory listings for "Slick Blinds LLC" show at least four addresses:

| Address | Source |
|---|---|
| 17715 Vendres Xing, Richmond TX | MapQuest |
| 15500 Voss Rd, Sugar Land TX | MapQuest |
| 291 S Preston Rd, Prosper TX | Yelp |
| 16718 House & Hahl Rd Suite E2, Cypress TX | The site's HQ |

Other findings:
- The Prosper Yelp listing reportedly describes an "authorized dealer of Hunter Douglas, Graber, Horizon and Alta". The site sells its own collections. This comes from a search snippet, so verify it.
- ZoomInfo lists 1–10 employees; Vaia lists 50–100.
- A "Slick Blinds LLC" Facebook page shows about 81 likes. The site links a different page (`facebook.com/slickblinds/`).
- Across 9 local and category searches, slickblinds.com appeared only for its exact legal name. Competitors and aggregators filled the other results (section 10).
- Backlink data was unavailable (section 14).

**Why it matters:** map-pack rankings depend on relevance, distance and prominence. Prominence includes reviews and consistent mentions across the web, and conflicting addresses split those signals. AI assistants also build their picture of a business from these third-party sources.

**Recommended solution and steps**
1. Fix the canonical name, address and phone (NAP) for HQ and for each dealer: storefront or service-area business.
2. Audit and claim listings, then correct them: Google, Apple Business Connect, Bing Places, Yelp, BBB, Houzz, Angi, Nextdoor, Facebook, and data aggregators that feed MapQuest and Foursquare. A tool such as BrightLocal or Whitespark speeds this up.
3. Merge or close duplicate Facebook pages.
4. Build prominence:
   - Ask for a review after every install (an SMS triggered from Bitrix24) for each location.
   - Create a Houzz pro profile with projects and Pinterest boards (high intent for décor).
   - Pursue local PR with new-home communities, builders and HOAs.
   - Run dealer-recruitment PR.

**Expected impact:** stronger map-pack eligibility and a coherent business identity that AI assistants can describe.

**How to validate:**
- A citation audit shows at least 90% NAP consistency.
- Reviews per location grow every month.
- Referring domains from relevant local or home sites grow, once that data is measurable.

---

### H-08 · City titles and H1s target random products and a wrong place name

**Severity:** High · **Priority:** P2 · **Area:** On-page · **Effort:** 0.5 day · **Owner:** Content + Dev

**Evidence**

Each city title targets a different product, with no pattern:
- "Stylish Translucid Drapes Installation in Cumming, GA"
- "Faux Wood Blinds Services in Detroit, MI"
- "Roller Blinds in San Antonio, TX"
- "Zebra Shades and Shutters in Nashville, TN"
- "Best Blinds Company in Omaha, NE"

Other problems:
- **No brand.** 0 of 20 city titles include it.
- **H1 spacing.** 17 H1s lack a space after the comma ("Beautiful Custom Blinds in Houston,TX").
- **Long descriptions.** Meta descriptions run 183–538 characters on 19 of 20 pages.
- **Wrong place.** "Woodland, TX" should be The Woodlands, TX.
- **Typo.** `/lps-houston-tx/` has the H1 "Custom Windows Treatments".

**Why it matters:** the title is the strongest on-page relevance signal and the headline in the results. Pinning each city to one random product means targeting a narrow term instead of the high-intent ones: "blinds {city}", "window treatments {city}", "shutters {city}".

**Recommended solution and steps**
1. **Title pattern:** `Blinds, Shades & Shutters in {City}, {ST} | Slick Blinds` (≤60 characters).
2. **H1:** `Custom Blinds, Shades & Shutters in {City}, {ST}`.
3. **Description:** at most 155 characters, mentioning the free in-home consultation and the local phone number.
4. Generate titles from CMS city and state fields so typos can't recur.

**Expected impact:** better relevance and click-through on the money pages.

**How to validate:** a crawl shows:
- 20/20 titles at most 60 characters, all with the brand
- no H1s with ",XX"
- all descriptions at most 160 characters

After that, track click-through per city page in Search Console.

---

### H-09 · Mega-menu links render only on hover, so crawlers can't follow them

**Severity:** High · **Priority:** P2 · **Area:** Architecture · **Effort:** 0.5 day · **Owner:** Dev

**Evidence:**
- The header has dropdowns: Shop by Room, Blinds, Shades, Shutters and Drapes.
- The product and room URLs appear in the page's data payload (e.g. `shop-by-room/kitchen/`). But neither the server HTML nor the browser-rendered DOM contains `<a href>` links to them.
- The rendered homepage links only to the six category URLs.
- The 13 product pages (e.g. faux wood blinds, zebra shades, poly shutters) get links only from their category page and a few siblings: 4–13 distinct linking pages each. Drapery panels and sheer curtains get 4, vertical sheer shades 5.
- The 8 room pages get no links at all.

**Why it matters:** Google follows `<a href>` links. It doesn't hover. Menu links are the main channel through which sitewide authority reaches deeper pages.

**Recommended solution and steps:**
1. Render the full mega-menu markup on the server on every page.
2. Keep it hidden with CSS until hover or click, with `aria-expanded` for accessibility, instead of mounting it on hover.
3. Include product links, room links and "Find a dealer".

**Expected impact:** every product page is linked from every page, which strengthens the commercial pages.

**How to validate:**
- `curl -s https://slickblinds.com/ | grep -c 'href="/products/shades/zebra-shades/"'` returns ≥1.
- A re-crawl shows every product page linked sitewide.

---

## 7. Medium-priority issues

### M-01 · Shop-by-room pages are orphaned near-duplicates

**Severity:** Medium · **Priority:** P4 · **Effort:** 3–5 days · **Owner:** Content

**Evidence**

There are 8 URLs (`/products/shop-by-room/{living-room, bedroom, kitchen, bathroom, home-office, kids-room, dining-room, sunroom}/`). They have these problems:

- **No internal links in.**
- **Near-identical.** Average similarity to each other is **83%**; kitchen/bathroom and bedroom/kids-room are both 97%.
- **Same H1 as `/products/`.** All use "Explore Our Premium Collection".
- **Same content.** Each shows the same 7 product cards; only the images change. Word counts are 363–460.
- **Long titles.** 66–70 characters ("Shop by Living Room — … | SlickBlinds").
- **No hub.** `/products/shop-by-room/` is a soft 404.

**Why it matters:** duplicate thin pages dilute crawl and quality signals. They can't rank for "best blinds for kitchen" because they don't answer it.

**Fix:**
1. Turn each into a real room guide, for example "Best Window Treatments for Kitchens":
   - selection criteria: moisture, grease, cleaning
   - recommended products with reasons
   - real installs from that room type
   - 3–5 FAQs
   - links from the menu (H-09) and from product pages
2. Until a page is rebuilt, set it to `noindex` and remove it from the sitemap.

**Validate:** no two room pages more than 30% similar, unique titles and H1s, at least 3 internal links in.

### M-02 · ~1.2 MB of JavaScript per page, ~82% from third-party tags

**Severity:** Medium · **Priority:** P4 · **Effort:** 1–2 days · **Owner:** Dev + Marketing

**Evidence:** lab probe in Chrome with mobile emulation: 4× CPU slowdown, 150 ms added latency, 1.6 Mbps. Full table in Appendix D.

| Page | Requests | Total | JS | LCP | TBT (approx.) | CLS |
|---|---|---|---|---|---|---|
| Home | 112 | 1.9 MB | 1.17 MB | 3.8 s | 384 ms | 0 |
| Roller shades | 98 | 1.5 MB | 1.15 MB | 2.9 s | 454 ms | 0 |
| Houston | 114 | 1.6 MB | 1.32 MB | 2.5 s | 405 ms | 0.008 |

- On the homepage, ~693 KB of JS comes from Google Tag Manager and gtag (GA4 plus two Google Ads accounts) and ~264 KB from the Meta pixel. That is ~957 KB of ~1,166 KB (82%).
- First-party JS is only ~165 KB.
- Clarity, jsDelivr and, on form pages, Bitrix24 (~160 KB from `bitrix24.in`) add more.
- *Caveat:* the test ran from India, about 220 ms round trip to the Azure US East server, so absolute times are pessimistic for US visitors. Byte weights, long tasks and CLS don't depend on location.

**Why it matters:** script execution blocks the main thread, which slows interactions (INP) on mid-range phones. Page experience is judged on real-user (CrUX) data.

**Fix:**
1. Audit GTM: remove unused tags and consolidate onto one Google tag.
2. Confirm whether both Ads accounts are needed (M-13).
3. Load the Meta pixel and Clarity after the first user interaction, or behind consent.
4. Load the Bitrix24 form when it scrolls into view or when the CTA is clicked.

**Validate:**
- PageSpeed Insights origin field data at p75: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1.
- Lab JS at most 600 KB on the homepage.

### M-03 · HTML isn't cached and there is no CDN

**Severity:** Medium · **Priority:** P4 · **Effort:** 1–2 days · **Owner:** Dev

**Evidence:**
- Every HTML page is sent with `cache-control: private, no-cache, no-store`, so it is rendered on every request.
- Server render time is about 0.2–0.27 s on top of network time: cached `robots.txt` answers about 0.25 s faster than any page.
- The origin is a single Azure VM with no CDN. Image optimization runs on the same VM; even a cached image took about 1 s to first byte from India.
- No Brotli, no HTTP/3.

**Why it matters:** time to first byte sets the floor for LCP. Distant users (e.g. Roseville, CA) pay the most, and a traffic spike from ads or PR lands entirely on one machine.

**Fix:**
1. Switch content pages to ISR (`export const revalidate = 3600`), with on-demand revalidation from a CMS publish webhook.
2. Put Azure Front Door or Cloudflare in front, caching `/_next/static/*`, `/_next/image*` and ISR HTML.
3. Enable Brotli.

**Validate:**
- HTML responses show `x-nextjs-cache: HIT` and an `s-maxage` header.
- Time to first byte from US probes is under 200 ms.

### M-04 · Invalid Product schema; LocalBusiness missing on 17 city pages

**Severity:** Medium · **Priority:** P2 · **Effort:** 0.5–1 day · **Owner:** Dev

**Evidence**
- **Product.** 14 pages carry `Product` with only name, description and image. There is no `offers`, `review` or `aggregateRating`, and Google requires one of them for Product rich results.
- **City pages, 17 of 20.** They have only WebSite and BreadcrumbList: no LocalBusiness and no Organization.
- **City pages, the other 3.** Their `HomeAndConstructionBusiness` uses the national 800 number. Apple Valley lists 17 `areaServed` cities, including north-west metro towns (Plymouth, Maple Grove, Rogers, Blaine), while the page itself says "Apple Valley".
- **Organization.** No `address`, `foundingDate`, `founder` or service-area list.

**Fix:**
1. Remove `Product`, keeping `Service`, unless you can add a genuine `AggregateOffer` price range. Never invent ratings.
2. Add LocalBusiness (`HomeAndConstructionBusiness`) to every city page, generated from the dealer record: NAP, `geo`, hours, `areaServed`, `parentOrganization` pointing to `#organization`, and `sameAs` pointing to the location's GBP.
3. Add the HQ `PostalAddress`, `foundingDate` and `founder` to Organization.

**Validate:** 0 errors in the Rich Results Test and the Schema Markup Validator, and no invalid Product items in Search Console.

### M-05 · 70% of images have empty alt text, including all real photos

**Severity:** Medium · **Priority:** P2 · **Effort:** 1 day · **Owner:** Content

**Evidence:**
- 2,536 `<img>` tags across 60 pages; 1,770 (70%) have `alt=""`.
- The images with empty alt are the ones that matter:
  - every gallery photo (`bedroom_image2…`, `living_room_image1…`)
  - product hero and section photos (`Hero_Section_1…`, `PDP_Section_2…`)
  - the homepage hero, which is the LCP image
- Decorative SVG icons do have alt text ("Custom Fit for Every Window").

**Why it matters:** Google Images is a real discovery channel for home décor. Missing alt text on informative images also fails WCAG.

**Fix:**
1. Make alt text required in the CMS for content images. Describe product, room and style, for example: "White zebra shades in a modern living room, Cypress TX install".
2. Set `alt=""` on icons.

**Validate:**
- Under 10% of content images have empty alt.
- Image impressions grow in Search Console (search type: Image).

### M-06 · Gallery is thin, uncaptioned and barely linked

**Severity:** Medium · **Priority:** P3 · **Effort:** 1–2 days · **Owner:** Content

**Evidence:** `/gallery/` has:
- 181 words and no H2
- 33 of 38 images with empty alt
- 31 identical "View more" buttons
- no captions (product, room, city)
- one internal link in, from the homepage

Its meta description promises "real photos… installed in homes".

**Fix:**
1. Caption every photo with product, room, city and community.
2. Make the filters server-rendered links.
3. Link photos to their product and city pages.
4. Add each dealer's install photos. Use only real installs, since the meta description promises them.

**Validate:** captions on 100% of photos; the gallery is linked from product and city pages.

### M-07 · Product pages are generic

**Severity:** Medium · **Priority:** P3 · **Effort:** 1 day per page · **Owner:** Content

**Evidence:** take `/products/blinds/faux-wood-blinds/` (497 words) as an example.

What's missing:
- no slat sizes (there is a "Slat Size Options" heading with no sizes under it)
- no colours, maximum widths, material or lead time
- no price range
- no product-specific FAQs or reviews

Other problems on the page:
- **Forced keyword phrasing:** "Best Faux Wood Blinds offer…"
- **Repeated markup:** the feature strip appears three times in the HTML.
- **Warranty naming:** the warranty is called "SlickShield Worry-Free Warranty*" here and "Limited Lifetime Warranty" in the footer.

**Fix:** add to each product page:
- a spec table and options with images
- a typical price range (H-04)
- a comparison (e.g. faux vs real wood)
- care instructions and specific warranty terms
- 3–5 product FAQs
- reviews that mention the product
- real install photos

**Validate:** pages carry specs and FAQs, and the range of long-tail queries per page widens in Search Console.

### M-08 · FAQ page: 174 Q&As, 53 duplicates, city questions on the global page

**Severity:** Medium · **Priority:** P3 · **Effort:** 0.5 day · **Owner:** Content

**Evidence:** `/faqs/` has these problems:
- **Bloated:** 174 questions in FAQPage schema; 9,434 words; 831 KB of HTML.
- **53 duplicates:** "Is the consultation absolutely free?" ×7, "What happens during the consultation?" ×7, and others.
- **Misplaced:** 19 city-specific questions (Houston, Austin…).
- **Messy formatting:** numbered prefixes ("8. What does it cost…"); H1 "FAQ’s".

**Fix:**
1. Cut to about 40 global questions, grouped by topic: consultation, products, motorization, warranty, pricing, installation.
2. Move city questions to the city pages and product questions to the product pages.
3. Change the H1 to "Frequently Asked Questions".

FAQ rich results have been limited to government and health sites since 2023. The markup's value now is clarity for search engines and AI crawlers, not search-result features.

**Validate:** 0 duplicate questions, under 300 KB of HTML.

### M-09 · Visible QA defects

**Severity:** Medium · **Priority:** P1 · **Effort:** 2–3 h · **Owner:** Content + Dev

**Evidence and fixes**

| Where | Defect | Fix |
|---|---|---|
| `/products/motorization/` | H2 reads **"The Gamana Advantage - same design like below."** (a developer note published as a heading) | Replace it with the intended heading |
| Homepage, `/llms-full.txt` | "**Spring** Home Refresh Event — Save up to 35%" is live in late November | Add start and end dates to promos in the CMS; swap in a current offer |
| `/products/shades/roller-shades/` | `og:title` = "Furniture-Grade Wood Blinds, Naturally Crafted" (copied from wood blinds) | Correct the OG title |
| Job page | `og:image` = `https://slickblinds.com/` (not an image) | Use a real image |
| `/manvel-tx/`, `/woodland-tx/` | `og:image` is the Apple Valley, MN hero | Use local images |
| 17 city pages | H1 "…in Houston,TX" | Generate the H1 from fields (H-08) |
| `/lps-houston-tx/`, `/faqs/`, `/become-a-dealer/` | "Custom Windows Treatments", "FAQ’s", "upto 30-40%", "Partner with Slick Blinds' and…" | Copy edit |

Add a pre-publish checklist covering headings, OG tags, promo dates and spelling.

### M-10 · Warranty is only a PDF on another domain; naming is inconsistent

**Severity:** Medium · **Priority:** P3 · **Effort:** 0.5–1 day · **Owner:** Owner + Dev

**Evidence:**
- The footer "Warranty" link opens `slickblindsprod.blob.core.windows.net/…/Warranty_Terms_1_a916cd0d13.pdf`.
- The old `/warranty` and `/Warranty.html` URLs aren't redirected (C-01).
- The warranty goes by several names:
  - "Limited Lifetime Warranty" (footer)
  - "SlickShield Worry-Free Warranty*" plus "1-Year Workmanship" (product pages)
  - "5-year warranty" (Gamana motors)
- `/terms-and-conditions/` has the H1 "Warranty, Terms & Conditions", while the footer link calls it "Terms of Service".

**Why it matters:** the warranty is a deciding factor for the purchase, and it's a page buyers search for. As a PDF on another domain it gives slickblinds.com nothing.

**Fix:**
1. Build `/warranty/` as an HTML page covering:
   - coverage by product line
   - the motor warranty
   - workmanship coverage
   - the claims process
2. Link it from the footer and from product pages.
3. Keep the PDF as a download, and use one warranty name everywhere.
4. Point the `/warranty` and `/Warranty.html` redirects at the new page.

### M-11 · Dealer page reuses consumer copy and lacks program detail

**Severity:** Medium · **Priority:** P4 · **Effort:** 1–2 days · **Owner:** Owner + Content

**Evidence:** `/become-a-dealer/` has 267 words.
- "Why Partner With Us?" is answered with homeowner copy: "We bring local expertise… right to your home — making your window transformation easy…".
- "Grow Faster with SlickBlinds" is followed by roller-shade copy: "Most roller shades focus on appearance. We focus on performance…".
- The page has no investment or fee information, territory map, requirements, training detail, dealer testimonials or FAQ.

**Why it matters:** dealer acquisition is a second growth engine. Prospects compare the page against franchise listings (FranchiseGator, FranchiseHelp, Entrepreneur) that do state investment, support and territories (section 10).

**Fix:** rewrite the page for B2B:
1. Who it's for: installers, interior designers, existing blinds businesses.
2. The economics: margin, startup cost, and "no franchise fee" if true.
3. What dealers get: catalogue, lead flow, training, marketing assets, territory exclusivity.
4. The process and timeline.
5. Dealer stories and an FAQ.

Consider dealer-directory listings.

**Validate:** track dealer-form submissions in GA4 as a separate conversion, and track their quality in Bitrix24.

### M-12 · llms.txt points AI crawlers to non-existent pages and products

**Severity:** Medium · **Priority:** P1 · **Effort:** 1–2 h · **Owner:** Dev

**Evidence:** `/llms.txt` has these problems:
- **Dead links.** It links `/products/plantation-shutters`, `/products/motorized` and `/products/noble-drapes`, and all three are blank soft-404 pages. The real URLs are `/products/shutters/` and `/products/motorization/`, and "Noble Drapes" doesn't exist on the site.
- **Products not sold.** It lists aluminum blinds and woven shades.
- **Wrong count.** It says "17 US cities".
- **Redirecting links.** Its links lack trailing slashes, so each one 301s.

`/llms-full.txt` (75 KB, regenerated on every request) includes the stale Spring promo.

**Why it matters:** this file exists to tell AI systems what the business offers. Today it misinforms them.

**Fix:**
1. Generate llms.txt from the same CMS source as the sitemap, with correct URLs, the real product list and the dealer list.
2. Drop expired promos from llms-full.txt.
3. Appendix A redirects the three bad URLs as a safety net.

**Validate:** every link in llms.txt returns 200 on a single request.

### M-13 · Measurement: two Ads accounts, no lead-quality feedback

**Severity:** Medium · **Priority:** P2 · **Effort:** 1 day · **Owner:** Marketing

**Evidence:**
- The public GTM container includes GA4 with a `google_form_lead` event and a custom `generate_lead` push (`lead_type: consultation`).
- It also has seven Google Ads conversion tags across **two** Ads accounts (AW-17492848711 and AW-18546495223).
- From outside I can't see which tags fire on which trigger, or whether closed deals are imported.

**Why it matters:**
- Duplicate conversion actions across accounts can double-count leads and mislead Smart Bidding.
- Optimizing for form fills instead of booked or sold consultations rewards junk leads.
- SEO has to be judged on leads and sales, not sessions.

**Fix:**
1. Confirm which Ads account is active, and keep one primary conversion per account.
2. Capture GCLID in the Bitrix24 form.
3. Import Bitrix24 stages (consultation held, sale) as offline conversions into Google Ads and GA4.
4. Report organic leads separately.

**Validate:** GA4 key events reconcile with Bitrix24 lead counts within ±10%, and Ads conversion diagnostics are clean.

### M-14 · Homepage has no primary consultation CTA or form above the fold

**Severity:** Medium · **Priority:** P2 · **Effort:** 0.5–1 day · **Owner:** Dev + Marketing

**Evidence:**
- The homepage hero's only call to action is a text link, "EXPLORE PRODUCTS →".
- The rendered homepage has no form (0 inputs). The only consultation entry point above the fold is the header button.
- The two-step form exists, but only on `/free-consultation/` and the city pages.
- Directly below the hero sits the stale Spring promo strip (M-09).

**Fix:**
1. Make "Book a free in-home consultation" the primary button in the hero, plus a ZIP field that routes to the right city page or dealer.
2. Keep "Explore products" as the secondary option.
3. Test the variant with GA4 and Clarity.

**Validate:** the homepage-to-consultation rate (GA4) before and after the change.

---

## 8. Low-priority issues

| ID | Issue | Evidence | Fix | Validate |
|---|---|---|---|---|
| L-01 | Two-hop redirect | `http://www.slickblinds.com` → `https://www.` → `https://slickblinds.com/` | Redirect `http://www` straight to `https://slickblinds.com$request_uri` in nginx | `curl -sIL http://www.slickblinds.com` shows one hop |
| L-02 | Server version disclosed | `server: nginx/1.24.0 (Ubuntu)` | `server_tokens off;` | Header shows `nginx` only |
| L-03 | Sitemap hygiene | No `<lastmod>`; `changefreq`/`priority` (ignored by Google); `/careers/` and the job page missing; `/lps-houston-tx/` and room pages included | Add `lastmod` from the CMS `updatedAt`; include careers; exclude noindex pages | Search Console sitemap report: all submitted URLs indexable |
| L-04 | Retired or limited rich results | Homepage HowTo (rich result retired 2023); FAQPage on `/faqs/` (limited to government and health sites) | Optional cleanup; don't expect SERP features from them | — |
| L-05 | No JobPosting schema | `/careers/master-window-coverings-installer-…/` has none, so it misses Google for Jobs | Add JobPosting: title, description, datePosted, validThrough, employmentType, hiringOrganization, jobLocation, baseSalary if possible | Rich Results Test passes |
| L-06 | Whole-page crash UI | One of four headless mobile loads showed "Something went wrong. Loading chunk 5357 failed…" in place of the whole page. Not reproducible; the chunk returns 200, so it may be a test artifact | Friendly error UI with auto-retry on `ChunkLoadError`; scope error boundaries per section; monitor in Clarity or Sentry | Error logging shows rate ≈ 0 |
| L-07 | Internal links to redirecting URLs | 7 CTA links point to `/free-consultation` without the slash (on `/free-consultation/`, `/vara/`, `/rassa/`, `/about-us/`, `/products/blinds/`, `/products/shutters/`, `/products/drapes/`), so each goes through a 301 | Link to `/free-consultation/` | Crawl shows 0 internal 301s |
| L-08 | Consistency | The brand is written "Slick Blinds", "SlickBlinds" and "Slick Blinds LLC" in titles, alt text and copy. robots.txt has an obsolete `Host:` line and the retired `Claude-Web` token (harmless, since all bots are allowed) | Use "Slick Blinds" in customer-facing text. If AI bots stay listed explicitly, use current tokens (e.g. `ClaudeBot`, `Claude-SearchBot`, `OAI-SearchBot`, `PerplexityBot`) | Crawl shows one brand spelling |

---

## 9. Keyword and page map

**Volumes are not included.** DataForSEO returned HTTP 402 (out of credits), and no search volumes, difficulty scores or ranking positions have been invented. The fastest source of real demand data is Slick Blinds' own **Google Ads account**: Keyword Planner and the Search Terms report (actual queries that triggered ads, with conversions). Pull both before finalising priorities. Rule: **one primary keyword cluster per URL.**

| Cluster | Example queries (to size) | Intent | Target URL | Status |
|---|---|---|---|---|
| Local head terms | blinds {city}; custom blinds {city}; window treatments {city}; blinds near me | Transactional (local) | `/{city}-{st}/` | Exists; rebuild (C-03, H-08) |
| Local × product (top markets only) | plantation shutters houston; motorized shades houston; zebra blinds cypress tx | Transactional | Sections on the city page first; separate pages only where Search Console shows demand | Later |
| Blinds | faux wood blinds; custom wood blinds; cordless blinds | Commercial | `/products/blinds/` + children | Exists; deepen (M-07) |
| Shades | zebra / dual / banded shades; roller shades; cellular / honeycomb shades; roman shades; vertical sheer shades; triple shades | Commercial | Existing product pages | Exists; deepen |
| Shutters | plantation shutters; poly / vinyl shutters; wood shutters | Commercial | `/products/shutters/` + children | Exists |
| Drapery | custom drapes; blackout curtains; sheer curtains | Commercial | `/products/drapes/` + children | Exists |
| Motorization | motorized blinds; smart blinds; Matter / Alexa / HomeKit blinds | Commercial | `/products/motorization/` | Exists; fix H2, add specs |
| Outdoor | outdoor patio shades; motorized exterior shades | Commercial | `/products/outdoor/` | Exists |
| Cost | how much do plantation shutters cost; custom blinds cost per window; motorized blinds cost | Commercial investigation | `/guides/custom-window-treatment-cost/` + product price boxes | **New** (H-04) |
| Comparisons | zebra vs roller shades; faux wood vs wood blinds; cellular vs roller; shutters vs blinds | Informational → commercial | `/guides/…` | **New** (H-05) |
| Room / use | best blinds for bedroom (blackout); kitchen / bathroom (moisture); home office (glare); kids' room (cordless) | Informational | Rebuilt room pages | Rebuild (M-01) |
| Climate / energy | window treatments for heat; energy-efficient blinds; cellular shades energy savings | Informational | `/guides/…` | **New** |
| New construction | window treatments for a new construction home; when to order blinds for a new home; builder blinds upgrade | Informational / commercial | `/new-home-window-treatments/` landing page + guide | **New**; fits the $1,500 new-home offer (validate first, section 3) |
| Brand / navigational | slick blinds; slick blinds reviews; slick blinds houston; vara blinds; gamana motor | Navigational | Home, `/reviews/` (new), city pages, `/vara/`, `/products/motorization/` | Partly exists |
| Dealer (B2B) | become a blinds dealer; window treatment dealer program; start a blinds business | Commercial (B2B) | `/become-a-dealer/` + one supporting guide | Rebuild (M-11) |

**First 12 guides (90 days)**
1. Custom window treatment cost guide (by product, per window, a whole-home example)
2. Zebra shades vs roller shades
3. Faux wood vs real wood blinds
4. Window treatments for new construction homes (timing, builder vs custom, hardwiring for motors)
5. Are motorized blinds worth it? (cost, Matter / Alexa / HomeKit, battery vs hardwired)
6. Best blinds for bedrooms (blackout options compared)
7. Window treatments for Texas heat (cellular, solar roller, shutters, energy)
8. Plantation shutters: poly vs hardwood
9. Triple shades explained (vs zebra and sheer)
10. Inside mount vs outside mount
11. Cordless and child-safe window treatments
12. What happens at an in-home consultation (and what to prepare)

---

## 10. Competitive landscape

Source: web searches on 25 Nov 2026 for brand, local and category queries. The search tool is **not Google**, so treat this as a directional map of who competes, not as rankings.

| Competitor type | Examples seen | What they do that Slick Blinds doesn't |
|---|---|---|
| National franchises with local micro-sites | [Budget Blinds of Cypress](https://budgetblinds.com/cypress), [3 Day Blinds – Cypress](https://3dayblinds.com/local-cypress), [Gotcha Covered – NW Houston/Cypress](https://www.gotchacovered.com/northwest-houston/cypress), [Bloomin' Blinds – Katy](https://www.bloominblinds.com/katy-tx/) | One subfolder per franchise with a local team, address, reviews and service area. This is the closest model to Slick Blinds' dealer network, so copy the pattern |
| Local specialists with neighbourhood pages | [Shades or Shutters Medic](https://www.shadesorshuttersmedic.com/areas-list/window-treatments-in-cypress%2C-tx) (names Bridgeland, Towne Lake, Fairfield, Marvida), [The Shade Shop](https://theshadeshop.net/houston-areas-served/) (Houston, since 1918), Action Window Coverings (Cypress, new construction), Katy Blinds & Shutters, Cypress Shutters | Community-level relevance, years in business and owner identity on the page |
| Local PR buyers | Plantation Shutters Houston ([newswire.com release](https://www.newswire.com/view/content/plantation-shutters-houston-leads-in-premium-window-treatments-for-22466218)), sponsored "GetFeatured" articles about Cypress homes on financialcontent.com | Paid syndicated press releases for links and brand mentions. These are weak links but visible; better to earn real local press |
| Premium showrooms | [The Shade Store – Houston](https://www.theshadestore.com/showrooms/texas/houston) | Showroom pages, design-led content |
| Aggregators and directories | Angi, HomeAdvisor, Houzz, Thumbtack, Yelp | They dominate "{service} {city}" and cost queries, and capture leads from installers without strong local pages |
| Cost and comparison publishers | Thumbtack, Angi, HomeAdvisor, Fixr, Blindster, Blindsgalore, Bankrate, This Old House | They own "how much do… cost". An installer with real quote data can compete on credibility |
| Dealer-opportunity SERP | FranchiseGator, FranchiseHelp, Entrepreneur, franchising.com, [Hunter Douglas new-dealer page](https://www.hunterdouglas.com/new-window-treatment-dealer) | They state investment, support and territories; the Slick Blinds dealer page doesn't (M-11) |

**Takeaway:** Slick Blinds isn't competing with Blinds.com-style e-commerce. It competes with franchise location pages and local specialists. The winning pattern is visible in the results:
- one strong page per local business
- a real team, address and reviews
- neighbourhood names
- photos of local installs
- a steady flow of reviews

---

## 11. What's already working (keep)

- **One canonical host and clean redirects:** `http` and `www` go to `https://slickblinds.com/`; URLs without a trailing slash 301 to the slash version. HSTS has `preload` and `includeSubDomains`.
- **Canonicals:** all 60 HTML pages self-canonicalise, and tracking parameters (`?utm_*`, `?gclid`) canonicalise to the clean URL.
- **Server-rendered content:** headings, copy and FAQs are in the initial HTML, which suits Google and AI crawlers that don't run JavaScript.
- **Product taxonomy:** category → product URLs that map to real search terms (faux wood blinds, zebra shades, cellular shades, plantation shutters, blackout curtains).
- **Unique titles and descriptions** on core and product pages, with exactly one H1 per page.
- **Schema graph:** Organization `@id`, WebSite, BreadcrumbList and Service on product pages.
- **robots.txt:** allows search and AI crawlers, excludes `/api/` and `/draft/`, and declares the sitemap. An llms.txt exists (it needs fixing, M-12).
- **Images:** delivered as AVIF through `next/image`, hero images carry `fetchpriority="high"`, fonts are preloaded, and CLS is about 0.
- **Lead capture:** a 2-step form (product → ZIP → contact) on the consultation and city pages, click-to-call, and GA4 lead events with Ads conversions configured.
- **Differentiators worth leading with:** the Vara and Rassa tiers, Gamana motorization (Matter, 5-year motor warranty), and zebra and triple shades.

---

## 12. 90-day plan

### Week 1 — stop the leaks
- C-01: deploy the Appendix A redirects and update GBP website links.
- H-01: return real 404s for unknown slugs.
- H-02: call-test all 20 numbers and fix any that are wrong.
- M-09: fix the placeholder H2, the Spring promo, the OG tags and the typos.
- M-12: correct llms.txt.
- Set `/lps-houston-tx/` to noindex and remove it from the sitemap.
- Get Search Console, GA4, GBP (manager) and Google Ads access; capture the baseline (section 13).

### Weeks 2–4 — structure and trust
- C-02: build the `/locations/` hub and add footer and contextual links.
- H-09: render the mega-menu on the server.
- H-08: standardise city titles, H1s and descriptions.
- M-04: add LocalBusiness to city pages and remove the invalid Product schema.
- M-05: fill in alt text.
- H-03: label testimonials with location and date, and show only local reviews on city pages.
- H-06: rebuild About and create the company-facts record.
- M-13: tidy conversions and start importing offline conversions.
- M-14: add the homepage hero CTA and ZIP router.
- H-07 (start): fix the canonical NAP and audit the top 15 citations.

### Weeks 5–8 — proof and demand capture
- C-03: rebuild the city template; launch the top 3–5 markets with real dealer data.
- H-04: publish the cost guide and add price boxes to product pages.
- H-05: publish the first 4 guides.
- M-10: publish the warranty page.
- M-07: deepen the top 5 product pages, starting with those Ads and Search Console show converting.
- M-06: caption the gallery and add real installs.
- Start a review programme for each location (post-install SMS from Bitrix24).

### Weeks 9–12 — authority and scale
- C-03: roll the template out to the remaining markets, and redirect markets with no dealer.
- H-05: publish guides 5–12.
- M-01: rebuild or noindex the room pages.
- H-07: finish citation clean-up; set up the Houzz profile and Pinterest boards; run local PR with builders, communities and HOAs.
- M-11: rebuild the dealer page.
- M-02 and M-03: GTM diet, ISR plus a CDN.

---

## 13. KPIs

Baselines must be captured in week 1. Targets are directional until a baseline exists.

| KPI | Source | Baseline | 90-day direction |
|---|---|---|---|
| Legacy URLs returning 404 or soft 404 | Status check of Appendix A + Search Console | 36 of 39 archived URLs broken | 0 |
| Soft-404 count | Search Console → Pages | To capture | ≈ 0 |
| City pages indexed | Search Console URL Inspection / Pages | To capture | 100% of active markets |
| Impressions and clicks to city pages ("{product} {city}") | Search Console (filtered by page) | To capture | Up month on month after week 6 |
| GBP calls, website clicks and direction requests per location | GBP Performance | To capture | Up quarter on quarter |
| Reviews per location (count and rating) | GBP | To capture | +10 per active location per quarter (adjust to install volume) |
| NAP consistency | BrightLocal / Whitespark audit | To capture | ≥90% |
| Organic consultation bookings | GA4 `generate_lead`, organic channel | To capture | Up; report alongside Bitrix24 consult-held and sale rates |
| Lead → consult held → sale rate by channel | Bitrix24 | To capture | Organic at or above paid |
| Core Web Vitals (p75, origin) | PageSpeed Insights / CrUX | To capture | LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 |
| Third-party JS on the homepage | Lab probe | ~957 KB | ≤400 KB |
| AI-answer mentions for "custom blinds {city}" and cost queries | Manual checks in ChatGPT, Perplexity and Google AI Overviews (or DataForSEO once topped up) | To capture | Mentioned in the top 3 markets |

Don't present traffic growth as success on its own. The measure is booked and sold consultations from organic search and GBP.

---

## 14. Data sources and limitations

| Source | Used for | Limitation |
|---|---|---|
| Live crawl, 25 Nov 2026 (~00:35 IST) | 62 URLs: status, headers, HTML, titles, meta, canonicals, robots, headings, schema, links, images, text similarity | Raw (server) HTML. Rendered checks were done separately in headless Chrome |
| Headless Chrome (rendered DOM and screenshots, 1440 px and 500 px) | Forms, menus, above-the-fold layout | Renders at minimum 500 px width; one transient chunk error (L-06) |
| Lab performance probe (Chrome DevTools Protocol, mobile emulation) | LCP, CLS, approximate TBT, bytes, requests (Appendix D) | Run from India (~220 ms round trip to the US East server), so absolute timings are pessimistic. Not CrUX field data |
| Wayback Machine CDX | 39 historical URLs | Only captured URLs. A second, broader query failed ("temporarily offline") |
| WHOIS / DNS | Domain age, hosting (Azure IP), email (Microsoft 365) | — |
| Public GTM container | Tags, conversion IDs, events | Shows configuration, not which triggers actually fire |
| Web search (non-Google index) | Brand, citations, competitors, cost and dealer SERPs | Not Google rankings. Some details come from search snippets and are marked "verify" |
| **DataForSEO** | — | **HTTP 402 (out of credits).** No ranking keywords, search volumes, keyword difficulty, backlinks, competitor overlap or AI-mention data. Top up and rerun before finalising section 9 |
| **PageSpeed Insights API** | — | Anonymous daily quota exhausted, so no CrUX field data was pulled |
| Local Lighthouse | — | Not run in this environment; replaced by the lab probe above |
| Not accessed | Search Console, GA4, Google Business Profiles, Google Ads, Bitrix24, CMS or repository | Needed for the baseline, index coverage, real queries, lead quality and dealer data |

**Requested from Slick Blinds:**
- Search Console access, or exports of the Pages report, the 404 and soft-404 lists, and top queries by page
- GA4 viewer access
- GBP manager access for every location
- Google Ads Search Terms report and Keyword Planner access
- Bitrix24 lead → consultation → sale stages by source
- A verified dealer list (name, address, phone, service area)
- CMS and repository access for the fixes

---

## Appendix A — Redirect map

### A.1 Map

| Old URL | New URL | Note |
|---|---|---|
| `/locations/Austin,TX/` | `/austin-tx/` | |
| `/locations/Charlotte,NC/` | `/charlotte-nc/` | |
| `/locations/Columbus,OH/` | `/columbus-oh/` | |
| `/locations/Cumming,GA/` | `/cumming-ga/` | |
| `/locations/Cypress,TX/` | `/cypress-tx/` | |
| `/locations/Detroit,MI/` | `/detroit-mi/` | |
| `/locations/Houston,TX/` | `/houston-tx/` | |
| `/locations/Nashville,TN/` | `/nashville-tn/` | |
| `/locations/Omaha,NE/` | `/omaha-ne/` | |
| `/locations/Orlando,FL/` | `/orlando-fl/` | |
| `/locations/Prosper,TX/` | `/prosper-tx/` | |
| `/locations/Raleigh,NC/` | `/raleigh-nc/` | |
| `/locations/Roseville,CA/` | `/roseville-ca/` | |
| `/locations/Woodbury,MN/` | `/woodbury-mn/` | |
| `/locations/{any other City},{ST}/` | `/{city-slug}-{st}/` | Generic rule (A.3) |
| `/index.html` | `/` | |
| `/about.html` | `/about-us/` | |
| `/Blinds.html` | `/products/blinds/` | |
| `/Shades.html` | `/products/shades/` | |
| `/Shutters.html` | `/products/shutters/` | |
| `/Curtains.html` | `/products/drapes/` | |
| `/Verticals.html` | `/products/shades/vertical-sheer-shades/` | Closest current product |
| `/services.html` | `/products/` | |
| `/gallery.html` | `/gallery/` | |
| `/contact.html` | `/free-consultation/` | |
| `/freeblinds.html` | `/free-consultation/` | |
| `/Terms.html`, `/termsandconditions` | `/terms-and-conditions/` | |
| `/Warranty.html`, `/warranty` | `/terms-and-conditions/` → `/warranty/` once M-10 ships | Remove the `/warranty` rule when the page exists |
| `/contact-us` | `/free-consultation/` | Remove if a real `/contact-us/` page is built |
| `/promo` | `/free-consultation/` | Or the current offer page |
| `/Vara` | `/vara/` | Case-sensitive rule: `/vara/` is live |
| `/Gamana%20Tech` and everything below it | `/products/motorization/` | |
| `/products/plantation-shutters/` | `/products/shutters/` | Advertised in llms.txt |
| `/products/motorized/` | `/products/motorization/` | Advertised in llms.txt |
| `/products/noble-drapes/` | `/products/drapes/` | Advertised in llms.txt |

### A.2 nginx rules

Place these inside the `server { listen 443 ssl; server_name slickblinds.com; … }` block, above the `location /` that proxies to Next.js. nginx decodes `%20` and `%2C` before matching, so spaces and commas are written literally. Run `nginx -t` before reloading.

```nginx
# --- Old city URLs: /locations/City,ST/ -> /city-st/ ---
location ~* "^/locations/austin,tx/?$"        { return 301 https://slickblinds.com/austin-tx/; }
location ~* "^/locations/charlotte,nc/?$"     { return 301 https://slickblinds.com/charlotte-nc/; }
location ~* "^/locations/columbus,oh/?$"      { return 301 https://slickblinds.com/columbus-oh/; }
location ~* "^/locations/cumming,ga/?$"       { return 301 https://slickblinds.com/cumming-ga/; }
location ~* "^/locations/cypress,tx/?$"       { return 301 https://slickblinds.com/cypress-tx/; }
location ~* "^/locations/detroit,mi/?$"       { return 301 https://slickblinds.com/detroit-mi/; }
location ~* "^/locations/houston,tx/?$"       { return 301 https://slickblinds.com/houston-tx/; }
location ~* "^/locations/nashville,tn/?$"     { return 301 https://slickblinds.com/nashville-tn/; }
location ~* "^/locations/omaha,ne/?$"         { return 301 https://slickblinds.com/omaha-ne/; }
location ~* "^/locations/orlando,fl/?$"       { return 301 https://slickblinds.com/orlando-fl/; }
location ~* "^/locations/prosper,tx/?$"       { return 301 https://slickblinds.com/prosper-tx/; }
location ~* "^/locations/raleigh,nc/?$"       { return 301 https://slickblinds.com/raleigh-nc/; }
location ~* "^/locations/roseville,ca/?$"     { return 301 https://slickblinds.com/roseville-ca/; }
location ~* "^/locations/woodbury,mn/?$"      { return 301 https://slickblinds.com/woodbury-mn/; }
# Not in the archive, but likely to have existed:
location ~* "^/locations/apple valley,mn/?$"      { return 301 https://slickblinds.com/apple-valley-mn/; }
location ~* "^/locations/manvel,tx/?$"            { return 301 https://slickblinds.com/manvel-tx/; }
location ~* "^/locations/san antonio,tx/?$"       { return 301 https://slickblinds.com/san-antonio-tx/; }
location ~* "^/locations/south windsor,ct/?$"     { return 301 https://slickblinds.com/south-windsor-ct/; }
location ~* "^/locations/(the )?woodlands?,tx/?$" { return 301 https://slickblinds.com/woodland-tx/; }  # update when the page moves to /the-woodlands-tx/

# --- 2017-era static site ---
location ~* "^/index\.html$"      { return 301 https://slickblinds.com/; }
location ~* "^/about\.html$"      { return 301 https://slickblinds.com/about-us/; }
location ~* "^/blinds\.html$"     { return 301 https://slickblinds.com/products/blinds/; }
location ~* "^/shades\.html$"     { return 301 https://slickblinds.com/products/shades/; }
location ~* "^/shutters\.html$"   { return 301 https://slickblinds.com/products/shutters/; }
location ~* "^/curtains\.html$"   { return 301 https://slickblinds.com/products/drapes/; }
location ~* "^/verticals\.html$"  { return 301 https://slickblinds.com/products/shades/vertical-sheer-shades/; }
location ~* "^/services\.html$"   { return 301 https://slickblinds.com/products/; }
location ~* "^/gallery\.html$"    { return 301 https://slickblinds.com/gallery/; }
location ~* "^/contact\.html$"    { return 301 https://slickblinds.com/free-consultation/; }
location ~* "^/freeblinds\.html$" { return 301 https://slickblinds.com/free-consultation/; }
location ~* "^/terms\.html$"      { return 301 https://slickblinds.com/terms-and-conditions/; }
location ~* "^/warranty\.html$"   { return 301 https://slickblinds.com/terms-and-conditions/; }  # -> /warranty/ after M-10

# --- 2024-era URLs ---
location ~  "^/Vara/?$"               { return 301 https://slickblinds.com/vara/; }  # case-SENSITIVE on purpose
location ~* "^/termsandconditions/?$" { return 301 https://slickblinds.com/terms-and-conditions/; }
location ~* "^/promo/?$"              { return 301 https://slickblinds.com/free-consultation/; }
location ~* "^/contact-us/?$"         { return 301 https://slickblinds.com/free-consultation/; }   # remove if /contact-us/ is built
location ~* "^/warranty/?$"           { return 301 https://slickblinds.com/terms-and-conditions/; } # remove when /warranty/ exists
location ~* "^/gamana tech(/.*)?$"    { return 301 https://slickblinds.com/products/motorization/; }

# --- URLs advertised in llms.txt that don't exist (also fix llms.txt, M-12) ---
location ~* "^/products/plantation-shutters/?$" { return 301 https://slickblinds.com/products/shutters/; }
location ~* "^/products/motorized/?$"           { return 301 https://slickblinds.com/products/motorization/; }
location ~* "^/products/noble-drapes/?$"        { return 301 https://slickblinds.com/products/drapes/; }
```

### A.3 Generic rule for any other old city URL (Next.js middleware)

```ts
// middleware.ts: catches /locations/{City},{ST}/ variants not listed in nginx
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const path = decodeURIComponent(req.nextUrl.pathname);
  const m = path.match(/^\/locations\/([^/,]+),\s*([A-Za-z]{2})\/?$/);
  if (!m) return NextResponse.next();
  const city = m[1].trim().toLowerCase().replace(/\s+/g, '-');
  const url = req.nextUrl.clone();
  url.pathname = `/${city}-${m[2].toLowerCase()}/`;
  return NextResponse.redirect(url, 301);
}

export const config = { matcher: ['/locations/:path*'] };
```

### A.4 Test

```bash
for u in "/locations/Houston,TX/" "/Blinds.html" "/Vara" "/Gamana%20Tech" "/warranty" "/products/motorized/"; do
  curl -s -o /dev/null -w "%{http_code} %{redirect_url}  $u\n" "https://slickblinds.com$u"
done
# Expect: 301 with the mapped target, and the target itself returns 200
```

---

## Appendix B — City page data

5-word-shingle similarity after removing sitewide header and footer text. "Internal links in" counts links from anywhere on the site (crawl of 62 URLs).

| URL | Title | Desc chars | H1 | Local phone | Area code matches market? | Address shown | LocalBusiness schema | Internal links in | Most similar page |
|---|---|---|---|---|---|---|---|---|---|
| `/apple-valley-mn/` | Custom Window Blinds in Apple Valley, MN | 214 | Beautiful Custom Blinds in Apple Valley,MN | 612-216-4738 | ✅ | Yes | Yes | 0 | 79% (/manvel-tx/) |
| `/austin-tx/` | Custom Blinds and Drapes in Austin, TX | 156 | Beautiful Custom Blinds in Austin,TX | 919-793-6943 | ⚠️ NC | No | No | 0 | 35% (/columbus-oh/) |
| `/charlotte-nc/` | Blinds & Shades Installation in Charlotte, NC | 538 | Beautiful Custom Blinds in Charlotte,NC | 203-710-2241 | ⚠️ CT | No | No | 0 | 55% (/cumming-ga/) |
| `/columbus-oh/` | Window Blinds and Shades in Columbus, OH | 220 | Beautiful Custom Blinds in Columbus,OH | 740-483-7874 | ✅ | No | No | 0 | 52% (/woodbury-mn/) |
| `/cumming-ga/` | Stylish Translucid Drapes Installation in Cumming, GA | 222 | Beautiful Custom Blinds in Cumming,GA | 847-722-4385 | ⚠️ IL | No | No | 0 | 58% (/roseville-ca/) |
| `/cypress-tx/` | Custom Window Blinds and Shades in Cypress, TX | 183 | Beautiful Custom Blinds in Cypress,TX | 713-424-9799 | ✅ | No | No | 0 | 92% (/houston-tx/) |
| `/detroit-mi/` | Faux Wood Blinds Services in Detroit, MI | 251 | Warm & Durable Blinds in Detroit,MI | 716-547-9605 | ⚠️ NY | No | No | 0 | 57% (/roseville-ca/) |
| `/houston-tx/` | Window Blinds and Shades in Houston, TX | 193 | Beautiful Custom Blinds in Houston,TX | 713-424-9799 | ✅ | No | No | 0 | 92% (/cypress-tx/) |
| `/lps-houston-tx/` | Custom Window Blinds and Shades in Houston, TX | 183 | Your Houston Home Deserves Custom Windows Treatments | 713-424-9799 | ✅ | No | No | 0 | 60% (/houston-tx/) |
| `/manvel-tx/` | Custom Window Blinds in Manvel, TX | 208 | Beautiful Custom Blinds in Manvel, TX | 860-655-7837 | ⚠️ CT | No | No | 0 | 94% (/woodland-tx/) |
| `/nashville-tn/` | Zebra Shades and Shutters in Nashville, TN | 224 | Beautiful Custom Blinds in Nashville,TN | 507-210-9975 | ⚠️ MN | No | No | 0 | 59% (/woodbury-mn/) |
| `/omaha-ne/` | Best Blinds Company in Omaha, NE | 225 | Practical & Stylish Blinds in Omaha,NE | 531-777-8978 | ✅ | No | No | 0 | 59% (/south-windsor-ct/) |
| `/orlando-fl/` | Window Shades Installation in Orlando, FL | 273 | Warm & Durable Blinds in Orlando,FL | 704-402-4173 | ⚠️ NC | No | No | 0 | 57% (/detroit-mi/) |
| `/prosper-tx/` | Custom Drapes Installation in Prosper, TX | 184 | Beautiful Custom Blinds in Prosper,TX | 469-552-5550 | ✅ | Yes | Yes | 0 | 39% (/cumming-ga/) |
| `/raleigh-nc/` | Window Blinds in Raleigh, NC | 229 | Beautiful Custom Blinds in Raleigh,NC | 925-548-2346 | ⚠️ CA | No | No | 0 | 49% (/cumming-ga/) |
| `/roseville-ca/` | Custom Blinds Services in Roseville, CA | 277 | Beautiful Custom Blinds in Roseville,CA | 916-581-1594 | ✅ | No | No | 0 | 58% (/cumming-ga/) |
| `/san-antonio-tx/` | Roller Blinds in San Antonio, TX | 223 | Beautiful Custom Blinds in San Antonio,TX | 214-215-4292 | ⚠️ Dallas (214) | No | No | 0 | 55% (/cumming-ga/) |
| `/south-windsor-ct/` | Window Shades Installation in South Windsor, CT | 245 | Classic & Functional Blinds in South Windsor,CT | 959-256-8062 | ✅ | Yes | Yes | 0 | 59% (/omaha-ne/) |
| `/woodbury-mn/` | Custom Window Blinds in Woodbury, MN | 222 | Beautiful Custom Blinds in Woodbury,MN | 847-345-8165 | ⚠️ IL | No | No | 0 | 59% (/nashville-tn/) |
| `/woodland-tx/` | Custom Window Blinds in Woodland, TX | 210 | Beautiful Custom Blinds in Woodland, TX | 860-655-7837 | ⚠️ CT | No | No | 0 | 94% (/manvel-tx/) |

---

## Appendix C — Page inventory (all 60 HTML pages)

HTML KB is the decompressed size. Page-level schema lists the main types; sitewide Organization and WebSite are omitted.

| URL | In sitemap | HTML KB | Words | Internal link occurrences in | Title chars | Desc chars | Images (empty alt) | Page-level schema |
|---|---|---|---|---|---|---|---|---|
| `/` | Y | 295 | 744 | 185 | 48 | 134 | 62 (52) | HowTo |
| `/free-consultation/` | Y | 208 | 729 | 270 | 39 | 147 | 42 (36) | — |
| `/products/` | Y | 142 | 392 | 103 | 43 | 149 | 14 (9) | — |
| `/vara/` | Y | 205 | 684 | 81 | 42 | 113 | 27 (22) | BreadcrumbList, Service |
| `/rassa/` | Y | 140 | 359 | 81 | 49 | 105 | 14 (9) | BreadcrumbList, Service |
| `/products/motorization/` | Y | 219 | 1147 | 183 | 56 | 142 | 26 (13) | BreadcrumbList, Service |
| `/products/outdoor/` | Y | 288 | 484 | 123 | 36 | 143 | 50 (16) | BreadcrumbList, Product, Service |
| `/gallery/` | Y | 222 | 181 | 1 | 48 | 140 | 38 (33) | BreadcrumbList |
| `/become-a-dealer/` | Y | 156 | 267 | 100 | 37 | 147 | 30 (25) | BreadcrumbList |
| `/about-us/` | Y | 206 | 694 | 120 | 52 | 142 | 46 (39) | BreadcrumbList, WebPage |
| `/faqs/` | Y | 831 | 9434 | 60 | 35 | 142 | 9 (4) | BreadcrumbList, FAQPage |
| `/privacy-policy/` | Y | 151 | 616 | 60 | 29 | 143 | 11 (6) | BreadcrumbList |
| `/terms-and-conditions/` | Y | 148 | 722 | 60 | 43 | 136 | 8 (3) | BreadcrumbList |
| `/products/blinds/` | Y | 266 | 769 | 144 | 35 | 150 | 64 (58) | BreadcrumbList, Service |
| `/products/shades/` | Y | 289 | 1057 | 148 | 35 | 149 | 68 (62) | BreadcrumbList, Service |
| `/products/shutters/` | Y | 276 | 1140 | 144 | 41 | 157 | 64 (58) | BreadcrumbList, Service |
| `/products/drapes/` | Y | 285 | 1301 | 147 | 41 | 141 | 65 (59) | BreadcrumbList, Service |
| `/products/blinds/faux-wood-blinds/` | Y | 296 | 497 | 14 | 48 | 156 | 52 (17) | BreadcrumbList, Product, Service |
| `/products/blinds/wood-blinds/` | Y | 299 | 532 | 11 | 40 | 150 | 52 (16) | BreadcrumbList, Product, Service |
| `/products/shades/roller-shades/` | Y | 328 | 782 | 12 | 47 | 137 | 61 (18) | BreadcrumbList, Product, Service |
| `/products/shades/triple-shades/` | Y | 295 | 552 | 9 | 55 | 149 | 51 (18) | BreadcrumbList, Product, Service |
| `/products/shades/cellular-shades/` | Y | 306 | 513 | 14 | 37 | 139 | 54 (18) | BreadcrumbList, Product, Service |
| `/products/shades/roman-shades/` | Y | 294 | 508 | 7 | 46 | 152 | 52 (16) | BreadcrumbList, Product, Service |
| `/products/shades/vertical-sheer-shades/` | Y | 286 | 530 | 5 | 43 | 149 | 49 (17) | BreadcrumbList, Product, Service |
| `/products/shades/zebra-shades/` | Y | 304 | 612 | 12 | 46 | 144 | 57 (18) | BreadcrumbList, Product, Service |
| `/products/shutters/poly-shutters/` | Y | 305 | 523 | 11 | 35 | 148 | 54 (16) | BreadcrumbList, Product, Service |
| `/products/shutters/wood-plantation-shutters/` | Y | 308 | 553 | 12 | 43 | 144 | 54 (17) | BreadcrumbList, Product, Service |
| `/products/drapes/blackout-curtains/` | Y | 290 | 493 | 12 | 51 | 144 | 52 (19) | BreadcrumbList, Product, Service |
| `/products/drapes/drapery-panels/` | Y | 272 | 497 | 4 | 36 | 130 | 48 (18) | BreadcrumbList, Product, Service |
| `/products/drapes/sheer-curtains/` | Y | 288 | 495 | 4 | 36 | 137 | 52 (19) | BreadcrumbList, Product, Service |
| `/apple-valley-mn/` | Y | 259 | 1165 | 0 | 40 | 214 | 51 (46) | BreadcrumbList, HomeAndConstructionBusiness, Service |
| `/austin-tx/` | Y | 251 | 1413 | 0 | 38 | 156 | 52 (47) | BreadcrumbList |
| `/charlotte-nc/` | Y | 220 | 769 | 0 | 45 | 538 | 57 (47) | BreadcrumbList |
| `/columbus-oh/` | Y | 219 | 917 | 0 | 40 | 220 | 52 (46) | BreadcrumbList |
| `/cumming-ga/` | Y | 216 | 769 | 0 | 53 | 222 | 52 (46) | BreadcrumbList |
| `/cypress-tx/` | Y | 218 | 998 | 0 | 46 | 183 | 52 (46) | BreadcrumbList |
| `/detroit-mi/` | Y | 217 | 741 | 0 | 40 | 251 | 52 (46) | BreadcrumbList |
| `/houston-tx/` | Y | 219 | 1001 | 0 | 39 | 193 | 52 (46) | BreadcrumbList |
| `/lps-houston-tx/` | Y | 247 | 1508 | 0 | 46 | 183 | 52 (46) | BreadcrumbList |
| `/manvel-tx/` | Y | 235 | 1145 | 0 | 34 | 208 | 47 (42) | BreadcrumbList |
| `/nashville-tn/` | Y | 221 | 811 | 0 | 42 | 224 | 57 (51) | BreadcrumbList |
| `/omaha-ne/` | Y | 216 | 718 | 0 | 32 | 225 | 57 (47) | BreadcrumbList |
| `/orlando-fl/` | Y | 215 | 686 | 0 | 41 | 273 | 52 (47) | BreadcrumbList |
| `/prosper-tx/` | Y | 229 | 1238 | 0 | 41 | 184 | 53 (47) | BreadcrumbList, HomeAndConstructionBusiness, Service |
| `/raleigh-nc/` | Y | 219 | 963 | 0 | 28 | 229 | 52 (46) | BreadcrumbList |
| `/roseville-ca/` | Y | 217 | 775 | 0 | 39 | 277 | 52 (46) | BreadcrumbList |
| `/san-antonio-tx/` | Y | 216 | 816 | 0 | 32 | 223 | 52 (47) | BreadcrumbList |
| `/south-windsor-ct/` | Y | 223 | 692 | 0 | 47 | 245 | 53 (48) | BreadcrumbList, HomeAndConstructionBusiness, Service |
| `/woodbury-mn/` | Y | 215 | 792 | 0 | 36 | 222 | 52 (46) | BreadcrumbList |
| `/woodland-tx/` | Y | 236 | 1154 | 0 | 36 | 210 | 47 (42) | BreadcrumbList |
| `/products/shop-by-room/living-room/` | Y | 184 | 460 | 0 | 70 | 153 | 21 (16) | BreadcrumbList |
| `/products/shop-by-room/bedroom/` | Y | 170 | 414 | 0 | 66 | 149 | 18 (13) | BreadcrumbList |
| `/products/shop-by-room/kitchen/` | Y | 155 | 363 | 0 | 66 | 149 | 15 (10) | BreadcrumbList |
| `/products/shop-by-room/bathroom/` | Y | 155 | 363 | 0 | 67 | 150 | 15 (10) | BreadcrumbList |
| `/products/shop-by-room/home-office/` | Y | 160 | 383 | 0 | 70 | 153 | 16 (11) | BreadcrumbList |
| `/products/shop-by-room/kids-room/` | Y | 169 | 415 | 0 | 68 | 151 | 18 (13) | BreadcrumbList |
| `/products/shop-by-room/dining-room/` | Y | 174 | 426 | 0 | 70 | 153 | 19 (14) | BreadcrumbList |
| `/products/shop-by-room/sunroom/` | Y | 179 | 446 | 0 | 66 | 149 | 20 (15) | BreadcrumbList |
| `/careers/` | **N** | 139 | 169 | 61 | 13 | 130 | 11 (6) | BreadcrumbList |
| `/careers/master-window-coverings-installer-installation-training-manager/` | **N** | 170 | 1789 | 1 | 65 | 237 | 11 (6) | BreadcrumbList |

---

## Appendix D — Lab performance measurements

Chrome DevTools Protocol probe, cache disabled. **Mobile:** 412×823 at DPR 2.625, 4× CPU slowdown, +150 ms latency, 1.6 Mbps down. **Desktop:** 1350×940, unthrottled. Run from India, about 220 ms round trip to the origin, which adds roughly 0.5–0.7 s to TTFB compared with a US visitor. Use these numbers for relative comparison, and confirm with CrUX field data.

| Page | Profile | TTFB | FCP | LCP | LCP element | CLS | TBT (approx.) | Requests | Total | JS |
|---|---|---|---|---|---|---|---|---|---|---|
| Home | Mobile | 0.88 s | 2.13 s | 3.83 s | Hero image (Plantation Shutters, AVIF w=1200) | 0 | 384 ms | 112 | 1,946 KB | 1,166 KB |
| Home | Desktop | 1.16 s | 2.11 s | 2.13 s | Hero image | 0 | 0 ms | 87 | 1,741 KB | 1,166 KB |
| Roller shades | Mobile | 1.22 s | 2.47 s | 2.93 s | H2 "Why Choose Roller Shades…" | 0 | 454 ms | 98 | 1,462 KB | 1,151 KB |
| Roller shades | Desktop | 1.04 s | 1.89 s | 2.30 s | Section image | 0.009 | 0 ms | 78 | 1,442 KB | 1,152 KB |
| Houston | Mobile | 1.01 s | 2.46 s | 2.46 s | Hero background image | 0.008 | 405 ms | 114 | 1,552 KB | 1,322 KB |
| Houston | Desktop | 1.09 s | 1.84 s | 2.17 s | Hero background image | 0.002 | 0 ms | 87 | 1,553 KB | 1,322 KB |

**JS by host, homepage:** googletagmanager.com 693 KB · connect.facebook.net 264 KB · scripts.clarity.ms 25 KB · cdn.jsdelivr.net 18 KB · first-party ~165 KB. City and consultation pages add Bitrix24: ~127 KB from `slickblinds.bitrix24.in` and ~33 KB from `cdn.bitrix24.in`.
