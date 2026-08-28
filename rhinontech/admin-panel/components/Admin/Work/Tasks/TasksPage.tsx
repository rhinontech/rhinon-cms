"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor,
  closestCorners, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { TbLayoutSidebarRightFilled, TbLoader, TbX } from "react-icons/tb";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSideNav } from "@/context/SideNavContext";
import { usePermissions } from "@/context/PermissionsContext";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { NO_PROJECT_KEY, UNASSIGNED_KEY, emptyForm } from "./constants";
import { TaskBulkBar } from "./TaskBulkBar";
import { TaskCardOverlay } from "./TaskCard";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { TaskFormPanel } from "./TaskFormPanel";
import { TaskSection } from "./TaskSection";
import { TasksToolbar } from "./TasksToolbar";
import { useTaskPrefs } from "./useTaskPrefs";
import { useTaskSections } from "./useTaskSections";
import { useTasksData } from "./useTasksData";
import type {
  ApiTask, DropData, PanelMode, TaskComment, TaskFormState, TaskPatch,
  TaskScope, TaskSection as Section, TaskStatus,
} from "./types";

export function TasksPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const { userId, fullName, department, has, ready } = usePermissions();
  const searchParams = useSearchParams();

  const urlScope = searchParams.get("scope");
  const initialScope: TaskScope | undefined =
    urlScope === "my" || urlScope === "team" || urlScope === "all" ? urlScope : undefined;

  const prefs = useTaskPrefs(initialScope);
  const {
    tasks, projects, teams, people, rosterAvailable, loading,
    refetch, refetchQuiet, patchTask, removeTask,
  } = useTasksData({
    scope: prefs.scope,
    projectId: prefs.filters.project,
    teamId: prefs.filters.team,
    priority: prefs.filters.priority,
    tag: prefs.filters.tag,
  });

  const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);
  const [mode, setMode] = useState<PanelMode>("view");
  const [asideOpen, setAsideOpen] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [form, setForm] = useState<TaskFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTask, setActiveTask] = useState<ApiTask | null>(null);

  // Mirrors the backend: assignee OR creator OR work:write. The work:write term
  // is what keeps managers able to edit other people's tasks.
  const canEditTask = useCallback(
    (t: ApiTask) => has("work:write") || (!!userId && (t.assigneeId === userId || t.createdById === userId)),
    [has, userId]
  );
  const canDeleteComment = useCallback(
    (c: TaskComment) => has("work:write") || (!!userId && c.userId === userId),
    [has, userId]
  );

  // Only these two permissions stop the backend narrowing scope=team to the
  // caller's own department, so the roster has to be narrowed to match.
  const seesAllDepartments = has("work:write", "employees:read");

  const visibleTasks = useMemo(() => {
    const q = prefs.search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (prefs.view === "list" && prefs.filters.status !== "all" && t.status !== prefs.filters.status) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.assignee?.fullName ?? "").toLowerCase().includes(q) ||
        (t.project?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [tasks, prefs.search, prefs.filters.status, prefs.view]);

  const sections = useTaskSections({
    tasks: visibleTasks,
    people, projects, rosterAvailable,
    group: prefs.group,
    scope: prefs.scope,
    me: { userId, fullName, department },
    seesAllDepartments,
  });

  const allTags = useMemo(
    () => Array.from(new Set(tasks.flatMap((t) => t.tags?.map((tg) => tg.label) ?? []))).sort(),
    [tasks]
  );

  // Overrides, not truth — nothing to seed once the async fetch lands, and a
  // refetch can never fight a choice the user already made.
  const isOpen = (s: Section) => prefs.overrides[s.key] ?? (s.isMe || s.tasks.length > 0);

  // Keep the selected task's object identity fresh across refetches.
  useEffect(() => {
    if (!selectedTask) return;
    const fresh = tasks.find((t) => t.id === selectedTask.id);
    if (fresh && fresh !== selectedTask) setSelectedTask(fresh);
    if (!fresh && mode === "view") { setSelectedTask(null); setAsideOpen(false); }
  }, [tasks, selectedTask, mode]);

  const openTask = (t: ApiTask) => {
    setSelectedTask(t);
    setMode("view");
    setAsideOpen(true);
    setMobileDetail(true);
  };

  const startCreate = (section?: Section) => {
    const base = emptyForm();
    // "+" on a section header pre-fills that section's dimension.
    if (section) {
      if (section.kind === "person") base.assigneeId = section.key;
      if (section.kind === "project") base.projectId = section.key;
    }
    setForm(base);
    setSelectedTask(null);
    setMode("create");
    setAsideOpen(true);
    setMobileDetail(true);
  };

  const startEdit = () => {
    if (!selectedTask) return;
    setForm({
      title: selectedTask.title,
      description: selectedTask.description ?? "",
      dueDate: selectedTask.dueDate ?? "",
      status: selectedTask.status,
      priority: selectedTask.priority,
      projectId: selectedTask.project?.id ?? "",
      assigneeId: selectedTask.assigneeId ?? "",
      estimatedHours: selectedTask.estimatedHours?.toString() ?? "",
      recurrence: selectedTask.recurrence ?? "",
      blockedById: selectedTask.blockedById ?? "",
    });
    setMode("edit");
  };

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        dueDate: form.dueDate || undefined,
        status: form.status,
        priority: form.priority,
        projectId: form.projectId || null,
        assigneeId: form.assigneeId || null,
        estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : null,
        recurrence: form.recurrence || null,
        blockedById: form.blockedById || null,
      };
      if (mode === "create") await apiFetch("/tasks", { method: "POST", body: JSON.stringify(payload) });
      else if (selectedTask) await apiFetch(`/tasks/${selectedTask.id}`, { method: "PUT", body: JSON.stringify(payload) });
      await refetch();
      setMode("view");
      toast.success(mode === "create" ? "Task created." : "Task updated.");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't save that task.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    await removeTask(id);
    if (selectedTask?.id === id) { setSelectedTask(null); setAsideOpen(false); }
  };

  const sensors = useSensors(
    // Mouse and Touch as separate sensors, never PointerSensor — a pointer
    // sensor plus touch-none makes the board unscrollable on a phone.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveTask((e.active.data.current as { task?: ApiTask } | undefined)?.task ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const task = (active.data.current as { task?: ApiTask } | undefined)?.task;
    const drop = over.data.current as DropData | undefined;
    if (!task || !drop) return;

    const patch: TaskPatch = {};
    // status is null on a section-header drop: move it here, keep the status.
    if (drop.status && task.status !== drop.status) patch.status = drop.status;

    if (prefs.group === "person") {
      const next = drop.groupKey === UNASSIGNED_KEY ? null : drop.groupKey;
      if ((task.assigneeId ?? null) !== next) patch.assigneeId = next;
    } else {
      const next = drop.groupKey === NO_PROJECT_KEY ? null : drop.groupKey;
      if ((task.project?.id ?? null) !== next) patch.projectId = next;
    }

    if (Object.keys(patch).length === 0) return;
    patchTask(task.id, patch);
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const selectMany = (ids: string[], selected: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (selected ? next.add(id) : next.delete(id)));
      return next;
    });

  const showAside = asideOpen && (mode !== "view" || !!selectedTask);

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className={cn("flex min-w-0 flex-1 flex-col overflow-hidden glass-panel", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <SubNavToggle />
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground">Tasks</h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {prefs.view === "kanban" ? "Drag a card between people and columns." : "Everything the team is working on, grouped."}
              </p>
            </div>
          </div>
          {!showAside && (
            <button onClick={() => setAsideOpen(true)} className="hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground/85 lg:block" title="Show details">
              <TbLayoutSidebarRightFilled size={18} />
            </button>
          )}
        </div>

        <TasksToolbar
          scope={prefs.scope} setScope={prefs.setScope}
          view={prefs.view} setView={prefs.setView}
          group={prefs.group} setGroup={prefs.setGroup}
          filters={prefs.filters} setFilter={prefs.setFilter}
          search={prefs.search} setSearch={prefs.setSearch}
          projects={projects}
          teams={teams}
          allTags={allTags}
          rosterAvailable={rosterAvailable}
          onExpandAll={() => prefs.setAllSections(sections.map((s) => s.key), true)}
          onCollapseAll={() => prefs.setAllSections(sections.map((s) => s.key), false)}
          onAdd={() => startCreate()}
        />

        {prefs.view === "list" && (
          <TaskBulkBar
            selectedIds={selectedIds}
            people={people}
            onClear={() => setSelectedIds(new Set())}
            onDone={refetch}
          />
        )}

        <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
          {loading || !ready ? (
            <div className="flex justify-center py-16"><TbLoader className="animate-spin text-muted-foreground/70" size={28} /></div>
          ) : sections.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Nothing to show here yet.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="space-y-2.5">
                {sections.map((s) => (
                  <TaskSection
                    key={s.key}
                    section={s}
                    view={prefs.view}
                    groupMode={prefs.group}
                    hideDone={prefs.filters.hideDone}
                    selectedId={selectedTask?.id ?? null}
                    selectedIds={selectedIds}
                    isOpen={isOpen(s)}
                    canEdit={canEditTask}
                    people={people}
                    projects={projects}
                    onToggle={prefs.toggleSection}
                    onSelect={openTask}
                    onPatch={patchTask}
                    onDelete={deleteTask}
                    onToggleSelect={toggleSelect}
                    onSelectMany={selectMany}
                    onAdd={startCreate}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeTask ? <TaskCardOverlay task={activeTask} groupMode={prefs.group} /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </main>

      <aside
        className={cn(
          "min-h-0 flex-col overflow-hidden bg-card transition-all duration-200 ease-in-out",
          mobileDetail && showAside ? "fixed inset-0 z-50 flex" : "hidden",
          "lg:static lg:z-auto lg:h-full lg:rounded-xl",
          // 34% rather than the 42% the other Work pages use: this one sits next
          // to a kanban whose columns need the width more than the panel does.
          // Capped so it stops growing on ultrawide screens.
          showAside ? "lg:ml-2 lg:flex lg:w-[34%] lg:max-w-[520px]" : "lg:w-0"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {mode === "create" ? "Add Task" : mode === "edit" ? "Edit Task" : "Task Details"}
          </h2>
          <div className="flex items-center gap-1">
            {mode === "view" && selectedTask && canEditTask(selectedTask) && (
              <button onClick={startEdit} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-400/10">Edit</button>
            )}
            <button
              onClick={() => { setMobileDetail(false); setAsideOpen(false); setMode("view"); }}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground/85"
              aria-label="Close details"
            >
              <TbX size={17} className="lg:hidden" />
              <TbLayoutSidebarRightFilled size={17} className="hidden lg:block" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {mode === "view" ? (
            selectedTask ? (
              <TaskDetailPanel
                task={selectedTask}
                canEdit={canEditTask(selectedTask)}
                canDeleteComment={canDeleteComment}
                onStatusChange={(id, status: TaskStatus) => patchTask(id, { status })}
                onTaskChanged={refetchQuiet}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select a task to view details.</div>
            )
          ) : (
            <TaskFormPanel
              form={form}
              setForm={setForm}
              saving={saving}
              tasks={tasks}
              editingId={mode === "edit" ? selectedTask?.id ?? null : null}
              projects={projects}
              people={people}
              onSubmit={saveTask}
              onCancel={() => { setMode("view"); if (!selectedTask) setAsideOpen(false); }}
            />
          )}
        </div>
      </aside>
    </div>
  );
}
