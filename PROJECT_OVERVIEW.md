# Rhinon Tech — Internal Company OS & Outbound Engine Blueprint

Rhinon Tech is a **private, internal "Company OS"** — a single admin platform that runs the
company's day-to-day operations (people, attendance, leave, payroll, performance, documents,
project work) **and** drives an **AI-powered outbound sales engine** (leads, campaigns,
multi-channel outreach).

This is **not** a public SaaS product. It is an internal tool used exclusively by Rhinon Tech
staff, gated by role-based access control.

This document describes the actual architecture as built (the `rhinontech/` workspace) and
doubles as a **UI/UX blueprint** for the admin dashboard.

---

## 1. System Architecture

The project is split into two independently deployable applications:

| App | Path | Role | Dev Port |
| --- | --- | --- | --- |
| **Admin Panel** | `rhinontech/admin-panel` | Next.js front-end (the dashboard UI) | `4200` |
| **Backend API** | `rhinontech/backend` | Express + PostgreSQL REST API + cron engine | `5000` |

The front-end talks to the backend over REST. A Next.js middleware (`proxy.ts`) decodes the JWT
auth cookie and enforces role-based routing before any page renders.

---

## 2. Tech Stack

### Front-end (`admin-panel`)
* **Framework:** Next.js 16 (App Router) with React 19.
* **Styling & UI:** Tailwind CSS v4, Radix UI primitives, `shadcn/ui` (see `components.json`),
  `lucide-react` + `react-icons` for iconography, `tw-animate-css`.
* **State & Auth:** Zustand for client state, `js-cookie` for cookie persistence, `jose` for JWT
  decoding.
* **Utilities:** `cmdk` (command menu / `Cmd+K`), `papaparse` (CSV lead import),
  `class-variance-authority` + `tailwind-merge` + `clsx` for styling ergonomics.

### Back-end (`backend`)
* **Runtime:** Node.js + Express 4, written in TypeScript (`ts-node-dev` in dev, `tsc` build).
* **Database:** PostgreSQL via **Sequelize** ORM (`pg`, `pg-hstore`). Schema is auto-synced on
  boot (`sequelize.sync({ alter })`); seed scripts populate roles, permissions, and demo data.
* **Auth:** `jsonwebtoken` (JWT, 7-day expiry) + `bcryptjs` for password hashing.
* **AI:** Google Gemini (`@google/generative-ai`, model **`gemini-2.5-flash`**) — including
  **Google Search-grounded** generation via the REST API for verifiable lead research.
* **Email:** AWS **SESv2** for sending, `mailparser` for parsing inbound replies, `nodemailer`
  as a transport helper.
* **Storage:** AWS **S3** (`@aws-sdk/client-s3` + presigned URLs) for avatars, documents, and
  campaign media.
* **Integrations:** LinkedIn API (organic posting), Slack & GitHub provisioning APIs.
* **Jobs:** `node-cron` for scheduled background processing.
* **Uploads / HTTP:** `multer` (multipart), `axios` (outbound HTTP), `cors`.

---

## 3. Authentication & RBAC

* **JWT in an `authToken` cookie.** The Next.js `proxy.ts` middleware decodes it on every request:
  unauthenticated users are redirected to `/auth/login`; expired tokens are cleared.
* **Role-based routing.** Every authenticated page lives under `/[role]/…` (e.g.
  `/superadmin/dashboard`). The middleware rejects URLs whose role segment doesn't match the
  user's role — except **superadmin**, who can preview the `hr` and `employee` experiences.
* **Permission model.** `Role` ↔ `Permission` is many-to-many (`role_permissions` join table).
  Permissions follow a `resource:action` convention (e.g. `payroll:write`, `outreach:read`,
  `provisioning:write`). The backend `authorize(permission)` middleware guards each route; the
  sidebar filters nav items by the user's permission set (mirrored into a `permissions` cookie).
* **Seeded roles:**
  * **Super Admin** — all permissions; can create roles/users and provision accounts.
  * **HR** — people, payroll, leave, performance, documents (no provisioning/settings).
  * **Employee** — own profile, own payslips, read-only team directory, leave/performance/docs.

---

## 4. Application Structure (Front-end Routes)

```
/auth/login                  Login
/onboard                     New-hire onboarding (set password via token)
/p/[projectId]               PUBLIC client project portal (no auth)

/[role]/dashboard            Command center
/[role]/inbox                Support / reply inbox
/[role]/employees            Team directory  ├─ /[id]  ├─ /new
/[role]/payroll              ├─ overview ├─ employees ├─ salary ├─ entry ├─ run
                             ├─ payslips ├─ deductions ├─ benefits
/[role]/work                 ├─ projects ├─ tasks ├─ clients ├─ team
                             ├─ my ├─ all ├─ attendance ├─ changes
/[role]/attendance           ├─ my ├─ logs ├─ approvals ├─ governance
/[role]/leave                ├─ requests ├─ approvals ├─ calendar ├─ policies
/[role]/performance          ├─ cycles ├─ goals ├─ reviews ├─ team
/[role]/documents            ├─ all ├─ requests
/[role]/outreach             ├─ leads ├─ campaigns ├─ templates ├─ manual
/[role]/provisioning         Account provisioning (Slack/GitHub/email)
/[role]/profile              ├─ info ├─ security
/[role]/settings             Roles, permissions, org settings
```

