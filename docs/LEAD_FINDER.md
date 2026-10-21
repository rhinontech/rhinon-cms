# Lead Finder: Apollo → CRM (Phase 1), with a roadmap for more sources

## Context

Rhinon wants a lead-sourcing system that finds people matching an ideal-customer profile (ICP), gets their work email and drops them into the CRM. Apollo is the first source. Today leads arrive only by manual entry, website forms, or an **Apollo CSV export** pasted into `LeadImportModal.tsx`. That is why `Lead` already has `apolloContactId`, `seniority`, `emailStatus`, `technologies` and similar columns. The legacy `rhinon/` app (Mongo, superseded) had a rough Apollo "Discovery" tab. It confirms the endpoint choice, but none of its code carries over.

**Decisions (from you):**
- **Rhinon only.** The module is platform-only: same treatment as Startup Ideas and Deploy.
- **Automatic reveal and save.** A run spends Apollo credits to get emails and saves the leads into the CRM. **A person decides later** what to do with them; nothing is emailed automatically.
- **Next sources after Apollo:** company websites and other email finders (Hunter, Snov, PDL). People stay the unit, so no company-only records are needed.

**Apollo facts (checked against docs.apollo.io, Oct 2026):**
- **Searching people** (`POST /api/v1/mixed_people/api_search`) costs **0 credits**. It returns a preview only: id, first name, obfuscated last name, title, company name, and a `has_email` flag. No emails. Filters go as query params. Max 100 results per page and 500 pages (50,000 results).
- **Bulk enrichment** (`POST /api/v1/people/bulk_match`) takes up to 10 people per call and costs **1 credit per person** when it returns an email or demographics. The response reports `credits_consumed`. A mobile number adds 8 credits and needs a webhook, so we skip phones.
- **Rate limits** on paid plans: search 200/min, 6k/hr, 50k/day; enrichment 1,000/min. The free plan allows 50/min and 600/day. Remaining calls come back in the `x-*-requests-left` headers. A 429 response includes `retry-after`.
- **Usage stats** (`POST /api/v1/usage_stats/api_usage_stats`) is free. It shows per-endpoint limits but not the credit balance.
- **API terms:** "solely for your internal business purposes". You may not "integrate the APIs with your product or services" without Apollo's approval. That is why this is platform-only.
- **We call the official API and do not scrape Apollo's web app.** Scraping breaches their terms, and Apollo has had Apify take down Apollo scrapers. It also gets accounts banned and breaks whenever their UI changes.

## How a run works

```
Saved search (filters or company-domain list, verified emails only by default)
  → page through People Search (free, 100/page)
  → drop has_email=false, and drop anyone already in the Prospect ledger (never pay twice)
  → bulk_match in batches of 10 (credits), checking the run cap and monthly budget before every batch
  → per person: no email → ledger "no_email"; unsubscribed → "suppressed", no lead
                email already in CRM → fill missing fields, "duplicate"
                otherwise → create Lead + Account + timeline entry, add to the search's list, "saved"
  → stop at target / budget / run cap / results exhausted
```

Leads land as `status "New"`, `lifecycleStage "New"`, `source "Apollo Lead Finder"`, owned by the search's owner. They go into a dedicated contact list named `Lead Finder · <search name>`.

**No auto-outreach.** `runWorkflowEngineCycle` re-enrolls every minute anyone in a watched list **or with a watched `source`** (`services/workflowEngine.ts:18-64`). Lead Finder therefore uses a new source string and a new list per search, and never calls `runWorkflowEngineCycle` or `enrollRealtimeLead`. Outreach only starts once a person points a campaign or workflow at that list.

## Phase 1: backend (`rhinontech/backend/src`)

**Branch:** `feat/lead-finder` off `beta`. Beta has `services/audit.ts`, strict tenancy, and the AES-GCM pattern in `services/totp.ts`. The deploy flow already goes beta → main.

