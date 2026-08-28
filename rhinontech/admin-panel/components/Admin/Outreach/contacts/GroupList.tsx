"use client";

import { useState } from "react";
import { TbPlus, TbUsers, TbSearch } from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import type { ContactGroupSummary } from "./types";

export function GroupList({
  groups,
  selectedGroupId,
  onSelect,
  onCreated,
}: {
  groups: ContactGroupSummary[];
  selectedGroupId: string | null;
  onSelect: (id: string) => void;
  onCreated: (newGroupId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const group = await apiFetch<ContactGroupSummary>("/contact-groups", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName("");
      setCreating(false);
      onCreated(group.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to create group");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full max-sm:w-full w-[280px] flex-col border-r">
      <div className="flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <TbSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="w-full rounded-lg border border-border py-1.5 pl-8 pr-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setCreating((c) => !c)}
          className="shrink-0 rounded-lg border border-border p-1.5 text-foreground/70 hover:bg-muted"
          title="New group"
        >
          <TbPlus size={16} />
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="flex items-center gap-2 px-3 pb-3">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Group name..."
            className="w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? "..." : "Add"}
          </button>
        </form>
      )}

      <div className="flex-1 overflow-auto px-2 pb-2">
        {filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            {groups.length === 0 ? "No groups yet — create one to get started." : "No groups match your search."}
          </p>
        ) : (
          filtered.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelect(g.id)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted",
                selectedGroupId === g.id && "bg-blue-50 dark:bg-blue-400/10 text-blue-900 dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-400/10"
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <TbUsers size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{g.name}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{g.memberCount}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
