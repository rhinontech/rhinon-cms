# SEO Audit — rhinonlabs.com

**Date:** 30 Oct 2026
**Scope:** All 31 URLs in `sitemap.xml`, plus robots.txt, redirects, the 404 page, structured data, and the site source (`rhinonlabs/` on `origin/main`, which matches production. The local `ahmar-dev` branch is behind and has no `/services` routes).
**Method:** Crawled the live HTML with a Googlebot user agent and cross-checked against the source. Core Web Vitals were **not** measured because the PageSpeed API quota was exhausted (see "What I need from GSC").

---

## Summary

The technical base is good. Every page has a unique title, meta description, self-referencing canonical, exactly one H1, Open Graph and Twitter tags, server-rendered content, and an Organization/WebSite schema graph. robots.txt is clean and allows AI crawlers, and `llms.txt` exists.

The problems are concentrated in a few places:

1. **A live 404 is in the sitemap and linked from the blog index.**
2. **The 404 page tells Google `index, follow`** and has two `<title>` tags.
3. **Sitemap `lastmod` is fake** (set to "now" on every request for 14 URLs).
4. **Weak internal linking from blog posts to service pages.** Most posts link to Wikipedia and the homepage instead of the matching service.
5. **Thin trust and conversion pages:** no About page, no Pricing page, only 3 short case studies.
6. **Mixed homepage positioning:** title, H1 and meta description each target a different promise.

---

## 🔴 P0 — Fix this week

### 1. Broken blog post in sitemap and blog index
- `https://www.rhinonlabs.com/blogs/ai-agents-vs-traditional-automatio` returns **404**. The slug also looks truncated ("automatio").
- It appears in `sitemap.xml` and is linked twice from `/blogs`, so both users and Googlebot hit a dead end.
- The list endpoint (`/public/blogs`) returns the post, but the detail endpoint (`/public/blogs/:slug`) does not. The CMS data or slug is probably inconsistent.

**Fix:**
- In the CMS, correct the slug (e.g. `ai-agents-vs-traditional-automation`) or unpublish the post.
- If the old URL was ever indexed or shared, add a 301 from the truncated slug to the corrected one.
- Make the list and detail endpoints use the same "published" filter so this can't recur.

### 2. 404 page is indexable and has duplicate titles
Every unknown URL returns status 404 (good), but the HTML contains:
```html
<meta name="robots" content="noindex"/>
<title>404: This page could not be found.</title>
<title>Rhinon Labs | Ship Your Product 3x Faster Without Hiring a Tech Team</title>
<meta name="description" content="We help founders and SMBs ..."/>
<meta name="robots" content="index, follow"/>
```
There is no `app/not-found.tsx`, so Next's default 404 inherits the root layout metadata.

**Fix:** Add `rhinonlabs/app/not-found.tsx` with its own metadata (`title: "Page not found"`, `robots: { index: false, follow: true }`). Make it a branded page with links to Services, Blog and Contact. A useful 404 also recovers visitors.

### 3. Data-fetch failures silently become 404s and empty sitemaps
In `rhinonlabs/lib/api.ts`, `getJSON()` returns `null` on **any** error (timeout, 5xx, network). As a result:
- `blogs/[slug]/page.tsx` and `case-studies/[slug]/page.tsx` call `notFound()`, so a temporary API outage serves real 404s for real articles. Pages are prerendered and cached (`x-nextjs-prerender: 1`), so the 404 can persist.
- `sitemap.ts` catches the error and returns only static routes, so all blogs and case studies drop out of the sitemap.

**Fix:** Only call `notFound()` when the API actually returns 404. On other errors, throw so Next serves a 5xx or keeps the last good cached version. Google retries 5xx but treats 404 as "gone". Apply the same rule in the sitemap: throw instead of returning a partial list.

---

## 🟠 P1 — Fix this month

### 4. Sitemap `lastmod` is always "now"
14 URLs (home, static pages, `/services`, all 6 service pages) send `lastModified: new Date()`, so every fetch claims they changed at that moment. Google learns to ignore your `lastmod` across the whole site, including the accurate blog dates.

