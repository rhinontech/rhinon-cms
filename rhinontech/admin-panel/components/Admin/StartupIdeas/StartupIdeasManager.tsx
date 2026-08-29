"use client";

import { useCallback, useEffect, useState } from "react";
import { TbBulb, TbSearch, TbRefresh, TbBuilding, TbCurrencyRupee } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { StartupIdeaDetail } from "./StartupIdeaDetail";
import {
  STARTUP_IDEA_STATUSES,
  STATUS_STYLES,
  type StartupIdea,
  type StartupIdeaListResponse,
} from "./types";

const FILTERS = ["All", ...STARTUP_IDEA_STATUSES] as const;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function StartupIdeasManager() {
  const [items, setItems] = useState<StartupIdea[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "All") params.set("status", filter);
      if (query) params.set("q", query);
      const data = await apiFetch<StartupIdeaListResponse>(`/startup-ideas?${params.toString()}`);
      setItems(data.ideas);
      setCounts(data.counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    // No sub-nav on this module, so no SideNavProvider above it — keep the panel corners plain.
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl glass-panel">
      <div className="flex h-16 items-center justify-between gap-4 border-b px-4">
        <div className="min-w-0">
          <h1 className="text-base font-semibold tracking-tight text-foreground">Startup Ideas</h1>
          <p className="truncate text-xs text-muted-foreground">
            Founders who submitted an idea on rhinonlabs.com/build. Separate from the CRM until you convert one.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <TbSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, college…"
              className="w-56 rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary/40"
            />
          </div>
          <button
            onClick={fetchItems}
            className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Refresh"
          >
            <TbRefresh size={15} />
          </button>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg border px-3 py-1 text-xs font-medium transition-colors",
              filter === f
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            {f}
            {counts[f] !== undefined && (
              <span className="ml-1.5 text-[10px] text-muted-foreground/70">{counts[f]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 gap-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
            ))
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <TbBulb size={28} className="text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {query || filter !== "All" ? "Nothing matches that filter." : "No startup ideas submitted yet."}
              </p>
            </div>
          ) : (
            items.map((idea) => (
              <div
                key={idea.id}
                onClick={() => setSelectedId(idea.id)}
                className={cn(
                  "group cursor-pointer rounded-xl border p-4 transition-colors hover:bg-muted/40",
                  idea.isRead ? "border-border bg-card" : "border-primary/30 bg-primary/[0.04]"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!idea.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      <h3 className="truncate text-sm font-bold text-foreground">{idea.name}</h3>
                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest",
                          STATUS_STYLES[idea.status]
                        )}
                      >
                        {idea.status}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{idea.idea}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground/80">
                      <span className="truncate">{idea.email}</span>
                      {idea.organization && (
                        <span className="inline-flex items-center gap-1">
                          <TbBuilding size={11} />
                          {idea.organization}
                        </span>
                      )}
                      {idea.stage && (
                        <span className="rounded bg-muted/60 px-1.5 py-0.5">{idea.stage}</span>
                      )}
                      {idea.budget && (
                        <span className="inline-flex items-center gap-1">
                          <TbCurrencyRupee size={11} />
                          {idea.budget}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground/70">{timeAgo(idea.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedId && (
        <StartupIdeaDetail id={selectedId} onClose={() => setSelectedId(null)} onChanged={fetchItems} />
      )}
    </main>
  );
}
