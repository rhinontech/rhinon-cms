"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbSearch, TbPlus, TbBuilding, TbExternalLink, TbUsers, TbWand, TbX, TbTrash,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import type { Account, UserRef } from "./types";
import { Timeline } from "./Timeline";
import {
  Avatar, DataRow, EmptyState, HeaderRow, LifecycleBadge, Pagination,
  SkeletonRows, TableShell, TBtn, formatMoney,
} from "./ui";

const COLS = "minmax(200px,2fr) minmax(140px,1.4fr) 90px 90px 110px 40px";
const LIMIT = 50;

export function AccountsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Account | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search hits the server, so debounce rather than firing per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setOffset(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (debounced) q.set("search", debounced);
      const data = await apiFetch<{ rows: Account[]; count: number }>(`/accounts?${q}`);
      setAccounts(data.rows);
      setCount(data.count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, [debounced, offset]);

  useEffect(() => { load(); }, [load]);

  const openAccount = async (account: Account) => {
    setSelected(account);
    try {
      setSelected(await apiFetch<Account>(`/accounts/${account.id}`));
    } catch { /* keep the row data we already have */ }
  };

  const runBackfill = async () => {
    if (!confirm("Group existing leads into accounts by email/website domain?\n\nThis is safe to re-run — leads already linked are skipped.")) return;
    setBackfilling(true);
    setNotice(null);
    try {
      const r = await apiFetch<{ scanned: number; linked: number; createdAccounts: number }>(
        "/accounts/backfill", { method: "POST" }
      );
      setNotice(`Scanned ${r.scanned} unlinked leads · linked ${r.linked} · created ${r.createdAccounts} accounts.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backfill failed");
    } finally {
      setBackfilling(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this account? Its contacts and deals are kept, just unlinked.")) return;
    try {
      await apiFetch(`/accounts/${id}`, { method: "DELETE" });
      if (selected?.id === id) setSelected(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden glass-panel", isSubNavExpanded ? "lg:rounded-r-xl" : "rounded-xl")}>
        <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-stone-200/70 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <SubNavToggle />
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight text-stone-900">Accounts</h1>
              <p className="text-[11px] tabular-nums text-stone-500">{count.toLocaleString("en-IN")} companies</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <TBtn onClick={runBackfill} disabled={backfilling} title="Group existing leads into accounts by domain">
              <TbWand size={14} /> {backfilling ? "Grouping…" : "Backfill"}
            </TBtn>
            <TBtn variant="solid" onClick={() => setShowNew(true)}><TbPlus size={14} /> New</TBtn>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3">
          <div className="relative mb-2.5 max-w-sm">
            <TbSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, domain, industry…"
              className="w-full rounded-md border border-stone-200 bg-white/70 py-1.5 pl-8 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {notice && (
            <p className="mb-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] text-emerald-700">{notice}</p>
          )}
          {error && (
            <p className="mb-2.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700">{error}</p>
          )}

          <TableShell>
            <HeaderRow cols={COLS}>
              <span>Account</span>
              <span>Domain</span>
              <span className="text-right">Contacts</span>
              <span className="text-right">Deals</span>
              <span className="text-right">Open value</span>
              <span />
            </HeaderRow>

            {loading ? (
              <SkeletonRows cols={COLS} />
            ) : accounts.length === 0 ? (
              <EmptyState
                title="No accounts yet"
                hint="Run Backfill to group the leads you already have into companies by their email and website domain."
                action={<div className="mt-2"><TBtn onClick={runBackfill}><TbWand size={14} /> Backfill from leads</TBtn></div>}
              />
            ) : (
              accounts.map((a) => (
                <DataRow key={a.id} cols={COLS} selected={selected?.id === a.id} onClick={() => openAccount(a)}>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <TbBuilding size={13} className="shrink-0 text-stone-400" />
                    <span className="truncate font-medium text-stone-900">{a.name}</span>
                  </span>
                  <span className="truncate text-[12px] text-stone-500">{a.domain || "—"}</span>
                  <span className="text-right tabular-nums text-stone-600">{a.contactCount ?? 0}</span>
                  <span className="text-right tabular-nums text-stone-600">{a.openDealCount ?? 0}</span>
                  <span className="text-right font-medium tabular-nums text-stone-800">
                    {a.openDealValue ? formatMoney(a.openDealValue) : "—"}
                  </span>
                  <span className="text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(a.id); }}
                      className="rounded p-1 text-stone-300 hover:bg-rose-50 hover:text-rose-600"
                      title="Delete account"
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

      {selected && (
        <>
          <div className="fixed inset-0 z-40 glass-overlay lg:hidden" onClick={() => setSelected(null)} />
          <aside className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-full flex-col overflow-hidden bg-white shadow-2xl sm:w-[440px] lg:static lg:z-auto lg:ml-2 lg:w-[38%] lg:rounded-xl lg:border lg:border-black/5 lg:shadow-none">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200/70 px-3">
              <p className="truncate text-sm font-semibold text-stone-900">{selected.name}</p>
              <button onClick={() => setSelected(null)} className="rounded p-1.5 text-stone-400 hover:bg-stone-100">
                <TbX size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-auto p-3">
              <div className="grid grid-cols-2 gap-2">
                <Meta label="Domain" value={selected.domain} link={selected.domain ? `https://${selected.domain}` : null} />
                <Meta label="Industry" value={selected.industry} />
                <Meta label="Employees" value={selected.employeeCount ? String(selected.employeeCount) : null} />
                <Meta label="Location" value={selected.location} />
              </div>

              {selected.deals && selected.deals.length > 0 && (
                <Section title={`Deals (${selected.deals.length})`}>
                  {selected.deals.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-2 border-b border-stone-100 py-1.5 last:border-0">
                      <span className="truncate text-[13px] text-stone-700">{d.title}</span>
                      <span className="shrink-0 text-[12px] font-medium tabular-nums text-stone-800">
                        {formatMoney(d.value, d.currency)}
                      </span>
                    </div>
                  ))}
                </Section>
              )}

              {selected.contacts && selected.contacts.length > 0 && (
                <Section title={`Contacts (${selected.contacts.length})`}>
                  {selected.contacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2 border-b border-stone-100 py-1.5 last:border-0">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <Avatar name={c.name} size={18} />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] text-stone-800">{c.name}</span>
                          <span className="block truncate text-[11px] text-stone-400">{c.email}</span>
                        </span>
                      </span>
                      <LifecycleBadge stage={c.lifecycleStage} />
                    </div>
                  ))}
                </Section>
              )}

              <Section title="Activity">
                <Timeline accountId={selected.id} />
              </Section>
            </div>
          </aside>
        </>
      )}

      {showNew && <NewAccountDialog onClose={(created) => { setShowNew(false); if (created) load(); }} />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">{title}</p>
      {children}
    </div>
  );
}

