"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ContactGroupSummary } from "./types";

/**
 * Resolves a chosen saved Group to its full member lead-id set, feeding the
 * same selectedIds/onChange contract LeadPicker uses — so callers (enroll
 * flows) don't need to know whether the ids came from a hand-pick or a group.
 */
export function GroupPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [groups, setGroups] = useState<ContactGroupSummary[]>([]);
  const [groupId, setGroupId] = useState<string>("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    apiFetch<ContactGroupSummary[]>("/contact-groups").then(setGroups).catch(() => {});
  }, []);

  const handlePick = async (id: string) => {
    setGroupId(id);
    setResolving(true);
    try {
      const data = await apiFetch<{ ids: string[] }>(`/contact-groups/${id}/members?idsOnly=1`);
      onChange(new Set(data.ids));
    } catch {
      toast.error("Failed to load group members");
    } finally {
      setResolving(false);
    }
  };

  const selectedGroup = groups.find((g) => g.id === groupId);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <Select value={groupId} onValueChange={handlePick} disabled={groups.length === 0}>
        <SelectTrigger>
          <SelectValue placeholder={groups.length === 0 ? "No contact groups yet" : "Choose a contact group..."} />
        </SelectTrigger>
        <SelectContent>
          {groups.map((g) => (
            <SelectItem key={g.id} value={g.id}>
              {g.name} ({g.memberCount})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Create a group under Outreach → Contacts, then come back to target it here.
        </p>
      ) : resolving ? (
        <p className="text-sm text-muted-foreground">Loading group members…</p>
      ) : groupId ? (
        <p className="text-sm text-muted-foreground">
          {selectedGroup?.name} — {selectedIds.size} contact{selectedIds.size === 1 ? "" : "s"} selected
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Pick a group to select all of its contacts at once.</p>
      )}
    </div>
  );
}
