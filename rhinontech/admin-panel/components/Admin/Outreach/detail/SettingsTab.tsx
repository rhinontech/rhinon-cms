"use client";

import { useEffect, useState } from "react";
import { TbCheck, TbLoader, TbRefresh, TbTrash } from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WEEK_DAYS, type Campaign } from "../shared/types";

export function SettingsTab({
  campaign,
  onSaved,
  onReset,
  onDelete,
}: {
  campaign: Campaign;
  onSaved: () => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const [form, setForm] = useState({
    dailyLimit: campaign.dailyLimit,
    startDate: campaign.startDate.split("T")[0],
    runTime: campaign.runTime || "09:00",
    scheduleDays: campaign.scheduleDays || ["Mon", "Tue", "Wed", "Thu", "Fri"],
    objective: campaign.objective || "",
    notes: campaign.notes || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      dailyLimit: campaign.dailyLimit,
      startDate: campaign.startDate.split("T")[0],
      runTime: campaign.runTime || "09:00",
      scheduleDays: campaign.scheduleDays || ["Mon", "Tue", "Wed", "Thu", "Fri"],
      objective: campaign.objective || "",
      notes: campaign.notes || "",
    });
  }, [campaign]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/campaigns/${campaign.id}`, { method: "PUT", body: JSON.stringify(form) });
      toast.success("Settings saved");
      onSaved();
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-daily-limit">Daily Email Limit</Label>
            <Input
              id="s-daily-limit"
              type="number"
              min={1}
              value={form.dailyLimit}
              onChange={(e) => setForm((f) => ({ ...f, dailyLimit: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-start-date">Start Date</Label>
            <Input
              id="s-start-date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-run-time">Run Time</Label>
          <div className="flex items-center gap-3">
            <Input
              id="s-run-time"
              type="time"
              value={form.runTime}
              onChange={(e) => setForm((f) => ({ ...f, runTime: e.target.value }))}
              className="w-32"
            />
            <span className="text-xs text-stone-400">Daily time the engine runs (24h)</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Active Days</Label>
          <div className="flex flex-wrap gap-1.5">
            {WEEK_DAYS.map((day) => {
              const active = form.scheduleDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      scheduleDays: active ? f.scheduleDays.filter((d) => d !== day) : [...f.scheduleDays, day],
                    }))
                  }
                  className={cn(
                    "rounded-lg border px-3 py-1 text-xs font-bold transition-colors",
                    active
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-white text-stone-400 hover:border-stone-400"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-objective">Objective</Label>
          <Textarea
            id="s-objective"
            rows={3}
            value={form.objective}
            onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
            placeholder="Describe the campaign goal..."
            className="resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-notes">Notes</Label>
          <Textarea
            id="s-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Internal notes about this campaign..."
            className="resize-none"
          />
        </div>

        {campaign.template && (
          <div className="flex items-center justify-between border-t border-stone-100 pt-4">
            <div>
              <p className="text-xs font-bold text-stone-700">Template</p>
              <p className="mt-0.5 text-[10px] text-stone-400">Used for draft generation.</p>
            </div>
            <span className="rounded-lg border border-stone-200 bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
              {campaign.template.name}
            </span>
          </div>
        )}

        <div className="flex justify-end border-t border-stone-100 pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <TbLoader className="animate-spin" size={14} /> : <TbCheck size={14} />}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="space-y-3 rounded-xl border border-red-100 bg-red-50/40 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-red-400">Danger Zone</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-stone-800">Reset campaign</p>
            <p className="text-xs text-stone-500">Re-enroll all leads and clear drafts.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            <TbRefresh size={14} /> Reset
          </Button>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-stone-800">Delete campaign</p>
            <p className="text-xs text-stone-500">Unenrolls all leads. Cannot be undone.</p>
          </div>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <TbTrash size={14} /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
