# AGENTS.md — rhinon-cms

## Project Identity

Rhinon CMS is a private, internal "Company OS" for Rhinon Tech. It manages
people ops (HR, payroll, attendance, leave, performance), work delivery
(projects, tasks, clients), outbound sales (AI-driven campaigns, lead research),
a website chatbot (RAG, live handoff, tickets, help center), inbox/email, events,
content (blogs, pages), and analytics — all behind role-based access control.

This is **not** a public SaaS product. It is multi-tenant by design, but
currently used exclusively by Rhinon Tech and select tenants on the same
infrastructure.

---

## Architecture

The repository is a monorepo containing several applications:

| App | Path | Stack |
|-----|------|-------|
| **Admin Panel** | `rhinontech/admin-panel` | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Zustand |
| **Backend API** | `rhinontech/backend` | Express 4, TypeScript, Sequelize ORM, PostgreSQL + pgvector |
| **Chatbot Widget** | `bot-sdk` | React, TypeScript, Webpack (single-bundle SDK) |
| **Rhinon Labs site** | `rhinonlabs` | Next.js |
| **Uppercurve site** | `uppercurve` | Next.js |
| **Legacy app** | `rhinon` | Mongo/Next.js — superseded, do not develop |

### Key Infrastructure
- **Database:** PostgreSQL with pgvector extension for chatbot embeddings
- **AI:** Google Gemini 2.5 Flash (all AI features — chat, lead research, drafting)
- **Email:** AWS SES v2 (sending + inbound via SNS)
- **Storage:** AWS S3 (presigned URLs)
- **Real-time:** Socket.IO (chatbot live chat, visitor tracking)
- **Auth:** JWT in `authToken` cookie, 7-day expiry, `bcryptjs` for passwords
- **Multi-tenancy:** AsyncLocalStorage tenant context + Sequelize global hooks

---

## Dev Environment

```bash
# Backend (port 5000)
cd rhinontech/backend && npm run dev

# Admin Panel (port 4200)
cd rhinontech/admin-panel && npm run dev

# Bot SDK
cd bot-sdk && npm run dev
```

Build verification:
```bash
cd rhinontech/backend && npm run build
cd rhinontech/admin-panel && npm run build
cd bot-sdk && npm run build
```

---

## Branching & Deployment

- **`main`** — production, deployed to `/home/ubuntu/rhinon-cms` (pm2 `rhinontech-backend`, port 5002)
- **`beta`** — staging, deployed to `/home/ubuntu/rhinon-cms-beta` (pm2 `rhinontech-backend-beta`, port 5003)
- Front-ends deploy to Vercel separately
- Schema sync at boot is additive only (`sync({ alter: { drop: false } })`)
- Feature branches: `feat/<name>` off `beta`

Deploy flow: `git pull` → `npm install` → `npm run build` → `pm2 restart` → verify `/health`.

---

## Coding Conventions

### General
- TypeScript strictly — explicit types on public functions and service boundaries
- Keep files focused and functions reasonably small
- Name things by domain intent, not implementation trivia
- Leave concise comments only where reasoning is non-obvious
- Preserve all existing comments and docstrings unrelated to your changes

### Backend (`rhinontech/backend`)
- Route handlers should be thin — delegate to service modules
- Validate inputs at the API boundary
- Use Sequelize transactions for multi-step write operations
- Register new models in `models/index.ts` and in `TENANT_MODELS` (in `models/tenantScope.ts`) if tenant-scoped
- All tenant-scoped queries are automatically filtered by `organizationId` via global hooks — do not bypass this
- For code running outside a request context (cron, webhooks), use `runAsSystem()` or `runForOrg(orgId)`
- Secrets (OAuth tokens, API keys) must be encrypted at rest using the AES-GCM helpers in `services/totp.ts`
- Return predictable response shapes; never leak internal stack details to clients

### Admin Panel (`rhinontech/admin-panel`)
- Use shadcn/ui primitives and composable components
- Tailwind CSS v4 — keep utility classes readable
- Zustand for client state, `js-cookie` for cookie persistence
- Loading, empty, error, and success states are required for all admin flows
- Authorization is enforced server-side — UI hides inaccessible actions but the backend rejects them

### Bot SDK (`bot-sdk`)
- Single-bundle output for SDK distribution (`rhinon-chat.js`)
- Path aliases: `@/types`, `@/constants`, `@/services`, `@/store`, `@/hooks`, `@/components`, `@/screens`, `@/utils`, `@/styles`
- Lazy loading for screens and heavy deps (emoji picker)
- React.memo on frequently re-rendered components
- When changing widget behaviour, rebuild and commit `rhinontech/backend/public/widget/rhinon-chat.js{,.gz}`

---

## RBAC

- Backend `authorize(permission)` middleware guards each route
- Permissions follow `resource:action` convention (e.g. `payroll:write`, `outreach:read`)
- Seeded roles: Super Admin, HR, Employee, Collaborator
- Platform-only features (deploy, startup ideas, analytics, lead finder) are gated behind `requirePlatformOrg`
- **Never** rely on UI-only permission hiding — always enforce in the backend

---

## Multi-Tenancy

- Every tenant-owned model has an `organizationId` column
- Tenant isolation is automatic via Sequelize global hooks (see `models/tenantScope.ts`)
- `tenantContext.ts` holds the current org via AsyncLocalStorage
- Boot-time migration (`services/tenancyMigration.ts`) handles column addition, backfill, and constraint swaps — it is idempotent
- `TENANT_STRICT=true` makes unscoped tenant queries throw (use for sweeping the codebase)
- The platform org (`isPlatform: true`) is Rhinon Tech; customer orgs are tenants

---

## Security Rules

- Never hardcode secrets — use environment variables
- Sanitize and validate all inputs
- Do not trust client-supplied role or permission data
- Encrypt sensitive tokens at rest (OAuth, API keys)
- Public endpoints must be rate-limited
- SNS webhook endpoints must verify signatures
- Do not commit `.env` files, PEM keys, or credentials
- Widget public endpoints scope all queries to the chatbot's `publicId`

---

## Documentation

Key documents to consult before making changes:

| File | Scope |
|------|-------|
| `PROJECT_OVERVIEW.md` | Full architecture, data model, all modules |
| `docs/CHATBOT_PORT.md` | Chatbot port plan, phases, widget contract |
| `docs/MULTI_TENANCY_PLAN.md` | Multi-tenancy design and phases |
| `docs/EVENTS_PARITY.md` | Events module parity checklist |
| `docs/LEAD_FINDER.md` | Apollo lead finder design (not yet implemented) |
| `bot-sdk/RESTRUCTURE_PLAN.md` | Widget SDK restructuring history |
| `bot-sdk/FUTURE_ROADMAP.md` | Widget SDK future optimisation phases |

---

## Safe Working Practices

1. **Inspect before editing.** Read existing code in the affected domain before changing it.
2. **Prefer minimal safe diffs.** Don't perform opportunistic rewrites of unrelated code.
3. **Preserve existing behaviour** unless explicitly told to change it.
4. **Test both backend and frontend** for any feature that touches both.
5. **Always build before deploying.** A failed build must never take prod down.
6. **Deploy to beta first.** Never push untested changes to `main`.
7. **Never drop data.** Schema changes must be additive; use migration scripts for non-trivial changes.
8. **Respect the tenant boundary.** Any new model that stores customer data must be registered in `TENANT_MODELS`.
9. **Surface assumptions explicitly** in commit messages and summaries.
