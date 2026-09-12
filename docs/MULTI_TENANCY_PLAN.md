# Multi-Tenancy Implementation Plan

**Branch:** `feat/multi-tenant-orgs` (from `beta`, fast-forwarded to `main`)

Turn rhinon-cms from a single-company tool into a multi-tenant product where any
business signs up, gets its own subdomain, and its people get real email addresses
on it:

```
Swiggy signs up  ->  org slug "swiggy"
                 ->  email domain  swiggy.rhinontech.in
                 ->  aman@swiggy.rhinontech.in   (sends AND receives)
```

Zero DNS work for the customer: we own `rhinontech.in`, so every subdomain is ours
to provision.

---

## Core decisions

### 1. Isolation is enforced by the framework, not by 850 `where` clauses

The codebase has **62 models**, **40 route files / 13k LOC**, ~**850** query call
sites. Hand-scoping each one is not a plan — one miss is a cross-tenant leak, and
`authorize()` lets every org's superadmin past every permission check, so a missed
`where` is reachable by a normal customer.

Instead: **AsyncLocalStorage tenant context + Sequelize global hooks.**

- `services/tenantContext.ts` holds `{ organizationId, userId, mode }` per request.
- `models/tenantScope.ts` registers which models are tenant-owned and installs
  global `beforeFind` / `beforeCreate` / `beforeBulkCreate` / `beforeUpdate` /
  `beforeDestroy` hooks that inject `organizationId` automatically.
- Queries outside a context (cron, webhooks, public routes) must declare
  themselves: `runAsSystem()` or `runForOrg(orgId)`. A tenant model queried with
  no context at all logs loudly, and throws when `TENANT_STRICT=true` — that flag
  is how we sweep the codebase for the sites the hooks can't reach.

Route-level `where: { organizationId }` still gets added where it clarifies intent,
but correctness does not depend on remembering it.

### 2. One org = one email subdomain

