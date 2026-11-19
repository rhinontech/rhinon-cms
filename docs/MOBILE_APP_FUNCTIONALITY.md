# Rhinon Mobile App — Functionality Specification

**Purpose:** a function-level brief of what the Rhinon admin panel does, so we can decide what the mobile app should offer and brief the designer. It describes **what each screen must do, not how it looks**.

**Source:** derived from the admin-panel routes/components, the backend routes and models, and the existing `rhinontech/mobile` build (Expo SDK 58). Dated 2026-11-11.

---

## 0. How to read this doc

Each module lists:
- **What it is**: one line.
- **Screens**: what the designer needs to draw.
- **Actions**: what the user can do.
- **Data shown**: fields that appear.
- **Permission**: the `resource:action` gate (hide UI if missing; the backend always enforces).
- **Mobile priority**: 🟢 **MVP** (must have), 🟡 **Phase 2** (valuable), 🔴 **Web-only** (leave on desktop).

**Already built in `rhinontech/mobile`** (first cut): Login (+2FA), Home, Inbox (read/reply/star/archive), Team Chat (list + thread + send), CRM (pipeline board, leads list/detail, lead + deal forms, finder), Work (my tasks, projects, task detail/form, teams), Attendance, Leave, Approvals, Notifications, Roles & Permissions, Settings. Items marked ✅ below are already in the app and need design/polish, not new build.

---

## 1. Global / cross-cutting requirements

These apply to every screen. Ask the designer for them once, as a shared set.

### 1.1 Authentication & session
- Email + password sign-in. ✅
- **Two-factor (TOTP) step** after password if the account has 2FA enabled. ✅
- Forgot password → email link → reset password.
- Token stored securely (keychain/keystore). A 401 from the API signs the user out. ✅
- Sign out. Optional "sign out of all devices".
- **Collaborator (guest) accounts are refused** on mobile; they use the web portal. ✅
- Biometric unlock (Face ID / fingerprint) on app reopen. 🟡

### 1.2 Role- and permission-based UI
- Roles: **Super Admin, HR, Employee, Collaborator** (custom roles can be created).
- Permissions are `resource:action`. Navigation items, tabs, buttons and form fields appear only if the user has the permission. Permissions refresh live (no re-login).
- Designer must supply **"no access"** and **hidden-action** behaviour, not only the happy path.

### 1.3 Multi-tenancy and brands
- The user belongs to one **organization (workspace)**. Some modules are further split by **brand/site** (Inbox, CRM, Outreach, Automation, Analytics, Content).
- Needs a **brand switcher** wherever the data is brand-scoped, and a visible current-brand indicator.
- Platform-owner-only features (Workspaces, Deploy, Startup Ideas, Analytics, Content, Provisioning) must never appear for tenants.

### 1.4 Required states on every screen
Loading · Empty · Error (with retry) · Success/confirmation · Offline · Permission-denied. The project rule is that all admin flows have loading, empty, error and success states.

### 1.5 Platform behaviours
- Pull-to-refresh on every list. Pagination or infinite scroll on long lists.
- Search + filter on every list.
- Light / dark / system theme. ✅
- Deep links from notifications and emails into the exact screen (task, lead, thread, leave request).
- Push notifications (not built yet; see §16). 🟢
- Image and file picker (camera, gallery, files) and file preview/download.
- Date, time and timezone handling. **Business dates are IST.**
- Currency formatting (INR for payroll; deals carry their own currency).
- Rich-text *display* (descriptions, comments, emails). Email HTML is shown as **plain text**, never rendered as markup (security rule).
- Confirmation dialogs for destructive actions.
- Accessibility (dynamic type, screen reader labels, contrast).

---

## 2. Navigation structure (proposed)

The web sidebar has ~17 modules. A phone needs tab-bar + a "More" list.

