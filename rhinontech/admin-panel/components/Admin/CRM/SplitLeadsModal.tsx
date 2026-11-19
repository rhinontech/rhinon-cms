"use client";

import { useEffect, useMemo, useState } from "react";
import { TbAlertTriangle, TbArrowsSplit, TbCircleCheck, TbX } from "react-icons/tb";
import { apiFetch } from "@/lib/api";

interface Facet {
  value: string;
  count: number;
}

interface SplitResult {
  lists: { id: string; name: string; isNew: boolean; leads: number; members: number }[];
  created: number;
  updated: number;
}

const FIELDS = [
  { id: "industry", label: "Industry", noun: "industries" },
  { id: "location", label: "Location", noun: "locations" },
  { id: "source", label: "Source", noun: "sources" },
  { id: "title", label: "Job title", noun: "job titles" },
  { id: "emailStatus", label: "Email status", noun: "statuses" },
] as const;
type FieldId = (typeof FIELDS)[number]["id"];

// The server refuses more than this in one go, so the screen says so before it is asked.
const MAX_LISTS = 60;

/**
 * Turns one big book of people into several outreach audiences.
 *
 * Import everything once, then make one list per industry (or location, source, title) and run a
 * campaign against each list. The people stay one workspace-wide record; only the lists are created
 * under the brand being viewed, because lists are outreach and outreach is per brand.
 */
export function SplitLeadsModal({ onClose }: { onClose: (changed: boolean) => void }) {
  const [field, setField] = useState<FieldId>("industry");
  const [facets, setFacets] = useState<Facet[] | null>(null); // null while loading
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [minCount, setMinCount] = useState(10);
  const [query, setQuery] = useState("");
  const [prefix, setPrefix] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SplitResult | null>(null);

  const fieldMeta = FIELDS.find((f) => f.id === field)!;

  // Pre-select every value big enough to be worth a campaign; the smallest are left for the person to opt into.
  const preselect = (list: Facet[], min: number) =>
    new Set(list.filter((f) => f.count >= min).slice(0, MAX_LISTS).map((f) => f.value));

  useEffect(() => {
    let active = true;
    setFacets(null);
    setError(null);
    setQuery("");
    apiFetch<Facet[]>(`/leads/facets?field=${field}`)
      .then((list) => {
        if (!active) return;
        setFacets(list);
        setPicked(preselect(list, minCount));
      })
      .catch((err) => {
        if (!active) return;
        setFacets([]);
        setError(err instanceof Error ? err.message : "Could not load the values");
      });
    return () => {
      active = false;
    };
    // minCount is applied by the input below, not by re-fetching
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (facets ?? []).filter((f) => !q || f.value.toLowerCase().includes(q));
  }, [facets, query]);

  const selectedLeads = useMemo(
    () => (facets ?? []).filter((f) => picked.has(f.value)).reduce((sum, f) => sum + f.count, 0),
    [facets, picked]
  );
  const tooMany = picked.size > MAX_LISTS;

  const toggle = (value: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<SplitResult>("/contact-groups/split", {
        method: "POST",
        body: JSON.stringify({ field, values: [...picked], prefix }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the lists");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4" role="dialog" aria-modal="true" aria-label="Split into lists">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl glass-modal">
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
          <div className="flex items-center gap-2">
            <TbArrowsSplit className="text-blue-600 dark:text-blue-300" size={20} />
            <h2 className="text-base font-semibold text-foreground">Split into lists</h2>
          </div>
          <button onClick={() => onClose(!!result)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <TbX size={20} />
          </button>
        </div>

        {result ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-auto p-5">
            <div className="flex flex-col items-center py-2 text-center">
              <TbCircleCheck className="text-green-500 dark:text-green-400" size={40} />
              <p className="mt-2 text-lg font-semibold text-foreground">
                {result.created} list{result.created === 1 ? "" : "s"} created
                {result.updated > 0 ? `, ${result.updated} topped up` : ""}
              </p>
              <p className="text-sm text-muted-foreground">Pick any of them as the audience when you set up a campaign.</p>
            </div>
            <ul className="divide-y rounded-lg border border-border text-sm">
              {result.lists.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 truncate text-foreground">{l.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {l.members.toLocaleString("en-IN")} {l.isNew ? "" : "(existing)"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <button onClick={() => onClose(true)} className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-4 overflow-auto p-5">
              <p className="text-sm text-muted-foreground">
                Makes one list per value below and puts the matching people in it, so each campaign can go to the right audience. The
                lists are created under the brand you are viewing. Running it again only tops them up.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-foreground/85">
                  Split by
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value as FieldId)}
                    className="rounded-lg border border-border bg-card px-2.5 py-2 text-sm"
                  >
                    {FIELDS.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-foreground/85">
                  List name prefix (optional)
                  <input
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    maxLength={60}
                    placeholder="e.g. Oklahoma"
                    className="rounded-lg border border-border bg-card px-2.5 py-2 text-sm"
                  />
                </label>
              </div>

              {facets === null ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading {fieldMeta.noun}…</p>
              ) : facets.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No leads have any {fieldMeta.label.toLowerCase()} information yet. Import a file that has that column, or pick another field.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`Search ${fieldMeta.noun}…`}
                      className="min-w-[140px] flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      At least
                      <input
                        type="number"
                        min={1}
                        value={minCount}
                        onChange={(e) => {
                          const n = Math.max(1, Math.floor(Number(e.target.value)) || 1);
                          setMinCount(n);
                          setPicked(preselect(facets, n));
                        }}
                        className="w-16 rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                      />
                      leads
                    </label>
                    <button onClick={() => setPicked(preselect(facets, 1))} className="text-xs font-medium text-blue-600 dark:text-blue-300">All</button>
                    <button onClick={() => setPicked(new Set())} className="text-xs font-medium text-muted-foreground hover:text-foreground">None</button>
                  </div>

                  <ul className="max-h-64 divide-y overflow-auto rounded-lg border border-border">
                    {visible.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing matches “{query}”.</li>}
                    {visible.map((f) => (
                      <li key={f.value}>
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50">
                          <input type="checkbox" checked={picked.has(f.value)} onChange={() => toggle(f.value)} />
                          <span className="min-w-0 flex-1 truncate text-foreground">{f.value}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">{f.count.toLocaleString("en-IN")}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {tooMany && (
                <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300">
                  <TbAlertTriangle size={14} className="mt-0.5 shrink-0" />
                  That is {picked.size} lists; the limit is {MAX_LISTS} at a time. Raise the minimum number of leads, or untick some.
                </p>
              )}
              {error && (
                <p className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-xs text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                  <TbAlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {error}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t px-5 py-3">
              <p className="text-xs tabular-nums text-muted-foreground">
                {picked.size} list{picked.size === 1 ? "" : "s"} · {selectedLeads.toLocaleString("en-IN")} people
              </p>
              <div className="flex gap-2">
                <button onClick={() => onClose(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground/85 hover:bg-muted">
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={busy || picked.size === 0 || tooMany}
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                >
                  {busy ? "Creating…" : `Create ${picked.size || ""} list${picked.size === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
