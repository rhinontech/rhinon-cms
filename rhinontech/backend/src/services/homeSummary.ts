import { Op, type WhereOptions } from "sequelize";
import {
  Attendance,
  AttendanceRequest,
  Campaign,
  ChatConversation,
  Chatbot,
  ChatbotTicket,
  Deal,
  Document,
  InboxEmail,
  Lead,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  Meeting,
  Organization,
  Project,
  ReimbursementClaim,
  Task,
  User,
} from "../models";
import { hasPermission, type AuthRequest } from "../middleware/authenticate";
import { mergeWhere, projectScopedWhere } from "./workAccess";
import { mailboxesFor, ownerVariants } from "./userMailboxes";
import { notBounceNoticeWhere } from "./bounceReport";
import { planState } from "./usage";

/**
 * What the Home screen shows one person: the work waiting for them, their day,
 * a count per module, and — for a new workspace's owner — the setup checklist.
 *
 * Every number is filtered by what this person may see (the same permissions
 * the module screens use), and every query is independent: one failing source
 * leaves its row out instead of breaking the whole screen.
 */

/** A date as YYYY-MM-DD in India, where "today" starts at midnight IST like the rest of the product. */
function istDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
}

/** Attendance rows are keyed by the UTC date (routes/attendance.ts), so team counts must use the same key. */
function attendanceDateKey(date = new Date()): string {
  return date.toISOString().split("T")[0];
}

/** Runs a query and swallows its failure, so one broken source can't blank the screen. */
async function safe<T>(label: string, run: () => Promise<T>): Promise<T | undefined> {
  try {
    return await run();
  } catch (err) {
    console.error(`[Home] ${label} failed:`, err instanceof Error ? err.message : err);
    return undefined;
  }
}

export const canApproveLeave = (req: AuthRequest) => hasPermission(req, "leave:write");
/** Mirrors canViewTeamAttendance in routes/attendance.ts, which guards PUT /attendance/requests/:id. */
export const canApproveAttendance = (req: AuthRequest) => hasPermission(req, "attendance:write", "employees:read");
export const canApproveReimbursements = (req: AuthRequest) => hasPermission(req, "payroll:write");

export interface ApprovalCounts {
  leave?: number;
  attendance?: number;
  reimbursements?: number;
  total: number;
}

export async function approvalCounts(req: AuthRequest): Promise<ApprovalCounts> {
  const [leave, attendance, reimbursements] = await Promise.all([
    canApproveLeave(req) ? safe("leave approvals", () => LeaveRequest.count({ where: { status: "Pending" } })) : undefined,
    canApproveAttendance(req) ? safe("attendance approvals", () => AttendanceRequest.count({ where: { status: "Pending" } })) : undefined,
    canApproveReimbursements(req) ? safe("reimbursement approvals", () => ReimbursementClaim.count({ where: { status: "pending" } })) : undefined,
  ]);
  return { leave, attendance, reimbursements, total: (leave ?? 0) + (attendance ?? 0) + (reimbursements ?? 0) };
}

