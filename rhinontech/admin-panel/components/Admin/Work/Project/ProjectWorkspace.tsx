"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSideNav } from "@/context/SideNavContext";
import { cn } from "@/lib/utils";
import {
  TbArrowLeft, TbCalendar, TbChartPie, TbChevronRight, TbLayoutKanban, TbLoader,
  TbLock, TbPaperclip, TbTable, TbTimeline, TbUsers,
} from "react-icons/tb";
import { BoardView } from "./BoardView";
import { CalendarView } from "./CalendarView";
import { AnalyticsView } from "./AnalyticsView";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import { WorkspaceToolbar } from "./WorkspaceToolbar";
import { ProjectRail, accentFor } from "./ProjectRail";
import { FilesView } from "./FilesView";
import { GanttView } from "./GanttView";
import { TableView } from "./TableView";
import { useProjectWorkspace } from "./useProjectWorkspace";
import type { ProjectTask } from "./types";

type Tab = "table" | "board" | "gantt" | "files" | "analytics" | "calendar";

/** Each tab carries its own accent so the view you are in is obvious at a glance. */
const TABS: { key: Tab; label: string; icon: React.ReactNode; accent: string; tint: string }[] = [
  { key: "table",     label: "Table",       icon: <TbTable size={15} />,        accent: "border-blue-500 text-blue-700",       tint: "text-blue-500" },
  { key: "board",     label: "Board",       icon: <TbLayoutKanban size={15} />, accent: "border-violet-500 text-violet-700",   tint: "text-violet-500" },
  { key: "gantt",     label: "Gantt chart", icon: <TbTimeline size={15} />,     accent: "border-emerald-500 text-emerald-700", tint: "text-emerald-500" },
  { key: "files",     label: "Files",       icon: <TbPaperclip size={15} />,    accent: "border-amber-500 text-amber-700",     tint: "text-amber-500" },
  { key: "analytics", label: "Analytics",   icon: <TbChartPie size={15} />,     accent: "border-rose-500 text-rose-700",       tint: "text-rose-500" },
  { key: "calendar",  label: "Calendar",    icon: <TbCalendar size={15} />,     accent: "border-cyan-500 text-cyan-700",       tint: "text-cyan-500" },
];

/**
 * The per-project workspace: one dataset, six ways of looking at it.
 *
 * Tabs that aren't built yet are shown but disabled rather than hidden, so the
 * shape of the finished thing is visible and nobody wonders where a view went.
 */