| Tab | Contents |
|-----|----------|
| **Home** | Dashboard |
| **Work** | My tasks, projects, teams |
| **Inbox** | Email |
| **Chat** | Team chat + calls |
| **More** | Everything else, as a permission-filtered list |

**More** list (shown only if permitted): CRM · Attendance · Leave · Approvals · Payroll/Payslips · Performance · Documents · Meetings · Team directory · Hiring · Pages · Notifications · Profile · Settings.

Open question for design: does a user with many permissions get a reorderable tab bar?

---

## 3. Dashboard (Home) 🟢 ✅

**What it is:** the daily command centre for the signed-in user.

**Screens:** one home screen. Quick-action sheet.

**Show:**
- Greeting and today's date.
- **Today's attendance card**: status, clock-in time, elapsed time, break state. One-tap clock in/out.
- **Unread counters**: inbox, team chat, notifications, ideas.
- **My tasks**: due today, overdue, in progress.
- **Pending approvals** count (managers/HR): leave, attendance regularizations, reimbursements.
- **Team snapshot** (permitted): headcount, who is on leave today, who is clocked in.
- **CRM snapshot** (permitted): open deals, pipeline value, new leads.
- **Celebrations**: birthdays and work anniversaries.
- **New joiners**.
- Upcoming meetings today.

**Permission:** `dashboard:read`; each card gated by its own module permission.

---

## 4. Work (projects & tasks) 🟢 ✅ partly

**What it is:** project delivery. Tasks belong to projects and teams. The web version is a ClickUp/Wrike-style workspace.

### 4.1 My Tasks 🟢
- List grouped by status/due date: Overdue, Today, This week, Later, No date.
- Filters: status, priority, project, due date. Search.
- Quick actions: change status, mark done, change priority, reassign, set due date.
- **Create task** (quick-add + full form).

### 4.2 Task detail 🟢
**Fields:** title, description (rich text), status (custom workflow statuses per org, base set *Pending / In progress / Done*), priority (*Low / Medium / High*), assignee, creator, project, team, start date, due date, estimated hours, recurrence (*Daily / Weekly / Monthly*), tags, blocked-by, parent task, custom fields, linked lead/deal/account, "visible to guests" flag, completed-at.

**Sections:**
- Subtasks (add, tick, edit, delete).
- Comments with @mentions (add, delete).
- Attachments (upload, view, delete).
- Dependencies (add/remove blockers).
- Time tracking (log time entries, view total).
- Activity history (who changed what).

### 4.3 Projects 🟢
- List by status: *Active / Paused / Completed / Pipeline*. Filter + search.
- **Project detail:** overview (point of contact, notes, dates), task list, members/collaborators, files, progress.
- **Create / edit project.**
- Project **visibility**: workspace / team / private. Tasks inherit it. Super Admin sees all.
- Client collaborators (external guests) can be added; on mobile this is view-only. 🟡

### 4.4 Teams 🟡 ✅ partly
- Team list; team detail with members and their workload.
- Team's tasks.

### 4.5 Project views 🟡 / 🔴
The web offers **Board (kanban), Table, Calendar, Gantt, Files, Analytics, GitHub** views per project.
- 🟡 Board (swipe between status columns) and Calendar are worth having.
- 🔴 Gantt, bulk-edit table, analytics, GitHub commit grouping: leave on web.

### 4.6 Other Work screens
- **Client requests** (submitted via the public client portal): list, view, convert to task. 🟡
- **Work attendance / changes / commits**: 🔴 web-only reports.
- **Public client portal** (`/p/[projectId]`): a web page for clients; not part of the app.

**Permission:** `work:read`, `work:write`.

---

## 5. Inbox (email) 🟢 ✅ partly

**What it is:** shared company email on AWS SES, per brand. Includes outreach replies and support mail.

**Screens:** folder list, thread list, thread view, compose, search, brand switcher.

**Folders:** Inbox · Starred · Sent · Archive · Trash.

