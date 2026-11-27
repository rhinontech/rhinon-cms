import type { IconType } from "react-icons";
import {
  TbBook, TbBriefcase, TbBuildingCommunity, TbBulb, TbCalendarEvent, TbCalendarOff, TbCash, TbChartArcs,
  TbChartBar, TbChecklist, TbClockHour4, TbFileText, TbHierarchy, TbInbox, TbMessages, TbMessageChatbot,
  TbNews, TbSettings, TbSmartHome, TbSpeakerphone, TbTargetArrow, TbUserCircle, TbUsers,
} from "react-icons/tb";

export interface ModuleInfo {
  label: string;
  icon: IconType;
  /**
   * The sidebar item this module lives under when it is not one itself —
   * Sequences sits inside Outreach, Leave inside Attendance & Leave. The
   * breadcrumb shows the parent first and the sidebar lights the parent up.
   */
  parent?: string;
}

/**
 * Every module's name and icon, keyed by its first URL segment after the role.
 *
 * The names are the website's (rhinontech.com groups the same products as
 * Sell / Deliver / People), so what someone read before signing up is what they
 * find after. The sidebar, breadcrumbs, Home and search all read this, so a
 * module renamed here is renamed everywhere. One icon family (Tabler, outline).
 */
export const MODULES: Record<string, ModuleInfo> = {
  dashboard: { label: "Home", icon: TbSmartHome },
  approvals: { label: "Approvals", icon: TbChecklist },
  inbox: { label: "Inbox", icon: TbInbox },
  chat: { label: "Team Chat", icon: TbMessages },
  pages: { label: "Docs", icon: TbBook },
  crm: { label: "CRM", icon: TbTargetArrow },
  outreach: { label: "Outreach", icon: TbSpeakerphone },
  chatbot: { label: "AI Agent", icon: TbMessageChatbot },
  automation: { label: "Sequences", icon: TbHierarchy, parent: "outreach" },
  work: { label: "Projects", icon: TbBriefcase },
  employees: { label: "HR & People", icon: TbUsers },
  documents: { label: "Documents", icon: TbFileText, parent: "employees" },
  attendance: { label: "Attendance & Leave", icon: TbClockHour4 },
  leave: { label: "Leave", icon: TbCalendarOff, parent: "attendance" },
  performance: { label: "Performance", icon: TbChartBar },
  payroll: { label: "Payroll", icon: TbCash },
  content: { label: "Content", icon: TbNews },
  "startup-ideas": { label: "Startup Ideas", icon: TbBulb },
  meetings: { label: "Meetings", icon: TbCalendarEvent },
  analytics: { label: "Analytics", icon: TbChartArcs },
  platform: { label: "Workspaces", icon: TbBuildingCommunity },
  settings: { label: "Settings", icon: TbSettings },
  "docs-access": { label: "Docs Access", icon: TbSettings, parent: "settings" },
  provisioning: { label: "Provisioning", icon: TbSettings, parent: "settings" },
  profile: { label: "Profile", icon: TbUserCircle },
};

/**
 * One colour per module, shared by the sidebar tiles and the tinted sub-nav icons,
 * so a module reads as the same colour wherever it shows up. Vivid on purpose:
 * the same palette the marketing site gives each product.
 */
export const MODULE_TONES: Record<string, string> = {
  dashboard: "#7b68ee",
  approvals: "#10b981",
  inbox: "#2f8fff",
  chat: "#12b5cb",
  pages: "#8b5cf6",
  crm: "#4f6bff",
  outreach: "#f45bb5",
  chatbot: "#ff8a3d",
  automation: "#f59e0b",
  work: "#08c98c",
  employees: "#ff5fa2",
  attendance: "#14b8a6",
  leave: "#14b8a6",
  performance: "#a855f7",
  documents: "#6b8afd",
  payroll: "#ffb020",
  content: "#ef5da8",
  "startup-ideas": "#f5b400",
  meetings: "#3b82f6",
  analytics: "#6366f1",
  platform: "#7b68ee",
  settings: "#64748b",
  "docs-access": "#64748b",
  provisioning: "#64748b",
  profile: "#64748b",
};

