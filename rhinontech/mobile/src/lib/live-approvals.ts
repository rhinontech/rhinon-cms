import { api, getSession } from "./api";
import { MONTHS, WEEKDAYS, ago, defineLive, parseDay, write } from "./live-core";
import type { Approval } from "./mock-data";
import { actions, hydrate } from "./store";

type LeaveRow = { id: string; userId: string; leaveTypeName?: string; startDate: string; endDate: string; days: number; reason?: string; status: string; createdAt: string };
type CorrectionRow = { id: string; userId: string; type: string; date: string; reason: string; status: string; requestedTime?: string | null; createdAt: string };
type ClaimRow = { id: string; category: string; description: string; amount: number; createdAt: string; employee?: { id: string } | null };

const dayLabel = (iso: string) => { const d = parseDay(iso); return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };

/** What is waiting on this person: leave, time corrections and expense claims from other people. */
async function syncApprovals() {
  const me = getSession()?.userId;
  const [leave, fixes, claims] = await Promise.all([
    api<LeaveRow[]>("/leave/requests").catch(() => [] as LeaveRow[]),
    api<CorrectionRow[]>("/attendance/requests").catch(() => [] as CorrectionRow[]),
    api<ClaimRow[]>("/reimbursements/admin?status=pending").catch(() => [] as ClaimRow[]),
  ]);
  const out: Approval[] = [];
  for (const r of leave) {
    if (r.status !== "Pending" || r.userId === me) continue;
    out.push({ id: `leave:${r.id}`, kind: "leave", who: r.userId, title: `${r.leaveTypeName ?? "Leave"} · ${r.days} day${r.days === 1 ? "" : "s"}`, detail: `${dayLabel(r.startDate)} – ${dayLabel(r.endDate)}${r.reason ? ` · ${r.reason}` : ""}`, when: ago(r.createdAt) });
  }
  for (const r of fixes) {
    if (r.status !== "Pending" || r.userId === me) continue;
    out.push({ id: `attendance:${r.id}`, kind: "attendance", who: r.userId, title: "Time correction", detail: `${dayLabel(r.date)}${r.requestedTime ? ` · ${r.requestedTime}` : ""}${r.reason ? ` · ${r.reason}` : ""}`, when: ago(r.createdAt) });
  }
  for (const c of claims) {
    out.push({ id: `reimbursement:${c.id}`, kind: "reimbursement", who: c.employee?.id ?? "", title: c.category, detail: c.description, when: ago(c.createdAt), amount: Number(c.amount) });
  }
  hydrate({ approvals: out });
}

defineLive({
  name: "approvals",
  sync: syncApprovals,
  blank: () => hydrate({ approvals: [] }),
  install: ({ orig }) => {
    actions.decide = (id, decision) => {
      orig.decide(id, decision);
      const [kind, rid] = [id.slice(0, id.indexOf(":")), id.slice(id.indexOf(":") + 1)];
      const status = decision === "approved" ? "Approved" : "Rejected";
      if (kind === "leave") write("approvals", () => api(`/leave/requests/${rid}/action`, { method: "PUT", body: { status } }), () => { void import("./live-core").then((c) => c.resync("leave")); });
      else if (kind === "attendance") write("approvals", () => api(`/attendance/requests/${rid}`, { method: "PUT", body: { status } }));
      else if (kind === "reimbursement") write("approvals", () => api(`/reimbursements/admin/${rid}/${decision === "approved" ? "approve" : "reject"}`, { method: "POST", body: decision === "approved" ? { payout: "payslip" } : { note: "Rejected from mobile" } }));
    };
  },
});