**Actions:**
- Read thread (plain text), view sender, date, attachments.
- **Reply / Reply all / Forward** ✅ reply only; the rest 🟢.
- **Compose new** (to, cc, bcc, subject, body, attachments, choose sending address). 🟢 (not built yet)
- Star, archive, trash, mark read/unread.
- Assign conversation to a teammate. 🟡
- Conversation status (*open / in progress / resolved / closed*) and priority (*low → urgent*). 🟡
- Download attachments. 🟢 (not built yet)
- Internal notes/comments on a thread. 🟡
- **AI Copilot** (suggested reply draft, summary). 🟡
- Bounce report. 🔴
- Per-user signature and company signature applied on send.

**Permission:** `inbox:read`, `inbox:write`.

---

## 6. Team Chat & Calls 🟢 ✅ partly

**What it is:** a Teams-style internal chat with channels, DMs, group chats, calls and meeting links.

**Screens:** conversation list, thread, new chat, channel/group info, call screen, meeting join.

**Actions:**
- Conversation types: **DM, group, channel**. Create, rename, add/remove members, leave.
- Send text, emoji, images, files. Reply in thread, react, edit, delete, @mention.
- Unread badges, unread filter, search messages, pin.
- **Presence** (online/offline) and typing indicator.
- **Voice/video calls**: 1:1 and group (WebRTC). Ring, accept, decline, mute, camera toggle, speaker, end. Needs native call UI and background ringing. 🟡
- **Meeting links**: create and share a link; guests join through `/meet/[token]` on the web.
- Screen share, background blur, call recording: 🔴 (desktop).
- Realtime: today polling; target is Socket.IO. Presence and active calls are in-memory on the server.

**Permission:** `chat:read`, `chat:write`.

---

## 7. Notifications 🟢 ✅

- Notification centre: list, unread state, grouped items (`groupKey` + `count`), tap to deep-link, mark one/all read.
- Types include task assigned, task due soon, task overdue, mentions, leave/attendance/reimbursement decisions, chat, inbox, CRM, hiring, events.
- **Notification settings**: per-category on/off (the backend has `GET/PUT /notifications/settings`).
- **Push notifications** with the same categories. 🟢

---

## 8. Attendance 🟢 ✅

**What it is:** self-service attendance, with admin governance on the web.

**My attendance (employee):**
- **Clock in / Clock out / Start break / End break.** Large, one-tap controls with a live timer.
- Today's status and hours worked.
- Monthly history (calendar or list): *present / absent / weekend / holiday / leave*.
- Stats: days present, average hours, late arrivals.
- **Regularization request**: pick a date, give the correct times and a reason, submit; track its status.
- Server auto-closes sessions left open at 10 PM.
- Location/geofence capture on clock-in. 🟡 (decision needed; see §19)

**Manager / HR:**
- **Team today**: who is in, out, on break, on leave. 🟡
- **Approvals** of regularization requests (approve/reject with note). 🟢
- **Attendance logs** (all employees, filterable), **governance/policies** (work hours, grace, weekends, holidays). 🔴 web-only.

**Permission:** `attendance:read`, `attendance:write`; approvals need manager rights.

---

## 9. Leave 🟢 ✅

**Employee:**
- **Balances** per leave type (total, used, remaining).
- **Apply for leave**: type, start/end date, half-day if supported, reason. Shows computed days.
- My requests list with status (*Pending / Approved / Rejected*) and manager's note; cancel a pending request.
- **Team calendar** (who is off when). 🟡

**Manager / HR:**
- **Approvals queue**: approve/reject with note. 🟢
- Team balances. 🟡
- **Leave types and policies** (create/edit types, accrual, carry-forward). 🔴 web-only.

**Permission:** `leave:read`, `leave:write`.

---

## 10. Approvals hub 🟢 ✅

One consolidated screen for managers/HR, to approve without opening each module:
- Leave requests · Attendance regularizations · Reimbursement claims.
- Each row: requester, summary, date, amount (where relevant), approve/reject with an optional note, bulk-approve. 🟡
- Badge count on the More tab.