/** Everything waiting for a decision, oldest first, for the Approvals screen. */
export async function pendingApprovals(req: AuthRequest) {
  const [leave, attendance, reimbursements] = await Promise.all([
    canApproveLeave(req)
      ? safe("leave list", async () => {
          const rows = await LeaveRequest.findAll({
            where: { status: "Pending" },
            include: [
              { model: User, as: "user", attributes: ["fullName", "department"] },
              { model: LeaveType, as: "leaveType", attributes: ["name", "color"] },
            ],
            order: [["createdAt", "ASC"]],
            limit: 50,
          });
          return rows.map((r) => {
            const row = r.toJSON() as LeaveRequest & { user?: { fullName: string; department: string | null }; leaveType?: { name: string; color: string | null } };
            return {
              id: row.id,
              person: row.user?.fullName ?? "Someone",
              department: row.user?.department ?? null,
              leaveType: row.leaveType?.name ?? "Leave",
              startDate: row.startDate,
              endDate: row.endDate,
              days: row.days,
              reason: row.reason ?? null,
              requestedAt: row.createdAt,
            };
          });
        })
      : undefined,
    canApproveAttendance(req)
      ? safe("attendance list", async () => {
          const rows = await AttendanceRequest.findAll({
            where: { status: "Pending" },
            include: [{ model: User, as: "user", attributes: ["fullName"] }],
            order: [["createdAt", "ASC"]],
            limit: 50,
          });
          return rows.map((r) => {
            const row = r.toJSON() as AttendanceRequest & { user?: { fullName: string }; createdAt?: Date };
            return {
              id: row.id,
              person: row.user?.fullName ?? "Someone",
              type: row.type,
              date: row.date,
              requestedTime: row.requestedTime ?? null,
              reason: row.reason ?? null,
              requestedAt: row.createdAt,
            };
          });
        })
      : undefined,
    canApproveReimbursements(req)
      ? safe("reimbursement list", async () => {
          const rows = await ReimbursementClaim.findAll({
            where: { status: "pending" },
            include: [{ model: User, as: "employee", attributes: ["fullName", "department"] }],
            order: [["createdAt", "ASC"]],
            limit: 50,
          });
          return rows.map((r) => {
            const row = r.toJSON() as ReimbursementClaim & { employee?: { fullName: string; department: string | null } };
            return {
              id: row.id,
              person: row.employee?.fullName ?? "Someone",
              category: row.category,
              description: row.description,
              amount: Number(row.amount),
              expenseMonth: row.expenseMonth,
              expenseYear: row.expenseYear,
              requestedAt: row.createdAt,
            };
          });
        })
      : undefined,
  ]);
  return { leave, attendance, reimbursements };
}

export interface HomeSummary {
  attention: {
    leaveApprovals?: number;
    attendanceApprovals?: number;
    reimbursementApprovals?: number;
    inboxUnread?: number;
    chatsWaiting?: number;
    ticketsAssigned?: number;
    tasksDueToday?: number;
    tasksOverdue?: number;
    dealsPastClose?: number;
    documentsToSign?: number;
  };
  today: {
    tasks: Array<{ id: string; title: string; dueDate: string | null; projectId: string | null; status: string }>;
    meetings: Array<{ id: string; summary: string; startTime: Date; endTime: Date; meetLink: string | null }>;
    leaveBalance: number | null;
    workSchedule: string | null;
  };
  launcher: Record<string, number | undefined>;
  pulse: { inToday: number; onLeaveToday: number; people: number } | null;
  setup: {
    goal: "sell" | "deliver" | "team" | null;
    dismissed: boolean;
    chatbotAllowed: boolean;
    steps: Record<"verifyEmail" | "inviteTeam" | "importContacts" | "firstCampaign" | "firstProject" | "installChatbot" | "leaveTypes", boolean>;
  } | null;
}

