# Rhinon CMS - Private Operations & Outbound Engine Blueprint

Rhinon is a **Private Content Management System (CMS) & Outbound Sales Engine** designed exclusively for internal organizational use. It acts as the central hub for managing leads, structuring outreach, designing multi-channel templates, and executing AI-powered marketing campaigns.

This document outlines the current architecture and serves as a comprehensive **UI/UX Blueprint** for designing the admin dashboard. It details all planned features, workflows, and user journeys so designers can create a cohesive experience.

---

## 1. Core Platform Architecture

*   **Framework:** Next.js 16 (App Router) with React 18
*   **Styling & UI Components:** Tailwind CSS v4, Radix UI primitives, `shadcn/ui`, and Framer Motion for micro-interactions.
*   **Database:** MongoDB via Mongoose ORM.
*   **AI Engine:** Google Gemini (2.5 Flash) for generating personalized messaging.

---

## 2. Global UI Structure

The platform should feel like a premium, high-density professional tool (similar to Linear, Notion, or Retool). 

### Layout Elements
1.  **Sidebar Navigation (Left):** Collapsible sidebar containing primary modules (Dashboard, Campaigns, Leads, Templates, Assets, Team, Settings).
2.  **Organization/Role Switcher (Top Left):** A dropdown allowing internal team members to switch contexts if they hold multiple roles.
3.  **Global Search & Command Menu (Top Center):** `Cmd+K` interface to jump quickly between campaigns, specific leads, or settings.
4.  **Main Content Area (Center/Right):** The primary workspace. Should utilize a Tabbed or Card-based layout to maximize data density without clutter.
5.  **Contextual Action Bar (Top Right):** Context-specific primary actions (e.g., "New Campaign", "Import Leads", "Save Draft").

---

## 3. Feature Modules & Detailed Workflows

### Module A: Admin Dashboard (The Command Center)
**Purpose:** Provides a high-level overview of system health and campaign performance.
**UI Requirements & Workflows:**
*   **Metric Cards:** Total active campaigns, leads processed today, emails sent, reply rate.
*   **Recent Activity Feed:** A chronological list of system actions (e.g., "Campaign 'Q3 Outreach' finished processing 500 leads").
*   **Performance Charts:** Line/Bar charts showing outreach volume vs. engagement over time.

### Module B: Lead Management System
**Purpose:** The central repository for all contact data and pipeline stages.
**UI Requirements & Workflows:**
*   **List View (Datatable):** A robust table showing Lead Name, Company, Email, Assigned Campaign, and Status (`New`, `Emailed`, `Replied`, `Bounced`). Needs filtering, sorting, and bulk-selection capabilities.
*   **Lead Detail Drawer/Modal:** Clicking a lead opens a side-drawer showing:
    *   Contact Info & Social Links.
    *   **Activity Timeline:** When they were added, when AI generated their email, when the email was sent, and any replies.
    *   **Generated Content Preview:** The exact AI-generated text prepared for them, with the ability for a human to manually edit it before it sends.
*   **Import Workflow:** A drag-and-drop zone for CSV/Excel uploads, followed by a column-mapping UI to match CSV fields to database fields.

### Module C: Template Builder (Email & Social)
**Purpose:** A place to design reusable messaging structures and AI prompt guidelines.
**UI Requirements & Workflows:**
*   **Template Library:** A grid or list of existing templates tagged by channel (Email, LinkedIn, Instagram).
*   **Template Editor Workflow:**
    *   **Split Screen View:** Left side is the editor, right side is the live preview or AI prompt tester.
    *   **Variables:** Buttons to inject variables (e.g., `{{lead.name}}`, `{{lead.company}}`) into the text.
    *   **AI Prompting:** A specific text area to write the "Instructions for AI" (e.g., "Keep it under 3 sentences, mention their recent funding").

### Module D: Campaign Orchestration
**Purpose:** Tying Leads and Templates together to execute outreach.
**UI Requirements & Workflows:**
*   **Campaign Board (Kanban or List):** Display active, drafted, and completed campaigns.
*   **Create Campaign Workflow (Step-by-Step Wizard):**
    1.  **Setup:** Name the campaign, select the channel (Email, LinkedIn connection req, LinkedIn DM).
    2.  **Audience:** Select existing leads or upload a new cohort.
    3.  **Messaging:** Attach a Template from the library or create a custom "AI Prompt Template" for this specific run.
    4.  **Execution Settings:** Set send limits (e.g., "Process 50 leads per day") and schedule the start time.
    5.  **Review & Launch:** Summary screen before setting the campaign to `Active`.
*   **Campaign Detail Dashboard:** Specific analytics for a single campaign, showing progress bars of leads processed vs. pending.

### Module E: Inbox / Reply Management (Upcoming Feature)
**Purpose:** Centralizing responses to outreach directly inside the CMS instead of relying on external email clients.
**UI Requirements & Workflows:**
*   **Split-Pane Email Client:** Standard inbox view (list of conversations on the left, active conversation on the right).
*   **Contextual Sidebar:** When viewing a reply, the right-most pane shows the Lead's details and which Campaign triggered this reply.
*   **AI Assist Reply:** A button to have the Gemini AI draft a response to the lead based on their reply.

### Module F: Team & Role Management (RBAC)
**Purpose:** Controlling internal access.
**UI Requirements & Workflows:**
*   **Unified Tabular UI:** "Users & Invites" tab to manage active personnel, and a "Roles & Permissions" tab to define access levels.
*   **Create Role Modal:** Text input for Role Name and a scrollable checklist of granular permissions (e.g., `manage_leads`, `create_campaigns`, `edit_templates`, `view_analytics`).
*   **Invite Workflow:** A quick form to generate a secure invite link assigned to a specific role.

---

## 4. Automation & Background Processes (Invisible to User but informs UI states)
*   **The AI Engine (`/api/cron/process-emails`):** The UI must accommodate asynchronous "Loading" states or "Processing" badges, as the backend routinely wakes up, finds `New` leads, grabs the Campaign's AI Prompt, and asks Gemini to generate the personalized text.
*   **Dispatch Mechanism:** The UI should visually distinguish between "AI Generated (Pending Review)" and "Actually Sent".

## 5. Core Tech Stack
* **Framework:** Next.js 16 (App Router) with React 18
* **Styling & UI:** Tailwind CSS v4, Radix UI primitives, `shadcn/ui`, and Framer Motion for animations.
* **Database:** MongoDB via Mongoose ORM.
* **State Management:** Zustand for global client state and `js-cookie` for persistence.
* **AI Integration:** `@google/genai` (Gemini 2.5 Flash) for generating personalized email copy.
* **Background Jobs:** Node-cron for scheduled email processing.