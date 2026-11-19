import { api } from "./api";
import { ago, defineLive, replace, write } from "./live-core";
import type { Campaign, Flow, OutreachDraft, SentItem } from "./mock-more";
import { SENT } from "./mock-more";
import { actions, getState, hydrate } from "./store";

type ApiCampaign = { id: string; name: string; status: string; channel: string; metrics?: { enrolled: number; sent: number; opened: number; replied: number; bounced: number } };
type ApiLead = { id: string; name: string; company: string | null; title: string | null; lifecycleStage: string; draftSubject: string | null; aiDraft: string | null; draftApproved: boolean };
type ApiActivity = { id: string; type?: string; status?: string; subject?: string | null; createdAt: string; lead?: { name: string; company: string | null } | null };
type ApiFlow = { id: string; name: string; trigger?: string; isActive?: boolean; active?: boolean; enrolled?: number; steps?: unknown[] };

const STATUS = (s: string): Campaign["status"] => (/active|running/i.test(s) ? "Active" : /pause/i.test(s) ? "Paused" : /complete|done/i.test(s) ? "Completed" : "Draft");

async function syncOutreach() {
  const brand = getState().brand;
  const [camps, leads, acts, flows] = await Promise.all([
    api<ApiCampaign[]>("/campaigns").catch(() => [] as ApiCampaign[]),
    api<ApiLead[]>("/leads").catch(() => [] as ApiLead[]),
    api<ApiActivity[]>("/outreach/activities?limit=40").catch(() => [] as ApiActivity[]),
    api<{ data?: ApiFlow[] } | ApiFlow[]>("/workflows").catch(() => [] as ApiFlow[]),
  ]);
  const campaigns: Campaign[] = camps.map((c) => ({
    id: c.id, brand, name: c.name, channel: /linkedin/i.test(c.channel) ? "LinkedIn" : "Email", status: STATUS(c.status),
    sent: c.metrics?.sent ?? 0, opened: c.metrics?.opened ?? 0, replied: c.metrics?.replied ?? 0, bounced: c.metrics?.bounced ?? 0, leads: c.metrics?.enrolled ?? 0, runTime: "",
  }));
  const drafts: OutreachDraft[] = leads.filter((l) => l.aiDraft && !l.draftApproved).slice(0, 50).map((l) => ({
    id: l.id, brand, lead: l.name, company: l.company ?? "", title: l.title ?? "", stage: l.lifecycleStage, subject: l.draftSubject ?? "", body: l.aiDraft ?? "", status: "pending",
  }));
  const list = Array.isArray(flows) ? flows : (flows.data ?? []);
  const fl: Flow[] = list.map((f) => ({ id: f.id, brand, name: f.name, trigger: f.trigger ?? "Manual", active: !!(f.isActive ?? f.active), enrolled: f.enrolled ?? 0, steps: f.steps?.length ?? 0 }));
  hydrate({ campaigns, drafts, flows: fl });
  const sentStatus = (a: ApiActivity): SentItem["status"] => (/repl/i.test(`${a.type}${a.status}`) ? "Replied" : /bounce/i.test(`${a.type}${a.status}`) ? "Bounced" : /open/i.test(`${a.type}${a.status}`) ? "Opened" : "Sent");
  replace(SENT, acts.map((a): SentItem => ({ id: a.id, brand, lead: a.lead?.name ?? "", company: a.lead?.company ?? "", subject: a.subject ?? "", status: sentStatus(a), at: ago(a.createdAt) })));
}

defineLive({
  name: "outreach",
  sync: syncOutreach,
  blank: () => { hydrate({ campaigns: [], drafts: [], flows: [] }); replace(SENT, []); },
  install: ({ orig }) => {
    actions.toggleCampaign = (id) => {
      orig.toggleCampaign(id);
      const c = getState().campaigns.find((x) => x.id === id);
      if (c) write("outreach", () => api(`/campaigns/${id}/${c.status === "Active" ? "resume" : "pause"}`, { method: "POST" }));
    };
    actions.decideDraft = (id, decision) => {
      orig.decideDraft(id, decision);
      write("outreach", () => api(`/leads/${id}`, { method: "PUT", body: decision === "approved" ? { draftApproved: true } : { aiDraft: null, draftSubject: null, draftApproved: false } }));
    };
    actions.editDraft = (id, body) => { orig.editDraft(id, body); write("outreach", () => api(`/leads/${id}`, { method: "PUT", body: { aiDraft: body } })); };
  },
});
