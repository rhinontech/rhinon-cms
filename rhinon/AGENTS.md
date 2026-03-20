# AGENTS.md

## Project identity

This repository is an internal CMS and communications platform for RABC / Rhinon Labs.

Primary goals:
- Manage role-based access cleanly and safely
- Support multi-identity email operations
- Support campaign creation, lead management, and social publishing
- Keep the implementation production-minded, modular, and maintainable
- Prefer incremental, reviewable changes over sweeping rewrites

Business context:
- This is an internal tool, not a public consumer app
- UX should favor speed, clarity, and operational reliability
- The system will handle privileged workflows such as onboarding, email identity switching, lead communication, and campaign execution
- Security and auditability matter more than flashy abstractions

---

## Tech stack

Frontend:
- Next.js App Router
- shadcn/ui (with Base UI & Radix UI primitives)
- Tailwind CSS v4
- Zustand for state management
- Source location: `app`

Backend:
- Next.js route handlers / Server Actions
- Mongoose ODM
- MongoDB
- Source location: `app/api`

Integrations:
- AWS SES for email sending
- AWS S3 for file and asset storage
- Google Generative AI for AI workflows (e.g., personalized text generation)
- Nodemailer and Mailparser for raw email handling
- Social publishing layer should be designed as provider-extensible
- Email and campaign modules must be built in a way that allows future webhook/event integration

---

## Technical Features & Infrastructure

To support the Next.js (App Router) + Mongoose/MongoDB stack effectively, the following technical foundations must be established:

### 1. Authentication & Session Management
- **Strategy:** Secure, HTTP-only cookie-based authentication (e.g., NextAuth.js or custom JWT).
- **Middleware:** Next.js Middleware must verify sessions, apply RBAC rules, and protect internal routes before rendering.
- **Identity Context:** The session token must encode the user's ID, role, and current active email identity to avoid redundant DB queries.

### 2. Background Jobs & Task Queues
- **Challenge:** Next.js API routes/server actions have strict execution timeouts, incompatible with long-running tasks like processing leads with Gemini AI or sending bulk emails via SES.
- **Solution:** A robust background job worker or queue system (e.g., Redis + BullMQ, Trigger.dev, or a persistent Node worker) must be implemented.
- **Workflows:** AI background generation, bulk CSV lead imports, and campaign email dispatching MUST be offloaded to this background system.

### 3. File Storage & Asset Management
- **Storage:** Use a dedicated object storage service (like AWS S3) for storing lead CSV uploads, template attachments, and user assets.
- **Security:** Generate pre-signed URLs for client-side uploads to avoid streaming large files through the Next.js API layer.

### 4. Next.js Caching & Revalidation
- **Strategy:** Leverage Next.js App Router server-side caching for read-heavy dashboards (like campaign metrics).
- **Invalidation:** Trigger `revalidatePath` or `revalidateTag` immediately after data mutations (e.g., updating lead status) to ensure UI consistency without full browser refreshes.

### 5. Database Optimization (Mongoose + MongoDB)
- **Connection Management:** Ensure the Next.js backend safely caches and reuses the MongoDB connection via Mongoose to prevent exhausting connections during hot reloads or high serverless traffic.
- **Indexes:** Read-heavy fields (e.g., `email`, `campaign_id`, `status` on Leads, and user identifiers) must be explicitly indexed within Mongoose schemas.

---

## Architecture expectations

Follow these architectural rules unless explicitly told otherwise:

1. Separate concerns clearly
- UI components should stay presentation-focused
- Business logic should not be buried inside page components
- Database access should be isolated from rendering concerns
- Validation should happen at API boundaries

2. Prefer domain-oriented structure
Organize code around domains such as:
- auth
- users
- mailboxes / identities
- campaigns
- leads
- templates
- social_posts
- audit_logs

3. Build for extensibility
- New roles should be easy to add
- New communication channels should be easy to add
- New primary email selection logic should not require rewriting unrelated modules
- Template management should support future versioning

