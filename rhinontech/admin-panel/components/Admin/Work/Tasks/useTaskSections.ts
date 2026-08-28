"use client";

import { useMemo } from "react";
import { NO_PROJECT_KEY, UNASSIGNED_KEY } from "./constants";
import { isOverdue } from "./utils";
import type {
  ApiTask, GroupMode, PersonOption, ProjectOption, SectionKind, TaskScope, TaskSection,
} from "./types";

interface Args {
  tasks: ApiTask[];
  people: PersonOption[];
  projects: ProjectOption[];
  rosterAvailable: boolean;
  group: GroupMode;
  scope: TaskScope;
  me: { userId: string | null; fullName: string; department: string | null };
  /** True when the backend does NOT narrow scope=team to the caller's department. */
  seesAllDepartments: boolean;
}

function countOf(tasks: ApiTask[]): TaskSection["counts"] {
  return {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "Pending").length,
    inProgress: tasks.filter((t) => t.status === "In progress").length,
    done: tasks.filter((t) => t.status === "Done").length,
    overdue: tasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
  };
}

/**
 * Merges the employee/project roster with the loaded tasks into an ordered list
 * of sections. The roster is what lets a person with zero tasks still get a
 * (collapsed) section — "who is free" is half the point of the board.
 */
export function useTaskSections({
  tasks, people, projects, rosterAvailable, group, scope, me, seesAllDepartments,
}: Args): TaskSection[] {
  return useMemo(() => {
    const buckets = new Map<string, ApiTask[]>();
    const keyOf = (t: ApiTask) =>
      group === "person"
        ? t.assigneeId ?? UNASSIGNED_KEY
        : t.project?.id ?? NO_PROJECT_KEY;

    for (const t of tasks) {
      const k = keyOf(t);
      const list = buckets.get(k);
      if (list) list.push(t); else buckets.set(k, [t]);
    }

    const make = (key: string, kind: SectionKind, label: string, sublabel?: string, isMe = false): TaskSection => {
      const list = buckets.get(key) ?? [];
      return { key, kind, label, sublabel, isMe, tasks: list, counts: countOf(list) };
    };

    // ---- Project mode -------------------------------------------------------
    if (group === "project") {
      const roster = rosterAvailable
        ? [...projects].sort((a, b) => a.name.localeCompare(b.name))
        : projects;

      const sections = roster.map((p) => make(p.id, "project", p.name, p.status));

      // Any project referenced by a task but missing from the roster (deleted,
      // or the roster call failed) still needs a home.
      const known = new Set(roster.map((p) => p.id));
      for (const [key, list] of buckets) {
        if (key === NO_PROJECT_KEY || known.has(key)) continue;
        sections.push(make(key, "project", list[0]?.project?.name ?? "Unknown project"));
      }

      sections.push(make(NO_PROJECT_KEY, "no-project", "No project"));
      return sections;
    }

    // ---- Person mode --------------------------------------------------------
    // When the roster is unavailable, fall back to exactly the old behaviour:
    // sections derived from the tasks that loaded, nobody else.
    if (!rosterAvailable) {
      const sections: TaskSection[] = [];
      for (const [key, list] of buckets) {
        if (key === UNASSIGNED_KEY) continue;
        sections.push(make(key, "person", list[0]?.assignee?.fullName ?? "Unknown", undefined, key === me.userId));
      }
      sections.sort((a, b) => (a.isMe ? -1 : b.isMe ? 1 : a.label.localeCompare(b.label)));
      // With scope=my and nothing assigned yet there'd be no section at all and
      // therefore nowhere to click "+". Synthesise one from the signed-in user.
      if (scope === "my" && sections.length === 0 && me.userId) {
        sections.push(make(me.userId, "person", me.fullName || "You", undefined, true));
      }
      if (buckets.has(UNASSIGNED_KEY)) sections.push(make(UNASSIGNED_KEY, "unassigned", "Unassigned"));
      return sections;
    }

    let roster = people;
    if (scope === "my") {
      roster = people.filter((p) => p.id === me.userId);
      if (roster.length === 0 && me.userId) {
        roster = [{ id: me.userId, fullName: me.fullName || "You", companyEmail: "", department: me.department }];
      }
    } else if (scope === "team") {
      // The backend filters `assigneeId <> me` and, for users without
      // work:write/employees:read, narrows to the caller's own department. Mirror
      // both, or the board shows permanently-empty sections that can never fill.
      roster = people.filter((p) => p.id !== me.userId);
      if (!seesAllDepartments && me.department) {
        roster = roster.filter((p) => p.department === me.department);
      }
    }

    const sections = [...roster]
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .map((p) => make(p.id, "person", p.fullName, p.department ?? undefined, p.id === me.userId));

    // Former members are kept off the board — but only once their work is
    // finished. Someone who left mid-task still gets a section, because those
    // tasks are real, unfinished, and would otherwise be invisible to everyone
    // and impossible to reassign. Their section disappears by itself as soon as
    // the last one is closed out.
    const known = new Set(roster.map((p) => p.id));
    const orphans: TaskSection[] = [];
    for (const [key, list] of buckets) {
      if (key === UNASSIGNED_KEY || known.has(key)) continue;
      if (!list.some((t) => t.status !== "Done")) continue;
      orphans.push(make(key, "inactive-person", list[0]?.assignee?.fullName ?? "Unknown", "No longer active — needs reassigning"));
    }
    orphans.sort((a, b) => a.label.localeCompare(b.label));

    // me → everyone else alphabetically → former members → Unassigned last.
    const mine = sections.filter((s) => s.isMe);
    const others = sections.filter((s) => !s.isMe);
    const ordered = [...mine, ...others, ...orphans];

    // scope=team can never contain unassigned rows (`assigneeId <> me` is NULL,
    // i.e. false, for them), so rendering the bucket there would be a lie.
    if (scope !== "team") ordered.push(make(UNASSIGNED_KEY, "unassigned", "Unassigned"));

    return ordered;
  }, [tasks, people, projects, rosterAvailable, group, scope, me.userId, me.fullName, me.department, seesAllDepartments]);
}
