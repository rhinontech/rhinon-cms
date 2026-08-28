"use client";

import { useEffect, useState } from "react";
import { TbUsersGroup, TbLoader } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ContactGroupSummary } from "./types";

/** Bulk "add these leads to a contact group" popover — used from the CRM Leads table. */
export function AddToGroupMenu({ leadIds, onDone }: { leadIds: string[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<ContactGroupSummary[]>([]);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) apiFetch<ContactGroupSummary[]>("/contact-groups").then(setGroups).catch(() => {});
  }, [open]);

  const addToGroup = async (groupId: string) => {
    setSaving(true);
    try {
      await apiFetch(`/contact-groups/${groupId}/members`, {
        method: "POST",
        body: JSON.stringify({ leadIds }),
      });
      toast.success(`${leadIds.length} lead${leadIds.length === 1 ? "" : "s"} added to group`);
      setOpen(false);
      onDone();
    } catch (err: any) {
      toast.error(err.message || "Failed to add to group");
    } finally {
      setSaving(false);
    }
  };

  const createAndAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const group = await apiFetch<ContactGroupSummary>("/contact-groups", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName("");
      await addToGroup(group.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to create group");
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-900 dark:text-blue-200 hover:bg-card">
          <TbUsersGroup size={14} /> Add to Group
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Existing groups</p>
        <div className="max-h-40 overflow-auto">
          {groups.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted-foreground">No groups yet.</p>
          ) : (
            groups.map((g) => (
              <button
                key={g.id}
                onClick={() => addToGroup(g.id)}
                disabled={saving}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted disabled:opacity-60"
              >
                <span className="truncate">{g.name}</span>
                <span className="text-xs text-muted-foreground">{g.memberCount}</span>
              </button>
            ))
          )}
        </div>
        <div className="mt-2 flex items-center gap-2 border-t pt-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New group name..."
            className="w-full rounded-lg border border-border px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={createAndAdd}
            disabled={saving || !newName.trim()}
            className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? <TbLoader className="animate-spin" size={14} /> : "Add"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
