"use client";

import { useEffect, useState } from "react";
import { TbX, TbPlus, TbTrash, TbArrowUp, TbArrowDown, TbGripVertical } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import type { PipelineStage, StageType } from "./types";
import { StageDot, TBtn } from "./ui";

const INPUT =
  "w-full rounded border border-stone-200 bg-white px-2 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500/40";

/**
 * Pipeline stage management. Stages are rows, so renaming, reordering, and
 * changing probability are all data edits rather than deploys.
 *
 * Reorder is arrow-based rather than drag: the board behind this dialog is
 * already a drag surface, and nesting a second one is a reliable way to make
 * both feel broken.
 */
export function StageSettingsDialog({ onClose }: { onClose: (changed: boolean) => void }) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setStages(await apiFetch<PipelineStage[]>("/deals/stages"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const patchLocal = (id: string, patch: Partial<PipelineStage>) =>
    setStages((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const saveStage = async (stage: PipelineStage) => {
    setBusy(true);
    try {
      await apiFetch(`/deals/stages/${stage.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: stage.name,
          probability: Number(stage.probability) || 0,
          type: stage.type,
          color: stage.color,
        }),
      });
      setDirty(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      load();
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, delta: number) => {
    const next = [...stages];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setStages(next);
    setBusy(true);
    try {
      await apiFetch("/deals/stages/reorder", { method: "PUT", body: JSON.stringify({ ids: next.map((s) => s.id) }) });
      setDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed");
      load();
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    setBusy(true);
    try {
      const created = await apiFetch<PipelineStage>("/deals/stages", {
        method: "POST",
        body: JSON.stringify({ name: "New stage", probability: 0, type: "Open", color: "#94a3b8" }),
      });
      setStages((cur) => [...cur, created]);
      setDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add stage");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (stage: PipelineStage) => {
    if (!confirm(`Delete the "${stage.name}" stage?`)) return;
    setBusy(true);
    try {
      await apiFetch(`/deals/stages/${stage.id}`, { method: "DELETE" });
      setStages((cur) => cur.filter((s) => s.id !== stage.id));
      setDirty(true);
      setError(null);
    } catch (err) {
      // The server refuses while deals still sit in the stage — surface that.
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center glass-overlay p-4" onClick={() => onClose(dirty)}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl glass-modal">
        <div className="flex shrink-0 items-center justify-between border-b border-stone-200/70 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Pipeline stages</h2>
            <p className="text-[11px] text-stone-500">Probability drives the weighted forecast on the board.</p>
          </div>
          <button onClick={() => onClose(dirty)} className="rounded p-1 text-stone-400 hover:bg-stone-100">
            <TbX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {error && <p className="mb-2 rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700">{error}</p>}

          {loading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-9 animate-pulse rounded bg-stone-100" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[20px_minmax(0,1fr)_92px_104px_64px_56px] items-center gap-2 px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                <span />
                <span>Name</span>
                <span>Type</span>
                <span>Probability</span>
                <span>Colour</span>
                <span />
              </div>

              <ul className="space-y-1">
                {stages.map((stage, i) => (
                  <li
                    key={stage.id}
                    className="grid grid-cols-[20px_minmax(0,1fr)_92px_104px_64px_56px] items-center gap-2 rounded-lg border border-stone-200 bg-white/70 px-1 py-1.5"
                  >
                    <span className="flex justify-center text-stone-300"><TbGripVertical size={13} /></span>

                    <span className="flex min-w-0 items-center gap-1.5">
                      <StageDot color={stage.color} type={stage.type} />
                      <input
                        value={stage.name}
                        onChange={(e) => patchLocal(stage.id, { name: e.target.value })}
                        onBlur={() => saveStage(stage)}
                        className={INPUT}
                      />
                    </span>

                    <select
                      value={stage.type}
                      onChange={(e) => {
                        const type = e.target.value as StageType;
                        patchLocal(stage.id, { type });
                        saveStage({ ...stage, type });
                      }}
                      className={INPUT}
                    >
                      <option value="Open">Open</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                    </select>

                    <span className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={stage.probability}
                        onChange={(e) => patchLocal(stage.id, { probability: Number(e.target.value) })}
                        onBlur={() => saveStage(stage)}
                        disabled={stage.type !== "Open"}
                        className={cn(INPUT, "tabular-nums disabled:bg-stone-50 disabled:text-stone-400")}
                      />
                      <span className="text-[11px] text-stone-400">%</span>
                    </span>

                    <input
                      type="color"
                      value={stage.color || "#94a3b8"}
                      onChange={(e) => patchLocal(stage.id, { color: e.target.value })}
                      onBlur={() => saveStage(stage)}
                      className="h-7 w-full cursor-pointer rounded border border-stone-200 bg-white"
                    />

                    <span className="flex items-center justify-end gap-0.5">
                      <button onClick={() => move(i, -1)} disabled={i === 0 || busy} className="rounded p-1 text-stone-400 hover:bg-stone-100 disabled:opacity-30" title="Move up">
                        <TbArrowUp size={13} />
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === stages.length - 1 || busy} className="rounded p-1 text-stone-400 hover:bg-stone-100 disabled:opacity-30" title="Move down">
                        <TbArrowDown size={13} />
                      </button>
                      <button onClick={() => remove(stage)} disabled={busy} className="rounded p-1 text-stone-300 hover:bg-rose-50 hover:text-rose-600" title="Delete stage">
                        <TbTrash size={13} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-2">
                <TBtn onClick={add} disabled={busy}><TbPlus size={13} /> Add stage</TBtn>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-stone-400">
                A deal takes its Open/Won/Lost status from the stage it sits in, so keep exactly one
                Won and one Lost stage. Stages holding deals can&apos;t be deleted until those deals move.
              </p>
            </>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-stone-200/70 px-4 py-2.5">
          <TBtn variant="solid" onClick={() => onClose(dirty)}>Done</TBtn>
        </div>
      </div>
    </div>
  );
}
