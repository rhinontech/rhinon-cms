import { api, getSession } from "./api";
import { MONTHS, ago, dayLabel, defineLive, parseDay, replace, startOfDay, toneAt, write, DAY_MS, WEEKDAYS } from "./live-core";
import { PROJECTS, TEAMS, type DueGroup, type Priority, type Project, type Task, type TaskStatus } from "./mock-data";
import { CLIENT_REQUESTS, type ClientRequest } from "./mock-more";
import { actions, getState, hydrate } from "./store";

type ApiTask = {
  id: string; title: string; description: string | null; assigneeId: string | null; dueDate: string | null;
  status: TaskStatus; priority: Priority; estimatedHours: number | null; projectId: string | null;
  project?: { id: string; name: string; teamId?: string | null } | null; team?: string | null;
  subtasks?: { id: string; title: string; done: boolean }[]; tags?: { label: string }[];
};

function dueInfo(dueDate: string | null, status: TaskStatus): { due: string; group: DueGroup } {
  if (!dueDate) return { due: "No due date", group: "later" };
  const d = parseDay(dueDate);
  const diff = Math.round((startOfDay(d) - startOfDay(new Date())) / DAY_MS);
  if (diff < 0) return { due: `Overdue · ${-diff} day${diff === -1 ? "" : "s"}`, group: status === "Done" ? "today" : "overdue" };
  if (diff === 0) return { due: "Today", group: "today" };
  return { due: `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`, group: diff <= 7 ? "week" : "later" };
}

function toTask(t: ApiTask, me: string): Task {
  const { due, group } = dueInfo(t.dueDate, t.status);
  return {
    id: t.id, title: t.title, project: t.project?.name ?? t.team ?? "No project", priority: t.priority, status: t.status,
    due, group, assignee: t.assigneeId === me ? "me" : (t.assigneeId ?? "none"), est: t.estimatedHours ?? 0,
    description: t.description ?? "", subtasks: (t.subtasks ?? []).map((s) => ({ id: s.id, title: s.title, done: s.done })),
    comments: [], tags: (t.tags ?? []).map((g) => g.label),
  };
}

type ApiProject = { id: string; name: string; status: string; pointOfContact: string | null; teamId: string | null; taskCount: number };
type ApiTeam = { id: string; name: string; projectCount: number; members?: { role: string; user?: { id: string; fullName: string } | null }[] };
type ApiRequest = { id: string; title: string; description: string; status: string; projectId: string | null; reportedBy: string | null; creator?: { fullName: string } | null; createdAt: string };

const projectStatus = (s: string): Project["status"] => (/hold|pause/i.test(s) ? "Paused" : /complete|done|closed/i.test(s) ? "Completed" : /plan|pipeline|propos/i.test(s) ? "Pipeline" : "Active");

async function syncWork() {
  const me = getSession()?.userId ?? "";
  const [tasks, projects, teams, reqs] = await Promise.all([
    api<ApiTask[]>("/tasks?scope=all"),
    api<ApiProject[]>("/work/projects").catch(() => [] as ApiProject[]),
    api<ApiTeam[]>("/teams").catch(() => [] as ApiTeam[]),
    api<ApiRequest[]>("/work/requests").catch(() => [] as ApiRequest[]),
  ]);
  const rows = tasks.map((t) => toTask(t, me));
  hydrate({ tasks: rows });

  const owner = (id: string | null) => (id === me ? "me" : (id ?? ""));
  replace(PROJECTS, projects.map((p, i): Project => {
    const own = tasks.filter((t) => t.projectId === p.id);
    const done = own.filter((t) => t.status === "Done").length;
    const dues = own.map((t) => t.dueDate).filter((x): x is string => !!x).sort();
    const last = dues[dues.length - 1];
    const members = [...new Set(own.map((t) => owner(t.assigneeId)).filter(Boolean))].slice(0, 4);
    return {
      id: p.id, name: p.name, tone: toneAt(i), status: projectStatus(p.status), progress: own.length ? done / own.length : 0,
      members, tasks: p.taskCount, due: last ? `${parseDay(last).getDate()} ${MONTHS[parseDay(last).getMonth()]}` : "—", contact: p.pointOfContact ?? "",
    };
  }));

  const openIn = (teamId: string) => {
    const ids = new Set(projects.filter((p) => p.teamId === teamId).map((p) => p.id));
    return tasks.filter((t) => t.projectId && ids.has(t.projectId) && t.status !== "Done").length;
  };
  replace(TEAMS, teams.map((t, i) => {
    const members = (t.members ?? []).map((m) => m.user).filter((u): u is { id: string; fullName: string } => !!u);
    const lead = (t.members ?? []).find((m) => m.role === "owner")?.user ?? members[0];
    return { id: t.id, name: t.name, tone: toneAt(i + 2), members: members.map((u) => (u.id === me ? "me" : u.id)), open: openIn(t.id), lead: lead ? (lead.id === me ? "me" : lead.id) : "" };
  }));

  replace(CLIENT_REQUESTS, reqs.map((r): ClientRequest => ({
    id: r.id, projectId: r.projectId ?? "", by: r.reportedBy || r.creator?.fullName || "Client", title: r.title, body: r.description, at: ago(r.createdAt),
    status: /convert/i.test(r.status) ? "Converted" : "New",
  })));
}

