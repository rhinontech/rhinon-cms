"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TbBuildingCommunity, TbRefresh, TbSearch } from "react-icons/tb";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { shortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Notice, Pill, type PillTone } from "@/components/Admin/Settings/parts";
import { WorkspaceDetail } from "./WorkspaceDetail";
import { needsAttention, type OrgRow } from "./types";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "attention", label: "Needs attention" },
  { key: "trial", label: "On trial" },
  { key: "active", label: "Paying" },
  { key: "suspended", label: "Suspended" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const PLAN_LABEL = { free: "Free trial", starter: "Starter", enterprise: "Enterprise" } as const;

function matches(o: OrgRow, f: FilterKey) {
  switch (f) {
    case "attention": return needsAttention(o);
    case "trial": return o.status === "trial" && !o.isPlatform;
    case "active": return o.status === "active" && !o.isPlatform;
    case "suspended": return o.status === "suspended";
    default: return true;
  }
}

function Stat({ label, value, tone, testId }: { label: string; value: number; tone?: PillTone; testId: string }) {
  return (
    <div className="rounded-xl glass-card px-4 py-3" data-testid={testId}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-2xl font-semibold tabular-nums", tone === "red" && value > 0 && "text-red-600 dark:text-red-300", tone === "amber" && value > 0 && "text-amber-600 dark:text-amber-300", tone === "blue" && value > 0 && "text-blue-600 dark:text-blue-300")}>
        {value}
      </p>
    </div>
  );
}

/**
 * The platform team's view of every customer workspace: who has signed up, what
 * they are on, and who needs a human. Only the platform workspace's owner gets
 * here — the API refuses everyone else, and the page says so rather than showing
 * an empty table that looks like "no customers".
 */
export function PlatformWorkspaces() {
  const { isPlatformOwner, ready } = usePermissions();
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [typed, setTyped] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : "";
      setRows(await apiFetch<OrgRow[]>(`/platform/organizations${params}`));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load workspaces");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (isPlatformOwner) void load();
  }, [isPlatformOwner, load]);

  useEffect(() => {
    const t = setTimeout(() => setQuery(typed.trim()), 300);
    return () => clearTimeout(t);
  }, [typed]);

  const customers = useMemo(() => rows.filter((r) => !r.isPlatform), [rows]);
  const stats = useMemo(
    () => ({
      total: customers.length,
      trial: customers.filter((r) => r.status === "trial" && !r.trialExpired).length,
      ended: customers.filter((r) => r.trialExpired).length,
      paying: customers.filter((r) => r.status === "active").length,
      requests: customers.filter((r) => r.upgradeRequest).length,
    }),
    [customers]
  );
  const shown = rows.filter((r) => matches(r, filter));

  if (!ready) {
    return <main className="h-full rounded-xl glass-panel" />;
  }
  if (!isPlatformOwner) {
    return (
      <main className="flex h-full items-center justify-center rounded-xl glass-panel p-6">
        <Notice tone="info" testId="platform-denied">This area is only available to the platform team.</Notice>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl glass-panel">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b px-4 py-2">
        <div className="min-w-0">
          <h1 className="text-base font-semibold tracking-tight text-foreground">Workspaces</h1>
          <p className="truncate text-xs text-muted-foreground">Every customer workspace: plan, trial, usage and requests</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <TbSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Search name or address…"
              data-testid="workspace-search"
              className="w-56 rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary/40"
            />
          </div>
          <button onClick={() => void load()} className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Refresh" aria-label="Refresh">
            <TbRefresh size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat testId="stat-total" label="Customer workspaces" value={stats.total} />
            <Stat testId="stat-trial" label="On a live trial" value={stats.trial} />
            <Stat testId="stat-ended" label="Trials ended" value={stats.ended} tone="red" />
            <Stat testId="stat-paying" label="Paying" value={stats.paying} />
            <Stat testId="stat-requests" label="Upgrade requests" value={stats.requests} tone="blue" />
          </div>

          <div className="flex flex-wrap gap-2" data-testid="workspace-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-lg border px-3 py-1 text-xs font-medium transition-colors",
                  filter === f.key ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-muted/50"
                )}
              >
                {f.label}
                <span className="ml-1.5 text-[10px] text-muted-foreground/70">{rows.filter((r) => matches(r, f.key)).length}</span>
              </button>
            ))}
          </div>

          {error && <Notice tone="danger">{error}</Notice>}

          {loading && rows.length === 0 ? (
            <div className="grid gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl border border-border bg-card" />)}</div>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <TbBuildingCommunity size={28} className="text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{query || filter !== "all" ? "No workspace matches that." : "No customer workspaces yet."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl glass-card">
              <table className="w-full min-w-[820px] text-left text-sm" data-testid="workspace-table">
                <thead className="glass-thead text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Workspace</th>
                    <th className="px-3 py-2.5 font-medium">Plan</th>
                    <th className="px-3 py-2.5 font-medium">Trial</th>
                    <th className="px-3 py-2.5 font-medium">People</th>
                    <th className="px-3 py-2.5 font-medium">Joined</th>
                    <th className="px-3 py-2.5 font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shown.map((o) => (
                    <tr
                      key={o.id}
                      data-testid="workspace-row"
                      data-slug={o.slug}
                      tabIndex={0}
                      onClick={() => setSelected(o.id)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelected(o.id)}
                      className="cursor-pointer transition-colors hover:bg-muted/40 focus:bg-muted/40 focus:outline-none"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{o.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{o.slug}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>{o.isPlatform ? "Platform" : PLAN_LABEL[o.plan]}</span>
                          {o.status === "active" && !o.isPlatform && <Pill tone="green">Paid</Pill>}
                          {o.status === "suspended" && <Pill tone="red">Suspended</Pill>}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {o.isPlatform || o.status !== "trial" ? "—" : o.trialEndsAt ? (o.trialExpired ? `Ended ${shortDate(o.trialEndsAt)}` : `Ends ${shortDate(o.trialEndsAt)}`) : "No deadline"}
                      </td>
                      <td className="px-3 py-3 tabular-nums">{o.seats ?? 0}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{shortDate(o.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {o.isPlatform && <Pill tone="blue">Platform</Pill>}
                          {o.upgradeRequest && <Pill tone="blue">{`Wants ${o.upgradeRequest.plan}`}</Pill>}
                          {o.trialExpired && <Pill tone="red">Trial ended</Pill>}
                          {o.emailVerificationPending && <Pill tone="amber">Email unconfirmed</Pill>}
                          {o.deletionScheduledFor && <Pill tone="red">{`Deleting ${shortDate(o.deletionScheduledFor)}`}</Pill>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <WorkspaceDetail orgId={selected} onClose={() => setSelected(null)} onChanged={() => void load()} />
    </main>
  );
}
