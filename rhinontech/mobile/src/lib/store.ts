import { useEffect, useState, useSyncExternalStore } from "react";
import {
  APPROVALS,
  CHATS,
  CLAIMS,
  DEALS,
  LEAVE_REQUESTS,
  LEAVE_TYPES,
  NOTIFS,
  REGULARIZATIONS,
  TASKS,
  THREADS,
  PROJECTS,
  personOf,
  type Approval,
  type BrandId,
  type Chat,
  type Claim,
  type Deal,
  type LeaveRequest,
  type LeaveType,
  type Notif,
  type Priority,
  type Regularization,
  type Task,
  type TaskStatus,
  type Thread,
} from "./mock-data";
import { toneFor, type Tone } from "./tone";
import { rangeLabel, workingDays } from "./format";
import {
  ACCOUNTS,
  ACTIVITIES,
  BOT_CHATS,
  CAMPAIGNS,
  CANDIDATES,
  CLIENT_REQUESTS,
  CRM_LEADS,
  DOCS,
  DOC_REQUESTS,
  DRAFTS,
  FLOWS,
  GOALS,
  GUESTS,
  IDEAS,
  INTERVIEWS,
  MORE_TASKS,
  POSTS,
  TEAM_REVIEWS,
  TICKETS,
  WIKI_PAGES,
  defaultPerms,
  type Account,
  type Activity,
  type ActivityKind,
  type Attachment,
  type BotChat,
  type Campaign,
  type Candidate,
  type ClientRequest,
  type CrmLead,
  type DocItem,
  type DocKind,
  type DocRequest,
  type Flow,
  type Goal,
  type Guest,
  type Idea,
  type IdeaStatus,
  type Interview,
  type Lifecycle,
  type OutreachDraft,
  type Perms,
  type Post,
  type RoleId,
  type TeamReview,
  type Ticket,
  type WikiPage,
} from "./mock-more";

/**
 * A tiny in-memory store so the prototype feels alive: clock in on Time and Home follows,
 * approve something and the badge drops, reply to a thread and it shows up. Nothing persists.
 */

export type ClockStatus = "out" | "in" | "break" | "done";
export type ClockState = {
  status: ClockStatus;
  inAt: number | null;
  breakAt: number | null;
  breakMs: number;
  outAt: number | null;
};

export type ToastItem = { id: number; text: string; tone: Tone };

/** The roles that change what the app shows. The prototype lets you preview each one. */
export type Role = "admin" | "hr" | "manager" | "employee";
export const ROLE_LABEL: Record<Role, string> = {
  admin: "Super Admin",
  hr: "HR",
  manager: "Manager",
  employee: "Employee",
};
export type AppState = {
  /** Bumped whenever live data replaces a module-level list (people, projects, payslips…), so every screen re-renders. */
  rev: number;
  role: Role;
  offline: boolean;
  clock: ClockState;
  tasks: Task[];
  approvals: Approval[];
  threads: Thread[];
  chats: Chat[];
  claims: Claim[];
  deals: Deal[];
  notifs: Notif[];
  leave: LeaveRequest[];
  balances: LeaveType[];
  regularizations: Regularization[];
  brand: BrandId;
  prefs: Record<string, boolean>;
  toasts: ToastItem[];
  perms: Perms;
  pushPermission: "unasked" | "granted" | "denied";
  queued: number;
  payLocked: boolean;
  clientRequests: ClientRequest[];
  leads: CrmLead[];
  accounts: Account[];
  activities: Activity[];
  campaigns: Campaign[];
  drafts: OutreachDraft[];
  flows: Flow[];
  botChats: BotChat[];
  tickets: Ticket[];
  docs: DocItem[];
  docRequests: DocRequest[];
  goals: Goal[];
  selfReview: { submitted: boolean; rating: number | null; strengths: string; growth: string };
  teamReviews: TeamReview[];
  candidates: Candidate[];
  interviews: Interview[];
  pages: WikiPage[];
  ideas: Idea[];
  guests: Record<string, Guest[]>;
  posts: Post[];
};

