"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import {
  TbLayoutSidebarFilled, TbLayoutSidebarRightFilled,
  TbPlus, TbSearch, TbTrash, TbList, TbLayoutKanban, TbLoader,
  TbAlertTriangle, TbClock, TbRepeat, TbX, TbLock, TbBookmark,
  TbUsers, TbCheckbox, TbCheck, TbChevronUp, TbChevronDown,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { useSideNav } from "@/context/SideNavContext";
import { apiFetch } from "@/lib/api";

type TaskScope = "My tasks" | "Team tasks" | "All tasks" | "My Focus";
type TaskStatus = "Pending" | "In progress" | "Done";
type TaskPriority = "Low" | "Medium" | "High";
type TaskRecurrence = "Daily" | "Weekly" | "Monthly";
type PanelMode = "view" | "create" | "edit";
type KanbanGrouping = "status" | "assignee";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  High: "bg-red-50 text-red-600 border-red-100",
  Medium: "bg-amber-50 text-amber-600 border-amber-100",
  Low: "bg-gray-50 text-gray-500 border-gray-100",
};

const TAG_COLORS = ["blue", "green", "red", "amber", "violet", "pink", "teal", "orange"] as const;
const TAG_COLOR_HEX: Record<string, string> = {
  blue: "#60a5fa", green: "#34d399", red: "#f87171", amber: "#fbbf24",
  violet: "#a78bfa", pink: "#f472b6", teal: "#2dd4bf", orange: "#fb923c",
};

const TAG_COLOR_STYLES: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  red: "bg-red-50 text-red-700 border-red-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  violet: "bg-violet-50 text-violet-700 border-violet-100",
  pink: "bg-pink-50 text-pink-700 border-pink-100",
  teal: "bg-teal-50 text-teal-700 border-teal-100",
  orange: "bg-orange-50 text-orange-700 border-orange-100",
};

interface Subtask { id: string; title: string; done: boolean; order: number; }
interface TaskTagItem { id: string; label: string; color: string; }
interface TaskComment { id: string; body: string; userId: string; createdAt: string; author: { id: string; fullName: string } | null; }

interface ApiTask {
  id: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  createdById: string;
  team: string | null;
  dueDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours: number | null;
  recurrence: TaskRecurrence | null;
  blockedById: string | null;
  assignee: { id: string; fullName: string; companyEmail: string } | null;
  creator: { id: string; fullName: string } | null;
  project: { id: string; name: string; status: string } | null;
  blocker: { id: string; title: string; status: TaskStatus } | null;
  subtasks: Subtask[];
  tags: TaskTagItem[];
}

interface ProjectOption { id: string; name: string; }
interface EmployeeOption { id: string; fullName: string; companyEmail: string; }

interface SavedFilter {
  id: string; name: string; project: string;
  status: TaskStatus | "all"; assignee: string; priority: TaskPriority | "all";
}

const SCOPE_PARAM: Record<TaskScope, string> = {
  "My tasks": "my", "My Focus": "focus", "Team tasks": "team", "All tasks": "all",
};

function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === "Done") return false;
  return new Date(dueDate + "T23:59:59") < new Date();
}

function isDueToday(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === "Done") return false;
  return dueDate === new Date().toISOString().split("T")[0];
}

function ordinalDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "long" });
  const year = d.getFullYear();
  const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
  return `${day}${suffix} ${month} ${year}`;
}

function emptyForm() {
  return {
    title: "", description: "", team: "", dueDate: "",
    status: "Pending" as TaskStatus, priority: "Medium" as TaskPriority,
    projectId: "", assigneeId: "", estimatedHours: "",
    recurrence: "" as TaskRecurrence | "", blockedById: "",
  };
}

function ls(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
}

