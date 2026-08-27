"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TbLock, TbRepeat, TbSubtask } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { PRIORITY_COLORS, STATUSES, TAG_COLOR_STYLES } from "./constants";
import { DueBadge, initials, isOverdue, ordinalDate } from "./utils";
import type { ApiTask, GroupMode, PersonOption, ProjectOption, TaskPatch, TaskStatus } from "./types";

function CardBody({ task, groupMode }: { task: ApiTask; groupMode: GroupMode }) {
  const done = task.subtasks?.filter((s) => s.done).length ?? 0;
  const total = task.subtasks?.length ?? 0;

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className={cn("text-[13px] font-medium leading-snug text-stone-800", task.status === "Done" && "text-stone-400 line-through")}>
          {task.title}
        </p>
        <span className={cn("mt-0.5 shrink-0 rounded border px-1 text-[9px] font-bold", PRIORITY_COLORS[task.priority])}>
          {task.priority.charAt(0)}
        </span>
      </div>

      {task.tags?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((t) => (
            <span key={t.id} className={cn("rounded border px-1.5 py-0.5 text-[9px] font-medium", TAG_COLOR_STYLES[t.color] ?? TAG_COLOR_STYLES.gray)}>
              {t.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-stone-400">
        {task.recurrence && <TbRepeat size={11} title={task.recurrence} />}
        {task.blockedById && <TbLock size={11} className="text-amber-500" title="Blocked" />}
        {total > 0 && <span className="inline-flex items-center gap-0.5"><TbSubtask size={11} />{done}/{total}</span>}
        {task.dueDate && <span className={cn(isOverdue(task.dueDate, task.status) && "font-semibold text-red-500")}>{ordinalDate(task.dueDate)}</span>}
        <DueBadge dueDate={task.dueDate} status={task.status} />
        {/* Show whichever dimension is NOT the section it already sits in. */}
        {groupMode === "person" && task.project && <span className="truncate">· {task.project.name}</span>}
        {groupMode === "project" && task.assignee && (
          <span className="inline-flex items-center gap-1">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-stone-200 text-[7px] font-bold text-stone-600">
              {initials(task.assignee.fullName)}
            </span>
            {task.assignee.fullName.split(" ")[0]}
          </span>
        )}
      </div>
    </>
  );
}

export function TaskCard({
  task, groupMode, selected, canEdit, isMoving, quickAssign, people, projects, onSelect, onPatch,
}: {
  task: ApiTask;
  groupMode: GroupMode;
  selected?: boolean;
  canEdit: boolean;
  isMoving?: boolean;
  /** Unassigned section — surface an assignee picker at every breakpoint. */
  quickAssign?: boolean;
  people: PersonOption[];
  projects: ProjectOption[];
  onSelect: (t: ApiTask) => void;
  onPatch: (id: string, patch: TaskPatch) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: !canEdit,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(task)}
      className={cn(
        "rounded-lg border bg-white p-2.5 text-left shadow-xs transition-colors",
        canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        selected ? "border-blue-300 ring-1 ring-blue-200" : "border-stone-200 hover:border-stone-300",
        isDragging && "opacity-30",
        isMoving && "opacity-50"
      )}
    >
      <CardBody task={task} groupMode={groupMode} />

      {/* Assigning shouldn't require a drag. In the Unassigned lane the picker is
          always on, at every breakpoint — dragging onto a person means finding
          and expanding their section first, which is a lot of work for a bulk
          triage job. */}
      {canEdit && quickAssign && (
        <div className="mt-2" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <select
            value=""
            onChange={(e) => e.target.value && onPatch(task.id, { assigneeId: e.target.value })}
            className="w-full cursor-pointer rounded-md border border-blue-200 bg-blue-50 px-1.5 py-1 text-[11px] font-medium text-blue-700 outline-none hover:bg-blue-100"
          >
            <option value="">Assign to…</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
        </div>
      )}

      {/* Touch fallback — native drag needs a long-press, so give small screens
          plain selects. stopPropagation keeps them from starting a drag or
          opening the detail panel. */}
      {canEdit && (
        <div className="mt-2 flex gap-1.5 sm:hidden" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <select
            value={task.status}
            onChange={(e) => onPatch(task.id, { status: e.target.value as TaskStatus })}
            className="min-w-0 flex-1 rounded border border-stone-200 bg-white px-1 py-0.5 text-[10px]"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {/* quickAssign already renders an assignee picker above — don't repeat it. */}
          {groupMode === "person" ? (
            !quickAssign && (
              <select
                value={task.assigneeId ?? ""}
                onChange={(e) => onPatch(task.id, { assigneeId: e.target.value || null })}
                className="min-w-0 flex-1 rounded border border-stone-200 bg-white px-1 py-0.5 text-[10px]"
              >
                <option value="">Unassigned</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
              </select>
            )
          ) : (
            <select
              value={task.project?.id ?? ""}
              onChange={(e) => onPatch(task.id, { projectId: e.target.value || null })}
              className="min-w-0 flex-1 rounded border border-stone-200 bg-white px-1 py-0.5 text-[10px]"
            >
              <option value="">Internal</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
      )}
    </div>
  );
}

/** Static clone for <DragOverlay> — must not register a second draggable id. */
export function TaskCardOverlay({ task, groupMode }: { task: ApiTask; groupMode: GroupMode }) {
  return (
    <div className="rotate-2 rounded-lg border border-stone-200 bg-white p-2.5 shadow-lg">
      <CardBody task={task} groupMode={groupMode} />
    </div>
  );
}