4. Keep logic explicit
- Avoid hidden magic
- Avoid over-generic utility layers unless repetition is proven
- Use descriptive names over clever abstractions

5. Make privileged actions auditable
Any action involving:
- invitation
- mailbox creation
- primary identity switch
- campaign launch
- bulk lead contact
- template deletion
- social publish
should be easy to log in an audit trail

---

## Product Features & Workflows

These rules and features define the core product requirements and expected user workflows for Rhinon CMS.

### Default admin
- A predefined default admin exists:
  - Name: `Prabhat Patra`
  - Email: `admin@rhinonlabs.com`
- Seed this user safely and idempotently
- Never create duplicate default admins
- Default admin bootstrap must be environment-aware and production-safe

### User onboarding and identities
- Each onboarded user receives an email identity in the system
- Example: admin invites a sales user as `sales@rhinonlabs.com`
- Admins can create multiple email identities
- One identity is marked as primary
- Switching primary identity must preserve historical records
- Never lose the association between a sent email and the identity used to send it

### Role-aware workspace header
- Top-left workspace area must show company name and current role/email context
- If the user has multiple identities, they can toggle between them
- The switcher should make it obvious:
  - current role
  - current active email
  - primary email
- Do not make the switcher ambiguous

### 1. Global UI Structure
- **Sidebar Navigation:** Collapsible left sidebar containing primary modules (Dashboard, Campaigns, Leads, Templates, Assets, Team, Settings).
- **Organization/Role & Email Switcher (Top Left):** 
  - Top-left workspace area must show company name and current role/email context.
  - If the user has multiple identities, they can toggle between them to manage different communication contexts.
  - The switcher must make it obvious: current role, current active email, and primary email. Do not make the switcher ambiguous.
- **Global Search & Command Menu:** `Cmd+K` interface to jump quickly between campaigns, specific leads, or settings.

### 2. Admin Dashboard (Command Center)
- **Purpose:** Provides a high-level overview of system health and campaign performance.
- **Metric Cards:** Total active campaigns, leads processed today, emails sent, reply rate.
- **Recent Activity Feed:** Chronological list of system actions (e.g., "Campaign 'Q3 Outreach' finished processing 500 leads").
- **Performance Charts:** Line/Bar charts showing outreach volume vs. engagement over time.

### 3. User Onboarding, Identities & Default Admin
- **Default Admin:** A predefined default admin exists (`Prabhat Patra`, `admin@rhinonlabs.com`). Needs to be seeded safely and idempotently.
- **Identities:** Each onboarded user receives an email identity in the system. Admins can create multiple email identities for a user. One identity is marked as primary.
- **Switching Identities:** Switching primary identity must preserve historical records. Never lose the association between a sent email and the identity used to send it. Admin toggles between emails smoothly to act on behalf of various identities.

### 4. Lead Management System
- **Purpose:** The central repository for all contact data and pipeline stages.
- **List View (Datatable):** Robust table showing Lead Name, Company, Email, Assigned Campaign, and Status (`New`, `Emailed`, `Replied`, `Bounced`). Needs filtering, sorting, and bulk-selection capabilities.
- **Lead Detail Drawer/Modal:** Clicking a lead opens a drawer showing:
  - Contact Info & Social Links.
  - **Activity Timeline:** Traceable lead-to-email history (when added, AI generated, sent, replies).
  - **Generated Content Preview:** Exact AI-generated text prepared, with the ability for a human to manually edit it before sending.
- **Import/Creation Workflow:** Leads can be created manually or via drag-and-drop CSV import with column mapping. Leads can be edited, tagged, and filtered later. Avoid destructive deletes (prefer archive/soft-delete).

### 5. Template Builder (Email & Social)
- **Purpose:** Design reusable messaging structures and AI prompt guidelines.
- **Library:** Grid/list of templates tagged by channel (Email, LinkedIn, Instagram). Campaign templates must be reusable and previewable.
- **Split Screen Editor:** Left side editor, right side live preview/AI prompt tester. Store subject/body and metadata separately.
- **Variables & Generative AI:** Support variables (e.g., `first_name`, `company_name`) and specific AI Prompting text areas for generation instructions.

