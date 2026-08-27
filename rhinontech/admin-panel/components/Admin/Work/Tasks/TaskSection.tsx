"use client";

import { useDroppable } from "@dnd-kit/core";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TbChevronRight, TbPlus, TbUserOff } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { TaskKanbanRow } from "./TaskKanbanRow";
import { TaskListRows } from "./TaskListRows";
import { avatarTint, initials } from "./utils";
import type {
  ApiTask, GroupMode, PersonOption, ProjectOption, TaskPatch, TaskSection as Section, ViewMode,
} from "./types";

export function TaskSection({
  section, view, groupMode, hideDone, selectedId, selectedIds, isOpen, canEdit,
  people, projects, onToggle, onSelect, onPatch, onDelete, onToggleSelect, onSelectMany, onAdd,
}: {
  section: Section;
  view: ViewMode;
  groupMode: GroupMode;
  hideDone: boolean;
  selectedId: string | null;
  selectedIds: Set<string>;
  isOpen: boolean;
  canEdit: (t: ApiTask) => boolean;
  people: PersonOption[];
  projects: ProjectOption[];
  onToggle: (key: string, open: boolean) => void;
  onSelect: (t: ApiTask) => void;
  onPatch: (id: string, patch: TaskPatch) => void;
  onDelete: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectMany: (ids: string[], selected: boolean) => void;
  onAdd: (section: Section) => void;
}) {
  // The Unassigned lane exists to be emptied, so both views surface an assignee
  // picker there instead of the usual project/assignee column.
  const quickAssign = section.kind === "unassigned";
  // Radix unmounts closed content, so a collapsed section has no columns to drop
  // onto. This header-level target keeps it reachable — `status: null` means
  // "move it here but leave the status alone".
  const { setNodeRef, isOver } = useDroppable({
    id: `${section.key}::__section`,
    data: { groupKey: section.key, status: null },
  });

  const { counts } = section;
  const isPerson = section.kind === "person" || section.kind === "inactive-person";
  const isFormer = section.kind === "inactive-person";

  return (
    <Collapsible open={isOpen} onOpenChange={(o) => onToggle(section.key, o)}>
      <div
        ref={setNodeRef}
        className={cn(
          "rounded-xl border transition-colors",
          isOver ? "border-blue-300 bg-blue-50/60" : "border-stone-200 bg-white"
        )}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
            <TbChevronRight size={15} className={cn("shrink-0 text-stone-400 transition-transform", isOpen && "rotate-90")} />

            {isPerson ? (
              <span className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                isFormer ? "bg-stone-100 text-stone-400" : avatarTint(section.key)
              )}>
                {isFormer ? <TbUserOff size={13} /> : initials(section.label)}
              </span>
            ) : (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-bold text-stone-500">
                {section.kind === "unassigned" ? "?" : initials(section.label)}
              </span>
            )}

            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className={cn("truncate text-sm font-semibold", isFormer ? "text-stone-500" : "text-stone-800")}>
                  {section.label}
                </span>
                {section.isMe && (
                  <span className="shrink-0 rounded bg-blue-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-blue-700">You</span>
                )}
              </span>
              {section.sublabel && <span className="block truncate text-[10px] text-stone-400">{section.sublabel}</span>}
            </span>
          </CollapsibleTrigger>

          <div className="flex shrink-0 items-center gap-1.5">
            {counts.overdue > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">{counts.overdue} overdue</span>
            )}
            {counts.pending + counts.inProgress > 0 ? (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                {counts.pending + counts.inProgress} open
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                {counts.total === 0 ? "Free" : "All done"}
              </span>
            )}
            <span className="hidden text-[10px] text-stone-400 sm:inline">{counts.total}</span>

            {!isFormer && (
              <button
                onClick={() => onAdd(section)}
                className="rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                aria-label={`Add a task for ${section.label}`}
                title={`Add a task for ${section.label}`}
              >
                <TbPlus size={15} />
              </button>
            )}
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t border-stone-100 p-2.5">
            {view === "kanban" ? (
              <TaskKanbanRow
                sectionKey={section.key}
                tasks={section.tasks}
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
            ) : (
              <TaskListRows
                tasks={section.tasks}
                hideDone={hideDone}
                groupMode={groupMode}
                selectedId={selectedId}
                selectedIds={selectedIds}
                canEdit={canEdit}
                quickAssign={quickAssign}
                people={people}
                projects={projects}
                onSelect={onSelect}
                onPatch={onPatch}
                onDelete={onDelete}
                onToggleSelect={onToggleSelect}
                onSelectMany={onSelectMany}
              />
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
