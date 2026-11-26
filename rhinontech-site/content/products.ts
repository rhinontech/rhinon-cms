import {
  Bot, CalendarCheck, FileText, FolderKanban, Gauge, Inbox, MessagesSquare, Send, Target, UsersRound, Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * The product list that the menu, footer, home page and sitemap share. Each
 * product's own page lives at app/product/<slug>/page.tsx (renamed slugs redirect in next.config.ts) and carries its own
 * copy, so nothing page-specific belongs here.
 */

export type MockKey =
  | "crm" | "outreach" | "inbox" | "chatbot" | "work" | "chat"
  | "hr" | "payroll" | "attendance" | "performance" | "pages";

export type Group = "Win clients" | "Deliver the work" | "Run your team";

export type Product = {
  slug: string;
  name: string;
  group: Group;
  icon: LucideIcon;
  /** Gradient pair for the icon tile, glows and headline accent: one colour family per group. */
  tone: [string, string];
  premium?: boolean;
  /** One line for the menu and tiles. Must stay true to what the product does today. */
  short: string;
  /** Which illustration the home page tiles and hero window use. */
  mock: MockKey;
};

/**
 * The three groups follow a service business's client lifecycle (docs/RHINONTECH_WEBSITE_REVAMP.md §2.4):
 * win the client, deliver the work, and run the team that does it.
 */
export const GROUPS: { name: Group; line: string }[] = [
  { name: "Win clients", line: "Answer, follow up and track every lead" },
  { name: "Deliver the work", line: "Won deals become projects clients can follow" },
  { name: "Run your team", line: "Included: HR, leave, reviews and payroll" },
];

/** One colour family per group, instead of eleven unrelated gradients. */
const WIN: [string, string] = ["#6d4aff", "#2f5bff"];
const DELIVER: [string, string] = ["#0fa68e", "#22b8cf"];
const TEAM: [string, string] = ["#f2793d", "#ff5f8f"];

export const PRODUCTS: Product[] = [
  { slug: "crm", name: "CRM", group: "Win clients", icon: Target, tone: WIN, short: "Leads, deals and every conversation on one timeline", mock: "crm" },
  { slug: "ai-agent", name: "AI Agent", group: "Win clients", icon: Bot, tone: WIN, premium: true, short: "Answers visitors, captures leads, hands off to you", mock: "chatbot" },
  { slug: "outreach", name: "Outreach", group: "Win clients", icon: Send, tone: WIN, short: "AI-written email sequences you approve", mock: "outreach" },
  { slug: "inbox", name: "Inbox", group: "Win clients", icon: Inbox, tone: WIN, short: "Your team's email, next to your CRM", mock: "inbox" },
  { slug: "projects", name: "Projects", group: "Deliver the work", icon: FolderKanban, tone: DELIVER, short: "Projects, tasks and a portal for your clients", mock: "work" },
  { slug: "chat", name: "Chat & Meetings", group: "Deliver the work", icon: MessagesSquare, tone: DELIVER, short: "Channels, calls and guest meeting links", mock: "chat" },
  { slug: "docs", name: "Docs", group: "Deliver the work", icon: FileText, tone: DELIVER, short: "Docs and notes in a tree, next to the work", mock: "pages" },
  { slug: "hr", name: "HR", group: "Run your team", icon: UsersRound, tone: TEAM, short: "Hiring, records, offer letters and e-signing", mock: "hr" },
  { slug: "attendance", name: "Attendance & Leave", group: "Run your team", icon: CalendarCheck, tone: TEAM, short: "Clock in, request leave, approve in a tap", mock: "attendance" },
  { slug: "performance", name: "Performance", group: "Run your team", icon: Gauge, tone: TEAM, short: "Review cycles, goals and feedback", mock: "performance" },
  { slug: "payroll", name: "Payroll", group: "Run your team", icon: Wallet, tone: TEAM, short: "Salary runs, payslips and reimbursements", mock: "payroll" },
];

export const bySlug = (slug: string): Product | undefined => PRODUCTS.find((p) => p.slug === slug);

export const byGroup = (group: Group): Product[] => PRODUCTS.filter((p) => p.group === group);
