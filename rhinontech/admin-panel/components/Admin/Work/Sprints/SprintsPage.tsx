"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  TbCalendar, TbFlag, TbLayoutSidebarFilled, TbLayoutSidebarRightFilled,
  TbPlus, TbRocket, TbSearch, TbTrash, TbX,
} from "react-icons/tb";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { usePermissions } from "@/context/PermissionsContext";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { NativeSelect } from "@/components/ui/native-select";
import { confirmDialog } from "@/components/ui/dialogs";
import { PRIORITY_COLORS } from "../Tasks/constants";
import { DueBadge, initials, isOverdue, ordinalDate } from "../Tasks/utils";
import { ApiSprint, SprintFormState, SprintTask, emptySprintForm } from "./types";

interface ProjectOption { id: string; name: string }
interface TeamOption { id: string; name: string }

type PanelMode = "view" | "create" | "edit";

const STATUS_LABEL: Record<string, string> = { planning: "Planning", active: "Active", completed: "Completed" };
const STATUS_DOT: Record<string, string> = {
  planning: "bg-muted-foreground/40",
  active: "bg-emerald-500",
  completed: "bg-blue-500",
};

function fmtRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{done}/{total}</span>
    </div>
  );
}

export function SprintsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const { has } = usePermissions();
  const canWrite = has("work:write");

  const [sprints, setSprints] = useState<ApiSprint[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ApiSprint | null>(null);
  const [mode, setMode] = useState<PanelMode>("view");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SprintFormState>(emptySprintForm());

  // The sprint's own tasks + the backlog it can pull from. Reloaded whenever
  // the selected sprint changes — a sprint's task list is cheap and small.
  const [sprintTasks, setSprintTasks] = useState<SprintTask[]>([]);
  const [backlog, setBacklog] = useState<SprintTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [backlogSearch, setBacklogSearch] = useState("");

  const fetchSprints = async () => {
    try {
      const data = await apiFetch<ApiSprint[]>("/sprints");
      setSprints(data);
      setSelected((current) => {
        if (!data.length) return null;
        if (current) return data.find((s) => s.id === current.id) ?? data[0];
        return data[0];
      });
    } catch {
      setSprints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSprints();
    apiFetch<ProjectOption[]>("/work/projects").then(setProjects).catch(() => setProjects([]));
    apiFetch<TeamOption[]>("/teams").then((d) => setTeams(d.map((t) => ({ id: t.id, name: t.name })))).catch(() => setTeams([]));
  }, []);

  const loadSprintTasks = async (sprint: ApiSprint) => {
    setTasksLoading(true);
    try {
      const [inSprint, open] = await Promise.all([
        apiFetch<SprintTask[]>(`/tasks?scope=all&sprintId=${sprint.id}`),
        apiFetch<SprintTask[]>(
          `/tasks?scope=all&sprintId=none${sprint.projectId ? `&projectId=${sprint.projectId}` : ""}`
        ),
      ]);
      setSprintTasks(inSprint);
      setBacklog(open);
    } catch {
      setSprintTasks([]);
      setBacklog([]);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (selected && mode === "view") loadSprintTasks(selected);
    else { setSprintTasks([]); setBacklog([]); }
  }, [selected?.id, mode]);

  const visibleSprints = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sprints;
    return sprints.filter((s) => s.name.toLowerCase().includes(q) || (s.goal ?? "").toLowerCase().includes(q));
  }, [sprints, search]);

  const visibleBacklog = useMemo(() => {
    const q = backlogSearch.trim().toLowerCase();
    if (!q) return backlog;
    return backlog.filter((t) => t.title.toLowerCase().includes(q));
  }, [backlog, backlogSearch]);

  const startCreate = () => {
    setForm(emptySprintForm());
    setMode("create");
    setIsPreviewExpanded(true);
    setMobileDetail(true);
  };

  const startEdit = () => {
    if (!selected) return;
    setForm({
      name: selected.name,
      goal: selected.goal ?? "",
      projectId: selected.projectId ?? "",
      teamId: selected.teamId ?? "",
      startDate: selected.startDate,
      endDate: selected.endDate,
      status: selected.status,
    });
    setMode("edit");
  };

  const saveSprint = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        goal: form.goal || null,
        projectId: form.projectId || null,
        teamId: form.teamId || null,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
      };
      if (mode === "create") {
        const created = await apiFetch<ApiSprint>("/sprints", { method: "POST", body: JSON.stringify(payload) });
        await fetchSprints();
        setSelected(created);
        toast.success(`Sprint "${created.name}" created`);
      } else if (selected) {
        const updated = await apiFetch<ApiSprint>(`/sprints/${selected.id}`, { method: "PUT", body: JSON.stringify(payload) });
        await fetchSprints();
        setSelected(updated);
        toast.success("Sprint updated");
      }
      setMode("view");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't save that sprint.");
    } finally {
      setSaving(false);
    }
  };

  const deleteSprint = async () => {
    if (!selected) return;
    if (!(await confirmDialog(`Delete the sprint "${selected.name}"? Its tasks return to the backlog — nothing is deleted.`))) return;
    try {
      await apiFetch(`/sprints/${selected.id}`, { method: "DELETE" });
      setSelected(null);
      await fetchSprints();
      toast.success("Sprint deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete sprint");
    }
  };

  const moveTask = async (taskId: string, sprintId: string | null) => {
    if (!selected) return;
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "PUT", body: JSON.stringify({ sprintId }) });
      await Promise.all([loadSprintTasks(selected), fetchSprints()]);
    } catch (err: any) {
      toast.error(err?.message || "Couldn't move that task.");
    }
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden glass-panel", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">Sprints</h1>
              <p className="text-xs text-muted-foreground">Dated iterations the team pulls backlog work into.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canWrite && (
              <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                New sprint
                <TbPlus size={14} />
              </button>
            )}
            {!isPreviewExpanded && (
              <button onClick={() => { setIsPreviewExpanded(true); setMobileDetail(true); }} className="rounded-lg p-2 text-foreground/70 hover:bg-muted">
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="relative w-full max-w-[460px]">
            <TbSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sprints"
              className="w-full rounded-lg border border-border py-2 pl-10 pr-4 text-sm outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60"
            />
          </div>

          <div className="mt-8 overflow-hidden rounded-xl glass-card">
            <div className="min-w-[640px] grid grid-cols-[1.8fr_1.2fr_1fr_1.4fr] border-b bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Sprint</span>
              <span>Dates</span>
              <span>Status</span>
              <span>Progress</span>
            </div>
            {visibleSprints.map((sprint) => (
              <button
                key={sprint.id}
                onClick={() => { setSelected(sprint); setMode("view"); setIsPreviewExpanded(true); setMobileDetail(true); }}
                className={cn(
                  "grid w-full min-w-[640px] grid-cols-[1.8fr_1.2fr_1fr_1.4fr] items-center border-b px-4 py-3 text-left text-sm hover:bg-muted/40",
                  selected?.id === sprint.id && mode === "view" && "bg-blue-50 dark:bg-blue-400/10 hover:bg-blue-50 dark:hover:bg-blue-400/10"
                )}
              >
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <TbRocket size={16} className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{sprint.name}</span>
                </span>
                <span className="flex items-center gap-1 truncate text-foreground/70">
                  <TbCalendar size={13} className="shrink-0" />
                  {fmtRange(sprint.startDate, sprint.endDate)}
                </span>
                <span className="flex items-center gap-1.5 text-foreground/70">
                  <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[sprint.status])} />
                  {STATUS_LABEL[sprint.status]}
                </span>
                <ProgressBar done={sprint.doneCount} total={sprint.taskCount} />
              </button>
            ))}
            {!loading && !visibleSprints.length && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                {sprints.length === 0
                  ? "No sprints yet. Create one to plan a dated chunk of work."
                  : "No sprints match that search."}
              </div>
            )}
            {loading && <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading sprints…</div>}
          </div>
        </div>
      </main>

      <aside className={cn(
        "min-h-0 flex-col bg-card overflow-hidden transition-all duration-200 ease-in-out",
        mobileDetail ? "fixed inset-0 z-50 flex" : "hidden",
        "lg:static lg:z-auto lg:flex lg:h-full lg:rounded-xl",
        isPreviewExpanded && (visibleSprints.length > 0 || mode === "create") ? "lg:w-[44%] lg:ml-2" : "lg:w-0"
      )}>
        {isPreviewExpanded && (visibleSprints.length > 0 || mode === "create") && (
          <div className="flex h-full flex-1 flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-5">
              <p className="-mb-px flex self-stretch items-center border-b-2 border-blue-600 text-md font-medium tracking-tight text-foreground">
                {mode === "create" ? "New sprint" : mode === "edit" ? "Edit sprint" : "Sprint details"}
              </p>
              <div className="flex items-center gap-2">
                {mode === "view" && selected && canWrite && (
                  <>
                    <button onClick={startEdit} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-400/10">Edit</button>
                    <button onClick={deleteSprint} className="rounded-lg px-2 py-1.5 text-sm font-medium text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-400/10">
                      <TbTrash size={16} />
                    </button>
                  </>
                )}
                <button onClick={() => { setIsPreviewExpanded(false); setMobileDetail(false); setMode("view"); }} className="text-foreground/70 hover:text-foreground">
                  <TbLayoutSidebarRightFilled size={20} />
                </button>
              </div>
            </div>

            {mode === "create" || mode === "edit" ? (
              <form onSubmit={saveSprint} className="flex-1 space-y-4 overflow-auto p-5">
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                  Sprint name
                  <input
                    value={form.name}
                    onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                    required
                    placeholder="e.g. Sprint 14 — Nov 24 to Dec 7"
                    className="rounded-lg border border-border px-3 py-2 font-normal outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                  Goal
                  <textarea
                    value={form.goal}
                    onChange={(e) => setForm((c) => ({ ...c, goal: e.target.value }))}
                    placeholder="What does done look like for this sprint?"
                    className="min-h-20 rounded-lg border border-border px-3 py-2 font-normal outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                    Start date
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((c) => ({ ...c, startDate: e.target.value }))}
                      required
                      className="rounded-lg border border-border px-3 py-2 font-normal outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                    End date
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((c) => ({ ...c, endDate: e.target.value }))}
                      required
                      className="rounded-lg border border-border px-3 py-2 font-normal outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                  Status
                  <NativeSelect
                    value={form.status}
                    onChange={(e) => setForm((c) => ({ ...c, status: e.target.value as SprintFormState["status"] }))}
                    className="rounded-lg border border-border bg-card px-3 py-2 font-normal outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </NativeSelect>
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                  Project (optional)
                  <NativeSelect
                    value={form.projectId}
                    onChange={(e) => setForm((c) => ({ ...c, projectId: e.target.value }))}
                    className="rounded-lg border border-border bg-card px-3 py-2 font-normal outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60"
                  >
                    <option value="">Company-wide — any project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </NativeSelect>
                  <span className="text-xs font-normal text-muted-foreground">Scoping to a project limits the backlog to that project's tasks.</span>
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground/85">
                  Team (optional)
                  <NativeSelect
                    value={form.teamId}
                    onChange={(e) => setForm((c) => ({ ...c, teamId: e.target.value }))}
                    className="rounded-lg border border-border bg-card px-3 py-2 font-normal outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60"
                  >
                    <option value="">Visible to everyone</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </NativeSelect>
                </label>

                <div className="flex items-center justify-end gap-3 border-t pt-4">
                  <button type="button" onClick={() => setMode("view")} className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/85 hover:bg-muted">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                    {saving ? "Saving…" : mode === "create" ? "Create sprint" : "Save changes"}
                  </button>
                </div>
              </form>
            ) : selected ? (
              <div className="flex-1 space-y-5 overflow-auto p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[selected.status])} />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{STATUS_LABEL[selected.status]}</span>
                  </div>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">{selected.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <TbCalendar size={14} /> {fmtRange(selected.startDate, selected.endDate)}
                  </p>
                  {selected.goal && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-foreground/80">
                      <TbFlag size={14} className="mt-0.5 shrink-0 text-muted-foreground" /> {selected.goal}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {selected.project && <span className="rounded border border-border px-2 py-0.5">{selected.project.name}</span>}
                    {selected.team && <span className="rounded border border-border px-2 py-0.5">Team: {selected.team.name}</span>}
                  </div>
                  <div className="mt-4">
                    <ProgressBar done={selected.doneCount} total={selected.taskCount} />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    In this sprint ({sprintTasks.length})
                  </p>
                  <div className="overflow-hidden rounded-lg border border-border">
                    {sprintTasks.map((t) => (
                      <TaskRow key={t.id} task={t} action={<button onClick={() => moveTask(t.id, null)} title="Send back to backlog" className="rounded-md p-1 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-400/10 hover:text-red-600 dark:hover:text-red-300"><TbX size={15} /></button>} />
                    ))}
                    {!tasksLoading && !sprintTasks.length && (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground">Nothing pulled in yet — add from the backlog below.</div>
                    )}
                    {tasksLoading && <div className="px-3 py-6 text-center text-xs text-muted-foreground">Loading…</div>}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Backlog{selected.project ? ` — ${selected.project.name}` : ""} ({backlog.length})
                  </p>
                  <input
                    value={backlogSearch}
                    onChange={(e) => setBacklogSearch(e.target.value)}
                    placeholder="Search backlog tasks"
                    className="mb-2 w-full rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60"
                  />
                  <div className="max-h-72 overflow-auto rounded-lg border border-border">
                    {visibleBacklog.slice(0, 50).map((t) => (
                      <TaskRow key={t.id} task={t} action={<button onClick={() => moveTask(t.id, selected.id)} title="Pull into this sprint" className="rounded-md p-1 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-400/10 hover:text-emerald-600 dark:hover:text-emerald-300"><TbPlus size={15} /></button>} />
                    ))}
                    {!tasksLoading && !visibleBacklog.length && (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground">The backlog is empty.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select a sprint.</div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function TaskRow({ task, action }: { task: SprintTask; action: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b px-3 py-2.5 text-sm last:border-b-0">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-foreground/70">
        {task.assignee ? initials(task.assignee.fullName) : "?"}
      </span>
      <span className="flex-1 truncate text-foreground">{task.title}</span>
      <span className={cn("shrink-0 rounded border px-1 text-[9px] font-bold", PRIORITY_COLORS[task.priority])}>
        {task.priority.charAt(0)}
      </span>
      {task.dueDate && (
        <span className={cn("shrink-0 text-xs text-muted-foreground", isOverdue(task.dueDate, task.status) && "font-semibold text-red-500 dark:text-red-400")}>
          {ordinalDate(task.dueDate)}
        </span>
      )}
      <DueBadge dueDate={task.dueDate} status={task.status} />
      {action}
    </div>
  );
}
