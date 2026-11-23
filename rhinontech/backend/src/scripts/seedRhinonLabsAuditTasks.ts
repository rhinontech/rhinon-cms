/**
 * One-time script: turns every issue in docs/RHINON_LABS_AUDIT.md (2026-11-23)
 * into tasks + subitems (child Tasks) in the Work project "Rhinon Labs".
 *
 * - Source of truth is the audit file only. Nothing is added that isn't in it.
 * - All tasks are unassigned. Priority comes from severity
 *   (Critical/High → High, Medium → Medium, Low → Low).
 * - Plan phase goes into the description; every task is due 2026-11-30 (month end).
 * - Idempotent: a task is matched on project + parent + title and skipped if it exists.
 * - Mirrors POST /tasks: project default status, legacy status, and the
 *   "created" / "subitem_added" activity entries.
 *
 * Run from rhinontech/backend:
 *   npx ts-node --transpile-only src/scripts/seedRhinonLabsAuditTasks.ts          # dry run
 *   npx ts-node --transpile-only src/scripts/seedRhinonLabsAuditTasks.ts --apply  # write
 */

import { Project, Task, TaskActivity, User } from "../models";
import { sequelize } from "../config/database";
import { runAsSystem, runForOrg } from "../services/tenantContext";
import { defaultStatusFor, legacyStatusFor } from "../services/taskStatus";

type Priority = "High" | "Medium" | "Low";

interface Sub {
  title: string;
  /** Plain explanation of what to do and why. */
  body: string;
  priority?: Priority;
}

interface Issue {
  ref: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  area: string;
  effort: string;
  owner: string;
  phase: string;
  what: string;
  evidence: string[];
  why?: string;
  impact?: string;
  validate?: string;
  note?: string;
  subs: Sub[];
}

const APPLY = process.argv.includes("--apply");
const PROJECT_NAME = "Rhinon Labs";
const CREATOR_EMAIL = "prabhat@rhinontech.in";
const SOURCE = "docs/RHINON_LABS_AUDIT.md";

const W1 = "Week 1 — stop the leaks";
const W2 = "Weeks 2–4 — trust and structure";
const W5 = "Weeks 5–8 — proof and demand capture";
const W9 = "Weeks 9–12 — authority and scale";
const DUE_DATE = "2026-11-30"; // end of the month the audit was written, per the user
const NOPLAN = "Not scheduled in the 90-day plan (Medium severity: fix within 60–90 days)";

// ─────────────────────────────────────────────────────────────────────────────
// Issues, in report order
// ─────────────────────────────────────────────────────────────────────────────