export async function loadTaskComments(id: string) {
  const rows = await api<{ id: string; body: string; createdAt: string; author?: { fullName: string } | null }[]>(`/tasks/${id}/comments`);
  hydrate({ tasks: getState().tasks.map((t) => (t.id === id ? { ...t, comments: rows.map((c) => ({ id: c.id, by: c.author?.fullName ?? "Teammate", text: c.body, at: ago(c.createdAt) })) } : t)) });
}

defineLive({
  name: "work",
  sync: syncWork,
  blank: () => { hydrate({ tasks: [] }); replace(PROJECTS, []); replace(TEAMS, []); replace(CLIENT_REQUESTS, []); },
  install: ({ orig }) => {
    actions.toggleTask = (id) => {
      orig.toggleTask(id);
      const t = getState().tasks.find((x) => x.id === id);
      if (t) write("work", () => api(`/tasks/${id}`, { method: "PUT", body: { status: t.status } }));
    };
    actions.setTaskStatus = (id, status) => { orig.setTaskStatus(id, status); write("work", () => api(`/tasks/${id}`, { method: "PUT", body: { status } })); };
    actions.advanceTask = (id) => {
      orig.advanceTask(id);
      const t = getState().tasks.find((x) => x.id === id);
      if (t) write("work", () => api(`/tasks/${id}`, { method: "PUT", body: { status: t.status } }));
    };
    actions.toggleSubtask = (taskId, subId) => {
      orig.toggleSubtask(taskId, subId);
      const s = getState().tasks.find((x) => x.id === taskId)?.subtasks.find((x) => x.id === subId);
      if (s) write("work", () => api(`/tasks/${taskId}/subtasks/${subId}`, { method: "PUT", body: { done: s.done } }));
    };
    actions.addSubtask = (taskId, title) => { orig.addSubtask(taskId, title); write("work", () => api(`/tasks/${taskId}/subtasks`, { method: "POST", body: { title } })); };
    actions.addComment = (taskId, text) => {
      write("work", () => api(`/tasks/${taskId}/comments`, { method: "POST", body: { body: text } }), () => { actions.toast("Comment posted", "cobalt"); void loadTaskComments(taskId); });
    };
    actions.addTask = (input) => {
      orig.addTask(input);
      const project = PROJECTS.find((p) => p.name === input.project);
      write("work", () => api("/tasks", { method: "POST", body: { title: input.title, priority: input.priority, assigneeId: getSession()?.userId, ...(project ? { projectId: project.id } : null), dueDate: dueFor(input.group) } }));
    };
    actions.convertRequest = (id) => {
      orig.convertRequest(id);
      write("work", () => api("/work/requests/convert-to-tasks", { method: "POST", body: { requestIds: [id] } }), () => actions.toast("Turned into a task", "cobalt"));
    };
  },
});

/** The Add-task sheet offers Today / Tomorrow / This week; the API wants a date. */
function dueFor(group: string): string {
  const d = new Date();
  if (group === "week") d.setDate(d.getDate() + 4);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
void dayLabel;
