"use client";

import { useMemo, useState } from "react";
import { TbLoader, TbMailForward, TbRobot } from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadPicker } from "../shared/LeadPicker";
import { WEEK_DAYS, type Campaign, type CampaignMode, type Template } from "../shared/types";

type Step = "mode" | "details" | "leads";

const MODE_CARDS: { mode: CampaignMode; icon: React.ReactNode; title: string; description: string; points: string[] }[] = [
  {
    mode: "template",
    icon: <TbMailForward size={26} />,
    title: "Template Blast",
    description: "Mail-merge one template to every enrolled lead on a schedule.",
    points: ["Pick an email template", "AI lightly personalizes each email", "Sends automatically on your schedule"],
  },
  {
    mode: "agent",
    icon: <TbRobot size={26} />,
    title: "AI Agent",
    description: "The agent researches each lead and writes a 1:1 email. Nothing sends until you approve it.",
    points: ["Per-lead research & custom drafts", "You review and approve every email", "Best for high-value prospects"],
  },
];

export function CreateCampaignWizard({
  open,
  onOpenChange,
  templates,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Template[];
  onCreated: () => void;
}) {
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<CampaignMode>("template");
  const [saving, setSaving] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    name: "",
    channel: "Email" as "Email" | "Cold Email",
    templateId: "",
    dailyLimit: 50,
    startDate: new Date().toISOString().split("T")[0],
    runTime: "09:00",
    scheduleDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] as string[],
    objective: "",
  });

  const emailTemplates = useMemo(
    () => templates.filter((t) => !t.channel || !t.channel.startsWith("LinkedIn")),
    [templates]
  );

  const reset = () => {
    setStep("mode");
    setMode("template");
    setCreatedId(null);
    setSelectedLeadIds(new Set());
    setForm({
      name: "",
      channel: "Email",
      templateId: "",
      dailyLimit: 50,
      startDate: new Date().toISOString().split("T")[0],
      runTime: "09:00",
      scheduleDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      objective: "",
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "template" && !form.templateId) {
      toast.error("Pick a template — template-blast campaigns need one.");
      return;
    }
    setSaving(true);
    try {
      const campaign = await apiFetch<Campaign>("/campaigns", {
        method: "POST",
        body: JSON.stringify({ ...form, templateId: form.templateId || null, mode }),
      });
      setCreatedId(campaign.id);
      setStep("leads");
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  };

  const handleEnrollAndFinish = async () => {
    if (!createdId) return;
    setEnrolling(true);
    try {
      if (selectedLeadIds.size > 0) {
        await apiFetch(`/campaigns/${createdId}/enroll`, {
          method: "POST",
          body: JSON.stringify({ leadIds: Array.from(selectedLeadIds) }),
        });
      }
      toast.success(
        selectedLeadIds.size > 0 ? `Campaign created with ${selectedLeadIds.size} leads enrolled` : "Campaign created"
      );
      handleOpenChange(false);
      onCreated();
    } catch (err: any) {
      toast.error("Enrollment failed: " + err.message);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>
            {step === "mode" ? "New Email Campaign" : step === "details" ? "Campaign Details" : "Enroll Leads"}
          </SheetTitle>
          <SheetDescription>
            {step === "mode"
              ? "Step 1 of 3 — choose how emails get written"
              : step === "details"
              ? "Step 2 of 3 — name, template & schedule"
              : "Step 3 of 3 — pick leads from your CRM"}
          </SheetDescription>
        </SheetHeader>

        {step === "mode" && (
          <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
            {MODE_CARDS.map((card) => (
              <button
                key={card.mode}
                type="button"
                onClick={() => setMode(card.mode)}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border-2 p-5 text-left transition-colors",
                  mode === card.mode
                    ? card.mode === "agent"
                      ? "border-violet-500 bg-violet-50/50"
                      : "border-indigo-500 bg-indigo-50/50"
                    : "border-stone-200 bg-white hover:border-stone-300"
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-3",
                    mode === card.mode ? (card.mode === "agent" ? "text-violet-600" : "text-indigo-600") : "text-stone-500"
                  )}
                >
                  {card.icon}
                  <span className="text-base font-bold text-stone-900">{card.title}</span>
                </div>
                <p className="text-sm text-stone-600">{card.description}</p>
                <ul className="mt-1 space-y-1">
                  {card.points.map((p) => (
                    <li key={p} className="text-xs text-stone-400">
                      · {p}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
            <div className="mt-auto flex justify-end border-t pt-4">
              <Button onClick={() => setStep("details")}>Next: Details →</Button>
            </div>
          </div>
        )}

        {step === "details" && (
          <form onSubmit={handleCreate} className="flex flex-1 flex-col gap-4 overflow-auto p-4">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Q4 Founder Outreach"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v as any })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Cold Email">Cold Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Template{" "}
                {mode === "agent" && <span className="font-normal text-stone-400">(optional — agent writes from research)</span>}
              </Label>
              <Select
                value={form.templateId || "none"}
                onValueChange={(v) => setForm({ ...form, templateId: v === "none" ? "" : v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {emailTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mode === "template" && emailTemplates.length === 0 && (
                <p className="text-xs font-medium text-amber-600">No email templates found — create one in Templates first.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="daily-limit">Daily Limit</Label>
                <Input
                  id="daily-limit"
                  type="number"
                  min={1}
                  required
                  value={form.dailyLimit}
                  onChange={(e) => setForm({ ...form, dailyLimit: parseInt(e.target.value) || 50 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="run-time">Run Time</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="run-time"
                  type="time"
                  value={form.runTime}
                  onChange={(e) => setForm({ ...form, runTime: e.target.value })}
                  className="w-32"
                />
                <span className="text-xs text-stone-400">Daily send time (24h)</span>
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
              <p className="text-[10px] text-stone-400">The engine only sends on selected days.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="objective">Objective</Label>
              <Textarea
                id="objective"
                value={form.objective}
                onChange={(e) => setForm({ ...form, objective: e.target.value })}
                placeholder="Goal of this campaign..."
                className="h-24 resize-none"
              />
            </div>

            <div className="mt-auto flex items-center justify-between border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => setStep("mode")}>
                ← Back
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <TbLoader className="animate-spin" size={14} /> Creating...
                  </>
                ) : (
                  "Next: Add Leads →"
                )}
              </Button>
            </div>
          </form>
        )}

        {step === "leads" && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <p className="text-xs text-stone-500">
              Select leads to enroll. You can also enroll more later from the campaign page.
            </p>
            <LeadPicker selectedIds={selectedLeadIds} onChange={setSelectedLeadIds} />
            <div className="flex items-center justify-end border-t pt-4">
              <Button onClick={handleEnrollAndFinish} disabled={enrolling}>
                {enrolling ? (
                  <>
                    <TbLoader className="animate-spin" size={14} /> Enrolling...
                  </>
                ) : selectedLeadIds.size > 0 ? (
                  `Enroll ${selectedLeadIds.size} Lead${selectedLeadIds.size > 1 ? "s" : ""} & Finish`
                ) : (
                  "Skip & Finish"
                )}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
