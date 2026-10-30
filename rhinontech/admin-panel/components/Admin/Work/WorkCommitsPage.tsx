"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api";
import { useOrganization } from "@/lib/useOrganization";
import { cn } from "@/lib/utils";
import { TbChevronLeft, TbChevronRight, TbGitCommit, TbLoader, TbRefresh } from "react-icons/tb";
import { NativeSelect } from "@/components/ui/native-select";
import { CommitRow, type RepoCommit } from "./Project/GitHubView";

/** Business days are IST: a day is [00:00 IST, next 00:00 IST). */
const IST_OFFSET_MIN = 330;

function istDayBounds(day: string): { from: string; to: string } {
  const start = new Date(`${day}T00:00:00Z`).getTime() - IST_OFFSET_MIN * 60_000;
  return { from: new Date(start).toISOString(), to: new Date(start + 86400_000).toISOString() };
}

function istToday(): string {
  return new Date(Date.now() + IST_OFFSET_MIN * 60_000).toISOString().slice(0, 10);
}

function shiftDay(day: string, by: number): string {
  return new Date(new Date(`${day}T00:00:00Z`).getTime() + by * 86400_000).toISOString().slice(0, 10);
}

/**
 * Work → Commits: who shipped what on a given day, across every linked repo.
 * Grouped by person, since "what did everyone do yesterday" is the question.
 */
export function WorkCommitsPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [day, setDay] = useState(istToday);
  const [projectId, setProjectId] = useState("");
  const [commits, setCommits] = useState<RepoCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = istDayBounds(day);
      setCommits(await apiFetch<RepoCommit[]>(`/github/commits?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`));
      setError(null);
    } catch (err: any) {
      setError(err.message || "Could not load commits");
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => { if (organization?.isPlatform) load(); }, [load, organization?.isPlatform]);

  const projects = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of commits) if (c.project) m.set(c.project.id, c.project.name);
    return [...m].sort((a, b) => a[1].localeCompare(b[1]));
  }, [commits]);

  const groups = useMemo(() => {
    const m = new Map<string, { name: string; matched: boolean; commits: RepoCommit[] }>();
    for (const c of commits) {
      if (projectId && c.project?.id !== projectId) continue;
      const key = c.author?.id ?? `gh:${c.authorLogin ?? c.authorName ?? "unknown"}`;
      const name = c.author?.fullName ?? c.authorLogin ?? c.authorName ?? "Unknown";
      if (!m.has(key)) m.set(key, { name, matched: Boolean(c.author), commits: [] });
      m.get(key)!.commits.push(c);
    }
    return [...m.values()].sort((a, b) => b.commits.length - a.commits.length);
  }, [commits, projectId]);

  if (orgLoading) return null;
  if (!organization?.isPlatform) {
    return <p className="p-8 text-center text-sm text-muted-foreground">This module is not available to your workspace.</p>;
  }

  const total = groups.reduce((n, g) => n + g.commits.length, 0);
  const isToday = day === istToday();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b glass-header px-4 py-3">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Commits</h1>
        <p className="text-xs text-muted-foreground">Everything pushed to linked repositories, by day (IST).</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={() => setDay((d) => shiftDay(d, -1))} className="rounded-lg border border-border p-1.5 hover:bg-muted" title="Previous day">
            <TbChevronLeft size={14} />
          </button>
          <input
            type="date"
            value={day}
            max={istToday()}
            onChange={(e) => e.target.value && setDay(e.target.value)}
            className="rounded-lg border border-border bg-card px-2 py-1 text-xs outline-none focus:ring-[3px] focus:ring-ring/20"
          />
          <button
            onClick={() => setDay((d) => shiftDay(d, 1))}
            disabled={isToday}
            className="rounded-lg border border-border p-1.5 hover:bg-muted disabled:opacity-40"
            title="Next day"
          >
            <TbChevronRight size={14} />
          </button>
          {!isToday && (
            <button onClick={() => setDay(istToday())} className="text-xs text-blue-600 dark:text-blue-300 hover:underline">Today</button>
          )}
          <NativeSelect
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs outline-none"
          >
            <option value="">All projects</option>
            {projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </NativeSelect>
          <span className="ml-auto text-xs text-muted-foreground">
            {format(new Date(`${day}T00:00:00`), "EEEE, d MMM yyyy")} · {total} commit{total === 1 ? "" : "s"} · {groups.length} {groups.length === 1 ? "person" : "people"}
          </span>
          <button onClick={load} className="rounded-lg border border-border p-1.5 hover:bg-muted" title="Refresh">
            <TbRefresh size={14} className={cn(loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {loading && !commits.length ? (
          <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <TbLoader className="animate-spin" size={15} /> Loading commits…
          </p>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <p className="text-sm text-foreground/85">{error}</p>
            <button onClick={load} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">Retry</button>
          </div>
        ) : !groups.length ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <TbGitCommit size={28} className="text-muted-foreground" />
            <p className="text-sm text-foreground/85">No commits on this day.</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Repositories are linked per project, from the project's GitHub tab.
            </p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-4">
            {groups.map((g) => (
              <section key={g.name} className="rounded-xl border bg-card/60">
                <header className="flex items-center gap-2 border-b px-4 py-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground/70">
                    {g.name.slice(0, 2).toUpperCase()}
                  </span>
                  <h2 className="text-sm font-semibold text-foreground">{g.name}</h2>
                  {!g.matched && (
                    <span className="text-[11px] text-muted-foreground" title="Set their GitHub username on their employee profile to attribute these commits">
                      not linked to an employee
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{g.commits.length} commit{g.commits.length === 1 ? "" : "s"}</span>
                </header>
                {g.commits.map((c) => <CommitRow key={c.id} c={c} showProject />)}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
