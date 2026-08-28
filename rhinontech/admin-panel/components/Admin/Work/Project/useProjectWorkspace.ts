"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type {
  FieldDefinition, PersonOption, ProjectSummary, ProjectTask, TaskRow, WorkflowStatus,
} from "./types";
import { EMPTY_FILTERS, type GroupKey, type SortKey, type WorkspaceFilters } from "./WorkspaceToolbar";

/**
 * Everything the six project tabs share: the task tree, the workflow columns,
 * the custom field definitions and the roster.
 *
 * Kept in one hook so switching tabs never refetches, and so an edit made in the
 * Table is immediately reflected in Board, Calendar and Gantt.
 */
export function useProjectWorkspace(projectId: string) {
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [roster, setRoster] = useState<PersonOption[]>([]);
  /** False when /people 403s — people:read is granted to no default role. */
  const [rosterAvailable, setRosterAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<WorkspaceFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("position");
  const [group, setGroup] = useState<GroupKey>("none");

  const loadTasks = useCallback(async () => {
    try {
      // scope=all: inside a project the whole team's work is the point, not just mine.
      setTasks(await apiFetch<ProjectTask[]>(`/tasks?scope=all&projectId=${projectId}`));
    } catch {
      setTasks([]);
    }
  }, [projectId]);

  const loadMeta = useCallback(async () => {
    const [s, f] = await Promise.all([
      apiFetch<WorkflowStatus[]>(`/workflow/statuses?projectId=${projectId}`).catch(() => []),
      apiFetch<FieldDefinition[]>(`/workflow/fields?projectId=${projectId}`).catch(() => []),
    ]);
    setStatuses(s);
    setFields(f);
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch<ProjectSummary[]>("/work/projects")
        .then((all) => setProject(all.find((p) => p.id === projectId) ?? null))
        .catch(() => setProject(null)),
      loadTasks(),
      loadMeta(),
      apiFetch<any[]>("/people")
        .then((d) => {
          setRoster(d.map((p) => ({ id: p.id, fullName: p.fullName })));
          setRosterAvailable(true);
        })
        // people:read is in DEFAULT_ROLE_GRANTS for no role, so this 403s for
        // everyone but superadmin. Not fatal — `people` below falls back to
        // whoever already appears on the project's tasks.
        .catch(() => { setRoster([]); setRosterAvailable(false); }),
    ]).finally(() => setLoading(false));
  }, [projectId, loadTasks, loadMeta]);

  /**
   * The assignee picker's options.
   *
   * A <select> whose value has no matching <option> renders BLANK, so relying on
   * /people alone made every assigned person disappear for non-superadmins.
   * Anyone already on a task is merged in, which both keeps names visible and
   * leaves reassignment possible without people:read.
   */
  const people = useMemo<PersonOption[]>(() => {
    const byId = new Map<string, PersonOption>();
    for (const p of roster) byId.set(p.id, p);
    for (const t of tasks) {
      if (t.assignee && !byId.has(t.assignee.id)) {
        byId.set(t.assignee.id, { id: t.assignee.id, fullName: t.assignee.fullName });
      }
    }
    return [...byId.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [roster, tasks]);

  /**
   * Flattens the parent/child tree into render order, honouring collapsed
   * parents. Orphans (a child whose parent isn't in this project) are surfaced
   * at the root rather than silently dropped.
   */
  const PRIORITY_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

  const isOverdue = (t: ProjectTask) => {
    if (!t.dueDate || t.status === "Done") return false;
    return new Date(t.dueDate) < new Date(new Date().toDateString());
  };

  /**
   * Filtering happens BEFORE the tree is built, and a surviving child keeps its
   * ancestors so it still appears in context rather than being orphaned to the
   * root — the behaviour a hierarchical filter is expected to have.
   */
  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const matches = (t: ProjectTask) => {
      if (q && !t.title.toLowerCase().includes(q) && !(t.description ?? "").toLowerCase().includes(q)) return false;
      if (filters.assigneeId === "none" ? t.assigneeId : filters.assigneeId !== "all" && t.assigneeId !== filters.assigneeId) return false;
      if (filters.statusId !== "all" && t.statusId !== filters.statusId) return false;
      if (filters.priority !== "all" && t.priority !== filters.priority) return false;
      if (filters.overdueOnly && !isOverdue(t)) return false;
      return true;
    };

    const anyFilter =
      Boolean(q) || filters.assigneeId !== "all" || filters.statusId !== "all" ||
      filters.priority !== "all" || filters.overdueOnly;
    if (!anyFilter) return tasks;

    const byId = new Map(tasks.map((t) => [t.id, t]));
    const keep = new Set<string>();
    for (const t of tasks) {
      if (!matches(t)) continue;
      keep.add(t.id);
      let p = t.parentTaskId ? byId.get(t.parentTaskId) : undefined;
      let guard = 0;
      while (p && guard++ < 50) {
        keep.add(p.id);
        p = p.parentTaskId ? byId.get(p.parentTaskId) : undefined;
      }
    }
    return tasks.filter((t) => keep.has(t.id));
  }, [tasks, filters]);

  const rows = useMemo<TaskRow[]>(() => {
    const byParent = new Map<string | null, ProjectTask[]>();
    const ids = new Set(filtered.map((t) => t.id));
    for (const t of filtered) {
      const key = t.parentTaskId && ids.has(t.parentTaskId) ? t.parentTaskId : null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(t);
    }
    const cmp = (a: ProjectTask, b: ProjectTask) => {
      // Null dates sort last regardless of direction — an undated task is not
      // "earliest", it is simply unscheduled.
      const byDate = (x: string | null, y: string | null) =>
        !x && !y ? 0 : !x ? 1 : !y ? -1 : x.localeCompare(y);
      switch (sort) {
        case "dueDate": return byDate(a.dueDate, b.dueDate) || a.title.localeCompare(b.title);
        case "startDate": return byDate(a.startDate, b.startDate) || a.title.localeCompare(b.title);
        case "title": return a.title.localeCompare(b.title);
        case "priority": return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) || a.title.localeCompare(b.title);
        case "status": return (a.workflowStatus?.order ?? 99) - (b.workflowStatus?.order ?? 99) || a.title.localeCompare(b.title);
        default: return a.position - b.position || a.title.localeCompare(b.title);
      }
    };
    for (const list of byParent.values()) list.sort(cmp);

    const out: TaskRow[] = [];
    const walk = (parentId: string | null, depth: number) => {
      for (const task of byParent.get(parentId) ?? []) {
        const children = byParent.get(task.id) ?? [];
        out.push({ task, depth, hasChildren: children.length > 0 });
        if (children.length && !collapsed.has(task.id)) walk(task.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [filtered, collapsed, sort]);

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsed((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  /** Optimistic patch — the table stays responsive, and rolls back on failure. */
  const patchTask = useCallback(async (id: string, patch: Partial<ProjectTask> & Record<string, unknown>) => {
    const before = tasks;
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } as ProjectTask : t)));
    try {
      const updated = await apiFetch<ProjectTask>(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      setTasks((cur) => cur.map((t) => (t.id === id ? updated : t)));
    } catch (err: any) {
      setTasks(before);
      toast.error(err.message || "Could not save that change");
    }
  }, [tasks]);

  const createTask = useCallback(async (
    title: string,
    parentTaskId?: string | null,
    statusId?: string | null,
  ) => {
    if (!title.trim()) return;
    try {
      await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          projectId,
          parentTaskId: parentTaskId ?? null,
          // Omitted entirely when absent so the server picks the project's
          // default column rather than being told "no status".
          ...(statusId ? { statusId } : {}),
        }),
      });
      await loadTasks();
    } catch (err: any) {
      toast.error(err.message || "Could not create the task");
    }
  }, [projectId, loadTasks]);

  /** Calendar convenience: a task created on a day is due that day. */
  const createOnDate = useCallback(async (title: string, date: Date) => {
    if (!title.trim()) return;
    try {
      await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          projectId,
          dueDate: date.toISOString().slice(0, 10),
        }),
      });
      await loadTasks();
    } catch (err: any) {
      toast.error(err.message || "Could not create the task");
    }
  }, [projectId, loadTasks]);

  /** Board convenience: a card added to a column starts in that column. */
  const createInStatus = useCallback(
    (title: string, statusId: string) => createTask(title, null, statusId),
    [createTask]
  );

  const deleteTask = useCallback(async (id: string) => {
    try {
      await apiFetch(`/tasks/${id}`, { method: "DELETE" });
      await loadTasks();
    } catch (err: any) {
      toast.error(err.message || "Could not delete the task");
    }
  }, [loadTasks]);

  const addDependency = useCallback(async (successorId: string, predecessorId: string) => {
    try {
      await apiFetch(`/tasks/${successorId}/dependencies`, {
        method: "POST",
        body: JSON.stringify({ predecessorId }),
      });
      await loadTasks();
    } catch (err: any) {
      // The server refuses cycles; surface that rather than failing silently.
      toast.error(err.message || "Could not link those tasks");
    }
  }, [loadTasks]);

  const removeDependency = useCallback(async (taskId: string, depId: string) => {
    try {
      await apiFetch(`/tasks/${taskId}/dependencies/${depId}`, { method: "DELETE" });
      await loadTasks();
    } catch (err: any) {
      toast.error(err.message || "Could not remove that link");
    }
  }, [loadTasks]);

  const addField = useCallback(async (name: string, type: string, options?: string[]) => {
    try {
      await apiFetch("/workflow/fields", {
        method: "POST",
        body: JSON.stringify({ name, type, options, projectId }),
      });
      await loadMeta();
      toast.success(`Added "${name}"`);
    } catch (err: any) {
      toast.error(err.message || "Could not add the column");
    }
  }, [projectId, loadMeta]);

  const removeField = useCallback(async (id: string) => {
    try {
      await apiFetch(`/workflow/fields/${id}`, { method: "DELETE" });
      await loadMeta();
    } catch (err: any) {
      toast.error(err.message || "Could not remove the column");
    }
  }, [loadMeta]);

  return {
    project, tasks, rows, statuses, fields, people, rosterAvailable, loading, collapsed,
    filters, setFilters, sort, setSort, group, setGroup,
    /** Unfiltered total, so the toolbar can say "12 of 40". */
    totalCount: tasks.length,
    toggleCollapsed, patchTask, createTask, createInStatus, createOnDate, deleteTask,
    addDependency, removeDependency, addField, removeField,
    refetch: loadTasks,
  };
}
