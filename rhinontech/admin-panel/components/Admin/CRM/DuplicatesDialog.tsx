"use client";

import { useEffect, useState } from "react";
import { TbX, TbCopyCheck, TbAlertTriangle } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { LifecycleBadge, TBtn, formatDate } from "./ui";
import type { LifecycleStage, LeadStatus } from "./types";

interface DupLead {
  id: string;
  name: string;
  company: string;
  email: string;
  title: string | null;
  phone: string | null;
  status: LeadStatus;
  lifecycleStage: LifecycleStage;
  addedAt: string;
  lastActivityAt: string | null;
}
interface DupGroup { name: string; company: string; count: number; leads: DupLead[] }

/**
 * Duplicate review and merge.
 *
 * Merging is destructive and irreversible, so nothing happens automatically:
 * every group is shown, and a human picks which record survives. The survivor
 * keeps its own values and only inherits fields it was missing.
 */
export function DuplicatesDialog({ onClose }: { onClose: (merged: boolean) => void }) {
  const [groups, setGroups] = useState<DupGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [survivors, setSurvivors] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [mergedAny, setMergedAny] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ duplicates: DupGroup[] }>("/leads/duplicates");
      setGroups(data.duplicates);
      // Default to the record with the most recent activity — usually the live one.
      const picks: Record<string, string> = {};
      for (const g of data.duplicates) {
        const best = [...g.leads].sort((a, b) => {
          const at = a.lastActivityAt || a.addedAt;
          const bt = b.lastActivityAt || b.addedAt;
          return bt.localeCompare(at);
        })[0];
        picks[groupKey(g)] = best.id;
      }
      setSurvivors(picks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load duplicates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const merge = async (group: DupGroup) => {
    const key = groupKey(group);
    const survivorId = survivors[key];
    if (!survivorId) return;
    const losers = group.leads.filter((l) => l.id !== survivorId);
    if (
      !confirm(
        `Merge ${losers.length} record${losers.length === 1 ? "" : "s"} into ${
          group.leads.find((l) => l.id === survivorId)?.email
        }?\n\nHistory moves across. The other record${losers.length === 1 ? " is" : "s are"} deleted. This cannot be undone.`
      )
    ) return;

    setBusyKey(key);
    setError(null);
    try {
      await apiFetch("/leads/merge", {
        method: "POST",
        body: JSON.stringify({ survivorId, mergeIds: losers.map((l) => l.id) }),
      });
      setMergedAny(true);
      setGroups((cur) => cur.filter((g) => groupKey(g) !== key));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Merge failed");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center glass-overlay p-4" onClick={() => onClose(mergedAny)}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl glass-modal">
        <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <TbCopyCheck size={16} className="text-muted-foreground" /> Possible duplicates
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Same name and company under different email addresses. Pick which record survives.
            </p>
          </div>
          <button onClick={() => onClose(mergedAny)} className="rounded p-1 text-muted-foreground hover:bg-muted">
            <TbX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {error && <p className="mb-2 rounded border border-rose-200 dark:border-rose-400/25 bg-rose-50 dark:bg-rose-400/10 px-2 py-1.5 text-[11px] text-rose-700 dark:text-rose-300">{error}</p>}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />)}
            </div>
          ) : groups.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No duplicates found.</p>
          ) : (
            <div className="space-y-2.5">
              {groups.map((group) => {
                const key = groupKey(group);
                return (
                  <div key={key} className="rounded-lg border border-border bg-card/70 p-2.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[13px] font-medium text-foreground">
                        {group.name} <span className="font-normal text-muted-foreground">· {group.company}</span>
                      </p>
                      <TBtn
                        variant="solid"
                        onClick={() => merge(group)}
                        disabled={busyKey === key || !survivors[key]}
                      >
                        {busyKey === key ? "Merging…" : `Merge ${group.count - 1}`}
                      </TBtn>
                    </div>

                    <ul className="space-y-1">
                      {group.leads.map((lead) => (
                        <li
                          key={lead.id}
                          className={cn(
                            "flex items-center gap-2 rounded px-2 py-1.5",
                            survivors[key] === lead.id ? "bg-emerald-50 dark:bg-emerald-400/10 ring-1 ring-inset ring-emerald-200" : "hover:bg-muted/40"
                          )}
                        >
                          <input
                            type="radio"
                            name={key}
                            checked={survivors[key] === lead.id}
                            onChange={() => setSurvivors((s) => ({ ...s, [key]: lead.id }))}
                            className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-emerald-600"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] text-foreground">{lead.email}</span>
                            <span className="block truncate text-[10px] text-muted-foreground">
                              {lead.title || "No title"} · added {formatDate(lead.addedAt)}
                              {lead.lastActivityAt ? ` · active ${formatDate(lead.lastActivityAt)}` : ""}
                            </span>
                          </span>
                          <LifecycleBadge stage={lead.lifecycleStage} />
                          {survivors[key] === lead.id && (
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Keep</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-border/70 px-4 py-2.5">
          <TbAlertTriangle size={14} className="shrink-0 text-amber-500 dark:text-amber-400" />
          <p className="flex-1 text-[11px] text-muted-foreground">
            Merging moves timeline, tasks, deals, list membership and inbox mail onto the survivor,
            then deletes the rest. It cannot be undone.
          </p>
          <TBtn onClick={() => onClose(mergedAny)}>Done</TBtn>
        </div>
      </div>
    </div>
  );
}

const groupKey = (g: DupGroup) => `${g.name}|${g.company}`;
