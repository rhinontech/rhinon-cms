/** GET /home/summary — mirrors HomeSummary in backend/src/services/homeSummary.ts. */
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
    meetings: Array<{ id: string; summary: string; startTime: string; endTime: string; meetLink: string | null }>;
    leaveBalance: number | null;
    workSchedule: string | null;
  };
  launcher: Record<string, number | undefined>;
  pulse: { inToday: number; onLeaveToday: number; people: number } | null;
  setup: SetupState | null;
}

export type Goal = "sell" | "deliver" | "team";

export type SetupStep = "verifyEmail" | "inviteTeam" | "importContacts" | "firstCampaign" | "firstProject" | "installChatbot" | "leaveTypes";

export interface SetupState {
  goal: Goal | null;
  dismissed: boolean;
  chatbotAllowed: boolean;
  steps: Record<SetupStep, boolean>;
}

/** GET /dashboard/stats — the parts Home still reads (attendance and the team's dates). */
export interface DashboardStats {
  currentUser: { fullName: string; department: string; role: string };
  totalEmployees: number;
  todayAttendance: {
    clockIn: string | null;
    clockOut: string | null;
    breaks?: { start: string; end: string | null }[];
    status: string;
    durationMinutes: number;
  } | null;
  birthdays: Array<{ id: string; fullName: string; day: number; department: string; isToday: boolean; age: number }>;
  anniversaries: Array<{ id: string; fullName: string; day: number; department: string; isToday: boolean; years: number }>;
}
