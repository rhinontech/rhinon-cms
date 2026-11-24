# SEO Audit — rhinontech.com

**Date:** 9 Nov 2026
**Scope:** All 25 URLs in `sitemap.xml` (crawling from them found no other internal pages), plus robots.txt, redirects, the 404 page, structured data, and the site source (`rhinontech-site/`. Local `ahmar-dev` matches `origin/main` for this folder, and `origin/main` matches production).
**Method:** Crawled the live HTML with a Googlebot user agent and cross-checked against the source. Core Web Vitals were **not** measured because the PageSpeed API quota was exhausted (see "What I need from GSC"). TTFB was measured by hand.

---

## Summary

The base is the strongest of the three sites. Every page is server-rendered and has a unique title, a meta description, a self-referencing canonical tag and a Twitter card. robots.txt and a sitemap exist, a branded `not-found.tsx` returns a real 404 with `noindex`, product pages and blog posts carry `FAQPage` schema, blog posts have `Article` schema and cover OG images, and the static pages are served from cache in Mumbai (`bom1`).

Most of the problems come from a few shared settings, so each fix is small:

1. **Every canonical, `og:url`, sitemap URL and the robots.txt `Sitemap:` line points to `https://rhinontech.com`, which 308-redirects to `https://www.rhinontech.com`.** The site gives Google conflicting signals about its own preferred URL on every page. This is one constant in `components/site.ts`.
2. **5 core pages have no H1:** `/product`, `/pricing`, `/integrations`, `/security` and `/contact`. Their hero heading is rendered by `SectionHead`, which always outputs an `<h2>`.
3. **22 of 25 pages share the homepage's `og:title` and `og:url`.** Pages override `title` but not `openGraph`, so a LinkedIn or WhatsApp share of `/product/crm` shows "Rhinon Tech | Run your whole company from one workspace" and links back to the homepage.
4. **The structured data is thin for a SaaS product.** There is no `SoftwareApplication` (with the free price), `WebSite` or `BreadcrumbList`, and the `Organization` has no `sameAs`. `Article` is missing `dateModified`, an author URL and a publisher logo.
5. **API failures silently become 404s and an empty sitemap.** This is the same pattern as on rhinonlabs.com and uppercurve.in.
6. **There are only 4 blog posts and no About or customer-proof pages**, so topical authority and E-E-A-T are both low for competitive "CRM / HR software India" queries.

---

## 🔴 P0 — Fix this week

### 1. Canonicals, sitemap and OG URLs point at a redirecting host
Live behaviour:

| URL | Result |
|---|---|
| `https://www.rhinontech.com/` | **200**. This is the URL Vercel actually serves. |
| `https://rhinontech.com/` | **308** → `https://www.rhinontech.com/` |
| `http://rhinontech.com` | 308 → `https://rhinontech.com/` → 308 → `www` (**2 hops**) |

But every page declares the non-www host as the preferred one:
```html
<link rel="canonical" href="https://rhinontech.com/product/crm"/>
<meta property="og:url" content="https://rhinontech.com"/>
```
and `sitemap.xml` lists `https://rhinontech.com/...` for all 25 URLs. robots.txt says `Sitemap: https://rhinontech.com/sitemap.xml`, the `Article` schema uses `https://rhinontech.com/...` for `mainEntityOfPage`, and the `Organization` schema uses it for `url`.