const ISSUES: Issue[] = [
  // ── Critical ──────────────────────────────────────────────────────────────
  {
    ref: "C-01",
    title: "Discovery-call form requires EdTech answers",
    severity: "Critical",
    area: "Conversion",
    effort: "2–4 h",
    owner: "Dev",
    phase: W1,
    what:
      "The booking form behind every \"Book a call\" button asks EdTech questions (Institution Type, Annual Lead Volume) that founders, SMB owners and construction firms cannot answer truthfully. Replace them with questions about what the prospect wants to build, and make the form easy to complete.",
    evidence: [
      "`rhinonlabs/components/Common/CTA/SchedulerCore.tsx:580–605`: required \"Institution Type\" with only education options (Higher Education, Coaching & Training Institute, Consultants, EdTech, K-12 School, Preschool & Playschool, Online Degree).",
      "`SchedulerCore.tsx:607–629`: required \"Annual Lead Volume\" (Under 10k, 10k–50k, 50k–100k, Above 100k).",
      "`SchedulerCore.tsx:564–578`: \"Organization Website\" is required and is a `type=\"url\"` input that rejects addresses without `https://`.",
      "The form is behind every primary CTA: header, hero, homepage services, ElevateCTA, the sticky call button on every blog post, the case-studies page and `/schedule-call`.",
    ],
    why:
      "Prospects either abandon or pick a random option. Every channel (SEO, LinkedIn, outbound, referrals) converts through this form, so it caps lead volume regardless of traffic, and the answers collected are useless for qualifying leads.",
    impact: "The highest-leverage fix in the report: more booked calls from the traffic that already arrives.",
    validate: "Book a test call end to end. Once GA4 events are live (H-08), track form opened → call booked weekly.",
    subs: [
      {
        title: "Replace \"Institution Type\" with \"What do you want to build?\"",
        body:
          "In `SchedulerCore.tsx:580–605`, swap the EdTech dropdown for a \"What do you want to build?\" field with options: MVP, AI agent, Workflow automation, Internal dashboard, Website, Mobile app, Not sure yet. This gives every visitor a truthful answer and tells sales what the lead actually needs.",
      },
      {
        title: "Replace \"Annual Lead Volume\" with optional \"Budget range\" and \"Ideal start date\"",
        body:
          "Remove the required lead-volume field (`SchedulerCore.tsx:607–629`) and add two optional fields: Budget range and Ideal start date. These qualify the lead for a services business; lead volume does not.",
      },
      {
        title: "Make \"Website\" optional and accept it without https://",
        body:
          "First-time founders often have no website, and the current `type=\"url\"` input rejects \"example.com\". Make the field optional and accept a bare domain (normalise it on submit). Code: `SchedulerCore.tsx:564–578`.",
      },
      {
        title: "Link \"Terms\" and \"Privacy Policy\" in the booking form (L-05)",
        priority: "High",
        body:
          "Folded in from L-05 (Low, 15 min, Dev). The consent line \"By proceeding, you agree to Rhinon Labs' Terms and Privacy Policy\" shows both as plain text (`SchedulerCore.tsx:657–659`). Link both to `/privacy-terms` so the consent is real and the form looks trustworthy. Done as part of the C-01 form rework, so it carries C-01's priority.",
      },
      {
        title: "Update PlatformLeadPayload and the admin lead view for the new fields",
        body:
          "The form payload type is `PlatformLeadPayload` in `rhinonlabs/lib/api.ts:113–123`. Update it for the new fields (what to build, budget, start date, optional website) and make sure the admin lead view shows them, so sales sees the new answers.",
      },
      {
        title: "Validate: book a test call end to end",
        body:
          "After deploying, book a real test call from the homepage and from a blog post's sticky button. Confirm the lead lands in the admin with the new fields filled. Once H-08 events exist, review form opened → call booked weekly.",
      },
    ],
  },
  {
    ref: "C-02",
    title: "Four live posts render without their article body",
    severity: "Critical",
    area: "Content / technical",
    effort: "0.5–1 day",
    owner: "Dev",
    phase: W1,
    what:
      "Four published blog posts show only one short appended paragraph plus the FAQs. The full article still exists in the CMS but the site can't render it because of a data-shape bug. Repair the data, harden the renderer, and stop it happening again.",
    evidence: [
      "/blogs/how-long-does-it-take-to-build-an-mvp-india-guide: 32 words live vs 1,812 stored (shows \"9 min\").",
      "/blogs/mobile-app-development-cost-startups-india: 41 live vs 1,581 stored (\"8 min\").",
      "/blogs/freelancer-vs-agency-for-mvp-india-guide: 43 live vs 1,446 stored (\"7 min\").",
      "/blogs/ai-agent-security-for-businesses-india-2027: 47 live vs 1,409 stored (\"7 min\").",
      "Root cause: `contentBlocks` is an array whose first element is the original block list stored as a JSON string (encoded twice for the security post), followed by an appended link block (`mvp-cost-link-block2`, `furrcircle-link-block`, `mvp-cost-link-block`, `geo-link-block`). `normalizeBlog()` in `rhinonlabs/lib/api.ts:80–93` only unwraps when the whole field is a string, so element 0 is skipped. The script that appended the link blocks is not in the repo.",
      "Google indexed these pages while intact (its snippet for the freelancer post quotes \"expect to pay between ₹50,000 and ₹1.5 lakh\", no longer on the page). The next crawl will find a near-empty page.",
      "`/services/mvp-development` links only to the blank MVP timeline post; `/services/mobile-app-development` links only to the blank mobile cost post.",
    ],
    why:
      "Pages that lose their content get demoted or treated as soft 404s and drag down site-wide quality signals. Visitors arriving from service pages hit an empty article.",
    validate: "Each live page shows more than 1,000 words of body text. GSC URL Inspection shows the article.",
    subs: [
      {
        title: "Repair contentBlocks: how-long-does-it-take-to-build-an-mvp-india-guide",
        body:
          "Parse element 0 of `contentBlocks` repeatedly until it is an array, then save `[...parsedBlocks, linkBlock]` (keep the appended `mvp-cost-link-block2`/link block at the end). Confirm the live page shows ~1,800 words again.",
      },
      {
        title: "Repair contentBlocks: mobile-app-development-cost-startups-india",
        body:
          "Same repair: parse element 0 until it is an array and save `[...parsedBlocks, linkBlock]`. Confirm ~1,580 words render. This post is later merged into the 2027 mobile cost post (H-02), but it must be readable first.",
      },
      {
        title: "Repair contentBlocks: freelancer-vs-agency-for-mvp-india-guide",
        body:
          "Same repair: parse element 0 until it is an array and save `[...parsedBlocks, linkBlock]`. Confirm ~1,450 words render, including the ₹50,000–₹1.5 lakh section Google still quotes.",
      },
      {
        title: "Repair contentBlocks: ai-agent-security-for-businesses-india-2027 (double-encoded)",
        body:
          "This row's element 0 is JSON encoded twice, so it needs two parses before it becomes an array. Save `[...parsedBlocks, geo-link-block]` and confirm ~1,400 words render.",
      },
      {
        title: "Scan all blogs and case studies for other non-object contentBlocks elements",
        body:
          "Query every blog and case-study row for `contentBlocks` that contain a non-object element (e.g. a string). Repair any found the same way, so no other page is silently blank.",
      },
      {
        title: "Harden normalizeBlog() to flatten string elements inside the array",
        body:
          "In `rhinonlabs/lib/api.ts:80–93`, when an element of `contentBlocks` is a string, parse it until it becomes an object or array and flatten it in. One bad write should never blank a page again.",
      },
      {
        title: "Validate contentBlocks on write and fix the tool that appends link blocks",
        body:
          "Make the content API reject non-object blocks, and fix whatever appends internal-link blocks so it writes proper arrays instead of stringifying the existing list. The original append script isn't in the repo, so the API check is the safety net.",
      },
      {
        title: "Request re-indexing of the 4 repaired URLs in Google Search Console",
        body:
          "After the repair, use GSC URL Inspection → Request indexing for all 4 posts so Google recrawls the full article before it demotes the near-empty version. (H-09 points here rather than repeating this step.)",
      },
      {
        title: "After the repair, merge the mobile cost post into the stronger one (see H-02)",
        body:
          "Once readable, `mobile-app-development-cost-startups-india` is merged into `mobile-app-development-cost-india-2027` with a 301. The merge itself is tracked in H-02; this is the reminder that it follows this repair.",
      },
      {
        title: "Validate: each repaired post shows 1,000+ words and GSC sees the article",
        body:
          "Load each of the 4 URLs and confirm more than 1,000 words of body text. In GSC URL Inspection, the live test should show the full article.",
      },
    ],
  },
  {
    ref: "C-03",
    title: "/about redirects to a 404, and every author link points there",
    severity: "Critical",
    area: "Trust / technical",
    effort: "1–2 days",
    owner: "Dev + Founder",
    phase: `${W1} (first real version of /about)`,
    what:
      "The About page is unreachable: /about redirects to /_about, which Next.js never routes. Every blog post's author schema points to /about. Restore a real About page with real company and team content.",
    evidence: [
      "Verified 23 Nov 2026: `https://www.rhinonlabs.com/about` → 308 → `/_about` → 404.",
      "`rhinonlabs/next.config.ts:42–46` redirects /about to /_about; `rhinonlabs/app/_about/` is a private folder (folders starting with `_` are excluded from routing).",
      "BlogPosting schema on all 26 posts sets `author.url` to /about (`rhinonlabs/app/blogs/[slug]/page.tsx:153`).",
      "The navigation has no About link.",
    ],
    why:
      "About/Team is among the most-visited pages before a sales call; US buyers especially check who is behind a company. Google's quality guidelines look for who is responsible for a site, and an author URL that 404s breaks author entity signals on every post.",
    validate: "/about returns 200 with real content. Rich Results Test on any post shows a working author URL.",
    subs: [
      {
        title: "Rename app/_about to app/about and delete the /about → /_about redirect",
        body:
          "Move `rhinonlabs/app/_about` to `app/about` and remove the redirect in `next.config.ts:42–46`. This alone turns the 404 into a working route.",
      },
      {
        title: "About content: founder story and photo",
        body: "Write the founder story with a real photo. Buyers want to see the accountable person behind the company.",
      },
      {
        title: "About content: real team members only (keep placeholder Team component off)",
        body:
          "The Team component holds placeholder names (\"Ryan Smith\", \"Levi Smith\", \"Eren Smith\") and is commented out. Keep it off until it lists real people with real roles; fake names on an About page destroy trust.",
      },
      {
        title: "About content: company facts (legal entity, Hyderabad address, founding year)",
        body: "Add the legal entity name, Hyderabad address and founding year, so the page answers \"who is responsible for this site\".",
      },
      {
        title: "About content: explain how Rhinon Labs relates to Rhinon Tech",
        body:
          "Nothing on the site explains the relationship, and posts are bylined \"Founder @ Rhinon Tech\". State it clearly on About. H-06 also needs this; it is tracked here once.",
      },
      {
        title: "About content: process, values and LinkedIn links",
        body: "Describe how projects run (process), the company's values, and link the company and founder LinkedIn profiles.",
      },
      {
        title: "Add About to the header and footer navigation",
        body: "The navigation has no About link. Add it to both header and footer so visitors and crawlers can reach it.",
      },
      {
        title: "Point author.url to a real author page (see H-06)",
        body:
          "Update `author.url` in the BlogPosting schema (`app/blogs/[slug]/page.tsx:153`) to the real author page created in H-06 (or the founder section on About), so it no longer resolves to a 404.",
      },
      {
        title: "Validate: /about returns 200 and Rich Results Test shows a working author URL",
        body: "Fetch /about and confirm 200 with real content. Run Google's Rich Results Test on any post and confirm the author URL resolves.",
      },
    ],
  },
  {
    ref: "C-04",
    title: "Google does not recognise the brand name",
    severity: "Critical",
    area: "Brand / entity",
    effort: "Ongoing",
    owner: "Founder + Marketing",
    phase: W2,
    what:
      "Searching the company's own name returns other companies. Google rewrites \"rhinonlabs\" to \"Rhino Labs\". Build consistent entity profiles across the web so Google (and AI assistants) learn that Rhinon Labs is a distinct company.",
    evidence: [
      "Google India, 23 Nov 2026 — \"rhinon labs\": rhinonlabs.com not in the organic top 10; results show the \"Rhino Lab\" workout app, a Miami IT agency \"Rhinolabs\", and \"Ranyn Labs\". A knowledge panel for \"Rhinon Labs — Software company\" (the GBP) appears with \"Be the first to review\".",
      "\"rhinonlabs\": Google rewrites to \"Rhino Labs\"; AI Overview describes Rhino Labs Inc. (Santa Clara), Rhino Security Labs (Seattle) and a supplement store; knowledge panel is \"Rhino Labs — Laboratory in Norman, Oklahoma\". rhinonlabs.com does not appear.",
      "Organization schema `sameAs` lists only LinkedIn, X and Instagram; none appear in brand results. No Clutch, GoodFirms, Crunchbase or directory profiles found.",
    ],
    why:
      "Anyone who hears the name (LinkedIn post, outbound email, referral, event) and searches for it lands on other companies. This leaks leads from every channel, not just SEO, and stops AI assistants from describing the company.",
    validate: "Check brand results monthly. Target position 1 for \"rhinon labs\" and an appearance for \"rhinonlabs\". Watch branded impressions in GSC.",
    subs: [
      {
        title: "Entity profile: Google Business Profile (identical name, description, logo, URL, address)",
        body: "Use the identical name, description, logo, URL and address everywhere. Completing the GBP itself is tracked in H-11; this item ensures its details match the other profiles exactly.",
      },
      {
        title: "Entity profile: complete the LinkedIn company page",
        body: "Complete the LinkedIn company page with the identical name (\"Rhinon Labs\"), description, logo, URL and address.",
      },
      {
        title: "Entity profile: create Crunchbase profile",
        body: "Create a Crunchbase profile with the identical name, description, logo, URL and address. Crunchbase is a strong entity source for Google and AI assistants.",
      },
      {
        title: "Entity profile: create Clutch profile",
        body: "Create a Clutch profile with identical details. Clutch also counts as a link (C-05) and a review source AI assistants cite (H-10).",
      },
      {
        title: "Entity profile: create GoodFirms profile",
        body: "Create a GoodFirms profile with identical name, description, logo, URL and address.",
      },
      {
        title: "Entity profile: create DesignRush profile",
        body: "Create a DesignRush profile with identical name, description, logo, URL and address.",
      },
      {
        title: "Entity profile: create a GitHub organisation",
        body: "Create a GitHub organisation named Rhinon Labs with the same description, logo and URL.",
      },
      {
        title: "Entity profile: Product Hunt listing for the free tools",
        body: "List the free tools (onboarding checklist, CRM ROI calculator) on Product Hunt under the Rhinon Labs name with identical details.",
      },
      {
        title: "Add every profile URL to sameAs in rhinonlabs/lib/site.ts",
        body: "Add every profile created above to the Organization schema `sameAs` array in `rhinonlabs/lib/site.ts`, so Google can connect the profiles to the site.",
      },
      {
        title: "Founder and team list \"Rhinon Labs\" (linked) in LinkedIn headline and experience",
        body: "Have the founder and each team member list \"Rhinon Labs\", linked to the company page, in their LinkedIn headline and experience. People profiles reinforce the entity.",
      },
      {
        title: "Footer credit \"Designed & built by Rhinon Labs\" on SR Fitout (with permission)",
        body: "With client permission, add a \"Designed & built by Rhinon Labs\" footer credit linking to rhinonlabs.com on the SR Fitout site. It is both a brand signal and a genuine backlink (C-05).",
      },
      {
        title: "Footer credit \"Designed & built by Rhinon Labs\" on Apexis Pro (with permission)",
        body: "With client permission, add the footer credit linking to rhinonlabs.com on the Apexis Pro site.",
      },
      {
        title: "Footer credit \"Designed & built by Rhinon Labs\" on RichHarbor (with permission)",
        body: "With client permission, add the footer credit linking to rhinonlabs.com on the RichHarbor site.",
      },
      {
        title: "Footer credit \"Designed & built by Rhinon Labs\" on Al Rooha (with permission)",
        body: "With client permission, add the footer credit linking to rhinonlabs.com on the Al Rooha site.",
      },
      {
        title: "Stopgap: small branded Google Ads campaign on \"rhinon labs\" and \"rhinonlabs\"",
        body: "Run a small branded search campaign on both spellings so prospects who search the name find the site while organic brand ranking catches up.",
      },
      {
        title: "Write the name the same way everywhere: \"Rhinon Labs\", two words",
        body: "Audit the site, profiles, email signatures and decks so the name is always \"Rhinon Labs\" (two words). Inconsistent spelling feeds Google's \"Rhino Labs\" rewrite.",
      },
      {
        title: "Validate: monthly brand SERP check + branded impressions in GSC",
        body: "Each month, search \"rhinon labs\" and \"rhinonlabs\" in Google India. Target position 1 for \"rhinon labs\" and an appearance for \"rhinonlabs\". Track branded impressions in GSC.",
      },
    ],
  },
  {
    ref: "C-05",
    title: "No editorial backlinks; all 31 linking domains are spam",
    severity: "Critical",
    area: "Authority",
    effort: "Ongoing",
    owner: "Marketing",
    phase: `${W2} (first genuine links), then ${W9} (4–6 quality links a month, listicle pitches)`,
    what:
      "The site has no trustworthy backlinks; every linking domain is spam. Authority is the main constraint on rankings, so start building genuine links every month.",
    evidence: [
      "DataForSEO Backlinks, 23 Nov 2026: 33 backlinks from 31 referring domains (28 main domains). First link seen 6 Aug 2026. Backlink spam score 63/100.",
      "Every referring domain is unrelated or spam, e.g. betwinnermirror.com, thcradar.com, uncledspizza.com, homesforsaleoldgreenwichct.com, colonrejuvenatorsite.com, fashionclothingnews.com, merrigoldfinance.com, and link-selling SEO sites rank-seo-now.shop and seonix.agency. Individual spam scores 60–70.",
      "No links from clients, directories, media or partners.",
      "Benchmark: pages ranking in India average ~19 referring domains for \"ai agent development company\", ~47 for \"ai automation agency\", ~107 for \"mobile app development company india\".",
    ],
    why:
      "Content and on-page fixes will not rank commercial pages without trustworthy links. Google mostly ignores spam links, but if any were bought (the two SEO-package domains suggest it's possible), that risks a manual action.",
    validate: "Referring domains with spam score under 30 grow by 4–6 a month. Track monthly in DataForSEO or Ahrefs.",
    subs: [
      {
        title: "Confirm nobody bought a link package; cancel any such service",
        body: "Ask everyone who has worked on the site whether a link package was bought (rank-seo-now.shop and seonix.agency suggest it). Cancel any such service immediately.",
      },
      {
        title: "Disavow only if links were bought or GSC shows a manual action",
        body: "Mass disavow is not needed by default. If links were bought, disavow those domains in GSC. Otherwise check GSC's Manual actions report and leave the rest alone.",
      },
      {
        title: "Links: client footer credits (see C-04)",
        body: "The four client footer credits tracked in C-04 are also the first genuine links. Count them toward the 4–6/month target.",
      },
      {
        title: "Links: Clutch, GoodFirms and DesignRush profiles",
        body: "The directory profiles created in C-04 give links from trusted domains. Make sure each profile links to rhinonlabs.com.",
      },
      {
        title: "Links: founder guest articles in YourStory and Inc42 contributor programmes",
        body: "Pitch founder-written guest articles to Indian startup media (YourStory and Inc42 contributor programmes) with a link back to the site.",
      },
      {
        title: "Links: founder guest articles on automation and SaaS blogs",
        body: "Pitch guest articles to automation and SaaS blogs, using real project experience as the angle, each with a link back.",
      },
      {
        title: "Links: podcast guest spots",
        body: "Get the founder booked as a podcast guest; show notes usually link to the guest's site.",
      },
      {
        title: "Links: journalist-request platforms (Qwoted, Featured)",
        body: "Answer journalist requests on platforms such as Qwoted and Featured to earn media mentions and links.",
      },
      {
        title: "Links: partner directories (n8n, Make, Zapier experts; Supabase and Vercel showcases)",
        body: "Apply for n8n, Make and Zapier expert listings and submit projects to the Supabase and Vercel showcases. Each listing links to the agency.",
      },
      {
        title: "Links: use the free tools as link magnets",
        body: "Promote the free tools as resources others can link to. Tool-page content and promotion is tracked in M-05.",
      },
      {
        title: "Listicle inclusion: pitch hexagondigital.in \"top AI agencies in India\"",
        body: "Ask to be included in the hexagondigital.in listicle that already ranks for \"ai automation agency\". Listicles also feed Google's AI Overviews (H-10 points here).",
      },
      {
        title: "Listicle inclusion: pitch torpedoweb.org \"top AI agencies in India\"",
        body: "Ask to be included in the torpedoweb.org listicle that already ranks for the category.",
      },
      {
        title: "Listicle inclusion: pitch morismedia.in \"top AI agencies in India\"",
        body: "Ask to be included in the morismedia.in listicle that already ranks for the category.",
      },
      {
        title: "Validate: track quality referring domains (spam score < 30) monthly",
        body: "Each month, count referring domains with spam score under 30 in DataForSEO or Ahrefs. Target growth of 4–6 a month (12–18 in 90 days per the KPI table).",
      },
    ],
  },
  {
    ref: "C-06",
    title: "Claims exceed proof",
    severity: "Critical",
    area: "Trust / conversion",
    effort: "2–4 weeks",
    owner: "Founder + Content",
    phase: `${W1} (email clients for testimonials and reviews), then ${W5} (new case studies, testimonials live)`,
    what:
      "The site makes trust claims it can't back up: no testimonials, no reviews, an own product presented as a client, unverifiable statistics, and decorative stars. Collect real proof and remove or substantiate everything else.",
    evidence: [
      "Testimonials: none on the site. `rhinonlabs/Landing Page Changes.md` calls for a testimonials section; none is live.",
      "Google reviews: 0.",
      "Case studies: 3. FurrCircle is \"our own flagship product\", yet the grid is headed \"OUR CLIENTS — Real Results. Real Impact\" (`components/Pages/Home/CaseStudy/CaseStudies.tsx:40–45`).",
      "Logo strip includes \"Rhinon Tech — Admin dashboard\" (own platform). If \"Saleszium — AI SaaS\" is related, label it that way.",
      "Unverifiable: \"Trusted by 20+ startups and SMBs worldwide\" (`lib/site.ts:40`, llms.txt) vs \"across India\" in the hero; \"Most of our clients recover the cost by reclaiming 50+ hours weekly … within the 90 days\" (homepage FAQ); five-star row with no source and three avatars labelled \"Rhinon Labs client\" (`components/Pages/Home/Hero1/Hero.tsx:96–102`).",
      "\"Measurable Impact\" lists inputs (2–4 weeks, weekly releases, 30+ tools), not client outcomes.",
      "AI agents and workflow automation lead the homepage but have zero case studies (`relatedCaseStudies: []` in `lib/services.ts`).",
    ],
    why:
      "B2B buyers, especially US buyers paying agency rates, buy on proof. Unverifiable statistics and decorative stars cost trust when checked. If the avatars aren't real clients, they may breach advertising rules (US FTC rule on fake reviews/testimonials, ASCI guidelines in India).",
    validate: "Every claim on the site traces to a named source. 5 testimonials live. Google reviews reach 10 or more.",
    subs: [
      {
        title: "Testimonial request: SR Fitout (name, role, company, photo, written permission)",
        body: "Ask SR Fitout for an attributed testimonial with name, role, company, photo and written permission. Part of the target of at least 5 testimonials.",
      },
      {
        title: "Testimonial request: Apexis Pro (name, role, company, photo, written permission)",
        body: "Ask Apexis Pro for an attributed testimonial with name, role, company, photo and written permission.",
      },
      {
        title: "Testimonial request: RichHarbor (name, role, company, photo, written permission)",
        body: "Ask RichHarbor for an attributed testimonial with name, role, company, photo and written permission.",
      },
      {
        title: "Testimonial request: Al Rooha (name, role, company, photo, written permission)",
        body: "Ask Al Rooha for an attributed testimonial with name, role, company, photo and written permission.",
      },
      {
        title: "Show testimonials on homepage, service pages and case studies",
        body: "Build a testimonials section (as the Landing Page Changes spec asks) and show the collected testimonials on the homepage, relevant service pages and case studies.",
      },
      {
        title: "Ask the same clients for Google reviews — target 10 in 60 days",
        body: "Send the four clients a direct link to leave a Google review on the Rhinon Labs Business Profile. Target 10 reviews in 60 days. Reviews also power the local pack (H-11 points here).",
      },
      {
        title: "New case study: RichHarbor or Al Rooha",
        body: "Publish a new client case study for RichHarbor or Al Rooha, using the M-06 template (problem, solution, stack, timeline, results with numbers, quote, screenshots).",
      },
      {
        title: "New case study: Rhinon Tech Company OS, labelled \"built for our own company\"",
        body: "Publish an AI/automation case study on the Rhinon Tech Company OS (AI lead research, outbound engine, RAG chatbot, HR automation), clearly labelled \"built for our own company\". It is the strongest proof for the AI-agent and automation services, which currently have zero case studies.",
      },
      {
        title: "Rename the \"OUR CLIENTS\" grid to \"Our work\" or split client projects vs our products",
        body: "In `components/Pages/Home/CaseStudy/CaseStudies.tsx:40–45`, rename the heading to \"Our work\", or split into \"Client projects\" and \"Our products\", so FurrCircle (own product) isn't presented as a client.",
      },
      {
        title: "Label own products in the logo strip (Rhinon Tech, and Saleszium if related)",
        body: "\"Rhinon Tech — Admin dashboard\" is Rhinon's own platform; label it as such. If Saleszium is also a related product, label it the same way.",
      },
      {
        title: "Remove or substantiate \"20+ startups\" and \"50+ hours weekly\"",
        body: "\"Trusted by 20+ startups and SMBs worldwide\" (`lib/site.ts:40`, llms.txt) and the \"50+ hours weekly within 90 days\" FAQ claim must either trace to real projects or be removed. Replace them with real numbers from real projects.",
      },
      {
        title: "Remove the unsourced star row and \"Rhinon Labs client\" avatars in the hero",
        body: "Remove or substantiate the five-star row and the three avatars labelled \"Rhinon Labs client\" in `components/Pages/Home/Hero1/Hero.tsx:96–102`. If the avatars aren't real clients they may breach FTC/ASCI rules.",
      },
      {
        title: "Validate: every claim traces to a source; 5 testimonials live; 10+ Google reviews",
        body: "Walk the homepage and service pages and check each claim has a named source. Confirm at least 5 testimonials are live and the Business Profile has 10 or more reviews.",
      },
      {
        title: "Remove dead code and placeholder content (L-06)",
        priority: "Low",
        body:
          "Folded in from L-06 (Low, 1 h, Dev). An unused old Hero with an 817 KB `heroVideo.mp4`, placeholder team names in the About Team component, and a commented-out \"Join 5,000+ Founders\" newsletter CTA could be re-enabled by mistake and add unproven claims. Delete them, or keep them off until the content is real.",
      },
    ],
  },

  // ── High ──────────────────────────────────────────────────────────────────
  {
    ref: "H-01",
    title: "Case studies are fetched in the browser only, so crawlers can't see them",
    severity: "High",
    area: "Technical",
    effort: "2–4 h",
    owner: "Dev",
    phase: W2,
    what:
      "The homepage case studies are loaded by JavaScript after the page renders, so the server HTML has no links to them. Fetch them on the server so search engines and AI crawlers see the strongest trust content.",
    evidence: [
      "`CaseStudies` is a client component that fetches in `useEffect` (`components/Pages/Home/CaseStudy/CaseStudies.tsx:1, 15–21`).",
      "Server HTML of the homepage and all 6 service pages contains zero links to /case-studies/* (verified by fetching raw HTML).",
      "AI crawlers (GPTBot, ClaudeBot, PerplexityBot) don't run JavaScript; Google renders JavaScript later in a second pass.",
    ],
    why: "The site's strongest trust content is missing for the systems that decide rankings and AI citations, and no internal link value flows to the case studies.",
    validate: "`curl -s https://www.rhinonlabs.com/ | grep \"case-studies/\"` returns links.",
    subs: [
      {
        title: "Fetch case studies on the server and pass them to CaseStudies as props",
        body: "Fetch case studies server-side, the way `app/services/[slug]/page.tsx:51–54` already does for blogs, and pass them in as props. Keep `CaseStudies` purely presentational (no `useEffect` fetch).",
      },
      {
        title: "Check for any other content fetched only in the browser",
        body: "Look for other client components that fetch content in `useEffect` and move them to the server too, so nothing important is invisible to crawlers.",
      },
      {
        title: "Validate: curl the homepage and grep for case-studies/ links",
        body: "Run `curl -s https://www.rhinonlabs.com/ | grep \"case-studies/\"` and confirm it returns links. Repeat for a service page.",
      },
    ],
  },
  {
    ref: "H-02",
    title: "Pages compete with each other for the same keywords",
    severity: "High",
    area: "On-page",
    effort: "1–2 days",
    owner: "Content + Dev",
    phase: W2,
    what:
      "Several pairs of pages target the same search intent, so Google splits signals between them and often ranks the blog post instead of the service page. Give each intent one owner page and re-angle or merge the rest.",
    evidence: [
      "\"ai agent development company\" (1,900/mo India, KD 23): `/services/ai-agents` vs `/blogs/ai-agent-development-company-guide`.",
      "\"custom dashboard development india\": `/services/internal-dashboards` vs `/blogs/custom-internal-dashboard-development-india`.",
      "\"mobile app development cost india\" (880/mo): `/blogs/mobile-app-development-cost-india-2027` vs `/blogs/mobile-app-development-cost-startups-india`.",
      "MVP cost vs timeline: `/blogs/mvp-development-cost-india-2027-guide` vs `/blogs/how-long-does-it-take-to-build-an-mvp-india-guide` (title says \"Timelines & Costs\").",
      "Onboarding: `/blogs/automate-employee-onboarding-small-company`, `/blogs/automating-onboarding` (client onboarding), `/tools/employee-onboarding-checklist`.",
    ],
    why: "Google picks one URL per intent. Competing pages split the signals and often send buyers to an article instead of a sales page.",
    validate: "In GSC's Performance report, each target query maps to one URL.",
    subs: [
      {
        title: "Re-angle the AI agent company post to \"How to choose an AI agent development company\"",
        body: "`/services/ai-agents` owns \"ai agent development company\". Re-angle `/blogs/ai-agent-development-company-guide` to \"How to choose an AI agent development company (questions, costs, red flags)\" and link it to the service page with that exact phrase.",
      },
      {
        title: "Re-angle the dashboard post to \"Internal dashboard cost in India (₹ ranges by scope)\"",
        body: "`/services/internal-dashboards` owns \"custom dashboard development india\". Re-angle `/blogs/custom-internal-dashboard-development-india` to \"Internal dashboard cost in India (₹ ranges by scope)\".",
      },
      {
        title: "Merge mobile-app-development-cost-startups-india into the 2027 post and 301 it",
        body: "After the C-02 repair, merge the useful content of `/blogs/mobile-app-development-cost-startups-india` into `/blogs/mobile-app-development-cost-india-2027` and 301 the old URL. Also update `relatedBlogs` (Appendix B / H-04).",
      },
      {
        title: "Drop \"Costs\" from the MVP timeline post's title and cross-link with the cost guide",
        body: "Remove \"Costs\" from the title of `/blogs/how-long-does-it-take-to-build-an-mvp-india-guide` so it targets timelines only, and cross-link it with `/blogs/mvp-development-cost-india-2027-guide`.",
      },
      {
        title: "Make onboarding titles distinct (employee vs client) and link the employee post to the tool",
        body: "Retitle so `/blogs/automate-employee-onboarding-small-company` is clearly employee onboarding and `/blogs/automating-onboarding` is clearly client onboarding. Link the employee post to `/tools/employee-onboarding-checklist`.",
      },
      {
        title: "Validate: each target query maps to one URL in GSC Performance",
        body: "In GSC's Performance report, filter by each target query above and confirm a single URL gets the impressions.",
      },
    ],
  },
  {
    ref: "H-03",
    title: "Positioning is built on low-demand terms, and the messages conflict",
    severity: "High",
    area: "Strategy",
    effort: "2–3 days",
    owner: "Founder",
    phase: W2,
    what:
      "The homepage leads with terms almost nobody searches (\"Internal Dashboards\", ~10/month) while the biggest commercial term in the category, \"AI automation agency\", has no page. The site also uses eight different self-descriptions. Pick one position and align every page and metadata field to it.",
    evidence: [
      "Sections 3.1–3.3 of the audit. Homepage leads with \"Internal Dashboards\" (~10 searches/month in India).",
      "\"AI automation agency\": 2,900/month India, 4,400/month US (KD 20/19, US CPC $26.80); no page targets it.",
      "Eight different self-descriptions; two different buyers served through one funnel.",
      "Recommended position (3.6): \"AI automation agency for startups and SMBs. We build AI agents, workflow automations and internal tools in fixed-scope 2–4-week sprints.\" Secondary pillar: MVP development for non-technical founders.",
    ],
    note:
      "\"AI automation agency\" has mixed intent (some results are \"how to start an AI automation agency\" videos), so the buyer share of 2,900 is smaller. It is still the largest commercial term, and smaller competitors (e.g. Hevify Labs at hevify.in/ai-automation-agency) rank with dedicated pages.",
    why: "Positioning decides which searches you can win and whether visitors recognise themselves. Scattered messaging lowers conversion and confuses Google and AI assistants.",
    validate: "GSC impressions for the \"AI automation agency\" query family; homepage conversion rate.",
    subs: [
      {
        title: "Choose one primary positioning (recommendation in audit section 3.6)",
        body: "Founder decision. Recommended: primary \"AI automation agency for startups and SMBs\" (AI agents, workflow automations, internal tools in fixed-scope 2–4-week sprints); secondary pillar MVP development for non-technical founders; India pages in ₹, a US page in USD.",
      },
      {
        title: "Retitle the homepage and align the H1 (e.g. \"AI Automation Agency for Startups & SMBs | Rhinon Labs\")",
        body: "Change the homepage title from the dashboard-led one to the chosen positioning, for example \"AI Automation Agency for Startups & SMBs | Rhinon Labs\", and make the H1 say the same thing.",
      },
      {
        title: "Use the same core sentence in default title, OG/Twitter, lib/site.ts, llms.txt and schema",
        body: "Put one identical positioning sentence in the default title, Open Graph and Twitter tags, `lib/site.ts`, llms.txt and the schema description, so Google and AI assistants get one consistent message.",
      },
      {
        title: "Create an \"AI automation agency\" page (or make the homepage that page)",
        body: "Build a dedicated page targeting \"ai automation agency\" (2,900/mo IN, 4,400/mo US) with proof, process, pricing signal and FAQs — or retarget the homepage to be that page.",
      },
      {
        title: "Keep /build as its own campaign funnel with founder-suited form fields",
        body: "`/build` serves a different buyer (non-technical founders). Keep it as a separate funnel with form fields that suit founders, not the agency booking form.",
      },
      {
        title: "Test a construction and fit-out vertical page backed by the two construction case studies",
        body: "2 of 3 client case studies are construction (Apexis Pro, SR Fitout). Test a construction and fit-out software page backed by them as a niche.",
      },
      {
        title: "Consider a dedicated \"custom software development company india\" landing page",
        body: "From the keyword map: 720/mo India, KD 5. Currently only a \"how to choose\" blog targets it. Consider a dedicated landing page.",
      },
      {
        title: "Validate: GSC impressions for \"AI automation agency\" queries + homepage conversion rate",
        body: "Track GSC impressions for the \"AI automation agency\" query family and the homepage conversion rate (once H-08 events exist).",
      },
    ],
  },
  {
    ref: "H-04",
    title: "Stale related-content mapping: no service CTA on 15 posts",
    severity: "High",
    area: "Conversion / linking",
    effort: "0.5 day",
    owner: "Dev",
    phase: W1,
    what:
      "The blog's \"Matching Solution\" banner and each service page's related reading come from hand-maintained `relatedBlogs` arrays that have wrong slugs and missing posts. 15 of 26 posts, including every cost guide, show no path to a service page. Correct the arrays now and make the mapping self-maintaining.",
    evidence: [
      "`relatedBlogs` arrays in `rhinonlabs/lib/services.ts` (lines 79, 123, 167–173, 217, 261, 305) drive both the banner and service-page related reading.",
      "Wrong slugs: `mvp-development-cost-india-2026-guide` (now -2027-guide), `ai-agent-security-for-businesses-india-2026` (now -2027), typo `ai-agents-vs-traditional-automatio`.",
      "15 of 26 posts show no service CTA (full list in Appendix A).",
      "/services/mvp-development and /services/mobile-app-development each link to 1 post, which is blank (C-02). /services/ai-agents links to 1 of 6 AI posts. /services/internal-dashboards links to 2 older posts and none of the 3 November dashboard posts.",
    ],
    why: "The highest-intent posts have no path to a sales page, which costs conversions and starves the money pages of internal links.",
    validate: "Every post shows a Matching Solution banner, and each service page lists 3–6 related posts.",
    note: "`getServiceByBlogSlug()` returns the first service whose list contains a slug, so list each post under one service only.",
    subs: [
      {
        title: "relatedBlogs mvp-development: fix 2027 slug, add no-code post, add freelancer post after repair",
        body: "Appendix B: replace `mvp-development-cost-india-2026-guide` with `mvp-development-cost-india-2027-guide`; add `no-code-vs-custom-mvp-india-guide`; keep `how-long-does-it-take-to-build-an-mvp-india-guide` and add `freelancer-vs-agency-for-mvp-india-guide` once both are repaired (C-02).",
      },
      {
        title: "relatedBlogs ai-agents: fix typo + 2027 slug, add company guide and use-cases posts",
        body: "Appendix B: replace `ai-agents-vs-traditional-automatio` with `ai-agents-vs-traditional-automation`; replace `ai-agent-security-for-businesses-india-2026` with `-2027`; add `ai-agent-development-company-guide` and `ai-agents-for-business-use-cases`.",
      },
      {
        title: "relatedBlogs workflow-automation: add automate-employee-onboarding-small-company",
        body: "Appendix B: add `automate-employee-onboarding-small-company` to the workflow-automation service's list.",
      },
      {
        title: "relatedBlogs internal-dashboards: add the 3 November dashboard posts",
        body: "Appendix B: add `custom-internal-dashboard-development-india`, `spreadsheet-vs-dashboard-india` and `internal-dashboards-operations-india-examples`.",
      },
      {
        title: "relatedBlogs web-development: add how-to-choose-custom-software-development-company-india",
        body: "Appendix B: add `how-to-choose-custom-software-development-company-india` to the web-development service.",
      },
      {
        title: "relatedBlogs mobile-app-development: add 2027 cost + hiring posts; remove startups post after merge",
        body: "Appendix B: add `mobile-app-development-cost-india-2027` and `how-to-hire-app-developers-india-founders-guide`; remove `mobile-app-development-cost-startups-india` after the H-02 merge.",
      },
      {
        title: "Durable fix: add a service field to Blog in the CMS editor (or map by category)",
        body: "Add a `service` field to the Blog model and CMS editor and derive both the Matching Solution banner and the service-page related reading from it (or map by category), so new posts are linked automatically instead of by hand.",
      },
      {
        title: "Add a build-time check that fails if any relatedBlogs slug doesn't exist",
        body: "Add a check to the rhinonlabs build that fetches blog slugs and fails if any `relatedBlogs` entry doesn't exist, so a renamed slug can't silently break the mapping again.",
      },
      {
        title: "Validate: every post shows Matching Solution; each service page lists 3–6 posts",
        body: "Load all 26 posts and confirm each shows a Matching Solution banner. Confirm each service page lists 3–6 related posts.",
      },
    ],
  },
  {
    ref: "H-05",
    title: "Thin contextual internal linking and no topic hubs",
    severity: "High",
    area: "On-page",
    effort: "2–3 days",
    owner: "Content",
    phase: W5,
    what:
      "Most posts link to only one other page, no post links to a case study, and there are no topic hub pages. Add hubs per service cluster and give every post 3–5 contextual links.",
    evidence: [
      "16 of 26 posts contain exactly 1 internal link in the article body (all 10 July–August posts among them; for the 4 blank posts in C-02, that link is the appended block). The rest contain 2–6.",
      "No post links to a case study.",
      "The homepage links to no individual post or case study, only to hub pages.",
      "There is no hub page per topic.",
    ],
    why: "Internal links tell Google which pages matter and how topics relate; without them the service pages get little link value and posts look isolated.",
    validate: "Every post has at least 3 in-body internal links, and a site crawl (e.g. Screaming Frog) finds no orphan pages.",
    subs: [
      {
        title: "Create topic hubs per cluster (MVP, AI agents, automation, dashboards)",
        body: "Create a hub for each of the four clusters. These can be \"Guides\" sections on the corresponding service pages, listing every related post.",
      },
      {
        title: "Internal links pass: MVP / app-cost cluster (8 posts)",
        body: "Give each post 3–5 contextual links (1 service page with a descriptive anchor, 2 related posts, 1 case study): mvp-development-cost-india-2027-guide, mobile-app-development-cost-startups-india, how-long-does-it-take-to-build-an-mvp-india-guide, no-code-vs-custom-mvp-india-guide, freelancer-vs-agency-for-mvp-india-guide, mobile-app-development-cost-india-2027, how-to-hire-app-developers-india-founders-guide, how-to-choose-custom-software-development-company-india.",
      },
      {
        title: "Internal links pass: AI cluster (5 posts)",
        body: "Give each post 3–5 contextual links (service page, 2 related posts, 1 case study): ai-agents-vs-traditional-automation, chatbot-vs-ai-agent-real-difference, ai-agent-security-for-businesses-india-2027, ai-agents-for-business-use-cases, ai-agent-development-company-guide.",
      },
      {
        title: "Internal links pass: automation cluster (7 posts)",
        body: "Give each post 3–5 contextual links (service page, 2 related posts, 1 case study): time-triggered-email-automation, automating-onboarding, event-registration-system, automate-first-in-a-product-led-growth-motion, zapier-vs-custom-automation, why-arent-your-tools-talking-to-each-other, automate-employee-onboarding-small-company.",
      },
      {
        title: "Internal links pass: dashboards / ops cluster (5 posts)",
        body: "Give each post 3–5 contextual links (service page, 2 related posts, 1 case study): dependent-on-one-persons-memory, who-actually-owns-ops-in-a-five-person-team, internal-dashboards-operations-india-examples, spreadsheet-vs-dashboard-india, custom-internal-dashboard-development-india. (The GEO post is handled in M-07.)",
      },
      {
        title: "Add server-rendered \"Latest guides\" and \"Case studies\" blocks to the homepage",
        body: "The homepage links to no individual post or case study. Add server-rendered (not client-fetched, see H-01) \"Latest guides\" and \"Case studies\" blocks.",
      },
      {
        title: "Validate: every post has 3+ in-body internal links; crawl finds no orphan pages",
        body: "Count in-body internal links per post (target 3 or more) and run a site crawl (e.g. Screaming Frog) to confirm there are no orphan pages.",
      },
    ],
  },
  {
    ref: "H-06",
    title: "Author signals are broken",
    severity: "High",
    area: "E-E-A-T",
    effort: "1 day",
    owner: "Dev + Founder",
    phase: W2,
    what:
      "Posts are bylined to a different brand (\"Founder @ Rhinon Tech\"), the author URL 404s, the author's sameAs points to company profiles, and there's no visible bio. Give posts a real, accountable author.",
    evidence: [
      "25 posts bylined \"Prabhat Patra — Founder @ Rhinon Tech\" (a different brand from the publisher Rhinon Labs); one bylined \"Rhinon Labs team — Product Studio\".",
      "BlogPosting schema (`app/blogs/[slug]/page.tsx:149–158`): `jobTitle` \"Founder @ Rhinon Tech\"; `url` /about (404, C-03); `sameAs` lists company LinkedIn and X, not the person's.",
      "Author role hidden (line 285 commented out); no bio box; \"Why trust our content\" and \"Reviewed by\" blocks commented out (lines 292–333); fallback avatar is a GitHub image.",
      "Nothing explains how Rhinon Labs relates to Rhinon Tech.",
    ],
    why: "Advice on costs, security and vendor choice needs a real, accountable author with visible experience. A byline naming a different brand muddies who the publisher is.",
    validate: "Rich Results Test passes, and the author page is indexed.",
    subs: [
      {
        title: "Create an author page (/authors/prabhat-patra or founder section on About)",
        body: "Build an author page with bio, photo, LinkedIn and projects shipped. C-03 points `author.url` here.",
      },
      {
        title: "Set jobTitle to \"Founder, Rhinon Labs\" and point Person.sameAs to the founder's own profiles",
        body: "In `app/blogs/[slug]/page.tsx:149–158`, change `jobTitle` to \"Founder, Rhinon Labs\" and make `Person.sameAs` list the founder's own LinkedIn, X and GitHub instead of the company pages.",
      },
      {
        title: "Add an author bio box under each post",
        body: "Show a short bio box (photo, role, experience, link to author page) under every post, and stop hiding the author role (line 285).",
      },
      {
        title: "Bring back an honest \"How we write\" note",
        body: "The \"Why trust our content\" / \"Reviewed by\" blocks are commented out (lines 292–333). Replace them with an honest \"How we write\" note that matches the real process (see H-07 checklist).",
      },
      {
        title: "Give the GEO post a named author",
        body: "`/blogs/generative-engine-optimization-strategies` is bylined \"Rhinon Labs team\". Give it a named, real author.",
      },
      {
        title: "Add parentOrganization to the schema if Rhinon Tech is the parent",
        body: "If Rhinon Tech is the parent company, add `parentOrganization` to the Organization schema. (Explaining the relationship on About is tracked in C-03.)",
      },
      {
        title: "Validate: Rich Results Test passes and the author page is indexed",
        body: "Run Google's Rich Results Test on a post and confirm the author block is valid. Confirm the author page is indexed in GSC.",
      },
    ],
  },
  {
    ref: "H-07",
    title: "Mass-published content with unsourced claims",
    severity: "High",
    area: "Content quality",
    effort: "Ongoing",
    owner: "Content",
    phase: `${W5} (quality check on all 26 posts), then ongoing`,
    what:
      "Most recent posts were AI-written in a burst, cite no sources, promise future-dated data, and contain little first-hand evidence. Put every post through an editorial check and fix the existing ones.",
    evidence: [
      "Cadence: 16 posts between 20 Oct and 16 Nov, 10 of them in 11–16 Nov, produced with the admin AI Writer.",
      "The AI-agent security post states \"On October 15, 2026, CERT-In published an advisory…\" with specific findings and 0 external links. All 16 posts since 20 Oct have 0 external citations except the GEO post (12). July–August posts have 1–3 each.",
      "Titles and descriptions promise \"2027 cost data (₹)\" in November 2026.",
      "No post has in-body images or diagrams (cover images only); few use screenshots or real project numbers.",
    ],
    why: "Google's spam policies target content mass-produced mainly to rank, and its systems reward first-hand experience. Unverifiable security and cost claims lose trust when checked. AI assistants prefer pages that cite their sources.",
    validate: "Checklist completed for every post; track engaged time in GA4 and impressions per post in GSC.",
    subs: [
      {
        title: "Define the pre-publish editorial checklist",
        body: "Every post must pass: a human edit; at least 2 credible external citations for factual claims; at least 1 first-hand element (real numbers, a screenshot, a quote from a Rhinon project); no unverifiable statistics. Make this part of the AI Writer → publish workflow.",
      },
      {
        title: "Verify the CERT-In advisory and link to it, or remove that section",
        body: "The AI-agent security post's \"October 15, 2026 CERT-In advisory\" section has no source. Find and link the advisory, or remove the section.",
      },
      {
        title: "Quality pass: MVP / app-cost cluster (8 posts)",
        body: "Apply the checklist (sources, consistent years, first-hand detail) to: mvp-development-cost-india-2027-guide, mobile-app-development-cost-startups-india, how-long-does-it-take-to-build-an-mvp-india-guide, no-code-vs-custom-mvp-india-guide, freelancer-vs-agency-for-mvp-india-guide, mobile-app-development-cost-india-2027, how-to-hire-app-developers-india-founders-guide, how-to-choose-custom-software-development-company-india. Remove \"2027 cost data\" promises that can't be backed.",
      },
      {
        title: "Quality pass: AI cluster (5 posts)",
        body: "Apply the checklist to: ai-agents-vs-traditional-automation, chatbot-vs-ai-agent-real-difference, ai-agent-security-for-businesses-india-2027, ai-agents-for-business-use-cases, ai-agent-development-company-guide.",
      },
      {
        title: "Quality pass: automation cluster (7 posts)",
        body: "Apply the checklist to: time-triggered-email-automation, automating-onboarding, event-registration-system, automate-first-in-a-product-led-growth-motion, zapier-vs-custom-automation, why-arent-your-tools-talking-to-each-other, automate-employee-onboarding-small-company.",
      },
      {
        title: "Quality pass: dashboards / ops cluster (5 posts)",
        body: "Apply the checklist to: dependent-on-one-persons-memory, who-actually-owns-ops-in-a-five-person-team, internal-dashboards-operations-india-examples, spreadsheet-vs-dashboard-india, custom-internal-dashboard-development-india. (The GEO post is handled in M-07.)",
      },
      {
        title: "Set cadence to 1–2 posts a week",
        body: "Slow down from the Nov burst (10 posts in 6 days) to 1–2 checked posts a week, targeting the keyword map (audit section 9).",
      },
      {
        title: "Refresh posts quarterly and show a \"Last reviewed\" date",
        body: "Review each post every quarter and display a real \"Last reviewed\" date (see M-09 for the date display fix).",
      },
      {
        title: "Validate: checklist done for every post; track engaged time (GA4) and impressions (GSC)",
        body: "Confirm the checklist is recorded for every post. Track engaged time per post in GA4 and impressions per post in GSC.",
      },
    ],
  },
  {
    ref: "H-08",
    title: "No conversion tracking",
    severity: "High",
    area: "Measurement",
    effort: "0.5–1 day",
    owner: "Dev",
    phase: W1,
    what:
      "GA4 records page views only — no lead, booking, WhatsApp, phone or tool events — and loads late enough to miss short visits. Add lead events so every SEO/content decision can be measured.",
    evidence: [
      "GA4 (`G-HQ0812RTEQ`) only runs `gtag('config')`; no events for booked call, contact submission, WhatsApp/phone click or tool completion (`components/Common/Analytics/GoogleAnalytics.tsx`).",
      "GA4 loads with `strategy=\"lazyOnload\"`, so short visits often go unrecorded.",
      "Three trackers overlap: GA4, Rhinon `t.js` (`app/layout.tsx:135–140`), and `PageviewTracker` posting to /public/track.",
    ],
    why: "Without lead events you can't tell which channel, page or post produces leads, so content and SEO decisions are guesswork.",
    validate: "Events appear in GA4 DebugView, and a monthly \"leads by landing page and channel\" report exists.",
    subs: [
      {
        title: "GA4 key event: generate_lead (call booked, contact submitted)",
        body: "Fire `generate_lead` when a discovery call is booked or the contact form is submitted, and mark it as a key event in GA4.",
      },
      {
        title: "GA4 event: book_call_open",
        body: "Fire `book_call_open` when the booking form/modal opens. With `generate_lead` this gives the form completion rate KPI.",
      },
      {
        title: "GA4 event: click_whatsapp",
        body: "Fire `click_whatsapp` on every WhatsApp link click.",
      },
      {
        title: "GA4 event: click_phone",
        body: "Fire `click_phone` on every phone (`tel:`) link click.",
      },
      {
        title: "GA4 event: tool_complete",
        body: "Fire `tool_complete` when a visitor finishes a free tool (onboarding checklist generated, CRM ROI calculated).",
      },
      {
        title: "Switch GA4 to afterInteractive",
        body: "Change the GA4 script from `lazyOnload` to `afterInteractive` in `GoogleAnalytics.tsx` so short visits are recorded.",
      },
      {
        title: "Link GA4 with Google Search Console",
        body: "Link the GA4 property to GSC so landing-page queries and conversions can be viewed together.",
      },
      {
        title: "Keep one first-party tracker (GA4 vs t.js vs PageviewTracker)",
        body: "Three trackers overlap (GA4, `t.js` at `app/layout.tsx:135–140`, and `PageviewTracker` → /public/track). Keep one first-party tracker alongside GA4 and remove the duplicate.",
      },
      {
        title: "Store source and UTM parameters on every lead",
        body: "Capture the source and UTM parameters on every lead (the payload already has a `source` field) so leads can be attributed to channels in the CRM.",
      },
      {
        title: "Validate: events in GA4 DebugView",
        body: "Trigger each event on the live site with DebugView open and confirm it arrives with the right parameters.",
      },
      {
        title: "Set up a monthly \"leads by landing page and channel\" report + KPI review",
        body: "Build a monthly report of leads by landing page and channel, and review the audit's KPI table (section 13) monthly: form completion, organic leads, indexed URLs, rankings, referring domains, reviews, testimonials, AI mentions, mobile CWV.",
      },
    ],
  },
  {
    ref: "H-09",
    title: "Indexing is not monitored, and non-www URLs are in Google's index",
    severity: "High",
    area: "Technical",
    effort: "0.5 day",
    owner: "Dev",
    phase: W1,
    what:
      "Nobody is watching what Google has indexed. Some posts are indexed under the non-www host and an old title still shows. Verify Search Console and Bing, submit the sitemap, and monitor indexing.",
    evidence: [
      "`site:rhinonlabs.com` and `site:rhinonlabs.com/blogs` each surface about 10 URLs on page 1 (rough; full count needs GSC).",
      "Google lists 2 posts under non-www (rhinonlabs.com/blogs/ai-agents-vs-traditional-automation, rhinonlabs.com/blogs/dependent-on-one-persons-memory). The non-www → www redirect was added only recently.",
      "Google still shows an older title for /services/ai-agents.",
      "Verification can't be confirmed from code: no verification meta tag (DNS verification possible).",
    ],
    why: "Without Search Console you can't see indexing problems, duplicates or soft 404s, and Bing matters because ChatGPT search draws on it.",
    validate: "GSC's Pages report shows all 46 URLs indexed, or each exclusion is explained.",
    subs: [
      {
        title: "Verify a GSC domain property (DNS)",
        body: "Verify rhinonlabs.com as a domain property in Google Search Console via DNS, which covers www and non-www.",
      },
      {
        title: "Verify Bing Webmaster Tools",
        body: "Verify the site in Bing Webmaster Tools. ChatGPT search draws on Bing.",
      },
      {
        title: "Submit the sitemap to GSC and Bing",
        body: "Submit the sitemap to both Google Search Console and Bing Webmaster Tools.",
      },
      {
        title: "Review GSC Pages report (crawled–not indexed, duplicates, soft 404s)",
        body: "Go through GSC's Pages report and resolve crawled–not indexed, duplicate and soft-404 entries. Re-indexing of the repaired posts is tracked in C-02.",
      },
      {
        title: "Watch the non-www URLs consolidate to www",
        body: "Check that the two non-www posts drop out of the index in favour of www now that the redirect is live.",
      },
      {
        title: "Extend IndexNow pings to case-study and service updates",
        body: "IndexNow already pings on blog publish (`rhinontech/backend/src/services/indexNow.ts`). Extend it to case-study and service updates.",
      },
      {
        title: "Validate: GSC Pages report shows all 46 URLs indexed or exclusions explained",
        body: "Confirm in GSC that all 46 sitemap URLs are indexed, or each exclusion has a known reason.",
      },
      {
        title: "Fix the two-hop redirect from http://rhinonlabs.com (L-01)",
        priority: "Low",
        body: "Folded in from L-01 (Low, 15 min, Dev). `http://rhinonlabs.com` → `https://rhinonlabs.com` → `https://www.rhinonlabs.com` is two hops. Configure the Vercel domain so the apex goes straight to `https://www`.",
      },
    ],
  },
  {
    ref: "H-10",
    title: "No visibility in AI search",
    severity: "High",
    area: "GEO",
    effort: "Ongoing",
    owner: "Marketing",
    phase: W9,
    what:
      "ChatGPT never mentions the site, and Google's AI Overviews describe other companies or competitors. The technical basics are in place; what's missing is third-party presence and consistent, verifiable facts.",
    evidence: [
      "DataForSEO LLM mentions: 0 mentions of rhinonlabs.com in ChatGPT answers.",
      "Google's AI Overview for \"rhinonlabs\" describes other companies.",
      "AI Overview for \"ai agent development company india\" names Q3 Technologies, Webnox, Nimap, LeewayHertz and Maruti Techlabs, citing a LinkedIn Pulse listicle and integrax.in.",
      "Already in place: robots.txt allows AI crawlers; /llms.txt and /llms-full.txt exist; FAQ and Organization schema in place.",
      "Gaps: entity confusion (C-04); no third-party mentions or listicle inclusions; case studies hidden from crawlers (H-01); no LinkedIn Pulse presence, although LinkedIn Pulse ranks top 3 for \"mvp development cost india\" and is cited in AI Overviews.",
    ],
    why: "Buyers increasingly ask AI assistants for vendor recommendations; a company they can't describe doesn't get recommended.",
    validate: "Quarterly checks in ChatGPT, Perplexity and Gemini (e.g. \"best AI automation agency in Hyderabad\"), plus DataForSEO LLM mentions.",
    subs: [
      {
        title: "Founder publishes LinkedIn articles adapted from the best guides (2 a month)",
        body: "Adapt the strongest guides into LinkedIn articles by the founder, each linking back to the site. LinkedIn Pulse ranks and is cited by AI Overviews. Target 2 a month.",
      },
      {
        title: "Get reviews on Clutch and GoodFirms",
        body: "Ask clients for reviews on the Clutch and GoodFirms profiles (created in C-04). AI assistants cite these. (Listicle outreach is tracked in C-05.)",
      },
      {
        title: "Answer relevant Reddit and Quora threads genuinely",
        body: "Take part genuinely in Reddit and Quora threads about AI automation, MVP costs and internal tools — helpful answers first, links only where they add value.",
      },
      {
        title: "Keep llms.txt facts in line with verified claims (drop \"20+\" unless true)",
        body: "Make `/llms.txt` and `/llms-full.txt` (generated from `lib/site.ts`) state only verified facts. Drop \"20+\" unless it's true (see C-06).",
      },
      {
        title: "Server-render all proof",
        body: "Make sure testimonials, case studies and logos are in the server HTML so AI crawlers see them (case studies tracked in H-01).",
      },
      {
        title: "Validate: quarterly ChatGPT/Perplexity/Gemini prompts + DataForSEO LLM mentions",
        body: "Each quarter, ask ChatGPT, Perplexity and Gemini prompts like \"best AI automation agency in Hyderabad\" and record whether Rhinon Labs appears. Also check DataForSEO LLM mentions.",
      },
    ],
  },
  {
    ref: "H-11",
    title: "Google Business Profile is unused, and the site shows no address",
    severity: "High",
    area: "Local / trust",
    effort: "1 day",
    owner: "Founder",
    phase: W2,
    what:
      "A Google Business Profile exists but is empty with 0 reviews, while the local pack for \"ai automation agency\" is won by an agency with 24 reviews. The site itself shows no address. Complete the profile and show matching NAP details on the site.",
    evidence: [
      "GBP exists (\"Rhinon Labs — Software company\", Hyderabad) with 0 reviews.",
      "A local pack appears for \"ai automation agency\" in India; the top entry is a Bengaluru agency rated 5.0 from 24 reviews.",
      "The site shows no street address or map. The footer has only \"Send us an email\"; the phone appears only in the hero and contact page.",
    ],
    why: "Local packs appear for agency searches, so a complete, reviewed profile is directly valuable, and a visible address is a basic trust signal.",
    validate: "The profile appears in local packs for \"AI automation agency Hyderabad\" and \"software company Hyderabad\"; track profile insights.",
    subs: [
      {
        title: "Complete the GBP: categories, services, description, photos, weekly posts, Q&A",
        body: "Fill in categories, services, description and photos; post weekly; seed the Q&A. Use the identical details from C-04. (Reviews are tracked in C-06.)",
      },
      {
        title: "Show name, full address, phone and email on the contact page and footer (match GBP)",
        body: "Display the business name, full address, phone and email on the contact page and in the footer, exactly as on the Business Profile.",
      },
      {
        title: "Add ProfessionalService schema with address and geo",
        body: "Add `ProfessionalService` structured data with the full address and geo coordinates.",
      },
      {
        title: "Create a Hyderabad page only if there's real local work to show",
        body: "Don't create a thin city page. Only build a Hyderabad page if there are real local projects to feature.",
      },
      {
        title: "Validate: local pack for \"AI automation agency Hyderabad\" / \"software company Hyderabad\"",
        body: "Check whether the profile appears in the local pack for both queries, and track profile insights monthly.",
      },
    ],
  },
  {
    ref: "H-12",
    title: "No pricing signal, and mixed currencies",
    severity: "High",
    area: "Conversion",
    effort: "1 day",
    owner: "Founder",
    phase: W5,
    what:
      "Service pages show no prices at all, the homepage dodges \"Is this expensive?\", and ₹ and $ are mixed on the same page. Add starting-at prices and use one currency per audience.",
    evidence: [
      "Service pages show no prices.",
      "Homepage FAQ answers \"Is this expensive?\" with \"It's an investment…\".",
      "Blog posts publish ₹ ranges (e.g. ₹4–25 lakh for an MVP), but service pages don't.",
      "Homepage mixes currencies: a \"₹18.4L\" revenue card next to \"see exactly where every dollar is stuck\".",
    ],
    why: "Price anchors pre-qualify leads and help comparison shoppers decide. US buyers expect USD ranges.",
    validate: "Share of leads whose budget fits, tracked in the CRM.",
    subs: [
      {
        title: "Show \"starting at\" packages (automation audit, MVP sprint ₹X/$Y, monthly retainer)",
        body: "Founder decides the numbers. Show starting-at packages, for example a fixed-fee automation audit, an MVP sprint from ₹X / $Y, and a retainer from a set monthly amount.",
      },
      {
        title: "Add a pricing FAQ (replace \"It's an investment…\")",
        body: "Replace the homepage's evasive \"Is this expensive?\" answer with a real pricing FAQ that gives ranges.",
      },
      {
        title: "Use one currency per audience: ₹ for India pages, USD on US-facing pages",
        body: "Fix the homepage mix (\"₹18.4L\" next to \"every dollar\") and use USD on US-facing pages (see H-13).",
      },
      {
        title: "Validate: track share of leads whose budget fits in the CRM",
        body: "Use the new Budget range field (C-01) to track what share of leads fit the packages.",
      },
    ],
  },
  {
    ref: "H-13",
    title: "The US expansion goal isn't supported by any page",
    severity: "High",
    area: "Strategy",
    effort: "3–5 days",
    owner: "Founder + Content",
    phase: W5,
    what:
      "The company wants US clients, but every page is written for India (₹ pricing, \"india\" in URLs, Indian SMB metadata) and nothing targets US buyers. Build a US funnel.",
    evidence: [
      "12 of 26 post URLs contain \"india\"; all cost content is in ₹; About metadata targets \"Indian startups and SMBs\". No page targets US buyers.",
      "US demand: \"ai automation agency\" 4,400/mo (CPC $26.80 vs $1.57 India); \"hire developers in india\" 170 (CPC $161); \"offshore software development company india\" 140 (KD 18); \"mvp development services\" 320 (KD 7, CPC $24.90).",
    ],
    why: "US buyers pay agency rates and search for offshore teams, but there's no page that speaks to their concerns (time zones, USD, contracts, IP).",
    validate: "US sessions and leads in GA4; US impressions in GSC.",
    subs: [
      {
        title: "Build \"Offshore AI & MVP team for US startups\" page",
        body: "Create a US-facing page covering time-zone overlap, USD pricing, contract and IP/NDA terms, payment terms, and a case study relevant to US buyers. Targets \"hire developers in india\" and \"offshore software development company india\".",
      },
      {
        title: "Publish US-reader guides (e.g. \"MVP development cost: US vs India teams\")",
        body: "Write guides aimed at US readers, for example \"MVP development cost: US vs India teams\", priced in USD.",
      },
      {
        title: "Target US founders on LinkedIn",
        body: "Run LinkedIn outreach/content aimed at US founders, pointing to the US page.",
      },
      {
        title: "Low-effort \"n8n automation agency\" page or section",
        body: "From the keyword map: \"n8n automation agency\" gets 110/mo US (KD 4) and 40/mo India; no page targets it. Add a low-effort page or section.",
      },
      {
        title: "Add hreflang only if true en-US and en-IN versions exist",
        body: "Don't add hreflang for a single US page. Only add it if you create true en-US and en-IN versions of the same pages.",
      },
      {
        title: "Validate: US sessions and leads (GA4) and US impressions (GSC)",
        body: "Track US sessions and leads in GA4 and US impressions in GSC after the page launches.",
      },
    ],
  },

  // ── Medium ────────────────────────────────────────────────────────────────
  {
    ref: "M-01",
    title: "Heavy pages put mobile performance at risk",
    severity: "Medium",
    area: "Performance",
    effort: "1–2 days",
    owner: "Dev",
    phase: `${W9} (once mobile field data is reviewed)`,
    what:
      "Desktop scores are good, but pages are very heavy (694 KB HTML homepage, duplicated CSS, 281 KB JS) and main-thread work is high, which risks slow interactions on mid-range phones.",
    evidence: [
      "Homepage HTML ~694 KB uncompressed (~83 KB brotli): 172 KB of inline CSS duplicated inside the 277 KB RSC payload, a side effect of `experimental.inlineCss: true` (`next.config.ts:6–8`). Even /privacy-terms ships ~370 KB of HTML.",
      "JavaScript 281 KB brotli across 15 chunks; total page weight ~1.0 MB.",
      "Desktop Lighthouse 98 (LCP 0.98 s), but main-thread work 2.6 s even unthrottled — points to slow INP on mid-range phones.",
      "Mobile CrUX couldn't be retrieved (PageSpeed API quota exhausted).",
    ],
    why: "Core Web Vitals are a ranking signal and most Indian traffic is mobile; slow interactions also cost conversions.",
    validate: "Mobile LCP < 2.5 s and INP < 200 ms at p75 in CrUX.",
    subs: [
      {
        title: "Check mobile Core Web Vitals in GSC",
        body: "First get real mobile field data from GSC's Core Web Vitals report (couldn't be fetched during the audit) to decide how much of this work is needed.",
      },
      {
        title: "Test turning off experimental.inlineCss",
        body: "`experimental.inlineCss: true` (`next.config.ts:6–8`) duplicates 172 KB of CSS into the RSC payload. Test turning it off so CSS is cached across pages; compare HTML size and LCP.",
      },
      {
        title: "Reduce framer-motion use on the homepage",
        body: "Cut framer-motion animations on the homepage to reduce JS and main-thread work.",
      },
      {
        title: "Remove duplicated DOM: mark marquee/carousel clones aria-hidden or animate one set (M-12)",
        body: "Folded in from M-12 (Medium, 1–2 h, Dev). The \"Sound familiar?\" marquee items appear 3 times in the HTML and the product cards twice (cloned for infinite scroll), so crawlers and screen readers get repeated text. Mark clones `aria-hidden=\"true\"`, or animate a single set with CSS. Also trims page weight.",
      },
      {
        title: "Confirm dynamically imported sections still deliver text in the server HTML",
        body: "Check that sections loaded with dynamic imports still include their text in the server HTML, so performance work doesn't hide content from crawlers.",
      },
      {
        title: "Validate: mobile LCP < 2.5 s and INP < 200 ms at p75 (CrUX)",
        body: "After changes, confirm in CrUX/GSC that mobile LCP is under 2.5 s and INP under 200 ms at the 75th percentile.",
      },
    ],
  },
  {
    ref: "M-02",
    title: "Brand name duplicated in 4 titles",
    severity: "Medium",
    area: "On-page",
    effort: "15 min",
    owner: "Dev",
    phase: W1,
    what: "The title template appends \" | Rhinon Labs\" to metadata that already ends in \"— Rhinon Labs\", so four pages show the brand twice. Remove the duplicate from those four titles.",
    evidence: [
      "/services/internal-dashboards: \"Custom Dashboard Development Services in India — Rhinon Labs | Rhinon Labs\" (74 chars; `lib/services.ts:180`).",
      "/tools: \"Free Tools for Founders & Small Teams — Rhinon Labs | Rhinon Labs\".",
      "/tools/crm-roi-calculator: \"Free CRM ROI Calculator — Rhinon Labs | Rhinon Labs\".",
      "/tools/employee-onboarding-checklist: \"Free Employee Onboarding Checklist Generator — Rhinon Labs | Rhinon Labs\" (72 chars).",
    ],
    why: "Duplicated brands waste title space, get truncated in results, and look careless.",
    subs: [
      {
        title: "Remove \"— Rhinon Labs\" from /services/internal-dashboards title (lib/services.ts:180)",
        body: "Drop \"— Rhinon Labs\" from the metadata title at `lib/services.ts:180`; the template already appends \" | Rhinon Labs\".",
      },
      {
        title: "Remove \"— Rhinon Labs\" from /tools title",
        body: "Drop the duplicate brand from the /tools page metadata title.",
      },
      {
        title: "Remove \"— Rhinon Labs\" from /tools/crm-roi-calculator title",
        body: "Drop the duplicate brand from the CRM ROI calculator page metadata title.",
      },
      {
        title: "Remove \"— Rhinon Labs\" from /tools/employee-onboarding-checklist title",
        body: "Drop the duplicate brand from the onboarding checklist page metadata title.",
      },
    ],
  },
  {
    ref: "M-03",
    title: "Meta descriptions too long or cut mid-word",
    severity: "Medium",
    area: "On-page",
    effort: "1 h",
    owner: "Content",
    phase: W1,
    what: "Seven pages have meta descriptions over 155 characters (one is cut mid-word). Rewrite each as a complete sentence of 155 characters or fewer.",
    evidence: [
      "/build (173), /services/mvp-development (169), /blogs/spreadsheet-vs-dashboard-india (170, ends mid-word \"…in Indi\"), /blogs/mobile-app-development-cost-startups-india (169), /blogs/ai-agent-development-company-guide (165), /case-studies/furrcircle-… (192), /case-studies/srfitout (190).",
    ],
    why: "Google truncates long descriptions; a cut-off snippet looks broken and lowers click-through.",
    subs: [
      { title: "Rewrite meta description ≤155 chars: /build (173)", body: "Rewrite the /build meta description as a complete sentence of 155 characters or fewer." },
      { title: "Rewrite meta description ≤155 chars: /services/mvp-development (169)", body: "Rewrite the MVP service page description as a complete sentence of 155 characters or fewer." },
      {
        title: "Rewrite meta description ≤155 chars: /blogs/spreadsheet-vs-dashboard-india (170, cut mid-word)",
        body: "This one currently ends mid-word (\"…in Indi\"). Rewrite as a complete sentence of 155 characters or fewer.",
      },
      {
        title: "Rewrite meta description ≤155 chars: /blogs/mobile-app-development-cost-startups-india (169)",
        body: "Rewrite as a complete sentence of 155 characters or fewer (this post is later merged per H-02; fix it if the merge isn't done yet).",
      },
      { title: "Rewrite meta description ≤155 chars: /blogs/ai-agent-development-company-guide (165)", body: "Rewrite as a complete sentence of 155 characters or fewer, matching the re-angle in H-02." },
      { title: "Rewrite meta description ≤155 chars: /case-studies/furrcircle (192)", body: "Rewrite the FurrCircle case study description as a complete sentence of 155 characters or fewer." },
      { title: "Rewrite meta description ≤155 chars: /case-studies/srfitout (190)", body: "Rewrite the SR Fitout case study description as a complete sentence of 155 characters or fewer." },
    ],
  },
  {
    ref: "M-04",
    title: "Stale or inconsistent years in titles, and years in URLs",
    severity: "Medium",
    area: "On-page",
    effort: "0.5 day",
    owner: "Content + Dev",
    phase: W5,
    what: "Some titles show the wrong year (2025 in Nov 2026), others disagree with their own descriptions, and three URLs contain a year that will go stale. Move to year-free URLs and keep the year consistent in title, description and H1.",
    evidence: [
      "\"AI Agents for Business: 7 Practical Use Cases (2025)\", seen in November 2026.",
      "\"Freelancer vs Agency for MVP in India (2026 Costs & Guide)\", whose description says \"2027 cost data\".",
      "\"Spreadsheet vs Dashboard India … (2026 Guide)\".",
      "Three URLs contain a year (mvp-development-cost-india-2027-guide, mobile-app-development-cost-india-2027, ai-agent-security-for-businesses-india-2027); one has already been changed 2026 → 2027 with a redirect.",
    ],
    why: "Stale years lower click-through; years in URLs force URL changes and redirects every year.",
    subs: [
      { title: "Fix year in title: \"AI Agents for Business: 7 Practical Use Cases (2025)\"", body: "Update the stale \"(2025)\" and keep the year identical across title, description and H1." },
      {
        title: "Fix year mismatch: Freelancer vs Agency for MVP (\"2026\" title vs \"2027\" description)",
        body: "Make title, description and H1 use the same year (and don't promise data that doesn't exist — see H-07).",
      },
      { title: "Fix year in title: \"Spreadsheet vs Dashboard India … (2026 Guide)\"", body: "Update the year and keep it consistent across title, description and H1." },
      {
        title: "Year-free URL + 301: mvp-development-cost-india-2027-guide",
        body: "Move to a year-free slug (e.g. mvp-development-cost-india-guide) with a 301 from the current URL, and update `relatedBlogs` and internal links.",
      },
      {
        title: "Year-free URL + 301: mobile-app-development-cost-india-2027",
        body: "Move to a year-free slug with a 301 from the current URL (this is also the H-02 merge target), and update `relatedBlogs` and internal links.",
      },
      {
        title: "Year-free URL + 301: ai-agent-security-for-businesses-india-2027",
        body: "Move to a year-free slug with a 301 from the current URL, and update `relatedBlogs` and internal links.",
      },
      {
        title: "Policy: year only in title, consistent across title/description/H1, updated on a schedule",
        body: "Going forward, put the year only in the title (never the URL), keep it identical in title, description and H1, and update it on a schedule.",
      },
    ],
  },
  {
    ref: "M-05",
    title: "Tool pages are thin, and one targets almost no demand",
    severity: "Medium",
    area: "Content",
    effort: "1–2 days",
    owner: "Content",
    phase: W5,
    what: "The free tool pages have under 140 words of text each (the tools run in the browser), and the CRM ROI calculator targets a term with ~40 searches/month. Add real supporting content and promote the tools.",
    evidence: [
      "Page text: /tools 139 words, /tools/crm-roi-calculator 94, /tools/employee-onboarding-checklist 95.",
      "\"crm roi calculator\" ~40 searches/month US.",
      "\"employee onboarding checklist\" 480/month US (KD 2, CPC $23), ~1,300/month India average but spiky (9,900 in Sep 2026, 110 in Oct).",
    ],
    why: "Thin pages rarely rank; supporting content lets the onboarding tool capture real demand and makes the tools linkable.",
    subs: [
      {
        title: "Add 600–1,000 words to /tools/employee-onboarding-checklist (how-to, method, examples, FAQs)",
        body: "This tool targets real demand (480/mo US, KD 2). Add how to use it, the method, examples and FAQs.",
      },
      {
        title: "Add 600–1,000 words to /tools/crm-roi-calculator (how-to, method, examples, FAQs)",
        body: "Add supporting content. Low search demand (~40/mo), so treat it mainly as a lead magnet.",
      },
      {
        title: "Add supporting content to the /tools hub page",
        body: "The hub has 139 words. Add an intro and descriptions of each tool so it isn't thin.",
      },
      {
        title: "Offer a downloadable template",
        body: "Offer a downloadable template (e.g. the onboarding checklist) as a lead magnet.",
      },
      {
        title: "Link the tools from related posts and promote them for links",
        body: "Link each tool from related posts (e.g. the employee onboarding post, H-02) and promote the tools to earn links (C-05 points here).",
      },
      {
        title: "Validate search volume before building any new calculator (e.g. automation ROI)",
        body: "Before building another tool, check its search volume first so it doesn't repeat the CRM ROI calculator's low-demand problem.",
      },
    ],
  },
  {
    ref: "M-06",
    title: "Case-study pages are thin, and titles are just project names",
    severity: "Medium",
    area: "Content",
    effort: "1 day each",
    owner: "Content",
    phase: W5,
    what: "Case-study titles are just the project name, pages are 400–620 words including site-wide text, and descriptions are over 190 characters. Apply a consistent case-study template.",
    evidence: [
      "Titles like \"Apexis Pro | Rhinon Labs\"; 400–620 words per page including site-wide text; descriptions over 190 characters.",
    ],
    why: "Case studies are the strongest proof and can rank for service + industry searches, but only with descriptive titles and real substance.",
    subs: [
      {
        title: "Define the case-study template",
        body: "Template: title with outcome and service (e.g. \"Apexis Pro: Construction Snagging & Handover SaaS (Web + iOS + Android) | Case Study\"); client, problem, solution, stack and timeline; results with numbers; a client quote and screenshots; links to the relevant service pages.",
      },
      { title: "Apply the template to the Apexis Pro case study", body: "Rewrite Apexis Pro using the template: outcome-led title, problem/solution/stack/timeline, numeric results, client quote, screenshots, service links." },
      { title: "Apply the template to the SR Fitout case study", body: "Rewrite SR Fitout using the template, including a meta description ≤155 chars (see M-03)." },
      {
        title: "Apply the template to the FurrCircle case study",
        body: "Rewrite FurrCircle using the template and label it as Rhinon's own product (see C-06), with a meta description ≤155 chars (M-03).",
      },
    ],
  },
  {
    ref: "M-07",
    title: "Off-topic posts dilute topical focus",
    severity: "Medium",
    area: "Content",
    effort: "2 h",
    owner: "Content",
    phase: NOPLAN,
    what: "Two posts sit outside the services Rhinon Labs sells (GEO marketing and a developer tutorial). Reframe or merge them and keep new content inside the four service clusters.",
    evidence: [
      "/blogs/generative-engine-optimization-strategies: GEO is a marketing topic and Rhinon Labs doesn't sell SEO. \"Generative engine optimization\" has KD 44–48 and ranking pages average ~1,200 referring domains.",
      "/blogs/event-registration-system is a developer tutorial loosely tied to the services.",
    ],
    why: "Off-topic posts dilute topical authority and attract visitors who will never buy.",
    subs: [
      {
        title: "Reframe the GEO post around \"how we build AI-readable product sites\" (or merge it)",
        body: "Reframe `/blogs/generative-engine-optimization-strategies` around how Rhinon builds AI-readable product sites, or merge it into another post.",
      },
      {
        title: "Decide on /blogs/event-registration-system (tie to services or merge)",
        body: "The audit flags this developer tutorial as loosely tied to the services. Tie it clearly to the automation service or merge it.",
      },
      {
        title: "Keep new content inside the four service clusters",
        body: "New posts should sit inside MVP, AI agents, automation or dashboards.",
      },
    ],
  },
  {
    ref: "M-08",
    title: "Inconsistent blog categories; category URLs are query strings",
    severity: "Medium",
    area: "Architecture",
    effort: "1 day",
    owner: "Dev + Content",
    phase: NOPLAN,
    what: "Blog categories overlap and don't map to services (\"AI\" next to \"AI Agents\", cost guides under \"Projects\"), and category pages are query strings rather than real pages.",
    evidence: [
      "Categories include \"AI\" and \"AI Agents\" side by side, cost guides filed under \"Projects\", plus \"People\", \"SEO\" and \"Operations\".",
      "Breadcrumb schema points to /blogs?category=AI, a query string rather than a real category page.",
    ],
    why: "Indexable category pages act as topic hubs; query-string filters don't rank and send weak signals.",
    subs: [
      {
        title: "Consolidate to 4–5 categories that map to the services and re-file all posts",
        body: "Define 4–5 categories matching the service clusters and re-assign every post.",
      },
      {
        title: "Build static, indexable category pages (e.g. /blogs/category/ai-agents) with intro paragraph",
        body: "Create a real page per category with an intro paragraph, replacing the `?category=` query string.",
      },
      {
        title: "Point breadcrumb schema to the new category URLs",
        body: "Update the BreadcrumbList schema so it points to the static category pages instead of /blogs?category=…",
      },
    ],
  },
  {
    ref: "M-09",
    title: "Wrong read times, and \"Updated on\" shows the publish date",
    severity: "Medium",
    area: "UX / trust",
    effort: "1 h",
    owner: "Dev",
    phase: NOPLAN,
    what: "Read times are stored as fixed strings and are wrong, and the byline says \"Updated on\" but shows the publish date. Calculate read time and show real dates.",
    evidence: [
      "A 1,775-word post shows \"4 min read\"; blank posts show \"7–9 min read\".",
      "Byline says \"Updated on\" but renders `publishedAt` (`app/blogs/[slug]/page.tsx:288`).",
    ],
    why: "Wrong metadata undermines trust in the content itself.",
    subs: [
      {
        title: "Calculate read time from word count (~230 wpm)",
        body: "Replace the stored read-time string with a value computed from the article word count at about 230 words per minute.",
      },
      {
        title: "Show \"Published X · Updated Y\" using real dates (page.tsx:288)",
        body: "In `app/blogs/[slug]/page.tsx:288`, show \"Published X · Updated Y\" using the real published and updated dates instead of labelling the publish date \"Updated on\".",
      },
    ],
  },
  {
    ref: "M-10",
    title: "Privacy policy names no legal entity or privacy contact",
    severity: "Medium",
    area: "Trust / compliance",
    effort: "2 h",
    owner: "Founder",
    phase: W2,
    what: "/privacy-terms has no company legal name, registered address or privacy contact. Add them.",
    evidence: [
      "/privacy-terms contains no legal name, registered address or privacy contact. No \"Private Limited\", \"LLP\", registered office or GST text found.",
    ],
    why: "Buyers' procurement checks look for it, and India's DPDP Act expects a contact for data requests.",
    subs: [
      { title: "Add legal entity name and registered address to /privacy-terms", body: "State the company's legal name and registered office address." },
      { title: "Add a privacy contact email to /privacy-terms", body: "Add a contact email for data requests, as India's DPDP Act expects." },
      { title: "Add a last-updated date to /privacy-terms", body: "Show the date the policy was last updated." },
    ],
  },
  {
    ref: "M-11",
    title: "Informative images without alt text, and oversized source images",
    severity: "Medium",
    area: "Accessibility / performance",
    effort: "2–3 h",
    owner: "Dev",
    phase: NOPLAN,
    what: "18 homepage product screenshots have empty alt text, and several source images are 1–4.6 MB. Write alt text, compress images, and self-host the leftover Framer images.",
    evidence: [
      "18 product screenshots on the homepage have `alt=\"\"`.",
      "/public holds a 4.6 MB `assets/hero/3.png`, a 4.0 MB `assets/projects/alrooha/image.png`, and several other 1–3 MB images.",
    ],
    why: "Alt text is needed for accessibility and image search; oversized images waste bandwidth and slow builds and pages.",
    subs: [
      { title: "Write descriptive alt text for the 18 homepage product screenshots", body: "Replace `alt=\"\"` on informative images with descriptions of what each screenshot shows." },
      {
        title: "Compress or convert large images to WebP/AVIF (hero/3.png 4.6 MB, alrooha/image.png 4.0 MB, others)",
        body: "Compress or convert `assets/hero/3.png`, `assets/projects/alrooha/image.png` and the other 1–3 MB images in /public.",
      },
      { title: "Delete unused image files in /public", body: "Remove image files that nothing references." },
      {
        title: "Self-host the 2 homepage images loaded from framerusercontent.com (L-04)",
        priority: "Low",
        body: "Folded in from L-04 (Low, 30 min, Dev). The homepage loads 2 images from `framerusercontent.com`, left over from a Framer site. Host them on the site itself so they don't break if the Framer account goes away.",
      },
    ],
  },
  {
    ref: "M-13",
    title: "Generic copy that doesn't differentiate",
    severity: "Medium",
    area: "Copy",
    effort: "1–2 days",
    owner: "Founder + Content",
    phase: NOPLAN,
    what: "Key sections use generic agency copy. Rewrite around specific outcomes and the real differentiators.",
    evidence: [
      "\"Different systems that We Build\", \"Join us now and start transforming your vision into reality with expert support\", \"Your Go-To Operations Scaling Partner\".",
    ],
    why: "Generic copy gives visitors no reason to choose Rhinon Labs over any other agency.",
    subs: [
      {
        title: "Rewrite generic copy around outcomes and real differentiators",
        body: "Rewrite the generic lines around specific outcomes and the real differentiators: fixed scope, weekly staging releases, full code ownership, AI-native delivery, and the in-house AI platform as proof.",
      },
      {
        title: "Replace generic H1s on hub pages (L-03)",
        priority: "Low",
        body: "Folded in from L-03 (Low, 30 min, Content). Hub H1s are generic: \"Selected Works\" (case studies), \"The Founder's Journal\" (blog), \"Legal Transparency\" (privacy). Use descriptive H1s, for example \"Case Studies: MVPs, AI Agents & Internal Tools We've Built\".",
      },
    ],
  },
];

