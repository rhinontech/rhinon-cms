"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbX, TbTrash, TbTrophy, TbCircleX, TbRotateClockwise, TbBuilding, TbUser,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import type { Deal, PipelineStage, UserRef } from "./types";
import { Timeline } from "./Timeline";
import { StageDot, TBtn, formatDate, formatMoney, relativeTime } from "./ui";

const INPUT =
  "w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/40";

/**
 * Deal detail. Won/Lost are done by moving to a stage of that type rather than
 * by setting `status` directly — the server derives status, closedAt and the
 * audit entry from the stage change, so this keeps one path for all of it.
 */
export function DealDrawer({
  dealId,
  stages,
  owners,
  onClose,
  onChanged,
}: {
  dealId: string;
  stages: PipelineStage[];
  owners: UserRef[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askLost, setAskLost] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [form, setForm] = useState({
    title: "", value: "", currency: "INR", stageId: "", ownerId: "", expectedCloseDate: "", notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch<Deal>(`/deals/${dealId}`);
      setDeal(d);
      setForm({
        title: d.title,
        value: String(Number(d.value ?? 0) || ""),
        currency: d.currency,
        stageId: d.stageId || "",
        ownerId: d.ownerId || "",
        expectedCloseDate: d.expectedCloseDate ? d.expectedCloseDate.slice(0, 10) : "",
        notes: d.notes || "",
      });
      setLostReason(d.lostReason || "");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deal");
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => { load(); }, [load]);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await apiFetch<Deal>(`/deals/${dealId}`, { method: "PUT", body: JSON.stringify(body) });
      setDeal(updated);
      onChanged();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await patch({
      title: form.title,
      value: form.value ? Number(form.value) : 0,
      currency: form.currency,
      stageId: form.stageId || undefined,
      ownerId: form.ownerId || null,
      expectedCloseDate: form.expectedCloseDate || null,
      notes: form.notes || null,
    });
    await load();
  };

  const moveToType = async (type: "Won" | "Lost" | "Open", reason?: string) => {
    const target =
      type === "Open"
        ? stages.find((s) => s.type === "Open")
        : stages.find((s) => s.type === type);
    if (!target) {
      setError(`No ${type} stage exists. Add one in pipeline settings.`);
      return;
    }
    const ok = await patch({ stageId: target.id, ...(type === "Lost" ? { lostReason: reason || null } : {}) });
    if (ok) {
      setAskLost(false);
      await load();
    }
  };

  const remove = async () => {
    if (!confirm("Delete this deal? Its activity history goes with it.")) return;
    try {
      await apiFetch(`/deals/${dealId}`, { method: "DELETE" });
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const closed = deal?.status === "Won" || deal?.status === "Lost";

  return (
    <>
      <div className="fixed inset-0 z-40 glass-overlay" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-full flex-col overflow-hidden bg-white shadow-2xl sm:w-[480px]">
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-stone-200/70 px-3">
          <div className="flex min-w-0 items-center gap-2">
            {deal?.stage && <StageDot color={deal.stage.color} type={deal.stage.type} />}
            <p className="truncate text-sm font-semibold text-stone-900">{deal?.title || "Deal"}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button onClick={remove} className="rounded p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600" title="Delete deal">
              <TbTrash size={15} />
            </button>
            <button onClick={onClose} className="rounded p-1.5 text-stone-400 hover:bg-stone-100">
              <TbX size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded bg-stone-100" />)}
          </div>
        ) : !deal ? (
          <p className="p-4 text-sm text-stone-500">{error || "Deal not found."}</p>
        ) : (
          <div className="flex-1 space-y-4 overflow-auto p-3">
            {/* Headline value + outcome controls */}
            <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-2.5">
              <p className="text-lg font-semibold tabular-nums text-stone-900">
                {formatMoney(deal.value, deal.currency)}
              </p>
              <p className="mt-0.5 text-[11px] text-stone-500">
                {deal.stage?.name || "No stage"}
                {deal.status === "Open" && deal.stage ? ` · ${deal.stage.probability}% probability` : ""}
                {closed && deal.closedAt ? ` · closed ${relativeTime(deal.closedAt)}` : ""}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {closed ? (
                  <TBtn onClick={() => moveToType("Open")} disabled={saving}>
                    <TbRotateClockwise size={13} /> Reopen
                  </TBtn>
                ) : (
                  <>
                    <button
                      onClick={() => moveToType("Won")}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <TbTrophy size={13} /> Mark won
                    </button>
                    <button
                      onClick={() => setAskLost((v) => !v)}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                    >
                      <TbCircleX size={13} /> Mark lost
                    </button>
                  </>
                )}
              </div>

              {askLost && (
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") moveToType("Lost", lostReason); }}
                    placeholder="Why was it lost?"
                    className={INPUT}
                  />
                  <TBtn variant="danger" onClick={() => moveToType("Lost", lostReason)} disabled={saving}>Confirm</TBtn>
                </div>
              )}

              {deal.status === "Lost" && deal.lostReason && (
                <p className="mt-2 rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700">
                  Lost: {deal.lostReason}
                </p>
              )}
            </div>

            {/* Linked records */}
            <div className="flex flex-wrap gap-3 text-[12px] text-stone-600">
              {deal.account && (
                <span className="flex items-center gap-1"><TbBuilding size={12} className="text-stone-400" /> {deal.account.name}</span>
              )}
              {deal.primaryLead && (
                <span className="flex items-center gap-1"><TbUser size={12} className="text-stone-400" /> {deal.primaryLead.name}</span>
              )}
              {deal.expectedCloseDate && (
                <span className="text-stone-400">Expected {formatDate(deal.expectedCloseDate)}</span>
              )}
            </div>

            {error && <p className="rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700">{error}</p>}

            {/* Editable fields */}
            <form onSubmit={save} className="space-y-2.5">
              <Field label="Title">
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={INPUT} />
              </Field>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Value">
                  <input type="number" min={0} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={cn(INPUT, "tabular-nums")} />
                </Field>
                <Field label="Currency">
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={INPUT}>
                    {["INR", "USD", "EUR", "GBP"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Stage">
                  <select value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })} className={INPUT}>
                    {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="Expected close">
                  <input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} className={INPUT} />
                </Field>
              </div>

              <Field label="Owner">
                <select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} className={INPUT}>
                  <option value="">Unassigned</option>
                  {owners.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
                </select>
              </Field>

              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="h-20 w-full resize-none rounded border border-stone-200 bg-white px-2 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </Field>

              <div className="flex justify-end">
                <TBtn variant="solid" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</TBtn>
              </div>
            </form>

            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">Activity</p>
              <Timeline dealId={dealId} onLogged={onChanged} />
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</span>
      {children}
    </label>
  );
}