export function ProjectWorkspace({
  projectId, roleSlug, mode = "internal", hrefFor, onSignOut,
}: {
  projectId: string;
  roleSlug: string;
  /**
   * "collaborator" renders the same six tabs against the same hooks, with the
   * internal-only affordances hidden. The API already refuses those actions for
   * a guest — hiding them keeps the UI from offering buttons that 403.
   */
  mode?: "internal" | "collaborator";
  hrefFor?: (projectId: string) => string;
  onSignOut?: () => void;
}) {
  const isCollab = mode === "collaborator";
  const { setSideNav } = useSideNav();
  const [tab, setTab] = useState<Tab>("table");

  /**
   * The workspace has its own project rail, so the Work sub-nav is redundant
   * here and only costs width. Collapse on entry and put it back on the way
   * out, so the module's other pages keep their navigation.
   */
  useEffect(() => {
    setSideNav(false);
    return () => setSideNav(true);
  }, [setSideNav]);
  const [openTask, setOpenTask] = useState<ProjectTask | null>(null);
  const ws = useProjectWorkspace(projectId);

  if (ws.loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-stone-400">
        <TbLoader className="mr-2 animate-spin" size={16} /> Loading project…
      </div>
    );
  }

  if (!ws.project) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-medium text-stone-700">Project not found</p>
        <p className="max-w-sm text-xs text-stone-500">
          It may have been deleted, or its visibility changed so it is no longer shared with you.
        </p>
        {!isCollab && (
          <Link href={`/${roleSlug}/work/clients`} className="mt-1 text-xs font-medium text-blue-600 underline">
            Back to projects
          </Link>
        )}
      </div>
    );
  }

  const p = ws.project;
  // Read the open task back out of the live list so the drawer reflects edits
  // made from the table or board rather than showing a stale snapshot.
  const live = openTask ? ws.tasks.find((t) => t.id === openTask.id) ?? null : null;

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-xl glass-panel">
      <ProjectRail
        activeId={projectId}
        roleSlug={roleSlug}
        hrefFor={hrefFor}
        showAllProjectsLink={!isCollab}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="shrink-0 border-b glass-header px-4 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          {isCollab ? (
            <>
              <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                Collaborator
              </span>
              <TbChevronRight size={12} />
              <span className="truncate text-stone-700">{p.name}</span>
              {onSignOut && (
                <button onClick={onSignOut} className="ml-auto text-xs text-stone-500 hover:text-stone-800">
                  Sign out
                </button>
              )}
            </>
          ) : (
            <>
              <Link href={`/${roleSlug}/work/clients`} className="flex items-center gap-1 hover:text-stone-800">
                <TbArrowLeft size={13} /> Projects
              </Link>
              <TbChevronRight size={12} />
              <span className="truncate text-stone-700">{p.name}</span>
            </>
          )}
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white", accentFor(p.id))}>
            {p.name.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 2).toUpperCase()}
          </span>
          <h1 className="truncate text-xl font-bold tracking-tight text-stone-900">{p.name}</h1>
          {p.visibility === "team" && (
            <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
              <TbUsers size={11} /> {p.team?.name ?? "Team"}
            </span>
          )}
          {p.visibility === "private" && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              <TbLock size={11} /> Private
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition",
                tab === t.key
                  ? t.accent
                  : "border-transparent text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              )}
            >
              <span className={tab === t.key ? "" : t.tint}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Filter/Sort/Group live above the tab body so a view switch keeps the query. */}
          <WorkspaceToolbar
            filters={ws.filters}
            setFilters={ws.setFilters}
            sort={ws.sort}
            setSort={ws.setSort}
            group={ws.group}
            setGroup={ws.setGroup}
            statuses={ws.statuses}
            people={ws.people}
            resultCount={ws.rows.length}
            totalCount={ws.totalCount}
          />
          <div className="min-h-0 flex-1">
        {tab === "table" && (
          <TableView
            rows={ws.rows}
            statuses={ws.statuses}
            fields={ws.fields}
            people={ws.people}
            collapsed={ws.collapsed}
            rosterAvailable={ws.rosterAvailable}
            group={ws.group}
            readOnlyColumns={isCollab}
            onToggleCollapsed={ws.toggleCollapsed}
            onPatch={ws.patchTask}
            onCreate={ws.createTask}
            onDelete={ws.deleteTask}
            onAddField={ws.addField}
            onRemoveField={ws.removeField}
            onOpenTask={setOpenTask}
          />
        )}

        {tab === "board" && (
          <BoardView
            rows={ws.rows}
            statuses={ws.statuses}
            people={ws.people}
            onPatch={ws.patchTask}
            onCreateInStatus={ws.createInStatus}
            onOpenTask={setOpenTask}
          />
        )}

        {tab === "gantt" && (
          <GanttView
            rows={ws.rows}
            statuses={ws.statuses}
            collapsed={ws.collapsed}
            onToggleCollapsed={ws.toggleCollapsed}
            onPatch={ws.patchTask}
            onOpenTask={setOpenTask}
            onAddDependency={ws.addDependency}
            onRemoveDependency={ws.removeDependency}
          />
        )}

        {tab === "files" && (
          <FilesView projectId={projectId} rows={ws.rows} onChanged={ws.refetch} />
        )}

        {tab === "analytics" && (
          <AnalyticsView rows={ws.rows} statuses={ws.statuses} />
        )}

        {tab === "calendar" && (
          <CalendarView
            rows={ws.rows}
            onOpenTask={setOpenTask}
            onCreateOnDate={(date) => {
              const title = window.prompt(`New task on ${date.toDateString()}`);
              if (title?.trim()) ws.createOnDate(title, date);
            }}
          />
        )}
          </div>
        </div>

      </div>
      </div>

      {/* Sibling of the rail + content column, not of the tab body — otherwise
          the drawer starts below the header and toolbar instead of running the
          full height of the panel. */}
      {live && (
        <TaskDetailDrawer
          task={live}
          rows={ws.rows}
          statuses={ws.statuses}
          people={ws.people}
          projectName={p.name}
          canShareWithGuests={!isCollab}
          onClose={() => setOpenTask(null)}
          onPatch={ws.patchTask}
          onDelete={ws.deleteTask}
          onCreateChild={(title, parentId) => ws.createTask(title, parentId)}
          onRemoveDependency={ws.removeDependency}
          onChanged={ws.refetch}
        />
      )}
    </div>
  );
}
