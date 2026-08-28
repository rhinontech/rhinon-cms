"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TbSearch, TbExternalLink } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { CampaignLead } from "./types";

const LEAD_STATUSES = ["New", "Enriched", "Enrolled", "Emailed", "Interested", "Replied", "Bounced", "Unsubscribed"];
const LEAD_PAGE_SIZE = 50;

/**
 * Filtered/paginated lead picker over the CRM pool (GET /leads).
 * Selection state lives in the parent so wizards can enroll on submit.
 */
export function LeadPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];

  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("New");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [sources, setSources] = useState<string[]>([]);
  const [selectingAll, setSelectingAll] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    apiFetch<string[]>("/leads/sources").then(setSources).catch(() => {});
  }, []);

  const buildQuery = useCallback(
    (extra: Record<string, string>) => {
      const query = new URLSearchParams(extra);
      if (statusFilter !== "All") query.set("status", statusFilter);
      if (sourceFilter !== "All") query.set("source", sourceFilter);
      if (search) query.set("search", search);
      return query;
    },
    [statusFilter, sourceFilter, search]
  );

  const fetchLeads = useCallback(
    async (offset = 0) => {
      setLoading(true);
      try {
        const query = buildQuery({ limit: String(LEAD_PAGE_SIZE), offset: String(offset) });
        const data = await apiFetch<{ rows: CampaignLead[]; count: number }>(`/leads?${query.toString()}`);
        setLeads((prev) => (offset === 0 ? data.rows : [...prev, ...data.rows]));
        setCount(data.count);
      } catch {
        /* picker only */
      } finally {
        setLoading(false);
      }
    },
    [buildQuery]
  );

  useEffect(() => {
    fetchLeads(0);
  }, [fetchLeads]);

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  };

  const selectAllFiltered = async () => {
    setSelectingAll(true);
    try {
      const data = await apiFetch<{ ids: string[] }>(`/leads?${buildQuery({ idsOnly: "1" }).toString()}`);
      onChange(new Set(data.ids));
    } catch {
      toast.error("Failed to select all filtered leads");
    } finally {
      setSelectingAll(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="relative">
        <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
        <Input
          type="text"
          placeholder="Search leads..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="flex-1" size="sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="flex-1" size="sm">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Sources</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {count} matching · {selectedIds.size} selected
        </span>
        <button
          type="button"
          onClick={selectAllFiltered}
          disabled={selectingAll || count === 0}
          className="font-semibold text-blue-600 dark:text-blue-300 hover:underline disabled:opacity-50"
        >
          {selectingAll ? "Selecting…" : `Select all ${count} filtered`}
        </button>
      </div>

      <div className="min-h-0 flex-1 divide-y divide-border overflow-auto rounded-lg border border-border">
        {leads.length === 0 && !loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No leads found</div>
        ) : (
          <>
            {leads.map((lead) => (
              <label key={lead.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={selectedIds.has(lead.id)}
                  onChange={() => toggle(lead.id)}
                  className="rounded border-border text-blue-600 dark:text-blue-300 focus:ring-blue-500"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{lead.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lead.company} · {lead.email}
                    {lead.source ? ` · ${lead.source}` : ""}
                  </p>
                </div>
                <span className="ml-auto shrink-0 text-[10px] font-bold uppercase text-muted-foreground">{lead.status}</span>
              </label>
            ))}
            {leads.length < count && (
              <button
                type="button"
                onClick={() => fetchLeads(leads.length)}
                disabled={loading}
                className="w-full py-3 text-xs font-semibold text-blue-600 dark:text-blue-300 hover:bg-muted/40 disabled:opacity-50"
              >
                {loading ? "Loading…" : `Load more (${count - leads.length} remaining)`}
              </button>
            )}
          </>
        )}
      </div>

      <Link
        href={`/${roleSlug}/crm`}
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        Manage leads in CRM <TbExternalLink size={12} />
      </Link>
    </div>
  );
}