### 6. Campaign Orchestration
- **Purpose:** Tying Leads and Templates together to execute outreach.
- **Campaign States:** Support draft, scheduled, active, paused, completed, and failed states with explicit state transitions.
- **Campaign Board:** Kanban or List display of active, drafted, and completed campaigns.
- **Creation Wizard (Step-by-Step):**
  - **Setup:** Name the campaign, select the channel.
  - **Audience:** Select existing leads or upload a new cohort.
  - **Messaging:** Attach a template or create a custom AI prompt. Template snapshots should be preserved when launching campaigns.
  - **Execution Settings:** Set send limits and scheduled start time.
  - **Review & Launch:** Summary screen before setting the campaign to `Active`.
- **Send Logic:** Safe against accidental duplicate sends. Detail dashboard lists specific analytics, lead progress vs. pending for that given run.

### 7. Inbox / Reply Management (Upcoming Feature)
- **Purpose:** Centralizing responses to outreach directly inside the CMS instead of relying on external email clients.
- **Split-Pane Email Client:** Standard inbox view (list of conversations on the left, active conversation on the right).
- **Contextual Sidebar:** Show Lead's details and which Campaign triggered this reply in the right-most pane.
- **AI Assist Reply:** AI-drafted responses to leads based on their reply context.

### 8. Social Posts
- **Workflows:** Creation and publishing modeled like campaigns (draft, scheduled, published, failed).
- **Publishing Layer:** Provider-agnostic where possible.

### 9. Automation & Background Processes
- **AI Engine / Jobs:** Asynchronous routines processing leads (e.g., finding `New` leads, generating personalized text). UI needs to distinguish between "AI Generated (Pending Review)" and "Actually Sent."
- **AWS SES Integration:** Isolated behind a service layer. Handle retries, errors, identity/source validation carefully. Store provider message identifiers where useful.

---

## RBAC rules

Treat RBAC as a first-class concern.

Minimum roles:
- super_admin
- admin
- manager
- sales
- marketer
- support

Guidelines:
- Authorization must be enforced in backend code, not only hidden in UI
- UI may hide inaccessible actions, but backend must reject unauthorized requests
- Prefer permission maps/capability checks over role string checks everywhere
- Use central authorization helpers
- All admin-only mutations must have explicit guards

Example capability areas:
- manage_users
- invite_users
- manage_mailboxes
- switch_primary_identity
- manage_leads
- send_email
- manage_campaigns
- launch_campaigns
- manage_templates
- manage_social_posts
- publish_social_posts
- manage_settings
- view_audit_logs

---

## Data modeling guidance

Prefer a schema close to these concepts:

- users
- roles
- user_roles
- email_identities
- user_identities
- leads
- lead_tags
- lead_tag_links
- campaign_templates
- campaigns
- campaign_recipients
- outbound_emails
- social_posts
- audit_logs

Expected relationships:
- one user can have many email identities
- one user can have one primary active identity at a time
- campaigns belong to a creator identity and/or user
- outbound emails must preserve sender identity, recipient, provider status, and timestamps
- leads should support ownership and lifecycle state
- audit logs should capture actor, action, target type, target id, metadata, timestamp

---

## Database modeling and migration rules

- Use Mongoose models and schema definitions consistently
- Rely on explicit definitions over dynamic schemas for production predictability
- For significant schema evolution, write data migration scripts to backfill existing documents
- Seeders must be idempotent
- Never mix unrelated schema changes into one deploy unless clearly part of one feature
- For risky schema changes:
  - backfill data first via script
  - enforce strict schema validation second
  - remove deprecated fields from schema last

Before changing schema, inspect:
- existing Mongoose model
- affected aggregation pipelines
- seed data expectations
- affected API routes
- affected UI forms and tables

---

## API rules

