"use client";

import { useState } from "react";
import { TbLock, TbRepeat, TbSubtask, TbTrash } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { LIST_GRID, PRIORITY_COLORS, STATUSES, STATUS_STYLES, TAG_COLOR_STYLES } from "./constants";
import { DueBadge, isDueToday, isOverdue, ordinalDate } from "./utils";
import type { ApiTask, GroupMode, PersonOption, ProjectOption, TaskPatch, TaskStatus } from "./types";

/** Pill-shaped select that never bubbles a click up into the row. */
function InlineSelect({
  value, onChange, className, children, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value); }}
      className={cn(
        "w-full max-w-full cursor-pointer truncate rounded-md border px-1.5 py-0.5 text-[11px] font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {children}
    </select>
  );
}

export function TaskListRows({
  tasks, hideDone, groupMode, selectedId, selectedIds, canEdit, quickAssign,
  people, projects, onSelect, onPatch, onDelete, onToggleSelect, onSelectMany,
}: {
  tasks: ApiTask[];
  hideDone: boolean;
  groupMode: GroupMode;
  selectedId: string | null;
  selectedIds: Set<string>;
  canEdit: (t: ApiTask) => boolean;
  /** Unassigned section — the third column becomes an assignee picker. */
  quickAssign?: boolean;
  people: PersonOption[];
  projects: ProjectOption[];
  onSelect: (t: ApiTask) => void;
  onPatch: (id: string, patch: TaskPatch) => void;
  onDelete: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectMany: (ids: string[], selected: boolean) => void;
}) {
  const [showDone, setShowDone] = useState(false);
  const doneTasks = tasks.filter((t) => t.status === "Done");
  const visible = hideDone && !showDone ? tasks.filter((t) => t.status !== "Done") : tasks;

  if (tasks.length === 0) {
    return <p className="px-3 py-4 text-center text-[11px] text-stone-300">No tasks</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className={cn("grid items-center gap-2 border-b border-stone-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400", LIST_GRID)}>
          {/* Select-all for this section — the fast path into the bulk bar when
              triaging a long Unassigned list. */}
          <input
            type="checkbox"
            checked={visible.length > 0 && visible.every((t) => selectedIds.has(t.id))}
            onChange={(e) => onSelectMany(visible.map((t) => t.id), e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer accent-blue-600"
            aria-label="Select all in this section"
          />
          <span>Task</span>
          <span>{quickAssign ? "Assign to" : groupMode === "person" ? "Project" : "Assignee"}</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Due</span>
          <span />
        </div>

        {visible.map((task) => {
          const editable = canEdit(task);
          const done = task.subtasks?.filter((s) => s.done).length ?? 0;
          const total = task.subtasks?.length ?? 0;

          return (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(task)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(task); } }}
              className={cn(
                "grid cursor-pointer items-center gap-2 border-b border-stone-50 px-3 py-2 transition-colors",
                LIST_GRID,
                selectedId === task.id ? "bg-blue-50/70" : "hover:bg-stone-50",
                isOverdue(task.dueDate, task.status) && selectedId !== task.id && "bg-red-50/30",
                isDueToday(task.dueDate, task.status) && selectedId !== task.id && "bg-amber-50/30"
              )}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(task.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => onToggleSelect(task.id)}
                className="h-3.5 w-3.5 cursor-pointer accent-blue-600"
              />

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn("truncate text-[13px] font-medium text-stone-800", task.status === "Done" && "text-stone-400 line-through")}>
                    {task.title}
                  </span>
                  {task.recurrence && <TbRepeat size={12} className="shrink-0 text-stone-400" />}
                  {task.blockedById && <TbLock size={12} className="shrink-0 text-amber-500" />}
                  {total > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-stone-400">
                      <TbSubtask size={11} />{done}/{total}
                    </span>
                  )}
                </div>
                {task.tags?.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {task.tags.slice(0, 3).map((t) => (
                      <span key={t.id} className={cn("rounded border px-1 py-px text-[9px]", TAG_COLOR_STYLES[t.color] ?? TAG_COLOR_STYLES.gray)}>
                        {t.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* The grouping dimension is already the section header, so show the
                  other one — except in Unassigned, where assigning is the whole
                  point of being there. */}
              {quickAssign ? (
                <InlineSelect
                  value=""
                  disabled={!editable}
                  onChange={(v) => v && onPatch(task.id, { assigneeId: v })}
                  className="border-blue-200 bg-blue-50 font-medium text-blue-700"
                >
                  <option value="">Assign to…</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                </InlineSelect>
              ) : groupMode === "person" ? (
                <InlineSelect
                  value={task.project?.id ?? ""}
                  disabled={!editable}
                  onChange={(v) => onPatch(task.id, { projectId: v || null })}
                  className="border-stone-200 bg-white text-stone-600"
                >
                  <option value="">Internal</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </InlineSelect>
              ) : (
                <InlineSelect
                  value={task.assigneeId ?? ""}
                  disabled={!editable}
                  onChange={(v) => onPatch(task.id, { assigneeId: v || null })}
                  className="border-stone-200 bg-white text-stone-600"
                >
                  <option value="">Unassigned</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                </InlineSelect>
              )}

              <InlineSelect
                value={task.priority}
                disabled={!editable}
                onChange={(v) => onPatch(task.id, { priority: v as ApiTask["priority"] })}
                className={PRIORITY_COLORS[task.priority]}
              >
                {(["Low", "Medium", "High"] as const).map((p) => <option key={p} value={p}>{p}</option>)}
              </InlineSelect>

              <InlineSelect
                value={task.status}
                disabled={!editable}
                onChange={(v) => onPatch(task.id, { status: v as TaskStatus })}
                className={STATUS_STYLES[task.status]}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </InlineSelect>

              <div className="flex items-center gap-1 text-[11px] text-stone-500">
                <span className={cn(isOverdue(task.dueDate, task.status) && "font-semibold text-red-600")}>
                  {ordinalDate(task.dueDate)}
                </span>
                <DueBadge dueDate={task.dueDate} status={task.status} />
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                disabled={!editable}
                className="rounded p-1 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-30"
                aria-label="Delete task"
              >
                <TbTrash size={14} />
              </button>
            </div>
          );
        })}

        {hideDone && doneTasks.length > 0 && (
          <button
            onClick={() => setShowDone((v) => !v)}
            className="w-full px-3 py-2 text-left text-[11px] text-stone-400 transition-colors hover:text-stone-600"
          >
            {showDone ? "Hide" : `${doneTasks.length} completed — show`}
          </button>
        )}
      </div>
    </div>
  );
}