`Organization.emailDomain = "<slug>.rhinontech.in"`. Company emails are
`<prefix>@<emailDomain>`, which makes `companyEmail` globally unique for free
(subdomains can't collide) while `personalEmail` becomes unique **per org** — so
one human can belong to two orgs.

### 3. Platform org vs tenant orgs

Rhinon Tech is `isPlatform: true`. Modules that operate the platform itself
(`/deploy`, `/startup-ideas`, rhinonlabs `/analytics`) are gated behind
`requirePlatformOrg` so a customer's superadmin can't reach them.

---

## Phases

### Phase 1 — Tenancy foundation  ✅ DONE

- `Organization` model: `id, name, slug, emailDomain, customDomain, status, plan,
  apiKey, isPlatform, settings(JSONB), ses*` fields.
- `organizationId` on every tenant-owned model + associations.
- **Boot-time migration** (`services/tenancyMigration.ts`), idempotent, runs
  *before* `syncDatabase()`:
  1. create `organizations`, ensure the default `Rhinon Tech` org
  2. `ADD COLUMN IF NOT EXISTS organization_id` (nullable) on every tenant table
  3. backfill all existing rows to the default org
  4. swap global unique constraints for composite `(organizationId, …)` ones
  5. index + FK
  Only then does `sync({ alter })` run, so it can safely see NOT NULL columns.
- Tenant context + Sequelize global hooks + `TENANT_STRICT` sweep mode.
- Per-org provisioning service: roles (`superadmin`/`hr`/`employee`/`collaborator`)
  with permission grants, pipeline stages, workflow statuses, letter templates,
  API key.
- Reserved-slug list (`api`, `www`, `mail`, `admin`, `app`, `smtp`, `beta`, …)
  plus a blocklist hook for brand-squatting (`hdfc`, `icici`, …).

### Phase 2 — Signup + auth  ✅ DONE

- `POST /auth/signup` — one transaction: org -> roles -> superadmin user ->
  defaults -> API key -> JWT. SES provisioning fires after commit.
- Login disambiguates when a personal email exists in several orgs.
- `organizationId` derived from the **DB user**, never from a JWT claim
  (`authenticate.ts` already re-derives identity per request — org rides along).
- Per-org superadmin limit replaces the global one.
- Employee creation builds `<prefix>@<org.emailDomain>` instead of the hardcoded
  `@rhinontech.in`.
- Admin panel: `/auth/signup` page, live slug -> subdomain preview, org email
  domain shown wherever the suffix was hardcoded.

### Phase 3 — Email / SES per subdomain  ⚠️ PARTIAL — service written, inbound hardening outstanding

Two modes behind `SES_SUBDOMAIN_MODE`:

- `inherit` (default, zero AWS work): parent `rhinontech.in` is a verified domain
  identity, so SES permits sending from any subdomain and signs with the parent
  DKIM key. Inbound relies on wildcard MX + a catch-all receipt rule.

  > **Corrected 2026-09-12.** The original plan claimed the parent was "already
  > DKIM-signed and SPF-verified". It was not: SES had DKIM `NOT_STARTED` and the
  > domain had zero TXT records — no SPF, no DMARC — while sending ~2.5k/day, which
  > is why mail was going to spam. Easy DKIM, SPF, a custom MAIL FROM
  > (`mail.rhinontech.in`) and DMARC `p=none` have since been applied to the live
  > Route53 zone. **The wildcard MX on `*.rhinontech.in` still does not exist**, so
  > tenant subdomains cannot receive mail yet.
- `identity` (better): on signup call `CreateEmailIdentity(swiggy.rhinontech.in)`,
  then Route53-upsert the 3 DKIM CNAMEs, the MX record, and a custom MAIL FROM.
  Gives per-tenant DKIM `d=`, per-tenant DMARC, and reputation that doesn't pool.

Also in this phase (all missing today, all required before customers send):
- SNS **signature verification** on `/webhooks/ses-inbound` (it currently
  auto-confirms any SubscribeURL and trusts any POST).
- Scope inbound thread matching to the org — today it falls back to
  `subject ILIKE %…%` across *all* tenants, which is a live cross-tenant read.
- Drop inbound recipients that aren't ours instead of creating an inbox row per
  `to:` address.
- Bounce/complaint SNS topics -> per-org suppression; `Unsubscribe` becomes
  per-org.
- Per-org sending caps + a kill switch, since all tenants share one SES account
  and one reputation.

### Phase 4 — Headless public API

- Tenant resolver: `x-api-key` header or `/public/:orgSlug/...`.
- **Back-compat is mandatory**: rhinonlabs calls `/public/blogs` with no key today.
  Unkeyed requests keep resolving to the platform org so the live site doesn't go
  blank.
- API key lifecycle: rotate, revoke, hash at rest, per-key rate limit (there is no
  rate limiting anywhere in the app today).
- Tenant story for the other ~12 public endpoints (`web-leads`, `track`,
  `visitors`, open/click pixels, `unsubscribe`, `docs-access`, `schedule-call`).

### Phase 5 — White-label

Every outbound artifact says "Rhinon" today:
- onboarding/reset/offer emails (`services/emailTemplates.ts`)
- campaign shells + unsubscribe footer (`services/emailTemplate.ts`)
- offer letter / NDA / relieving letter name **Rhinon Tech Private Limited**
  (`services/letters.ts`)
- the AI sales agent is fed Rhinon's own sales memory (`config/salesMemory.ts`), so
  a tenant's AI-drafted outreach would pitch Rhinon Labs
- one fixed S3 `SIGNATURE_KEY`, so every org overwrites the same signature image

All become per-org settings.

### Phase 6 — Content model

`Blog.domain` (`rhinonlabs`|`uppercurve`) is **not** `organizationId` — those are two
brands of one org. Needs a `Site`/`Brand` entity under Organization rather than a
straight swap, plus a migration for existing uppercurve content and the uppercurve
site that calls `?domain=uppercurve` from another repo.

### Phase 7 — SaaS mechanics

`plan` and `status: trial` are columns nothing reads. Billing, seat/usage metering,
trial expiry, suspension handling, org export/delete, audit log, ownership transfer,
multi-org switching.

---

## Verification

- `TENANT_STRICT=true` + boot + exercise every module: any unscoped tenant query
  throws with a stack trace pointing at the call site.
- Isolation test: seed two orgs, run every GET route as org B, assert zero org-A
  rows come back.
- Backfill test: existing prod-shaped data lands on the default org, nothing
  orphaned, no unique-constraint violation on the second signup.
- `npm run build` in `rhinontech/backend` and `rhinontech/admin-panel`.
- Deploy to beta (`:5003`) against the beta DB before anything touches prod.

## Rollout

The migration is additive and idempotent, so it can land on beta and be re-run.
Nothing drops data. The one-way step is swapping unique constraints — those are
recreated as composite in the same transaction.

---

## Status after the first implementation pass

**Done.** Organization model; runtime `organizationId` on all 60 tenant-owned
models; AsyncLocalStorage context + per-model Sequelize hooks; boot migration
with backfill, index and unique-constraint swap; per-org provisioning; reserved
slugs; `requirePlatformOrg` on /deploy, /startup-ideas, /analytics; signup;
org-scoped login; per-org employee addresses; admin signup page.

**Verified** against a throwaway Postgres, over real HTTP:
`scripts/isolation-test.mjs` 20/20, `npm run verify:tenancy` 10/10, and a sweep
of 36 module endpoints reporting zero unscoped queries.

**Two bugs the boot found that reading could not:**
- `campaigns.organizationId` already meant the LinkedIn page URN. Renamed;
  the migration moves the live column before creating the tenancy one.
- `/workflows` had no authentication at all — an anonymous POST returned 201.
  Now guarded.

### Before this can be deployed

1. **Run it on beta first** (`rhinon-cms-beta`, :5003, its own database). The
   migration is idempotent and drops no data, but it does drop the legacy
   unique constraints, and that is the one step worth watching on real rows.
2. **Boot once with `TENANT_STRICT=true`** and exercise every module. Anything
   that reaches a tenant model outside a context throws with a stack trace
   instead of warning. That flag is what found /workflows.
3. **Check the orphan-row report** in the boot log. It should be empty; once it
   has been empty for a while, set `TENANCY_ENFORCE_NOT_NULL=true` to make the
   column NOT NULL.
4. `SES_SUBDOMAIN_MODE` stays `inherit` until the inbound work in Phase 3 lands.

### Next, in priority order

1. **Inbound mail (Phase 3).** This is the largest remaining hole and it is a
   live cross-tenant read today: `/webhooks/ses-inbound` verifies no SNS
   signature, auto-confirms any SubscribeURL, matches threads with
   `subject ILIKE %…%` across every tenant, and creates an inbox row per `to:`
   address without checking the recipient is ours.
2. **Public API back-compat (Phase 4).** rhinonlabs calls `/public/blogs` with
   no key; unkeyed requests must keep resolving to the platform org.
3. **Unsubscribe per org.** One global list means org A's unsubscribe silently
   blocks org B.
4. **White-label (Phase 5).** Every outbound artifact still says "Rhinon",
   including the AI sales agent's company knowledge.
