# SEO Audit — uppercurve.in

**Date:** 9 Nov 2026
**Scope:** All 28 URLs found by crawling from the homepage (there is no sitemap), plus robots.txt, redirects, the 404 page, structured data, and the site source (`uppercurve/`).
**Source note:** Production currently matches `origin/beta`. `origin/main` has one undeployed SEO commit (`3733bfc`, 6 Nov, new titles and descriptions for `/blog`, `/community`, `/events`, `/jobs` and the course). Where that commit already fixes something, it says so below.
**Method:** Crawled the live HTML with a Googlebot user agent and cross-checked against the source. Core Web Vitals were **not** measured because the PageSpeed API quota was exhausted (see "What I need from GSC"). TTFB was measured by hand.

---

## Summary

The content is rendered on the server, every page has a unique title and exactly one H1, blog posts and events carry OG images, and the guest-only event pages (`/registered`, `/feedback`) are correctly `noindex`.

The technical SEO foundation is missing:

1. **No `robots.txt`, no `sitemap.xml`, no `llms.txt`.** All three return 404.
2. **No canonical tag on any page**, while three sets of URLs serve duplicate content (`/blogs` ↔ `/blog`, `/job` ↔ `/jobs`, `/courses` → 307).
3. **No structured data on any page.** There's no Organization, Course, Event, BlogPosting, FAQPage or BreadcrumbList schema. Events and the course are the biggest missed rich-result opportunities.
4. **The 12 job pages are hard-coded `DUMMY_JOBS`** naming real companies (Visa, CRED, Razorpay, Swiggy…) with a static "Posted 1 month ago". This is a trust and quality risk if Google indexes them.
5. **No About, Privacy Policy or Terms page.** The footer links for Privacy, Terms and socials are `href="#"`. For a paid course this is an E-E-A-T and payment-compliance gap.
6. **No OG image on the homepage, `/courses`, `/community`, `/jobs` or `/events`.** Links shared on WhatsApp and LinkedIn (the site's main channels) show no preview image.
7. **Dynamic pages run in the US (`iad1`)**, which gives about 1s TTFB from India.

---

## 🔴 P0 — Fix this week

### 1. Add `robots.txt` and `sitemap.xml`
`/robots.txt`, `/sitemap.xml` and `/llms.txt` all return **404**. Google can only discover pages through links, has no `lastmod` signal for new blog posts and events, and you can't submit a sitemap in GSC.

**Fix:**
- Add `uppercurve/app/robots.ts`: allow `/`, disallow `/api`, `/events/*/registered`, `/events/*/feedback` and `/certificates/`, and point to `https://www.uppercurve.in/sitemap.xml`.
- Add `uppercurve/app/sitemap.ts` with:
  - static pages: `/`, `/courses/agentic-ai-launchpad`, `/events`, `/blog`, `/community` (and `/jobs` only once the listings are real, see #4)
  - each blog post from `getBlogs()`, with `lastModified` = the post's `updatedAt` (add it to `ApiBlog` if the API doesn't return it yet)
  - each public event from `getPublishedEvents()`, with its `updatedAt`
  - real, hard-coded dates for static pages, not `new Date()`. Leave out `changeFrequency` and `priority`, because Google ignores both.
- If either API call fails, throw instead of returning a partial sitemap (see #3).
- Submit the sitemap in GSC.
- Optional: add `public/llms.txt` with a short description of UpperCurve and links to the course, events and blog.

### 2. No canonical tags, and duplicate URLs serve 200
No page has `<link rel="canonical">`, and `metadataBase` isn't set. Meanwhile:

| Duplicate | Current behaviour | Should be |
|---|---|---|
| `/blogs`, `/blogs/:slug` | **Rewrite**: serves the same page with 200 | 308 redirect to `/blog…` |
| `/job`, `/job/:id` | **Rewrite**: serves the same page with 200 | 308 redirect to `/jobs…` |
| `/courses` | **307 (temporary)** to `/courses/agentic-ai-launchpad` | 308, or a real listing page |

The navbar, footer and homepage all link to `/courses`, so every internal course link goes through a temporary redirect.

**Fix:**
- In `uppercurve/app/layout.tsx`, set `metadataBase: new URL("https://www.uppercurve.in")`. In each page's metadata, set `alternates: { canonical: "/<path>" }`.
- In `next.config.ts`, change the four `rewrites()` entries to `redirects()` with `permanent: true`.
- Point the nav and footer "Courses" links straight to `/courses/agentic-ai-launchpad`, and use `permanentRedirect()` in `app/courses/page.tsx` until a second course exists.

### 3. API failures silently become 404s and empty pages
In `services/api.ts` and `services/eventService.ts`, every fetch returns `null` or `[]` on **any** error (timeout, 5xx, network):
- `blog/[slug]` and `events/[slug]` call `notFound()`, so a backend blip serves real 404s for real articles and events. Google treats 404 as "gone".
- `/blog`, `/events` and the homepage render with no posts or events and return 200, which looks like a thin page.

**Fix:** Only return `null` when the API returns 404. On other errors, throw so Next serves a 5xx, which Google retries. Do the same in the new sitemap.

### 4. Job pages are placeholder data
`/jobs` and `/jobs/job-1` … `/jobs/job-12` come from `DUMMY_JOBS` in `components/Pages/Jobs/jobData.ts`. They name real employers with a static "Posted 1 month ago", and "Apply" links go to generic careers pages. Each page has 180–340 words and no H2s on the listing page. The URLs (`job-1`) carry no keywords.

Indexed as they are, these pages are thin, and they could mislead users and harm site-wide quality signals. You must **not** add `JobPosting` schema to them: Google's policy requires real, current openings and penalises expired or fake ones.

**Fix (pick one):**
- **Short term:** add `robots: { index: false, follow: true }` to `/jobs` and `/jobs/[id]` until the listings are real.
- **Long term:** move jobs into the CMS with real, dated postings, descriptive slugs (`/jobs/technical-product-manager-razorpay-bengaluru`), `validThrough`, a removal flow for expired roles, and `JobPosting` schema.

Also note: commit `3733bfc` on `main` retitles `/jobs` to "Product Jobs in India" but comments out the PRODUCT filter in `JobsExplorer.tsx`, so the page title and page content disagree.

---

## 🟠 P1 — Fix this month

### 5. Add structured data
No page has any JSON-LD. Recommended, in order of value:

| Page | Schema | Why |
|---|---|---|
| `/events/[slug]` | **`Event`** (`name`, `startDate`, `endDate`, `eventAttendanceMode`, `location` / `VirtualLocation`, `organizer`, `offers` with `price: 0`, `image`) | Eligible for Google's event listings. This is the single biggest SEO opportunity on the site. |
| `/courses/agentic-ai-launchpad` | **`Course`** + `hasCourseInstance` (`courseMode: "online"`, `courseSchedule`, `instructor`) + `offers` | Eligible for Course info rich results |
| `layout.tsx` (sitewide) | `Organization` (`name`, `logo`, `url`, `sameAs`, `parentOrganization` → Rhinon Tech) + `WebSite` | Brand entity and knowledge panel |
| `/blog/[slug]` | `BlogPosting` (`headline`, `image`, `datePublished`, `dateModified`, `author` with `url`) + `BreadcrumbList` | Article understanding and author E-E-A-T |
| Blog posts, course and events with FAQs | `FAQPage` | No SERP rich result (Google limits these to gov/health sites since 2023), but it helps AI answer engines. Keep the schema text identical to the visible FAQ text. |
| `/blog`, `/events` | `CollectionPage` + `ItemList` | Helps Google understand the listing pages |

Render it as a single `@graph` with `@id`s, as is done on rhinonlabs.com.

### 6. Missing trust and legal pages (E-E-A-T)
- `/about`, `/contact`, `/privacy`, `/privacy-policy` and `/terms` all return 404.
- In `components/Footer/Footer.tsx`, the "Privacy Policy" and "Terms" links and the social icons all use `href="#"`. A visible footer link labelled **"404"** also points to `#`.
- The site sells a paid cohort and collects registrations (name, email). A privacy policy and terms are expected by Google and by payment gateways and ad platforms.
- The homepage instructor section (`InstructorSection.tsx`) and the footer "students" avatars use **Unsplash stock photos** (`alt="Instructor graphic"`, `alt="std"`). On a course page, stock faces presented as mentors or students are a trust risk.

**Fix:**
- Publish `/privacy-policy`, `/terms` and `/about` (founders and mentors with real photos and LinkedIn links, the relationship with Rhinon Tech, location), and wire up the footer links.
- Replace `https://linkedin.com` and `https://chat.whatsapp.com` in the footer and on `/jobs` with the real profile and invite URLs, and remove the "404" footer link.
- Swap the stock photos for real mentor and cohort photos, or remove them.
- Add mentor pages (or an `/about#mentors` section) and link blog bylines and event speakers to them.

### 7. Missing OG images on core pages
The homepage, `/courses/agentic-ai-launchpad`, `/community`, `/jobs` and `/events` have no `og:image`, and the homepage, course and community pages use `twitter:card=summary`. Growth runs through WhatsApp groups and LinkedIn, so these links show no preview image when shared.

**Fix:**
- Add a default 1200×630 `opengraph-image` at `app/opengraph-image.png`.
- Add page-specific images for the course and `/events`, at minimum. Next's `opengraph-image.tsx` can generate them.
- Set `twitter: { card: "summary_large_image" }` in the root layout.
- Set `openGraph.url`, `siteName: "UpperCurve"` and `locale: "en_IN"`.

### 8. Server response time: dynamic pages run in the US
The homepage, `/blog`, `/events` and every blog and event detail page use `force-dynamic` + `cache: "no-store"`. The response headers show `X-Vercel-Id: bom1::iad1::…`, so the request enters Mumbai, renders in **Washington DC (iad1)**, then calls the backend (in India).

| Page | TTFB | Cache |
|---|---|---|
| `/` | 0.95–1.3 s | MISS, `no-store` |
| `/blog` | 1.1 s | MISS, `no-store` |
| `/events` | 0.9 s | MISS, `no-store` |
| `/courses/agentic-ai-launchpad` (static) | 0.38 s | HIT |

**Fix:**
- Set the Vercel function region to `bom1` (project settings, or `"regions": ["bom1"]` in `vercel.json`).
- Replace `no-store` with ISR, e.g. `next: { revalidate: 300 }` for blogs and `60` for events. Use on-demand `revalidatePath` from the CMS on publish if you need instant updates.
- These pages then serve from cache with ~0.3s TTFB and stay correct.

### 9. Internal linking: blog → course and events
Blog posts link only to the nav, other blog posts and "Summarize with ChatGPT/Claude/Google" buttons. No post links to the course or a relevant event in its body. The `/courses` and `/community` pages link to no blog posts or events.

| Post | Should link to |
|---|---|
| agentic-ai-in-education-explained | `/courses/agentic-ai-launchpad`, `/events/ai-teaching-assistant-micro-certificate` |
| agentic-workflow-assignment-feedback | `/courses/agentic-ai-launchpad`, `/events/genai-course-design-micro-certificate` |
| from-tutor-bot-to-learning-agent | `/events/ai-teaching-assistant-micro-certificate`, `/events/prompt-engineering-for-educators` |
| edtech-careers-when-agents-do-the-busywork | `/courses/agentic-ai-launchpad` (the "roles hiring now" section), `/community` |

**Fix:**
- Add 1–2 contextual links per post with descriptive anchor text, plus an end-of-post CTA block linking to the course.
- Add "Related reading" links from the course and event pages back to the blog.
- Link `/edtech-careers-…` from the homepage; it's the only post the homepage doesn't link to.

### 10. Homepage and site positioning
| Element | Current |
|---|---|
| `<title>` | UpperCurve \| Learn AI by Building It |
| Meta description | Join the 6-Weeks live Agentic AI Launchpad… |
| H1 | Move beyond your Learning Curve. |
| Root layout fallback (404 and any page without its own title) | "UpperCurve — Move Beyond Your Learning Curve" / "…a career growth platform…" |

The H1 has no keyword, and the fallback description describes a different product ("career growth platform"). Content is also split between **builders and engineers** (the course) and **educators** (all 5 events and 3 of 4 blog posts are about AI in teaching).

**Fix:**
- Make the H1 carry the main keyword, e.g. *"Learn Agentic AI by Building It — Live, With Mentors"*.
- Update the root layout's default description to match.
- Decide whether educators are a second audience. If so, give them their own hub page (e.g. `/for-educators`) instead of mixing them into the builder-focused homepage.
- Weak H1s elsewhere: `/community` → "Staying Ahead", `/jobs` → "Curated Jobs", `/blog` → "Notes from the UpperCurve". Each should say what the page is.

---

## 🟡 P2 — On-page polish

### 11. Titles over ~60 characters (truncated in SERPs)
| Page | Length | Suggestion |
|---|---|---|
| /events/ai-teaching-assistant-micro-certificate | 72 | "AI Teaching Assistant Micro-Certificate \| UpperCurve" |
| /events/genai-course-design-micro-certificate | 70 | "GenAI Course Design Micro-Certificate \| UpperCurve" |
| /community (live) | 69 | Fixed on `main`: "Free AI Community on WhatsApp \| UpperCurve Community" (52) |
| /blog (on `main`, not yet live) | 67 | "AI Guides & Insights for Builders \| UpperCurve" |
| /events/ai-classroom-community-meetup | 65 | "The AI Classroom: Educators' Meetup \| UpperCurve" |
| /blog/agentic-workflow-assignment-feedback | 63 | "Build an Agentic Feedback Workflow for Your Course" |

Shorten the event template in `app/events/[slug]/page.tsx` from `— UpperCurve Events` to `| UpperCurve`. Use one separator site-wide; today the site mixes `|` and `—`.

### 12. Meta descriptions
- **Too long:** all 12 job pages (211–231 characters, cut mid-word with "..."), `/blog/agentic-workflow-assignment-feedback` (172), `/blog/from-tutor-bot-to-learning-agent` (164), `/community` (162).
- **Too short:** event pages use the subtitle only (84–98 characters) and miss the date, format and "free certificate". Build event descriptions from a template, e.g. *"Free live workshop on {date}, online. {subtitle} Earn a certificate."*
- Fix the grammar in the live course description: "6-Weeks", "with a Mentor Guidance".

### 13. Image alt text
- **Homepage:** 16 of 28 images have empty `alt`. These are the event banner images and speaker avatars in the events section.
- **Event pages:** 5–9 of 13–19 images have empty `alt` (same components, plus the logo).
- **Logo:** `uppercurve_logo_nav.png` renders with an empty `alt` in some places. Use `alt="UpperCurve"`.
- **Footer:** `alt="std"` avatars. Make them decorative (`alt=""`) or remove them (see #6).

Use the event title for banner images and the speaker's name for avatars.

### 14. Blog depth
The posts run 790–890 words. They are well structured (H2 sections, FAQs, related posts), but they are short for competitive topics like "agentic AI". Expand the strongest posts to 1,500+ words with examples, screenshots and code, and publish more than 4 posts: the blog currently has too little content to build topical authority.

### 15. Certificate pages
Valid `/certificates/[id]` pages are indexable and contain the attendee's full name. Invalid IDs return **200** with `noindex` (a soft 404).

**Fix:**
- Set `robots: { index: false }` on all certificate pages. They're for verification links, not search.
- Return a real 404 for invalid IDs, via `notFound()` with the same friendly UI in a `not-found.tsx`.

### 16. 404 page
Unknown URLs correctly return 404 + `noindex`, but the page has **two `<title>` tags** ("404: This page could not be found." and the root title). There is no `app/not-found.tsx`.

**Fix:** Add a branded `not-found.tsx` with its own `title: "Page not found"` and links to the course, events and blog.

---

## 🟡 P2 — Performance (needs measurement)

- HTML is lighter than rhinonlabs.com: homepage 218 KB, `/courses` 190 KB, `/events` 193 KB, other pages 30–60 KB. The homepage loads 42 script tags.
- The site loads **five Google font families** (Geist, Geist Mono, Montserrat, Plus Jakarta Sans, Poppins with 7 weights). That's a lot of font preloads. Cut to two families and the weights actually used.
- The homepage preloads three tiny Unsplash avatar images (from the footer) at high priority, which competes with the hero.
- Most imagery is hot-linked from `images.unsplash.com` through `next/image`. Move it to your own S3 bucket or `public/`, so you control availability and can use real photos (see #6).

**To do:**
- Fix the function region and caching (#8). That's the biggest win.
- Get real CWV data (see the GSC section below).
- Check that the hero LCP image has `priority` and is not lazy-loaded.

---

## 🟢 P3 — Growth opportunities

1. **Event pages as a search channel.** With `Event` schema, a sitemap and ISR, every free workshop can rank for "free AI workshop Bengaluru", "AI certificate course free online" and similar queries. Keep past event pages live (marked as past, with a link to upcoming ones) instead of removing them, so they keep their links.
2. **Commercial-intent pages for the course:**
   - "agentic AI course India"
   - "AI agent course with certificate"
   - "n8n / LangGraph / CrewAI course"
   - "AI engineering bootcamp Bengaluru"
   Add a curriculum or syllabus section with these terms, and consider one landing page per tool track.
3. **Comparison content**, e.g. "UpperCurve vs self-paced courses", "n8n vs Make vs LangGraph for beginners", "Best agentic AI courses in India 2026".
4. **Off-page signals.** Create a Google Business Profile (you run in-person events in Bengaluru), list events on Meetup, Luma and Eventbrite with backlinks, and get cross-links from rhinonlabs.com. The footer already links to rhinonlabs.com; make it reciprocal with a dofollow link back.
5. **Certificates as backlinks.** The "Add to LinkedIn" button already exists, but it doesn't pass `certUrl`. Add `certUrl: https://www.uppercurve.in/certificates/<id>` to the LinkedIn params in `app/certificates/[id]/page.tsx`, so each certificate on a LinkedIn profile links back to the site.
6. **Security headers** (not a ranking factor, but good hygiene): add `X-Content-Type-Options`, `Referrer-Policy` and `X-Frame-Options`/CSP through `headers()` in `next.config.ts`, and remove `X-Powered-By` with `poweredByHeader: false`.

---

## ✅ Already done well
- HTTPS + HSTS. `http://`, the bare domain and trailing-slash URLs all 308 to `https://www.uppercurve.in/...` (2 hops for `http://uppercurve.in`, but both permanent)
- Every page has a unique title and exactly one H1
- Server-rendered content on all pages, including events (rendered on the server for crawlers, as noted in the source)
- Blog posts have cover OG images, `summary_large_image`, author, dates, H2 structure, FAQs and related posts
- Event pages have banner OG images, agenda, speaker, FAQ and "more events" links
- `/events/*/registered` and `/events/*/feedback` are correctly `noindex, nofollow`
- Unknown URLs return a real 404 status with `noindex`
- `main` already has improved titles and descriptions for `/blog`, `/community`, `/events`, `/jobs` and the course. **Deploy it.**

---

## What I need from Google Search Console

If the property isn't set up yet, verify `uppercurve.in` as a **Domain property** (DNS TXT record) first. Then export:

1. **Indexing → Pages:** how many pages are indexed, and the URL lists for each "Why pages aren't indexed" reason. With no sitemap and no canonicals, look especially for *Discovered – currently not indexed*, *Duplicate without user-selected canonical* (`/blogs` vs `/blog`), and *Page with redirect*.
2. **Performance → Search results** (maximum date range): the **Queries** and **Pages** tabs, plus Countries and Devices.
3. **Sitemaps:** submit `https://www.uppercurve.in/sitemap.xml` once #1 ships, and share its status a few days later.
4. **Experience → Core Web Vitals** (mobile and desktop).
5. **Links:** Top linking sites and Top linked pages (external and internal).
6. **URL Inspection** for `/`, `/courses/agentic-ai-launchpad`, one blog post and one event: indexed? Which Google-selected canonical? Last crawl date?
7. **Security & Manual actions:** confirm that both are clean.

Optional:
- GA4 landing-page report (organic sessions plus registrations and enrolments per page)
- A PageSpeed Insights API key, so I can run lab CWV for every URL
- Target keyword list, main competitors, and whether educators are an intended audience (see #10)
