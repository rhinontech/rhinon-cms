import { api, getSession } from "./api";
import { MONTHS, MONTHS_LONG, WEEKDAYS, ago, assign, clearRecord, defineLive, hhmm, parseDay, replace, toneAt, write } from "./live-core";
import { ATTENDANCE_NOV, WHOS_OFF, type LeaveRequest, type LeaveType, type Mark, type Regularization } from "./mock-data";
import { actions, getState, hydrate } from "./store";

/* ── attendance: today's clock, this month's marks, correction requests ──── */

type ApiToday = { status: string; clockIn: string | null; clockOut: string | null; breaks?: { start: string; end?: string | null }[]; durationMinutes: number };
type ApiDay = { date: string; status: string; clockIn: string | null; clockOut: string | null; durationMinutes: number };
type ApiCorrection = { id: string; type: string; date: string; reason: string; status: "Pending" | "Approved" | "Rejected"; requestedTime?: string | null };

const MARK: Record<string, Mark> = { present: "present", late: "late", absent: "absent", leave: "leave", "on leave": "leave", holiday: "holiday" };

async function syncAttendance() {
  const now = new Date();
  const [today, month, corrections] = await Promise.all([
    api<ApiToday>("/attendance/today"),
    api<ApiDay[]>(`/attendance?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).catch(() => [] as ApiDay[]),
    api<ApiCorrection[]>("/attendance/requests").catch(() => [] as ApiCorrection[]),
  ]);
  const breaks = today.breaks ?? [];
  const open = breaks.find((b) => !b.end);
  const breakMs = breaks.filter((b) => b.end).reduce((n, b) => n + (new Date(b.end!).getTime() - new Date(b.start).getTime()), 0);
  hydrate({
    clock: {
      status: today.clockOut ? "done" : open ? "break" : today.clockIn ? "in" : "out",
      inAt: today.clockIn ? new Date(today.clockIn).getTime() : null,
      breakAt: open ? new Date(open.start).getTime() : null,
      breakMs, outAt: today.clockOut ? new Date(today.clockOut).getTime() : null,
    },
    regularizations: corrections.map((c): Regularization => ({
      id: c.id, date: `${WEEKDAYS[parseDay(c.date).getDay()]} ${parseDay(c.date).getDate()} ${MONTHS[parseDay(c.date).getMonth()]}`,
      reason: c.reason, status: c.status, times: c.requestedTime ?? "",
    })),
  });
  clearRecord(ATTENDANCE_NOV);
  const marks: Record<number, Mark> = {};
  for (const d of month) {
    const m = MARK[d.status.toLowerCase()];
    if (m) marks[parseDay(d.date).getDate()] = m;
  }
  assign(ATTENDANCE_NOV as Record<number, Mark>, marks);
}

/* ── leave: balances, requests, who is off ───────────────────────────────── */

type ApiBalance = { leaveTypeId: string; name: string; allocated: number; used: number };
type ApiLeave = { id: string; leaveTypeName?: string; startDate: string; endDate: string; days: number; reason?: string; status: LeaveRequest["status"]; managerNote?: string; userId?: string; userName?: string };

async function syncLeave() {
  const now = new Date();
  const [balance, requests, calendar] = await Promise.all([
    api<ApiBalance[]>("/leave/balance"),
    api<ApiLeave[]>("/leave/requests"),
    api<{ userName?: string; userId?: string; startDate: string; endDate: string; leaveTypeName?: string }[]>(`/leave/calendar?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).catch(() => []),
  ]);
  const me = getSession()?.userId;
  // managers are sent everyone's requests; "my requests" are the ones I filed (the rest feed Approvals)
  const reqs: LeaveRequest[] = requests.filter((r) => !r.userId || r.userId === me).map((r) => ({ id: r.id, type: r.leaveTypeName ?? "Leave", from: r.startDate.slice(0, 10), to: r.endDate.slice(0, 10), days: r.days, reason: r.reason || "—", status: r.status, ...(r.managerNote ? { note: r.managerNote } : {}) }));
  const types: LeaveType[] = balance.map((b, i) => ({
    id: b.leaveTypeId, name: b.name, short: b.name.slice(0, 2).toUpperCase(), total: b.allocated, used: b.used,
    pending: reqs.filter((r) => r.type === b.name && r.status === "Pending").reduce((n, r) => n + r.days, 0), tone: toneAt(i),
  }));
  hydrate({ leave: reqs, balances: types });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  replace(WHOS_OFF, (Array.isArray(calendar) ? calendar : []).filter((c) => parseDay(c.endDate) >= today).slice(0, 6).map((c) => {
    const s = parseDay(c.startDate), e = parseDay(c.endDate);
    const when = s <= today ? "Today" : s.getTime() === e.getTime() ? `${WEEKDAYS[s.getDay()]} ${s.getDate()}` : `${WEEKDAYS[s.getDay()]} – ${WEEKDAYS[e.getDay()]}`;
    return { who: c.userId ?? "", when, kind: (c.leaveTypeName ?? "Leave").split(" ")[0]! };
  }));
}

defineLive({
  name: "attendance",
  sync: syncAttendance,
  blank: () => { hydrate({ regularizations: [] }); clearRecord(ATTENDANCE_NOV); },
  install: ({ orig }) => {
    actions.clockIn = () => { orig.clockIn(); write("attendance", () => api("/attendance/clock-in", { method: "POST" })); };
    actions.startBreak = () => { orig.startBreak(); write("attendance", () => api("/attendance/break-start", { method: "POST" })); };
    actions.endBreak = () => { orig.endBreak(); write("attendance", () => api("/attendance/break-end", { method: "POST" })); };
    actions.clockOut = () => { orig.clockOut(); write("attendance", () => api("/attendance/clock-out", { method: "POST" })); };
    actions.requestRegularization = (date, times, reason) => {
      orig.requestRegularization(date, times, reason);
      write("attendance", () => api("/attendance/requests", { method: "POST", body: { type: "Regularization", date: isoOf(date), reason, requestedTime: times } }));
    };
  },
});

defineLive({
  name: "leave",
  sync: syncLeave,
  blank: () => { hydrate({ leave: [], balances: [] }); replace(WHOS_OFF, []); },
  install: () => {
    actions.applyLeave = (type, from, to, reason) => {
      const lt = getState().balances.find((b) => b.name === type);
      if (!lt) { actions.toast("Pick a leave type", "coral"); return; }
      write("leave", () => api("/leave/requests", { method: "POST", body: { leaveTypeId: lt.id, startDate: from, endDate: to, reason } }), () => actions.toast("Leave requested", "sky"));
    };
  },
});

/** "Fri 30 Oct" / "2026-10-30" → an ISO date; the Time screen passes a label or an ISO string. */
function isoOf(s: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/(\d{1,2})\s+([A-Za-z]{3})/);
  const now = new Date();
  if (!m) return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const mi = MONTHS.findIndex((x) => x.toLowerCase() === m[2]!.toLowerCase());
  return `${now.getFullYear()}-${String(mi + 1).padStart(2, "0")}-${String(+m[1]!).padStart(2, "0")}`;
}
void hhmm; void ago; void MONTHS_LONG;
