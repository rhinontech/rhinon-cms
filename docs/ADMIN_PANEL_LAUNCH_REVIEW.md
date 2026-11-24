# Rhinon Tech admin panel: launch readiness and product direction

| | |
|---|---|
| Date | 24 November 2026. Updated 25 November 2026 with user feedback on the experience, now the top priority |
| Scope | The admin panel (`rhinontech/admin-panel`) as sold to customer workspaces, plus the backend, email, legal and marketing surfaces it depends on |
| Code reviewed | `main` at `4eb547e` |
| Live checks | rhinontech.com, www.rhinontech.in, api.rhinontech.in, public DNS, AWS SES (read-only), GitHub Actions. All on 24 Nov 2026 |
| Not done | Production database analysis (blocked by this session's permission policy), customer interviews, click-through UI testing. See section 10 |

Terms used: **workspace** = one customer organisation (tenant). **Platform workspace** = Rhinon's own. **MX record** = the DNS entry that tells the internet where to deliver a domain's email. **DPA** = data processing agreement.

---

## 1. Verdict

**Not ready for open self-serve signups yet.** The gap is not features. In sales and delivery, the product is broader and deeper than most early-stage suites. Two things hold it back:

- **The experience of finding your way around it.** This is the top priority, from user feedback.
- **The platform layer around the features:** email that customer workspaces can neither receive nor send safely, public promises the product does not keep, legal links that point nowhere, and a CI pipeline that stopped checking tenant isolation a month ago.

Signup is already open at rhinontech.in, and rhinontech.com says "Get started free". These are live risks, not future ones.

### Top priority: landing and navigation (user feedback)

Feedback received on 25 November 2026: *"The product is nice, but the user experience is very bad. People should land on the dashboard and know exactly what to do, without being confused about what is where."*

It is one person's feedback, but the code backs it up ([Priority 1](#priority-1-landing-and-navigation-user-feedback)):

- **The landing page leads nowhere.** Everyone lands on a dashboard that shows HR figures. It has no pending items, no next steps and no links into modules.
- **Labels disappear.** The sidebar shows labels only on the dashboard. Inside any module it shrinks to a rail of unlabelled coloured icons.
- **The menu is a flat, confusing list.** It has 15–17 top-level items, and the names differ from the website's and clash with each other: Team vs Teams, two kinds of Campaigns, Leads vs Contacts, Pipeline vs Deals.
- **Sub-menus run deep.** One has up to 28 items, and approvals are split across four places.
- **No search, and a meaningless switcher.** A brand switcher sits in the logo spot, which means nothing to a customer with one brand.

**The plan:**

- a new Home that lists what needs each person's attention, with one click to act;
- a sidebar grouped Sell / Deliver / People, using the website's names, with labels always visible;
- one name per thing;
- ⌘K search.

### Stop-ship safety issues (Tier 0): fix alongside the experience work

1. **The pricing page and the Terms promise "no seats to count" and "free for your whole team". The product caps Free at 5 people, 50 emails and 20 AI drafts a day.** ([G0.1](#g01-public-promises-contradict-the-product-and-the-terms))
2. **Customer mailboxes can't receive email.** There is no MX record for `*.rhinontech.in`, and the SES receipt rule only accepts the apex domain. Replies to a customer's outreach, mail to their support@, and ticket replies all bounce. ([G0.2](#g02-customer-mailboxes-cant-receive-email))
3. **One customer can stop email for every customer.** All workspaces share one DKIM reputation and one SES account with Rhinon's own password resets and payslips, and complaints are not tracked at all. ([G0.3](#g03-one-customer-can-stop-email-for-every-customer))
4. **Signup asks people to accept Terms and a Privacy Policy that aren't linked, and there is no DPA** for the HR and payroll data customers will upload. ([G0.4](#g04-legal-documents-arent-wired-in-and-theres-no-dpa))
5. **CI has failed 82 times in a row since 23 October.** The tenant-isolation and strict-tenancy suites have been skipped for all 165 commits since. ([G0.5](#g05-tenant-isolation-checks-havent-run-for-a-month))

### Direction

Stop positioning as a free all-in-one suite. Sell the **client lifecycle to Indian B2B service businesses**:

- **attract:** Chatbot, Outreach
- **win:** CRM, Inbox, Automation
- **deliver:** Work and the client portal

HR, payroll, chat and pages stay in the product as tools for the customer's own team, not the headline. Section 3 explains why.

### This week

- [ ] Run a 5-person first-click test on the current app, to get a baseline before changing anything ([validation](#how-to-validate-it)).
- [ ] Ship the navigation quick wins: a sidebar grouped Sell / Deliver / People, the website's names, labels always visible, and no brand switcher for one-brand workspaces (U2, U3, U5).
- [ ] Agree the new Home layout and start the `/home/summary` endpoint behind it (U1).
- [ ] Decide whether to gate signup (invite code or waitlist) until Tier 0 is closed. **Recommended:** gate it, or at minimum turn off cold outreach for workspaces created from now on.
- [ ] Make the pricing page, homepage description and Terms §4 state the real Free limits (G0.1).
- [ ] Add the `*.rhinontech.in` MX record and a `.rhinontech.in` receipt-rule recipient, then test inbound mail to a fresh workspace (G0.2).
- [ ] Set `TERMS_URL`, `PRIVACY_URL` and `REQUIRE_TERMS_ACCEPTANCE=true` on the server (G0.4).
- [ ] Fix the 4 stale tests, move the isolation suite into its own job, and protect `main` (G0.5).

---

## 2. What exists today

### 2.1 Facts

| Area | Finding | Evidence |
|---|---|---|
| Size | 141 admin pages, 632 API route handlers, 94 models. About 84k lines of admin TypeScript and 55k backend | file and `grep` counts, Appendix B |
| Team | 3 human commit authors in the last 90 days, 286 commits | `git log` |
| Customer-visible modules | Dashboard, Inbox, Chat, Pages, CRM, Outreach, Chatbot, Automation, Work, Team (people, hiring, attendance, leave, performance, documents), Payroll, Meetings, Analytics, Settings | [Sidebar.tsx#L66-L86](../rhinontech/admin-panel/components/Admin/Common/Sidebar/Sidebar.tsx#L66-L86), [permissions.ts#L69-L75](../rhinontech/backend/src/config/permissions.ts#L69-L75) |
| Platform-only | Content, Startup Ideas, Provisioning, Docs Access, Deploy, Workspaces console, Lead Finder, GitHub integration | [permissions.ts#L69-L75](../rhinontech/backend/src/config/permissions.ts#L69-L75), [leads.ts#L273](../rhinontech/backend/src/routes/leads.ts#L273) |
| Commercial model | Free forever. Starter and Enterprise only by emailing a request. The website chatbot is the only paid product, priced on a call. No checkout | [plans.ts#L41-L43](../rhinontech/backend/src/config/plans.ts#L41-L43), [billing.ts#L53](../rhinontech/backend/src/routes/billing.ts#L53) |
| Market | India-first: `en-IN` in 30 files, `₹` in 20, IST in 16, Indian payroll terms, "Made in India" in the site footer | `grep` counts |
| Hosting | One t4g.medium in Hyderabad runs the API (a single Node process), Postgres and the TURN server. The admin is on Vercel, served from Mumbai | infra notes; `x-vercel-id: bom1` |
| Engineering docs | [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md#L8) and AGENTS.md still say "not a public SaaS product" | — |

### 2.2 What's already right (don't rebuild it)

- **Plan enforcement in one place, ready for payments.** `applyPlan()` in [billing.ts](../rhinontech/backend/src/services/billing.ts) and atomic daily usage counters in [usage.ts](../rhinontech/backend/src/services/usage.ts).
- **Account hygiene that many startups ship late.** Audit log, workspace export, deletion with a 7-day grace period, TOTP 2FA, email verification before sending, a custom sending-domain flow, and account banners for plan blocks.
- **Tenant isolation in the ORM layer.** Sequelize hooks, plus an isolation suite and a strict sweep of 400+ routes (when they run: see G0.5).
- **Working cross-module flow.**
  - The chatbot and web forms create CRM leads.
  - A won deal converts to a project ([deals.ts#L310](../rhinontech/backend/src/routes/deals.ts#L310)).
  - Tasks link to leads, deals and accounts ([Task.ts#L50-L52](../rhinontech/backend/src/models/Task.ts#L50-L52)).
  - Clients follow their work in a portal.
- **Safe email handling.** Inbound email renders in a sandboxed iframe with no scripts ([EmailFrame.tsx#L105](../rhinontech/admin-panel/components/Admin/Outreach/shared/EmailFrame.tsx#L105)). Outreach carries one-click List-Unsubscribe headers ([mailer.ts#L120-L121](../rhinontech/backend/src/services/mailer.ts#L120-L121)).
- **A setup checklist on the Chatbot Overview** ([ChatbotOverview.tsx#L182](../rhinontech/admin-panel/components/Admin/Chatbot/ChatbotOverview.tsx#L182)). This is the pattern the rest of the product needs.
- **November performance fixes are live.** CORS preflight caching (`access-control-max-age: 7200`) and admin pages served from Mumbai.

### 2.3 Module scorecard

Ratings are for an external customer, not for Rhinon's own use.

| Module | Rating | What's there | What a customer will miss |
|---|---|---|---|
| Work + client portal | Strong | Table, board, calendar, Gantt, files, analytics, sprints, client portal, deal → project | No time-tracking UI (the API exists), no billing |
| CRM | Strong | Leads, accounts, deals board, pipeline stages, reports, saved views, duplicates, website-visit history, CSV import, split into lists | No record-level access; any reader can export everything (G2.2); no quotes or products |
| Chatbot (paid) | Strong | Training (sites, files, articles), RAG answers with a similarity floor, live chat and hand-off, forms, tickets, help center, pop-up campaigns, live visitors, agent calls | No ROI analytics; ticket replies don't thread back; calls drop on navigation; WhatsApp stubbed (G2.4) |
| Outreach + Automation | Usable | Campaigns, templates, AI drafts with approval, manual sends, contacts and lists, LinkedIn publishing, sequences (email, wait, if/then, A/B split, call/LinkedIn/manual tasks) | Deliverability and lead sourcing for customers (G0.2, G0.3, G2.5) |
| Team chat + Meetings | Usable | DMs, groups, channels, threads, calls of up to 8 people, guest meeting links, native calendar | Presence held in one process's memory; Google/Microsoft calendar connect unverified on prod |
| Pages | Usable | Page tree, editor with slash commands, attachments, sharing | Not deeply reviewed |
| HR & People | Usable for small teams | Directory, hiring and interviews, offer letter and NDA e-signing, documents, offboarding | Adding any user means HR onboarding (G1.1); no bulk import; plaintext PAN and bank details (G2.1) |
| Attendance & Leave | Usable, with visible dead buttons | Clock-in and breaks, logs, approvals, governance, leave types, balances, calendar | Q1, Q2 |
| Performance | Usable | Cycles, goals, reviews, team view | Not deeply reviewed |
| Payroll | Thin against the "built for India" claim | Salary structure, runs, payslips, reimbursements, settlements | No statutory compliance (G3.1) |
| Inbox | Thin against the "shared inbox" claim | Per-person mailbox, shared addresses owned by one person, compose and reply, internal notes, bounce report | No assignment; customer inbound mail broken (G0.2, G2.3) |
| Dashboard | Thin | Greeting, headcount, payroll total, attendance, birthdays, recent hires, pending tasks | HR-only; no next steps or links; no onboarding (U1) |
| Navigation: sidebar, menus, search | Thin | 15–17 sidebar items, a sub-menu per module, breadcrumbs, notifications bell | Flat ungrouped list; labels only on the dashboard; names differ from the website and clash; no search (U2–U5) |
| Settings | Usable | Roles matrix, plan and usage, email domain, activity log, data and privacy, 2FA, letter templates | No member invites, no ownership transfer; the Developers page does nothing for customers (Q5) |
| Workspaces console (platform) | Thin | List, plan, trial, people, flags; change plan or status; purge | No activity, health or abuse data (G2.9) |

---

## 3. Where the product should go

### 3.1 How it got here

The product was built as Rhinon's internal company OS. It was then:

- made multi-tenant (live on prod since 27 September 2026);
- hardened for selling in October 2026 (plans, audit log, export and deletion, 2FA, custom domains);
- marketed publicly at rhinontech.com as "Run your whole company from one workspace … Free for your whole team".

The breadth came from building what Rhinon itself needed. That is an asset, because everything is used daily. It is also a liability: three people now support 15 customer-facing modules.

### 3.2 What the market is told vs. what the product does

| Live claim | Where | What the product does (24 Nov 2026) |
|---|---|---|
| "No seats to count … For your whole team, with no time limit" | rhinontech.com/pricing | Free = 5 people ([plans.ts#L41](../rhinontech/backend/src/config/plans.ts#L41)), enforced when a sixth is added ([employees.ts#L131](../rhinontech/backend/src/routes/employees.ts#L131)) |
| "Every module except the AI website chatbot is free for your whole team, with no time limit" | Terms §4 | Same cap, plus 50 emails and 20 AI generations a day |
| "AI cold email that sounds like you wrote it" (in Free) | product menu | About 20 AI drafts a day on Free, sent from a shared `rhinontech.in` subdomain |
| "One shared inbox for replies and support" | product menu | Per-person mailbox with notes and no assignment. Customer addresses can't receive mail |
| "Your team gets real email addresses on its own domain — no DNS setup" | signup page | Sending works; receiving doesn't |
| "Payroll: monthly runs and payslips, built for India" | product menu | Manual TDS, flat professional tax, no ESI, no filings or bank files |
| "Voice calls from the website" | chatbot plan | Built, but the call drops when the agent leaves the Chatbot section |
| "Leads saved straight to your CRM" | chatbot plan | True |
| "Projects, tasks and a portal your clients love" | product menu | True, plus deal → project conversion |

The last two rows are the product's honest strengths. The first six are where a buyer will catch it out.

### 3.3 Options considered

| Option | The bet | Why it could win | Why it likely loses | Verdict |
|---|---|---|---|---|
| **A.** Free all-in-one suite (today's pitch) | Breadth beats specialists | One login, one bill | Competes with Zoho One (about ₹1,250–1,500 per employee per month for 45+ apps, third-party reported) and Bitrix24 (free plan with unlimited users, per Bitrix24). No paid engine, and support load across 15 modules | No |
| **B.** AI revenue workspace | CRM + Outreach + Inbox + Chatbot + Automation | The AI loop is already connected end to end, and every plan meter is here (sending, AI, chatbot, domains) | Crowded (HubSpot, Zoho, Apollo, cold-email tools), and deliverability is hard | The paid core of the recommendation |
| **C.** Client lifecycle for service businesses | B plus Work and the client portal: attract → win → deliver | The hand-offs already exist. Rhinon Labs is the archetype customer and uses all of it daily | Narrower market; will want time tracking and invoicing later | **Recommended** |
| **D.** HR and payroll first | India SMB HR | Large market | Compliance is the moat (Keka, greytHR, Zoho Payroll), and this is the product's thinnest module | No |
| **E.** Showcase for Rhinon Labs | The product as proof for services sales | No support burden | Leaves product revenue on the table | Valid only if services revenue is the priority. Then close signup |

### 3.4 Recommendation

**Who it's for.** Indian B2B service businesses with 5–50 people and founder-led sales: digital and software agencies, IT services firms, consultancies, and the first sales team at a B2B startup. Today they juggle a free CRM, a cold-email tool, Trello or ClickUp, WhatsApp and spreadsheets.

**The jobs it does.**

1. Find and reach the right prospects without a sales team (Outreach, Automation).
2. Never lose a lead or a reply (Chatbot, web forms, Inbox, CRM timeline).
3. Hand a won deal to delivery without retyping it (deal → project).
4. Keep clients informed without status calls (client portal).
5. Run a small team without five more tools (chat, pages, HR, leave, payslips, all included).

**Positioning (a draft to test).** "Win clients and deliver their work — in one AI workspace."

**Why this option.**

- **It is where the product is strongest** (section 2.3), and where the cross-module hand-offs already work.
- **It is where the money is.** Every plan meter that exists (emails, AI, chatbot, custom domain) sits on the revenue side.
- **Rhinon runs exactly this loop on itself.** In mid-November the platform workspace held 5,236 leads plus campaigns, inbox and a chatbot on rhinonlabs.com. Rhinon Labs is an agency.
- **HR and payroll in India are won on statutory compliance,** which would need a team Rhinon doesn't have (G3.1).
- **Three people can't support fifteen modules to specialist depth.** Picking a lead story decides where the next six months of depth goes.

**What changes.**

- Lead the site with Sell and Deliver. Move People under "Also included for your team".
- Give the app the same Sell / Deliver / People structure and the same product names as the website, so what people read before signing up is what they find after (U2).
- Stop calling payroll "built for India" until it handles statutory filings. Call it "salary runs, payslips and reimbursements".
- No new modules until Tier 0 and Tier 1 are done.

### 3.5 Packaging and pricing (hypotheses, not decisions)

| Plan | For | Includes | Price to test |
|---|---|---|---|
| Free | Teams trying it | Everything except the chatbot. Up to 5 people, 50 emails and 20 AI drafts a day, `<slug>.rhinontech.in` addresses. State these limits plainly | ₹0 |
| Growth (self-serve) | Teams of 5–50 | Per-person seats, own sending domain, higher send and AI limits, CRM record permissions, API and webhooks | ₹499–₹799 per person per month: below Zoho One's reported ₹1,250+, above free tiers |
| Chatbot add-on | Any plan | One brand's website bot, live chat, tickets, help center, a monthly pool of AI replies, overage per 100 replies | ₹2,999–₹4,999 per brand per month. Intercom's Fin charges $0.99 per resolution; treat that as a ceiling Indian SMBs won't reach |
| Enterprise | 50+ people or compliance needs | SSO, DPA changes, priority support | Talk to us |

**Keep the 5-person Free cap.** It is already more generous than HubSpot's free CRM (reported at 2 users) and Zoho CRM Free (3 users), and it limits abuse of free sending. The problem is the copy, not the limit.

**Validate the numbers before publishing them:** 10–15 interviews with companies in the target group, plus a pricing-page test.

---

## 4. Gap register

**Tiers**

| Tier | Meaning |
|---|---|
| P1 | Landing and navigation. User feedback, top priority; work starts in week 1 |
| 0 | Stop-ship safety issues. Mostly configuration; fix alongside P1, before sending more people to signup |
| 1 | Launch-critical. Activation and revenue, first 30 days |
| 2 | Within 90 days. Trust, retention, depth |
| 3 | Strategic bets. Build only with evidence |

**Effort** (one engineer who knows the codebase): **S** ≤ 2 days · **M** 3–10 days · **L** 2–6 weeks.

### Priority 1: landing and navigation (user feedback)

> "The product is nice, but the user experience is very bad. People should land on the dashboard and know exactly what to do, without being confused about what is where." (Feedback received 25 November 2026.)

That sentence describes two problems:

- **No direct path.** The landing page doesn't tell people what to do next.
- **No map.** The navigation doesn't tell people where things are.

#### What the code shows

| # | Finding | Evidence |
|---|---|---|
| F1 | Everyone lands on `/{role}/dashboard`, which is built for HR | [Login.tsx#L80](../rhinontech/admin-panel/components/Auth/Login/Login.tsx#L80), [app/page.tsx#L18](../rhinontech/admin-panel/app/page.tsx#L18). The dashboard shows headcount, "Total invested", clock-in, birthdays, anniversaries, recent hires and pending tasks. It has no pending approvals, replies or chats, and no links into modules. It also has a hardcoded shift and a dead button (Q1, Q2) |
| F2 | Labels disappear inside modules | The sidebar starts expanded only on the dashboard route ([DashboardProvider.tsx#L25](../rhinontech/admin-panel/components/Common/DashboardProvider/DashboardProvider.tsx#L25)). Everywhere else it is a rail of icons unless pinned or hovered ([Sidebar.tsx#L36](../rhinontech/admin-panel/components/Admin/Common/Sidebar/Sidebar.tsx#L36)) |
| F3 | One flat list that mixes jobs | 15 items for a customer owner and 17 for the platform, in this order: Dashboard, Inbox, Chat, Pages, CRM, Outreach, Chatbot, Automation, Work, Team, Payroll, (Content, Startup Ideas), Meetings, Analytics, (Workspaces), Settings ([Sidebar.tsx#L66-L86](../rhinontech/admin-panel/components/Admin/Common/Sidebar/Sidebar.tsx#L66-L86)). Meetings is 8 places away from Chat, and Pages sits between Chat and CRM |
| F4 | The app's names aren't the website's | The site groups products as Sell / Deliver / People and names them "HR & People", "AI Chatbot", "Team Chat & Meetings" and "Attendance & Leave". The app calls these "Team", "Chatbot", and "Chat" plus a separate "Meetings", and hides Attendance, Leave and Performance inside "Team" ([navConfig.ts](../rhinontech/admin-panel/components/Admin/Common/navConfig.ts)) |
| F5 | Names that clash or duplicate | "Team" (HR) vs Work → "Teams" vs Performance → "Team" vs team "Chat". "Campaigns" in both Outreach (email) and Chatbot (pop-ups). The same people are "Leads" in CRM and "Contacts" in Outreach, where "Contacts" are actually lists. The same deals appear as both "Pipeline" and "Deals" in the CRM menu. Work has "Projects" (opens the last project you viewed) and "All projects" (the list, at `/work/clients`). Conversations live in four places: Inbox, Chat, Chatbot → Live chats and Chatbot → Tickets. "Automation" is a separate module but holds outreach sequences |
| F6 | Deep, uneven sub-menus | Team has up to 28 items in nested groups ([TeamSubNav.tsx](../rhinontech/admin-panel/components/Admin/Common/TeamSubNav/TeamSubNav.tsx)). Settings has 14, Work 9, Chatbot 9 and Payroll 7. "Email addresses" (shared mailboxes) sits under Team, not Inbox or Settings |
| F7 | Approvals are on four screens | Attendance → Approvals, Leave → Approvals, Payroll → Reimbursements and Documents → Requests. A manager visits four screens to clear their queue, and nothing tells them the queue exists |
| F8 | A switcher in the logo spot | The brand switcher always renders top-left ([BrandSwitcher.tsx](../rhinontech/admin-panel/components/Admin/Common/Sites/BrandSwitcher.tsx)), even for a customer with one brand. In brand-scoped modules it silently changes the data. CRM has ignored it since 16 November but keeps the brand in its URL |
| F9 | No way to search or jump | No global search or command palette. `cmdk` is installed but used only in a combo box. No help entry. Breadcrumbs show only the module name ([SiteHeader.tsx#L35-L53](../rhinontech/admin-panel/components/Admin/Common/SiteHeader/SiteHeader.tsx#L35-L53)) |

#### The target experience

Open the app, see what needs you, and get to it in one click. If you're looking for something else, it's under Sell, Deliver or People with the same name as on the website, or you can type it into search.

#### U1. A new Home with a direct path (replaces the dashboard)

From top to bottom:

1. **Greeting, search and quick actions.** A search box ("Search or jump to… ⌘K", see U4) and up to four actions that depend on the person's role: Add lead, New project, Invite teammate, Request leave or Clock in.
2. **Setup checklist.** Shown to new workspaces until it's done, reusing the Chatbot checklist: verify email, invite team, import contacts or connect your website, send a first campaign or create a first project, install the chatbot. The first time the owner arrives, ask one question, "What do you want to do first? Win clients / Deliver projects / Run my team", and order the checklist and quick actions by the answer.
3. **Needs your attention.** One prioritised list across modules for this person. Each row shows a count and opens the exact screen:
   - approvals waiting: leave, attendance corrections, reimbursements, document requests;
   - replies waiting in Inbox;
   - website visitors waiting for a person, and tickets assigned to you;
   - tasks due today or overdue;
   - outreach drafts waiting for approval;
   - deals past their close date or idle for 14 days;
   - documents to sign.

   Only rows the person is allowed to see and that aren't zero appear. When there are none: "You're all caught up."
4. **Today.** Tasks due, meetings, clock-in (only if the workspace uses attendance, and using the person's real schedule) and leave balance.
5. **Your workspace.** Every module the person can use, grouped Sell / Deliver / People. Each tile has the website's name, a one-line description and one live number, for example "CRM: 18 open deals". This answers "what is where" on one screen, and returning users can collapse it.
6. **Team pulse** (owners and HR only). Who is in or out today. Birthdays and anniversaries move here from the top.

Remove from Home:

- "Total invested", which moves to Payroll → Overview;
- the hardcoded shift;
- the dead "Add regularisation" button.

**Backend.** One endpoint, `GET /home/summary`, returns permission-filtered counts and the top few items for each attention row. It reads tables that already exist: leave and attendance requests, reimbursements, document requests, tasks, unread inbox mail, chatbot hand-offs and tickets, deals, and outreach drafts. One request instead of ten matters, because production runs a single Node process.

Wireframe (owner, desktop):

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Good morning, Aman            [ Search or jump to…            ⌘K ]   │
│ [+ Add lead] [+ New project] [Invite teammate] [Request leave]       │
├──────────────────────────────────────────────────────────────────────┤
│ Get set up · 2 of 5 done   ✓ Verify email   ✓ Invite team            │
│                            ○ Import contacts ○ First campaign ○ Bot  │
├──────────────────────────────────────────────────────────────────────┤
│ Needs your attention                                                 │
│  3  leave requests to approve                          Review →      │
│  5  replies waiting in Inbox                           Open →        │
│  1  website visitor waiting for a person               Answer →      │
│  4  tasks due today, 2 overdue                         See tasks →   │
│  2  deals past their close date                        Update →      │
├───────────────────────────────┬──────────────────────────────────────┤
│ Today                         │ Your workspace                       │
│  10:30 Call with Acme         │  SELL     CRM · Outreach · Inbox ·   │
│  Clocked in 9:12 · 3h 20m     │           AI Chatbot · Analytics     │
│  Leave balance: 8 days        │  DELIVER  Work · Team Chat · Pages   │
│                               │  PEOPLE   HR & People · Attendance & │
│                               │           Leave · Payroll · Perf.    │
├───────────────────────────────┴──────────────────────────────────────┤
│ Team pulse: 12 in · 2 on leave · 1 birthday today                    │
└──────────────────────────────────────────────────────────────────────┘
```

**Done when** a new owner, an HR manager and an employee each see a different Home whose first item is something they need to do, every row opens the exact screen, and the HR widgets live on HR pages.

**Effort** M (1–1.5 weeks). This replaces G1.2.

#### U2. Navigation grouped like the website, with labels always visible

Proposed sidebar for a customer owner. Routes stay the same; only grouping, order and labels change.

```text
Home
Search                ⌘K

SELL
  CRM
  Outreach            Campaigns · Sequences · Lists · Templates · LinkedIn
  Inbox
  AI Chatbot
  Analytics

DELIVER
  Work
  Team Chat           includes Meetings
  Pages

PEOPLE
  HR & People         Directory · Hiring · Documents
  Attendance & Leave
  Payroll
  Performance

Settings
Help
```

The platform owner also gets a "Rhinon platform" section: Workspaces, Content and Startup Ideas.

Rules:

- **Names match the website exactly,** so the vocabulary is the same from ad to app.
- **Section headers always show.** On desktop the sidebar opens with labels by default. Collapsing it is the person's choice, and local storage already remembers that choice.
- **People see only the sections they have access to,** and empty sections are hidden. An employee sees roughly Home, Work, Team Chat, Pages, HR & People, Attendance & Leave, Payroll and Performance.

**Done when** every top-level item sits in a section, every label matches the website, and labels are visible on every page by default.

**Effort** S–M (2–4 days). Navigation config and permission mapping only.

#### U3. One name per thing

| Today | Change |
|---|---|
| CRM "Pipeline" and "Deals" | One "Deals" with a Board / List toggle |
| Outreach "Contacts" (which are lists) | "Lists" |
| "Automation" as a separate module | "Sequences" inside Outreach |
| Work "Projects" and "All projects" | One "Projects" list with Mine / All that remembers the last project. Redirect the hidden duplicates `/work/clients` and `/work/attendance` |
| Chatbot "Campaigns" | "Pop-ups" |
| "Team" (the HR module) | "HR & People", which also ends the clash with Work → Teams |
| "Email addresses" under Team | Move to Settings, next to Email domain |
| Approvals on four screens | One "Approvals" view, also fed into Home. The module pages stay |

**Done when** no two menu items open the same list, and no word means two different things.

**Effort** S–M. Routes stay, and redirects keep old links working.

#### U4. Search and jump (⌘K)

A search box in the header, and ⌘K anywhere, to:

- jump to any page ("payroll run", "leave policies");
- find records: leads, deals, accounts, projects, tasks, people, pages, inbox threads;
- run actions: "New lead", "Request leave", "Invite teammate".

`cmdk` is already installed. The backend needs `GET /search?q=`, scoped to the workspace, filtered by permission, returning the top five results per type.

**Effort** M.

#### U5. Show the brand switcher only when it matters

- Hide it for one-brand workspaces, which is every customer workspace today, and show the product logo and workspace name in that spot.
- With two or more brands, move it into the header of brand-scoped modules, with a visible chip such as "Showing: Rhinon Labs".
- Drop the brand from CRM URLs, since CRM is workspace-wide.

**Effort** S.

#### U6. Wayfinding polish

- Breadcrumbs show module › page, not just the module.
- Every module opens on an overview with next actions. Chatbot, Outreach and Work already do; CRM opens on a raw table.
- Every empty state has one sentence and one primary button.
- A "?" Help menu on every page (ties to G1.4).

**Effort** S each.

#### How to validate it

- **Before building:** run a 5-person first-click test on the current app, with eight tasks:
  1. add a lead;
  2. approve a leave request;
  3. find replies to a campaign;
  4. answer a waiting website chat;
  5. turn a won deal into a project;
  6. download your payslip;
  7. invite a teammate;
  8. change your plan.

  Record where each first click goes and how long each task takes.
- **After U1–U3:** rerun the same test. Targets: at least 80% first-click success, and a median under 15 minutes from signup to first key action.
- **In the product,** once the G1.5 events exist, track:
  - Home attention-row click-through;
  - ⌘K use;
  - "hunting": three or more sidebar clicks in 20 seconds with no action taken.

#### Sequencing

| Order | Items | When |
|---|---|---|
| 1 | Baseline first-click test | Days 1–2 |
| 2 | U2, U3, U5 (mostly configuration) | Week 1 |
| 3 | U1: new Home and `/home/summary` | Weeks 1–2 |
| 4 | U4: search | Week 3 |
| 5 | U6, then re-test | Week 4 |

Tier 0's safety fixes run alongside. G0.1, G0.2, G0.4 and G0.5 are each a day of work or less, and they still block opening signup.

### Tier 0: stop-ship

#### G0.1 Public promises contradict the product and the Terms

**Evidence**

- rhinontech.com/pricing (24 Nov): "No seats to count, no trial clock, no credit card." Free is described as "For your whole team, with no time limit."
- rhinontech.com/privacy-terms, Terms §4 (updated 7 Nov 2026): "Every module except the AI website chatbot is free for your whole team, with no time limit."
- The homepage description says "Free for your whole team."
- In code, Free is 5 seats, 50 emails a day, 20 AI generations a day and no chatbot ([plans.ts#L41](../rhinontech/backend/src/config/plans.ts#L41)).
  - Adding a sixth person returns HTTP 402 ([employees.ts#L131](../rhinontech/backend/src/routes/employees.ts#L131)).
  - Every Gemini call reserves an AI unit ([gemini.ts#L61](../rhinontech/backend/src/services/gemini.ts#L61)). A campaign draft or a lead enrichment uses one unit each.

**Why it matters.** A team of six that signs up because of the pricing page hits a 402 when adding its sixth person, at its moment of highest intent. Enforcing a cap the Terms say doesn't exist is a contract problem as well as a trust one.

**Fix**

1. Decide packaging (section 3.5).
2. Rewrite the pricing page, the FAQ, the homepage description and Terms §4 to state Free's limits in numbers.
3. Bump `TERMS_VERSION` so owners re-accept. The account banner already handles this.
4. Show the same numbers on Settings → Plan & usage, and say "Free", not "trial", in the platform console (Q7).

**Done when** the pricing page, the Terms and the in-app plan card show identical limits, and a test workspace adding a sixth person sees a message that matches the pricing page.

**Effort** S, once packaging is decided.

#### G0.2 Customer mailboxes can't receive email

**Evidence**

- **No MX for customer subdomains.** Public DNS (1.1.1.1 and 8.8.8.8, 24 Nov) shows `rhinontech.in` with `MX 10 inbound-smtp.ap-south-1.amazonaws.com`. Test subdomains (`zz-test-tenant.`, `randomtenant123.`) and the known beta workspace `techno.rhinontech.in` have no MX, so no wildcard exists.
- **Prod runs the default `inherit` mode.** SES identities in `ap-south-1` (read-only check, 24 Nov) are `rhinontech.in`, `uppercurve.in`, `saleszium.com` and one address. There are no per-workspace identities, so no per-workspace MX records were ever written ([sesProvisioning.ts#L56](../rhinontech/backend/src/services/sesProvisioning.ts#L56), [#L162](../rhinontech/backend/src/services/sesProvisioning.ts#L162)).
- **The design assumes a record that doesn't exist.** The file's header says inbound relies on a "wildcard MX on *.rhinontech.in … with a catch-all receipt rule". The gap was first noted on 12 September 2026 and is still open.
- **The receipt rule only accepts the apex.** The active SES rule `rhinontech-inbound` lists recipient `rhinontech.in` only. In SES, a bare domain matches addresses in that domain but not its subdomains.
- **Connected mailboxes are affected too.** Gmail and Outlook sends put the workspace address in Reply-To so threads land in the Inbox ([emailIdentity.ts#L63](../rhinontech/backend/src/services/emailIdentity.ts#L63)). Those replies bounce as well.

**Why it matters.** Every employee gets `name@<slug>.rhinontech.in`, and the signup page promises "real email addresses". Today:

- replies to a customer's outreach never reach their Inbox or CRM timeline;
- mail to their support@ bounces;
- ticket replies can't come back.

The Outreach → Inbox → CRM loop at the centre of the recommended direction is broken for every customer workspace.

**Fix**

1. In Route 53, add `*.rhinontech.in  MX 10 inbound-smtp.ap-south-1.amazonaws.com`.
2. Add `.rhinontech.in` (leading dot = all subdomains) to the `rhinontech-inbound` rule's recipients. Check that its S3 notification reaches `/webhooks/ses-inbound`, allowed by `SNS_ALLOWED_TOPIC_ARNS`. [inboundRouting.ts](../rhinontech/backend/src/services/inboundRouting.ts) already matches exact domains and drops unknown subdomains.
3. If you move to `identity` mode (G0.3), keep its explicit per-workspace MX. A wildcard doesn't apply to a name that has records beneath it, such as DKIM CNAMEs ([RFC 4592](https://www.rfc-editor.org/rfc/rfc4592)).

**Done when** mail from an outside Gmail account to `test@<new-workspace>.rhinontech.in` appears in that workspace's Inbox within a minute, and a reply to a test campaign lands on the lead's CRM timeline.

**Effort** S.

#### G0.3 One customer can stop email for every customer

**Evidence**

- [sesProvisioning.ts](../rhinontech/backend/src/services/sesProvisioning.ts), header comment: in the default mode "mail is signed d=rhinontech.in, so every tenant shares one DKIM reputation — one spammer's complaint rate is everyone's." Section G0.2 confirms prod runs that mode.
- There is no SES configuration set or event destination anywhere in the code.
  - Bounces are inferred by parsing MAILER-DAEMON notices that land in the Inbox ([bounceReport.ts](../rhinontech/backend/src/services/bounceReport.ts)).
  - Complaints are not captured at all.
- Rhinon's own system mail (verification, password reset, offer letters, payslips) goes out through the same SES account and domain.
- DMARC is `p=none` on `_dmarc.rhinontech.in` (24 Nov).
- Free allows 50 cold emails a day per workspace, and signup is open.

**Why it matters.**

- AWS places an SES account under review at a 5% bounce rate or a 0.1% complaint rate. It can pause sending for the whole account at about 10% bounces or 0.5% complaints.
- A pause stops every customer's mail and Rhinon's own password resets and payslips.
- Gmail asks senders to keep user-reported spam under 0.1% and never reach 0.3%.
- With free cold email and no complaint feed, AWS would tell you before your dashboards do.

**Fix**

1. **Feedback.** Create SES configuration sets with SNS event destinations for Bounce, Complaint, Reject and Delivery. Tag every send with its workspace. Suppress hard bounces and complaints immediately, and store 24-hour rates per workspace.
2. **Separate the streams.**
   - System mail gets its own identity (for example `notify.rhinontech.in`) and its own configuration set.
   - Customer mail moves to per-workspace identities (`SES_SUBDOMAIN_MODE=identity`, which the code already supports), so reputation is per workspace.
   - Consider a separate SES account for cold outreach.
3. **Guardrails.**
   - Pause a workspace's sending automatically when its 24-hour bounce rate passes 5% or complaints pass 0.1%.
   - Add CloudWatch alarms on the account's reputation metrics.
   - Show a "sending paused" banner.
4. **Free-plan policy.**
   - Cold outreach only after email verification.
   - Only to verified addresses (an `emailVerifier` service already exists).
   - A lower daily cap for the first two weeks.

**Done when** a test send to the SES mailbox simulator's complaint address produces a complaint event, suppresses that address, raises the workspace's complaint rate in the console, and pauses the workspace at the threshold, while password resets keep sending.

**Effort** M. Depends on G0.2.

#### G0.4 Legal documents aren't wired in, and there's no DPA

**Evidence**

- `GET https://api.rhinontech.in/public/legal` (24 Nov) returns `termsUrl`, `privacyUrl` and `dpaUrl` as `null`, and `acceptanceRequired: false`.
- The signup checkbox renders "Terms of Service" and "Privacy Policy" as plain text when the URLs are empty ([Signup.tsx#L270](../rhinontech/admin-panel/components/Auth/Signup/Signup.tsx#L270)).
- Acceptance is optional by default ([legal.ts](../rhinontech/backend/src/config/legal.ts)).
- The documents themselves exist at rhinontech.com/privacy-terms (updated 7 Nov 2026). No DPA or sub-processor list exists anywhere.

**Why it matters.**

- People agree to documents they can't open, which weakens the consent record.
- Customers who upload employees' PAN, bank and salary details are Data Fiduciaries under India's DPDP Act, and Rhinon is their processor.
- The Act's maximum penalty for failing to keep reasonable security safeguards is ₹250 crore. It falls on the fiduciary, who recovers it through the processing contract.
- Serious buyers will therefore ask for a DPA, a sub-processor list (AWS, Google Gemini) and breach-notice terms.
- The DPDP Rules were notified in November 2025. Most fiduciary obligations start around May 2027.

**Fix**

1. On prod, set `TERMS_URL` and `PRIVACY_URL` to the two sections of /privacy-terms, and set `REQUIRE_TERMS_ACCEPTANCE=true`.
2. Publish a DPA, a sub-processor list and a grievance and security contact. Link them from Settings → Data & privacy.
3. Have counsel review Terms §4 (see G0.1) and §8 (liability).

**Done when** `/public/legal` returns real URLs, the API rejects a signup without acceptance, and the DPA can be downloaded in-app.

**Effort** S for the configuration. Legal drafting is separate.

#### G0.5 Tenant-isolation checks haven't run for a month

**Evidence**

- In GitHub Actions, the last green Backend CI run was on 23 October 2026 at 14:00 UTC. There have been 82 consecutive failures since.
- The latest run fails 4 of 146 hardening checks: three expect Free to carry a trial deadline, and one covers an email-failure case.
- Because the hardening step fails first, "Strict-tenancy sweep", "Tenant isolation suite" and "Custom-domain flow" are skipped on every run ([backend-ci.yml#L63-L78](../.github/workflows/backend-ci.yml#L63-L78)).
- In that window: 165 commits by 3 authors, touching 122 backend source files (+10,890 lines). This includes new public routes for the client portal and web lead capture.
- The admin panel has no automated tests.

**Why it matters.** A leak of one company's HR or CRM data into another workspace is the worst incident this product can have. The suite built to catch one hasn't seen a month of changes.

**Fix**

1. Update the 4 tests to the current decision (Free has no deadline) and fix the email-failure expectation.
2. Run isolation, sweep and custom-domain as separate jobs, so one failing suite can't skip the others.
3. Turn on branch protection for `main`, requiring Backend CI.
4. Run the full suite against current `main` now, and fix anything it finds before launch.

**Done when** Backend CI has been green on 5 consecutive pushes, branch protection is on, and the sweep and isolation results are recorded.

**Effort** S.

### Quick fixes before launch (≤ 1 day each)

| # | Issue | Evidence | Fix |
|---|---|---|---|
| Q1 | Buttons that do nothing | Dashboard "Add regularisation" ([page.tsx#L447](../rhinontech/admin-panel/app/[role]/dashboard/page.tsx#L447)). Attendance Logs Export, filter and "Regularize Record" ([AttendanceLogsPage.tsx#L76](../rhinontech/admin-panel/components/Admin/Attendance/AttendanceLogsPage.tsx#L76), [#L103](../rhinontech/admin-panel/components/Admin/Attendance/AttendanceLogsPage.tsx#L103), [#L241](../rhinontech/admin-panel/components/Admin/Attendance/AttendanceLogsPage.tsx#L241)). Two download buttons on Attendance ([AttendancePage.tsx#L249](../rhinontech/admin-panel/components/Admin/Attendance/AttendancePage.tsx#L249), [#L544](../rhinontech/admin-panel/components/Admin/Attendance/AttendancePage.tsx#L544)) | Wire them up or remove them |
| Q2 | Hardcoded shift on the dashboard | "Shift: 9:00 AM – 6:00 PM" and "DEFAULT SHIFT" ([page.tsx#L388](../rhinontech/admin-panel/app/[role]/dashboard/page.tsx#L388), [#L406](../rhinontech/admin-panel/app/[role]/dashboard/page.tsx#L406)), although per-person work schedules exist | Read the person's schedule |
| Q3 | Stub pages | `/[role]/employees/new` and `/[role]/employees/[id]` render only a heading, and nothing links to them | Redirect to Team, or delete |
| Q4 | Dead component | `components/Admin/Inbox/Copilot/` isn't imported anywhere | Delete |
| Q5 | Developers page has no use for customers | The customer API key's only documented use is `GET /public/blogs` ([SettingsDevelopers.tsx#L139](../rhinontech/admin-panel/components/Admin/Settings/SettingsDevelopers.tsx#L139)), and Content is platform-only | Hide it for customers until G2.7 ships |
| Q6 | Upgrade cards hide the paid feature | `/billing/plans` returns `chatbots` and `botRepliesPerDay`, but the cards show only seats, emails, AI and domain ([SettingsBilling.tsx#L157-L160](../rhinontech/admin-panel/components/Admin/Settings/SettingsBilling.tsx#L157-L160)) | Add the chatbot lines |
| Q7 | The console still talks about trials | "On a live trial" and "Trials ended", although Free has no deadline ([usage.ts](../rhinontech/backend/src/services/usage.ts), `planState`) | Rename to Free / Paid / Suspended |
| Q8 | Admin is missing security headers | Admin responses carry only HSTS: no `frame-ancestors`/X-Frame-Options, `nosniff` or Referrer-Policy (24 Nov) | Add them in `next.config.ts` headers |
| Q9 | Stale engineering docs | PROJECT_OVERVIEW.md and AGENTS.md say "not a public SaaS product" | Update them so new code gets SaaS-grade care |

### Tier 1: launch-critical (first 30 days)

#### G1.1 Adding a teammate means HR onboarding, and default roles hide the sales suite

**Evidence**

- The only way to add a user is Team → add member, which asks for full name, personal email, role, department and joining date ([PeopleDirectory.tsx#L1512-L1532](../rhinontech/admin-panel/components/Admin/People/PeopleDirectory.tsx#L1512-L1532)).
- `POST /employees` requires all of these plus an email prefix ([employees.ts#L117-L121](../rhinontech/backend/src/routes/employees.ts#L117-L121)). It creates `prefix@<slug>.rhinontech.in` and emails a temporary password with the setup link ([employees.ts#L162](../rhinontech/backend/src/routes/employees.ts#L162)).
- A new workspace gets four roles: Super Admin, HR, Employee and Collaborator ([orgProvisioning.ts#L84-L106](../rhinontech/backend/src/services/orgProvisioning.ts#L84-L106)). Only Super Admin can reach CRM, Outreach, Inbox or Chatbot.
- Settings has no Members page ([SettingsSubNav.tsx](../rhinontech/admin-panel/components/Admin/Common/SettingsSubNav/SettingsSubNav.tsx)).

**Why it matters.** The pricing page's call to action is to bring your whole team. The first teammate a sales-led founder adds goes through an HR form, gets a mailbox, and lands somewhere they can't see the CRM. Fixing that means building a role from 44 checkboxes. Activation will stall at one user per workspace.

**Fix**

1. Add "Invite people": email plus role, mailbox optional. Keep it separate from "Add employee", which creates the HR record, and make the HR fields progressive.
2. Ship role templates: Admin, Sales rep, Sales manager, Project manager, HR, Employee.
3. Send an invite link only, with no emailed temporary password. Show seat usage in the invite dialog.

**Done when** an owner invites a "Sales rep" in under a minute, and the invitee lands in the CRM without any HR fields filled in.

**Effort** M.

#### G1.2 First-run experience: moved to Priority 1

Merged into [U1](#u1-a-new-home-with-a-direct-path-replaces-the-dashboard), which absorbs the onboarding question, the setup checklist and the module-aware dashboard. Signup still lands on `/{role}/dashboard` ([Signup.tsx#L127](../rhinontech/admin-panel/components/Auth/Signup/Signup.tsx#L127)); after U1 that route is the new Home.

#### G1.3 Customers can't pay

**Evidence**

- Plan & usage lists plans without prices. The "Request Starter/Enterprise" button emails the platform founder ([billing.ts#L53](../rhinontech/backend/src/routes/billing.ts#L53)).
- `applyPlan()` is ready to be called from a payment webhook ([billing.ts](../rhinontech/backend/src/services/billing.ts)), but no payment provider is integrated.
- The chatbot is priced "Talk to us".

**Why it matters.** Every upgrade waits on a conversation with the founder. The intent captured when someone hits a 402 is lost to an email.

**Fix**

1. Publish prices (section 3.5).
2. Integrate an Indian payment gateway with recurring payments (UPI AutoPay and cards), and call `applyPlan()` from its webhook.
3. Send GST invoices, and support cancelling and downgrading.
4. Put an Upgrade button in the existing plan-blocked banner ([AccountBanners.tsx](../rhinontech/admin-panel/components/Admin/Common/AccountBanners/AccountBanners.tsx)).
5. Keep "Talk to us" for Enterprise only.

**Done when** an owner upgrades with UPI or a card in-app, the plan changes within a minute through the webhook, and a GST invoice arrives.

**Effort** M–L. Depends on the packaging decision.

#### G1.4 No help or support inside the product

**Evidence.** The header has notifications, role preview and the profile menu, and nothing else ([SiteHeader.tsx](../rhinontech/admin-panel/components/Admin/Common/SiteHeader/SiteHeader.tsx)). The admin has no help link, documentation, contact option or support widget, and the repo has no customer documentation.

**Why it matters.** Self-serve users who can't ask a question leave quietly, and the team loses its cheapest feedback channel. Rhinon sells a chatbot and a help center but doesn't run them on its own product.

**Fix**

1. Put Rhinon's own chat widget in the admin shell, passing the workspace and plan.
2. Write 20–30 task articles: invite your team, import leads, connect your domain, your first campaign, your first payroll run.
3. Add a "?" menu with Help center, Contact support and What's new.

**Done when** every page offers help, and support chats arrive tagged with the workspace.

**Effort** S–M, mostly writing.

#### G1.5 Activation, retention and errors can't be measured

**Evidence**

- Neither app has a product analytics or error-tracking dependency.
- The platform console shows plan, trial, people, joined date and flags, but no last-active date, module usage or milestones ([PlatformWorkspaces.tsx](../rhinontech/admin-panel/components/Admin/Platform/PlatformWorkspaces.tsx)).
- Backend logs are pm2 text without timestamps.

**Why it matters.** After launch you won't know who activated, which module keeps people, or that a page is throwing errors. Every direction decision in section 3 stays a guess.

**Fix**

1. Create a first-party `product_events` table (workspace, user, event, properties). It fits the privacy policy's no-cookie stance.
2. Instrument about 15 events: `signup`, `invite_sent`, `invite_accepted`, `contacts_imported`, `campaign_sent`, `reply_received`, `deal_created`, `deal_won`, `project_created`, `portal_shared`, `chatbot_installed`, `first_bot_lead`, `payroll_run`, `upgrade_clicked`, `plan_blocked`.
3. Add error tracking to both apps. If it's a third-party tool, add it to the privacy policy's list of processors.

**Done when** a weekly activation funnel and a workspace health list can be produced without hand-written SQL, and new frontend or backend errors raise an alert within minutes.

**Effort** M.

#### G1.6 Approvals and assignments only notify inside the app

**Evidence**

- The notification service delivers over the socket and mobile push only ([notifications.ts#L66-L81](../rhinontech/backend/src/services/notifications.ts#L66-L81)).
- The leave, task, attendance and performance routes send no email.
- The mobile app has no app-store build configuration (no `eas.json`).

**Why it matters.** A manager who doesn't have the tab open misses a leave request, and an employee doesn't hear about an assigned task. HR modules only work when approvals move.

**Fix.** Add an email channel for actionable events (approval needed, assigned to you, mentioned), with a daily digest and per-category preferences.

**Done when** a leave request emails the approver with Approve and Reject links that work.

**Effort** S–M. Depends on the separate system-mail stream from G0.3.

### Tier 2: within 90 days

#### G2.1 Session and personal-data security is below what HR and payroll buyers expect

**Evidence**

- **Readable session token.** Client JavaScript sets the auth token as a readable cookie ([Login.tsx#L77](../rhinontech/admin-panel/components/Auth/Login/Login.tsx#L77), [Signup.tsx#L122](../rhinontech/admin-panel/components/Auth/Signup/Signup.tsx#L122)) and sends it as a Bearer header ([api.ts#L24](../rhinontech/admin-panel/lib/api.ts#L24)). The backend never sets an HttpOnly cookie.
- **No CSP.** The admin sends no Content-Security-Policy.
- **Raw AI HTML.** Outreach renders AI-generated HTML directly ([ActivityTab.tsx#L107](../rhinontech/admin-panel/components/Admin/Outreach/detail/ActivityTab.tsx#L107)). That text comes from Gemini reading third-party websites, so a prompt injection could become HTML inside the admin.
- **Plaintext identity and bank data.** PAN, bank account, IFSC, UAN and ESIC numbers are plaintext columns ([User.ts#L44](../rhinontech/backend/src/models/User.ts#L44), [#L287-L291](../rhinontech/backend/src/models/User.ts#L287-L291)). An AES-GCM helper exists ([totp.ts](../rhinontech/backend/src/services/totp.ts)) but isn't used for them.
- **No session control.** There's no session list and no "sign out everywhere".

**Why it matters.** Any XSS becomes a 7-day takeover of an owner account that holds payroll data. A leaked database or backup exposes employees' bank details and PAN. These are the first questions on any security questionnaire.

**Fix**

1. Move the session into an HttpOnly, Secure, SameSite cookie set by the API, with a CSRF token and refresh and revocation.
2. Add a nonce-based CSP: report-only first, then enforced.
3. Render AI-generated HTML in the sandboxed `EmailFrame`, or sanitise it.
4. Encrypt the PII columns through model getters and setters, with a key-rotation plan.
5. Mask PAN and bank details by default and reveal them only with `payroll:write`. Add a sessions page.

**Done when** `document.cookie` holds no token, the CSP is enforced with no violations, and a database dump shows ciphertext for the PAN and bank fields.

**Effort** M–L.

#### G2.2 The CRM has no record-level access, and any reader can export the whole book

**Evidence**

- Leads carry `ownerId`, but lists filter by owner only when the client asks ([leads.ts#L100-L111](../rhinontech/backend/src/routes/leads.ts#L100-L111)).
- `GET /leads/export.csv` is open to anyone with `crm:read` or `outreach:read` ([leads.ts#L43](../rhinontech/backend/src/routes/leads.ts#L43), [#L652](../rhinontech/backend/src/routes/leads.ts#L652)).
- Permissions are read and write per module only.

**Why it matters.** Sales teams expect reps to see their own records and managers to see everything. Right now, a departing rep can export every lead in one click.

**Fix**

1. Add a record scope per role (own, team or all) for leads, deals and accounts.
2. Add a separate `crm:export` permission.
3. Record every export in the activity log.

**Done when** a Sales rep role sees only its own records and can't export, and exports appear in the activity log.

**Effort** M.

#### G2.3 Inbox is a personal mailbox, not the "shared inbox" being sold

**Evidence**

- The live Inbox uses only `InboxEmail`. Each person sees their own address plus any addresses the owner assigned to them ([inbox.ts#L55](../rhinontech/backend/src/routes/inbox.ts#L55)).
- Internal notes exist ([#L243](../rhinontech/backend/src/routes/inbox.ts#L243)).
- There's no conversation assignment, no canned replies, no warning when someone else is replying, and no SLA. The older `InboxConversation` model has an `assignedToUserId` column, but nothing in the live Inbox uses it.
- Ticket assignment does exist, in Chatbot → Tickets.

**Fix**

1. **Now:** describe Inbox as "team email on your domain", and add "convert thread to ticket" so support work moves into Tickets.
2. **Later, if customers ask:** assignment, canned replies, and showing who else is viewing a thread.

**Done when** the copy matches the product, and a support@ thread can become an assigned ticket.

**Effort** S now; M–L later.

#### G2.4 The paid chatbot can't show its value yet

**Evidence**

- **What the Overview shows:** visitors online, chats, leads captured and AI answers today ([ChatbotOverview.tsx#L219-L225](../rhinontech/admin-panel/components/Admin/Chatbot/ChatbotOverview.tsx#L219-L225)).
- **What's missing:** an unanswered-question report, resolution or hand-off rates, and answer ratings. Retrieval already applies a similarity floor ([answer.ts#L157-L158](../rhinontech/backend/src/services/chatbot/answer.ts#L157-L158)), so the signal is there to build on.
- **Known open issues** ([CHATBOT_PORT.md](CHATBOT_PORT.md), [PLATFORM_CLEANUP_TODO.md](PLATFORM_CLEANUP_TODO.md) §1):
  - ticket email replies don't thread back;
  - TURN credentials are static inside the public widget;
  - calls drop when the agent leaves the Chatbot section.
- **WhatsApp hand-off** is stubbed to return `null` ([widget.ts#L143](../rhinontech/backend/src/routes/widget.ts#L143)).

**Why it matters.** This is the only product you charge for, and it has no ROI story (for example, "resolved 62% of questions, captured 40 leads"). Buyers will compare it with bots priced on outcomes.

**Fix**

1. Log retrieval confidence for every answer.
2. Add a "questions it couldn't answer" list with a one-click "add answer".
3. Show resolution and hand-off rates, add thumbs up and down in the widget, and email the owner a weekly report.
4. Issue TURN credentials from the server, and mount the call provider in the app shell so calls survive navigation.
5. Thread ticket replies once G0.2 is fixed.

**Effort** M.

#### G2.5 Outreach lacks deliverability tooling and a lead source for customers

**Evidence**

- Customers send from a subdomain that shares Rhinon's reputation unless they verify their own domain, which is a paid-only feature limited to one domain ([plans.ts](../rhinontech/backend/src/config/plans.ts)).
- Lead Finder is platform-only ([leads.ts#L273](../rhinontech/backend/src/routes/leads.ts#L273)).
- There's no domain-health page, no warm-up, and no verification step before imported addresses are enrolled.

**Why it matters.** Cold email from a new shared subdomain lands in spam, and customers will conclude that Rhinon's outreach doesn't work.

**Fix**

1. Add a domain-health page: SPF, DKIM and DMARC status, plus bounce and complaint rates per mailbox (from G0.3).
2. Require a verified own domain for sending volumes above Free.
3. Verify imported addresses before enrolment, and ramp each mailbox's daily cap.
4. Add import mappings for Apollo and Sales Navigator exports before building any lead database.

**Effort** M.

#### G2.6 Moving in is manual

**Evidence**

- CSV import exists only for leads.
- There's no bulk employee import and no project or task import.
- There are no importers for Zoho, HubSpot, Trello, Asana or ClickUp exports.

**Why it matters.** "Replace your stack" means moving data in. Nobody will add 30 employees through the HR form one at a time.

**Fix**

1. Bulk employee CSV import, with a preview and an option to invite on import.
2. CSV imports for projects, tasks, deals and accounts.
3. Mapping presets for common exports.

**Effort** M.

#### G2.7 No integration surface

**Evidence**

- The workspace API key only serves public content ([publicTenant.ts#L12](../rhinontech/backend/src/services/publicTenant.ts#L12)). Every CRM and Work route needs a user session.
- There are no outbound webhooks.
- Google and Microsoft mailbox and calendar OAuth credentials were listed as unset on prod in [PLATFORM_CLEANUP_TODO.md](PLATFORM_CLEANUP_TODO.md) §0 and are still unchecked there.

**Fix**

1. A v1 REST API with scoped tokens for leads, deals, contacts and tasks.
2. Outbound webhooks: `lead.created`, `deal.won`, `form.submitted`, `ticket.created`.
3. Later, a Zapier or Make app.
4. Complete Google's OAuth app verification. Sensitive scopes require it, and unverified apps are capped at 100 users.

**Effort** M–L.

#### G2.8 Reliability rests on one server with no outside monitoring

**Evidence**

- One t4g.medium runs a single Node process, Postgres and the TURN server. Beta shares the same box.
- Presence, calls and rate limits are held in that process's memory.
- Backups go to S3 nightly and are kept for 30 days. No restore has been rehearsed.
- There's no status page, no uptime alerting and no error tracking. A `/health/deep` endpoint exists.

**Why it matters.** One reboot or disk failure takes every customer down, and there's no recovery time or data-loss window you can promise.

**Fix**

1. External uptime checks and a public status page.
2. A timed restore drill every month.
3. WAL archiving for point-in-time recovery.
4. Move beta off the production box, and split the database from the app as workspaces grow.
5. A written incident process.

**Effort** M.

#### G2.9 The platform team can't see workspace health or stop abuse

**Evidence**

- Console columns: workspace, plan, trial, people, joined, flags.
- Console actions: change plan, status or trial, and purge ([platformOrgs.ts](../rhinontech/backend/src/routes/platformOrgs.ts)).
- There's no data on activity, usage, sending or AI cost. Impersonation is deliberately absent.

**Fix**

1. Add columns: last active, active users (7 days), milestones, emails sent, bounced and complained (7 days), and AI units (7 days).
2. Add actions: pause sending, reset limits.
3. Consider audited "view as" access for support, approved by the owner.

**Effort** M. Depends on G0.3 and G1.5.

#### G2.10 Workspace admin gaps

**Evidence**

- Each workspace has exactly one Super Admin ([employees.ts#L150](../rhinontech/backend/src/routes/employees.ts#L150)).
- Ownership can't be transferred.
- Modules can't be switched off per workspace, so every owner sees every module.
- There's no SSO (2FA exists).

**Fix**

1. Ownership transfer, confirmed by password and email.
2. An "Admin" role with settings access.
3. Per-workspace module switches that hide the nav item and return 404 on the route.

**Effort** S–M.

### Tier 3: strategic bets (build only with evidence)

| # | Bet | Evidence today | Recommendation |
|---|---|---|---|
| G3.1 | Statutory payroll | TDS is a manual monthly amount and professional tax a flat ₹200 default ([payroll.ts#L102](../rhinontech/backend/src/routes/payroll.ts#L102)). PF is a fixed 12% of basic with no wage ceiling. The ESI number is stored but no contribution is calculated. No tax regime, declarations, Form 16, ECR or challans, or bank file. Specialists sell compliance: Keka is about ₹10–13k a month for up to 100 employees, greytHR from ₹2,495 a month for 50 (vendor and third-party pages) | Reposition now: "salary runs, payslips, reimbursements; export for your CA". Add PF-ECR-ready and bank-transfer exports when three paying customers ask. Full compliance only after product-market fit in the core |
| G3.2 | WhatsApp | Widget hand-off is stubbed | Validate with design partners; likely the most-requested channel in India. Needs a WhatsApp Business Platform provider |
| G3.3 | Quotes, invoices, GST | None | Would close the agency loop (deal → quote → project → invoice). Integrate with or export to Zoho Books or Tally before building |
| G3.4 | Time tracking and billable hours | `TimeEntry` model and `/tasks/:id/time` API exist; no UI | Cheap for the value to agencies. The first Tier 3 item to pick up |
| G3.5 | Mobile app release | `rhinontech/mobile` exists; no app-store configuration | After web activation is fixed. First audience: employees (attendance, leave, approvals, chat) |
| G3.6 | Multiple currencies, time zones, languages | `en-IN`, `₹` and IST are hardcoded across 30, 20 and 16 files; no workspace settings | Only when selling outside India |
| G3.7 | SSO/SAML, SCIM | None | Wait for an enterprise deal that needs it |

**Won't build now:**

- in-house payroll compliance;
- invoicing or accounting;
- a proprietary lead database;
- a mobile-first rebuild;
- a marketplace.

Each is large, each has strong specialists, and none moves the core loop of the recommended direction.

---

## 5. Sequenced roadmap

| Phase | When | Items | Exit criteria |
|---|---|---|---|
| **Fix the experience (top priority)** | Weeks 1–4 | Baseline test; U2, U3, U5 (week 1); U1 (weeks 1–2); U4 (week 3); U6 and re-test (week 4) | Grouped sidebar using the website's names; a Home whose first item is the person's own pending work; ⌘K search; at least 80% first-click success on re-test |
| Stabilise (in parallel) | Week 1 | G0.1 (copy), G0.2, G0.4 (configuration), G0.5, Q1–Q9, signup-gating decision | CI green and protected; inbound mail works; legal links live; copy matches limits |
| Make sending safe | Weeks 2–3 | G0.3, G1.6 | Bounce and complaint events per workspace; auto-pause tested; system mail separated |
| Activate | Weeks 3–5 | G1.1, G1.4, G1.5 (G1.2 is now part of U1) | Invite flow live; help in the app; activation funnel visible |
| Monetise | Weeks 4–7 | G1.3, after pricing interviews | Self-serve upgrade with a GST invoice |
| Earn trust | Weeks 6–12 | G2.1, G2.2, G2.8, G2.9, G2.10 | A security questionnaire can be answered; restore drill passed |
| Deepen the core | Weeks 8–14 | G2.3–G2.7, G3.4 | Chatbot ROI view; imports; API and webhooks |

The week ranges assume the current three engineers spend about half their time on this list. They are for sequencing, not commitments.

One way to split the first month:

- **One engineer** owns the experience track end to end, Home and navigation.
- **One** takes the day-sized Tier 0 fixes, then G1.1.
- **One** takes G0.3, then G1.5. Home's attention list and the activation funnel both need those events.

---

## 6. Launch plan

1. **Now: invite-only.** Keep signup behind an invite code or a waitlist until Stabilise and Make sending safe are done. If signup must stay open, turn off cold outreach for new workspaces.
2. **Design partners (weeks 2–6).** Bring in 5–10 companies from the target group, drawn from Rhinon Labs' clients and network. Onboard each on a call and collect feedback weekly. Watch activation events and the questions people ask. Run the first-click test with them before and after the experience work, since that is the feedback this plan puts first.
3. **Open signup** once Activate and Monetise are done, with self-serve upgrade live, the help center live, and Free limits stated everywhere.
4. **Move each step on data.** Advance when at least 40% of design-partner workspaces reach activation (section 7) and there have been no Tier 0 or Tier 1 incidents in the previous two weeks. Both numbers are starting hypotheses; reset them once there's a baseline.

---

## 7. Success metrics

Define these before launch. Set firm targets after two weeks of baseline data.

| Type | Metric | Definition | Starting target |
|---|---|---|---|
| North star | Weekly active workspaces | Workspaces with at least 2 active users and at least 1 core-loop action that week: reply handled, deal moved, project updated, or chatbot lead captured | Baseline first |
| Activation | 7-day activation rate | Within 7 days: at least 2 users, plus one of: a campaign sent and a reply received; 5 deals created; a project shared in the portal; the chatbot installed and a lead captured | 40% |
| Time to value | Signup → first key action | Median minutes | Under 15 minutes |
| Experience | First-click success | Share of first clicks that go to the right place, across the 8 standard tasks in the 5-person test (Priority 1) | At least 80% |
| Experience | Home attention click-through | Share of Home visits where an attention row is clicked | Baseline first |
| Experience | Hunting | Sessions with three or more sidebar clicks in 20 seconds and no action taken | Falling week on week |
| Experience | Search use | Share of weekly active users who use ⌘K | Baseline first |
| Retention | Week-4 workspace retention | Share of activated workspaces still active weekly in week 4 | Baseline first |
| Revenue | Free → paid conversion, chatbot attach rate, MRR | — | Baseline first |
| Guardrail | SES bounce and complaint rates, account-wide | AWS reviews accounts at 5% and 0.1% | Under 2% and under 0.05% |
| Guardrail | Gmail user-reported spam rate | From Postmaster Tools | Under 0.1% |
| Guardrail | CI on `main` | Share of pushes that are green | 100% |
| Guardrail | Uptime and p95 API latency | External checks and request logs | At least 99.5%; under 800 ms |
| Support | Tickets per active workspace per week | From the in-app widget | Falling month on month |

None of this can be measured until G1.5 is done.

---

## 8. Risks and dependencies

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Spam from a free workspace gets SES paused for everyone | Medium (open signup and free cold email) | Severe | Finish G0.3 before opening outreach; gate signup |
| Cross-tenant data leak from unchecked changes | Low to medium | Severe | G0.5 now; isolation suite on every PR |
| Breadth spreads three engineers too thin | High | High | The focus in section 3.4, and no new modules until Tier 1 is done |
| Prices set without willingness-to-pay data | Medium | Medium | Interviews and a pricing-page test before publishing |
| Single-server outage | Medium | High | G2.8 |
| Google OAuth verification delays mailbox and calendar connect | Medium | Medium | Start verification now (G2.7) |
| Legal exposure from the mismatch between Terms and product | Medium | Medium | G0.1 and G0.4 this week |
| Regrouping and renaming disorients people already using the app, starting with Rhinon's own team | Medium | Low | Routes stay the same, old links redirect, and a one-time "What moved" note |
| The Home attention list adds load to a single-process server | Low | Medium | One aggregate `/home/summary` call with short caching, not one request per row |

---

## 9. Decisions needed from leadership

1. Use the website's Sell / Deliver / People grouping and product names inside the app, and replace the dashboard with the Home in U1? **Recommended:** yes. This also settles the renames in U3.
2. Gate signup until Tier 0 is closed? **Recommended:** yes.
3. Confirm the direction in section 3.4, or choose another option from section 3.3.
4. Keep the 5-person Free cap? **Recommended:** keep it, and state it.
5. Payroll: reposition now (**recommended**), or invest in compliance?
6. Publish chatbot pricing, or keep "Talk to us"?
7. Which payment gateway?
8. Who owns help-center content and support replies?

---

## 10. Not verified, and how to check

| Item | Why it wasn't checked | How to check |
|---|---|---|
| Experience findings (Priority 1) | Read from code; no screenshots or recorded user sessions | The 5-person first-click test, plus screenshots of Home and navigation at 375 px and 1280 px |
| Real adoption: workspaces, activity, module use | Read-only aggregate queries on the production database were blocked by this session's permission policy | Someone with access runs the queries below |
| Server environment: Google/Microsoft OAuth credentials | Needs SSH | Check that the variable names are present in the server `.env`, without printing their values |
| Region Vercel uses for signed-in pages | Needs a session | Read `x-vercel-id` on a signed-in page |
| Depth of Performance, Pages and Automation | Sampled, not fully reviewed | Click through with a test workspace |
| UI behaviour | No browser session was used | Screenshot pass at 375 px and 1280 px |
| Competitor prices | Mostly third-party pages | Check vendor pages before quoting them externally |

Read-only adoption queries. They return aggregates only, with no personal data. Run them with `PGOPTIONS='-c default_transaction_read_only=on'`.

```sql
-- Customer workspaces by plan and status, with signup range
SELECT plan, status, count(*) AS workspaces,
       min("createdAt")::date AS first_signup, max("createdAt")::date AS latest_signup
FROM organizations WHERE NOT "isPlatform" GROUP BY plan, status;

-- Active internal people per customer workspace (distribution)
SELECT n AS people, count(*) AS workspaces FROM (
  SELECT u."organizationId", count(*) AS n
  FROM users u JOIN organizations o ON o.id = u."organizationId"
  WHERE NOT o."isPlatform" AND u.status = 'active' AND u."userType" = 'internal'
  GROUP BY 1) t
GROUP BY n ORDER BY n;

-- Customer workspaces with a sign-in in the last 7 and 30 days
SELECT count(DISTINCT a."organizationId") FILTER (WHERE a."createdAt" > now() - interval '7 days')  AS active_7d,
       count(DISTINCT a."organizationId") FILTER (WHERE a."createdAt" > now() - interval '30 days') AS active_30d
FROM audit_logs a JOIN organizations o ON o.id = a."organizationId"
WHERE NOT o."isPlatform" AND a.action = 'auth.login';

-- Module footprint: how many customer workspaces have used each module at all
SELECT count(*) AS workspaces,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM leads x     WHERE x."organizationId" = o.id)) AS with_leads,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM campaigns x WHERE x."organizationId" = o.id)) AS with_campaigns,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM deals x     WHERE x."organizationId" = o.id)) AS with_deals,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM projects x  WHERE x."organizationId" = o.id)) AS with_projects,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM chatbots x  WHERE x."organizationId" = o.id)) AS with_chatbot,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM payrolls x  WHERE x."organizationId" = o.id)) AS with_payroll
FROM organizations o WHERE NOT o."isPlatform";
```

If these show few or no active customer workspaces, the direction in section 3 costs nothing to adopt: nothing has to be migrated or re-messaged for existing users.

---

## Appendix A: Evidence log (24 November 2026)

| Check | Result |
|---|---|
| `curl https://rhinontech.com/pricing` (text extract) | "No seats to count, no trial clock, no credit card." Free: "For your whole team, with no time limit." Chatbot: "Talk to us" |
| `curl https://rhinontech.com/privacy-terms` | Updated 7 Nov 2026. Terms §4: "Every module except the AI website chatbot is free for your whole team, with no time limit." |
| `curl https://api.rhinontech.in/public/legal` | `{"termsVersion":"2026-10-01","termsUrl":null,"privacyUrl":null,"dpaUrl":null,"acceptanceRequired":false}` |
| `dig MX` at 1.1.1.1 and 8.8.8.8 | `rhinontech.in` → `10 inbound-smtp.ap-south-1.amazonaws.com`. `zz-test-tenant.`, `randomtenant123.` and `techno.rhinontech.in` → no MX |
| `dig TXT _dmarc.rhinontech.in` | `v=DMARC1; p=none; rua=mailto:dmarc@rhinontech.in; fo=1` |
| `aws sesv2 list-email-identities` (ap-south-1, read-only) | `rhinontech.in`, `uppercurve.in`, `saleszium.com`, one email address. No per-workspace subdomain identities |
| `aws ses describe-active-receipt-rule-set` (read-only) | Rule `rhinontech-inbound`, recipients `["rhinontech.in"]` only |
| Response headers, `www.rhinontech.in/auth/login` | `strict-transport-security` only; `x-vercel-id: bom1::…` |
| Response headers, `api.rhinontech.in/health` | `x-content-type-options`, `x-frame-options: DENY`, HSTS |
| CORS preflight to `api.rhinontech.in` | `access-control-max-age: 7200` |
| `gh run list --workflow backend-ci.yml` | Last success 2026-10-23 14:00 UTC; 82 consecutive failures since. Latest run: hardening 142/146; sweep, isolation and custom-domain steps skipped |
| `git log` since the last green run | 165 commits, 3 authors; 122 backend source files changed (+10,890 / −577) |
| `git log --since="90 days ago"` | 286 human commits across 3 authors |
| Counts | 141 `page.tsx`; 632 `router.<verb>(` handlers; 94 model files; about 84k admin and 55k backend TS lines |

## Appendix B: External sources

- AWS SES review and pause thresholds: [Reputation metrics messages](https://docs.aws.amazon.com/ses/latest/dg/reputationdashboardmessages.html), [Handling a high bounce rate](https://repost.aws/knowledge-center/ses-high-bounce-rate), [Automatically pausing account sending](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/monitoring-sender-reputation-pausing-account.html)
- SES receipt-rule recipient conditions (bare domain vs. leading dot): [Creating receipt rules](https://docs.aws.amazon.com/ses/latest/dg/receiving-email-receipt-rules-console-walkthrough.html), [ReceiptRule API](https://docs.aws.amazon.com/ses/latest/APIReference/API_ReceiptRule.html)
- DNS wildcard behaviour: [RFC 4592](https://www.rfc-editor.org/rfc/rfc4592)
- Gmail sender requirements (spam rate, DMARC, one-click unsubscribe): [Email sender guidelines FAQ](https://support.google.com/a/answer/14229414), [Email sender guidelines](https://support.google.com/mail/answer/81126?hl=en)
- DPDP Rules 2025 and timeline: [PIB document](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf), [YourStory](https://yourstory.com/2025/11/digital-personal-data-protection-dpdp-rules-2025-rollout-over-18-months), [AZB & Partners](https://www.azbpartners.com/?p=87811)
- DPDP Act penalty schedule (₹250 crore, Section 8(5)): [The Schedule](https://dpdpa.com/theschedule.html), [Bar & Bench](https://www.barandbench.com/view-point/companies-can-save-up-to-250-crore-navigating-the-dpdp-act-2023), [NeGD annotated Act](https://lawascode.negd.in/laws/the-digital-personal-data-protection-act-2023)
- Zoho One India pricing (third-party): [codroiditlabs](https://codroiditlabs.com/zoho-one-pricing-india/), [itforsme](https://itforsme.in/pricing/zoho-one-india), [Zoho One pricing FAQ](https://www.zoho.com/one/pricing/faq.html)
- Bitrix24 free plan: [Bitrix24 blog](https://www.bitrix24.com/about/blogs/bitrix24-free-plan-everything-you-need-to-start-and-scale.php)
- HubSpot free CRM user cap (third-party): [SpotDev](https://www.spotdev.co.uk/blog/is-hubspot-free), [Costbench](https://costbench.com/software/crm/hubspot/free-plan/)
- Zoho CRM Free (3 users): [Zoho CRM free edition](https://www.zoho.com/crm/what-is-zoho-crm-free-edition.html)
- Keka and greytHR pricing: [Keka pricing](https://www.keka.com/pricing-keka), [itforsme Keka](https://itforsme.in/pricing/keka-india), [greytHR vs Keka](https://echai.ventures/explore/compare/greythr-vs-keka)
- Intercom Fin pricing: [Fin resolutions](https://intercom.com/help/en/articles/8205718-fin-resolutions)
- Google unverified OAuth apps: [Unverified apps](https://support.google.com/cloud/answer/7454865)
