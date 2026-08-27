"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { STATUSES } from "./constants";
import { TaskCard } from "./TaskCard";
import type { ApiTask, GroupMode, PersonOption, ProjectOption, TaskPatch, TaskStatus } from "./types";

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  Pending: "text-stone-500",
  "In progress": "text-blue-600",
  Done: "text-emerald-600",
};

function Column({
  sectionKey, status, tasks, hideDone, groupMode, selectedId, canEdit, quickAssign,
  people, projects, onSelect, onPatch,
}: {
  sectionKey: string;
  status: TaskStatus;
  tasks: ApiTask[];
  hideDone: boolean;
  groupMode: GroupMode;
  selectedId: string | null;
  canEdit: (t: ApiTask) => boolean;
  quickAssign?: boolean;
  people: PersonOption[];
  projects: ProjectOption[];
  onSelect: (t: ApiTask) => void;
  onPatch: (id: string, patch: TaskPatch) => void;
}) {
  // id is for uniqueness only; the payload rides in `data` because statuses
  // contain spaces and must never be recovered by parsing the id.
  const { setNodeRef, isOver } = useDroppable({
    id: `${sectionKey}::${status}`,
    data: { groupKey: sectionKey, status },
  });

  // Done is collapsed rather than hidden: you still need somewhere to drop a
  // task you're completing.
  const collapsed = status === "Done" && hideDone;
  const [revealed, setRevealed] = useState(false);
  const showCards = !collapsed || revealed;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-xl bg-stone-100/70 p-2 transition-colors",
        isOver && "bg-blue-50 ring-2 ring-blue-200"
      )}
    >
      <div className="flex items-center justify-between px-1">
        <span className={cn("text-[10px] font-bold uppercase tracking-widest", COLUMN_ACCENT[status])}>{status}</span>
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-stone-400">{tasks.length}</span>
      </div>

      {showCards ? (
        <div className="flex flex-col gap-2">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              groupMode={groupMode}
              selected={selectedId === t.id}
              canEdit={canEdit(t)}
              quickAssign={quickAssign}
              people={people}
              projects={projects}
              onSelect={onSelect}
              onPatch={onPatch}
            />
          ))}
          {tasks.length === 0 && (
            <div className="rounded-lg border border-dashed border-stone-200 py-5 text-center text-[10px] text-stone-300">
              Drop here
            </div>
          )}
          {collapsed && revealed && (
            <button onClick={() => setRevealed(false)} className="text-[10px] text-stone-400 hover:text-stone-600">
              Hide done
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          disabled={tasks.length === 0}
          className="rounded-lg border border-dashed border-stone-200 py-5 text-center text-[10px] text-stone-400 transition-colors hover:border-stone-300 hover:text-stone-600 disabled:opacity-50"
        >
          {tasks.length === 0 ? "Drop here" : `Show ${tasks.length} done`}
        </button>
      )}
    </div>
  );
}

export function TaskKanbanRow({
  sectionKey, tasks, hideDone, groupMode, selectedId, canEdit, quickAssign,
  people, projects, onSelect, onPatch,
}: {
  sectionKey: string;
  tasks: ApiTask[];
  hideDone: boolean;
  groupMode: GroupMode;
  selectedId: string | null;
  canEdit: (t: ApiTask) => boolean;
  quickAssign?: boolean;
  people: PersonOption[];
  projects: ProjectOption[];
  onSelect: (t: ApiTask) => void;
  onPatch: (id: string, patch: TaskPatch) => void;
}) {
  // grid, not a flex row of fixed-width columns — three statuses is a fixed
  // count, so it always fits and no section grows its own horizontal scrollbar.
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
      {STATUSES.map((status) => (
        <Column
          key={status}
          sectionKey={sectionKey}
          status={status}
          tasks={tasks.filter((t) => t.status === status)}
          hideDone={hideDone}
          groupMode={groupMode}
          selectedId={selectedId}
          canEdit={canEdit}
          quickAssign={quickAssign}
          people={people}
          projects={projects}
          onSelect={onSelect}
          onPatch={onPatch}
        />
      ))}
    </div>
  );
}
