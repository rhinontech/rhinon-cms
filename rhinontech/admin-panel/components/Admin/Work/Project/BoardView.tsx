"use client";

import { useMemo, useState } from "react";
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor,
  closestCorners, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { confirmDialog, promptDialog } from "@/components/ui/dialogs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TbCalendar, TbDots, TbPaperclip, TbPlus, TbSubtask, TbX,
} from "react-icons/tb";
import { STATUS_CHIP, STATUS_DOT } from "./constants";
import { CardCover } from "../CardCover";
import { COLUMN_PILL, COLUMN_TOP } from "../boardStyle";
import type { PersonOption, ProjectTask, TaskRow, WorkflowStatus } from "./types";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

/** "28 Aug – 1 Sep (3d)" — the range form Wrike uses on cards. */
function rangeLabel(task: ProjectTask): string | null {
  const start = task.startDate ? new Date(task.startDate) : null;
  const due = task.dueDate ? new Date(task.dueDate) : null;
  if (!start && !due) return null;
  const f = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  if (start && due) {
    const days = Math.max(1, Math.round((due.getTime() - start.getTime()) / 86400000) + 1);
    return `${f(start)} – ${f(due)} (${days}d)`;
  }
  return f((start ?? due)!);
}

function isOverdue(task: ProjectTask) {
  if (!task.dueDate || task.status === "Done") return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

function BoardCard({
  task, childCount, onOpen, dragging,
}: {
  task: ProjectTask;
  childCount: number;
  onOpen?: (t: ProjectTask) => void;
  dragging?: boolean;
}) {
  const range = rangeLabel(task);
  const files = task.attachments?.length ?? 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl shadow-sm glass-card",
        dragging ? "rotate-1 shadow-lg" : "hover:border-border"
      )}
    >
      {/* Optional: only tasks with a cover picture get one. */}
      <CardCover url={task.coverUrl} />
      <button data-task-opener onClick={() => onOpen?.(task)} className="block w-full px-3.5 py-3 text-left">
        <p className="text-[15px] font-medium leading-snug text-foreground">
          {task.title}
          {files > 0 && <TbPaperclip size={13} className="ml-1.5 inline align-[-1px] text-muted-foreground" aria-label={`${files} files`} />}
        </p>
        {!!task.tags?.length && (
          <div className="mt-2 flex flex-wrap gap-1">
            {task.tags.map((t) => (
              <span key={t.id} className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", STATUS_CHIP[t.color] ?? STATUS_CHIP.stone)}>{t.label}</span>
            ))}
          </div>
        )}
        {/* Boolean(), not `||` on a number: `false || 0` is `0`, and React RENDERS
            a bare 0 — which is what put a stray "0" on every empty card. */}
        {Boolean(childCount > 0 || range) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {childCount > 0 && (
              <span className="flex items-center gap-1 rounded-md border px-1.5 py-0.5"><TbSubtask size={12} /> {childCount}</span>
            )}
            {range && (
              <span className={cn(isOverdue(task) && "font-medium text-red-600 dark:text-red-300")}>{range}</span>
            )}
          </div>
        )}
        <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">Who&apos;s in charge</span>
          {task.assignee ? (
            <span className="flex min-w-0 items-center gap-1.5 rounded-full bg-cyan-100 py-0.5 pl-0.5 pr-2 font-medium text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-200">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-200 text-[9px] font-semibold dark:bg-cyan-400/25">
                {initials(task.assignee.fullName)}
              </span>
              <span className="truncate">{task.assignee.fullName.split(" ")[0]}</span>
            </span>
          ) : (
            <span className="rounded-full border border-dashed px-2 py-0.5">Unassigned</span>
          )}
        </div>
      </button>
    </div>
  );
}

function DraggableCard(props: { task: ProjectTask; childCount: number; onOpen: (t: ProjectTask) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: props.task.id,
    data: { task: props.task },
  });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn("cursor-grab", isDragging && "opacity-40")}>
      <BoardCard {...props} />
    </div>
  );
}

const COLUMN_COLORS = ["blue", "indigo", "cyan", "amber", "green", "stone", "red", "purple"];

export interface ColumnActions {
  add: (name: string) => void;
  update: (id: string, patch: { name?: string; color?: string }) => void;
  remove: (id: string) => void;
}

