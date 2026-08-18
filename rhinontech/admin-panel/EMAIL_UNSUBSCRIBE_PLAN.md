# Email Unsubscribe & Category Preference System Plan

This document outlines the architecture, database models, API contracts, email headers, and UI components for the Email Unsubscribe System across **Rhinon Tech Backend**, **Rhinonlabs Public Website**, and **Admin Panel**.

---

## 1. Executive Summary & Goals

The system ensures that every email dispatched through the Admin Panel (via Campaigns, Email Workflows, and Inbox) is compliant with global privacy and deliverability standards (GDPR, CAN-SPAM, Google & Yahoo 2024 Sender Guidelines).

Key capabilities:
* **Granular Email Types**: Opt-out preferences by email category (e.g. `marketing`, `workflow`, `sales_outreach`, `newsletter`) while keeping essential system (`transactional`) emails deliverable.
* **RFC 8058 One-Click Header Unsubscribe**: Include native `List-Unsubscribe` and `List-Unsubscribe-Post` headers so Gmail/Outlook render native top-bar unsubscribe buttons.
* **Custom Rhinonlabs Landing Page**: Redirects footer unsubscribe clicks to `https://rhinonlabs.com/unsubscribe?token=...` where recipients select a reason and optional feedback.
* **Automated Suppression Engine**: Pre-send checks in backend services prevent accidental dispatch to unsubscribed recipients.
* **Admin Visibility**: Visual badges, logs, and campaign stats in the Admin Panel UI.

---

## 2. Architecture & Components

```
+-------------------------------------------------------------------------+
|                              OUTGOING EMAIL                              |
| (Campaign / Workflow / Inbox) with List-Unsubscribe + Tokenized Footer   |
+------------------------------------+------------------------------------+
                                     |
           +-------------------------+-------------------------+
           |                                                   |
           v (Native Top Bar Click)                            v (Footer Link Click)
+---------------------------------------+           +---------------------------------------+
|  RFC 8058 One-Click POST Endpoint     |           |   Rhinonlabs Landing Page             |
|  POST /public/unsubscribe/one-click   |           |   https://rhinonlabs.com/unsubscribe  |
+-------------------+-------------------+           +-------------------+-------------------+
                    |                                                   |
                    +-------------------+-------------------------------+
                                        |
                                        v
                    +---------------------------------------+
                    |  Backend API & Database               |
                    |  EmailUnsubscribe model updated       |
                    |  Lead status updated to Unsubscribed  |
                    +---------------------------------------+
```

---

## 3. Email Category Taxonomy

| Email Type | Source Modules | Scope & Opt-Out Behavior |
| --- | --- | --- |
| `marketing` | Outreach Campaigns | Mass marketing, lead generation, product announcements. |
| `workflow` | Email Workflow Engine | Automated lead nurture, step-by-step sequences. |
| `sales_outreach` | Inbox Direct Emails | 1-to-1 direct outreach emails sent from the Inbox composer. |
| `newsletter` | Content / Blog Updates | Educational content, newsletters. |
| `transactional` | Auth / Payroll / Docs | Essential system emails (Password reset, onboarding, signed documents, payslips) — *Exempt from marketing opt-out*. |

---

## 4. Proposed File Changes & Implementations

### A. Backend (`rhinontech/backend`)

1. **`src/models/EmailUnsubscribe.ts`** *(NEW)*:
   * Fields: `id` (UUID), `email` (String, indexed), `emailType` (Enum: `marketing`, `workflow`, `sales_outreach`, `newsletter`, `all`), `reason` (String), `feedback` (Text), `campaignId` (UUID), `workflowId` (UUID), `ipAddress` (String), `userAgent` (String), `unsubscribedAt` (Date).

2. **`src/services/unsubscribeService.ts`** *(NEW)*:
   * `generateUnsubscribeToken({ email, emailType, campaignId, workflowId })`: Creates signed JWT token.
   * `generateUnsubscribeLink(email, emailType, context)`: Builds landing page URL.
   * `isUnsubscribed(email, emailType)`: Checks DB before email dispatch.
   * `recordUnsubscribe(data)`: Saves record and syncs `Lead` model status.

3. **`src/services/mailer.ts`** *(MODIFY)*:
   * Accepts `emailType`, `campaignId`, `workflowId`, `leadId`.
   * Automatically appends branded unsubscribe footer and RFC 8058 headers (`List-Unsubscribe`, `List-Unsubscribe-Post`).

4. **`src/routes/campaigns.ts`**, **`src/services/workflowEngine.ts`**, **`src/routes/inbox.ts`** *(MODIFY)*:
   * Attach relevant `emailType` to all dispatches.
   * Invoke `isUnsubscribed()` guard prior to sending email.
   * Log suppression events.

5. **`src/routes/public.ts`** *(MODIFY)*:
   * `GET /public/unsubscribe/verify?token=...`: Verify token & return recipient state.
   * `POST /public/unsubscribe`: Process reason submission from landing page.
   * `POST /public/unsubscribe/one-click`: Native RFC 8058 endpoint for 1-click header unsubscribes.

### B. Rhinonlabs Public Site (`rhinonlabs`)

1. **`app/unsubscribe/page.tsx`** *(NEW)*:
   * Client-side Next.js page at `/unsubscribe`.
   * Displays email address, category context (`Marketing`, `Workflows`, etc.).
   * Options: Unsubscribe from *this specific category* OR *all communications*.
   * Reason choices:
     - I receive too many emails
     - The content is no longer relevant to me
     - I never signed up for this mailing list
     - I prefer not to share
     - Other (with custom feedback text area)
   * Instant confirmation state upon submission.

### C. Admin Panel (`rhinontech/admin-panel`)

1. **Campaign & Lead UI** *(MODIFY)*:
   * Unsubscribe badges on lead profiles.
   * Unsubscribe count & rate in Campaign details.
   * Warning banner in Inbox if emailing an unsubscribed lead.

---

## 5. Verification & Testing Strategy

1. **Token & Link Verification**: Validate token creation and verification against invalid/expired signatures.
2. **One-Click Header Test**: Trigger test dispatch, verify `List-Unsubscribe` header presence and send `POST` request to `one-click` endpoint.
3. **Landing Page Submission**: Click footer link, submit reason on Rhinonlabs unsubscribe page, verify `EmailUnsubscribe` database insertion.
4. **Pre-Send Suppression Test**: Send follow-up campaign/workflow email to unsubscribed lead, verify system automatically skips dispatch.
