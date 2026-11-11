import { api, getSession } from "./api";
import { MONTHS, ago, defineLive, replace, write } from "./live-core";
import { AUDIT, type AuditEntry, type AuditKind, type Idea, type IdeaStatus } from "./mock-more";
import { actions, hydrate } from "./store";

const meId = () => getSession()?.userId ?? "";
const who = (id: string | null | undefined) => (id && id === meId() ? "me" : (id ?? ""));

/* ── startup ideas (platform workspace only) ─────────────────────────────── */

type ApiIdea = { id: string; name: string; email: string; organization: string | null; idea: string; stage: string | null; status: string; isRead: boolean; createdAt: string };
const IDEA_STATUSES: IdeaStatus[] = ["New", "Reviewing", "Interesting", "Converted", "Archived"];
const ideaStage = (s: string | null): Idea["stage"] => (/revenue|paying|customers/i.test(s ?? "") ? "Revenue" : /mvp|prototype|beta/i.test(s ?? "") ? "MVP" : "Idea");

async function syncIdeas() {
  const r = await api<{ ideas: ApiIdea[] }>("/startup-ideas?limit=100").catch(() => ({ ideas: [] as ApiIdea[] }));
  hydrate({
    ideas: r.ideas.map((i): Idea => ({
      id: i.id, title: i.organization || i.name, founder: i.name, email: i.email, oneLiner: i.idea.length > 110 ? `${i.idea.slice(0, 107)}…` : i.idea, problem: i.idea,
      stage: ideaStage(i.stage), at: ago(i.createdAt), status: (IDEA_STATUSES.includes(i.status as IdeaStatus) ? i.status : "New") as IdeaStatus, unread: !i.isRead,
    })),
  });
}

defineLive({
  name: "ideas",
  sync: syncIdeas,
  blank: () => hydrate({ ideas: [] }),
  install: ({ orig }) => {
    actions.readIdea = (id) => { orig.readIdea(id); write("ideas", () => api(`/startup-ideas/${id}`, { method: "PATCH", body: { isRead: true } })); };
    actions.setIdeaStatus = (id, status) => { orig.setIdeaStatus(id, status); write("ideas", () => api(`/startup-ideas/${id}`, { method: "PATCH", body: { status } })); };
    actions.convertIdea = (id) => { orig.convertIdea(id); write("ideas", () => api(`/startup-ideas/${id}/convert`, { method: "POST", body: {} })); };
  },
});

/* ── audit log ───────────────────────────────────────────────────────────── */

type ApiAudit = { id: string; actorId: string | null; actorName: string | null; action: string; entityType: string | null; entityId: string | null; ip: string | null; createdAt: string };

const KNOWN: Record<string, string> = { "auth.login": "Signed in", "auth.logout": "Signed out", "legal.terms_accepted": "Accepted the terms" };
function humanize(a: string): string {
  if (KNOWN[a]) return KNOWN[a]!;
  const http = a.match(/^(POST|PUT|PATCH|DELETE)\s+\/([^/\s]+)(?:\/([^/\s]+))?/);
  if (http) {
    const noun = http[2]!.replace(/-/g, " ");
    return `${http[1] === "POST" ? "Created" : http[1] === "DELETE" ? "Deleted" : "Updated"} ${noun}`;
  }
  const t = a.replace(/[._]/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}
const kindOf = (a: string): AuditKind => (/auth|2fa|password|role|permission|login/i.test(a) ? "security" : /payroll|payslip|reimburs|salary/i.test(a) ? "payroll" : /employee|people|leave|attendance|hiring|onboard/i.test(a) ? "people" : /blog|content|page|event|case/i.test(a) ? "content" : "settings");
const when = (iso: string) => { const d = new Date(iso); const sameDay = d.toDateString() === new Date().toDateString(); return `${sameDay ? "Today" : `${d.getDate()} ${MONTHS[d.getMonth()]}`} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

async function syncAudit() {
  const r = await api<{ entries: ApiAudit[] }>("/audit-log?limit=100").catch(() => ({ entries: [] as ApiAudit[] }));
  replace(AUDIT, r.entries.map((e): AuditEntry => ({
    id: e.id, actor: who(e.actorId), action: humanize(e.action), target: e.entityType ?? "", kind: kindOf(e.action), at: when(e.createdAt), where: e.ip ?? "",
  })));
}

defineLive({ name: "audit", sync: syncAudit, blank: () => replace(AUDIT, []) });