### 1. Models (new files; register in `models/index.ts` and `TENANT_MODELS` in `models/tenantScope.ts`)
- **`LeadSourceConnection`** (`lead_source_connections`), one per org per provider, tenant-scoped only:
  - `provider` ("apollo"), `apiKeyEncrypted`, `apiKeyLast4`
  - `status` (connected/invalid), `lastCheckedAt`, `lastError`, `limits` JSONB (from usage stats)
  - `monthlyCreditBudget` (required, default 500), `excludedDomains` (string[]), `createdById`
  - Unique on (organizationId, provider).
- **`LeadSearch`** (`lead_searches`), also in `SITE_MODELS` (`models/siteScope.ts`), because a search belongs to one brand's CRM:
  - `name`, `mode` (filters | domains), `filters` JSONB, `domains` (≤1,000)
  - `verifiedOnly` (default true), `leadsPerRun` (default 100), `creditCapPerRun`
  - `schedule` (off/daily/weekly, 09:00 IST), `nextRunAt`, `status` (active/paused)
  - `contactGroupId`, `ownerId`, `lastRunAt`, running totals, `createdById`
- **`LeadSearchRun`** (`lead_search_runs`), also site-scoped:
  - `searchId`, `trigger`, `status` (queued/running/completed/failed/cancelled), `stopReason`
  - `cursorPage`, `totalAvailable`, counters (scanned, skippedKnown, revealed, saved, duplicates, noEmail, suppressed)
  - `creditsConsumed` DECIMAL, `notBefore`, `leaseUntil`, `error`, `startedAt`, `finishedAt`, `triggeredById`
- **`Prospect`** (`prospects`): the "never pay twice" ledger. It is **tenant-scoped but NOT site-scoped**, because `Lead` email is unique per org, not per brand (same reasoning as `Unsubscribe`):
  - `provider`, `externalId` (Apollo person id), `searchId`, `runId`, `siteId` (set explicitly)
  - `outcome`, `leadId`, `email`, `emailStatus`, `creditsConsumed`, trimmed `snapshot` JSONB, `revealedAt`
  - Unique on (organizationId, provider, externalId).

### 2. Apollo client: `services/leadSources/apollo.ts`
- axios with the `x-api-key` header. Base URL comes from `APOLLO_BASE_URL`, default `https://api.apollo.io/api/v1`, so tests can point at a stub.
- Functions:
  - `searchPeople(key, params, page)`: query params serialized as `person_titles[]=…`.
  - `bulkEnrich(key, ids[≤10])`: `reveal_personal_emails: false`.
  - `usageStats(key)`.
- A typed `ApolloError` carries `status` and `retryAfter`, and a helper parses the rate-limit headers.
- `services/leadSources/apolloFilters.ts` maps our filter shape to Apollo params:
  - titles (+ similar-titles toggle), seniorities, person and HQ locations, employee ranges
  - industries/keywords, hiring-for (`q_organization_job_titles[]`), revenue range
  - domains (`q_organization_domains_list[]`)
  - always: `contact_email_status[]=verified` when `verifiedOnly`, and `not_organization_websites_list[]` from `excludedDomains`
- `services/leadSources/apolloMapper.ts` maps an enriched person to `Lead` fields (name, email, emailStatus, title, seniority, departments, linkedin, location, company, website, company LinkedIn, industry, employee count, revenue, keywords, technologies, `raw.apollo`). **Check the organization field names against a real response once**: the docs' schema for them is incomplete.
- `services/leadSources/types.ts` is a small `LeadSourceProvider` interface (`search`, `reveal`, `testConnection`) with Apollo as its first implementation. It exists so Phase 2 and 3 plug in without rewrites. Keep it minimal.

### 3. Job runner: `services/leadFinder/runner.ts`
It is DB-backed with no Redis, which suits the single pm2 process and the existing per-minute cron.
- **Claiming a run:** an atomic `UPDATE … SET status='running', leaseUntil=now+2m WHERE id=? AND (queued with notBefore ≤ now, OR running with an expired lease)`. Only one run per org at a time.
- **Context:** `processRun` always sets up its own context: `runForOrg(run.organizationId, () => runForSite(site, /*explicit*/ false, work))` (`services/tenantContext.ts`, `services/siteContext.ts:51`). New Lead, Account and list rows get the brand stamped on them, while lookups (email dedupe, ledger) see the whole workspace.
- **Progress:** it saves `cursorPage`, the counters and the lease after every page, so a deploy or restart picks up where it left off. It also re-reads `status` each page so Cancel works.
- **Errors:**
  - 401: mark the connection invalid and fail the run.
  - 403 or 422: fail the run with Apollo's message.
  - 429: requeue with `notBefore = now + retry-after`.
  - Network or 5xx: 3 retries with backoff, then requeue with a delay.