Backend routes mirror these modules: `/auth`, `/roles`, `/permissions`, `/employees`,
`/provisioning`, `/inbox`, `/payroll`, `/people`, `/tasks`, `/attendance`, `/dashboard`,
`/work`, `/leads`, `/campaigns`, `/outreach`, `/leave`, `/performance`, `/documents`,
`/linkedin`, `/ai`, `/webhooks` (SNS/SES inbound), and `/public`.

---

## 5. Data Model (Sequelize)

* **Identity & access:** `User` (rich HR + payroll + banking fields, onboarding token, avatar),
  `Role`, `Permission`, `RolePermission`.
* **People ops:**
  * Attendance — `Attendance`, `AttendanceRequest`, `AttendancePolicy`.
  * Leave — `LeaveType`, `LeaveBalance`, `LeaveRequest`.
  * Payroll — `Payroll`, `Payslip`.
  * Performance — `ReviewCycle`, `ReviewGoal`, `ReviewSubmission`.
  * Documents — `Document`.
* **Work / delivery:** `Project`, `Task`, `Subtask`, `TaskComment`, `TaskTag`, `ClientRequest`.
* **Communications:** `InboxConversation`, `InboxMessage`, `InboxEmail`.
* **Outbound engine:** `Lead`, `Campaign`, `CampaignTemplate`, `CampaignActivity`,
  `LinkedInToken`.

---

## 6. Feature Modules & Workflows

### Module A: Dashboard (Command Center)
High-level snapshot of company health: headcount (active vs. inactive), recent onboardings,
attendance/leave status, pending approvals, and outreach activity. Should surface async
"processing" states for the outreach engine.

### Module B: Team & Employee Management + Onboarding/Offboarding
* **Directory (datatable):** name, role, department, company email, status (`active`/`inactive`),
  joining date — filterable and sortable.
* **Employee profile:** full HR record — employment type, work schedule, location, compensation
  (annual + variable), salary structure (basic/HRA/TA/medical/other), deduction config
  (PF/PT/TDS), banking & statutory IDs (PAN, UAN, ESIC), and uploaded documents.
* **Onboarding flow:** create an employee → a company email (`firstname@rhinontech.in`) is
  generated → an onboarding token is issued → the new hire visits `/onboard` to set their
  password and complete their profile.
* **Offboarding:** mark inactive, disable company email, revoke tool access, archive the record.

### Module C: Provisioning (IT / Access)
Per-employee actions to provision external accounts: **Slack** invites, **GitHub** org
invitations, and company email. Integrations degrade gracefully (return `503`) when API
credentials aren't configured, so the UI must show "not configured" / "pending" states.

### Module D: Attendance
* **Self-service clock-in/out** with daily status (`present`/`absent`/`weekend`/`holiday`/`leave`).
* **Logs, approvals, and governance** views for admins; regularization via `AttendanceRequest`.
* **Auto clock-out cron** runs nightly at **10:00 PM**, closing any open sessions.

### Module E: Leave Management
Configurable `LeaveType`s and per-employee `LeaveBalance`s; employees file `LeaveRequest`s
(`Pending`/`Approved`/`Rejected`) with reason; managers approve/reject with a note. Includes a
team **calendar** and **policies** admin.

### Module F: Payroll
Salary structures live on the employee record and auto-generate payslips. A monthly `Payroll`
run (`draft` → `processed` → `paid`) computes gross/net across employees, producing per-employee
`Payslip`s. Sub-views: overview, salary setup, manual entry, run, payslips, deductions, benefits.

### Module G: Performance Reviews
Review **cycles** (`quarterly`/`annual`/`probation`), employee **goals** tied to a cycle, and
**review submissions** (reviewer → reviewee). Team view for managers.

### Module H: Documents
Employee document vault stored in S3 — typed as `offer_letter`, `contract`, `id_proof`,
`appraisal`, `nda`, or `other`. Supports **document requests** (admin asks an employee to upload
something) alongside direct uploads.

### Module I: Work / Project Delivery + Public Client Portal
* **Projects** (`Active`/`Paused`/`Completed`/`Pipeline`) with point-of-contact and notes.
* **Tasks** with status (`Pending`/`In progress`/`Done`), priority, estimates, due dates,
  recurrence, blockers, subtasks, comments, and tags. Views: my tasks, all, team, board/changes.
