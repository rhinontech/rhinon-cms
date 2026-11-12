import { api, getSession } from "./api";
import { MONTHS, MONTHS_LONG, WEEKDAYS, assign, defineLive, hhmm, parseDay, replace, startOfDay, toneAt, write } from "./live-core";
import { CELEBRATIONS, ME, MEETINGS, PEOPLE, SALARY_STRUCTURE, TODAY, type Meeting, type Person } from "./mock-data";
import { actions, hydrate, ROLE_LABEL, type Role } from "./store";
import { defaultPerms, type Perm } from "./mock-more";

type ApiUser = {
  id: string; fullName: string; companyEmail?: string | null; personalEmail?: string | null; department?: string | null;
  roleTitle?: string | null; role?: { name: string } | null; workLocation?: string | null; joiningDate?: string | null; phone?: string | null;
};

const roleName = (u: ApiUser) => u.roleTitle || u.role?.name || "";

/** The prototype's "today" is a fixed date; with a real account it is the real one. */
function syncToday() {
  const d = new Date();
  assign(TODAY as { -readonly [K in keyof typeof TODAY]: (typeof TODAY)[K] }, {
    iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    label: `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`,
    year: d.getFullYear(), month: d.getMonth(), day: d.getDate(),
  } as never);
}

type ApiMe = ApiUser & { permissions?: string[]; role?: { name: string; slug: string } | null; organization?: { name: string; isPlatform?: boolean }; annualCompensation?: string; annualVariablePay?: string; bankAccountNumber?: string | null; pan?: string | null; pfUanNumber?: string | null };

const LEVEL: Record<string, Role> = { superadmin: "admin", admin: "admin", hr: "hr", manager: "manager", employee: "employee" };
const DIRECT = ["dashboard", "inbox", "chat", "work", "pages", "meetings", "attendance", "leave", "payroll", "performance", "documents", "crm", "outreach", "chatbot", "analytics", "settings"];
const PLATFORM_ONLY = new Set(["ideas", "content", "analytics"]);

/** The app's resources (approvals, hiring, audit…) don't map 1:1 onto the API's `resource:action` grants. */
function permsFor(all: boolean, granted: Set<string>, platform: boolean): Record<string, Perm> {
  const can = (res: string, kind: "read" | "write") => all || granted.has(`${res}:${kind}`);
  const out: Record<string, Perm> = {};
  for (const r of DIRECT) out[r] = { read: can(r, "read") || can(r, "write"), write: can(r, "write") };
  const manage = ["leave", "attendance", "payroll"].some((r) => can(r, "write"));
  out.approvals = { read: manage, write: manage };
  out.hiring = { read: can("employees", "write"), write: can("employees", "write") };
  out.audit = { read: can("settings", "write"), write: false };
  out.ideas = { read: platform && all, write: platform && all };
  out.content = { read: platform && (all || can("content", "read")), write: platform && (all || can("content", "write")) };
  if (!platform) for (const r of PLATFORM_ONLY) out[r] = { read: false, write: false };
  return out;
}

async function syncMe() {
  const me = await api<ApiMe>("/auth/me");
  const first = me.fullName.split(" ")[0] ?? me.fullName;
  const j = me.joiningDate ? parseDay(me.joiningDate) : null;
  assign(ME as Record<string, unknown>, {
    id: "me", name: me.fullName, first, role: roleName(me) || me.role?.name || "Team member", dept: me.department ?? "",
    email: me.companyEmail || me.personalEmail || "", phone: me.phone ?? "", joined: j ? `${MONTHS[j.getMonth()]} ${j.getFullYear()}` : "",
    manager: "", location: me.workLocation ?? "",
  });
  const slug = me.role?.slug ?? "employee";
  const level = LEVEL[slug] ?? "manager";
  ROLE_LABEL[level] = me.role?.name ?? ROLE_LABEL[level];
  const perms = defaultPerms();
  perms[level] = permsFor(slug === "superadmin", new Set(me.permissions ?? []), !!me.organization?.isPlatform);
  hydrate({ role: level, perms });
  // pay details, masked: the phone never holds a full bank or PAN number
  const last = (v?: string | null, n = 4) => (v ? v.slice(-n) : "");
  assign(SALARY_STRUCTURE as Record<string, unknown>, {
    annual: Number(me.annualCompensation ?? 0),
    variable: Number(me.annualVariablePay ?? 0) > 0 ? `₹${Number(me.annualVariablePay).toLocaleString("en-IN")} variable pay a year` : "No variable pay",
    bank: me.bankAccountNumber ? `Account ••${last(me.bankAccountNumber)}` : "Not added",
    pan: me.pan ? `${me.pan.slice(0, 5)}••••${me.pan.slice(-1)}` : "Not added",
    uan: me.pfUanNumber ? `•••• ${last(me.pfUanNumber)}` : "Not added",
  });
}

