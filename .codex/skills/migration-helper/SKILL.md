---
name: migration-helper
description: Safely plan and implement Sequelize and PostgreSQL schema changes for the RABC internal CMS, including migrations, backfills, seed adjustments, rollout notes, and API/model consistency checks.
---

# Migration Helper

Use this skill when the task involves any of the following:
- adding or changing Sequelize models
- creating or modifying PostgreSQL tables, columns, indexes, constraints, or enums
- introducing new relationships
- converting single-value ownership into multi-identity or role-linked structures
- backfilling existing data
- changing seed data
- implementing safe schema evolution for internal CMS workflows
- auditing whether code changes require a migration

This skill is optimized for the RABC internal CMS, where migrations must preserve:
- RBAC correctness
- email identity history
- campaign integrity
- lead communication history
- auditability
- production-safe rollout paths

---

## Core principles

1. Never rely on runtime schema sync for production changes
Always prefer explicit Sequelize migrations.

2. Keep migrations narrow and traceable
Avoid combining unrelated schema work into one migration unless they are part of one tightly-coupled feature.

3. Favor expand → backfill → enforce → clean up
For risky migrations:
- add new nullable structures first
- backfill data
- update code paths
- enforce constraints after data is consistent
- remove legacy fields only in a later step if needed

4. Protect historical records
Changes must not erase or blur:
- who sent an email
- which identity was primary at the time
- which campaign produced an outbound message
- which user performed an admin action

5. Treat auth and ownership fields carefully
A migration touching users, roles, or identities may have authorization implications. Flag them clearly.

---

## Workflow

When invoked, follow this process.

### Step 1: Inspect the existing shape
Review:
- Sequelize models
- existing migrations
- seeders
- relevant service code
- relevant API handlers
- relevant UI assumptions

Determine:
- current schema shape
- source of truth fields
- existing nullability and constraints
- whether legacy data exists that needs backfill

### Step 2: Define the schema delta
State clearly:
- what changes are being added
- which tables are affected
- whether the change is additive, transformative, or destructive
- whether the migration is reversible
- whether rollout should be split into multiple migrations

### Step 3: Risk analysis
Explicitly check for these risks:
- breaking existing seed data
- invalidating foreign keys
- duplicate primary identities per user
- campaign send duplication after schema transition
- historical outbound email records losing sender context
- lead ownership ambiguity
- admin authorization regressions
- code expecting old column names

### Step 4: Produce implementation plan
Generate:
- migration file plan
- model updates needed
- seed updates needed
- service/API changes needed
- rollout order
- validation checklist

### Step 5: Write migration safely
Prefer patterns like:
- add nullable column/table first
- create indexes explicitly
- add unique constraints only after backfill confidence
- use transactions where supported and appropriate
- name constraints and indexes clearly

### Step 6: Backfill strategy
If existing rows require transformation:
- define deterministic mapping
- avoid lossy conversion
- include guard clauses
- make the migration resumable when possible
- explain behavior for malformed or unexpected legacy rows

### Step 7: Post-migration validation
Recommend checks for:
- row counts
- uniqueness assumptions
- nullability assumptions
- foreign key consistency
- old and new code path compatibility
- critical feature smoke tests

---

## RABC-specific schema guidance

### Users and roles
Likely entities:
- users
- roles
- user_roles

Guidance:
- use join tables for flexible role assignment
- avoid embedding many permissions directly in users
- preserve default admin bootstrap safety
- seeded default admin must remain idempotent

### Email identities
Likely entities:
- email_identities
- user_identities or identity ownership links

Guidance:
- one user may have multiple identities
- there should be a clear primary identity rule
- preserve sent-message historical identity linkage
- if enforcing one primary per user, consider:
  - boolean flag + partial uniqueness strategy in DB where applicable
  - or primary identity reference on user
- choose the pattern that minimizes ambiguity in queries and code

### Campaigns
Likely entities:
- campaigns
- campaign_recipients
- outbound_emails
- campaign_templates

Guidance:
- preserve template snapshot at send time
- preserve campaign state history
- add status columns with explicit defaults
- index recipient lookup and provider status fields where useful

### Leads
Likely entities:
- leads
- lead_tags
- lead_tag_links

Guidance:
- avoid destructive deletes
- support ownership, lifecycle state, and communication history
- add indexes for common CRM filters if the dataset will grow

### Social posts
Likely entities:
- social_posts
- social_publish_attempts

Guidance:
- separate content from publish attempts if delivery history matters
- use explicit provider/status fields
- avoid mixing social scheduling with campaign sending logic too tightly

### Audit logs
Likely entity:
- audit_logs

Guidance:
- store actor, action, target_type, target_id, metadata, timestamp
- do not over-normalize audit logs early
- keep writes simple and reliable

---

## Preferred migration patterns

### Additive column
Use when introducing optional new behavior:
1. add nullable column
2. update read/write paths
3. backfill if needed
4. enforce default/constraint later

### Table split
Use when moving overloaded columns into a new domain table:
1. create new table
2. backfill from existing table
3. update code to write both if needed temporarily
4. cut reads to new table
5. remove legacy field later

### Enum/status introduction
Prefer:
- explicit allowed values
- application-level validation
- DB defaults where helpful
- careful handling of unknown legacy rows

### Identity primary switch
For multi-email support:
1. create identity table
2. link existing admin identity
3. backfill existing users
4. define primary identity rule
5. update send/email logic to use identity references
6. validate historical email ownership preservation

---

## What to output

When helping with a migration task, provide:

1. **Schema summary**
- current shape
- intended shape

2. **Risk notes**
- what could break
- what needs staged rollout

3. **Migration plan**
- file-by-file or step-by-step changes

4. **Example migration outline**
- up/down actions
- backfill notes
- constraint/index plan

5. **Code follow-through checklist**
- model updates
- service updates
- API updates
- UI assumptions to review
- seed updates
- tests to add

6. **Validation checklist**
- exact post-change checks to run

---

## Strong warnings

Do not:
- suggest `sequelize.sync({ alter: true })` for production schema evolution
- drop columns eagerly when a staged migration is safer
- assume single-email ownership if the product supports multiple identities
- add uniqueness constraints before checking existing data
- ignore seed/bootstrap behavior for `admin@rhinonlabs.com`
- forget auditability when changing privileged workflows

---

## Repository-specific assumptions

This skill assumes:
- Next.js frontend at `src/app`
- backend/domain code under `src/api`
- Sequelize + PostgreSQL
- internal CMS workflows
- AWS SES-backed outbound email
- role-aware multi-identity operations

Always tailor migration suggestions to these assumptions unless the repository clearly differs.