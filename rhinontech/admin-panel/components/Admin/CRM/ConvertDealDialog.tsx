"use client";

import { useEffect, useState } from "react";
import { TbX, TbTargetArrow } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import type { Lead, PipelineStage, UserRef } from "./types";
import { TBtn } from "./ui";

const INPUT =
  "w-full rounded border border-border bg-card px-2 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/40";

/**
 * Turns a qualified lead into a deal. Creating the deal also links (or creates)
 * the lead's account server-side and marks the lead Qualified — see
 * POST /leads/:id/convert.
 */
export function ConvertDealDialog({ lead, onClose }: { lead: Lead; onClose: (created: boolean) => void }) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [owners, setOwners] = useState<UserRef[]>([]);
  const [form, setForm] = useState({
    title: `${lead.company} — ${lead.name}`,
    value: "",
    currency: "INR",
    stageId: "",
    ownerId: lead.ownerId || "",
    expectedCloseDate: "",
  });
  const [saving, setSaving] = useState(false);
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
      await apiFetch(`/leads/${lead.id}/convert`, {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          value: form.value ? Number(form.value) : 0,
          currency: form.currency,
          stageId: form.stageId || undefined,
          ownerId: form.ownerId || undefined,
          expectedCloseDate: form.expectedCloseDate || undefined,
        }),
      });
      onClose(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert lead");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center glass-overlay p-4" onClick={() => onClose(false)}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md rounded-xl glass-modal p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <TbTargetArrow size={16} className="text-muted-foreground" /> Convert to deal
          </h2>
          <button type="button" onClick={() => onClose(false)} className="rounded p-1 text-muted-foreground hover:bg-muted">
            <TbX size={16} />
          </button>
        </div>
        <p className="mb-3 text-[11px] text-muted-foreground">
          Creates a deal for <span className="font-medium text-foreground/85">{lead.name}</span>, links the account, and marks the lead Qualified.
        </p>

        <div className="space-y-2.5">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Deal title</span>
            <input required autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={INPUT} />
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Value</span>
              <input type="number" min={0} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="500000" className={cn(INPUT, "tabular-nums")} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Currency</span>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={INPUT}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stage</span>
              <select value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })} className={INPUT}>
                {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expected close</span>
              <input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} className={INPUT} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Owner</span>
            <select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} className={INPUT}>
              <option value="">Me</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
            </select>
          </label>
        </div>

        {error && <p className="mt-2.5 rounded border border-rose-200 dark:border-rose-400/25 bg-rose-50 dark:bg-rose-400/10 px-2 py-1.5 text-[11px] text-rose-700 dark:text-rose-300">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <TBtn onClick={() => onClose(false)}>Cancel</TBtn>
          <TBtn variant="solid" type="submit" disabled={saving || !form.title.trim()}>
            {saving ? "Converting…" : "Create deal"}
          </TBtn>
        </div>
      </form>
    </div>
  );
}