/** A module inside another (Sequences in Outreach) wears its parent's colour, so the section reads as one. */
export const moduleTone = (key: string) => MODULE_TONES[MODULES[key]?.parent ?? key] ?? "#7b68ee";

/**
 * Whether `pathname` is `href` or somewhere under it. A plain startsWith lets
 * /admin/chat match /admin/chatbot, so two sidebar items lit up at once.
 */
export const isWithin = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/* ------------------------------------------------------------------ *
 * The sidebar: Home, then Sell / Deliver / People, like the website
 * ------------------------------------------------------------------ */

export interface NavEntry {
  /** Module key — the first URL segment after the role, and the MODULES key. */
  key: string;
  /** Shown when the person holds any of these. */
  permissions: string[];
  /** One line saying what lives here — Home's launcher and search use it. */
  description: string;
  /** Other modules whose pages light this item up (Outreach owns Sequences). */
  match?: string[];
  /** Where the item goes when the person can't open its first screen: the first route they can open wins. */
  routes?: Array<{ key: string; permissions: string[] }>;
}

export interface NavSection {
  key: "sell" | "deliver" | "people";
  label: string;
  items: NavEntry[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    key: "sell",
    label: "Sell",
    items: [
      { key: "crm", permissions: ["crm:read"], description: "Leads, accounts and deals in one pipeline" },
      { key: "outreach", permissions: ["outreach:read"], description: "Email campaigns, sequences and lists", match: ["automation"] },
      { key: "inbox", permissions: ["inbox:read"], description: "Replies and team email on your domain" },
      { key: "chatbot", permissions: ["chatbot:read"], description: "Your website assistant, live chats and tickets" },
      { key: "analytics", permissions: ["analytics:read"], description: "Who visits your website, and from where" },
    ],
  },
  {
    key: "deliver",
    label: "Deliver",
    items: [
      { key: "work", permissions: ["work:read"], description: "Projects, tasks, sprints and the client portal" },
      { key: "chat", permissions: ["chat:read"], description: "Messages, channels and calls with your team" },
      { key: "meetings", permissions: ["meetings:read"], description: "Your calendar and meeting links" },
      { key: "pages", permissions: ["pages:read"], description: "Docs and notes in one tree" },
    ],
  },
  {
    key: "people",
    label: "People",
    items: [
      {
        key: "employees",
        permissions: ["people:read", "documents:read"],
        description: "Directory, hiring and documents",
        match: ["documents"],
        routes: [
          { key: "employees", permissions: ["people:read"] },
          { key: "documents", permissions: ["documents:read"] },
        ],
      },
      {
        key: "attendance",
        permissions: ["attendance:read", "leave:read"],
        description: "Clock in, time off and approvals",
        match: ["leave"],
        routes: [
          { key: "attendance", permissions: ["attendance:read"] },
          { key: "leave", permissions: ["leave:read"] },
        ],
      },
      { key: "payroll", permissions: ["payslips:read"], description: "Salary runs, payslips and reimbursements" },
      { key: "performance", permissions: ["performance:read"], description: "Review cycles, goals and feedback" },
    ],
  },
];

/** Rhinon's own modules, shown only inside the platform workspace. */
export const PLATFORM_ITEMS: NavEntry[] = [
  { key: "platform", permissions: [], description: "Every customer workspace" },
  { key: "content", permissions: ["content:read"], description: "Blogs, case studies and events for the websites" },
  { key: "startup-ideas", permissions: ["startupIdeas:read"], description: "Submissions from the /build campaign" },
];

/** Who can approve anything — the same checks the API makes on each approval route. */
export const APPROVAL_PERMISSIONS = ["leave:write", "attendance:write", "employees:read", "payroll:write"];

