"use client";

import { useEffect, useState } from "react";
import { TbCheck, TbLoader, TbRefresh, TbTrash } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Campaign } from "../shared/types";

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
    autoSend: campaign.autoSend,
    startDate: campaign.startDate.split("T")[0],
    runTime: campaign.runTime || "09:00",
    objective: campaign.objective || "",
    notes: campaign.notes || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      autoSend: campaign.autoSend,
      startDate: campaign.startDate.split("T")[0],
      runTime: campaign.runTime || "09:00",
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
        <div className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-stone-800">Schedule automatic send</p>
            <p className="text-xs text-stone-500">
              When on, the whole enrolled list sends automatically at the date/time below. When off, this campaign only sends via "Send Now".
            </p>
          </div>
          <Switch checked={form.autoSend} onCheckedChange={(v) => setForm((f) => ({ ...f, autoSend: v }))} />
        </div>

        {form.autoSend && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-start-date">Send Date</Label>
              <Input
                id="s-start-date"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-run-time">Send Time</Label>
              <Input
                id="s-run-time"
                type="time"
                value={form.runTime}
                onChange={(e) => setForm((f) => ({ ...f, runTime: e.target.value }))}
              />
            </div>
          </div>
        )}

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
