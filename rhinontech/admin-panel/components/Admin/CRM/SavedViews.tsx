"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TbBookmark, TbChevronDown, TbTrash, TbCheck, TbPlus } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

export interface SavedView {
  id: string;
  name: string;
  entity: "lead" | "deal" | "account";
  filters: Record<string, string>;
  isShared: boolean;
  createdById: string;
  creator?: { id: string; fullName: string };
}

/**
 * Named filter sets for a list screen.
 *
 * Filters are stored as the same query shape the list endpoint already takes,
 * so applying a view is just handing those values back to the page — no second
 * query language to keep in sync.
 */
export function SavedViews({
  entity,
  currentFilters,
  activeViewId,
  onApply,
}: {
  entity: "lead" | "deal" | "account";
  currentFilters: Record<string, string>;
  activeViewId: string | null;
  onApply: (view: SavedView | null) => void;
}) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [open, setOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setViews(await apiFetch<SavedView[]>(`/crm/views?entity=${entity}`));
    } catch { /* views are a convenience; never block the list on them */ }
  }, [entity]);

  useEffect(() => { load(); }, [load]);

  // Close on any click outside the control.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setNaming(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await apiFetch("/crm/views", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), entity, filters: currentFilters }),
      });
      setName("");
      setNaming(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (view: SavedView) => {
    if (!confirm(`Delete the "${view.name}" view?`)) return;
    try {
      await apiFetch(`/crm/views/${view.id}`, { method: "DELETE" });
      if (activeViewId === view.id) onApply(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const active = views.find((v) => v.id === activeViewId) || null;
  const hasFilters = Object.values(currentFilters).some(Boolean);

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
          active
            ? "border-blue-200 dark:border-blue-400/25 bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300"
            : "border-border bg-card/70 text-foreground/85 hover:bg-muted"
        )}
      >
        <TbBookmark size={13} />
        <span className="max-w-[130px] truncate">{active ? active.name : "Views"}</span>
        <TbChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-64 rounded-lg border border-border bg-card p-1 shadow-lg">
          {views.length === 0 && !naming && (
            <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">No saved views yet.</p>
          )}

          {active && (
            <button
              onClick={() => { onApply(null); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-muted-foreground hover:bg-muted/40"
            >
              Clear view
            </button>
          )}

          {views.map((view) => (
            <div key={view.id} className="group flex items-center gap-1 rounded hover:bg-muted/40">
              <button
                onClick={() => { onApply(view); setOpen(false); }}
                className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left"
              >
                <span className="w-3 shrink-0">
                  {activeViewId === view.id && <TbCheck size={12} className="text-blue-600 dark:text-blue-300" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] text-foreground">{view.name}</span>
                  {view.creator && (
                    <span className="block truncate text-[10px] text-muted-foreground">{view.creator.fullName}</span>
                  )}
                </span>
              </button>
              <button
                onClick={() => remove(view)}
                className="mr-1 rounded p-1 text-muted-foreground/70 opacity-0 transition-opacity hover:bg-rose-50 dark:hover:bg-rose-400/10 hover:text-rose-600 dark:hover:text-rose-300 group-hover:opacity-100"
                title="Delete view"
              >
                <TbTrash size={12} />
              </button>
            </div>
          ))}

          <div className="mt-1 border-t border-border pt-1">
            {naming ? (
              <div className="flex items-center gap-1 p-1">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") save();
                    if (e.key === "Escape") setNaming(false);
                  }}
                  placeholder="View name"
                  className="min-w-0 flex-1 rounded border border-border px-2 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <button
                  onClick={save}
                  disabled={busy || !name.trim()}
                  className="rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setNaming(true)}
                disabled={!hasFilters}
                title={hasFilters ? undefined : "Set a filter first"}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground/85 hover:bg-muted/40 disabled:cursor-not-allowed disabled:text-muted-foreground/70 disabled:hover:bg-transparent"
              >
                <TbPlus size={12} /> Save current filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
