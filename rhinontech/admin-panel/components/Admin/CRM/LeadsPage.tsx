"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  TbSearch, TbPlus, TbUpload, TbTrash, TbX, TbBulb, TbRefresh, TbLoader,
  TbExternalLink, TbTargetArrow, TbChevronDown, TbBuilding,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { LeadImportModal } from "./LeadImportModal";
import { AddToGroupMenu } from "@/components/Admin/Outreach/contacts/AddToGroupMenu";
import { ConvertDealDialog } from "./ConvertDealDialog";
import { Timeline } from "./Timeline";
import { RelatedTasks } from "./RelatedTasks";
import { LIFECYCLE_STAGES, type Lead, type LifecycleStage, type UserRef } from "./types";
import {
  Avatar, DataRow, EmptyState, HeaderRow, OutreachStatus,
  Pagination, SkeletonRows, TableShell, TBtn, relativeTime,
} from "./ui";

/**
 * Two column sets. With the detail panel open the table has roughly 550px to
 * work with, so all eight columns overflow and clip the right-hand edge. The
 * lower-priority ones (account, outreach state, last touch) drop out instead —
 * they're still on the record, just not worth a scrollbar.
 */
const COLS_FULL = "26px minmax(180px,2.2fr) minmax(110px,1.1fr) 104px 132px 84px 78px 28px";
const COLS_COMPACT = "26px minmax(150px,2.4fr) 104px 34px 28px";
const LIMIT = 50;

type PanelMode = "view" | "create" | "edit";