**Fix** (`rhinonlabs/app/sitemap.ts`):
- Use real dates: a hard-coded "last edited" date per static or service page (e.g. in `lib/services.ts`), and `updatedAt` (not `publishedAt`) for blogs and case studies.
- Remove `changeFrequency` and `priority`. Google ignores both.
- Case studies currently use `2025-01-01` and `2026-01-01` placeholder dates. Use real ones.

### 5. Redirect chain on the non-www HTTP host
`http://rhinonlabs.com/...` → `https://rhinonlabs.com/...` → `https://www.rhinonlabs.com/...` (2 hops).
**Fix:** In Vercel domain settings, redirect `rhinonlabs.com` (both HTTP and HTTPS) straight to `https://www.rhinonlabs.com` in one hop.

`/startup` also returns **307 (temporary)**. If that move is permanent, use 308/301.

### 6. Internal linking: blog → service pages
Blog posts are the pages most likely to rank, and service pages are the pages that convert. The links between them are weak:

| Post | Links to matching service? | Should link to |
|---|---|---|
| chatbot-vs-ai-agent-real-difference | ❌ (homepage + Wikipedia) | `/services/ai-agents` |
| zapier-vs-custom-automation | ❌ | `/services/workflow-automation` |
| why-arent-your-tools-talking-to-each-other | ❌ | `/services/workflow-automation` |
| automating-onboarding | ❌ | `/services/workflow-automation` |
| time-triggered-email-automation | ❌ | `/services/workflow-automation` |
| automate-first-in-a-product-led-growth-motion | ❌ | `/services/workflow-automation` |
| event-registration-system | ❌ | `/services/internal-dashboards`, `/services/web-development` |
| who-actually-owns-ops-in-a-five-person-team | ❌ | `/services/internal-dashboards` |
| dependent-on-one-persons-memory | ❌ | `/services/workflow-automation`, `/services/ai-agents` |
| mvp-development-cost-india-2026-guide | ✅ | — |
| how-long-does-it-take-to-build-an-mvp-india-guide | ✅ | — |
| mobile-app-development-cost-startups-india | ✅ | — |
| ai-agent-security-for-businesses-india-2026 | ✅ | — |

**Fix:**
- Add 1–2 contextual links per post, with descriptive anchor text (e.g. "custom workflow automation"), to the matching service page.
- Replace generic `https://www.rhinonlabs.com/` links with the relevant service link.
- Add a "Related articles" block (2–3 posts in the same category) at the end of each post.
- On each service page, add "Related reading" links back to its 2–3 blog posts. Right now service pages have no links into the blog.

### 7. Homepage positioning is split three ways
| Element | Current |
|---|---|
| `<title>` | Rhinon Labs – MVP, AI & Software Development for Startups |
| Meta description | Ship your product 3x faster without hiring a tech team… |
| H1 | Scale Your Operations, Not Your Headcount. |
| H2s | Workflow Automation, AI Agents, Custom Dashboards |

The title targets startup MVP development, while the H1 and body target SMB operations and automation. Google can't tell which query the homepage should rank for, and visitors from an "MVP" search land on an "operations" message.

**Fix:** Pick one primary audience for the homepage and align the title, H1 and description to it. Let `/build` and `/services/mvp-development` own the MVP/startup intent. Also make the H1 carry the keyword, e.g. *"AI Automation & Custom Software that Scales Your Operations, Not Your Headcount"*.

### 8. Missing trust pages (E-E-A-T)
- **No About page.** `app/_about` exists but is disabled (underscore prefix), and `/about` and `/about-us` return 404. For an agency, the About page is a key trust and brand-query page.
- **No Pricing page** (`/pricing` returns 404). The blog ranks for "MVP cost" and "app development cost" searches but has no pricing or packages page to send those readers to.
- **Author entity:** posts are by "Prabhat Patra, Founder @ Rhinon Tech", with no author page or link. "Rhinon Tech" vs "Rhinon Labs" muddles the brand entity.

