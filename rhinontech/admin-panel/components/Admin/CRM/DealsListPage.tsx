"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TbSearch, TbBuilding, TbLayoutKanban } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import type { Deal, PipelineStage, UserRef } from "./types";
import { DealDrawer } from "./DealDrawer";
import {
  Avatar, DataRow, EmptyState, HeaderRow, Pagination, SkeletonRows,
  StageDot, TableShell, formatDate, formatMoney,
} from "./ui";

const COLS = "minmax(180px,2fr) minmax(120px,1.2fr) 110px 120px 96px 96px 34px";
const LIMIT = 50;

/**
 * Deals as a list.
 *
 * The board is for moving work along; it can't answer "find the Acme renewal"
 * or "show everything closing this month". Same records, sortable and
 * searchable, including the closed ones the board deliberately hides.
 */
export function DealsListPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const pathname = usePathname();
  const crmBase = `/${pathname.split("/")[1]}/crm`;

  const [deals, setDeals] = useState<Deal[]>([]);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("Open");
  const [stageFilter, setStageFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");

  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [owners, setOwners] = useState<UserRef[]>([]);
  const [openDealId, setOpenDealId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setOffset(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    apiFetch<PipelineStage[]>("/deals/stages").then(setStages).catch(() => {});
    apiFetch<UserRef[]>("/crm/users").then(setOwners).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (debounced) q.set("search", debounced);
      if (statusFilter !== "All") q.set("status", statusFilter);
      if (stageFilter !== "All") q.set("stageId", stageFilter);
      if (ownerFilter !== "All") q.set("ownerId", ownerFilter);
      const data = await apiFetch<{ rows: Deal[]; count: number }>(`/deals?${q}`);
      setDeals(data.rows);
      setCount(data.count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, [debounced, statusFilter, stageFilter, ownerFilter, offset]);

  useEffect(() => { load(); }, [load]);

  const pageValue = deals.reduce((sum, d) => sum + Number(d.value || 0), 0);

  return (
    <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden glass-panel", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
      <div className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/70 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <SubNavToggle />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-foreground">Deals</h1>
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {count.toLocaleString("en-IN")} matching · {formatMoney(pageValue)} on this page
            </p>
          </div>
        </div>
        <Link
          href={`${crmBase}/pipeline`}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/70 px-2.5 py-1.5 text-xs font-medium text-foreground/85 hover:bg-muted"
        >
          <TbLayoutKanban size={14} /> Board view
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <TbSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deal title…"
              className="w-full rounded-md border border-border bg-card/70 py-1.5 pl-8 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <Sel value={statusFilter} onChange={(v) => { setStatusFilter(v); setOffset(0); }}>
            <option value="Open">Open</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
            <option value="All">All statuses</option>
          </Sel>
          <Sel value={stageFilter} onChange={(v) => { setStageFilter(v); setOffset(0); }}>
            <option value="All">All stages</option>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Sel>
          <Sel value={ownerFilter} onChange={(v) => { setOwnerFilter(v); setOffset(0); }}>
            <option value="All">All owners</option>
            {owners.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
          </Sel>
        </div>

        {error && <p className="mb-2.5 rounded-md border border-rose-200 dark:border-rose-400/25 bg-rose-50 dark:bg-rose-400/10 px-2.5 py-1.5 text-[11px] text-rose-700 dark:text-rose-300">{error}</p>}

        <TableShell>
          <HeaderRow cols={COLS}>
            <span>Deal</span>
            <span>Account</span>
            <span>Stage</span>
            <span className="text-right">Value</span>
            <span>Close date</span>
            <span>Owner</span>
            <span />
          </HeaderRow>

          {loading ? (
            <SkeletonRows cols={COLS} />
          ) : deals.length === 0 ? (
            <EmptyState
              title="No deals match these filters"
              hint="Convert qualified leads from the Leads list to create deals."
            />
          ) : (
            deals.map((deal) => {
              const overdue =
                deal.status === "Open" &&
                deal.expectedCloseDate &&
                new Date(deal.expectedCloseDate) < new Date(new Date().toDateString());
              return (
                <DataRow key={deal.id} cols={COLS} onClick={() => setOpenDealId(deal.id)}>
                  <span className="truncate font-medium text-foreground">{deal.title}</span>
                  <span className="flex min-w-0 items-center gap-1 text-[12px] text-foreground/70">
                    {deal.account ? (
                      <>
                        <TbBuilding size={11} className="shrink-0 text-muted-foreground" />
                        <Link
                          href={`${crmBase}/accounts?accountId=${deal.account.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="truncate hover:text-blue-600 dark:hover:text-blue-300 hover:underline"
                        >
                          {deal.account.name}
                        </Link>
                      </>
                    ) : <span className="text-muted-foreground/70">—</span>}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-foreground/70">
                    <StageDot color={deal.stage?.color} type={deal.stage?.type} />
                    <span className="truncate">{deal.stage?.name || "No stage"}</span>
                  </span>
                  <span className="text-right font-medium tabular-nums text-foreground">
                    {formatMoney(deal.value, deal.currency)}
                  </span>
                  <span className={cn("text-[11px] tabular-nums", overdue ? "text-rose-500 dark:text-rose-400" : "text-muted-foreground")}>
                    {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "—"}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Avatar name={deal.owner?.fullName} size={18} />
                    <span className="truncate text-[11px] text-muted-foreground">{deal.owner?.fullName || "—"}</span>
                  </span>
                  <span />
                </DataRow>
              );
            })
          )}
        </TableShell>

        <Pagination offset={offset} limit={LIMIT} count={count} onChange={setOffset} />
      </div>

      {openDealId && (
        <DealDrawer
          dealId={openDealId}
          stages={stages}
          owners={owners}
          onClose={() => setOpenDealId(null)}
          onChanged={load}
        />
      )}
    </main>
  );
}

function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-card/70 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/40"
    >
      {children}
    </select>
  );
}