const INITIAL: AppState = {
  rev: 0,
  role: "admin",
  offline: false,
  clock: { status: "out", inAt: null, breakAt: null, breakMs: 0, outAt: null },
  tasks: [...TASKS, ...MORE_TASKS],
  approvals: APPROVALS,
  threads: THREADS,
  chats: CHATS,
  claims: CLAIMS,
  deals: DEALS,
  notifs: NOTIFS,
  leave: LEAVE_REQUESTS,
  balances: LEAVE_TYPES,
  regularizations: REGULARIZATIONS,
  brand: "tech",
  prefs: {
    push: true,
    tasks: true,
    inbox: true,
    chat: true,
    approvals: true,
    digest: false,
    biometric: true,
    twofa: true,
  },
  toasts: [],
  perms: defaultPerms(),
  pushPermission: "unasked",
  queued: 0,
  payLocked: false,
  clientRequests: CLIENT_REQUESTS,
  leads: CRM_LEADS,
  accounts: ACCOUNTS,
  activities: ACTIVITIES,
  campaigns: CAMPAIGNS,
  drafts: DRAFTS,
  flows: FLOWS,
  botChats: BOT_CHATS,
  tickets: TICKETS,
  docs: DOCS,
  docRequests: DOC_REQUESTS,
  goals: GOALS,
  selfReview: { submitted: false, rating: null, strengths: "", growth: "" },
  teamReviews: TEAM_REVIEWS,
  candidates: CANDIDATES,
  interviews: INTERVIEWS,
  pages: WIKI_PAGES,
  ideas: IDEAS,
  guests: GUESTS,
  posts: POSTS,
};

let state: AppState = INITIAL;
const listeners = new Set<() => void>();

function set(update: (s: AppState) => AppState) {
  state = update(state);
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** Read a slice of the store. Select stable references (arrays, objects, primitives), never build new ones. */
export function useApp<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(INITIAL),
  );
}

/** Replace slices of state wholesale (used when real data arrives from the API). */
export function hydrate(patch: Partial<AppState>) {
  set((s) => ({ ...s, ...patch, rev: s.rev + 1 }));
}
/** Re-render every screen after a module-level list was replaced in place. */
export function bumpRev() {
  set((s) => ({ ...s, rev: s.rev + 1 }));
}
export const getState = () => state;
/** Back to the seeded prototype data (sign-out). */
export function resetState() {
  set(() => INITIAL);
}

/** A ticking clock that is `null` until the browser has mounted, so server and client markup agree. */
export function useNow(active: boolean, ms = 1000): number | null {
  const [now, setNow] = useState<number | null>(() =>
    active && typeof window !== "undefined" ? Date.now() : null,
  );
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return now;
}

/** Worked time so far, excluding breaks. */
export function workedMs(c: ClockState, now: number | null): number {
  if (c.inAt === null) return 0;
  if (c.status === "done" && c.outAt !== null) return c.outAt - c.inAt - c.breakMs;
  const ref = c.status === "break" && c.breakAt !== null ? c.breakAt : (now ?? c.inAt);
  return Math.max(0, ref - c.inAt - c.breakMs);
}

export function breakMsNow(c: ClockState, now: number | null): number {
  return (
    c.breakMs +
    (c.status === "break" && c.breakAt !== null ? Math.max(0, (now ?? c.breakAt) - c.breakAt) : 0)
  );
}

let toastId = 1;

