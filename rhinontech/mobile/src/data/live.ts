/**
 * The bridge between the app's store and the Rhinon API.
 *
 * `syncAll()` pulls real data into the slices that are connected; `installLive()` swaps the matching
 * store actions for versions that call the API (optimistic update first, then a re-sync on failure).
 * Slices not listed in LIVE_MODULES still show the prototype's sample data.
 */
import { api, getSession } from "@/lib/api";
import type { Chat, DueGroup, LeaveRequest, LeaveType, Notif, Priority, Task, TaskStatus } from "./mock-data";
import { actions, getState, hydrate } from "./store";
import type { Tone } from "./tone";

export const LIVE_MODULES = ["tasks", "leave", "notifications", "attendance", "chat"] as const;

/* ── helpers ─────────────────────────────────────────────────────────────── */

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

function dueInfo(dueDate: string | null, status: TaskStatus): { due: string; group: DueGroup } {
  if (!dueDate) return { due: "No due date", group: "later" };
  const d = parseDay(dueDate);
  const diff = Math.round((startOfDay(d) - startOfDay(new Date())) / DAY);
  if (diff < 0) return { due: `Overdue · ${-diff} day${diff === -1 ? "" : "s"}`, group: status === "Done" ? "today" : "overdue" };
  if (diff === 0) return { due: "Today", group: "today" };
  const label = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return { due: label, group: diff <= 7 ? "week" : "later" };
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const TONES: Tone[] = ["sun", "sky", "leaf", "violet", "rose", "cobalt", "coral"];

/* ── tasks ───────────────────────────────────────────────────────────────── */

type ApiTask = {
  id: string; title: string; description: string | null; assigneeId: string | null; dueDate: string | null;
  status: TaskStatus; priority: Priority; estimatedHours: number | null;
  project?: { name: string } | null; team?: string | null;
  subtasks?: { id: string; title: string; done: boolean }[]; tags?: { label: string }[];
};

function toTask(t: ApiTask, me: string): Task {
  const { due, group } = dueInfo(t.dueDate, t.status);
  return {
    id: t.id, title: t.title, project: t.project?.name ?? t.team ?? "No project", priority: t.priority, status: t.status,
    due, group, assignee: t.assigneeId === me ? "me" : (t.assigneeId ?? "none"), est: t.estimatedHours ?? 0,
    description: t.description ?? "", subtasks: (t.subtasks ?? []).map((s) => ({ id: s.id, title: s.title, done: s.done })),
    comments: [], tags: (t.tags ?? []).map((g) => g.label),
  };
}

async function syncTasks() {
  const me = getSession()?.userId ?? "";
  const rows = await api<ApiTask[]>("/tasks?scope=my");
  hydrate({ tasks: rows.map((r) => toTask(r, me)) });
}

/* ── leave ───────────────────────────────────────────────────────────────── */

async function syncLeave() {
  const [balance, requests] = await Promise.all([
    api<{ leaveTypeId: string; name: string; allocated: number; used: number }[]>("/leave/balance"),
    api<{ id: string; leaveTypeName?: string; startDate: string; endDate: string; days: number; reason?: string; status: LeaveRequest["status"]; managerNote?: string }[]>("/leave/requests"),
  ]);
  const reqs: LeaveRequest[] = requests.map((r) => ({ id: r.id, type: r.leaveTypeName ?? "Leave", from: r.startDate.slice(0, 10), to: r.endDate.slice(0, 10), days: r.days, reason: r.reason || "—", status: r.status, ...(r.managerNote ? { note: r.managerNote } : {}) }));
  const types: LeaveType[] = balance.map((b, i) => ({
    id: b.leaveTypeId, name: b.name, short: b.name.slice(0, 2).toUpperCase(), total: b.allocated, used: b.used,
    pending: reqs.filter((r) => r.type === b.name && r.status === "Pending").reduce((n, r) => n + r.days, 0), tone: TONES[i % TONES.length]!,
  }));
  hydrate({ leave: reqs, balances: types });
}

/* ── notifications ───────────────────────────────────────────────────────── */

type ApiNotif = { id: string; type: string; title: string; body: string | null; link: string | null; readAt: string | null; updatedAt: string };
const KIND: Record<string, Notif["kind"]> = { task: "task", leave: "leave", chat: "chat", inbox: "inbox", pay: "pay", approval: "approval" };

async function syncNotifications() {
  const r = await api<{ items: ApiNotif[] }>("/notifications?limit=50");
  const startToday = startOfDay(new Date());
  hydrate({
    notifs: r.items.map((n): Notif => ({
      id: n.id, kind: KIND[n.type.split(".")[0]!] ?? "task", title: n.title, body: n.body ?? "", time: ago(n.updatedAt),
      unread: !n.readAt, to: n.link ?? "", group: new Date(n.updatedAt).getTime() >= startToday ? "Today" : "Earlier",
    })),
  });
}

/* ── attendance ──────────────────────────────────────────────────────────── */

type ApiToday = { status: string; clockIn: string | null; clockOut: string | null; breaks?: { start: string; end?: string | null }[]; durationMinutes: number };

async function syncAttendance() {
  const r = await api<ApiToday>("/attendance/today");
  const breaks = r.breaks ?? [];
  const open = breaks.find((b) => !b.end);
  const breakMs = breaks.filter((b) => b.end).reduce((n, b) => n + (new Date(b.end!).getTime() - new Date(b.start).getTime()), 0);
  hydrate({
    clock: {
      status: r.clockOut ? "done" : open ? "break" : r.clockIn ? "in" : "out",
      inAt: r.clockIn ? new Date(r.clockIn).getTime() : null,
      breakAt: open ? new Date(open.start).getTime() : null,
      breakMs, outAt: r.clockOut ? new Date(r.clockOut).getTime() : null,
    },
  });
}

/* ── chat ────────────────────────────────────────────────────────────────── */

type ApiConv = { id: string; kind: string; name: string | null; memberIds: string[]; unread: number; pinned: boolean; lastMessage: { body: string; authorId: string; createdAt: string } | null; lastMessageAt: string | null };
type ApiPerson = { id: string; fullName: string };

async function syncChat() {
  const me = getSession()?.userId ?? "";
  const [convs, people] = await Promise.all([api<ApiConv[]>("/team-chat/conversations"), api<ApiPerson[]>("/people")]);
  const nameOf = (id: string) => people.find((p) => p.id === id)?.fullName ?? "Teammate";
  hydrate({
    chats: convs.map((c, i): Chat => {
      const dm = c.kind === "direct";
      const other = c.memberIds.find((m) => m !== me) ?? me;
      return {
        id: c.id, kind: dm ? "dm" : c.kind === "channel" ? "channel" : "group", name: dm ? nameOf(other) : (c.name ?? "Untitled"),
        tone: TONES[i % TONES.length]!, members: c.memberIds, unread: c.unread, time: ago(c.lastMessageAt), pinned: c.pinned,
        messages: c.lastMessage ? [{ id: "last", from: c.lastMessage.authorId === me ? "me" : nameOf(c.lastMessage.authorId), text: c.lastMessage.body, at: ago(c.lastMessage.createdAt) }] : [],
      };
    }),
  });
}

export async function loadChatMessages(id: string) {
  const me = getSession()?.userId ?? "";
  const [res, people] = await Promise.all([api<{ messages?: ApiMsg[] } | ApiMsg[]>(`/team-chat/conversations/${id}/messages`), api<ApiPerson[]>("/people")]);
  const rows = Array.isArray(res) ? res : (res.messages ?? []);
  const nameOf = (uid: string) => people.find((p) => p.id === uid)?.fullName ?? "Teammate";
  const msgs = [...rows].reverse().map((m) => ({ id: m.id, from: m.authorId === me ? "me" : nameOf(m.authorId), text: m.body, at: ago(m.createdAt) }));
  const hasOrder = rows.length > 1 && new Date(rows[0]!.createdAt) < new Date(rows[rows.length - 1]!.createdAt);
  hydrate({ chats: getState().chats.map((c) => (c.id === id ? { ...c, messages: hasOrder ? [...msgs].reverse() : msgs } : c)) });
  await api(`/team-chat/conversations/${id}/read`, { method: "POST" }).catch(() => {});
}
type ApiMsg = { id: string; authorId: string; body: string; createdAt: string };

export async function loadTaskComments(id: string) {
  const rows = await api<{ id: string; body: string; createdAt: string; author?: { fullName: string } | null }[]>(`/tasks/${id}/comments`);
  hydrate({ tasks: getState().tasks.map((t) => (t.id === id ? { ...t, comments: rows.map((c) => ({ id: c.id, by: c.author?.fullName ?? "Teammate", text: c.body, at: ago(c.createdAt) })) } : t)) });
}

/** Called when someone signs out: drop everything fetched for them. */
export { resetState as clearLive } from "./store";

/* ── sync + action wiring ────────────────────────────────────────────────── */

const SYNCS: Record<(typeof LIVE_MODULES)[number], () => Promise<void>> = {
  tasks: syncTasks, leave: syncLeave, notifications: syncNotifications, attendance: syncAttendance, chat: syncChat,
};

/** Blank the connected slices so sample data never shows next to a real account. */
export function blankLive() {
  hydrate({ tasks: [], notifs: [], chats: [], leave: [], balances: [] });
}

export async function syncAll(): Promise<void> {
  if (!getSession()) return;
  await Promise.allSettled(Object.values(SYNCS).map((f) => f()));
}
const resync = (m: (typeof LIVE_MODULES)[number]) => SYNCS[m]().catch(() => {});

/** Run an API write after the optimistic local change; if it fails, say why and restore server truth. */
function write(module: (typeof LIVE_MODULES)[number], call: () => Promise<unknown>, after?: () => void) {
  call().then(() => { after?.(); return resync(module); }).catch((e: Error) => { actions.toast(e.message || "That didn't save", "coral"); void resync(module); });
}

let installed = false;
export function installLive() {
  if (installed) return;
  installed = true;
  const orig = { ...actions };

  actions.toggleTask = (id) => {
    orig.toggleTask(id);
    const t = getState().tasks.find((x) => x.id === id);
    if (t) write("tasks", () => api(`/tasks/${id}`, { method: "PUT", body: { status: t.status } }));
  };
  actions.setTaskStatus = (id, status) => {
    orig.setTaskStatus(id, status);
    write("tasks", () => api(`/tasks/${id}`, { method: "PUT", body: { status } }));
  };
  actions.toggleSubtask = (taskId, subId) => {
    orig.toggleSubtask(taskId, subId);
    const s = getState().tasks.find((x) => x.id === taskId)?.subtasks.find((x) => x.id === subId);
    if (s) write("tasks", () => api(`/tasks/${taskId}/subtasks/${subId}`, { method: "PUT", body: { done: s.done } }));
  };
  actions.addSubtask = (taskId, title) => {
    orig.addSubtask(taskId, title);
    write("tasks", () => api(`/tasks/${taskId}/subtasks`, { method: "POST", body: { title } }));
  };
  actions.addComment = (taskId, text) => {
    write("tasks", () => api(`/tasks/${taskId}/comments`, { method: "POST", body: { body: text } }), () => { actions.toast("Comment posted", "cobalt"); void loadTaskComments(taskId); });
  };
  actions.addTask = (input) => {
    orig.addTask(input);
    write("tasks", () => api("/tasks", { method: "POST", body: { title: input.title, priority: input.priority, assigneeId: getSession()?.userId } }));
  };

  actions.clockIn = () => { orig.clockIn(); write("attendance", () => api("/attendance/clock-in", { method: "POST" })); };
  actions.startBreak = () => { orig.startBreak(); write("attendance", () => api("/attendance/break-start", { method: "POST" })); };
  actions.endBreak = () => { orig.endBreak(); write("attendance", () => api("/attendance/break-end", { method: "POST" })); };
  actions.clockOut = () => { orig.clockOut(); write("attendance", () => api("/attendance/clock-out", { method: "POST" })); };

  actions.applyLeave = (type, from, to, reason) => {
    const lt = getState().balances.find((b) => b.name === type);
    if (!lt) { actions.toast("Pick a leave type", "coral"); return; }
    write("leave", () => api("/leave/requests", { method: "POST", body: { leaveTypeId: lt.id, startDate: from, endDate: to, reason } }), () => actions.toast("Leave requested", "sky"));
  };

  actions.readNotif = (id) => { orig.readNotif(id); write("notifications", () => api(`/notifications/${id}/read`, { method: "POST" })); };
  actions.readAllNotifs = () => { orig.readAllNotifs(); write("notifications", () => api("/notifications/read-all", { method: "POST" })); };

  actions.sendChat = (id, text, attachment) => {
    orig.sendChat(id, text, attachment);
    write("chat", () => api(`/team-chat/conversations/${id}/messages`, { method: "POST", body: { body: text } }), () => { void loadChatMessages(id); });
  };
  actions.markChatRead = () => undefined;
}
