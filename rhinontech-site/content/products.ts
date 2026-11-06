import {
  Bot, CalendarCheck, FileText, FolderKanban, Gauge, Inbox, MessagesSquare, Send, Target, UsersRound, Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * The product list that the menu, footer, home page and sitemap share. Each
 * product's own page lives at app/product/<slug>/page.tsx and carries its own
 * copy, so nothing page-specific belongs here.
 */

export type MockKey =
  | "crm" | "outreach" | "inbox" | "chatbot" | "work" | "chat"
  | "hr" | "payroll" | "attendance" | "performance" | "pages";

export type Group = "Sell" | "Deliver" | "People";

export type Product = {
  slug: string;
  name: string;
  group: Group;
  icon: LucideIcon;
  /** Gradient pair: icon tile, glows and headline accent for this product. */
  tone: [string, string];
  premium?: boolean;
  /** One line for the menu and tiles. */
  short: string;
  /** Which illustration the home page tiles and hero window use. */
  mock: MockKey;
};

export const GROUPS: { name: Group; line: string }[] = [
  { name: "Sell", line: "Find, win and keep customers" },
  { name: "Deliver", line: "Do the work and keep everyone in step" },
  { name: "People", line: "Hire, pay and grow your team" },
];

export const PRODUCTS: Product[] = [
  { slug: "crm", name: "CRM", group: "Sell", icon: Target, tone: ["#2f5bff", "#7c5cff"], short: "Leads, deals and every email on one timeline", mock: "crm" },
  { slug: "outreach", name: "Outreach", group: "Sell", icon: Send, tone: ["#7c5cff", "#e04dd6"], short: "AI cold email that sounds like you wrote it", mock: "outreach" },
  { slug: "inbox", name: "Inbox", group: "Sell", icon: Inbox, tone: ["#2cd3ff", "#2f5bff"], short: "One shared inbox for replies and support", mock: "inbox" },
  { slug: "chatbot", name: "AI Chatbot", group: "Sell", icon: Bot, tone: ["#ff8a4c", "#ff5fb0"], premium: true, short: "A website assistant trained on your own content", mock: "chatbot" },
  { slug: "work", name: "Work", group: "Deliver", icon: FolderKanban, tone: ["#10c98f", "#2cd3ff"], short: "Projects, tasks and a portal your clients love", mock: "work" },
  { slug: "chat", name: "Team Chat & Meetings", group: "Deliver", icon: MessagesSquare, tone: ["#2f5bff", "#2cd3ff"], short: "Chat, group calls and meeting links", mock: "chat" },
  { slug: "pages", name: "Pages", group: "Deliver", icon: FileText, tone: ["#4f6bff", "#a78bfa"], short: "Docs and notes in a tree, next to the work", mock: "pages" },
  { slug: "hr", name: "HR & People", group: "People", icon: UsersRound, tone: ["#ff5fb0", "#7c5cff"], short: "Onboarding, records, offer letters and e-signing", mock: "hr" },
  { slug: "payroll", name: "Payroll", group: "People", icon: Wallet, tone: ["#ffb547", "#ff8a4c"], short: "Monthly runs and payslips, built for India", mock: "payroll" },
  { slug: "attendance", name: "Attendance & Leave", group: "People", icon: CalendarCheck, tone: ["#2cd3ff", "#10c98f"], short: "Clock in, request leave, approve in a tap", mock: "attendance" },
  { slug: "performance", name: "Performance", group: "People", icon: Gauge, tone: ["#7c5cff", "#2f5bff"], short: "Review cycles, goals and feedback", mock: "performance" },
];

export const bySlug = (slug: string): Product | undefined => PRODUCTS.find((p) => p.slug === slug);

export const byGroup = (group: Group): Product[] => PRODUCTS.filter((p) => p.group === group);