// L-02 belongs with the entity/schema work in C-04's sameAs step.
ISSUES.find((i) => i.ref === "C-04")!.subs.push({
  title: "Schema hygiene: Service schema on service pages only; complete Organization node (L-02)",
  priority: "Low",
  body:
    "Folded in from L-02 (Low, 1–2 h, Dev). Service + OfferCatalog schema is injected on every page, including the privacy page. The Organization schema lacks `founder`, `foundingDate`, `legalName`, `email` and a full address. Limit Service schema to service pages and complete the Organization node alongside the `sameAs` update.",
});

// ─────────────────────────────────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
const plain = (s: string) => s.replace(/`([^`]+)`/g, "$1");

const PRIORITY: Record<Issue["severity"], Priority> = { Critical: "High", High: "High", Medium: "Medium", Low: "Low" };

function issueTitle(i: Issue) {
  return `${i.ref} · ${i.title}`;
}

function renderIssue(i: Issue): { html: string; text: string } {
  const h: string[] = [];
  const t: string[] = [];
  const para = (label: string, body: string) => {
    h.push(`<p><strong>${esc(label)}:</strong> ${inline(body)}</p>`);
    t.push(`${label}: ${plain(body)}`);
  };
  h.push(`<p>${inline(i.what)}</p>`);
  t.push(plain(i.what), "");
  para("Severity", `${i.severity} · Area: ${i.area} · Effort: ${i.effort} · Owner (role): ${i.owner}`);
  para("Plan phase", i.phase);
  h.push(`<p><strong>Evidence</strong></p><ul>${i.evidence.map((e) => `<li><p>${inline(e)}</p></li>`).join("")}</ul>`);
  t.push("", "Evidence:", ...i.evidence.map((e) => `- ${plain(e)}`), "");
  if (i.why) para("Why it matters", i.why);
  if (i.note) para("Note", i.note);
  if (i.impact) para("Expected impact", i.impact);
  if (i.validate) para("How to validate", i.validate);
  para("Steps", "see the subitems of this task.");
  para("Source", `${SOURCE} → ${i.ref}`);
  return { html: h.join(""), text: t.join("\n") };
}

function renderSub(s: Sub, parent: Issue): { html: string; text: string } {
  return {
    html: `<p>${inline(s.body)}</p><p><strong>Part of:</strong> ${esc(issueTitle(parent))}</p><p><strong>Source:</strong> ${esc(SOURCE)} → ${esc(parent.ref)}</p>`,
    text: `${plain(s.body)}\n\nPart of: ${issueTitle(parent)}\nSource: ${SOURCE} → ${parent.ref}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function preflight() {
  const problems: string[] = [];
  for (const i of ISSUES) {
    const t = issueTitle(i);
    if (t.length > 255) problems.push(`title too long: ${t}`);
    const seen = new Set<string>();
    for (const s of i.subs) {
      if (s.title.length > 200) problems.push(`subitem title > 200 (activity summary limit): ${s.title}`);
      if (seen.has(s.title)) problems.push(`duplicate subitem title under ${i.ref}: ${s.title}`);
      seen.add(s.title);
      if (!s.body.trim()) problems.push(`empty description: ${s.title}`);
    }
  }
  if (problems.length) throw new Error("Preflight failed:\n" + problems.join("\n"));
}

