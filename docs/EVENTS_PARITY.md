# Events — parity with Product Space

Goal (2026-09-25): the rhinon-cms Events module does **everything** Product
Space's does — backend, admin panel, scheduled jobs — adapted to multi-tenancy
and to uppercurve's pages. Sources:
`Product Space/tps-next-backend`, `Product Space/product-space-admin`.

Legend: ✅ done · ➖ out of scope (decided)

**Status: complete (2026-09-25).** Every row below is ✅ or a decided ➖.

## 1. Data model

| Product Space | rhinon-cms | Status |
|---|---|---|
| `Event` | `Event` | ✅ same fields and categories |
| `EventGuests` | `EventGuest` (+ `ownReferralCode`) | ✅ |
| `EventEmailTemplate` + `eventemailreminder` | `EventEmailTemplate` (template, audience, schedule and delivery state in one row) | ✅ |
| Enrollment emails (per status) | `EventEnrollmentEmail` (unique per event + type, optional calendar invite) | ✅ |
| `certificateTemplate` | `EventCertificateTemplate` | ✅ |
| `referralcode`, `referral` | each guest's `ownReferralCode`; referees carry the code they used | ✅ |
| `eventregistration` (registered *users*) | — | ➖ guests, not accounts (decided) |
| `leadEvent` | — | ➖ PS CRM link |

All three new tables are tenant-scoped (`TENANT_MODELS`).

## 2. Backend endpoints (`/events/...`, admin-only)

| Endpoint | Status |
|---|---|
| list (now with registration counts), past-events, slug-availability, slug/:slug, CRUD, publish, duplicate (copies enrollment emails + certificate), toggle-response, guests/by-id | ✅ |
| `POST /approve-guests` (emails Approved / Declined), `POST /send-notification` | ✅ |
| Reminder templates: create, list, read, edit, delete, schedule, cancel, test, send-now, audience counts | ✅ |
| Enrollment emails: list, upsert, delete, test | ✅ |
| Certificates: fonts, save, get, preview, email template, test email, approve, bulk-approve, generate, bulk-generate, download-url | ✅ |
| Feedback: list, CSV export (BOM + formula-injection guard) | ✅ |
| Referrals: with-referees, with-referees-by-slug, by-code | ✅ |
| `GET /type/:slug` | ✅ |
| `POST /by-name` | ➖ commented out in Product Space itself (dead code) |
| `POST /user`, `GET /user/:id` | ➖ guest equivalents below |

Public (`/public/...`), guest-token based: register (auto-approve for
Teardown/Hackathon, referral credit, enrollment email), check-guest-status,
WhatsApp link (approved only), guest page, feedback submit, certificate verify.

## 3. Jobs

| Job | Status |
|---|---|
| `eventEmailScheduler` → `dispatchDueEventEmails` in the per-minute cron: atomic claim, resumable delivery, 3 retries, stale-send recovery | ✅ |
| `91leads` event-guest sync | ➖ out of scope (decided) |

## 4. Admin panel

| Feature | Status |
|---|---|
| Events list: Upcoming / Past / Drafts / All views (`?view=`), counts, search, category filter, row menu, detail drawer | ✅ — covers PS's separate Past Events page |
| Add / edit event (full-page editor) | ✅ |
| Manage shell: publish, edit, view on site, duplicate, delete, 5 stat cards, `?tab=` tabs | ✅ |
| Overview: 21-day trend, breakdowns, accept-responses switch, setup checklist | ✅ |
| Guests: filters, bulk + waitlist actions, CSV, guest drawer (status, resend, feedback, certificate) | ✅ |
| Emails: enrollment email editors (with calendar invite) + reminder editor, schedule, test, send-now | ✅ |
| Referrals: table, referees drawer, approve referees | ✅ |
| Responses: workshop ratings / team submissions, approve all, CSV, response drawer | ✅ |
| Certificates: drag-and-drop designer, server preview, email, bulk approve, issue all with progress | ✅ |

## 5. Public site (uppercurve)

| Page | Status |
|---|---|
| Registration modal (status check on email, role fields, referral prefill from `?ref=`) | ✅ |
| `/events/[slug]/registered?token=` — status, calendar, WhatsApp, feedback, certificate, referral link | ✅ |
| `/events/[slug]/feedback?token=` — Workshop / Teardown / Hackathon forms | ✅ |
| `/certificates/[id]` — public verification, LinkedIn add, download | ✅ |

## Decisions (2026-09-25)

1. ✅ **Keep guest registration.** No website accounts; every account-bound
   feature is ported in its guest form, reached through an HMAC-signed link.
2. ✅ **Skip 91leads.** Product Space's own CRM vendor.
3. **Email sending**: through AWS SES from the site's brand, subject to the
   per-org sending work in `MULTI_TENANCY_PLAN.md` Phase 3.

## Product Space bugs deliberately not ported

- Send-now referenced an undefined `agenda`; retries could double-send (catch scope).
- Placeholder values were not HTML-escaped; some queries interpolated SQL strings.
- The referral report credited the wrong person.

## Deploy notes

- Backend: `npm install` (adds `@napi-rs/canvas`); `npm run build` copies the
  certificate fonts to `dist/assets/fonts`.
- Guest links in emails use the uppercurve Site's `siteUrl` (Settings → Sites);
  `UPPERCURVE_SITE_URL` is only the fallback. `EVENT_LINK_SECRET` is optional
  (defaults to the JWT secret; changing it invalidates links already sent).
- Tables are created by `sequelize.sync` at boot (already present on beta).
