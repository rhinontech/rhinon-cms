"use client";

import { useCallback, useEffect, useState } from "react";
import { LEGACY_LS_KEYS, LS } from "./constants";
import type { GroupMode, TaskScope, ViewMode } from "./types";

export interface TaskFilters {
  project: string;
  team: string;
  status: string;
  priority: string;
  tag: string;
  hideDone: boolean;
}

const DEFAULT_FILTERS: TaskFilters = {
  project: "all", team: "all", status: "all", priority: "all", tag: "",
  // 74 of 113 live tasks are Done — showing them by default buries everything else.
  hideDone: true,
};

type SectionOverrides = Record<GroupMode, Record<string, boolean>>;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * All persisted view preferences.
 *
 * Everything initialises to a default and only adopts stored values inside a
 * mount effect. Reading localStorage in a useState initialiser (what the old page
 * did) runs during hydration but returned defaults on the server, which is a
 * guaranteed React hydration mismatch for anyone with non-default filters.
 */
export function useTaskPrefs(initialScope?: TaskScope) {
  const [hydrated, setHydrated] = useState(false);
  const [scope, setScope] = useState<TaskScope>(initialScope ?? "all");
  const [view, setView] = useState<ViewMode>("kanban");
  const [group, setGroup] = useState<GroupMode>("person");
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [sectionOverrides, setSectionOverrides] = useState<SectionOverrides>({ person: {}, project: {} });

  useEffect(() => {
    try {
      // One-time cleanup. The v1 keys hold bare strings, so anything that tries
      // to JSON.parse them throws — they are removed, never migrated.
      if (!localStorage.getItem(LS.migrated)) {
        LEGACY_LS_KEYS.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(LS.migrated, "1");
      }

      // An explicit ?scope= in the URL outranks whatever was stored.
      if (!initialScope) {
        const s = localStorage.getItem(LS.scope);
        if (s === "my" || s === "team" || s === "all") setScope(s);
      }
      const v = localStorage.getItem(LS.view);
      if (v === "list" || v === "kanban") setView(v);
      const g = localStorage.getItem(LS.group);
      if (g === "person" || g === "project") setGroup(g);

      setFilters({ ...DEFAULT_FILTERS, ...readJson<Partial<TaskFilters>>(LS.filters, {}) });
      setSectionOverrides(readJson<SectionOverrides>(LS.sections, { person: {}, project: {} }));
    } catch {
      /* private mode / disabled storage — defaults are fine */
    }
    setHydrated(true);
  }, [initialScope]);

  // Guarded on `hydrated` so the defaults aren't written back over storage in
  // the tick before the read above lands.
  useEffect(() => { if (hydrated) try { localStorage.setItem(LS.scope, scope); } catch {} }, [scope, hydrated]);
  useEffect(() => { if (hydrated) try { localStorage.setItem(LS.view, view); } catch {} }, [view, hydrated]);
  useEffect(() => { if (hydrated) try { localStorage.setItem(LS.group, group); } catch {} }, [group, hydrated]);
  useEffect(() => { if (hydrated) try { localStorage.setItem(LS.filters, JSON.stringify(filters)); } catch {} }, [filters, hydrated]);
  useEffect(() => { if (hydrated) try { localStorage.setItem(LS.sections, JSON.stringify(sectionOverrides)); } catch {} }, [sectionOverrides, hydrated]);

  const setFilter = useCallback(<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
  }, []);

  const toggleSection = useCallback((key: string, open: boolean) => {
    setSectionOverrides((prev) => ({ ...prev, [group]: { ...prev[group], [key]: open } }));
  }, [group]);

  const setAllSections = useCallback((keys: string[], open: boolean) => {
    setSectionOverrides((prev) => ({
      ...prev,
      [group]: { ...prev[group], ...Object.fromEntries(keys.map((k) => [k, open])) },
    }));
  }, [group]);

  return {
    hydrated,
    scope, setScope,
    view, setView,
    group, setGroup,
    filters, setFilter,
    search, setSearch,
    overrides: sectionOverrides[group],
    toggleSection, setAllSections,
  };
}
