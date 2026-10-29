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
