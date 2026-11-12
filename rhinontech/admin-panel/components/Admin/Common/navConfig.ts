import type { IconType } from "react-icons";
import {
  TbBook, TbBriefcase, TbBuildingCommunity, TbBulb, TbCalendarEvent, TbCash, TbChartArcs, TbFileText,
  TbHierarchy, TbInbox, TbMessages, TbLayoutDashboard, TbMessageChatbot, TbNews, TbSettings, TbSpeakerphone,
  TbTargetArrow, TbUserCircle, TbUsers,
} from "react-icons/tb";

/**
 * Every module's name and icon, keyed by its first URL segment after the role.
 *
 * The sidebar and the header breadcrumb both read this, so a module renamed
 * here is renamed everywhere. One icon family (Tabler, outline) throughout:
 * the sidebar used to mix filled Material and Font Awesome glyphs in with it.
 */
export const MODULES: Record<string, { label: string; icon: IconType }> = {
  dashboard: { label: "Dashboard", icon: TbLayoutDashboard },
  inbox: { label: "Inbox", icon: TbInbox },
  chat: { label: "Chat", icon: TbMessages },
  pages: { label: "Pages", icon: TbBook },
  crm: { label: "CRM", icon: TbTargetArrow },
  outreach: { label: "Outreach", icon: TbSpeakerphone },
  chatbot: { label: "Chatbot", icon: TbMessageChatbot },
  automation: { label: "Automation", icon: TbHierarchy },
  work: { label: "Work", icon: TbBriefcase },
  employees: { label: "Team", icon: TbUsers },
  attendance: { label: "Attendance", icon: TbUsers },
  leave: { label: "Leave", icon: TbUsers },
  performance: { label: "Performance", icon: TbUsers },
  documents: { label: "Documents", icon: TbFileText },
  payroll: { label: "Payroll", icon: TbCash },
  content: { label: "Content", icon: TbNews },
  "startup-ideas": { label: "Startup Ideas", icon: TbBulb },
  meetings: { label: "Meetings", icon: TbCalendarEvent },
  analytics: { label: "Analytics", icon: TbChartArcs },
  platform: { label: "Workspaces", icon: TbBuildingCommunity },
  settings: { label: "Settings", icon: TbSettings },
  "docs-access": { label: "Docs Access", icon: TbSettings },
  provisioning: { label: "Provisioning", icon: TbSettings },
  profile: { label: "Profile", icon: TbUserCircle },
};

/**
 * One colour per module, shared by the sidebar tiles and the tinted sub-nav icons,
 * so a module reads as the same colour wherever it shows up. Vivid on purpose:
 * the same palette the marketing site gives each product.
 */
export const MODULE_TONES: Record<string, string> = {
  dashboard: "#7b68ee",
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

export const moduleTone = (key: string) => MODULE_TONES[key] ?? "#7b68ee";

/**
 * Whether `pathname` is `href` or somewhere under it. A plain startsWith lets
 * /admin/chat match /admin/chatbot, so two sidebar items lit up at once.
 */
export const isWithin = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
