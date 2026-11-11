import { api, getSession } from "./api";
import { MONTHS, ago, defineLive, parseDay, replace, toneAt, write } from "./live-core";
import { STAGES, type Deal } from "./mock-data";
import type { Account, Activity, ActivityKind, CrmLead, Lifecycle } from "./mock-more";
import { actions, getState, hydrate } from "./store";
import type { Tone } from "./tone";

type ApiStage = { id: string; name: string; type: "Open" | "Won" | "Lost"; deals?: ApiDeal[] };
type ApiDeal = { id: string; title: string; value: string | number; stageId: string | null; ownerId: string | null; expectedCloseDate: string | null; notes: string | null; account?: { name: string } | null; primaryLead?: { name: string } | null };
type ApiLead = { id: string; name: string; company: string | null; title: string | null; email: string | null; phone: string | null; status: string; lifecycleStage: string; source: string | null; lastActivityAt: string | null; ownerId: string | null };
type ApiAccount = { id: string; name: string; industry: string | null; location: string | null; employeeCount: number | null; description: string | null; createdAt: string };

const STAGE_TONES: Tone[] = ["sky", "sun", "cobalt", "violet", "rose"];
/** The app calls the winning stage "won"; every other stage keeps its real id. */
const toReal = new Map<string, string>();

const closeLabel = (iso: string | null) => (iso ? `${parseDay(iso).getDate()} ${MONTHS[parseDay(iso).getMonth()]}` : "—");
const LEAD_STATUS = ["New", "Contacted", "Interested", "Replied"] as const;
const LIFECYCLE: Lifecycle[] = ["New", "Contacted", "Engaged", "Qualified", "Unqualified", "Customer"];

async function syncCrm() {
  const me = getSession()?.userId;
  const owner = (id: string | null) => (id && id === me ? "me" : (id ?? ""));
  const [board, leads, accounts] = await Promise.all([
    api<{ stages: ApiStage[] }>("/deals/board").catch(() => ({ stages: [] as ApiStage[] })),
    api<ApiLead[]>("/leads").catch(() => [] as ApiLead[]),
    api<{ rows: ApiAccount[] }>("/accounts").catch(() => ({ rows: [] as ApiAccount[] })),
  ]);

  toReal.clear();
  const stages = board.stages.filter((s) => s.type !== "Lost");
  replace(STAGES, stages.map((s, i) => {
    const id = s.type === "Won" ? "won" : s.id;
    toReal.set(id, s.id);
    return { id, name: s.name, tone: s.type === "Won" ? "leaf" : (STAGE_TONES[i % STAGE_TONES.length] ?? toneAt(i)) };
  }));
  const appId = (realId: string | null) => { for (const [k, v] of toReal) if (v === realId) return k; return realId ?? ""; };

  const deals: Deal[] = board.stages.flatMap((s) => s.deals ?? []).map((d) => ({
    id: d.id, title: d.title, company: d.account?.name ?? "—", value: Number(d.value), stage: appId(d.stageId), owner: owner(d.ownerId),
    close: closeLabel(d.expectedCloseDate), contact: d.primaryLead?.name ?? "", note: d.notes ?? "",
  }));

  const crmLeads: CrmLead[] = leads.map((l) => ({
    id: l.id, name: l.name, company: l.company ?? "", title: l.title ?? "", email: l.email ?? "", phone: l.phone ?? "",
    status: (LEAD_STATUS as readonly string[]).includes(l.status) ? (l.status as CrmLead["status"]) : "New",
    lifecycle: (LIFECYCLE.includes(l.lifecycleStage as Lifecycle) ? l.lifecycleStage : "New") as Lifecycle,
    source: l.source ?? "", last: l.lastActivityAt ? `Active ${ago(l.lastActivityAt)} ago` : "No activity yet", owner: owner(l.ownerId),
  }));

  const accts: Account[] = accounts.rows.map((a) => ({
    id: a.id, name: a.name, industry: a.industry ?? "", city: a.location ?? "", size: a.employeeCount ? `${a.employeeCount} people` : "", since: String(new Date(a.createdAt).getFullYear()), note: a.description ?? "",
  }));
  hydrate({ deals, leads: crmLeads, accounts: accts });
}

const KIND: Record<string, ActivityKind> = { Call: "call", Email: "email", Meeting: "meeting" };
const TYPE: Record<ActivityKind, string> = { call: "Call", email: "Email", meeting: "Meeting", note: "Note" };

/** Load a lead's, deal's or account's timeline into the store when its sheet opens. */
export async function loadActivities(on: string, kind: "lead" | "deal" | "account") {
  const key = kind === "lead" ? "leadId" : kind === "deal" ? "dealId" : "accountId";
  const res = await api<{ entries?: { id: string; type: string; subject: string | null; body: string | null; user?: { fullName: string } | null; occurredAt: string }[] } | { id: string; type: string; subject: string | null; body: string | null; user?: { fullName: string } | null; occurredAt: string }[]>(`/activities/timeline?${key}=${on}`);
  const rows = Array.isArray(res) ? res : (res.entries ?? []);
  const fresh: Activity[] = rows.filter((r) => !/Change$/.test(r.type) && r.type !== "System").map((r) => ({
    id: r.id, on, kind: KIND[r.type] ?? "note", text: r.subject || r.body || r.type, by: r.user?.fullName ?? "Someone", at: ago(r.occurredAt),
  }));
  hydrate({ activities: [...getState().activities.filter((a) => a.on !== on), ...fresh] });
}

defineLive({
  name: "crm",
  sync: syncCrm,
  blank: () => { replace(STAGES, []); hydrate({ deals: [], leads: [], accounts: [], activities: [] }); },
  install: ({ orig }) => {
    actions.moveDeal = (id, stage) => {
      orig.moveDeal(id, stage);
      write("crm", () => api(`/deals/${id}`, { method: "PUT", body: { stageId: toReal.get(stage) ?? stage } }));
    };
    actions.setLifecycle = (id, lifecycle) => {
      orig.setLifecycle(id, lifecycle);
      write("crm", () => api(`/leads/${id}`, { method: "PUT", body: { lifecycleStage: lifecycle } }));
    };
    actions.convertLead = (id) => {
      orig.convertLead(id);
      write("crm", () => api(`/leads/${id}/convert`, { method: "POST", body: {} }));
    };
    actions.logActivity = (on, kind, text) => {
      orig.logActivity(on, kind, text);
      const isDeal = getState().deals.some((d) => d.id === on);
      write("crm", () => api("/activities", { method: "POST", body: { [isDeal ? "dealId" : "leadId"]: on, type: TYPE[kind], body: text } }), () => { void loadActivities(on, isDeal ? "deal" : "lead"); });
    };
  },
});