**Fix:**
- Launch `/about` with team, founder bio, location, photos and social links.
- Add `/authors/prabhat-patra` (or a section on `/about`) and link the byline to it.
- Add `url` and `sameAs` (LinkedIn) to the `Person` in the BlogPosting schema.
- Either use "Rhinon Labs" consistently or explain the relationship between Rhinon Tech and Rhinon Labs on the About page and in `Organization.parentOrganization`.
- Publish a pricing or "engagement models" page with starting price ranges.

### 9. Case studies are thin
- `/case-studies` has 245 words and 3 projects. The individual case studies run 400–600 words.
- `/case-studies/apexispro` has the title "Apexis Pro | Rhinon Labs" (24 characters), which says nothing about what was built.
- The SR Fitout case study links to `sr-fitout.vercel.app`, a Vercel preview domain that looks unfinished to readers.

**Fix:**
- Expand each case study to 800+ words: client context, problem, approach, stack, timeline, measurable outcomes (numbers), a client quote, and screenshots with alt text.
- Use descriptive titles, e.g. *"Apexis Pro – [what you built] Case Study | Rhinon Labs"*.
- Link each case study to the service it demonstrates, and add more case studies as projects ship.

---

## 🟡 P2 — On-page polish

### 10. Titles over ~60 characters (truncated in SERPs)
| Page | Length | Suggestion |
|---|---|---|
| /blogs/automating-onboarding | 75 | "Automate Onboarding, Invoicing & Reporting: Founder's Guide" |
| /blogs/event-registration-system | 71 | "Build an Event Registration System with Auto Admin Panel" |
| /services/web-development | 65 | "Website & Web App Development for Startups \| Rhinon Labs" |
| /case-studies/furrcircle-… | 61 | "FurrCircle Pet Parent App – Case Study \| Rhinon Labs" |
| /blogs/chatbot-vs-ai-agent-real-difference | 61 | "Chatbot vs AI Agent: What's the Real Difference?" |

### 11. Meta descriptions over ~160 characters
`/build` (173), `/case-studies/furrcircle-…` (192), `/case-studies/srfitout` (190), `/blogs/mobile-app-development-cost-startups-india` (169), `/services/mvp-development` (169). Trim each to 140–155 characters and keep the value proposition in the first 120.