* **Client requests** (`ClientRequest`) flow in from the **public portal** at `/p/[projectId]`,
  which lets a client view their project and submit requests without logging in.

### Module J: Inbox (Reply / Support Management)
A centralized email inbox built on AWS SES inbound + SNS webhooks. `InboxConversation`s
(status `open`/`in_progress`/`resolved`/`closed`, priority `low`→`urgent`) hold threaded
`InboxMessage`s and can be assigned to a team member. This keeps outreach replies and support
mail inside the platform.

### Module K: Outbound Sales Engine ⭐
The platform's growth engine — an autonomous, AI-driven outreach system.

* **Leads:** rich B2B lead records (title, seniority, company, industry, employee count,
  location, website, LinkedIn, tech stack, keywords, email deliverability status, AI enrichment
  cache). Lifecycle: `New → Enriched → Enrolled → Emailed → Replied / Interested / Bounced /
  Unsubscribed`. CSV import via `papaparse`.
* **Templates:** reusable, channel-tagged message templates (Email/Cold Email, LinkedIn
  Post/Video/Article/DM/Connection) with `{{lead.*}}` variables and free-text **AI
  instructions**. Templates can be AI-generated from a prompt.
* **Campaigns:** tie leads + a template + a channel together, with a `Draft/Active/Paused/
  Completed` stage, a `dailyLimit`, a daily `runTime`, and `scheduleDays`.
* **The AI Sales Agent:** grounded in an **editable sales memory** (ICP, pain patterns, email
  philosophy, and a staged playbook — Stages 0–5). For each lead the agent:
  1. **Researches** the company using Google Search-grounded Gemini + live website scraping
     (`enrichLeadWithAI`), persisting verifiable facts (description, recent news, likely pain).
  2. **Detects the outreach stage** from the lead's `CampaignActivity` history.
  3. **Drafts** the next-stage email (`generateStagedOutreachEmail`) — under 120 words,
     operator tone, selling *visibility / efficiency / operational scale*, never "dashboard/AI".
     Drafts are saved as **pending review** and never auto-sent without approval gating.
* **Multi-channel dispatch:** Email/Cold Email via **AWS SES**; LinkedIn posts, videos, and
  articles via the **LinkedIn API** (`postToLinkedIn`, image-asset upload, post-stats polling).
* **Manual mode:** a dedicated `outreach/manual` view for one-off, human-driven sends.

### Module L: Settings & Profile
Settings manages roles, granular permissions, and org configuration. Profile lets each user edit
their own info and security (password) settings.

---

## 7. Automation & Background Jobs (`node-cron`)

The backend registers cron jobs on boot (`server.ts`):

* **Auto clock-out** — `0 22 * * *` (10:00 PM daily): closes any attendance sessions left open.
* **Outreach scheduler** — `* * * * *` (every minute): finds `Active` campaigns whose `runTime`
  and `scheduleDays` match the current time, then triggers the engine at
  `GET /campaigns/cron/run` (authorized via a `CRON_SECRET`).
* **Outreach engine** (`/campaigns/cron/run`): two phases per active campaign —
  **(A) Draft generation** for `Enrolled` leads without a draft (research → stage → draft), then
  **(B) Dispatch** of approved drafts via SES/LinkedIn, logging each step as a
  `CampaignActivity` (`Enrichment`/`DraftGenerated`/`OutreachSent`/`ReplyReceived`) and advancing
  lead status.

> **UI implication:** the dashboard must represent asynchronous states — "Researching",
> "Draft pending review", "Sent" — and visually distinguish AI-generated-but-unsent content from
> actually-dispatched messages.

---

## 8. External Integrations

| Service | Purpose | Notes |
| --- | --- | --- |
| **Google Gemini** | Lead research, email/template/social drafting | `gemini-2.5-flash`; Google Search grounding via REST |
| **AWS SES (v2)** | Outbound email + inbound reply capture | Replies parsed with `mailparser` into the Inbox |
| **AWS S3** | File storage (avatars, documents, media) | Presigned URLs |
| **AWS SNS** | Webhook delivery for inbound email | `/webhooks` route (text/plain parser) |
| **LinkedIn API** | Organic posting (posts/video/article) + stats | OAuth token in `LinkedInToken` |
| **Slack API** | New-hire workspace invites | Provisioning module |
| **GitHub API** | Org invitations | Provisioning module |

---

## 9. Environment & Local Development

* **Backend** (`backend/.env`): `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `CRON_SECRET`,
  `FRONTEND_URL(S)`, AWS credentials, and Slack/GitHub tokens. Run with `npm run dev`
  (port 5000). Seed with `npm run db:seed` (+ `db:seed:work`, `db:seed:comms`).
* **Front-end** (`admin-panel`): `npm run dev` (port 4200). Points at the backend via env config.

The seeded super-admin is **`prabhat@rhinontech.in`** (Prabhat Patra, Engineering), used as the
bootstrap account for creating additional roles and users.