export const actions = {
  toast(text: string, tone: Tone = "ink") {
    const id = toastId++;
    set((s) => ({ ...s, toasts: [...s.toasts.slice(-1), { id, text, tone }] }));
    if (typeof window !== "undefined") {
      window.setTimeout(
        () => set((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) })),
        2600,
      );
    }
  },

  /* time */
  clockIn() {
    set((s) => ({
      ...s,
      clock: { status: "in", inAt: Date.now(), breakAt: null, breakMs: 0, outAt: null },
    }));
    actions.saved("Clocked in. Have a good one.", "leaf");
  },
  startBreak() {
    set((s) => ({ ...s, clock: { ...s.clock, status: "break", breakAt: Date.now() } }));
    actions.saved("Break started", "sun");
  },
  endBreak() {
    set((s) => ({
      ...s,
      clock: {
        ...s.clock,
        status: "in",
        breakMs: s.clock.breakMs + (s.clock.breakAt ? Date.now() - s.clock.breakAt : 0),
        breakAt: null,
      },
    }));
    actions.saved("Back to work", "leaf");
  },
  clockOut() {
    set((s) => ({
      ...s,
      clock: {
        ...s.clock,
        status: "done",
        outAt: Date.now(),
        breakMs:
          s.clock.breakMs +
          (s.clock.status === "break" && s.clock.breakAt ? Date.now() - s.clock.breakAt : 0),
        breakAt: null,
      },
    }));
    actions.saved("Day logged. See you tomorrow.", "ink");
  },
  resetClock() {
    set((s) => ({ ...s, clock: INITIAL.clock }));
  },
  requestRegularization(date: string, times: string, reason: string) {
    set((s) => ({
      ...s,
      regularizations: [
        { id: `r${Date.now()}`, date, times, reason, status: "Pending" },
        ...s.regularizations,
      ],
    }));
    actions.saved("Sent to your manager", "sun");
  },
  applyLeave(type: string, from: string, to: string, reason: string) {
    const days = Math.max(1, workingDays(from, to));
    set((s) => ({
      ...s,
      leave: [
        { id: `l${Date.now()}`, type, from, to, days, reason: reason || "—", status: "Pending" },
        ...s.leave,
      ],
      balances: s.balances.map((b) => (b.name === type ? { ...b, pending: b.pending + days } : b)),
    }));
    actions.saved(`Leave requested · ${rangeLabel(from, to)}`, "sky");
  },

  /* work */
  toggleTask(id: string) {
    set((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status: t.status === "Done" ? "Pending" : "Done" } : t,
      ),
    }));
  },
  setTaskStatus(id: string, status: TaskStatus) {
    set((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) }));
  },
  toggleSubtask(taskId: string, subId: string) {
    set((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((x) => (x.id === subId ? { ...x, done: !x.done } : x)),
            }
          : t,
      ),
    }));
  },
  addSubtask(taskId: string, title: string) {
    set((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: [...t.subtasks, { id: `s${Date.now()}`, title, done: false }] }
          : t,
      ),
    }));
  },
  addComment(taskId: string, text: string) {
    set((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: [...t.comments, { id: `c${Date.now()}`, by: "me", text, at: "Just now" }],
            }
          : t,
      ),
    }));
  },
  addTask(input: {
    title: string;
    project: string;
    priority: Priority;
    due: string;
    group: Task["group"];
  }) {
    const task: Task = {
      id: `t${Date.now()}`,
      title: input.title,
      project: input.project,
      priority: input.priority,
      status: "Pending",
      due: input.due,
      group: input.group,
      assignee: "me",
      est: 1,
      description: "",
      subtasks: [],
      comments: [],
      tags: [],
    };
    set((s) => ({ ...s, tasks: [task, ...s.tasks] }));
    actions.saved("Task added", "cobalt");
  },

  /* approvals */
  decide(id: string, decision: "approved" | "rejected") {
    set((s) => ({ ...s, approvals: s.approvals.filter((a) => a.id !== id) }));
    actions.saved(
      decision === "approved" ? "Approved" : "Rejected",
      decision === "approved" ? "leaf" : "coral",
    );
  },

  /* inbox */
  setBrand(brand: BrandId) {
    set((s) => ({ ...s, brand }));
  },
  markRead(id: string) {
    set((s) => ({
      ...s,
      threads: s.threads.map((t) => (t.id === id && t.unread ? { ...t, unread: false } : t)),
    }));
  },
  toggleStar(id: string) {
    set((s) => ({
      ...s,
      threads: s.threads.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t)),
    }));
  },
  archive(id: string) {
    set((s) => ({
      ...s,
      threads: s.threads.map((t) => (t.id === id ? { ...t, folder: "archive", unread: false } : t)),
    }));
    actions.saved("Archived", "ink");
  },
  reply(id: string, text: string, files: Attachment[] = []) {
    set((s) => ({
      ...s,
      threads: s.threads.map((t) =>
        t.id === id
          ? {
              ...t,
              unread: false,
              ...(files.length ? { files: [...(t.files ?? []), ...files], attachment: true } : {}),
              messages: [
                ...t.messages,
                {
                  id: `m${Date.now()}`,
                  from: "Kabir Mehra",
                  email: "kabir@rhinontech.in",
                  at: "Just now",
                  body: text,
                  mine: true,
                },
              ],
            }
          : t,
      ),
    }));
    actions.saved("Reply sent", "coral");
  },
  compose(to: string, subject: string, body: string, files: Attachment[] = []) {
    const thread: Thread = {
      id: `th${Date.now()}`,
      brand: state.brand,
      folder: "sent",
      starred: false,
      unread: false,
      subject: subject || "(no subject)",
      labels: [],
      attachment: files.length > 0,
      ...(files.length ? { files } : {}),
      day: "Today",
      time: "Just now",
      messages: [
        {
          id: "m1",
          from: "Kabir Mehra",
          email: "kabir@rhinontech.in",
          at: `To ${to}`,
          body,
          mine: true,
        },
      ],
    };
    set((s) => ({ ...s, threads: [thread, ...s.threads] }));
    actions.saved("Sent", "coral");
  },

  /* prototype controls */
  setRole(role: Role) {
    set((s) => ({ ...s, role }));
    actions.toast(`Viewing as ${ROLE_LABEL[role]}`, "violet");
  },
  setOffline(offline: boolean) {
    const waiting = state.queued;
    set((s) => ({ ...s, offline, queued: offline ? s.queued : 0 }));
    if (!offline && waiting > 0) {
      actions.toast(
        `Back online · ${waiting} ${waiting === 1 ? "change" : "changes"} synced`,
        "leaf",
      );
    }
  },

  /* chat */
  startDm(personId: string): string {
    const existing = state.chats.find((c) => c.kind === "dm" && c.members[0] === personId);
    if (existing) return existing.id;
    const p = personOf(personId);
    const id = `c${Date.now()}`;
    set((s) => ({
      ...s,
      chats: [
        {
          id,
          kind: "dm",
          name: p.name,
          tone: toneFor(p.name),
          members: [personId],
          unread: 0,
          time: "now",
          pinned: false,
          messages: [],
        },
        ...s.chats,
      ],
    }));
    return id;
  },
  receive(id: string, from: string, text: string) {
    set((s) => ({
      ...s,
      chats: s.chats.map((c) =>
        c.id === id
          ? {
              ...c,
              time: "now",
              messages: [...c.messages, { id: `${Date.now()}`, from, text, at: "now" }],
            }
          : c,
      ),
    }));
  },
  markChatRead(id: string) {
    set((s) => ({
      ...s,
      chats: s.chats.map((c) => (c.id === id && c.unread ? { ...c, unread: 0 } : c)),
    }));
  },
  sendChat(id: string, text: string, attachment?: Attachment) {
    set((s) => ({
      ...s,
      chats: s.chats.map((c) =>
        c.id === id
          ? {
              ...c,
              time: "now",
              messages: [
                ...c.messages,
                {
                  id: `${Date.now()}`,
                  from: "me",
                  text,
                  at: "now",
                  ...(attachment ? { attachment } : {}),
                },
              ],
            }
          : c,
      ),
    }));
  },

  /* pay */
  addClaim(input: { title: string; category: string; amount: number; payout: Claim["payout"] }) {
    set((s) => ({
      ...s,
      claims: [
        { id: `cl${Date.now()}`, ...input, month: "Nov 2026", status: "Pending" },
        ...s.claims,
      ],
    }));
    actions.saved("Claim submitted", "sun");
  },

  /* crm */
  moveDeal(id: string, stage: string) {
    set((s) => ({ ...s, deals: s.deals.map((d) => (d.id === id ? { ...d, stage } : d)) }));
    actions.saved(stage === "won" ? "Deal won 🎉" : "Moved", stage === "won" ? "leaf" : "ink");
  },

  /* notifications, prefs */
  readAllNotifs() {
    set((s) => ({ ...s, notifs: s.notifs.map((n) => ({ ...n, unread: false })) }));
  },
  readNotif(id: string) {
    set((s) => ({
      ...s,
      notifs: s.notifs.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    }));
  },
  togglePref(key: string) {
    set((s) => ({ ...s, prefs: { ...s.prefs, [key]: !s.prefs[key] } }));
  },

  /* offline queue: a change made while offline is "saved", not "sent" */
  saved(text: string, tone: Tone = "ink") {
    if (state.offline) {
      set((s) => ({ ...s, queued: s.queued + 1 }));
      actions.toast("Saved offline · will sync", "sun");
    } else {
      actions.toast(text, tone);
    }
  },

  /* permissions: toggling applies live, as in the real app */
  setPerm(role: RoleId, resource: string, kind: "read" | "write", value: boolean) {
    set((s) => {
      const cur = s.perms[role][resource] ?? { read: false, write: false };
      const next = { ...cur, [kind]: value };
      if (kind === "read" && !value) next.write = false;
      if (kind === "write" && value) next.read = true;
      return { ...s, perms: { ...s.perms, [role]: { ...s.perms[role], [resource]: next } } };
    });
  },

  /* push permission */
  setPush(answer: "granted" | "denied") {
    set((s) => ({
      ...s,
      pushPermission: answer,
      prefs: { ...s.prefs, push: answer === "granted" },
    }));
    actions.toast(
      answer === "granted" ? "Notifications are on" : "You can turn them on in Profile",
      answer === "granted" ? "leaf" : "ink",
    );
  },

  /* pay: re-auth with Face ID before amounts are shown again */
  lockPay() {
    set((s) => ({ ...s, payLocked: true }));
  },
  unlockPay() {
    set((s) => ({ ...s, payLocked: false }));
  },

  /* work */
  advanceTask(id: string) {
    const order: Task["status"][] = ["Pending", "In progress", "Done"];
    set((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === id
          ? { ...t, status: order[Math.min(order.indexOf(t.status) + 1, 2)] ?? t.status }
          : t,
      ),
    }));
  },
  convertRequest(id: string) {
    const r = state.clientRequests.find((x) => x.id === id);
    if (!r) return;
    const project = PROJECTS.find((p) => p.id === r.projectId);
    const task: Task = {
      id: `t${Date.now()}`,
      title: r.title,
      project: project?.name ?? "Client Portal",
      priority: "Medium",
      status: "Pending",
      due: "This week",
      group: "week",
      assignee: "me",
      est: 2,
      description: r.body,
      subtasks: [],
      comments: [],
      tags: ["client-request"],
    };
    set((s) => ({
      ...s,
      tasks: [task, ...s.tasks],
      clientRequests: s.clientRequests.map((c) =>
        c.id === id ? { ...c, status: "Converted" } : c,
      ),
    }));
    actions.saved("Converted to a task", "cobalt");
  },

  /* crm */
  logActivity(on: string, kind: ActivityKind, text: string) {
    set((s) => ({
      ...s,
      activities: [
        { id: `a${Date.now()}`, on, kind, text, by: "me", at: "Just now" },
        ...s.activities,
      ],
    }));
    actions.saved("Activity logged", "rose");
  },
  setLifecycle(id: string, lifecycle: Lifecycle) {
    set((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? { ...l, lifecycle } : l)) }));
  },
  convertLead(id: string) {
    const lead = state.leads.find((l) => l.id === id);
    if (!lead) return;
    const deal: Deal = {
      id: `d${Date.now()}`,
      title: `${lead.company} — new deal`,
      company: lead.company,
      value: 500000,
      stage: "lead",
      owner: "me",
      close: "Next month",
      contact: lead.name,
      note: `Converted from a lead (${lead.source}).`,
    };
    set((s) => ({
      ...s,
      deals: [deal, ...s.deals],
      leads: s.leads.map((l) => (l.id === id ? { ...l, lifecycle: "Qualified" } : l)),
    }));
    actions.saved("Converted to a deal", "rose");
  },

  /* outreach */
  toggleCampaign(id: string) {
    set((s) => ({
      ...s,
      campaigns: s.campaigns.map((c) =>
        c.id === id ? { ...c, status: c.status === "Active" ? "Paused" : "Active" } : c,
      ),
    }));
  },
  decideDraft(id: string, decision: "approved" | "rejected") {
    set((s) => ({
      ...s,
      drafts: s.drafts.map((d) => (d.id === id ? { ...d, status: decision } : d)),
    }));
    actions.saved(
      decision === "approved" ? "Approved · queued for the next run" : "Draft rejected",
      decision === "approved" ? "leaf" : "coral",
    );
  },
  editDraft(id: string, body: string) {
    set((s) => ({ ...s, drafts: s.drafts.map((d) => (d.id === id ? { ...d, body } : d)) }));
  },
  toggleFlow(id: string) {
    set((s) => ({
      ...s,
      flows: s.flows.map((f) => (f.id === id ? { ...f, active: !f.active } : f)),
    }));
  },

  /* chatbot */
  takeOver(id: string) {
    set((s) => ({
      ...s,
      botChats: s.botChats.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "agent",
              messages: [
                ...c.messages,
                {
                  id: `m${Date.now()}`,
                  who: "agent",
                  text: "Hi, this is Kabir from Rhinon. How can I help?",
                  at: "now",
                },
              ],
            }
          : c,
      ),
    }));
    actions.saved("You took over this chat", "sky");
  },
  sendBot(id: string, text: string) {
    set((s) => ({
      ...s,
      botChats: s.botChats.map((c) =>
        c.id === id
          ? {
              ...c,
              messages: [...c.messages, { id: `m${Date.now()}`, who: "agent", text, at: "now" }],
            }
          : c,
      ),
    }));
  },
  closeBot(id: string) {
    set((s) => ({
      ...s,
      botChats: s.botChats.map((c) => (c.id === id ? { ...c, status: "closed" } : c)),
    }));
    actions.saved("Chat closed", "ink");
  },
  setTicketStatus(id: string, status: Ticket["status"]) {
    set((s) => ({ ...s, tickets: s.tickets.map((t) => (t.id === id ? { ...t, status } : t)) }));
    actions.saved(`Ticket ${status.toLowerCase()}`, status === "Resolved" ? "leaf" : "sky");
  },
  assignTicket(id: string, who: string | null) {
    set((s) => ({
      ...s,
      tickets: s.tickets.map((t) => (t.id === id ? { ...t, assignee: who } : t)),
    }));
  },
  replyTicket(id: string, text: string) {
    set((s) => ({
      ...s,
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "Open" ? "Pending" : t.status,
              updated: "now",
              messages: [...t.messages, { id: `m${Date.now()}`, who: "agent", text, at: "now" }],
            }
          : t,
      ),
    }));
    actions.saved("Reply sent", "sky");
  },

  /* documents */
  addDoc(name: string, kind: DocKind) {
    set((s) => ({
      ...s,
      docs: [
        { id: `dc${Date.now()}`, name, kind, date: "Today", size: "1.4 MB", state: "ok" },
        ...s.docs,
      ],
    }));
    actions.saved("Added to your vault", "sun");
  },
  submitRequest(id: string) {
    const req = state.docRequests.find((r) => r.id === id);
    set((s) => ({
      ...s,
      docRequests: s.docRequests.map((r) => (r.id === id ? { ...r, done: true } : r)),
    }));
    if (req) actions.addDoc(`${req.title} (submitted)`, "id");
  },
  signDoc(id: string) {
    set((s) => ({
      ...s,
      docs: s.docs.map((d) => (d.id === id ? { ...d, state: "signed", date: "Today" } : d)),
    }));
    actions.saved("Signed. A copy is in your vault", "leaf");
  },

  /* performance */
  addGoal(title: string, keyResult: string, due: string) {
    set((s) => ({
      ...s,
      goals: [
        { id: `g${Date.now()}`, title, keyResult, cycle: "H2 2026", progress: 0, due },
        ...s.goals,
      ],
    }));
    actions.saved("Goal added", "violet");
  },
  setGoalProgress(id: string, progress: number) {
    set((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, progress } : g)) }));
  },
  submitSelfReview(rating: number, strengths: string, growth: string) {
    set((s) => ({ ...s, selfReview: { submitted: true, rating, strengths, growth } }));
    actions.saved("Self-review submitted to Vikram", "violet");
  },
  submitTeamReview(id: string, rating: number, notes: string) {
    set((s) => ({
      ...s,
      teamReviews: s.teamReviews.map((r) =>
        r.id === id ? { ...r, status: "Completed", managerRating: rating, managerNotes: notes } : r,
      ),
    }));
    actions.saved("Review submitted", "violet");
  },

  /* hiring */
  submitFeedback(id: string, rating: number, rec: Interview["rec"], notes: string) {
    set((s) => ({
      ...s,
      interviews: s.interviews.map((i) => (i.id === id ? { ...i, rating, rec, notes } : i)),
    }));
    actions.saved("Feedback submitted", "leaf");
  },

  /* pages */
  createPage(title: string, parent: string | null): string {
    const id = `wp${Date.now()}`;
    const page: WikiPage = {
      id,
      title,
      icon: "book",
      tone: "cobalt",
      parent,
      updated: "Just now",
      by: "me",
      body: `# ${title}\n\nStart writing here.`,
      sharedWith: [],
      linkShare: false,
    };
    set((s) => ({ ...s, pages: [page, ...s.pages] }));
    return id;
  },
  savePage(id: string, title: string, body: string) {
    set((s) => ({
      ...s,
      pages: s.pages.map((p) =>
        p.id === id ? { ...p, title, body, updated: "Just now", by: "me" } : p,
      ),
    }));
    actions.saved("Page saved", "cobalt");
  },
  setPageBody(id: string, body: string) {
    set((s) => ({ ...s, pages: s.pages.map((p) => (p.id === id ? { ...p, body } : p)) }));
  },
  sharePage(id: string, sharedWith: string[], linkShare: boolean) {
    set((s) => ({
      ...s,
      pages: s.pages.map((p) => (p.id === id ? { ...p, sharedWith, linkShare } : p)),
    }));
    actions.saved("Sharing updated", "cobalt");
  },

  /* ideas */
  readIdea(id: string) {
    set((s) => ({
      ...s,
      ideas: s.ideas.map((i) => (i.id === id && i.unread ? { ...i, unread: false } : i)),
    }));
  },
  setIdeaStatus(id: string, status: IdeaStatus) {
    set((s) => ({
      ...s,
      ideas: s.ideas.map((i) => (i.id === id ? { ...i, status, unread: false } : i)),
    }));
  },
  convertIdea(id: string) {
    const idea = state.ideas.find((i) => i.id === id);
    if (!idea) return;
    const lead: CrmLead = {
      id: `ld${Date.now()}`,
      name: idea.founder,
      company: idea.title,
      title: "Founder",
      email: idea.email,
      phone: "—",
      status: "New",
      lifecycle: "New",
      source: "Startup idea",
      last: "Just now",
      owner: "me",
    };
    set((s) => ({
      ...s,
      leads: [lead, ...s.leads],
      ideas: s.ideas.map((i) => (i.id === id ? { ...i, status: "Converted", unread: false } : i)),
    }));
    actions.saved("Added to CRM as a lead", "leaf");
  },

  /* events and content */
  checkIn(eventId: string, guestId: string, value = true) {
    set((s) => ({
      ...s,
      guests: {
        ...s.guests,
        [eventId]: (s.guests[eventId] ?? []).map((g) =>
          g.id === guestId ? { ...g, checkedIn: value } : g,
        ),
      },
    }));
  },
  scanNext(eventId: string): Guest | null {
    const next = (state.guests[eventId] ?? []).find((g) => !g.checkedIn);
    if (!next) return null;
    actions.checkIn(eventId, next.id, true);
    return next;
  },
  decidePost(id: string, status: Post["status"]) {
    set((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? { ...p, status } : p)) }));
    actions.saved(
      status === "Approved" ? "Approved · publishing" : "Changes requested",
      status === "Approved" ? "leaf" : "coral",
    );
  },
};

/** Does the current role have a permission? Reacts to edits made in Settings → Roles. */
export function usePerm(resource: string, kind: "read" | "write" = "read"): boolean {
  return useApp((s) => s.role !== undefined && (s.perms[s.role][resource]?.[kind] ?? false));
}
