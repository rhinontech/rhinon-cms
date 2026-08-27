"use client";

import {
  TbAlertTriangle, TbBriefcase, TbChevronDown, TbChevronRight, TbLayoutKanban,
  TbList, TbPlus, TbSearch, TbUsers,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { PRIORITIES, STATUSES } from "./constants";
import type { GroupMode, ProjectOption, TaskScope, ViewMode } from "./types";
import type { TaskFilters } from "./useTaskPrefs";

const SCOPES: { key: TaskScope; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "my", label: "My tasks" },
  { key: "team", label: "My team" },
];

function Segmented<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { key: T; label: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-stone-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
            value === o.key ? "bg-white font-semibold text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TasksToolbar({
  scope, setScope, view, setView, group, setGroup, filters, setFilter,
  search, setSearch, projects, allTags, rosterAvailable,
  onExpandAll, onCollapseAll, onAdd,
}: {
  scope: TaskScope;
  setScope: (s: TaskScope) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  group: GroupMode;
  setGroup: (g: GroupMode) => void;
  filters: TaskFilters;
  setFilter: <K extends keyof TaskFilters>(k: K, v: TaskFilters[K]) => void;
  search: string;
  setSearch: (s: string) => void;
  projects: ProjectOption[];
  allTags: string[];
  rosterAvailable: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onAdd: () => void;
}) {
  const selectClass = "rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-600 outline-none focus:border-stone-400";

  return (
    <div className="shrink-0 space-y-2 border-b px-3 py-2 sm:px-4">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented value={scope} options={SCOPES} onChange={setScope} />

        <Segmented
          value={group}
          options={[
            { key: "person", label: "Person", icon: <TbUsers size={13} /> },
            { key: "project", label: "Project", icon: <TbBriefcase size={13} /> },
          ]}
          onChange={setGroup}
        />

        <Segmented
          value={view}
          options={[
            { key: "list", label: "List", icon: <TbList size={13} /> },
            { key: "kanban", label: "Board", icon: <TbLayoutKanban size={13} /> },
          ]}
          onChange={setView}
        />

        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={onExpandAll} className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700" title="Expand all">
            <TbChevronDown size={15} />
          </button>
          <button onClick={onCollapseAll} className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700" title="Collapse all">
            <TbChevronRight size={15} />
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-stone-700"
          >
            <TbPlus size={14} /> Add a task
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <TbSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full rounded-lg border border-stone-200 bg-white py-1.5 pl-8 pr-2 text-xs outline-none focus:border-stone-400"
          />
        </div>

        {/* Hidden on the board: narrowing to one status would empty two of the
            three columns. The value is kept for when you switch back to list. */}
        {view === "list" && (
          <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)} className={selectClass}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        {group === "person" && (
          <select value={filters.project} onChange={(e) => setFilter("project", e.target.value)} className={selectClass}>
            <option value="all">All projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}

        <select value={filters.priority} onChange={(e) => setFilter("priority", e.target.value)} className={selectClass}>
          <option value="all">Any priority</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        {allTags.length > 0 && (
          <select value={filters.tag} onChange={(e) => setFilter("tag", e.target.value)} className={selectClass}>
            <option value="">All tags</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}

        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-stone-600">
          <input
            type="checkbox"
            checked={filters.hideDone}
            onChange={(e) => setFilter("hideDone", e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer accent-blue-600"
          />
          Hide done
        </label>
      </div>

      {!rosterAvailable && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-700">
          <TbAlertTriangle size={12} />
          Employee list unavailable — showing only people who have tasks.
        </p>
      )}
    </div>
  );
}
