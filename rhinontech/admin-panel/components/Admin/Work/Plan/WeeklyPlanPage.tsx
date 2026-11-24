"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor,
  useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TbChevronLeft, TbChevronRight, TbLoader, TbPlus, TbX } from "react-icons/tb";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { NativeSelect } from "@/components/ui/native-select";
import { PRIORITY_COLORS } from "../Tasks/constants";
import { initials, isOverdue } from "../Tasks/utils";
import { PlanPerson, PlanTask, UNASSIGNED, addDays, iso, mondayOf, taskDayKey } from "./types";

interface ProjectOption { id: string; name: string }

const DAY_LABEL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklyPlanPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [anchor, setAnchor] = useState(() => new Date());
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [people, setPeople] = useState<PlanPerson[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [rosterAvailable, setRosterAvailable] = useState(true);
  const [projectId, setProjectId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<PlanTask | null>(null);
  const [addingAt, setAddingAt] = useState<{ person: string; day: string } | null>(null);
  const [addTitle, setAddTitle] = useState("");

  const monday = useMemo(() => mondayOf(anchor), [anchor]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);
  const weekStart = iso(weekDates[0]);
  const weekEnd = iso(weekDates[6]);

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ scope: "all", weekStart, weekEnd });
      if (projectId !== "all") q.set("projectId", projectId);
      const data = await apiFetch<PlanTask[]>(`/tasks?${q.toString()}`);
      setTasks(data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [weekStart, weekEnd, projectId]);

  useEffect(() => {
    apiFetch<ProjectOption[]>("/work/projects").then(setProjects).catch(() => setProjects([]));
    apiFetch<any[]>("/people")
      .then((d) => {
        setPeople(d.map((e) => ({ id: e.id, fullName: e.fullName, companyEmail: e.companyEmail, department: e.department ?? null })));
        setRosterAvailable(true);
      })
      .catch(() => { setPeople([]); setRosterAvailable(false); });
  }, []);

  // Rows: everyone on the roster (so a free week shows too), plus anyone who
  // has a task this week but isn't on the roster response, plus "Unassigned".
  const rows = useMemo(() => {
    const byId = new Map(people.map((p) => [p.id, p]));
    const extra = new Set<string>();
    let hasUnassigned = false;
    for (const t of tasks) {
      if (!t.assigneeId) { hasUnassigned = true; continue; }
      if (!byId.has(t.assigneeId) && t.assignee) extra.add(t.assigneeId);
    }
    const list: PlanPerson[] = [
      ...people,
      ...Array.from(extra).map((id) => {
        const t = tasks.find((x) => x.assigneeId === id);
        return { id, fullName: t?.assignee?.fullName ?? "Unknown", companyEmail: "", department: null };
      }),
    ];
    return { list, hasUnassigned: hasUnassigned || !rosterAvailable };
  }, [people, tasks, rosterAvailable]);

  const grid = useMemo(() => {
    const map = new Map<string, Map<string, PlanTask[]>>();
    for (const t of tasks) {
      const day = taskDayKey(t);
      if (!day) continue;
      const personKey = t.assigneeId ?? UNASSIGNED;
      if (!map.has(personKey)) map.set(personKey, new Map());
      const perPerson = map.get(personKey)!;
      if (!perPerson.has(day)) perPerson.set(day, []);
      perPerson.get(day)!.push(t);
    }
    return map;
  }, [tasks]);

  const workloadFor = (personKey: string) => {
    const perPerson = grid.get(personKey);
    if (!perPerson) return 0;
    let n = 0;
    for (const list of perPerson.values()) n += list.length;
    return n;
  };

  const patchTask = async (id: string, patch: Partial<Pick<PlanTask, "assigneeId" | "dueDate">>) => {
    const prev = tasks;
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try {
      await apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(patch) });
    } catch (err: any) {
      setTasks(prev);
      toast.error(err?.message || "Couldn't move that task.");
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveTask((e.active.data.current as { task?: PlanTask } | undefined)?.task ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const task = (active.data.current as { task?: PlanTask } | undefined)?.task;
    const drop = over.data.current as { personKey: string; day: string } | undefined;
    if (!task || !drop) return;

    const nextAssignee = drop.personKey === UNASSIGNED ? null : drop.personKey;
    const patch: Partial<Pick<PlanTask, "assigneeId" | "dueDate">> = {};
    if ((task.assigneeId ?? null) !== nextAssignee) patch.assigneeId = nextAssignee;
    if (task.dueDate !== drop.day) patch.dueDate = drop.day;
    if (Object.keys(patch).length === 0) return;
    patchTask(task.id, patch);
  };

  const submitQuickAdd = async () => {
    if (!addingAt || !addTitle.trim()) { setAddingAt(null); return; }
    try {
      await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: addTitle.trim(),
          assigneeId: addingAt.person === UNASSIGNED ? null : addingAt.person,
          dueDate: addingAt.day,
          projectId: projectId !== "all" ? projectId : undefined,
        }),
      });
      setAddTitle("");
      setAddingAt(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Couldn't add that task.");
    }
  };

  const isThisWeek = iso(mondayOf(new Date())) === weekStart;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden glass-panel", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">Weekly Plan</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">Who's doing what this week. Drag a card to reschedule or reassign.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NativeSelect
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60"
            >
              <option value="all">All projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </NativeSelect>
            <div className="flex items-center gap-1 rounded-lg border border-border px-1 py-1">
              <button onClick={() => setAnchor(addDays(monday, -7))} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <TbChevronLeft size={16} />
              </button>
              <button onClick={() => setAnchor(new Date())} className={cn("rounded-md px-2 py-0.5 text-xs font-medium", isThisWeek ? "text-foreground/50" : "text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-400/10")}>
                This week
              </button>
              <button onClick={() => setAnchor(addDays(monday, 7))} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <TbChevronRight size={16} />
              </button>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center py-16"><TbLoader className="animate-spin text-muted-foreground/70" size={28} /></div>
          ) : (
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="min-w-[900px]">
                <div className="sticky top-0 z-10 grid grid-cols-[180px_repeat(7,1fr)] border-b bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <div className="px-3 py-2">Person</div>
                  {weekDates.map((d, i) => {
                    const today = iso(d) === iso(new Date());
                    return (
                      <div key={i} className={cn("border-l px-2 py-2", today && "bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300")}>
                        {DAY_LABEL[i]} <span className="font-normal">{d.getDate()}</span>
                      </div>
                    );
                  })}
                </div>

                {rows.list.map((person) => (
                  <PersonRow
                    key={person.id}
                    personKey={person.id}
                    label={person.fullName}
                    weekDates={weekDates}
                    grid={grid}
                    addingAt={addingAt}
                    addTitle={addTitle}
                    setAddTitle={setAddTitle}
                    setAddingAt={setAddingAt}
                    submitQuickAdd={submitQuickAdd}
                  />
                ))}
                {rows.hasUnassigned && (
                  <PersonRow
                    personKey={UNASSIGNED}
                    label="Unassigned"
                    weekDates={weekDates}
                    grid={grid}
                    addingAt={addingAt}
                    addTitle={addTitle}
                    setAddTitle={setAddTitle}
                    setAddingAt={setAddingAt}
                    submitQuickAdd={submitQuickAdd}
                    muted
                  />
                )}
                {!rows.list.length && !rows.hasUnassigned && (
                  <div className="px-4 py-16 text-center text-sm text-muted-foreground">No roster available and nothing scheduled this week.</div>
                )}
              </div>

              <DragOverlay>
                {activeTask && <PlanCard task={activeTask} dragging />}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </main>
    </div>
  );
}