- **Budget:** the month's spend is the sum of `creditsConsumed` for runs started in the current **IST** month. Before each batch, the run checks the worst case (batch size × 1 credit) against both the monthly budget and its own run cap.
- `tickLeadFinder()` creates runs for due schedules, moves `nextRunAt` forward, and claims runnable runs. It fires them without awaiting so cron ticks never pile up.

### 4. Saving into the CRM: `services/leadFinder/saveToCrm.ts`
- `normalizeEmail` / `isValidEmail` (`utils/email.ts`).
- Check the `Unsubscribe` list.
- `Lead.findOne({ email })`. If found, merge only the empty fields (same rule as `services/leadCapture.ts:findOrMergeLead`). If not, `Lead.create`.
- `findOrCreateAccountForLead` (`routes/accounts.ts:23`).
- An `Activity` of type `"System"` ("Found by Lead Finder search “X” via Apollo").
- `ContactGroupMember.bulkCreate(..., { ignoreDuplicates: true })` into the search's list. The list is created on the first run and recreated if deleted.

### 5. Routes: `routes/leadFinder.ts`, mounted at `/lead-finder` in `app.ts`
- `router.use(authenticate, requirePlatformOrg, resolveSiteContext)` (`middleware/authenticate.ts:131`).
- Connection: `GET /connection` returns status, last4, limits, budget and this month's spend. `PUT /connection`, `POST /connection/test` and `DELETE /connection` need `settings:write`. Saving a key tests it via usage stats before storing it encrypted.
- `POST /preview`: a live match count plus 10 sample rows (0 credits).
- `GET/POST /searches`, `GET/PUT/DELETE /searches/:id`, and `POST /searches/:id/run`, which returns 202 with the run and refuses if one is already active.
- `GET /runs?searchId=`, `GET /runs/:id` (plus paged prospect outcomes), `POST /runs/:id/cancel`.
- `auditRequest` (beta `services/audit.ts`) runs on key changes, run starts and cancels.

### 6. Permissions, cron, secrets
- `config/permissions.ts`: add `leadFinder:read` and `leadFinder:write` to `PERMISSION_CATALOG` **and** `PLATFORM_ONLY_PERMISSIONS`. The platform superadmin gets them automatically at boot; other roles are granted them in Settings → Roles.
- `server.ts` per-minute cron: `try { await runAsSystem("cron:lead-finder", tickLeadFinder) } catch …`, same as the workflow engine. Add a nightly 03:45 IST job that trims `Prospect.snapshot` older than 180 days (data minimisation).
- `utils/secretBox.ts`: AES-256-GCM `seal`/`open`, same format as beta's `totp.ts`. The key comes from `INTEGRATIONS_ENCRYPTION_KEY`, falling back to a key derived from `JWT_SECRET`. Set the env var on both servers so a JWT rotation can't make stored keys unreadable.

## Phase 1: admin panel (`rhinontech/admin-panel`)
- **CRM tab:**
  - Add "Lead Finder" to `items` in `app/[role]/crm/[domain]/layout.tsx`, shown only if `usePermissions().has("leadFinder:read")`.
  - New pages: `app/[role]/crm/[domain]/lead-finder/page.tsx` and `…/lead-finder/[searchId]/page.tsx`, kept thin as in the other modules.