export function LeadsPage() {
  const { isExpanded: isSubNavExpanded, toggleSideNav } = useSideNav();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [sources, setSources] = useState<string[]>([]);
  const [owners, setOwners] = useState<UserRef[]>([]);

  const [selected, setSelected] = useState<Lead | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("view");
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [enriching, setEnriching] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [converting, setConverting] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: "", company: "", email: "", title: "", linkedinUrl: "", notes: "" });

  const panelVisible = Boolean((selected || panelMode === "create") && panelOpen);
  const compact = panelVisible;
  const COLS = compact ? COLS_COMPACT : COLS_FULL;

  // The CRM sub-nav holds three links but costs 15% of the shell. Reclaim it
  // while the detail panel is open, and hand it back when the panel closes —
  // but only if we were the ones who collapsed it.
  const autoCollapsed = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    if (panelVisible && isSubNavExpanded && !autoCollapsed.current) {
      autoCollapsed.current = true;
      toggleSideNav();
    } else if (!panelVisible && autoCollapsed.current) {
      autoCollapsed.current = false;
      if (!isSubNavExpanded) toggleSideNav();
    }
  }, [panelVisible, isSubNavExpanded, toggleSideNav]);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setOffset(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (debounced) q.set("search", debounced);
      if (lifecycleFilter !== "All") q.set("lifecycleStage", lifecycleFilter);
      if (sourceFilter !== "All") q.set("source", sourceFilter);
      if (ownerFilter !== "All") q.set("ownerId", ownerFilter);
      const data = await apiFetch<{ rows: Lead[]; count: number }>(`/leads?${q}`);
      setLeads(data.rows);
      setCount(data.count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [debounced, lifecycleFilter, sourceFilter, ownerFilter, offset]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    apiFetch<string[]>("/leads/sources").then(setSources).catch(() => {});
    apiFetch<UserRef[]>("/crm/users").then(setOwners).catch(() => {});
  }, []);

  const openLead = async (lead: Lead) => {
    setSelected(lead);
    setPanelMode("view");
    setPanelOpen(true);
    try {
      setSelected(await apiFetch<Lead>(`/leads/${lead.id}`));
    } catch { /* fall back to the row we already have */ }
  };

  /** Inline field edit from the row — patches locally, then persists. */
  const patchLead = async (id: string, patch: Partial<Lead>) => {
    const snapshot = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    if (selected?.id === id) setSelected((s) => (s ? { ...s, ...patch } : s));
    try {
      const updated = await apiFetch<Lead>(`/leads/${id}`, { method: "PUT", body: JSON.stringify(patch) });
      setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, ...updated } : l)));
    } catch (err) {
      setLeads(snapshot);
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const enrich = async (id: string) => {
    setEnriching(true);
    try {
      const data = await apiFetch<Record<string, unknown>>(`/leads/${id}/enrich`, { method: "POST" });
      setSelected((s) => (s && s.id === id ? { ...s, enrichment: data } : s));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enrichment failed");
    } finally {
      setEnriching(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (panelMode === "create") {
        await apiFetch("/leads", { method: "POST", body: JSON.stringify(form) });
      } else if (selected) {
        await apiFetch(`/leads/${selected.id}`, { method: "PUT", body: JSON.stringify(form) });
      }
      setPanelMode("view");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    try {
      await apiFetch(`/leads/${id}`, { method: "DELETE" });
      if (selected?.id === id) setSelected(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} lead(s)? This cannot be undone.`)) return;
    try {
      await apiFetch("/leads/bulk-delete", { method: "POST", body: JSON.stringify({ ids: [...selectedIds] }) });
      setSelectedIds(new Set());
      setSelected(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk delete failed");
    }
  };

  const bulkAssign = async (ownerId: string) => {
    if (!ownerId) return;
    try {
      await Promise.all(
        [...selectedIds].map((id) => apiFetch(`/leads/${id}`, { method: "PUT", body: JSON.stringify({ ownerId }) }))
      );
      setSelectedIds(new Set());
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed");
    }
  };

  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(leads.map((l) => l.id)));
  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const startCreate = () => {
    setForm({ name: "", company: "", email: "", title: "", linkedinUrl: "", notes: "" });
    setPanelMode("create");
    setPanelOpen(true);
  };

  const startEdit = () => {
    if (!selected) return;
    setForm({
      name: selected.name, company: selected.company, email: selected.email,
      title: selected.title || "", linkedinUrl: selected.linkedinUrl || "", notes: selected.notes || "",
    });
    setPanelMode("edit");
  };

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden glass-panel", isSubNavExpanded ? "lg:rounded-r-xl" : "rounded-xl")}>
        <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-stone-200/70 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <SubNavToggle />
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight text-stone-900">Leads</h1>
              <p className="text-[11px] tabular-nums text-stone-500">{count.toLocaleString("en-IN")} contacts</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <TBtn onClick={() => setShowImport(true)}><TbUpload size={14} /> Import</TBtn>
            <TBtn variant="solid" onClick={startCreate}><TbPlus size={14} /> New</TBtn>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {/* Filters */}
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
              <TbSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, company, email…"
                className="w-full rounded-md border border-stone-200 bg-white/70 py-1.5 pl-8 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <Select value={lifecycleFilter} onChange={(v) => { setLifecycleFilter(v); setOffset(0); }}>
              <option value="All">All stages</option>
              {LIFECYCLE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select value={ownerFilter} onChange={(v) => { setOwnerFilter(v); setOffset(0); }}>
              <option value="All">All owners</option>
              <option value="unassigned">Unassigned</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
            </Select>
            <Select value={sourceFilter} onChange={(v) => { setSourceFilter(v); setOffset(0); }}>
              <option value="All">All sources</option>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>

          {error && (
            <div className="mb-2.5 flex items-center justify-between gap-2 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5">
              <p className="text-[11px] text-rose-700">{error}</p>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700"><TbX size={13} /></button>
            </div>
          )}

          {/* Bulk bar */}
          {selectedIds.size > 0 && (
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5">
              <span className="text-[12px] font-medium tabular-nums text-blue-900">{selectedIds.size} selected</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <Select value="" onChange={bulkAssign}>
                  <option value="">Assign owner…</option>
                  {owners.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
                </Select>
                <AddToGroupMenu leadIds={[...selectedIds]} onDone={() => setSelectedIds(new Set())} />
                <TBtn onClick={() => setSelectedIds(new Set())}>Clear</TBtn>
                <TBtn variant="danger" onClick={bulkDelete}><TbTrash size={13} /> Delete</TBtn>
              </div>
            </div>
          )}

          <TableShell>
            <HeaderRow cols={COLS}>
              <span className="flex justify-center">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-3.5 w-3.5 cursor-pointer accent-blue-600" title="Select all" />
              </span>
              <span>Lead</span>
              {!compact && <span>Account</span>}
              <span>Stage</span>
              {compact ? <span /> : <span>Owner</span>}
              {!compact && <span>Outreach</span>}
              {!compact && <span>Last touch</span>}
              <span />
            </HeaderRow>

            {loading ? (
              <SkeletonRows cols={COLS} />
            ) : leads.length === 0 ? (
              <EmptyState
                title="No leads match these filters"
                hint="Try clearing the filters, or import a CSV to get started."
              />
            ) : (
              leads.map((lead) => (
                <DataRow key={lead.id} cols={COLS} selected={selected?.id === lead.id} onClick={() => openLead(lead)}>
                  <span className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => toggle(lead.id)} className="h-3.5 w-3.5 cursor-pointer accent-blue-600" />
                  </span>

                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate font-medium text-stone-900">{lead.name}</span>
                    <span className="truncate text-[11px] text-stone-400">{lead.email}</span>
                  </span>

                  {!compact && (
                    <span className="flex min-w-0 items-center gap-1 text-[12px] text-stone-600">
                      {lead.account ? (
                        <>
                          <TbBuilding size={11} className="shrink-0 text-stone-400" />
                          <span className="truncate">{lead.account.name}</span>
                        </>
                      ) : (
                        <span className="truncate text-stone-400">{lead.company}</span>
                      )}
                    </span>
                  )}

                  {/* Inline stage edit — the single most-changed field. */}
                  <span onClick={(e) => e.stopPropagation()}>
                    <select
                      value={lead.lifecycleStage}
                      onChange={(e) => patchLead(lead.id, { lifecycleStage: e.target.value as LifecycleStage })}
                      className="w-full cursor-pointer appearance-none rounded bg-transparent text-[11px] outline-none"
                    >
                      {LIFECYCLE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </span>

                  <span onClick={(e) => e.stopPropagation()} className="flex min-w-0 items-center gap-1.5">
                    <Avatar name={lead.owner?.fullName} size={18} />
                    {!compact && (
                      <select
                        value={lead.ownerId || ""}
                        onChange={(e) => patchLead(lead.id, { ownerId: e.target.value || null })}
                        // Unassigned reads as a quiet dash rather than the word
                        // repeated down every row.
                        className={cn(
                          "min-w-0 flex-1 cursor-pointer truncate rounded bg-transparent text-[11px] outline-none",
                          lead.ownerId ? "text-stone-600" : "text-stone-300"
                        )}
                      >
                        <option value="">—</option>
                        {owners.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
                      </select>
                    )}
                  </span>

                  {!compact && <span className="truncate"><OutreachStatus status={lead.status} /></span>}

                  {!compact && (
                    <span className="truncate text-[11px] tabular-nums text-stone-400">
                      {relativeTime(lead.lastActivityAt || lead.addedAt)}
                    </span>
                  )}

                  <span className="text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(lead.id); }}
                      className="rounded p-1 text-stone-300 hover:bg-rose-50 hover:text-rose-600"
                      title="Delete lead"
                    >
                      <TbTrash size={13} />
                    </button>
                  </span>
                </DataRow>
              ))
            )}
          </TableShell>

          <Pagination offset={offset} limit={LIMIT} count={count} onChange={setOffset} />
        </div>
      </main>

      {/* Detail panel */}
      {(selected || panelMode === "create") && panelOpen && (
        <>
          <div className="fixed inset-0 z-40 glass-overlay lg:hidden" onClick={() => setPanelOpen(false)} />
          <aside className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:w-[460px] lg:static lg:z-auto lg:ml-2 lg:w-[40%] lg:rounded-xl lg:border lg:border-black/5 lg:shadow-none">
            <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-stone-200/70 px-3">
              <p className="truncate text-sm font-semibold text-stone-900">
                {panelMode === "create" ? "New lead" : panelMode === "edit" ? "Edit lead" : selected?.name}
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                {panelMode === "view" && selected && (
                  <>
                    <TBtn onClick={() => setConverting(selected)} title="Create a deal from this lead">
                      <TbTargetArrow size={13} /> Convert
                    </TBtn>
                    <TBtn onClick={startEdit}>Edit</TBtn>
                  </>
                )}
                <button onClick={() => { setPanelOpen(false); setPanelMode("view"); }} className="rounded p-1.5 text-stone-400 hover:bg-stone-100">
                  <TbX size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-3">
              {panelMode === "view" && selected ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[13px] text-stone-500">
                      {selected.title || "No title"}
                      {selected.account ? ` · ${selected.account.name}` : selected.company ? ` · ${selected.company}` : ""}
                    </p>

                    {/* The compact table hides the owner control, so the panel
                        carries the real one. */}
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-stone-400">Stage</span>
                        <select
                          value={selected.lifecycleStage}
                          onChange={(e) => patchLead(selected.id, { lifecycleStage: e.target.value as LifecycleStage })}
                          className="w-full cursor-pointer rounded border border-stone-200 bg-white px-2 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500/40"
                        >
                          {LIFECYCLE_STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-stone-400">Owner</span>
                        <select
                          value={selected.ownerId || ""}
                          onChange={(e) => patchLead(selected.id, { ownerId: e.target.value || null })}
                          className="w-full cursor-pointer rounded border border-stone-200 bg-white px-2 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500/40"
                        >
                          <option value="">Unassigned</option>
                          {owners.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
                        </select>
                      </label>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400">
                      <OutreachStatus status={selected.status} />
                      <span>· {selected.source}</span>
                      <span>· added {relativeTime(selected.addedAt)}</span>
                    </div>
                  </div>

                  {selected.deals && selected.deals.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">Deals</p>
                      {selected.deals.map((d) => (
                        <div key={d.id} className="flex items-center justify-between gap-2 border-b border-stone-100 py-1.5 last:border-0">
                          <span className="truncate text-[13px] text-stone-700">{d.title}</span>
                          <span className="shrink-0 text-[11px] text-stone-400">{d.stage?.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI enrichment. Collapses to one line until there's
                      something to show — an empty card was pure chrome. */}
                  {!selected.enrichment && !enriching ? (
                    <button
                      onClick={() => enrich(selected.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-indigo-200 py-1.5 text-[11px] font-medium text-indigo-500 hover:bg-indigo-50/60"
                    >
                      <TbBulb size={13} /> Run AI enrichment
                    </button>
                  ) : (
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          <TbBulb size={13} /> AI intelligence
                        </span>
                        {!enriching && (
                          <button onClick={() => enrich(selected.id)} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:underline">
                            <TbRefresh size={11} /> Re-run
                          </button>
                        )}
                      </div>
                      {enriching ? (
                        <div className="flex flex-col items-center py-3 text-indigo-400">
                          <TbLoader className="mb-1 animate-spin" size={18} />
                          <p className="text-[10px] uppercase tracking-widest">Analyzing…</p>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {Object.entries(selected.enrichment as Record<string, unknown>)
                            .filter(([, v]) => typeof v === "string" && v)
                            .map(([k, v]) => (
                              <div key={k}>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">
                                  {k.replace(/([A-Z])/g, " $1").trim()}
                                </p>
                                <p className="text-[12px] leading-relaxed text-stone-700">{v as string}</p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  <DetailFields lead={selected} />

                  {selected.notes && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500">Notes</p>
                      <p className="whitespace-pre-wrap rounded border border-stone-100 p-2 text-[12px] leading-relaxed text-stone-600">{selected.notes}</p>
                    </div>
                  )}

                  {selected.raw && Object.keys(selected.raw).length > 0 && <RawData raw={selected.raw} />}

                  <RelatedTasks leadId={selected.id} owners={owners} />

                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">Activity</p>
                    <Timeline leadId={selected.id} onLogged={load} />
                  </div>
                </div>
              ) : (
                <form onSubmit={save} className="space-y-2.5">
                  <FormField label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                  <div className="grid grid-cols-2 gap-2.5">
                    <FormField label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} required />
                    <FormField label="Job title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
                  </div>
                  <FormField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                  <FormField label="LinkedIn URL" value={form.linkedinUrl} onChange={(v) => setForm({ ...form, linkedinUrl: v })} />
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Notes</span>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="h-24 w-full resize-none rounded border border-stone-200 bg-white px-2 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </label>
                  <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
                    <TBtn onClick={() => setPanelMode("view")}>Cancel</TBtn>
                    <TBtn variant="solid" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</TBtn>
                  </div>
                </form>
              )}
            </div>
          </aside>
        </>
      )}

      {showImport && <LeadImportModal onClose={(did) => { setShowImport(false); if (did) load(); }} />}
      {converting && (
        <ConvertDealDialog
          lead={converting}
          onClose={(created) => { setConverting(null); if (created) { load(); if (selected) openLead(selected); } }}
        />
      )}
    </div>
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-stone-200 bg-white/70 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/40"
    >
      {children}
    </select>
  );
}

/**
 * Only fields that actually have a value. Rendering all eight as bordered boxes
 * meant six empty "—" cards on a typical imported lead, which read as clutter
 * rather than information.
 */
function DetailFields({ lead }: { lead: Lead }) {
  const fields: { label: string; value?: string | null; link?: boolean }[] = [
    { label: "Email", value: lead.email },
    { label: "Phone", value: lead.phone },
    { label: "LinkedIn", value: lead.linkedinUrl, link: true },
    { label: "Website", value: lead.website, link: true },
    { label: "Seniority", value: lead.seniority },
    { label: "Department", value: lead.department },
    { label: "Industry", value: lead.industry },
    { label: "Location", value: lead.location },
  ].filter((f) => f.value);

  if (fields.length === 0) return null;

  return (
    <dl className="grid grid-cols-[76px_minmax(0,1fr)] items-baseline gap-x-3 gap-y-2">
      {fields.map((f) => (
        <Fragment key={f.label}>
          <dt className="text-[11px] text-stone-400">{f.label}</dt>
          <dd className="min-w-0 text-[13px] text-stone-800">
            {f.link ? (
              <a
                href={f.value!.startsWith("http") ? f.value! : `https://${f.value}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1 truncate text-blue-600 hover:underline"
              >
                <span className="truncate">{f.value}</span>
                <TbExternalLink size={11} className="shrink-0" />
              </a>
            ) : (
              <span className="block truncate">{f.value}</span>
            )}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

function FormField({
  label, value, onChange, required, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/40"
      />
    </label>
  );
}

function RawData({ raw }: { raw: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(raw);
  return (
    <div className="rounded-lg border border-stone-100">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-stone-50">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          All imported data ({entries.length} fields)
        </span>
        <TbChevronDown size={14} className={cn("text-stone-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="divide-y divide-stone-50 border-t border-stone-100">
          {entries.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[38%_62%] gap-2 px-2.5 py-1.5 text-[11px]">
              <span className="break-words text-stone-400">{k}</span>
              <span className="break-words text-stone-700">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
