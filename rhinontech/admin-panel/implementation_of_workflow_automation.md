# Workflow Automation Engine & Visual Builder — Technical Implementation Document

This document provides a comprehensive end-to-end technical overview of the **Workflow Automation System** implemented in Rhinon CMS across the backend service, database layer, public tracking routes, and frontend Admin Panel builder.

---

## 1. Executive Summary & System Architecture

The Workflow Automation System enables marketing and sales teams to create visually engineered, automated multi-step outreach campaigns (e.g., drip campaigns, lead nurturing, conditional follow-ups). 

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ADMIN PANEL (FRONTEND)                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────────────┐  │
│  │    React Flow        │  │   Trigger & Config   │  │   Enrollments Dashboard      │  │
│  │   Visual Builder     │  │        Drawer        │  │     & Execution Logs       │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └──────────────┬───────────────┘  │
└─────────────┼─────────────────────────┼──────────────────────────────┼─────────────────┘
              │                         │                              │
              ▼                         ▼                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  BACKEND API & ENGINE                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────────────┐  │
│  │   Workflow Routes    │  │   Workflow Engine    │  │    Email Tracking Pixel &    │  │
│  │   (/workflows/*)     │  │   (Cycle Cron Loop)  │  │    Link Redirect Routes      │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └──────────────┬───────────────┘  │
└─────────────┼─────────────────────────┼──────────────────────────────┼─────────────────┘
              │                         │                              │
              ▼                         ▼                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 DATABASE (POSTGRESQL / SEQUELIZE)                      │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────────────┐  │
│  │   Workflows Table    │  │ WorkflowEnrollments  │  │ Contact Groups & Leads       │  │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Highlights:
- **Visual Drag-and-Drop Canvas**: Built with `@xyflow/react` for intuitive workflow graph construction.
- **Node-based Step Types**: Support for Triggers, Email Dispatch, Delay Timers (`Wait`), Conditional Evaluation (`If / Then`), and Termination (`Exit`).
- **Asynchronous Execution Engine**: Polling-based cycle executor (`runWorkflowEngineCycle`) handling scheduled step progression, batch limits, and delay computations.
- **Real-Time Tracking Subsystem**: Native 1x1 transparent GIF email open tracking and link click redirection with automatic state mutation.
- **Lead Deduplication & Re-Enrollment Controls**: Configurable lead enrollment rules preventing unwanted email spam.

---

## 2. Database Models & Schema Design

### 2.1 `Workflow` Model
Location: [`backend/src/models/Workflow.ts`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/backend/src/models/Workflow.ts)

Stores the definition, versioning, graph topology (nodes & edges), trigger configurations, and aggregate statistics of a workflow.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `STRING` (PK) | Unique workflow identifier (e.g. `wf-1740000000000`) |
| `name` | `STRING` | Name of the automation workflow |
| `description` | `TEXT` | Optional description of the workflow goals |
| `status` | `STRING` | Lifecycle state: `'draft'`, `'active'`, `'paused'`, `'archived'` |
| `version` | `INTEGER` | Incremental workflow version number |
| `triggerType` | `STRING` | Trigger mode: `'static_list'` or `'realtime_lead'` |
| `triggerConfig` | `JSONB` | Target static sources (`watchedSources`), `allowReEnrollment` flag, `batchSize` |
| `nodes` | `JSONB` | Array of React Flow node objects (id, position, nodeType, config) |
| `edges` | `JSONB` | Array of React Flow edge objects connecting source and target nodes |
| `stats` | `JSONB` | Real-time aggregate breakdown: `{ active, completed, failed, cancelled }` |
| `createdById` | `STRING` | User ID of the workflow creator |

---

### 2.2 `WorkflowEnrollment` Model
Location: [`backend/src/models/WorkflowEnrollment.ts`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/backend/src/models/WorkflowEnrollment.ts)

Tracks individual lead/contact progress through a specific workflow instance.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `STRING` (PK) | Unique enrollment ID (e.g. `enr-1740000000000-123`) |
| `workflowId` | `STRING` (FK) | Reference to parent `Workflow.id` |
| `leadId` | `UUID` | Optional reference to primary `Lead.id` |
| `leadName` | `STRING` | Full name of recipient |
| `leadEmail` | `STRING` | Email address of recipient |
| `source` | `STRING` | Originating contact group name or lead source |
| `status` | `STRING` | Lead status: `'active'`, `'completed'`, `'failed'`, `'cancelled'` |
| `currentNodeId` | `STRING` | Current graph node ID where lead is positioned |
| `nextStepAt` | `DATE` | Scheduled timestamp for next step execution (used by `Wait` & `If/Then` delays) |
| `executionLogs` | `JSONB` | Array of step execution log entries with ISO timestamps |
| `trackingState` | `JSONB` | Object recording `{ emailOpened, openedAt, linkClicked, clickedAt, clickedUrls }` |
| `enrolledAt` | `DATE` | Timestamp when lead entered the workflow |
| `completedAt` | `DATE` | Timestamp when lead reached an `Exit` node or completed |

---

## 3. Backend Workflow Engine Logic & Services

Location: [`backend/src/services/workflowEngine.ts`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/backend/src/services/workflowEngine.ts)

### 3.1 Static List Lead Enrollment (`enrollStaticListLeads`)
- Queries all contact groups or lead source records specified in `triggerConfig.watchedSources`.
- Extracts matching leads (`ContactGroupMember` $\rightarrow$ `Lead`).
- **Deduplication Safeguard**: Checks if an enrollment already exists for `(workflowId, leadEmail)`:
  - If `allowReEnrollment` is `false`: Skips lead if any prior enrollment exists (active or completed).
  - If `allowReEnrollment` is `true`: Skips lead only if an currently `active` enrollment exists.
- Creates `WorkflowEnrollment` record starting at the initial trigger node (`initialNodeId`) with `nextStepAt = now`.

---

### 3.2 Workflow Engine Execution Cycle (`runWorkflowEngineCycle`)
Triggered automatically every 60 seconds by `server.ts` cron and on-demand via API routes.

1. Retrieves all workflows with `status === "active"`.
2. For each active workflow, fetches pending enrollments where `status === "active"` AND (`nextStepAt <= now` OR `nextStepAt === null`), limited by `batchSize`.
3. Iterates over enrollments using `executeEnrollmentSteps(...)`.

---

### 3.3 Node Execution Handlers (`executeEnrollmentSteps`)

Traverses connected nodes up to a safety limit of **10 node steps per cycle iteration** to prevent infinite loops.

```
       ┌────────────────────────┐
       │      Trigger Node      │
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │    Send Email Node     │ (Parses merge tags, injects tracking pixel, rewrites links)
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │       Wait Node        │ (Calculates delay, sets nextStepAt = now + delay, pauses lead)
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │     If / Then Node     │ (Evaluates trackingState: emailOpened / linkClicked)
       └───────┬────────┬───────┘
            YES│        │NO
               ▼        ▼
          ┌────────┐  ┌────────┐
          │ Branch │  │ Branch │
          └────┬───┘  └────┬───┘
               │           │
               └─────┬─────┘
                     ▼
       ┌────────────────────────┐
       │       Exit Node        │ (Marks status = 'completed', sets completedAt = now)
       └────────────────────────┘
```

#### A. Trigger Node (`trigger`)
Logs execution and immediately advances lead down the connected outgoing edge.

#### B. Send Email Node (`send_email`)
1. **Merge Tag Resolution**: Parses template variables in `subject` and `emailBody`:
   - `{{name}}` $\rightarrow$ `leadName`
   - `{{email}}` $\rightarrow$ `leadEmail`
   - `{{source}}` $\rightarrow$ `source`
   - `{{company}}` $\rightarrow$ `"Rhinon Labs"`
2. **Link Tracking Rewrite**: Scans HTML body for anchor tags (`<a href="...">`) and rewrites target URLs to point to `/public/track/click?e={enrollmentId}&url={encodedUrl}`.
3. **Open Tracking Pixel Injection**: Appends a hidden 1x1 transparent tracking pixel (`<img src="/public/track/open?e={enrollmentId}" width="1" height="1" .../>`) to the HTML body.
4. **Email Dispatch**: Invokes `sendEmail()` service.
5. Logs step into `executionLogs` and advances to next node.

#### C. Wait / Delay Node (`wait`)
- If lead is entering node for the first time:
  - Computes `delayMs` based on `delayUnit` (`minutes`, `hours`, `days`) and `delayValue`.
  - Sets `nextStepAt = now + delayMs`.
  - Updates `currentNodeId` to the wait node and pauses loop for this lead.
- If wait duration has expired (`nextStepAt <= now`):
  - Advances lead to next connected node.

#### D. Condition Node (`if_then`)
- Checks evaluation delay (`checkDelayUnit`, `checkDelayValue`, default 24 hours).
- After evaluation delay expires:
  - Checks `enrollment.trackingState`:
    - `link_clicked` condition $\rightarrow$ evaluates `Boolean(trackingState.linkClicked)`.
    - `email_opened` condition $\rightarrow$ evaluates `Boolean(trackingState.emailOpened)`.
  - Routes lead down the matching edge handle (`sourceHandle === "yes"` vs `sourceHandle === "no"`).

#### E. Exit Node (`exit`)
- Logs completion, updates `status = "completed"`, sets `completedAt = new Date()`, and clears `nextStepAt`.

---

## 4. Public Tracking System

Location: [`backend/src/routes/public.ts`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/backend/src/routes/public.ts)

### 4.1 Email Open Tracking Pixel (`GET /public/track/open`)
- Extracts enrollment ID from query param (`?e=...`).
- Fetches `WorkflowEnrollment`.
- If `emailOpened` was false:
  - Sets `trackingState.emailOpened = true`.
  - Sets `trackingState.openedAt = ISO timestamp`.
  - Appends log: `"Email opened by recipient (email@example.com)"`.
- Returns an HTTP 200 response with a 1x1 base64 GIF image buffer (`image/gif`) with `Cache-Control: no-store, no-cache`.

### 4.2 Link Click Tracking Redirect (`GET /public/track/click`)
- Extracts enrollment ID (`?e=...`) and target destination URL (`?url=...`).
- Updates `trackingState.linkClicked = true`, appends URL to `clickedUrls` array.
- Appends log: `"Link inside email clicked by recipient: http..."`.
- Issues an HTTP 302 redirect (`res.redirect(302, targetUrl)`) to seamlessly forward recipient to original link destination.

---

## 5. API Endpoints Reference

Location: [`backend/src/routes/workflows.ts`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/backend/src/routes/workflows.ts)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/workflows` | List all workflows with search/filter options |
| `GET` | `/workflows/:id` | Get workflow details, nodes, edges, trigger config |
| `POST` | `/workflows` | Create a new workflow (default status: `'draft'`) |
| `PUT` | `/workflows/:id` | Save workflow canvas changes, nodes, edges, trigger config |
| `POST` | `/workflows/:id/run` | Manually execute bulk enrollment for static list workflow |
| `GET` | `/workflows/:id/enrollments` | Fetch all lead enrollments & execution logs for workflow |
| `DELETE` | `/workflows/:id` | Delete a workflow and associated enrollments |

---

## 6. Frontend Admin Panel Components Architecture

Location: [`admin-panel/components/Admin/Automation/`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/admin-panel/components/Admin/Automation/)

```
admin-panel/
├── app/[role]/automation/workflows/
│   ├── page.tsx                             # Workflow Listing View
│   └── [id]/page.tsx                        # Main Workflow Studio & Canvas Host
└── components/Admin/Automation/
    ├── WorkflowCanvas.tsx                   # React Flow Canvas Wrapper
    ├── CustomNodes.tsx                      # Trigger, Action, Delay, Condition, Exit Nodes
    ├── AddStepEdge.tsx                      # Custom Edge with '+' Insert Step Buttons
    ├── NodeConfigDrawer.tsx                 # Slide-over Drawer for Step Settings
    ├── WorkflowTriggerTab.tsx               # Target List Picker & Batch Configuration
    ├── WorkflowSettingsTab.tsx              # Metadata & Status Management
    ├── WorkflowEnrollmentsTab.tsx           # Real-Time Lead Tracking & Log Monitor
    └── WorkflowHeader.tsx                   # Top Bar: Status Badges, Tabs, Run Button
```

### Component Highlights:
- **`WorkflowCanvas.tsx`**: React Flow graph renderer handling node selection, drag-and-drop node additions, zoom controls, and edge linking.
- **`CustomNodes.tsx`**: Renders sleek visual nodes with color-coded headers (Blue for Triggers, Purple for Email Actions, Amber for Delays, Cyan for Conditions, Emerald for Exit).
- **`AddStepEdge.tsx`**: Custom SVG edge renderer featuring interactive `+` buttons directly on connection lines to insert nodes anywhere in the flow.
- **`NodeConfigDrawer.tsx`**: Rich slide-over drawer featuring Tiptap rich-text capabilities, merge tag pills (`{{name}}`, `{{email}}`, etc.), delay unit selectors, and condition settings.
- **`WorkflowEnrollmentsTab.tsx`**: Dashboard displaying lead statuses (`active`, `completed`, `failed`), execution progress timestamps, tracking indicators (Opened / Clicked badges), and expandable raw execution step logs.

---

## 7. Complete End-to-End Execution Lifecycle

```
 1. CREATION        User creates Workflow in Admin Panel (Saved as Draft)
        │
        ▼
 2. BUILD           User adds Trigger, Send Email, Wait, If/Then, and Exit nodes via visual canvas
        │
        ▼
 3. PUBLISH         User switches status to "Active" -> Backend calls enrollStaticListLeads()
        │
        ▼
 4. ENROLLMENT      Backend resolves leads from Contact Group, deduplicates, creates WorkflowEnrollment records
        │
        ▼
 5. EXECUTION       Cron (every 1 min) triggers runWorkflowEngineCycle()
        │           ├── Resolves Merge Tags ({{name}} -> "John")
        │           ├── Rewrites links for click tracking (/public/track/click)
        │           ├── Appends 1x1 GIF Tracking Pixel (/public/track/open)
        │           └── Dispatches email via sendEmail()
        │
        ▼
 6. TRACKING        Lead opens email / clicks link -> Public tracking routes mutate enrollment trackingState
        │
        ▼
 7. BRANCHING       If/Then node evaluates trackingState after delay -> Routes down YES or NO branch
        │
        ▼
 8. COMPLETION      Lead reaches Exit node -> Enrollment status updated to 'completed'
```

---

## 8. Summary of Files Created & Modified

### Backend Files
- [`backend/src/models/Workflow.ts`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/backend/src/models/Workflow.ts) - Workflow Sequelize model
- [`backend/src/models/WorkflowEnrollment.ts`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/backend/src/models/WorkflowEnrollment.ts) - Lead Enrollment model
- [`backend/src/services/workflowEngine.ts`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/backend/src/services/workflowEngine.ts) - Core execution engine & step logic
- [`backend/src/routes/workflows.ts`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/backend/src/routes/workflows.ts) - API endpoints for Workflows
- [`backend/src/routes/public.ts`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/backend/src/routes/public.ts) - Open pixel and link click tracking routes
- [`backend/src/server.ts`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/backend/src/server.ts) - 1-minute execution cycle cron interval

### Frontend Admin Panel Files
- [`admin-panel/app/[role]/automation/workflows/page.tsx`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/admin-panel/app/%5Brole%5D/automation/workflows/page.tsx) - Workflow listing page
- [`admin-panel/app/[role]/automation/workflows/[id]/page.tsx`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/admin-panel/app/%5Brole%5D/automation/workflows/%5Bid%5D/page.tsx) - Main Workflow Builder page
- [`admin-panel/components/Admin/Automation/WorkflowCanvas.tsx`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/admin-panel/components/Admin/Automation/WorkflowCanvas.tsx) - Canvas component
- [`admin-panel/components/Admin/Automation/CustomNodes.tsx`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/admin-panel/components/Admin/Automation/CustomNodes.tsx) - Custom graph node renderers
- [`admin-panel/components/Admin/Automation/AddStepEdge.tsx`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/admin-panel/components/Admin/Automation/AddStepEdge.tsx) - Custom edge step insertion component
- [`admin-panel/components/Admin/Automation/NodeConfigDrawer.tsx`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/admin-panel/components/Admin/Automation/NodeConfigDrawer.tsx) - Step configuration drawer
- [`admin-panel/components/Admin/Automation/WorkflowTriggerTab.tsx`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/admin-panel/components/Admin/Automation/WorkflowTriggerTab.tsx) - Trigger settings tab
- [`admin-panel/components/Admin/Automation/WorkflowEnrollmentsTab.tsx`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/admin-panel/components/Admin/Automation/WorkflowEnrollmentsTab.tsx) - Live enrollments & logs monitor
- [`admin-panel/components/Admin/Automation/WorkflowHeader.tsx`](file:///d:/Projects/rhinontech/rhinon-cms/rhinontech/admin-panel/components/Admin/Automation/WorkflowHeader.tsx) - Workflow builder top bar