function Meta({ label, value, link }: { label: string; value: string | null | undefined; link?: string | null }) {
  return (
    <div className="rounded border border-stone-100 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-stone-400">{label}</p>
      {link && value ? (
        <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-[13px] text-blue-600 hover:underline">
          {value} <TbExternalLink size={11} className="shrink-0" />
        </a>
      ) : (
        <p className="truncate text-[13px] text-stone-800">{value || "—"}</p>
      )}
    </div>
  );
}

function NewAccountDialog({ onClose }: { onClose: (created: boolean) => void }) {
  const [form, setForm] = useState({ name: "", website: "", industry: "", location: "", employeeCount: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/accounts", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          website: form.website || undefined,
          domain: form.website || undefined,
          industry: form.industry || undefined,
          location: form.location || undefined,
          employeeCount: form.employeeCount ? Number(form.employeeCount) : undefined,
        }),
      });
      onClose(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
      setSaving(false);
    }
  };

  const INPUT = "w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4" onClick={() => onClose(false)}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-sm rounded-xl glass-modal p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900">New account</h2>
          <button type="button" onClick={() => onClose(false)} className="rounded p-1 text-stone-400 hover:bg-stone-100">
            <TbX size={16} />
          </button>
        </div>
        <div className="space-y-2.5">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Name</span>
            <input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT} placeholder="Acme Inc" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Website</span>
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={INPUT} placeholder="acme.com" />
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Industry</span>
              <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={INPUT} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Employees</span>
              <input type="number" min={0} value={form.employeeCount} onChange={(e) => setForm({ ...form, employeeCount: e.target.value })} className={cn(INPUT, "tabular-nums")} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Location</span>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={INPUT} />
          </label>
        </div>
        {error && <p className="mt-2.5 rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <TBtn onClick={() => onClose(false)}>Cancel</TBtn>
          <TBtn variant="solid" type="submit" disabled={saving || !form.name.trim()}>{saving ? "Creating…" : "Create"}</TBtn>
        </div>
      </form>
    </div>
  );
}