async function main() {
  preflight();
  await sequelize.authenticate();
  console.log(`DB connected. Mode: ${APPLY ? "APPLY (writing)" : "DRY RUN (no writes)"}`);

  const user: any = await runAsSystem("seedRhinonLabsAuditTasks: find user", () =>
    (User as any).findOne({ where: { companyEmail: CREATOR_EMAIL } })
  );
  if (!user) throw new Error(`User ${CREATOR_EMAIL} not found`);
  const userId: string = user.id;
  const orgId: string = user.organizationId;

  await runForOrg(
    orgId,
    async () => {
      const projects: any[] = await (Project as any).findAll({ where: { name: PROJECT_NAME } });
      if (projects.length !== 1) throw new Error(`Expected exactly 1 project named "${PROJECT_NAME}", found ${projects.length}`);
      const projectId: string = projects[0].id;

      const status: any = await defaultStatusFor(projectId);
      if (!status) throw new Error("No default workflow status for project");
      const legacy = (await legacyStatusFor(status.id)) ?? "Pending";
      console.log(`Project ${projectId} · default status "${status.name}" (${status.id}) → legacy "${legacy}"`);

      const counts = { parentsNew: 0, parentsExisting: 0, subsNew: 0, subsExisting: 0 };
      const byPriority: Record<string, number> = {};

      const run = async (transaction: any) => {
        const findExisting = (parentTaskId: string | null, title: string) =>
          (Task as any).findOne({ where: { projectId, parentTaskId, title }, transaction });

        for (let pi = 0; pi < ISSUES.length; pi++) {
          const issue = ISSUES[pi];
          const title = issueTitle(issue);
          const priority = PRIORITY[issue.severity];
          let parent: any = await findExisting(null, title);
          let parentId: string;
          let parentIsNew = false;

          if (parent) {
            counts.parentsExisting++;
            parentId = parent.id;
          } else {
            counts.parentsNew++;
            parentIsNew = true;
            byPriority[priority] = (byPriority[priority] ?? 0) + 1;
            const d = renderIssue(issue);
            if (APPLY) {
              parent = await (Task as any).create(
                {
                  title,
                  description: d.text,
                  descriptionHtml: d.html,
                  projectId,
                  parentTaskId: null,
                  assigneeId: null,
                  createdById: userId,
                  statusId: status.id,
                  status: legacy,
                  priority,
                  position: pi + 1,
                  dueDate: DUE_DATE,
                },
                { transaction }
              );
              parentId = parent.id;
              await (TaskActivity as any).create(
                { taskId: parentId, userId, type: "created", summary: "created this task", details: null },
                { transaction }
              );
            } else {
              parentId = `dry-${issue.ref}`;
            }
          }
          console.log(`${parentIsNew ? "+" : "="} [${priority}] ${title} (${issue.subs.length} subitems)`);

          for (let si = 0; si < issue.subs.length; si++) {
            const sub = issue.subs[si];
            const subPriority = sub.priority ?? priority;
            const existing = parentIsNew ? null : await findExisting(parentId, sub.title);
            if (existing) {
              counts.subsExisting++;
              continue;
            }
            counts.subsNew++;
            byPriority[subPriority] = (byPriority[subPriority] ?? 0) + 1;
            if (!APPLY) continue;
            const d = renderSub(sub, issue);
            const child = await (Task as any).create(
              {
                title: sub.title,
                description: d.text,
                descriptionHtml: d.html,
                projectId,
                parentTaskId: parentId,
                assigneeId: null,
                createdById: userId,
                statusId: status.id,
                status: legacy,
                priority: subPriority,
                position: si + 1,
                dueDate: DUE_DATE,
              },
              { transaction }
            );
            await (TaskActivity as any).create(
              { taskId: child.id, userId, type: "created", summary: "created this task", details: null },
              { transaction }
            );
            await (TaskActivity as any).create(
              {
                taskId: parentId,
                userId,
                type: "subitem_added",
                summary: `added the subitem "${sub.title}"`,
                details: { childId: child.id },
              },
              { transaction }
            );
          }
        }
      };

      if (APPLY) await sequelize.transaction(run);
      else await run(undefined);

      console.log("\nSummary:", counts, "· new by priority:", byPriority);
      if (!APPLY) console.log("Dry run only. Re-run with --apply to write.");
    },
    { userId, label: "seedRhinonLabsAuditTasks" }
  );

  await sequelize.close();
}

main().catch(async (err) => {
  console.error(err);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