export async function homeSummary(req: AuthRequest): Promise<HomeSummary> {
  const me = req.user!;
  const can = (...perms: string[]) => hasPermission(req, ...perms);
  const todayIst = istDateKey();
  const startOfDay = new Date(`${todayIst}T00:00:00+05:30`);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  const teamViewer = canApproveAttendance(req);

  // Tasks assigned to me that are not done, inside projects I can still see.
  const myOpenTaskWhere = can("work:read")
    ? mergeWhere({ assigneeId: me.userId, status: { [Op.ne]: "Done" } }, await projectScopedWhere(req))
    : null;

  const [
    approvals,
    inboxUnread,
    chatsWaiting,
    ticketsAssigned,
    tasksDueToday,
    tasksOverdue,
    dueTasks,
    dealsPastClose,
    documentsToSign,
    meetings,
    leaveBalance,
    scheduleRow,
    openDeals,
    activeCampaigns,
    chatsToday,
    myOpenTasks,
    people,
    inToday,
    onLeaveToday,
  ] = await Promise.all([
    approvalCounts(req),
    can("inbox:read")
      ? safe("inbox unread", async () => {
          const mailboxes = await mailboxesFor({ id: me.userId, companyEmail: me.companyEmail, fullName: me.fullName, emailDomain: me.emailDomain });
          if (!mailboxes.length) return 0;
          const variants = ownerVariants(mailboxes);
          return InboxEmail.count({
            where: {
              [Op.and]: [
                { ownerEmail: variants.length > 1 ? { [Op.in]: variants } : variants[0], isInternal: false, folder: "inbox", isRead: false },
                notBounceNoticeWhere,
              ],
            },
          });
        })
      : undefined,
    can("chatbot:read")
      ? safe("chats waiting", () =>
          ChatConversation.count({
            where: { status: "open", mode: "human", unreadCount: { [Op.gt]: 0 }, visitorId: { [Op.notLike]: "admin-test-%" } },
          })
        )
      : undefined,
    can("chatbot:read")
      ? safe("tickets assigned", () => ChatbotTicket.count({ where: { assignedUserId: me.userId, status: { [Op.in]: ["open", "pending"] } } }))
      : undefined,
    myOpenTaskWhere ? safe("tasks due today", () => Task.count({ where: mergeWhere(myOpenTaskWhere, { dueDate: todayIst }) })) : undefined,
    myOpenTaskWhere ? safe("tasks overdue", () => Task.count({ where: mergeWhere(myOpenTaskWhere, { dueDate: { [Op.lt]: todayIst } }) })) : undefined,
    myOpenTaskWhere
      ? safe("due task list", () =>
          Task.findAll({
            where: mergeWhere(myOpenTaskWhere, { dueDate: { [Op.lte]: todayIst } }),
            order: [["dueDate", "ASC"]],
            limit: 5,
            attributes: ["id", "title", "dueDate", "projectId", "status"],
          })
        )
      : undefined,
    can("crm:read")
      ? safe("deals past close", () => Deal.count({ where: { status: "Open", ownerId: me.userId, expectedCloseDate: { [Op.lt]: todayIst } } }))
      : undefined,
    can("documents:read")
      ? safe("documents to sign", () =>
          Document.count({
            where: { employeeId: me.userId, signingToken: { [Op.ne]: null }, signedAt: null, signingTokenExpiry: { [Op.gt]: new Date() } },
          })
        )
      : undefined,
    can("meetings:read")
      ? safe("meetings today", () =>
          Meeting.findAll({
            where: {
              status: "confirmed",
              startTime: { [Op.gte]: startOfDay, [Op.lt]: endOfDay },
              [Op.or]: [{ createdById: me.userId }, ...(me.companyEmail ? [{ attendees: { [Op.contains]: [me.companyEmail] } }] : [])],
            },
            order: [["startTime", "ASC"]],
            limit: 6,
            attributes: ["id", "summary", "startTime", "endTime", "meetLink"],
          })
        )
      : undefined,
    can("leave:read")
      ? safe("leave balance", async () => {
          const rows = await LeaveBalance.findAll({ where: { userId: me.userId, year: Number(todayIst.slice(0, 4)) } });
          return rows.length ? rows.reduce((sum, b) => sum + Math.max(0, Number(b.allocated) - Number(b.used)), 0) : null;
        })
      : undefined,
    safe("work schedule", () => User.findByPk(me.userId, { attributes: ["workSchedule"] })),
    can("crm:read") ? safe("open deals", () => Deal.count({ where: { status: "Open" } })) : undefined,
    can("outreach:read") ? safe("active campaigns", () => Campaign.count({ where: { stage: "Active" } })) : undefined,
    can("chatbot:read")
      ? safe("chats today", () => ChatConversation.count({ where: { createdAt: { [Op.gte]: startOfDay }, visitorId: { [Op.notLike]: "admin-test-%" } } }))
      : undefined,
    myOpenTaskWhere ? safe("my open tasks", () => Task.count({ where: myOpenTaskWhere })) : undefined,
    can("people:read") ? safe("people", () => User.count({ where: { status: "active", userType: "internal" } })) : undefined,
    teamViewer
      ? safe("in today", () => {
          // The model types clockIn as never-null, but a row exists before anyone clocks in.
          const clockedInToday: WhereOptions = { date: attendanceDateKey(), clockIn: { [Op.ne]: null } };
          return Attendance.count({ where: clockedInToday });
        })
      : undefined,
    teamViewer
      ? safe("on leave today", () =>
          LeaveRequest.count({ where: { status: "Approved", startDate: { [Op.lte]: todayIst }, endDate: { [Op.gte]: todayIst } } })
        )
      : undefined,
  ]);

  return {
    attention: {
      leaveApprovals: approvals.leave,
      attendanceApprovals: approvals.attendance,
      reimbursementApprovals: approvals.reimbursements,
      inboxUnread,
      chatsWaiting,
      ticketsAssigned,
      tasksDueToday,
      tasksOverdue,
      dealsPastClose,
      documentsToSign,
    },
    today: {
      tasks: (dueTasks ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: (t.dueDate as unknown as string) ?? null,
        projectId: t.projectId ?? null,
        status: t.status,
      })),
      meetings: (meetings ?? []).map((m) => ({ id: m.id, summary: m.summary, startTime: m.startTime, endTime: m.endTime, meetLink: m.meetLink })),
      leaveBalance: leaveBalance ?? null,
      workSchedule: scheduleRow?.workSchedule || null,
    },
    launcher: {
      crm: openDeals,
      outreach: activeCampaigns,
      inbox: inboxUnread,
      chatbot: chatsToday,
      work: myOpenTasks,
      meetings: meetings?.length,
      employees: people,
      attendance: inToday,
    },
    pulse: teamViewer && inToday !== undefined && onLeaveToday !== undefined
      ? { inToday, onLeaveToday, people: people ?? 0 }
      : null,
    setup: await setupState(req),
  };
}