### 12. Content typos
- The event-registration H1 and schema headline end with **"Admin Panel ?"**. Remove the stray space before the "?".
- The broken slug "…automatio" (see #1).

### 13. Image alt text
The homepage has **21 of 44 images with empty `alt`**.
- The testimonial avatars (`/assets/avatars/*.webp`) can stay `alt=""` because they are decorative.
- The case-study and blog card images on the homepage (`next/image` `fill`, `alt=""`) should use the project or post title as alt text.
- All other pages are fine.

### 14. Default OG image on core pages
`/`, `/build`, `/contact-us`, `/case-studies`, `/blogs`, `/schedule-call` and `/services` all share `/og-image.jpg`. Create page-specific 1200×630 images, at minimum for `/services`, `/build` and `/case-studies`. These matter when links are shared on LinkedIn and WhatsApp.

### 15. Locale
`openGraph.locale` is `en_US`, but much of the content and offering targets India (₹ pricing, "India 2026" guides). Set `en_IN`. If you serve both markets, keep `en` and make the country targeting clear in the content and Organization `areaServed`.

### 16. Low-value meta
The `keywords` meta tag in `app/layout.tsx` is ignored by Google and exposes your keyword list to competitors. You can remove it.

---

## 🟡 P2 — Structured data

The schema setup is clean overall: a single `@graph` with `@id`s, plus Service, FAQPage, BreadcrumbList and BlogPosting where relevant, and all JSON-LD parses without errors. Gaps:

| Page type | Missing / fix |
|---|---|
| Blog posts | **BreadcrumbList** (the visual breadcrumb exists, but there is no schema for it) |
| Blog posts | `dateModified`, plus author `url` and `sameAs` |
| `/blogs` | `CollectionPage` or `Blog` with an `ItemList` of posts |
| `/case-studies` | `CollectionPage` + `ItemList` |
| Case studies | Link to the client (`about` / `mentions`) and to the service provided |
| Organization | Add `foundingDate`, `founder`, `email`, and a full `sameAs` list (LinkedIn, Clutch, GoodFirms, X) |

> **Note on FAQPage:** Since 2023, Google shows FAQ rich results only for authoritative government and health sites, so the FAQ schema will **not** produce rich snippets here. It is harmless and still helps AI answer engines, so keep it, but don't count on SERP features from it. Do keep the visible FAQ text and the schema text identical.

---

## 🟡 P2 — Performance (needs measurement)

- HTML documents are heavy: **565 KB for the homepage** and 350–415 KB for every other page, mostly from the inlined RSC payload. Each page loads about 39 script tags.
- The homepage has 44 images. Most are lazy-loaded through `next/image`, which is good.

**To do:**
- Get real CWV data (see the GSC section below).
- Check that the hero LCP image or video is not lazy-loaded and has `priority`.
- Look for large client components that could be server components, to shrink the RSC payload. Common candidates are the logo/integrations grid and the FAQ.
- `public/heroVideo.mp4`: confirm that it is compressed and that a poster image is set.

---

## 🟢 P3 — Growth opportunities

1. **Commercial-intent landing pages.** You have informational posts on cost and timeline, but no pages for the buying queries:
   - "MVP development company in India"
   - "AI agent development company India"
   - "hire workflow automation agency"
   - Location pages (e.g. city + "app development company")
   - Industry pages (e.g. "automation for real estate / clinics / D2C")
2. **Comparison and alternative content**, e.g. "Rhinon Labs vs freelancers vs in-house", "n8n vs Make vs Zapier", "Bubble vs custom MVP".
3. **Watch for cannibalization** between `mvp-development-cost-india-2026-guide` and `how-long-does-it-take-to-build-an-mvp-india-guide`, whose title includes "& Costs". Keep the first about cost and the second about timeline, and cross-link them. GSC query data will confirm whether they compete.
4. **Off-page signals.** Get listed on Clutch, GoodFirms, DesignRush and Google Business Profile, and add those profiles to `sameAs`. Client logos and backlinks from case-study clients (Apexis, FurrCircle, SR Fitout) are quick wins.
5. **Security headers** (not a ranking factor, but good hygiene): add `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/CSP via `next.config.ts` `headers()`.

---

## ✅ Already done well
- HTTPS + HSTS, a single canonical host (`www`), and trailing-slash URLs 308 to the non-slash version
- Unique title, description and self-canonical on every page; one H1 per page
- robots.txt is clean: blocks `/admin`, `/api`, `/unsubscribe`; allows AI and search bots; links the sitemap
- `llms.txt` present
- Server-rendered content; real 404 status for unknown URLs
- Blog posts are substantial (1,900–2,450 words) with a table of contents, FAQs, cover images, and author and date
- Service pages have Service, FAQPage and BreadcrumbList schema plus custom OG images

---

## What I need from Google Search Console

To move from "what's wrong on the site" to "what's costing traffic", please export:

1. **Performance → Search results** (last 16 months, or the maximum available): export the **Queries** and **Pages** tabs, plus Countries and Devices. This shows which queries you already rank for, CTR problems (high impressions, low clicks, so titles need work), and cannibalization.
2. **Indexing → Pages:** the counts and URL lists for each "Why pages aren't indexed" reason, especially *Crawled – currently not indexed*, *Discovered – currently not indexed*, *Duplicate without user-selected canonical*, *Alternate page with proper canonical*, and *Not found (404)*.
3. **Indexing → Sitemaps:** status, discovered URL count and any errors.
4. **Experience → Core Web Vitals** (mobile and desktop): any "Poor" or "Needs improvement" URL groups and which metric (LCP, INP or CLS) is failing.
5. **Links:** Top linking sites, Top linked pages (external), and Top linked pages (internal).
6. **Enhancements:** any errors or warnings under Breadcrumbs, FAQ or other detected structured data.
7. **Security & Manual actions:** confirm that both are clean.
8. **URL Inspection** for `/`, `/services/mvp-development` and one blog post: indexed? Which Google-selected canonical? Last crawl date?

Optional:
- GA4 landing-page report (organic sessions plus conversions per page)
- A PageSpeed Insights API key, so I can run lab CWV for every URL
- Your target keyword list or main competitors