A canonical tag that points to a redirect is a contradictory signal. Google will usually settle on `www` anyway (it's where the content and the redirects lead), but the canonical stops being a hint you control. In GSC this often shows as *Page with redirect* for every sitemap URL, and *Alternate page with proper canonical tag* on the pages that are actually indexed.

**Cause:** `rhinontech-site/components/site.ts`:
```ts
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rhinontech.com";
```
`NEXT_PUBLIC_SITE_URL` is not set in Vercel, so `metadataBase`, `sitemap.ts`, `robots.ts` and both JSON-LD blocks all use the apex.

**Fix (pick one host and make everything agree):**
- **Recommended:** keep `www` as primary, since it's what Vercel serves today and what rhinonlabs.com and uppercurve.in use. Change the fallback to `"https://www.rhinontech.com"`, and/or set `NEXT_PUBLIC_SITE_URL=https://www.rhinontech.com` in the Vercel project (Production), then redeploy.
- Alternatively, make the apex the primary domain in Vercel → Domains, so `www` redirects to the apex. Only do this if the apex is the brand you want shown in results.
- Also fix the 2-hop `http://rhinontech.com` chain: in Vercel, make the apex redirect straight to `https://www.rhinontech.com`.
- After deploy, check the canonical on 2–3 pages, resubmit the sitemap in GSC, and update the Analytics key comment in `site.ts`, which says "only from rhinontech.com".

### 2. Five core pages have no H1
| Page | Visible hero heading (currently `<h2>`) |
|---|---|
| `/product` | Everything your company runs on, in one place. |
| `/pricing` | Free for everything. Pay only for the chatbot. |
| `/integrations` | Works with the tools you already use. |
| `/security` | Your company's data, kept yours. |
| `/contact` | We would love to hear from you. |

`SectionHead` in `components/ui.tsx` always renders an `<h2>`, and these five pages use it for their hero. `/pricing` and `/product` are two of the most commercially important pages on the site.

**Fix:**
- Add an `as?: "h1" | "h2"` prop to `SectionHead` (default `"h2"`), and pass `as="h1"` in the hero of each of the five pages.
- While you're there, put the keyword in the visible heading where it reads naturally, e.g. `/pricing` → *"Free CRM, HR and project software. Pay only for the chatbot."*, `/product` → *"CRM, HR, payroll and projects, in one workspace."*

### 3. API failures silently become 404s and an empty sitemap
In `lib/blog.ts`, `getJSON()` returns `null` on **any** error (timeout, 5xx, network). As a result:
- `blog/[slug]/page.tsx` calls `notFound()`, so a backend blip serves a real 404 for a real article. Pages are ISR-cached (`revalidate = 300`), so that 404 can stick for five minutes or more, and Google treats 404 as "gone".
- `/blog` renders with no posts and returns 200, which looks like a thin page.
- `sitemap.ts` silently drops every blog post.

**Fix:** Only return `null` when the API answers 404. On other errors, throw, so Next keeps serving the last good ISR version (or a 5xx, which Google retries). Make the sitemap throw too, rather than returning a partial list. This is the same fix recommended for rhinonlabs.com and uppercurve.in, so consider one shared helper.

---

## 🟠 P1 — Fix this month

### 4. Per-page Open Graph tags inherit the homepage
On all 11 product pages, `/product`, `/ai`, `/pricing`, `/integrations`, `/security`, `/contact`, `/demo` and `/blog`:
```html
<meta property="og:title" content="Rhinon Tech | Run your whole company from one workspace"/>
<meta property="og:url" content="https://rhinontech.com"/>
```
Next.js doesn't deep-merge `openGraph`: a page that sets only `title` and `description` inherits the layout's whole `openGraph` object. `/privacy-terms` does set its own `openGraph`, but by doing so it loses `og:image` (and `og:site_name`).

All pages also share the one generic `opengraph-image`, so a shared link to the CRM page and one to the payroll page look identical.

**Fix:**
- Add a small helper, e.g. `pageMeta({ title, description, path })` in `components/site.ts`, that returns `title`, `description`, `alternates.canonical` **and** `openGraph: { title, description, url: path, siteName: "Rhinon Tech", type: "website", locale: "en_IN" }`. Use it on every page.
- Add `app/product/[...]/opengraph-image.tsx`, or one per product, rendering the product name and its one-line promise on the existing branded background. Next picks these up automatically.
- Give `/pricing` and `/ai` their own images, at minimum. These are the pages most likely to be shared.

### 5. Add structured data for a SaaS product
Current schema: `Organization` on every page (name, url, logo, `parentOrganization` → Rhinon Labs), `FAQPage` on `/ai`, `/pricing` and the product pages, and `Article` + `FAQPage` on blog posts.

Recommended additions, in order of value:

| Page | Schema | Why |
|---|---|---|
| `/` and `/pricing` | **`SoftwareApplication`** (`applicationCategory: "BusinessApplication"`, `operatingSystem: "Web"`, `offers` with `price: 0`, `priceCurrency: "INR"`, plus an `Offer` for the paid chatbot) | Tells Google and AI answer engines it's a free business app. Add `aggregateRating` **only** once you have real reviews (e.g. from G2 or Capterra). |
| `/product/*` | `SoftwareApplication` (or `WebApplication`) per module, with `isPartOf` → the main app, plus `BreadcrumbList` (Home → Products → CRM) | Breadcrumbs in the SERP, and each module understood as its own product |
| `layout.tsx` (sitewide) | `WebSite` (`name`, `url`, `publisher` → Organization). Extend `Organization` with `sameAs` (LinkedIn, X, YouTube, G2…), `contactPoint` and `address` | Brand entity and knowledge panel |
| `/blog/[slug]` | Change to `BlogPosting`, and add `dateModified`, `author.url` (an author page or LinkedIn), `publisher.logo` and `BreadcrumbList` | Article understanding and author E-E-A-T |

Render it all as a single `@graph` with `@id`s (e.g. `https://www.rhinontech.com/#organization`), as is done on rhinonlabs.com, so the blog's `publisher` and the app's `provider` reference the same entity instead of repeating it. Do #1 first, so every `@id` and `url` uses the canonical host.

### 6. Blog `lastmod` and `dateModified` use the publish date
`sitemap.ts` sets `lastModified: new Date(p.publishedAt)`, and the `Article` schema has only `datePublished`. When you update a post, neither the sitemap nor the schema tells Google.

The 21 static pages have no `lastmod` at all, but carry `changefreq` and `priority`, which Google ignores.

**Fix:**
- Add `updatedAt` to `BlogSummary` (have the public blogs endpoint return it if it doesn't already), and use it for `lastModified` and `dateModified`.
- For static pages, either leave out `lastModified` or hard-code the real date of the last content change. Never use `new Date()`.
- Remove `changeFrequency` and `priority`.

### 7. Content depth and authority
- **Only 4 blog posts** (1,870–2,240 words each, well structured, with FAQs and contextual links to the matching product pages, which is good). That is too little to rank for competitive head terms like "free CRM India", "HR software for small business" or "payroll software India".
- Product pages run 600–1,140 words, mostly short feature copy, and `/integrations` (335 words), `/security` (453) and `/product` (391) are thin.
- There is **no About page, no customer logos, no case studies and no reviews** anywhere on the site. The homepage says "Built by Rhinon Labs", but nothing on this site says who the team is or where the company is based. For a product that holds payroll and HR data, that is a trust gap with both users and Google's quality raters.
- Blog bylines (e.g. "Prabhat Patra") have no author page or link.

**Fix:**
- Publish `/about` (team with real photos and LinkedIn, company address in India, the relationship with Rhinon Labs) and link it from the footer.
- Add author pages (`/blog/author/<slug>`) or link bylines to LinkedIn, and use that URL as `author.url` in the schema (see #5).
- Add social proof as soon as it exists: customer logos, 2–3 short case studies, and G2/Capterra listings.
- Expand `/integrations` with one section per integration (what syncs, how to connect it), and `/security` with data location (AWS region), backups and a contact for security reports.
- Aim for 2–4 posts a month, built around the product pages (see P3).

---

## 🟡 P2 — On-page polish

### 8. Titles over ~60 characters (truncated in SERPs)
| Page | Length | Suggestion |
|---|---|---|
| /product/chat | 76 | "Team Chat & Video Meetings \| Rhinon Tech" |
| /product/hr | 75 | "HR Software: Onboarding, Offer Letters & E-Sign \| Rhinon Tech" |
| /product/attendance | 75 | "Attendance & Leave Management \| Rhinon Tech" |
| /product/chatbot | 69 | "AI Website Chatbot Trained on Your Content \| Rhinon Tech" |
| /blog/add-ai-chatbot-to-website | 69 | "Add an AI Chatbot to Your Website in 10 Minutes" (drop "\| Guide") |
| /blog/self-running-employee-onboarding-checklist-india | 68 | "Employee Onboarding Checklist for India \| Rhinon Tech" |
| /product/outreach | 67 | "AI Cold Email Outreach Software \| Rhinon Tech" |
| /product/work | 66 | "Project Management with a Client Portal \| Rhinon Tech" |
| /product/payroll | 65 | "Payroll Software for India \| Rhinon Tech" |
| /blog/crm-inbox-shared-inbox-for-sales-and-support | 64 | See below |

**Duplicated suffix:** that last post's title renders as *"A Shared Inbox for Sales and Support | Rhinon Tech | Rhinon Tech"*. Its CMS `metaTitle` already ends in "| Rhinon Tech", and the layout's `%s | Rhinon Tech` template adds it again. Remove the suffix in the CMS, and in `generateMetadata` strip a trailing `| Rhinon Tech` before returning the title, so it can't recur.

The current product titles lead with the module's internal name ("Work:", "Pages:", "Inbox:"). Leading with the search term people actually use ("Project management…", "Payroll software…") gets you more relevance for the same length.

### 9. Meta descriptions
- **Over ~155 characters:** `/blog/add-ai-chatbot-to-website` (165), `/product/attendance` (159), `/blog/self-running-employee-onboarding-checklist-india` (159), `/product/chat` (154, borderline).
- Most descriptions never say "free" or name the category ("CRM software", "payroll software"), even though "free for your whole team" is the main differentiator. The homepage and `/pricing` are the exceptions. Work it into the product page descriptions, e.g. *"Free CRM for your whole team: import leads, capture them from your site and track every deal."*

### 10. Image alt text
- **Blog cover images** (`<Cover>` in `components/blog/parts.tsx`) render with `alt=""` everywhere: the post header, "Keep reading" cards and the `/blog` index (6 of 8 images on `/blog`). Use the post title (or a CMS `coverAlt` field) as the alt. These are the images most likely to rank in Google Images.
- The mascot (`/brand/mascot.webp`) and logo marks have empty alt. That's fine if they're decorative, but the navbar logo link then has no accessible name. Use `alt="Rhinon Tech"` on the logo image inside the home link.

### 11. 404 page metadata
Unknown URLs correctly return **404** with a branded page, a single `<title>` and `noindex`. However, the title and description fall back to the homepage's ("Rhinon Tech | Run your whole company from one workspace").

**Fix:** add `export const metadata = { title: "Page not found", robots: { index: false, follow: true } }` to `app/not-found.tsx`. Also add a link to `/blog` and `/pricing` next to the existing "Back to home" and "See products" buttons.

### 12. Missing `llms.txt`
`/llms.txt` returns 404. It is optional, but cheap: add `public/llms.txt` with a two-line description of Rhinon Tech ("free all-in-one workspace: CRM, outreach, shared inbox, projects, HR, payroll…") and links to `/product`, each product page, `/pricing`, `/security` and the blog. rhinonlabs.com already has one.

---

## 🟡 P2 — Performance (needs measurement)

| Page | TTFB | Cache | Region |
|---|---|---|---|
| `/` (static) | 0.23–0.42 s | HIT | `bom1` |
| Product and other static pages | 0.47–0.73 s | HIT | `bom1` |
| `/blog`, `/blog/*` (ISR) | 0.51–0.58 s | HIT / STALE | `bom1::iad1` |

The static pages are fine. Blog revalidations run in **Washington DC (`iad1`)** and then call the backend in India (`api.rhinontech.in`). Visitors are still served from cache, so this mostly affects how quickly new content appears and how long the backend calls take during a revalidation.

- Set the Vercel function region to `bom1` (project settings, or `"regions": ["bom1"]` in `vercel.json`), as recommended for uppercurve.in.
- The pages are heavy: the homepage HTML is **271 KB** with 65 `<script>` tags, and product pages are 107–157 KB, mostly inlined React Server Components data for the animated mocks (`ProductMocks`, `HeroWorkspace`, `Orbit`). Check that the below-the-fold mocks load lazily, and keep an eye on INP on mobile.
- The site loads 3 font families (Geist, Geist Mono, Dancing Script), and the homepage preloads all three. Dancing Script is only used for the e-signature demo, so load it only on `/product/hr` (and wherever else the signature mock appears).
- **To do:** get real CWV data (see the GSC section below).

---

## 🟢 P3 — Growth opportunities

1. **One page per buying intent.** The product pages are named after modules. Add (or retitle into) pages for the searches people actually run in India:
   - "free CRM for small business India"
   - "payroll software India" and "salary slip generator"
   - "HR software for startups"
   - "attendance app for employees"
   - "AI chatbot for website"
   - "cold email software"
   Each should get an H1, title and FAQ set built around that phrase.
2. **Comparison and alternative pages,** e.g. "Rhinon Tech vs Zoho One", "HubSpot CRM alternative (free)", "Keka / greytHR alternative for small teams", "Zoho Desk vs shared inbox". These are high-intent pages, and "all-in-one and free" is a strong angle.
3. **Free tools as link magnets,** e.g. a salary/CTC calculator, a payslip template, an offer letter generator, and a cold email subject line checker. Each can link to the matching product page.
4. **Blog clusters linked to each product page.** The 4 posts already link to their products. Make it two-way: add a "Guides" block on each product page listing related posts.
5. **Off-page signals.**
   - List the product on G2, Capterra, Product Hunt, SaaSworthy and Indian SaaS directories.
   - Create a Google Business Profile.
   - Get links from the sister sites. Neither rhinonlabs.com's nor uppercurve.in's homepage links to rhinontech.com today, although this site's footer links to rhinonlabs.com. Add a "Our product: Rhinon Tech" link to both footers, and mention Rhinon Tech on rhinonlabs.com's CRM and automation service pages.
   - Add social profile links to the footer, and the same URLs to `Organization.sameAs`.
6. **The dashboard domain (`rhinontech.in`)** returns a **307 (temporary)** redirect from the apex to `www.rhinontech.in`. Make it a 308. Also confirm in GSC that no `rhinontech.in` app pages are indexed, and add `noindex` to its auth pages if any are, so they don't compete with the marketing site for the brand name.
7. **Security headers** (not a ranking factor, but this site sells on security): only HSTS is set, without `includeSubDomains` or `preload`. Add `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` / CSP `frame-ancestors` and `Permissions-Policy` through `headers()` in `next.config.ts`. `poweredByHeader: false` is already set.

---

## ✅ Already done well
- HTTPS + HSTS, and all host and protocol variants end on `https://www.rhinontech.com` with permanent (308) redirects
- `robots.txt` allows everything and lists the sitemap (fix the host, #1). The sitemap covers every public page and pulls blog posts from the CMS.
- Every page has a unique title, a meta description, a self-referencing canonical tag (wrong host, #1) and `summary_large_image`
- Server-rendered content on every page, and static pages are cached in `bom1` with ~0.2–0.7s TTFB
- A branded `not-found.tsx` returns a real 404 with `noindex` and a single `<title>`
- `FAQPage` schema on `/ai`, `/pricing`, every product page and every blog post, matching visible FAQ text
- Blog posts have `Article` schema, cover OG images, author and date, a table of contents, related posts, and in-body links to the matching product pages
- `metadataBase`, a generated 1200×630 `opengraph-image`, `poweredByHeader: false`, and `Organization` schema with `parentOrganization` → Rhinon Labs

---

## What I need from Google Search Console

If the property isn't set up yet, verify `rhinontech.com` as a **Domain property** (DNS TXT record), so `www`, the apex and `http` all appear in one report. Then export:

1. **Indexing → Pages:** how many pages are indexed, and the URL lists for each "Why pages aren't indexed" reason. Look especially for *Page with redirect* and *Alternate page with proper canonical tag* (caused by #1), and *Discovered – currently not indexed*.
2. **Performance → Search results** (maximum date range): the **Queries** and **Pages** tabs, plus Countries and Devices. I especially want to see how much traffic is brand-only ("rhinon", "rhinon tech").
3. **Sitemaps:** the status of `sitemap.xml`. Resubmit it as `https://www.rhinontech.com/sitemap.xml` once #1 ships.
4. **Experience → Core Web Vitals** (mobile and desktop).
5. **Links:** Top linking sites and Top linked pages (external and internal).
6. **URL Inspection** for `/`, `/pricing`, `/product/crm` and one blog post: indexed? User-declared vs **Google-selected canonical** (this confirms how #1 is being resolved)? Last crawl date?
7. **Security & Manual actions:** confirm that both are clean.

Optional:
- The same Domain property export for `rhinontech.in`, to check that no dashboard pages are indexed (P3 #6)
- GA4 or Rhinon Analytics landing-page report (organic sessions plus sign-ups and demo bookings per page)
- A PageSpeed Insights API key, so I can run lab CWV for every URL
- Target keyword list and the main competitors you lose deals to (Zoho One, HubSpot, Keka…?), to prioritise the P3 pages
