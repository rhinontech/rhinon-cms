"use client";

import { useEffect, useState } from "react";
import { TbX, TbTargetArrow } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import type { PipelineStage, UserRef } from "./types";
import { TBtn } from "./ui";

const INPUT =
  "w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/40";

interface BulkResult {
  requested: number;
  converted: number;
  skipped: number;
  notFound: number;
}

/**
 * Promotes a selection of leads onto the pipeline in one go. Value and close
 * date are optional and apply to all of them — the point is getting the deals
 * onto the board, then refining them individually in the drawer.
 */
export function BulkConvertDialog({
  leadIds,
  onClose,
}: {
  leadIds: string[];
  onClose: (converted: boolean) => void;
}) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [owners, setOwners] = useState<UserRef[]>([]);
  const [form, setForm] = useState({ stageId: "", ownerId: "", value: "", currency: "INR", expectedCloseDate: "" });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<PipelineStage[]>("/deals/stages")
      .then((s) => {
        setStages(s);
        const firstOpen = s.find((x) => x.type === "Open");
        if (firstOpen) setForm((f) => ({ ...f, stageId: f.stageId || firstOpen.id }));
      })
      .catch(() => {});
    apiFetch<UserRef[]>("/crm/users").then(setOwners).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      setResult(
        await apiFetch<BulkResult>("/leads/bulk-convert", {
          method: "POST",
          body: JSON.stringify({
            ids: leadIds,
            stageId: form.stageId || undefined,
            ownerId: form.ownerId || undefined,
            value: form.value ? Number(form.value) : undefined,
            currency: form.currency,
            expectedCloseDate: form.expectedCloseDate || undefined,
          }),
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk convert failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center glass-overlay p-4" onClick={() => onClose(Boolean(result))}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md rounded-xl glass-modal p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <TbTargetArrow size={16} className="text-stone-500" /> Convert to deals
          </h2>
          <button type="button" onClick={() => onClose(Boolean(result))} className="rounded p-1 text-stone-400 hover:bg-stone-100">
            <TbX size={16} />
          </button>
        </div>

        {result ? (
          <div className="py-2">
            <p className="text-[13px] text-stone-800">
              Created <span className="font-semibold">{result.converted}</span> deal{result.converted === 1 ? "" : "s"}.
            </p>
            {result.skipped > 0 && (
              <p className="mt-1 text-[11px] text-stone-500">
                {result.skipped} skipped — they already had an open deal.
              </p>
            )}
            <p className="mt-2 text-[11px] text-stone-400">
              Set values and close dates on the pipeline by opening each card.
            </p>
            <div className="mt-4 flex justify-end">
              <TBtn variant="solid" onClick={() => onClose(true)}>Done</TBtn>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-3 text-[11px] text-stone-500">
              Promotes <span className="font-medium text-stone-700">{leadIds.length}</span> lead
              {leadIds.length === 1 ? "" : "s"} onto the pipeline and marks them Qualified.
              Leads that already have an open deal are skipped.
            </p>

            <div className="space-y-2.5">
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Starting stage</span>
                <select value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })} className={INPUT}>
                  {stages.filter((s) => s.type === "Open").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Value (each)</span>
                  <input
                    type="number" min={0} value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder="Optional"
                    className={cn(INPUT, "tabular-nums")}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Currency</span>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={INPUT}>
                    {["INR", "USD", "EUR", "GBP"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Expected close</span>
                  <input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} className={INPUT} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Owner</span>
                  <select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} className={INPUT}>
                    <option value="">Keep lead owner</option>
                    {owners.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {error && <p className="mt-2.5 rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <TBtn onClick={() => onClose(false)}>Cancel</TBtn>
              <TBtn variant="solid" type="submit" disabled={saving}>
                {saving ? "Converting…" : `Convert ${leadIds.length}`}
              </TBtn>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
