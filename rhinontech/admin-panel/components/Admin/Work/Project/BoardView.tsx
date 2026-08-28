"use client";

import { useMemo, useState } from "react";
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor,
  closestCorners, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import {
  TbCalendar, TbDots, TbPaperclip, TbPlus, TbSubtask, TbX,
} from "react-icons/tb";
import { COLUMN_TINT, STATUS_CHIP, STATUS_DOT } from "./constants";
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
  // A single image attachment becomes the card cover, as Wrike does for proofs.
  const cover = task.attachments?.find((a) => a.mimeType?.startsWith("image/"));

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl shadow-sm glass-card",
        dragging ? "rotate-1 shadow-lg" : "hover:border-stone-300"
      )}
    >
      {cover && (
        <div className="flex h-24 items-center justify-center border-b bg-stone-50 text-[10px] text-stone-400">
          <TbPaperclip size={13} className="mr-1" /> {cover.name}
        </div>
      )}
      <button data-task-opener onClick={() => onOpen?.(task)} className="block w-full px-3 py-2.5 text-left">
        <p className="text-sm font-medium leading-snug text-stone-900">{task.title}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          {task.assignee ? (
            <span
              title={task.assignee.fullName}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-semibold text-cyan-800"
            >
              {initials(task.assignee.fullName)}
            </span>
          ) : (
            <span className="h-6 w-6 shrink-0 rounded-full border border-dashed border-stone-300" />
          )}
          {range && (
            <span className={cn("truncate text-[11px]", isOverdue(task) ? "text-red-600" : "text-stone-500")}>
              {range}
            </span>
          )}
        </div>
      </button>
      {/* Boolean(), not `||` on a number: `false || 0` is `0`, and React RENDERS
          a bare 0 — which is what put a stray "0" on every empty card. */}
      {Boolean(childCount > 0 || task.attachments?.length) && (
        <div className="flex items-center gap-3 border-t px-3 py-1.5 text-[11px] text-stone-500">
          {childCount > 0 && <span className="flex items-center gap-1"><TbSubtask size={12} /> {childCount}</span>}
          {Boolean(task.attachments?.length) && (
            <span className="flex items-center gap-1"><TbPaperclip size={12} /> {task.attachments!.length}</span>
          )}
        </div>
      )}
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

function Column({
  status, tasks, childCountOf, onOpen, onCreate,
}: {
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
    <div className="flex w-[300px] shrink-0 flex-col">
      <div className={cn("flex items-center gap-2 rounded-t-xl px-3 py-2", STATUS_CHIP[status.color] ?? STATUS_CHIP.stone)}>
        <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[status.color] ?? STATUS_DOT.stone)} />
        <span className="truncate text-sm font-semibold">{status.name}</span>
        <span className="text-xs opacity-70">{tasks.length}</span>
        <button
          onClick={() => setAdding(true)}
          className="ml-auto rounded p-0.5 opacity-70 hover:bg-black/10 hover:opacity-100"
          title="Add a task here"
        >
          <TbPlus size={14} />
        </button>
        <button className="rounded p-0.5 opacity-40" title="Column options (coming soon)" disabled>
          <TbDots size={14} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[120px] flex-1 space-y-2 rounded-b-xl border border-t-0 p-2 transition-colors",
          isOver ? "border-blue-300 bg-blue-50/60" : COLUMN_TINT[status.color] ?? COLUMN_TINT.stone
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
              className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
        )}

        {tasks.map((t) => (
          <DraggableCard key={t.id} task={t} childCount={childCountOf(t.id)} onOpen={onOpen} />
        ))}

        {!tasks.length && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 py-3 text-xs text-stone-400 hover:border-stone-400 hover:text-stone-600"
          >
            <TbPlus size={13} /> Item
          </button>
        )}
      </div>
    </div>
  );
}

export function BoardView({
  rows, statuses, people, onPatch, onCreateInStatus, onOpenTask,
}: {
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
    if (!task || !statusId || task.statusId === statusId) return;
    onPatch(task.id, { statusId });
  };

  if (!statuses.length) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-stone-400">
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
            />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {active && <div className="w-[284px]"><BoardCard task={active} childCount={childCounts.get(active.id) ?? 0} dragging /></div>}
      </DragOverlay>
    </DndContext>
  );
}
