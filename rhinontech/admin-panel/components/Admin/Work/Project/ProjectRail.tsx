"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  TbChevronLeft, TbChevronRight, TbFolder, TbLock, TbPlus, TbSearch, TbUsers,
} from "react-icons/tb";
import type { ProjectSummary } from "./types";

/** Stable per-project accent, so a project keeps its colour across sessions. */
const ACCENTS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-orange-500",
];
export function accentFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

/**
 * Persistent project navigation, so switching projects never means going back
 * out to a list. Mirrors the "Projects and folders" rail in the reference UI.
 */
export function ProjectRail({
  activeId, roleSlug, hrefFor, showAllProjectsLink = true,
}: {
  activeId: string;
  roleSlug: string;
  /** Where a project row links. Lets the collaborator shell reuse this rail. */
  hrefFor?: (projectId: string) => string;
  showAllProjectsLink?: boolean;
}) {
  const linkTo = hrefFor ?? ((id: string) => `/${roleSlug}/work/projects/${id}`);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    apiFetch<ProjectSummary[]>("/work/projects")
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  const visible = projects.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  if (collapsed) {
    return (
      <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r glass-sidenav py-2">
        <button
          onClick={() => setCollapsed(false)}
          title="Show projects"
          className="rounded-lg p-2 text-stone-500 hover:bg-white"
        >
          <TbChevronRight size={16} />
        </button>
        {visible.slice(0, 12).map((p) => (
          <Link
            key={p.id}
            href={linkTo(p.id)}
            title={p.name}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white transition",
              accentFor(p.id),
              p.id === activeId ? "ring-2 ring-stone-900 ring-offset-1" : "opacity-70 hover:opacity-100"
            )}
          >
            {p.name.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 2).toUpperCase()}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r glass-sidenav md:flex">
      <div className="flex items-center gap-1 px-3 pt-3">
        <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          Projects
        </span>
        {showAllProjectsLink && (
          <Link
            href={`/${roleSlug}/work/clients`}
            title="All projects"
            className="rounded p-1 text-stone-400 hover:bg-white hover:text-stone-700"
          >
            <TbPlus size={14} />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(true)}
          title="Collapse"
          className="rounded p-1 text-stone-400 hover:bg-white hover:text-stone-700"
        >
          <TbChevronLeft size={14} />
        </button>
      </div>

      <div className="px-3 py-2">
        <div className="relative">
          <TbSearch size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a project"
            className="w-full rounded-lg border border-stone-200 bg-white/70 py-1.5 pl-7 pr-2 text-xs outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-auto px-2 pb-3">
        {visible.map((p) => {
          const active = p.id === activeId;
          return (
            <Link
              key={p.id}
              href={linkTo(p.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition",
                active ? "bg-stone-900 text-white shadow-sm" : "text-stone-700 hover:bg-white"
              )}
            >
              <span className={cn("h-2 w-2 shrink-0 rounded-full", accentFor(p.id))} />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              {p.visibility === "team" && <TbUsers size={12} className={active ? "text-white/70" : "text-indigo-500"} />}
              {p.visibility === "private" && <TbLock size={12} className={active ? "text-white/70" : "text-amber-500"} />}
            </Link>
          );
        })}
        {!visible.length && (
          <p className="px-2 py-6 text-center text-xs text-stone-400">
            {projects.length ? "No match." : "No projects yet."}
          </p>
        )}
      </nav>
    </aside>
  );
}
