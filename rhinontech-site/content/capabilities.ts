import {
  Activity, AtSign, BarChart3, BellRing, Bookmark, Bot, Briefcase, CalendarCheck, CalendarClock, CalendarDays, CalendarRange,
  ClipboardCheck, Clock3, Coffee, Columns3, Combine, Download, FileSignature, FileText, FolderTree, GitBranch, Goal, History, Inbox,
  KeyRound, Layers, LayoutList, LifeBuoy, Link2, Linkedin, ListChecks, Lock, LogOut, MailCheck, MailOpen, Megaphone, MessagesSquare,
  MonitorPlay, Paperclip, PenLine, PhoneCall, Receipt, Repeat, Reply, ScrollText, Send, Share2, ShieldCheck, Smartphone, Sparkles,
  Split, Target, Ticket, TimerReset, Upload, UserCheck, UserPlus, Users, UsersRound, Video, Wallet, Workflow, XCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * Everything the product does today, one line each, grouped the way a service business works.
 * This is the site's single source for capability lists (home grid, product hub, pricing matrix).
 *
 * Every entry was checked against the backend, the app, git history (all on main) or facts already
 * verified for the product pages, and must stay inside the claims register
 * (docs/RHINONTECH_WEBSITE_REVAMP.md §2.6). Never add something that is planned but not built:
 * project templates, time tracking, invoices, WhatsApp, inbox thread assignment and statutory
 * payroll filing are NOT built.
 */

export type CapabilityGroup = "Win clients" | "Deliver the work" | "Run your team" | "Workspace";

export type Capability = {
  label: string;
  icon: LucideIcon;
  /** Product page that covers it; workspace-wide items link to /security instead. */
  product?: string;
  group: CapabilityGroup;
  /** On the Starter plan or above (only the AI Agent and the custom sending domain). */
  paid?: boolean;
};

export const CAPABILITIES: Capability[] = [
  // Win clients
  { label: "Leads and deals", icon: Target, product: "crm", group: "Win clients" },
  { label: "Your own pipeline stages", icon: Columns3, product: "crm", group: "Win clients" },
  { label: "One timeline per lead", icon: Activity, product: "crm", group: "Win clients" },
  { label: "Duplicate detection and merge", icon: Combine, product: "crm", group: "Win clients" },
  { label: "Bulk convert leads to deals", icon: Layers, product: "crm", group: "Win clients" },
  { label: "Lost reasons", icon: XCircle, product: "crm", group: "Win clients" },
  { label: "CRM reports", icon: BarChart3, product: "crm", group: "Win clients" },
  { label: "Saved views", icon: Bookmark, product: "crm", group: "Win clients" },
  { label: "Spreadsheet import", icon: Upload, product: "crm", group: "Win clients" },
  { label: "AI Agent trained on your site", icon: Bot, product: "ai-agent", group: "Win clients", paid: true },
  { label: "Live hand-off to your team", icon: UserCheck, product: "ai-agent", group: "Win clients", paid: true },
  { label: "Tickets", icon: Ticket, product: "ai-agent", group: "Win clients", paid: true },
  { label: "Help center", icon: LifeBuoy, product: "ai-agent", group: "Win clients", paid: true },
  { label: "Pop-up campaigns", icon: Megaphone, product: "ai-agent", group: "Win clients", paid: true },
  { label: "Call a website visitor", icon: PhoneCall, product: "ai-agent", group: "Win clients", paid: true },
  { label: "AI-drafted cold email", icon: Sparkles, product: "outreach", group: "Win clients" },
  { label: "Sequences with branches", icon: GitBranch, product: "outreach", group: "Win clients" },
  { label: "A/B splits", icon: Split, product: "outreach", group: "Win clients" },
  { label: "LinkedIn and call steps", icon: Linkedin, product: "outreach", group: "Win clients" },
  { label: "Open tracking", icon: MailOpen, product: "outreach", group: "Win clients" },
  { label: "Live send console", icon: MonitorPlay, product: "outreach", group: "Win clients" },
  { label: "Daily limits and send windows", icon: Send, product: "outreach", group: "Win clients" },
  { label: "Team and shared inboxes", icon: Inbox, product: "inbox", group: "Win clients" },
  { label: "Reply from your own mailbox", icon: Reply, product: "inbox", group: "Win clients" },
  { label: "Send from your own domain", icon: AtSign, product: "inbox", group: "Win clients", paid: true },

  // Deliver the work
  { label: "Won deal to project in one click", icon: Briefcase, product: "projects", group: "Deliver the work" },
  { label: "List, board and calendar views", icon: LayoutList, product: "projects", group: "Deliver the work" },
  { label: "Gantt timeline", icon: CalendarRange, product: "projects", group: "Deliver the work" },
  { label: "Sprints", icon: TimerReset, product: "projects", group: "Deliver the work" },
  { label: "Subtasks, blockers and recurrence", icon: ListChecks, product: "projects", group: "Deliver the work" },
  { label: "Client portal", icon: Share2, product: "projects", group: "Deliver the work" },
  { label: "Client requests become tasks", icon: ClipboardCheck, product: "projects", group: "Deliver the work" },
  { label: "Private and team projects", icon: Lock, product: "projects", group: "Deliver the work" },
  { label: "Channels and direct messages", icon: MessagesSquare, product: "chat", group: "Deliver the work" },
  { label: "Threaded replies", icon: Workflow, product: "chat", group: "Deliver the work" },
  { label: "Group video calls of up to 8", icon: Video, product: "chat", group: "Deliver the work" },
  { label: "Guest meeting links", icon: Link2, product: "chat", group: "Deliver the work" },
  { label: "Built-in calendar", icon: CalendarDays, product: "chat", group: "Deliver the work" },
  { label: "Meeting booking", icon: CalendarClock, product: "chat", group: "Deliver the work" },
  { label: "Docs in a nested tree", icon: FolderTree, product: "docs", group: "Deliver the work" },
  { label: "File attachments", icon: Paperclip, product: "docs", group: "Deliver the work" },

  // Run your team
  { label: "Hiring: jobs, candidates, interviews", icon: UserPlus, product: "hr", group: "Run your team" },
  { label: "E-signed offer letters and NDAs", icon: FileSignature, product: "hr", group: "Run your team" },
  { label: "AI rewrite for letters", icon: PenLine, product: "hr", group: "Run your team" },
  { label: "Onboarding and company email", icon: MailCheck, product: "hr", group: "Run your team" },
  { label: "Offboarding", icon: LogOut, product: "hr", group: "Run your team" },
  { label: "Clock in and out", icon: Clock3, product: "attendance", group: "Run your team" },
  { label: "Breaks and corrections", icon: Coffee, product: "attendance", group: "Run your team" },
  { label: "Leave types and balances", icon: CalendarCheck, product: "attendance", group: "Run your team" },
  { label: "Review cycles", icon: Repeat, product: "performance", group: "Run your team" },
  { label: "Goals per person", icon: Goal, product: "performance", group: "Run your team" },
  { label: "Salary runs and payslips", icon: Wallet, product: "payroll", group: "Run your team" },
  { label: "Reimbursements", icon: Receipt, product: "payroll", group: "Run your team" },
  { label: "Final settlement", icon: ScrollText, product: "payroll", group: "Run your team" },

  // Workspace
  { label: "Roles and permissions", icon: Users, group: "Workspace" },
  { label: "Two-factor sign-in", icon: Smartphone, group: "Workspace" },
  { label: "Audit log", icon: History, group: "Workspace" },
  { label: "Export or delete your data", icon: Download, group: "Workspace" },
  { label: "Workspaces kept separate", icon: ShieldCheck, group: "Workspace" },
  { label: "Real-time notifications", icon: BellRing, product: "chat", group: "Workspace" },
  { label: "Encrypted connected accounts", icon: KeyRound, group: "Workspace" },
  { label: "Docs sharing controls", icon: FileText, product: "docs", group: "Workspace" },
  { label: "Teams", icon: UsersRound, product: "projects", group: "Workspace" },
];

export const CAPABILITY_GROUPS: { name: CapabilityGroup; line: string }[] = [
  { name: "Win clients", line: "Answer, follow up and track every lead" },
  { name: "Deliver the work", line: "Projects your clients can follow" },
  { name: "Run your team", line: "HR, leave, reviews and payroll" },
  { name: "Workspace", line: "Security and control, built in" },
];

export const capabilityHref = (c: Capability): string => (c.product ? `/product/${c.product}` : "/security");

export const capabilitiesIn = (group: CapabilityGroup): Capability[] => CAPABILITIES.filter((c) => c.group === group);