export function TasksPage({ scope, currentUserId }: { scope: TaskScope; currentUserId?: string }) {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">(() => ls("work_statusFilter", "all") as TaskStatus | "all");
  const [projectFilter, setProjectFilter] = useState(() => ls("work_projectFilter", "all"));
  const [assigneeFilter, setAssigneeFilter] = useState(() => ls("work_assigneeFilter", "all"));
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(() => ls("work_priorityFilter", "all") as TaskPriority | "all");
  const [tagFilter, setTagFilter] = useState(() => ls("work_tagFilter", ""));
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [mode, setMode] = useState<PanelMode>("view");
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">(() => ls("work_viewMode", "list") as "list" | "kanban");
  const [kanbanGrouping, setKanbanGrouping] = useState<KanbanGrouping>("status");
  const [wipLimits, setWipLimits] = useState<Record<string, number>>(() => {
    try { return typeof window === "undefined" ? {} : JSON.parse(localStorage.getItem("work_wipLimits") || "{}"); } catch { return {}; }
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<TaskStatus | "">("");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [bulkPriority, setBulkPriority] = useState<TaskPriority | "">("");
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try { return typeof window === "undefined" ? [] : JSON.parse(localStorage.getItem("work_savedFilters") || "[]"); } catch { return []; }
  });
  const [saveFilterName, setSaveFilterName] = useState("");
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  // Detail panel
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newTagColor, setNewTagColor] = useState<typeof TAG_COLORS[number]>("blue");
  const [showTagInput, setShowTagInput] = useState(false);
  const [detailTab, setDetailTab] = useState<"details" | "subtasks" | "comments">("details");

  // Persist filters to localStorage
  useEffect(() => { localStorage.setItem("work_projectFilter", projectFilter); }, [projectFilter]);
  useEffect(() => { localStorage.setItem("work_statusFilter", statusFilter); }, [statusFilter]);
  useEffect(() => { localStorage.setItem("work_assigneeFilter", assigneeFilter); }, [assigneeFilter]);
  useEffect(() => { localStorage.setItem("work_priorityFilter", priorityFilter); }, [priorityFilter]);
  useEffect(() => { localStorage.setItem("work_tagFilter", tagFilter); }, [tagFilter]);
  useEffect(() => { localStorage.setItem("work_viewMode", viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem("work_wipLimits", JSON.stringify(wipLimits)); }, [wipLimits]);
  useEffect(() => { localStorage.setItem("work_savedFilters", JSON.stringify(savedFilters)); }, [savedFilters]);

  const fetchTasks = useCallback(async () => {
    try {
      const query = new URLSearchParams({ scope: SCOPE_PARAM[scope] });
      if (projectFilter !== "all") query.set("projectId", projectFilter);
      if (priorityFilter !== "all") query.set("priority", priorityFilter);
      if (tagFilter) query.set("tag", tagFilter);
      const data = await apiFetch<ApiTask[]>(`/tasks?${query.toString()}`);
      setTasks(data);
      setSelectedTask(current => {
        if (!data.length) return null;
        if (current) return data.find(t => t.id === current.id) ?? data[0];
        return data[0];
      });
    } catch { } finally { setLoading(false); }
  }, [projectFilter, priorityFilter, tagFilter, scope]);

  useEffect(() => { setLoading(true); fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    apiFetch<ProjectOption[]>("/work/projects").then(setProjects).catch(() => {});
    apiFetch<EmployeeOption[]>("/people").then(d => setEmployees(d.map(e => ({ id: e.id, fullName: e.fullName, companyEmail: e.companyEmail })))).catch(() => {});
  }, []);

  const loadTaskDetail = useCallback(async (taskId: string) => {
    try {
      const [subs, coms] = await Promise.all([
        apiFetch<Subtask[]>(`/tasks/${taskId}/subtasks`),
        apiFetch<TaskComment[]>(`/tasks/${taskId}/comments`),
      ]);
      setSubtasks(subs);
      setComments(coms);
    } catch {}
  }, []);

  useEffect(() => {
    if (selectedTask) loadTaskDetail(selectedTask.id);
  }, [selectedTask?.id, loadTaskDetail]);

  const visibleTasks = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter(task => {
      const statusOk = statusFilter === "all" || task.status === statusFilter;
      const assigneeOk = assigneeFilter === "all" || task.assigneeId === assigneeFilter;
      const searchOk = task.title.toLowerCase().includes(q) || (task.description ?? "").toLowerCase().includes(q) || (task.assignee?.fullName ?? "").toLowerCase().includes(q) || (task.project?.name ?? "").toLowerCase().includes(q);
      return statusOk && assigneeOk && searchOk;
    });
  }, [search, statusFilter, assigneeFilter, tasks]);

  const selectTask = (task: ApiTask) => { setSelectedTask(task); setMode("view"); setIsPreviewExpanded(true); setDetailTab("details"); };
  const startCreate = () => { setForm(emptyForm()); setMode("create"); setIsPreviewExpanded(true); };
  const startEdit = () => {
    if (!selectedTask) return;
    setForm({ title: selectedTask.title, description: selectedTask.description ?? "", team: selectedTask.team ?? "", dueDate: selectedTask.dueDate ?? "", status: selectedTask.status, priority: selectedTask.priority, projectId: selectedTask.project?.id ?? "", assigneeId: selectedTask.assigneeId ?? "", estimatedHours: selectedTask.estimatedHours?.toString() ?? "", recurrence: selectedTask.recurrence ?? "", blockedById: selectedTask.blockedById ?? "" });
    setMode("edit");
  };

  const saveTask = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const payload = { title: form.title, description: form.description, team: form.team, dueDate: form.dueDate || undefined, status: form.status, priority: form.priority, projectId: form.projectId || null, assigneeId: form.assigneeId || null, estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : null, recurrence: form.recurrence || null, blockedById: form.blockedById || null };
      if (mode === "create") await apiFetch("/tasks", { method: "POST", body: JSON.stringify(payload) });
      else if (mode === "edit" && selectedTask) await apiFetch(`/tasks/${selectedTask.id}`, { method: "PUT", body: JSON.stringify(payload) });
      await fetchTasks(); setMode("view");
    } catch { } finally { setSaving(false); }
  };

  const deleteTask = async (taskId: string) => {
    const task = tasks.find(x => x.id === taskId);
    if (!confirm(`Delete "${task?.title ?? "this task"}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks(t => t.filter(x => x.id !== taskId));
      if (selectedTask?.id === taskId) { setSelectedTask(null); setIsPreviewExpanded(false); }
    } catch {}
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setTasks(t => t.map(x => x.id === taskId ? { ...x, status: newStatus } : x));
    try { await apiFetch(`/tasks/${taskId}`, { method: "PUT", body: JSON.stringify({ status: newStatus }) }); fetchTasks(); }
    catch { fetchTasks(); }
  };

  const handleAssigneeChange = async (taskId: string, newAssigneeId: string) => {
    const emp = employees.find(e => e.id === newAssigneeId) ?? null;
    setTasks(t => t.map(x => x.id === taskId ? { ...x, assigneeId: newAssigneeId, assignee: emp ? { id: emp.id, fullName: emp.fullName, companyEmail: emp.companyEmail } : null } : x));
    try { await apiFetch(`/tasks/${taskId}`, { method: "PUT", body: JSON.stringify({ assigneeId: newAssigneeId || null }) }); }
    catch { fetchTasks(); }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => e.dataTransfer.setData("taskId", taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    const wipLimit = wipLimits[newStatus];
    const currentCount = tasks.filter(t => t.status === newStatus).length;
    if (wipLimit && currentCount >= wipLimit) { alert(`WIP limit (${wipLimit}) reached for "${newStatus}".`); return; }
    handleStatusChange(taskId, newStatus);
  };

  // Subtasks
  const addSubtask = async () => {
    if (!newSubtask.trim() || !selectedTask) return;
    setAddingSubtask(true);
    try {
      const sub = await apiFetch<Subtask>(`/tasks/${selectedTask.id}/subtasks`, { method: "POST", body: JSON.stringify({ title: newSubtask.trim() }) });
      setSubtasks(s => [...s, sub]); setNewSubtask("");
    } catch {} finally { setAddingSubtask(false); }
  };

  const toggleSubtask = async (sub: Subtask) => {
    if (!selectedTask) return;
    const updated = { ...sub, done: !sub.done };
    setSubtasks(s => s.map(x => x.id === sub.id ? updated : x));
    await apiFetch(`/tasks/${selectedTask.id}/subtasks/${sub.id}`, { method: "PUT", body: JSON.stringify({ done: updated.done }) }).catch(() => {});
  };

  const deleteSubtask = async (subId: string) => {
    if (!selectedTask) return;
    setSubtasks(s => s.filter(x => x.id !== subId));
    await apiFetch(`/tasks/${selectedTask.id}/subtasks/${subId}`, { method: "DELETE" }).catch(() => {});
  };

  const moveSubtask = async (index: number, dir: -1 | 1) => {
    if (!selectedTask) return;
    const list = [...subtasks]; const swap = index + dir;
    if (swap < 0 || swap >= list.length) return;
    [list[index], list[swap]] = [list[swap], list[index]];
    setSubtasks(list);
    await Promise.all([
      apiFetch(`/tasks/${selectedTask.id}/subtasks/${list[index].id}`, { method: "PUT", body: JSON.stringify({ order: index }) }),
      apiFetch(`/tasks/${selectedTask.id}/subtasks/${list[swap].id}`, { method: "PUT", body: JSON.stringify({ order: swap }) }),
    ]).catch(() => {});
  };

  // Comments
  const postComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    setPostingComment(true);
    try {
      const c = await apiFetch<TaskComment>(`/tasks/${selectedTask.id}/comments`, { method: "POST", body: JSON.stringify({ body: newComment.trim() }) });
      setComments(cs => [...cs, c]); setNewComment("");
    } catch {} finally { setPostingComment(false); }
  };

  const deleteComment = async (commentId: string) => {
    if (!selectedTask) return;
    setComments(cs => cs.filter(c => c.id !== commentId));
    await apiFetch(`/tasks/${selectedTask.id}/comments/${commentId}`, { method: "DELETE" }).catch(() => {});
  };

  // Tags
  const addTag = async () => {
    if (!newTag.trim() || !selectedTask) return;
    try {
      const tag = await apiFetch<TaskTagItem>(`/tasks/${selectedTask.id}/tags`, { method: "POST", body: JSON.stringify({ label: newTag.trim(), color: newTagColor }) });
      setTasks(t => t.map(x => x.id === selectedTask.id ? { ...x, tags: [...x.tags, tag] } : x));
      setSelectedTask(s => s ? { ...s, tags: [...s.tags, tag] } : s);
      setNewTag(""); setShowTagInput(false);
    } catch {}
  };

  const removeTag = async (tagId: string) => {
    if (!selectedTask) return;
    await apiFetch(`/tasks/${selectedTask.id}/tags/${tagId}`, { method: "DELETE" }).catch(() => {});
    setTasks(t => t.map(x => x.id === selectedTask.id ? { ...x, tags: x.tags.filter(tg => tg.id !== tagId) } : x));
    setSelectedTask(s => s ? { ...s, tags: s.tags.filter(tg => tg.id !== tagId) } : s);
  };

  // Bulk
  const toggleSelect = (id: string) => setSelectedIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelectedIds(visibleTasks.length > 0 && selectedIds.size === visibleTasks.length ? new Set() : new Set(visibleTasks.map(t => t.id)));

  const applyBulk = async (action: "status" | "assignee" | "priority" | "delete") => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (action === "delete" && !confirm(`Delete ${ids.length} tasks?`)) return;
    try {
      await Promise.all(ids.map(id => {
        if (action === "delete") return apiFetch(`/tasks/${id}`, { method: "DELETE" });
        const body = action === "status" ? { status: bulkStatus } : action === "assignee" ? { assigneeId: bulkAssignee || null } : { priority: bulkPriority };
        return apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) });
      }));
      setSelectedIds(new Set()); fetchTasks();
    } catch {}
  };

  // Saved filters
  const saveFilter = () => {
    if (!saveFilterName.trim()) return;
    setSavedFilters(f => [...f, { id: Date.now().toString(), name: saveFilterName.trim(), project: projectFilter, status: statusFilter, assignee: assigneeFilter, priority: priorityFilter }]);
    setSaveFilterName(""); setShowSaveFilter(false);
  };

  const applyFilter = (f: SavedFilter) => { setProjectFilter(f.project); setStatusFilter(f.status); setAssigneeFilter(f.assignee); setPriorityFilter(f.priority); };

  const allSubtasksDone = subtasks.length > 0 && subtasks.every(s => s.done);

  const allTags = useMemo(() => {
    const seen = new Set<string>(); const tags: string[] = [];
    tasks.forEach(t => t.tags?.forEach(tg => { if (!seen.has(tg.label)) { seen.add(tg.label); tags.push(tg.label); } }));
    return tags;
  }, [tasks]);

  const assigneeGroups = useMemo(() => {
    if (kanbanGrouping !== "assignee") return [];
    const map = new Map<string, { name: string; tasks: ApiTask[] }>();
    visibleTasks.forEach(t => {
      const key = t.assigneeId ?? "unassigned";
      if (!map.has(key)) map.set(key, { name: t.assignee?.fullName ?? "Unassigned", tasks: [] });
      map.get(key)!.tasks.push(t);
    });
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
  }, [visibleTasks, kanbanGrouping]);

  const canEditTask = (task: ApiTask) => !currentUserId || task.assigneeId === currentUserId || task.createdById === currentUserId;

  const dueBadge = (dueDate: string | null, status: TaskStatus) => {
    if (isOverdue(dueDate, status)) return <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5 whitespace-nowrap"><TbAlertTriangle size={11} /> Overdue</span>;
    if (isDueToday(dueDate, status)) return <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5 whitespace-nowrap"><TbClock size={11} /> Today</span>;
    return null;
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden bg-stone-50", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <SubNavToggle />
            <h1 className="text-lg font-semibold tracking-tight">{scope}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1 mr-1">
              <button onClick={() => setViewMode("list")} className={cn("px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors", viewMode === "list" ? "bg-white font-medium text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900")}>
                <TbList size={15} /> List
              </button>
              <button onClick={() => setViewMode("kanban")} className={cn("px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors", viewMode === "kanban" ? "bg-white font-medium text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900")}>
                <TbLayoutKanban size={15} /> Kanban
              </button>
            </div>
            <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-800 transition-colors">
              Add a task <TbPlus size={14} />
            </button>
            {(!isPreviewExpanded || (visibleTasks.length === 0 && mode !== "create")) && (
              <button onClick={() => setIsPreviewExpanded(true)} className="rounded-lg p-2 text-gray-600 hover:bg-stone-100 transition-colors">
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Saved filter chips */}
        {savedFilters.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-white overflow-x-auto shrink-0">
            <TbBookmark size={13} className="text-stone-400 shrink-0" />
            {savedFilters.map(f => (
              <div key={f.id} className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-full px-3 py-0.5 text-xs font-medium text-blue-700 shrink-0">
                <button onClick={() => applyFilter(f)}>{f.name}</button>
                <button onClick={() => setSavedFilters(fs => fs.filter(x => x.id !== f.id))} className="ml-1 text-blue-300 hover:text-red-500"><TbX size={10} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="relative">
              <TbSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-blue-500 w-48" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as TaskStatus | "all")} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500">
              <option value="all">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="In progress">In progress</option>
              <option value="Done">Done</option>
            </select>
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500">
              <option value="all">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500">
              <option value="all">All assignees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as TaskPriority | "all")} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500">
              <option value="all">All priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            {allTags.length > 0 && (
              <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500">
                <option value="">All tags</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            <button onClick={() => setShowSaveFilter(v => !v)} className="flex items-center gap-1 rounded-lg border border-dashed border-gray-200 px-3 py-1.5 text-xs text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors">
              <TbBookmark size={12} /> Save
            </button>
          </div>

          {showSaveFilter && (
            <div className="flex items-center gap-2 mb-3">
              <input value={saveFilterName} onChange={e => setSaveFilterName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveFilter()} placeholder="Filter name..." className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500 w-44" autoFocus />
              <button onClick={saveFilter} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700">Save</button>
              <button onClick={() => setShowSaveFilter(false)} className="text-gray-400 hover:text-gray-600"><TbX size={15} /></button>
            </div>
          )}

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <span className="text-sm font-semibold text-blue-700 mr-1">{selectedIds.size} selected</span>
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as TaskStatus)} className="text-xs border border-blue-200 rounded-lg px-2 py-1.5 bg-white">
                <option value="">Set status...</option>
                <option value="Pending">Pending</option>
                <option value="In progress">In progress</option>
                <option value="Done">Done</option>
              </select>
              {bulkStatus && <button onClick={() => applyBulk("status")} className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-100 px-2 py-1 rounded-lg">Apply</button>}
              <select value={bulkPriority} onChange={e => setBulkPriority(e.target.value as TaskPriority)} className="text-xs border border-blue-200 rounded-lg px-2 py-1.5 bg-white">
                <option value="">Set priority...</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              {bulkPriority && <button onClick={() => applyBulk("priority")} className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-100 px-2 py-1 rounded-lg">Apply</button>}
              <select value={bulkAssignee} onChange={e => setBulkAssignee(e.target.value)} className="text-xs border border-blue-200 rounded-lg px-2 py-1.5 bg-white">
                <option value="">Reassign...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              </select>
              {bulkAssignee && <button onClick={() => applyBulk("assignee")} className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-100 px-2 py-1 rounded-lg">Apply</button>}
              <button onClick={() => applyBulk("delete")} className="ml-auto text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 border border-red-100 px-2 py-1 rounded-lg"><TbTrash size={12} /> Delete</button>
              <button onClick={() => setSelectedIds(new Set())} className="text-gray-400 hover:text-gray-600"><TbX size={15} /></button>
            </div>
          )}

          {loading ? (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">Loading tasks...</div>
          ) : visibleTasks.length === 0 ? (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">No tasks found.</div>
          ) : viewMode === "list" ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
                  <tr>
                    <th className="px-4 py-3 w-8"><input type="checkbox" checked={visibleTasks.length > 0 && selectedIds.size === visibleTasks.length} onChange={selectAll} className="rounded border-gray-300" /></th>
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Assignee</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleTasks.map(task => {
                    const over = isOverdue(task.dueDate, task.status);
                    const today = isDueToday(task.dueDate, task.status);
                    return (
                      <tr key={task.id} onClick={() => selectTask(task)} className={cn("cursor-pointer transition-colors hover:bg-gray-50 group", selectedTask?.id === task.id && "bg-blue-50/50", over && "bg-red-50/30 hover:bg-red-50/50", today && !over && "bg-amber-50/30 hover:bg-amber-50/50")}>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.has(task.id)} onChange={() => toggleSelect(task.id)} className="rounded border-gray-300" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-gray-900">{task.title}</span>
                              {task.recurrence && <TbRepeat size={12} className="text-violet-500 shrink-0" title={`Repeats ${task.recurrence}`} />}
                              {task.blockedById && task.blocker?.status !== "Done" && <TbLock size={12} className="text-red-400 shrink-0" title={`Blocked by: ${task.blocker?.title}`} />}
                              {task.estimatedHours && <span className="text-[10px] text-gray-400">{task.estimatedHours}h</span>}
                            </div>
                            {task.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {task.tags.map(tg => <span key={tg.id} className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border", TAG_COLOR_STYLES[tg.color] || TAG_COLOR_STYLES.blue)}>{tg.label}</span>)}
                              </div>
                            )}
                            {task.subtasks?.length > 0 && (
                              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                <TbCheckbox size={11} /> {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{task.project?.name || "—"}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <select value={task.assigneeId ?? ""} onChange={e => handleAssigneeChange(task.id, e.target.value)} disabled={!canEditTask(task)} className="rounded-md border border-transparent bg-transparent py-1 px-2 text-sm text-gray-700 outline-none hover:border-gray-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer disabled:opacity-40">
                            <option value="">Unassigned</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", PRIORITY_COLORS[task.priority])}>{task.priority}</span>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <select value={task.status} onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)} disabled={!canEditTask(task)} className={cn("appearance-none rounded-full border py-1 px-3 text-xs font-semibold outline-none hover:opacity-80 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer disabled:opacity-40", task.status === "Done" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : task.status === "In progress" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-gray-50 text-gray-600 border-gray-100")}>
                            <option>Pending</option>
                            <option>In progress</option>
                            <option>Done</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-gray-500 text-xs">{task.dueDate ? ordinalDate(task.dueDate) : "—"}</span>
                            {dueBadge(task.dueDate, task.status)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canEditTask(task) && (
                            <button onClick={e => { e.stopPropagation(); deleteTask(task.id); }} className="rounded-md p-1.5 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100">
                              <TbTrash size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : kanbanGrouping === "status" ? (
            <div className="flex gap-4 overflow-x-auto pb-4 items-start">
              {(["Pending", "In progress", "Done"] as TaskStatus[]).map(status => {
                const colTasks = visibleTasks.filter(t => t.status === status);
                const wipLimit = wipLimits[status];
                const wipExceeded = wipLimit !== undefined && colTasks.length > wipLimit;
                return (
                  <div key={status} className="flex w-72 shrink-0 flex-col gap-3 rounded-2xl bg-gray-100/60 p-3" onDragOver={handleDragOver} onDrop={e => handleDrop(e, status)}>
                    <div className="flex items-center justify-between px-1">
                      <h3 className={cn("text-[12px] font-bold tracking-widest uppercase", wipExceeded ? "text-red-600" : "text-gray-500")}>{status}</h3>
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", wipExceeded ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-600")}>
                          {colTasks.length}{wipLimit !== undefined ? `/${wipLimit}` : ""}
                        </span>
                        <button onClick={() => { const v = prompt(`WIP limit for "${status}" (blank to remove):`, wipLimit?.toString() ?? ""); if (v === null) return; setWipLimits(w => { const n = { ...w }; v.trim() ? (n[status] = parseInt(v)) : delete n[status]; return n; }); }} className="text-[9px] text-gray-300 hover:text-gray-500 uppercase tracking-wide">WIP</button>
                      </div>
                    </div>
                    <KanbanCards tasks={colTasks} selectedTask={selectedTask} onSelect={selectTask} onDelete={deleteTask} canEdit={canEditTask} dueBadge={dueBadge} />
                  </div>
                );
              })}
              <button onClick={() => setKanbanGrouping("assignee")} className="shrink-0 flex flex-col items-center justify-center gap-2 text-xs text-gray-400 hover:text-blue-600 border border-dashed border-gray-200 rounded-2xl px-4 py-8 transition-colors w-24">
                <TbUsers size={16} />
                <span className="text-center leading-tight">By assignee</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Swimlanes — Grouped by Assignee</p>
                <button onClick={() => setKanbanGrouping("status")} className="text-xs text-blue-600 hover:text-blue-800">← Back to columns</button>
              </div>
              {assigneeGroups.map(group => (
                <div key={group.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">{group.name.charAt(0)}</span>
                    <span className="text-sm font-semibold text-gray-700">{group.name}</span>
                    <span className="text-xs text-gray-400">{group.tasks.length} tasks</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {(["Pending", "In progress", "Done"] as TaskStatus[]).map(status => {
                      const colTasks = group.tasks.filter(t => t.status === status);
                      return (
                        <div key={status} className="flex w-56 shrink-0 flex-col gap-2 rounded-xl bg-gray-100/50 p-2.5" onDragOver={handleDragOver} onDrop={e => handleDrop(e, status)}>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">{status} · {colTasks.length}</p>
                          <KanbanCards tasks={colTasks} selectedTask={selectedTask} onSelect={selectTask} onDelete={deleteTask} canEdit={canEditTask} dueBadge={dueBadge} compact />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail aside */}
      <aside className={cn("flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out", isPreviewExpanded && (visibleTasks.length > 0 || mode === "create") ? "w-[42%] ml-2" : "w-0")}>
        {isPreviewExpanded && (visibleTasks.length > 0 || mode === "create") && (
          <div className="flex h-full flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 shrink-0">
              <p className="-mb-px flex self-stretch items-center border-b-2 border-blue-600 text-sm font-semibold text-black">
                {mode === "create" ? "Add Task" : mode === "edit" ? "Edit Task" : "Task Details"}
              </p>
              <div className="flex items-center gap-2">
                {mode === "view" && selectedTask && canEditTask(selectedTask) && (
                  <button onClick={startEdit} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Edit</button>
                )}
                <button onClick={() => setIsPreviewExpanded(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
                  <TbLayoutSidebarRightFilled size={18} />
                </button>
              </div>
            </div>

            {mode === "view" ? (
              <div className="flex h-full flex-col overflow-hidden">
                {selectedTask ? (
                  <>
                    {/* Detail tabs */}
                    <div className="flex border-b border-gray-100 shrink-0">
                      {[
                        { id: "details", label: "Details" },
                        { id: "subtasks", label: subtasks.length > 0 ? `Subtasks (${subtasks.filter(s => s.done).length}/${subtasks.length})` : "Subtasks" },
                        { id: "comments", label: comments.length > 0 ? `Comments (${comments.length})` : "Comments" },
                      ].map(tab => (
                        <button key={tab.id} onClick={() => setDetailTab(tab.id as any)} className={cn("px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap", detailTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600")}>
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {detailTab === "details" && (
                      <div className="flex-1 overflow-auto p-5 space-y-4">
                        <div>
                          <div className="flex items-start gap-2">
                            <h2 className="flex-1 text-lg font-bold text-gray-900 leading-tight">{selectedTask.title}</h2>
                            <span className={cn("shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5", PRIORITY_COLORS[selectedTask.priority])}>{selectedTask.priority}</span>
                          </div>
                          {selectedTask.recurrence && (
                            <p className="mt-1.5 text-xs text-violet-600 font-medium flex items-center gap-1"><TbRepeat size={12} /> Repeats {selectedTask.recurrence}</p>
                          )}
                          {selectedTask.blocker && selectedTask.blocker.status !== "Done" && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                              <TbLock size={12} /> Blocked by: <span className="font-semibold">{selectedTask.blocker.title}</span>
                            </div>
                          )}
                          <p className="mt-3 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{selectedTask.description || "No description."}</p>
                        </div>

                        {/* Tags */}
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tags</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedTask.tags?.map(tg => (
                              <span key={tg.id} className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border", TAG_COLOR_STYLES[tg.color] || TAG_COLOR_STYLES.blue)}>
                                {tg.label}
                                {canEditTask(selectedTask) && <button onClick={() => removeTag(tg.id)} className="hover:text-red-500"><TbX size={10} /></button>}
                              </span>
                            ))}
                            {canEditTask(selectedTask) && !showTagInput && (
                              <button onClick={() => setShowTagInput(true)} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-gray-400 border border-dashed border-gray-200 hover:border-blue-300 hover:text-blue-500 transition-colors">
                                <TbPlus size={10} /> Add
                              </button>
                            )}
                          </div>
                          {showTagInput && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} placeholder="Label..." className="border rounded-lg px-2 py-1 text-xs w-28 focus:outline-none focus:border-blue-500" autoFocus />
                              <div className="flex gap-1 flex-wrap">
                                {TAG_COLORS.map(c => (
                                  <button key={c} onClick={() => setNewTagColor(c)} className={cn("w-5 h-5 rounded-full border-2 transition-all", newTagColor === c ? "border-gray-800 scale-110" : "border-transparent")} style={{ backgroundColor: TAG_COLOR_HEX[c] }} title={c} />
                                ))}
                              </div>
                              <button onClick={addTag} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Add</button>
                              <button onClick={() => setShowTagInput(false)} className="text-gray-400"><TbX size={12} /></button>
                            </div>
                          )}
                        </div>

                        <div className="h-px bg-gray-100" />
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                          <Detail label="Assignee" value={selectedTask.assignee?.fullName ?? "Unassigned"} />
                          <Detail label="Team" value={selectedTask.team ?? "—"} />
                          <Detail label="Project" value={selectedTask.project?.name ?? "—"} />
                          <Detail label="Due date" value={selectedTask.dueDate ? ordinalDate(selectedTask.dueDate) : "—"} extra={dueBadge(selectedTask.dueDate, selectedTask.status)} />
                          <Detail label="Status" value={selectedTask.status} />
                          <Detail label="Priority" value={selectedTask.priority} />
                          {selectedTask.estimatedHours != null && <Detail label="Estimate" value={`${selectedTask.estimatedHours}h`} />}
                        </div>
                      </div>
                    )}

                    {detailTab === "subtasks" && (
                      <div className="flex-1 overflow-auto p-5 space-y-3">
                        {subtasks.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>{subtasks.filter(s => s.done).length}/{subtasks.length} done</span>
                              <span>{Math.round((subtasks.filter(s => s.done).length / subtasks.length) * 100)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(subtasks.filter(s => s.done).length / subtasks.length) * 100}%` }} />
                            </div>
                          </div>
                        )}

                        {allSubtasksDone && selectedTask.status !== "Done" && (
                          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                            <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5"><TbCheck size={13} /> All done!</p>
                            <button onClick={() => handleStatusChange(selectedTask.id, "Done")} className="text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg">Mark task Done</button>
                          </div>
                        )}

                        <div className="space-y-0.5">
                          {subtasks.map((sub, i) => (
                            <div key={sub.id} className="flex items-center gap-2 group py-1.5 px-2 rounded-lg hover:bg-gray-50">
                              <input type="checkbox" checked={sub.done} onChange={() => toggleSubtask(sub)} className="rounded border-gray-300 text-emerald-600 shrink-0" />
                              <span className={cn("flex-1 text-sm", sub.done && "line-through text-gray-400")}>{sub.title}</span>
                              {canEditTask(selectedTask) && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => moveSubtask(i, -1)} disabled={i === 0} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"><TbChevronUp size={12} /></button>
                                  <button onClick={() => moveSubtask(i, 1)} disabled={i === subtasks.length - 1} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"><TbChevronDown size={12} /></button>
                                  <button onClick={() => deleteSubtask(sub.id)} className="p-0.5 text-gray-400 hover:text-red-500"><TbX size={12} /></button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {canEditTask(selectedTask) && (
                          <div className="flex items-center gap-2">
                            <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => e.key === "Enter" && addSubtask()} placeholder="Add subtask..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            <button onClick={addSubtask} disabled={addingSubtask || !newSubtask.trim()} className="bg-stone-900 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-stone-800 disabled:opacity-50">
                              {addingSubtask ? <TbLoader className="animate-spin" size={13} /> : <TbPlus size={13} />}
                            </button>
                          </div>
                        )}
                        {subtasks.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No subtasks yet.</p>}
                      </div>
                    )}

                    {detailTab === "comments" && (
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-auto p-5 space-y-3">
                          {comments.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No comments yet.</p>}
                          {comments.map(c => (
                            <div key={c.id} className="group flex gap-2.5">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">{c.author?.fullName?.charAt(0) ?? "?"}</span>
                              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-gray-700">{c.author?.fullName ?? "Unknown"}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                    {c.userId === currentUserId && <button onClick={() => deleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><TbX size={11} /></button>}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{c.body}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="border-t p-4 flex gap-2 shrink-0">
                          <textarea value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); } }} placeholder="Add a comment... (Enter to send)" rows={2} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500" />
                          <button onClick={postComment} disabled={postingComment || !newComment.trim()} className="self-end bg-stone-900 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-stone-800 disabled:opacity-50">
                            {postingComment ? <TbLoader className="animate-spin" size={13} /> : "Send"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">Select a task to view details.</div>
                )}
              </div>
            ) : (
              <form onSubmit={saveTask} className="flex h-full flex-col">
                <div className="flex-1 space-y-4 overflow-auto p-5 bg-stone-50">
                  <FormInput label="Task Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} required />
                  <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
                    Description
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="min-h-20 rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none" placeholder="Details..." />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
                      Priority
                      <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        <option>Low</option><option>Medium</option><option>High</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
                      Status
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        <option>Pending</option><option>In progress</option><option>Done</option>
                      </select>
                    </label>
                    <FormInput label="Team" value={form.team} onChange={v => setForm(f => ({ ...f, team: v }))} />
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
                      Due date
                      <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
                      Project
                      <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        <option value="">Internal</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
                      Assignee
                      <select value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        <option value="">Unassigned</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
                      Estimate (h)
                      <input type="number" step="0.5" min="0" value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))} placeholder="e.g. 2.5" className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
                      Recurrence
                      <select value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value as TaskRecurrence | "" }))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        <option value="">None</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700 col-span-2">
                      Blocked by
                      <select value={form.blockedById} onChange={e => setForm(f => ({ ...f, blockedById: e.target.value }))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        <option value="">Not blocked</option>
                        {tasks.filter(t => t.id !== selectedTask?.id).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 border-t bg-stone-50 p-4 shrink-0">
                  <button type="button" onClick={() => setMode("view")} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60 transition-colors">
                    {saving ? "Saving..." : "Save Task"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function KanbanCards({ tasks, selectedTask, onSelect, onDelete, canEdit, dueBadge, compact = false }: {
  tasks: ApiTask[]; selectedTask: ApiTask | null;
  onSelect: (t: ApiTask) => void; onDelete: (id: string) => void;
  canEdit: (t: ApiTask) => boolean;
  dueBadge: (d: string | null, s: TaskStatus) => React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 min-h-[50px]">
      {tasks.map(task => {
        const over = isOverdue(task.dueDate, task.status);
        const today = isDueToday(task.dueDate, task.status);
        return (
          <div key={task.id} draggable onDragStart={e => e.dataTransfer.setData("taskId", task.id)} onClick={() => onSelect(task)}
            className={cn("group cursor-grab active:cursor-grabbing rounded-xl border bg-white p-3 shadow-sm transition-all hover:shadow-md", selectedTask?.id === task.id && "ring-2 ring-blue-500 border-transparent", over && "border-red-200 bg-red-50/40", today && !over && "border-amber-200 bg-amber-50/40")}>
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {task.recurrence && <TbRepeat size={10} className="text-violet-500 shrink-0" />}
                {task.blockedById && task.blocker?.status !== "Done" && <TbLock size={10} className="text-red-400 shrink-0" />}
                <h4 className={cn("font-semibold text-gray-900 leading-snug break-words", compact ? "text-xs" : "text-sm")}>{task.title}</h4>
              </div>
              {canEdit(task) && (
                <button onClick={e => { e.stopPropagation(); onDelete(task.id); }} className="rounded p-0.5 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 shrink-0">
                  <TbTrash size={12} />
                </button>
              )}
            </div>
            {!compact && (
              <>
                {task.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {task.tags.slice(0, 3).map(tg => <span key={tg.id} className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border", TAG_COLOR_STYLES[tg.color] || TAG_COLOR_STYLES.blue)}>{tg.label}</span>)}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border", PRIORITY_COLORS[task.priority])}>{task.priority[0]}</span>
                    {task.subtasks?.length > 0 && (
                      <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
                        <TbCheckbox size={10} /> {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
                      </span>
                    )}
                    {task.estimatedHours && <span className="text-[9px] text-gray-400">{task.estimatedHours}h</span>}
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50 pl-1 pr-1.5 py-0.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700">{task.assignee ? task.assignee.fullName.charAt(0) : "?"}</span>
                    <span className="text-[9px] font-medium text-gray-600 max-w-[50px] truncate">{task.assignee ? task.assignee.fullName.split(" ")[0] : "None"}</span>
                  </div>
                </div>
                {(over || today) && <div className="mt-1.5">{dueBadge(task.dueDate, task.status)}</div>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Detail({ label, value, extra }: { label: string; value: string; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{label}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <p className="text-sm font-medium text-gray-900">{value}</p>
        {extra}
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
      {label}
      <input value={value} onChange={e => onChange(e.target.value)} required={required} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
    </label>
  );
}