- Keep route handlers thin
- Validate inputs at the boundary
- Return predictable response shapes
- Use consistent error handling
- Never leak internal stack details to clients
- Prefer service modules for orchestration
- Prefer transactions for multi-step write operations

Especially use transactions for:
- invite user + create identity + assign role
- switch primary email identity
- launch campaign + materialize recipients
- publish social post + persist provider result

---

## Frontend rules

- Use shadcn/ui primitives and composable components
- Keep Tailwind classes readable
- Favor server components where appropriate, but use client components deliberately
- Complex forms should use structured validation and clear error states
- Loading, empty, error, and success states are required for admin flows
- Tables should support useful filtering/sorting when the dataset is likely to grow

Important screens likely needed:
- dashboard
- users and roles
- identities / mailboxes
- leads
- campaigns
- templates
- social posts
- settings
- audit logs

---

## UX rules

For internal CMS workflows:
- Optimize for clarity and task completion
- Expose important state and ownership clearly
- Dangerous actions need confirmation
- Primary identity changes should be clearly explained
- Scheduled publish/send actions should show timezone-aware details
- Avoid surprising hidden automation

---

## Security rules

Treat these as mandatory:
- never hardcode production secrets
- use environment variables for all credentials
- sanitize and validate all inputs
- enforce authorization on the server
- log sensitive admin actions
- do not expose internal identifiers unnecessarily
- do not trust client-supplied role or permission data
- ensure SES sender identity is validated before send attempts
- use least-privilege assumptions

Do not:
- commit secrets
- bypass RBAC for convenience
- implement fake auth shortcuts in production code
- silently swallow integration errors

---

## Coding style

- Use TypeScript strictly
- Prefer explicit types on public functions and service boundaries
- Keep files focused
- Keep functions reasonably small
- Name things by domain intent, not implementation trivia
- Avoid premature abstraction
- Reuse existing patterns before inventing new ones
- Leave concise comments only where reasoning is non-obvious

---

## Testing expectations

When changing behavior, test the most important risk areas first.

Priority test areas:
1. RBAC enforcement
2. identity creation and primary switching
3. campaign creation and launch rules
4. lead management flows
5. SES send orchestration
6. API validation and transaction safety

At minimum, for feature work:
- test the happy path
- test one authorization failure
- test one validation failure
- test one persistence/state transition case

---

## Delivery expectations for Codex

When asked to implement a feature:
1. inspect relevant code first
2. identify affected domains
3. propose or follow the smallest safe change set
4. update schema only if needed
5. include data migration script when schema changes significantly
6. update backend and frontend consistently
7. avoid leaving half-wired UI
8. mention assumptions clearly in the final summary

When asked to refactor:
- preserve behavior unless explicitly told to change it
- call out risk areas
- do not perform opportunistic rewrites across the whole repo

When asked to add a feature:
- wire end to end where feasible
- do not stop at static UI if backend is clearly required
- do not stop at backend if the request clearly expects a usable screen

---

## Command expectations

Prefer these project commands if present:
- install: `pnpm install`
- dev: `pnpm dev`
- lint: `pnpm lint`
- typecheck: `pnpm typecheck`
- test: `pnpm test`

If commands differ, inspect `package.json` and use the repo’s actual commands.

Before finalizing significant work, try to run:
- lint
- typecheck
- relevant tests

If something cannot be run, say exactly why.

---

## Definition of done

A task is only done when:
- code matches the requested feature
- RBAC/security implications are handled
- data migration scripts are included if schema changed significantly
- primary workflows are wired end to end
- obvious error states are handled
- affected files are coherent and consistent
- summary includes what changed, constraints, and follow-up risks

---

## Special instruction for this repository

If asked to implement any feature related to:
- onboarding
- multi-email identities
- campaigns
- lead mail flows
- templates
- social publishing
- SES integration
then first think in terms of:
- data model impact
- authorization impact
- auditability
- state transitions
- transactional safety
- future extensibility

Do not optimize only for “it works locally”.
Optimize for maintainable internal operations software.