function Column({
  status, tasks, childCountOf, onOpen, onCreate, readOnly, columns,
}: {
  columns?: ColumnActions;
  readOnly: boolean;
  status: WorkflowStatus;
  tasks: ProjectTask[];
  childCountOf: (id: string) => number;
  onOpen: (t: ProjectTask) => void;
  onCreate: (title: string, statusId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id, data: { statusId: status.id } });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  return (
    <div className="flex w-[300px] shrink-0 flex-col gap-3">
      <div className={cn("flex items-center gap-2 rounded-xl border-t-[3px] px-3 py-2.5 shadow-sm glass-card", COLUMN_TOP[status.color] ?? COLUMN_TOP.stone)}>
        <span className={cn("max-w-[170px] truncate rounded-md px-2.5 py-1 text-sm font-semibold", COLUMN_PILL[status.color] ?? COLUMN_PILL.stone)}>{status.name}</span>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full border px-1.5 text-xs text-muted-foreground">{tasks.length}</span>
        {!readOnly && (
          <>
            <button
              onClick={() => setAdding(true)}
              className="ml-auto rounded p-0.5 opacity-70 hover:bg-foreground/10 hover:opacity-100"
              title="Add a task here"
            >
              <TbPlus size={14} />
            </button>
            {columns ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded p-0.5 opacity-70 hover:bg-foreground/10 hover:opacity-100" title="Column options">
                    <TbDots size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={async () => {
                      const name = await promptDialog({ title: "Rename column", confirmText: "Rename" }, status.name);
                      if (name?.trim() && name.trim() !== status.name) columns.update(status.id, { name: name.trim() });
                    }}
                  >
                    Rename
                  </DropdownMenuItem>
                  <div className="flex gap-1.5 px-2 py-1.5">
                    {COLUMN_COLORS.map((c) => (
                      <button
                        key={c}
                        title={c}
                        onClick={() => c !== status.color && columns.update(status.id, { color: c })}
                        className={cn("h-4 w-4 rounded-full", STATUS_DOT[c], status.color === c && "ring-2 ring-foreground/60 ring-offset-1 ring-offset-popover")}
                      />
                    ))}
                  </div>
                  <DropdownMenuItem
                    className="text-red-600 dark:text-red-300"
                    onSelect={async () => {
                      if (await confirmDialog(`Delete the "${status.name}" column?`)) columns.remove(status.id);
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button className="rounded p-0.5 opacity-40" title="Column options aren't available here" disabled>
                <TbDots size={14} />
              </button>
            )}
          </>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[120px] flex-1 space-y-3 rounded-xl p-1 transition-colors",
          isOver && "bg-blue-50/60 ring-2 ring-blue-300/60 dark:bg-blue-400/10 dark:ring-blue-400/30"
        )}
      >
        {adding && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim()) onCreate(title, status.id);
              setTitle("");
              setAdding(false);
            }}
          >
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => { if (!title.trim()) setAdding(false); }}
              placeholder="Task name…"
              className="w-full rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60"
            />
          </form>
        )}

        {tasks.map((t) => readOnly ? (
          <BoardCard key={t.id} task={t} childCount={childCountOf(t.id)} onOpen={onOpen} />
        ) : (
          <DraggableCard key={t.id} task={t} childCount={childCountOf(t.id)} onOpen={onOpen} />
        ))}

        {!tasks.length && !adding && !readOnly && (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-3 text-xs text-muted-foreground hover:border-border hover:text-foreground/70"
          >
            <TbPlus size={13} /> Item
          </button>
        )}
      </div>
    </div>
  );
}

export function BoardView({
  rows, statuses, people, onPatch, onCreateInStatus, onOpenTask, readOnly = false, columns,
}: {
  /** Column editing. Omitted where it isn't allowed (portal, collaborators). */
  columns?: ColumnActions;
  /** The public portal: no drag, no create. */
  readOnly?: boolean;
  rows: TaskRow[];
  statuses: WorkflowStatus[];
  people: PersonOption[];
  onPatch: (id: string, patch: Record<string, unknown>) => void;
  onCreateInStatus: (title: string, statusId: string) => void;
  onOpenTask: (task: ProjectTask) => void;
}) {
  const [active, setActive] = useState<ProjectTask | null>(null);
  const sensors = useSensors(
    // A small distance threshold keeps a click-to-open from starting a drag.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const childCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { task } of rows) {
      if (!task.parentTaskId) continue;
      counts.set(task.parentTaskId, (counts.get(task.parentTaskId) ?? 0) + 1);
    }
    return counts;
  }, [rows]);

  // Only top-level tasks get cards; subitems show as a count on their parent,
  // which is what keeps the board readable.
  const topLevel = useMemo(() => rows.filter((r) => r.depth === 0).map((r) => r.task), [rows]);

  const byStatus = useMemo(() => {
    const map = new Map<string, ProjectTask[]>();
    for (const s of statuses) map.set(s.id, []);
    const unplaced: ProjectTask[] = [];
    for (const t of topLevel) {
      if (t.statusId && map.has(t.statusId)) map.get(t.statusId)!.push(t);
      else unplaced.push(t);
    }
    // Tasks with no status (or one from another workflow) land in the first
    // column rather than disappearing off the board.
    if (unplaced.length && statuses.length) {
      map.get(statuses[0].id)!.unshift(...unplaced);
    }
    return map;
  }, [topLevel, statuses]);

  const onDragStart = (e: DragStartEvent) => {
    setActive((e.active.data.current as { task?: ProjectTask } | undefined)?.task ?? null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const task = (e.active.data.current as { task?: ProjectTask } | undefined)?.task;
    const statusId = (e.over?.data.current as { statusId?: string } | undefined)?.statusId;
    if (readOnly || !task || !statusId || task.statusId === statusId) return;
    onPatch(task.id, { statusId });
  };

  if (!statuses.length) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
        This project has no workflow columns yet.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="h-full overflow-auto p-4">
        <div className="flex gap-3 pb-4">
          {statuses.map((s) => (
            <Column
              key={s.id}
              status={s}
              tasks={byStatus.get(s.id) ?? []}
              childCountOf={(id) => childCounts.get(id) ?? 0}
              onOpen={onOpenTask}
              onCreate={onCreateInStatus}
              readOnly={readOnly}
              columns={columns}
            />
          ))}
          {columns && (
            <button
              onClick={async () => {
                const name = await promptDialog({ title: "New column", confirmText: "Add column", placeholder: "Column name" });
                if (name?.trim()) columns.add(name.trim());
              }}
              className="flex h-10 w-[160px] shrink-0 items-center justify-center gap-1 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:text-foreground"
            >
              <TbPlus size={13} /> Add column
            </button>
          )}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {active && <div className="w-[292px]"><BoardCard task={active} childCount={childCounts.get(active.id) ?? 0} dragging /></div>}
      </DragOverlay>
    </DndContext>
  );
}
