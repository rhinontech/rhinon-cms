/** Response shapes from rhinontech/backend, trimmed to what the app reads. */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  emailDomain: string;
  status: "active" | "trial" | "suspended";
  plan: "free" | "starter" | "enterprise";
  isPlatform: boolean;
}

export interface Me {
  id: string;
  fullName: string;
  companyEmail: string;
  personalEmail?: string | null;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  userType?: "internal" | "guest";
  roleSlug: string;
  permissions: string[];
  organization: Organization | null;
  role?: { name: string } | null;
}

export interface LoginResponse {
  token?: string;
  mfaRequired?: boolean;
  mfaToken?: string;
  roleSlug?: string;
  userType?: "internal" | "guest";
}

export interface DashboardStats {
  currentUser: { fullName: string; department: string; role: string };
  totalEmployees: number;
  newThisMonth: number;
  pendingTasks: number;
  daysPresent: number;
  totalMinutesThisMonth: number;
  todayAttendance: { clockIn: string | null; clockOut: string | null; durationMinutes: number } | null;
  birthdays: Celebration[];
  anniversaries: Celebration[];
  recentHires: { id: string; fullName: string; department: string | null; role: string | null; joiningDate: string }[];
  pendingTasksList: { id: string; title: string; team: string | null; dueDate: string | null; status: string }[];
  crm: { openCount: number; openValue: number; weightedValue: number; myOpenCount: number } | null;
}

export interface Celebration {
  id: string;
  fullName: string;
  day: number;
  role: string | null;
  department: string | null;
  isToday: boolean;
}

export type InboxFolder = "inbox" | "sent" | "starred" | "archive" | "trash";

export interface InboxEmail {
  id: string;
  threadKey: string;
  folder: string;
  fromName: string;
  fromEmail: string;
  toEmails: string[];
  subject: string;
  snippet: string;
  body?: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  attachments?: { name: string; url?: string | null }[];
  isInternal?: boolean;
  sentAt: string;
  campaign?: { id: string; name: string } | null;
}

export interface InboxThreadItem extends InboxEmail {
  body: string;
  fromMe: boolean;
  senderAvatarUrl: string | null;
}

export interface InboxEmailDetail extends InboxEmail {
  thread: InboxThreadItem[];
}

export interface ChatUser {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  email: string | null;
  avatarUrl: string | null;
  presence: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  isSystem: boolean;
  replyCount: number;
  editedAt: string | null;
  deleted: boolean;
  reactions: { emoji: string; userIds: string[] }[];
  attachments: { name: string; url: string | null }[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  kind: "direct" | "channel" | "group" | string;
  name: string | null;
  description: string | null;
  isPrivate: boolean;
  memberIds: string[];
  unread: number;
  mentionUnread: number;
  muted: boolean;
  pinned: boolean;
  lastMessage: ChatMessage | null;
  lastMessageAt: string | null;
}

export type LeadStatus =
  | "New" | "Enriched" | "Enrolled" | "Emailed" | "Replied" | "Bounced" | "Unsubscribed" | "Interested";

export interface Lead {
  id: string;
  name: string;
  company: string;
  title?: string | null;
  email: string;
  phone?: string | null;
  linkedinUrl?: string | null;
  website?: string | null;
  status: LeadStatus;
  source: string;
  lifecycleStage?: string | null;
  notes?: string | null;
  addedAt?: string;
  lastActivityAt?: string | null;
}

export interface Deal {
  id: string;
  title: string;
  value: string | number;
  currency?: string | null;
  status: string;
  expectedCloseDate?: string | null;
  account?: { id: string; name: string } | null;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string | null;
  probability: number;
  type: string;
  deals: Deal[];
  dealCount: number;
  totalValue: number;
}