---

## 11. Payroll & Payslips

### 11.1 Employee self-service 🟢
- **My payslips**: list by month; payslip detail (earnings, deductions, net, bank, paid status); **download/share PDF**.
- **Reimbursements**: submit a claim (category, description, expense month/year, amount, **receipt photo**); track status *pending / approved / rejected / paid* and payout method (*with payslip / direct*).
- Salary structure view (read-only): basic, HRA, TA, medical, other; deductions (PF, PT, TDS). 🟡
- Compensation history/revisions. 🟡
- Show payslip only after authentication (biometric re-prompt recommended). 🟡

### 11.2 Payroll admin 🔴 (read-only summaries 🟡)
Payroll overview, salary setup per employee, manual entry, **monthly payroll run** (*draft → processed → paid*), deductions, benefits, final settlements, compensation revisions. These are high-risk, dense and money-moving; keep on web. The mobile app may show read-only totals and a **reimbursement approve/reject** flow (already in Approvals).

**Permission:** `payslips:read` (employee), `payroll:write` (admin).

---

## 12. Performance 🟡

- **My goals**: list, create/edit, update progress, link to a review cycle.
- **My reviews**: self-review form and view of results when released.
- **Team reviews** (managers): reviewee list, write review, rating and comments.
- **Cycles** (*quarterly / annual / probation*) and admin overview. 🔴 web-only.

**Permission:** `performance:read`, `performance:write`.

---

## 13. Documents & e-signing

### 13.1 My documents 🟡
- Vault list typed as *offer letter, contract, ID proof, appraisal, NDA, other*; view/download.
- **Document requests** from HR: see what's requested, upload a photo/scan, submit.
- **Upload** a document (camera scan, file).

### 13.2 E-signing 🟢
Onboarding sends an **offer letter** and **NDA** for signature (`/sign-documents`).
- View document → **sign by typing or drawing** → submit; signed copy saved to the vault.
- Needs a mobile-friendly signature pad and a readable PDF viewer.

### 13.3 HR admin 🔴
All-documents view, bulk requests, letter templates (blocks, AI rewrite).

**Permission:** `documents:read`, `documents:write`.

---

## 14. People, Hiring & Onboarding

### 14.1 Team directory 🟢
- Searchable list; filter by department, role, status (*active/inactive*).
- **Profile card:** photo, name, role, department, company email, phone, joining date, manager, work location. Tap to **email, call, or chat**.
- Org chart. 🟡

### 14.2 Employee admin (HR) 🟡 / 🔴
- Create/edit an employee (full HR record: employment type, schedule, location, compensation, banking and statutory IDs PAN/UAN/ESIC, documents). 🔴 — sensitive, dense.
- **Offboarding** (mark inactive, exit checklist, relieving) and reactivate, resend onboarding, send password reset. 🟡 (simple actions OK)
- Account/email addresses, GitHub/Slack provisioning. 🔴

### 14.3 Own onboarding (`/onboard`) 🟢
A new hire sets a password and completes their profile from an email link. Must work in a mobile browser and, ideally, in-app: set password, personal details, upload documents, sign letters.

### 14.4 Hiring 🟡
- **Openings** list and detail; **candidate board** by stage; candidate profile with notes and resume.
- **My interviews**: upcoming interviews for the interviewer; **submit interview feedback** (rating and comments). This is the strongest mobile use case.
- Add candidate, create opening. 🔴

**Permission:** `people:read`, `employees:read/write`.

---

## 15. CRM 🟢 ✅ partly (per brand)

**What it is:** leads, accounts, deals and pipeline.

