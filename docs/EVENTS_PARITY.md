# Events — parity with Product Space

Goal (2026-09-25): the rhinon-cms Events module does **everything** Product
Space's does — backend, admin panel, scheduled jobs — adapted to multi-tenancy
and to uppercurve's pages. Sources:
`Product Space/tps-next-backend`, `Product Space/product-space-admin`.

Legend: ✅ done · 🟡 exists but partial · ❌ missing · ➖ out of scope (decided)

## 1. Data model

| Product Space | rhinon-cms | Status |
|---|---|---|
| `Event` | `Event` | ✅ same fields and categories |
| `EventGuests` | `EventGuest` | ✅ |
| `EventEmailTemplate` (per-event templates) | — | ❌ |
| `eventemailreminder` (scheduled sends) | — | ❌ |
| `certificateTemplate` | — | ❌ |
| `referralcode`, `referral` | — | ❌ (referrals read from guests only) |
| `eventregistration` (registered *users*) | — | ➖ out of scope — guests, not accounts (decided) |
| `leadEvent` | — | ➖ out of scope — PS CRM link |

## 2. Backend endpoints (`/events/...`)

Present in both: list, slug-availability, slug/:slug, create, get/put/delete :id,
publish, duplicate, toggle-response, past-events, guests/by-id, approve-guests,
referrals/with-referees, referrals/by-code, feedback/:eventId.

| Endpoint | Purpose | Status |
|---|---|---|
| `POST /:eventId/email/template` | create a reminder template | ❌ |
| `GET /:eventId/email/templates` | list an event's templates | ❌ |
| `GET/PUT/DELETE /email/template/:templateId` | read / edit / delete a template | ❌ |
| `POST /email/template/:templateId/schedule` | schedule a send | ❌ |
| `POST /email/template/:templateId/cancel` | cancel a scheduled send | ❌ |
| `POST /email/template/:templateId/test` | send a test to yourself | ❌ |
| `POST /email/template/sendEmailNow` | send immediately | ❌ |
| `POST /send-certificate-test-email` | certificate email test | ❌ |
| `GET /feedback/:eventId/export` | export feedback as CSV | ❌ |
| `POST /feedbackStatus`, `POST /user/feedback` | collect feedback | ❌ |
| `POST /referrals/with-referees-by-slug` | referral report by slug | ❌ |
| `POST /check-guest-status` | is this person registered | ❌ |
| `POST /get-whatsapp-link` | segment-aware WhatsApp link | ❌ |
| `GET /:slug/success/:userId` | registration success page data | ❌ |
| `GET /type/:slug`, `POST /by-name` | lookups | ❌ |
| `POST /user`, `GET /user/:id` | user-account registrations | ➖ out of scope — guest equivalents instead |

## 3. Jobs

| Job | Status |
|---|---|
| `eventEmailScheduler` — sends scheduled reminder emails | ❌ |
| `91leads` event-guest sync | ➖ out of scope (decided) |

## 4. Admin panel

| Feature | PS lines | rhinon | Status |
|---|---|---|---|
| Add / edit event | 2 forms | full-page editor (Editor/) | ✅ 2026-09-25 — also fixed unpublish not removing from public site |
| Manage event shell | 631 | 320 | 🟡 |
| Overview tab | 347 | 340 | ✅ |
| Guest tab | 501 | 331 | 🟡 |
| **Email tab** | 351 | — | ❌ |
| Reminder email editor (ReminderEmailV2) | 843 | 101 | 🟡 stub |
| Referrals + referral table | 358 | 195 | 🟡 |
| Approve referrer | yes | — | ❌ |
| Event responses + response table + workshop/hackathon dialogs | 354 | 132 | 🟡 |
| Guest lists | yes | — | ❌ |
| Enrollment email + slider + body box | yes | — | ❌ |
| Accept-response toggle | yes | inline | 🟡 |
| Certificate template editor + certificate email + test dialog | yes | 88-line placeholder | ❌ |
| Duplicate event | 287 | 250 | 🟡 |
| Past events page (list, manage, edit) | yes | — | ❌ |

## Decisions (2026-09-25)

1. ✅ **Keep guest registration.** No website accounts; every account-bound
   feature is ported in its guest form (success page by guest, etc.).
   Original question — **End-user accounts** (`/events/user`, `eventregistration`, success page by user):
   Product Space registers logged-in *users*; rhinon-cms registers *guests* by
   email. Porting means adding website accounts to a multi-tenant backend.
2. ✅ **Skip 91leads.** Product Space's own CRM vendor.
3. **Email sending**: reminders go through AWS SES from the org's domain
   (`rhinontech.in` today), subject to the per-org sending work in
   `MULTI_TENANCY_PLAN.md` Phase 3.
