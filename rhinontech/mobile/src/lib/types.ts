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
  attachments: { key?: string; name: string; size?: number; mimeType?: string; url: string | null }[];
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
  instagramUrl?: string | null;
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
  stageId?: string | null;
  primaryLeadId?: string | null;
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

export interface AttendanceDay {
  id: string | null;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: "present" | "absent" | "weekend" | "holiday" | "leave";
  note?: string | null;
  breaks?: { start: string; end: string | null }[];
  durationMinutes: number;
}

export interface TeamToday {
  date: string;
  summary: { total: number; present: number; absent: number; active: number; onBreak: number };
  employees: {
    userId: string;
    fullName: string;
    department: string | null;
    attendance: { status: string; clockIn: string | null; clockOut: string | null; durationMinutes: number; onBreak: boolean };
  }[];
}

export type RequestStatus = "Pending" | "Approved" | "Rejected";

export interface AttendanceRequest {
  id: string;
  type: string;
  date: string;
  reason: string;
  requestedTime: string | null;
  status: RequestStatus;
  userName?: string;
}

export interface LeaveBalance {
  leaveTypeId: string;
  name: string;
  color: string | null;
  allocated: number;
  used: number;
  remaining: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: RequestStatus;
  managerNote?: string | null;
  userName?: string;
  department?: string | null;
  leaveTypeName?: string;
  leaveTypeColor?: string | null;
}

export interface ReimbursementClaim {
  id: string;
  category: string;
  description: string;
  amount: string | number;
  status: string;
  employee?: { id: string; fullName: string; department: string | null } | null;
}

export interface WorkflowStatus {
  id: string;
  name: string;
  color: string | null;
  group: string;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  descriptionHtml?: string | null;
  status: string;
  statusId?: string | null;
  priority?: string | null;
  dueDate?: string | null;
  projectId?: string | null;
  assignee?: { id: string; fullName: string } | null;
  project?: { id: string; name: string } | null;
  workflowStatus?: WorkflowStatus | null;
  subtasks?: { id: string; title: string; done: boolean }[];
}

export interface TaskComment {
  id: string;
  body: string;
  createdAt: string;
  author?: { id: string; fullName: string } | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  notes?: string | null;
  visibility?: "workspace" | "team" | "private";
  teamId?: string | null;
  taskCount: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  role: "owner" | "member";
  user?: { id: string; fullName: string; companyEmail: string; department: string | null } | null;
}

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  members?: TeamMember[];
  projectCount?: number;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  usersCount?: number;
  Permissions?: Permission[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  count: number;
  readAt: string | null;
  updatedAt: string;
}