**Leads**
- List with search, status filter, saved views.
- **Lead statuses:** *New, Enriched, Enrolled, Emailed, Replied, Bounced, Unsubscribed, Interested.* **Lifecycle:** *New, Contacted, Engaged, Qualified, Unqualified, Customer.*
- **Lead detail:** name, company, title, email (+ deliverability status), phone, LinkedIn, website, industry, location, owner, source, notes, tags, AI enrichment summary, timeline of activity.
- **Actions:** call / email / WhatsApp from the app, add note, log activity, change status/lifecycle, assign owner, create task, convert to deal, edit, delete. ✅ create/edit
- Add lead via **business-card scan** or contacts import. 🟡
- Bulk convert, duplicate finder, CSV import. 🔴

**Deals**
- **Pipeline board** by stage (swipe columns); list view. ✅
- Deal fields: title, account, primary contact, owner, value + currency, stage, status (*Open / Won / Lost*), expected close date, lost reason, source, notes.
- Actions: create/edit, **move stage**, mark won/lost, add note/task, view timeline. ✅ create/edit

**Accounts** 🟡: company list and detail with related contacts and deals.
**Reports** 🟡: pipeline value, win rate, by-stage funnel (read-only charts).
**Stage settings, Lead Finder (Apollo search + queue)** 🔴 (finder is ✅ built but a web-first flow).
**Lead visits** (website visitor identification) 🟡 read-only.

**Permission:** `crm:read` (or `outreach:read`).

---

## 16. Outreach & Automation 🟡 / 🔴

**Outreach** (AI-driven outbound sales): campaigns, templates, contacts/contact groups, manual sends, LinkedIn publishing.
- 🟡 **Campaign list with stats** (sent, opened, replied, bounced), start/pause a campaign, **approve or reject pending AI drafts** (the strongest mobile use case: one-tap review).
- 🟡 Reply notifications from leads.
- 🔴 Create/edit campaigns, templates, import contacts, publishing calendar.
- The UI must distinguish **AI-generated-but-unsent** drafts from **dispatched** messages.

**Automation** (workflow builder): 🔴 canvas editor is desktop-only. 🟡 read-only list with active/paused toggle and enrollment counts.

**Permission:** `outreach:read/write`.

---

## 17. Chatbot (website chat & support) 🟡

**What it is:** the AI chatbot on customer websites (RAG), live agent handoff, tickets, help centre.

- 🟡 **Live chats**: agent inbox; take over from the bot, reply, close, transfer, see visitor details. Needs push alerts for new/handoff chats.
- 🟡 **Tickets**: list, open, reply, change status/assignee.
- 🟡 **Visitors**: who is on the site now (and a map). Read-only.
- 🟡 **Voice call** from an agent to a visitor (WebRTC).
- 🔴 Appearance, training sources, forms, help-center articles, campaigns, install guide.

**Permission:** `chatbot:read/write`.

---

## 18. Meetings & Calendar 🟡

- List of upcoming/past meetings (Google Calendar-synced).
- Detail: summary, description, location, start/end, attendees, **Meet link** (one-tap join).
- **Create/edit/cancel** a meeting with attendees; status; reminders.
- Calendar view (day/week/agenda).
- Google Calendar connection lives in Settings. 🔴 to configure.

**Permission:** `meetings:read/write`.

---

## 19. Pages (internal wiki / notes) 🟡

- Page tree/list, search, open a page (rich text, images, attachments).
- Edit on mobile (basic formatting), create page, share with people/links. Slash commands and block editing are 🔴 desktop-first.

**Permission:** `pages:read/write`.

---

## 20. Content & Events 🔴 (platform-only)

Blogs, case studies (block-based editor, per brand), AI writer, and **Events** (guest-token pages, enrolments, certificates, email templates).
- 🟡 Possible mobile extras: **event check-in** (scan a QR, mark attended) and a quick **blog preview/approve**.
- Everything else stays on web.

---

## 21. Startup Ideas & Analytics (platform-only) 🟡 / 🔴

- **Startup Ideas:** submissions from the `/build` campaign; stay out of CRM until converted. 🟡 list + read + status change, with unread badge.
- **Analytics:** website traffic (overview, timeseries, sources, top pages, visitor map). 🟡 read-only summary cards; 🔴 detailed dashboards and setup.