/** The first route this person can open for an entry, or null when there is none. */
export function entryRoute(entry: NavEntry, has: (...anyOf: string[]) => boolean): string | null {
  if (!entry.routes) return entry.key;
  return entry.routes.find((route) => has(...route.permissions))?.key ?? null;
}

/** Whether an entry owns the current page — its own module, or one it absorbed. */
export function entryIsActive(entry: NavEntry, pathname: string): boolean {
  const moduleKey = pathname.split("/")[2] ?? "";
  return moduleKey === entry.key || (entry.match ?? []).includes(moduleKey);
}

/* ------------------------------------------------------------------ *
 * Page names, so breadcrumbs and search say what the menus say
 * ------------------------------------------------------------------ */

/**
 * Labels for the page segment after a module, keyed `module/segment`.
 *
 * Breadcrumbs used to humanise the URL, so "All projects" showed as "Clients"
 * and "Attendance Rules" as "Governance". These match the menu labels instead.
 */
export const PAGE_LABELS: Record<string, string> = {
  "crm/": "Leads",
  "crm/accounts": "Accounts",
  "crm/pipeline": "Deals",
  "crm/deals": "Deals",
  "crm/reports": "Reports",
  "crm/finder": "Lead Finder",
  "outreach/": "Overview",
  "outreach/campaigns": "Campaigns",
  "outreach/contacts": "Lists",
  "outreach/publishing": "LinkedIn",
  "outreach/manual": "Manual send",
  "outreach/templates": "Templates",
  "automation/workflows": "Workflows",
  "automation/enrollments": "Enrollments",
  "automation/settings": "Sequence settings",
  "chatbot/": "Overview",
  "chatbot/visitors": "Live visitors",
  "chatbot/chats": "Live chats",
  "chatbot/tickets": "Tickets",
  "chatbot/help": "Help center",
  "chatbot/campaigns": "Pop-ups",
  "chatbot/training": "Training",
  "chatbot/appearance": "Appearance",
  "chatbot/forms": "Forms",
  "work/projects": "Projects",
  "work/clients": "Projects",
  "work/tasks": "Tasks",
  "work/sprints": "Sprints",
  "work/plan": "Weekly plan",
  "work/changes": "Changes & bugs",
  "work/teams": "Teams",
  "work/commits": "Commits",
  "employees/hiring": "Hiring",
  "employees/addresses": "Email addresses",
  "documents/": "My documents",
  "documents/all": "All documents",
  "documents/requests": "Document requests",
  "attendance/my": "My attendance",
  "attendance/logs": "Attendance logs",
  "attendance/approvals": "Attendance approvals",
  "attendance/governance": "Attendance rules",
  "leave/requests": "Leave requests",
  "leave/calendar": "Team calendar",
  "leave/approvals": "Leave approvals",
  "leave/policies": "Leave policies",
  "performance/cycles": "Cycles",
  "performance/goals": "Goals",
  "performance/reviews": "Reviews",
  "performance/team": "Team",
  "payroll/overview": "Overview",
  "payroll/employees": "Employees",
  "payroll/run": "Run payroll",
  "payroll/entry": "Payslip entry",
  "payroll/settlements": "Settlements",
  "payroll/payslips": "Payslips",
  "payroll/reimbursements": "Reimbursements",
  "payroll/salary": "Salary details",
  "payroll/deductions": "Deductions",
  "payroll/benefits": "Benefits",
  "settings/accounts": "Accounts",
  "settings/billing": "Plan & usage",
  "settings/email-domain": "Email domain",
  "settings/email-addresses": "Email addresses",
  "settings/developers": "Developers",
  "settings/audit-log": "Activity log",
  "settings/data": "Data & privacy",
  "settings/roles": "Roles & permissions",
  "settings/governance": "Access governance",
  "settings/google-calendar": "Workspace calendar",
  "settings/deploy": "Deploy",
  "settings/letter-templates": "Letter templates",
  "settings/appearance": "Appearance",
  "profile/info": "Your profile",
  "profile/security": "Security",
  "content/blogs": "Blogs",
  "content/case-studies": "Case studies",
  "content/events": "Events",
  "content/ai-writer": "AI writer",
  "analytics/setup": "Setup",
  "analytics/visitor-maps": "Visitor map",
};