async function syncPeople() {
  const myId = getSession()?.userId;
  const rows = await api<ApiUser[]>("/people");
  // Only the directory fields are kept: this endpoint returns far more (pay and bank details) than a phone needs.
  const list: Person[] = rows.filter((u) => u.id !== myId).map((u) => ({
    id: u.id, name: u.fullName, role: roleName(u), dept: u.department ?? "", email: u.companyEmail || u.personalEmail || "",
    phone: u.phone ?? "", online: false, location: u.workLocation ?? "",
  }));
  replace(PEOPLE, list);
}

type ApiStats = {
  birthdays: { id: string; fullName: string; isToday: boolean; day: number }[];
  anniversaries: { id: string; fullName: string; years: number; isToday: boolean }[];
  recentHires: { id: string; fullName: string; joiningDate: string }[];
};

async function syncCelebrations() {
  const s = await api<ApiStats>("/dashboard/stats");
  const myId = getSession()?.userId;
  const out: typeof CELEBRATIONS = [];
  for (const b of s.birthdays) if (b.isToday && b.id !== myId) out.push({ who: b.id, what: "Birthday today", tone: "rose" });
  for (const a of s.anniversaries) if (a.isToday && a.id !== myId) out.push({ who: a.id, what: `${a.years} year${a.years === 1 ? "" : "s"} at Rhinon`, tone: "sun" });
  const week = Date.now() - 7 * 86_400_000;
  for (const h of s.recentHires) if (h.id !== myId && new Date(h.joiningDate).getTime() >= week) out.push({ who: h.id, what: "Joined this week", tone: "leaf" });
  replace(CELEBRATIONS, out);
}

/* ── meetings: today and tomorrow from the user's calendar ───────────────── */

type ApiEvent = { id: string; summary: string; location: string | null; start: string | null; end: string | null; allDay: boolean; meetLink: string | null; attendees: { email: string }[] };

async function syncMeetings() {
  const from = new Date(startOfDay(new Date()));
  const to = new Date(from.getTime() + 2 * 86_400_000);
  const rows = await api<ApiEvent[]>(`/meetings?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`);
  const tomorrow = from.getTime() + 86_400_000;
  const byEmail = new Map(PEOPLE.map((p) => [p.email.toLowerCase(), p.id]));
  const now = Date.now();
  const list: Meeting[] = rows.filter((e) => e.start && !e.allDay).map((e) => {
    const s = new Date(e.start!), en = new Date(e.end ?? e.start!);
    const people = e.attendees.map((a) => byEmail.get(a.email.toLowerCase())).filter((x): x is string => !!x);
    const external = e.attendees.some((a) => !byEmail.has(a.email.toLowerCase()) && !a.email.toLowerCase().includes(ME.email.split("@")[1] ?? "@"));
    return {
      id: e.id, title: e.summary, start: hhmm(s), end: hhmm(en), day: s.getTime() >= tomorrow ? "Tomorrow" : "Today",
      kind: external ? "client" : "internal", where: e.meetLink ? "Google Meet" : (e.location ?? "In person"), people, state: "later",
    } as Meeting;
  }).sort((a, b) => (a.day === b.day ? a.start.localeCompare(b.start) : a.day === "Today" ? -1 : 1));
  // the first meeting that has not ended yet is "next"
  const next = list.findIndex((m) => m.day === "Today" && new Date(`${TODAY.iso}T${m.end}:00`).getTime() > now);
  if (next >= 0) list[next] = { ...list[next]!, state: "next" };
  replace(MEETINGS, list);
}

defineLive({
  name: "people",
  sync: async () => { syncToday(); await Promise.allSettled([syncMe(), syncPeople().then(syncMeetings), syncCelebrations()]); },
  blank: () => {
    replace(PEOPLE, []); replace(CELEBRATIONS, []); replace(MEETINGS, []);
    assign(ME as Record<string, unknown>, { name: "", first: "", role: "", dept: "", email: "", phone: "", joined: "", manager: "", location: "" });
  },
  install: ({ orig }) => {
    void orig; void write; void actions; void toneAt; void MONTHS_LONG;
  },
});