---

## 22. Platform & Settings

### 22.1 Profile 🟢
- View/edit own info (name, phone, photo, address, emergency contact).
- **Security:** change password, **enable/disable 2FA** (TOTP QR + backup codes), active sessions.
- Appearance (theme), notification preferences, language/timezone, app version, sign out. ✅ partly

### 22.2 Roles & permissions 🟡 ✅
- Role list, role detail with permission toggles, create role, assign users.
- Super Admin only. Changes apply live.

### 22.3 Platform-only / admin 🔴
Accounts, audit log, billing, data, deploy, developers/API, email domain, Google Calendar, governance, letter templates, provisioning, docs access, **Workspaces** (tenant management). Keep on web.
- 🟡 Audit log read-only view is a possible nice-to-have.

---

## 23. Role-by-role cheat sheet (what each persona sees)

| Persona | Primary mobile jobs |
|---------|---------------------|
| **Employee** | Clock in/out, apply leave, view payslips, submit reimbursement, my tasks, chat, directory, documents/e-sign, goals |
| **Manager** | Everything above + approvals hub, team today, team reviews, interview feedback, project/task management |
| **HR** | Approvals, document requests, offboarding actions, hiring pipeline, team directory, leave/attendance oversight |
| **Sales / CRM user** | Pipeline, leads, log calls/notes, inbox replies, outreach draft approval |
| **Support agent** | Chatbot live chats, tickets, inbox |
| **Super Admin** | All of the above + roles/permissions, notifications, light platform monitoring |
| **Collaborator** | **Not supported on mobile** (web portal only) |

---

## 24. Backend/API gaps to plan for

Things the mobile app needs that are missing or only partly present:

1. **Push notifications**: device-token registration endpoint, delivery service (Expo Push/FCM/APNs), per-category preferences.
2. **Realtime**: move chat/inbox from polling to Socket.IO.
3. **Attachments**: upload/download for inbox, chat, tasks, documents (presigned S3).
4. **Native calls**: CallKit/ConnectionService, background ringing; currently static TURN credentials in the client.
5. **Offline/queueing**: at least for clock-in/out, task edits, and reimbursement drafts.
6. **Deep-link scheme** and universal links.
7. **App versioning/forced-update** check endpoint.
8. **EAS build config**, app icons and splash, store listings.
9. **Biometric re-auth** for payslips and sensitive screens.

---

## 25. Suggested release phases

**Phase 1 (MVP)**: auth + 2FA, Home, Attendance, Leave, Approvals, My Tasks + task detail, Notifications (+ push), Payslips and reimbursements, Team directory, Inbox (compose, attachments), Chat, Profile and security.

**Phase 2**: Projects and board view, CRM (activity logging, call/email actions), Meetings, Documents and e-signing, Performance goals/reviews, Hiring interview feedback, Outreach draft approval, Chatbot live chat and tickets, Calls.

**Phase 3**: Pages, Accounts and reports, Analytics summary, Startup Ideas, event check-in, Audit log view.

**Never on mobile**: payroll run, workflow canvas, Gantt, template/content editors, provisioning, deploy, tenant management, role-heavy admin forms.

---

## 26. Open decisions for the product owner

1. Should clock-in capture **location** or enforce a **geofence/Wi-Fi**? (privacy + policy)
2. Do we allow **payroll/reimbursement approvals** from mobile? (currently reimbursements only)
3. How much **CRM editing** should mobile allow vs. read/log only?
4. Is **calling** (chat and website visitors) required for launch, or Phase 2?
5. **Offline support**: which actions must work with no network?
6. **Brand switching** UX: global switcher or per-module?
7. Should mobile include **platform-owner** tools (Workspaces, Startup Ideas) or stay tenant-facing?
8. Distribution: public store listing vs. private/TestFlight/MDM, since this is an internal tool.