/**
 * Screens worth jumping to by name from ⌘K, beyond each module's front door.
 * `segment` is the path after the module (and after the brand, for brand-split
 * modules); the label comes from PAGE_LABELS so search and breadcrumbs agree.
 */
export const JUMP_PAGES: Array<{ module: string; segment: string; permissions: string[]; keywords?: string; ownerOnly?: boolean }> = [
  { module: "crm", segment: "accounts", permissions: ["crm:read"], keywords: "companies" },
  { module: "crm", segment: "pipeline", permissions: ["crm:read"], keywords: "pipeline board opportunities" },
  { module: "crm", segment: "reports", permissions: ["crm:read"], keywords: "forecast" },
  { module: "outreach", segment: "campaigns", permissions: ["outreach:read"], keywords: "cold email" },
  { module: "outreach", segment: "contacts", permissions: ["outreach:read"], keywords: "contact groups audiences" },
  { module: "outreach", segment: "publishing", permissions: ["outreach:read"], keywords: "posts social" },
  { module: "automation", segment: "workflows", permissions: ["outreach:read"], keywords: "automation sequences drip" },
  { module: "chatbot", segment: "chats", permissions: ["chatbot:read"], keywords: "conversations live chat" },
  { module: "chatbot", segment: "tickets", permissions: ["chatbot:read"], keywords: "support" },
  { module: "chatbot", segment: "training", permissions: ["chatbot:read"], keywords: "knowledge documents" },
  { module: "chatbot", segment: "help", permissions: ["chatbot:read"], keywords: "articles faq" },
  { module: "chatbot", segment: "campaigns", permissions: ["chatbot:read"], keywords: "popup campaigns" },
  { module: "work", segment: "projects", permissions: ["work:read"], keywords: "clients" },
  { module: "work", segment: "tasks", permissions: ["work:read"], keywords: "todo" },
  { module: "work", segment: "sprints", permissions: ["work:read"] },
  { module: "employees", segment: "hiring", permissions: ["employees:read", "people:read"], keywords: "recruiting interviews openings" },
  { module: "documents", segment: "", permissions: ["documents:read"], keywords: "files" },
  { module: "attendance", segment: "approvals", permissions: ["attendance:write", "employees:read"], keywords: "regularisation" },
  { module: "attendance", segment: "governance", permissions: ["attendance:read"], keywords: "shift policy" },
  { module: "leave", segment: "requests", permissions: ["leave:read"], keywords: "time off holiday" },
  { module: "leave", segment: "approvals", permissions: ["leave:write"], keywords: "time off" },
  { module: "leave", segment: "policies", permissions: ["leave:write"], keywords: "leave types" },
  { module: "payroll", segment: "run", permissions: ["payroll:write"], keywords: "salary" },
  { module: "payroll", segment: "payslips", permissions: ["payslips:read"], keywords: "salary slip" },
  { module: "payroll", segment: "reimbursements", permissions: ["payslips:read"], keywords: "expenses claims" },
  { module: "performance", segment: "goals", permissions: ["performance:read"] },
  { module: "performance", segment: "reviews", permissions: ["performance:read"] },
  { module: "settings", segment: "billing", permissions: ["settings:read"], keywords: "plan upgrade pricing" },
  { module: "settings", segment: "roles", permissions: ["settings:write"], keywords: "permissions access" },
  { module: "settings", segment: "email-domain", permissions: ["settings:read"], keywords: "dns dkim" },
  // Handing out hello@ / support@ is the owner's call alone (the old Team sub-nav rule).
  { module: "settings", segment: "email-addresses", permissions: [], ownerOnly: true, keywords: "shared mailbox support hello" },
  { module: "settings", segment: "data", permissions: ["settings:read"], keywords: "export delete privacy" },
  { module: "profile", segment: "security", permissions: [], keywords: "password 2fa two-factor" },
];