- **`components/Admin/CRM/LeadFinder/`:**
  - `LeadFinderPage.tsx`: a credit meter (used vs budget, plus rate limits), a banner when the key is missing or invalid, and the saved searches list.
  - `SearchBuilder.tsx`: a Filters / Company domains toggle, chip inputs, a verified-only toggle, leads per run, schedule and owner. It shows a debounced live "≈ N people match" with samples.
  - `RunHistory.tsx`: polls every 3s while a run is active and shows counters, stop reason and credits.
  - `RunResults.tsx`: per-person outcomes linking to the CRM lead, plus "Open list".
- **Reuse:**
  - `TableShell`, `HeaderRow`, `DataRow`, `Pagination`, `EmptyState`, `SkeletonRows`, `TBtn`, `relativeTime` from `components/Admin/CRM/ui.tsx`
  - `apiFetch` from `lib/api.ts`
  - `useModuleBase()` from `lib/sites.ts` for every link, so links don't drop the brand
- **Settings → Integrations:**
  - New page `app/[role]/settings/integrations/page.tsx` with `components/Admin/Settings/SettingsIntegrations.tsx`.
  - The Apollo card has: masked key with a Replace option, Test connection, rate limits, monthly budget, and excluded domains.
  - Add the item in `components/Admin/Common/SettingsSubNav/SettingsSubNav.tsx`. This page is also where Hunter and Snov go in Phase 3.
- The CRM's source filter already lists distinct sources (`GET /leads/sources`), so "Apollo Lead Finder" appears there without extra work.

## Later phases (roadmap)
- **Phase 2: company websites.**
  - **Input:** a "Company list" search: paste or CSV domains, or pick CRM Accounts.
  - **Crawl:** extend `services/research.ts` to the homepage plus /contact, /about, /team and /careers. Respect robots.txt and fetch at most 1 request per second per domain.
  - **Extract:** generic emails, phones, socials, tech-stack hints and team names, stored on the Account.
  - **Find people:** send those domains to Apollo People Search (`q_organization_domains_list[]`) for decision-makers, then into the Phase 1 pipeline.
- **Phase 3: email-finder waterfall.**
  - `EmailFinder` adapters for Hunter (finder + verifier), Snov and People Data Labs.
  - They run in order when Apollo returns no email or an unverified one.
  - Keys go in Settings → Integrations. Each provider's credits go on the same ledger with its own budget.
  - The same adapters can also re-verify CRM emails before a campaign.
- **Later, optional:**
  - AI fit-scoring of saved leads with Gemini.
  - Phone reveal through an Apollo webhook (8 credits each).
  - Opening the module to customers, which needs Apollo partner approval, per-workspace keys and plan quotas in beta's `config/plans.ts`.

## Verification
1. **Stub test** `scripts/lead-finder-test.mjs` (same style as `scripts/hardening-test.mjs`):
   - **Setup:** a throwaway local DB, and `APOLLO_BASE_URL` pointed at a small stub server serving hand-written fixtures for search, bulk_match and usage-stats. Never commit real people's data.
   - **Pipeline assertions:**
     - A run saves N leads with Accounts, list membership and a timeline entry.
     - A rerun makes 0 enrichment calls.
     - The no_email, duplicate and suppressed outcomes are recorded correctly.
     - The budget stop happens *before* the spend.
     - A 429 leads to a requeue.
     - An expired lease resumes from the saved page, and cancel works.
   - **Isolation and safety:**
     - A second org can't read runs or prospects, and a non-platform org gets 403.
     - **Zero `WorkflowEnrollment` rows are created.**
2. **Existing checks:** `npm run verify:tenancy`, `verify:sites`, `test:isolation`, `test:sweep`, `test:hardening`, `npx tsc --noEmit` (backend), and `npm run build` (admin).
3. **Live smoke test** with the real key:
   - **Where:** run the backend on **:5055 against local `rhinon_local`**. Grep `DATABASE_URL` first. Your :5002 dev server hot-syncs model edits into BETA, so warn before touching models while it runs.
   - **Steps:** Test connection (0 credits) → preview (0 credits) → run with `leadsPerRun=3` (≤3 credits).
   - **Check:** the leads are in the CRM with source "Apollo Lead Finder", a linked Account and the new list.
   - **Screenshots:** headless Chrome screenshots (≥500px wide) of Lead Finder and CRM Leads.
