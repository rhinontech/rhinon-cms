"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  TbArrowsSort, TbCheck, TbFilter, TbLayoutList, TbSearch, TbX,
} from "react-icons/tb";
import type { PersonOption, WorkflowStatus } from "./types";

export type SortKey = "position" | "dueDate" | "startDate" | "title" | "priority" | "status";
export type GroupKey = "none" | "assignee" | "status" | "priority";

export interface WorkspaceFilters {
  search: string;
  assigneeId: string;
  statusId: string;
  priority: string;
  overdueOnly: boolean;
}

export const EMPTY_FILTERS: WorkspaceFilters = {
  search: "", assigneeId: "all", statusId: "all", priority: "all", overdueOnly: false,
};

const SORTS: { key: SortKey; label: string }[] = [
  { key: "position", label: "Manual" },
  { key: "dueDate", label: "Due date" },
  { key: "startDate", label: "Start date" },
  { key: "title", label: "Name" },
  { key: "priority", label: "Priority" },
  { key: "status", label: "Status" },
];

const GROUPS: { key: GroupKey; label: string }[] = [
  { key: "none", label: "None" },
  { key: "assignee", label: "Assignee" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
];

function Menu({
  label, icon, active, children,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
          active ? "bg-blue-50 text-blue-700" : "text-stone-600 hover:bg-stone-100"
        )}
      >
        {icon} {label}
      </button>
      {open && (
        <>
          {/* Click-away closes without trapping focus. */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1 w-60 rounded-lg border glass-modal p-2">
            {children(() => setOpen(false))}
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm",
        selected ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
      )}
    >
      <span className="w-3.5 shrink-0">{selected && <TbCheck size={13} />}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

/** Filter · Sort · Group, shared by every tab so a view change keeps the query. */
export function WorkspaceToolbar({
  filters, setFilters, sort, setSort, group, setGroup, statuses, people, resultCount, totalCount,
}: {
  filters: WorkspaceFilters;
  setFilters: (f: WorkspaceFilters) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  group: GroupKey;
  setGroup: (g: GroupKey) => void;
  statuses: WorkflowStatus[];
  people: PersonOption[];
  resultCount: number;
  totalCount: number;
}) {
  const filtersActive =
    filters.assigneeId !== "all" || filters.statusId !== "all" ||
    filters.priority !== "all" || filters.overdueOnly || Boolean(filters.search);

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b glass-header px-4 py-2">
      <div className="relative">
        <TbSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Search tasks…"
          className="w-52 rounded-lg border border-stone-200 py-1.5 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <Menu label="Filter" icon={<TbFilter size={14} />} active={filtersActive}>
        {() => (
          <div className="space-y-2">
            <div>
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">Assignee</p>
              <Row label="Anyone" selected={filters.assigneeId === "all"} onClick={() => setFilters({ ...filters, assigneeId: "all" })} />
              <Row label="Unassigned" selected={filters.assigneeId === "none"} onClick={() => setFilters({ ...filters, assigneeId: "none" })} />
              <div className="max-h-40 overflow-auto">
                {people.map((p) => (
                  <Row key={p.id} label={p.fullName} selected={filters.assigneeId === p.id} onClick={() => setFilters({ ...filters, assigneeId: p.id })} />
                ))}
              </div>
            </div>
            <div className="border-t pt-1.5">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</p>
              <Row label="Any status" selected={filters.statusId === "all"} onClick={() => setFilters({ ...filters, statusId: "all" })} />
              {statuses.map((s) => (
                <Row key={s.id} label={s.name} selected={filters.statusId === s.id} onClick={() => setFilters({ ...filters, statusId: s.id })} />
              ))}
            </div>
            <div className="border-t pt-1.5">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">Priority</p>
              {["all", "High", "Medium", "Low"].map((pr) => (
                <Row key={pr} label={pr === "all" ? "Any priority" : pr} selected={filters.priority === pr} onClick={() => setFilters({ ...filters, priority: pr })} />
              ))}
            </div>
            <div className="border-t pt-1.5">
              <Row label="Overdue only" selected={filters.overdueOnly} onClick={() => setFilters({ ...filters, overdueOnly: !filters.overdueOnly })} />
            </div>
          </div>
        )}
      </Menu>

      <Menu label={SORTS.find((s) => s.key === sort)?.label ?? "Sort"} icon={<TbArrowsSort size={14} />} active={sort !== "position"}>
        {(close) => (
          <div>
            {SORTS.map((s) => (
              <Row key={s.key} label={s.label} selected={sort === s.key} onClick={() => { setSort(s.key); close(); }} />
            ))}
          </div>
        )}
      </Menu>

      <Menu label="Group" icon={<TbLayoutList size={14} />} active={group !== "none"}>
        {(close) => (
          <div>
            {GROUPS.map((g) => (
              <Row key={g.key} label={g.label} selected={group === g.key} onClick={() => { setGroup(g.key); close(); }} />
            ))}
          </div>
        )}
      </Menu>

      {filtersActive && (
        <button
          onClick={() => setFilters(EMPTY_FILTERS)}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100"
        >
          <TbX size={13} /> Clear
        </button>
      )}

      <span className="ml-auto text-[11px] text-stone-400">
        {resultCount === totalCount ? `${totalCount} tasks` : `${resultCount} of ${totalCount} tasks`}
      </span>
    </div>
  );
}
