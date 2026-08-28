"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { ApiTask, PersonOption, ProjectOption, TaskPatch, TaskScope, TeamOption } from "./types";

interface ServerFilters {
  scope: TaskScope;
  projectId: string;
  teamId: string;
  priority: string;
  tag: string;
}

/**
 * Owns everything fetched from the API. Server-side filters (scope/project/
 * priority/tag) live here and drive refetches; status/search are client-side and
 * deliberately do not.
 */
export function useTasksData(filters: ServerFilters) {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [people, setPeople] = useState<PersonOption[]>([]);
  /** False when /people 403s — the board then derives sections from tasks alone. */
  const [rosterAvailable, setRosterAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  // Kept in a ref so patchTask can roll back without re-creating itself on every
  // task change (which would retrigger every consumer's effects).
  const tasksRef = useRef<ApiTask[]>([]);
  tasksRef.current = tasks;

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams({ scope: filters.scope });
    if (filters.projectId !== "all") q.set("projectId", filters.projectId);
    if (filters.teamId !== "all") q.set("teamId", filters.teamId);
    if (filters.priority !== "all") q.set("priority", filters.priority);
    if (filters.tag) q.set("tag", filters.tag);
    return q.toString();
  }, [filters.scope, filters.projectId, filters.teamId, filters.priority, filters.tag]);

  const load = useCallback(async (quiet: boolean) => {
    if (!quiet) setLoading(true);
    try {
      const data = await apiFetch<ApiTask[]>(`/tasks?${buildQuery()}`);
      setTasks(data);
    } catch {
      if (!quiet) setTasks([]);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { load(false); }, [load]);

  /**
   * Refetch without blanking the board. Required after every mutation because
   * three server-side effects can't be modelled optimistically: a recurring task
   * moved to Done spawns a new instance; reassigning away from yourself under
   * scope=my should remove the card; status changes sync a linked ClientRequest.
   */
  const refetchQuiet = useCallback(() => load(true), [load]);
  const refetch = useCallback(() => load(false), [load]);

  useEffect(() => {
    apiFetch<ProjectOption[]>("/work/projects")
      .then(setProjects)
      .catch(() => setProjects([]));

    // Only the teams you belong to come back, so an empty list just means the
    // filter has nothing to offer — not an error.
    apiFetch<TeamOption[]>("/teams")
      .then((d) => setTeams(d.map((t) => ({ id: t.id, name: t.name }))))
      .catch(() => setTeams([]));

    apiFetch<any[]>("/people")
      .then((d) => {
        setPeople(d.map((e) => ({
          id: e.id,
          fullName: e.fullName,
          companyEmail: e.companyEmail,
          department: e.department ?? null,
        })));
        setRosterAvailable(true);
      })
      .catch(() => {
        // Most likely a 403: DEFAULT_ROLE_GRANTS omits people:read, so a newly
        // created role can reach Work without being able to list employees.
        setPeople([]);
        setRosterAvailable(false);
      });
  }, []);

  /**
   * Optimistic PUT with snapshot rollback. Patches the nested assignee/project
   * objects too, because every renderer reads `task.assignee?.fullName` rather
   * than the id.
   */
  const patchTask = useCallback(async (id: string, patch: TaskPatch) => {
    const snapshot = tasksRef.current;

    setTasks((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const next = { ...t, ...patch } as ApiTask;
      if (patch.assigneeId !== undefined) {
        const p = people.find((e) => e.id === patch.assigneeId);
        next.assignee = p ? { id: p.id, fullName: p.fullName, companyEmail: p.companyEmail } : null;
      }
      if (patch.projectId !== undefined) {
        const pr = projects.find((p) => p.id === patch.projectId);
        next.project = pr ? { id: pr.id, name: pr.name, status: pr.status ?? "Active" } : null;
      }
      return next;
    }));

    try {
      await apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(patch) });
      refetchQuiet();
    } catch (err: any) {
      setTasks(snapshot);
      // A 403 here is expected — an employee moving someone else's card. Say so
      // rather than swallowing it, which is what the old page did.
      toast.error(err?.message || "Couldn't update that task.");
    }
  }, [people, projects, refetchQuiet]);

  const removeTask = useCallback(async (id: string) => {
    const snapshot = tasksRef.current;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await apiFetch(`/tasks/${id}`, { method: "DELETE" });
    } catch (err: any) {
      setTasks(snapshot);
      toast.error(err?.message || "Couldn't delete that task.");
    }
  }, []);

  return { tasks, projects, teams, people, rosterAvailable, loading, refetch, refetchQuiet, patchTask, removeTask, setTasks };
}