/**
 * The first-run checklist, for the owner of a customer workspace only. The
 * platform workspace never needs it, and nobody else can act on most steps.
 */
async function setupState(req: AuthRequest): Promise<HomeSummary["setup"]> {
  if (req.user!.roleSlug !== "superadmin") return null;
  const org = await safe("organization", () => Organization.findByPk(req.user!.organizationId));
  if (!org || org.isPlatform) return null;

  const chatbotAllowed = planState(org).limits.chatbots !== 0;
  const [people, leads, campaigns, projects, chatbots, leaveTypes] = await Promise.all([
    safe("setup people", () => User.count({ where: { status: "active", userType: "internal" } })),
    safe("setup leads", () => Lead.count()),
    safe("setup campaigns", () => Campaign.count({ where: { stage: { [Op.ne]: "Draft" } } })),
    safe("setup projects", () => Project.count()),
    chatbotAllowed ? safe("setup chatbot", () => Chatbot.count({ where: { installedAt: { [Op.ne]: null } } })) : undefined,
    safe("setup leave types", () => LeaveType.count()),
  ]);

  const onboarding = org.settings?.onboarding ?? {};
  return {
    goal: onboarding.goal ?? null,
    dismissed: !!onboarding.dismissedAt,
    chatbotAllowed,
    steps: {
      verifyEmail: !org.settings?.pendingEmailVerification,
      inviteTeam: (people ?? 0) >= 2,
      importContacts: (leads ?? 0) > 0,
      firstCampaign: (campaigns ?? 0) > 0,
      firstProject: (projects ?? 0) > 0,
      installChatbot: (chatbots ?? 0) > 0,
      leaveTypes: (leaveTypes ?? 0) > 0,
    },
  };
}
