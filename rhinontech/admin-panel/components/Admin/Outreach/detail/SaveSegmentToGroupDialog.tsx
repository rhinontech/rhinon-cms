"use client";

import { useEffect, useMemo, useState } from "react";
import { TbAlertTriangle, TbCheck, TbLoader, TbUsersPlus } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ContactGroupSummary } from "../contacts/types";

export interface GroupSegment {
  key: string;
  label: string;
  hint: string;
  leadIds: string[];
}

/**
 * Turns one engagement segment of a campaign's inbox (not opened / opened but
 * silent / replied) into a reusable contact group, so the obvious follow-up
 * campaign can target it without re-deriving the list by hand.
 */
export function SaveSegmentToGroupDialog({
  open,
  onOpenChange,
  segments,
  defaultSegmentKey,
  campaignName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segments: GroupSegment[];
  defaultSegmentKey: string;
  campaignName?: string;
}) {
  const [segmentKey, setSegmentKey] = useState(defaultSegmentKey);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [newName, setNewName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<ContactGroupSummary[]>([]);
  const [saving, setSaving] = useState(false);

  const segment = useMemo(
    () => segments.find((s) => s.key === segmentKey) ?? segments[0],
    [segments, segmentKey]
  );

  // Reset to the caller's context each time it opens, and pre-fill a name that
  // says where the list came from — these groups are easy to lose track of.
  useEffect(() => {
    if (!open) return;
    setSegmentKey(defaultSegmentKey);
    setMode("new");
    setGroupId("");
    setSaving(false);
    apiFetch<ContactGroupSummary[]>("/contact-groups").then(setGroups).catch(() => setGroups([]));
  }, [open, defaultSegmentKey]);

  useEffect(() => {
    if (!open || !segment) return;
    const base = campaignName ? `${campaignName} — ${segment.label}` : segment.label;
    setNewName(base);
  }, [open, segment, campaignName]);

  const count = segment?.leadIds.length ?? 0;
  const canSave =
    count > 0 && !saving && (mode === "new" ? newName.trim().length > 0 : Boolean(groupId));

  const handleSave = async () => {
    if (!segment || !canSave) return;
    setSaving(true);
    try {
      let targetId = groupId;
      let targetName = groups.find((g) => g.id === groupId)?.name ?? "";

      if (mode === "new") {
        const created = await apiFetch<ContactGroupSummary>("/contact-groups", {
          method: "POST",
          body: JSON.stringify({
            name: newName.trim(),
            description: campaignName
              ? `${segment.label} from the "${campaignName}" campaign.`
              : segment.label,
          }),
        });
        targetId = created.id;
        targetName = created.name;
      }

      const result = await apiFetch<{ memberCount: number }>(`/contact-groups/${targetId}/members`, {
        method: "POST",
        body: JSON.stringify({ leadIds: segment.leadIds }),
      });

      toast.success(
        `Added ${count} contact${count === 1 ? "" : "s"} to "${targetName}" — ${result.memberCount} total.`
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save contact group");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save to contact group</DialogTitle>
          <DialogDescription>
            Turn how people responded to this campaign into a reusable list you can target next.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Who to save</Label>
            <div className="grid gap-2">
              {segments.map((s) => {
                const active = s.key === segmentKey;
                const empty = s.leadIds.length === 0;
                return (
                  <button
                    key={s.key}
                    type="button"
                    disabled={empty}
                    onClick={() => setSegmentKey(s.key)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      active
                        ? "border-blue-300 dark:border-blue-400/30 bg-blue-50/70 dark:bg-blue-400/10"
                        : "border-border hover:bg-muted/40",
                      empty && "cursor-not-allowed opacity-40 hover:bg-transparent"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{s.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{s.hint}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-bold tabular-nums text-foreground/85">{s.leadIds.length}</span>
                      {active && <TbCheck size={15} className="text-blue-600 dark:text-blue-300" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Save into</Label>
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {(["new", "existing"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    mode === m ? "bg-card font-semibold text-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
                  )}
                >
                  {m === "new" ? "New group" : "Existing group"}
                </button>
              ))}
            </div>

            {mode === "new" ? (
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Q3 Outreach — Opened, no reply"
              />
            ) : (
              <>
                <Select value={groupId} onValueChange={setGroupId} disabled={groups.length === 0}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={groups.length === 0 ? "No contact groups yet" : "Choose a group..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.memberCount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Adding members runs the workflow engine, which auto-enrolls
                    into any active workflow watching that group — worth knowing
                    before it starts emailing people. */}
                <p className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                  <TbAlertTriangle size={13} className="mt-px shrink-0" />
                  Contacts added to an existing group are auto-enrolled in any active workflow watching it.
                </p>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? <TbLoader className="animate-spin" size={14} /> : <TbUsersPlus size={14} />}
            {count > 0 ? `Save ${count} contact${count === 1 ? "" : "s"}` : "Nothing to save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