function PersonRow({
  personKey, label, weekDates, grid, addingAt, addTitle, setAddTitle, setAddingAt, submitQuickAdd, muted,
}: {
  personKey: string;
  label: string;
  weekDates: Date[];
  grid: Map<string, Map<string, PlanTask[]>>;
  addingAt: { person: string; day: string } | null;
  addTitle: string;
  setAddTitle: (v: string) => void;
  setAddingAt: (v: { person: string; day: string } | null) => void;
  submitQuickAdd: () => void;
  muted?: boolean;
}) {
  const perPerson = grid.get(personKey);
  let count = 0;
  if (perPerson) for (const list of perPerson.values()) count += list.length;

  return (
    <div className="grid grid-cols-[180px_repeat(7,1fr)] border-b last:border-b-0">
      <div className={cn("flex items-center gap-2 border-r px-3 py-2.5 text-sm", muted ? "text-muted-foreground" : "text-foreground")}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-2xs font-semibold text-foreground/70">
          {muted ? "–" : initials(label)}
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{count}</span>
      </div>
      {weekDates.map((d, i) => {
        const day = iso(d);
        const cellTasks = perPerson?.get(day) ?? [];
        const isAdding = addingAt?.person === personKey && addingAt?.day === day;
        return (
          <Cell key={i} personKey={personKey} day={day}>
            <div className="space-y-1.5">
              {cellTasks.map((t) => <PlanCard key={t.id} task={t} />)}
              {isAdding ? (
                <input
                  autoFocus
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  onBlur={submitQuickAdd}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitQuickAdd();
                    if (e.key === "Escape") setAddingAt(null);
                  }}
                  placeholder="Task title…"
                  className="w-full rounded-md border border-border px-1.5 py-1 text-xs outline-none focus:ring-[2px] focus:ring-ring/20"
                />
              ) : (
                <button
                  onClick={() => { setAddingAt({ person: personKey, day }); setAddTitle(""); }}
                  className="flex w-full items-center justify-center rounded-md border border-dashed border-border/60 py-1 text-muted-foreground opacity-0 hover:bg-muted/50 group-hover:opacity-100"
                >
                  <TbPlus size={12} />
                </button>
              )}
            </div>
          </Cell>
        );
      })}
    </div>
  );
}

function Cell({ personKey, day, children }: { personKey: string; day: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${personKey}|${day}`, data: { personKey, day } });
  return (
    <div
      ref={setNodeRef}
      className={cn("group min-h-16 border-l px-1.5 py-1.5 transition-colors", isOver && "bg-blue-50 dark:bg-blue-400/10")}
    >
      {children}
    </div>
  );
}

function PlanCard({ task, dragging }: { task: PlanTask; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, data: { task } });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab rounded-md border border-border bg-card px-1.5 py-1 text-2xs shadow-sm",
        task.status === "Done" && "opacity-60",
        (isDragging || dragging) && "opacity-70"
      )}
    >
      <p className={cn("truncate font-medium text-foreground", task.status === "Done" && "line-through")}>{task.title}</p>
      <div className="mt-0.5 flex items-center gap-1 text-muted-foreground">
        <span className={cn("rounded border px-1 text-2xs font-semibold", PRIORITY_COLORS[task.priority])}>{task.priority.charAt(0)}</span>
        {task.project && <span className="truncate">{task.project.name}</span>}
        {isOverdue(task.dueDate, task.status) && <TbX size={10} className="shrink-0 text-red-500" />}
      </div>
    </div>
  );
}
