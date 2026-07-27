"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { GroupList } from "./GroupList";
import { GroupMembersPanel } from "./GroupMembersPanel";
import type { ContactGroupSummary } from "./types";

export function ContactsPage() {
  const [groups, setGroups] = useState<ContactGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      const data = await apiFetch<ContactGroupSummary[]>("/contact-groups");
      setGroups(data);
      setSelectedGroupId((prev) => prev && data.some((g) => g.id === prev) ? prev : data[0]?.id ?? null);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl glass-panel">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
        <SubNavToggle />
        <div>
          <h1 className="text-base font-semibold tracking-tight text-gray-900">Contacts</h1>
          <p className="text-xs text-gray-500">Organize leads into named groups to target with campaigns.</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <GroupList
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelect={setSelectedGroupId}
          onCreated={(id) => {
            fetchGroups();
            setSelectedGroupId(id);
          }}
        />

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-stone-400">Loading groups...</div>
        ) : selectedGroup ? (
          <GroupMembersPanel
            key={selectedGroup.id}
            group={selectedGroup}
            onGroupChanged={fetchGroups}
            onGroupDeleted={() => {
              setSelectedGroupId(null);
              fetchGroups();
            }}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-stone-400">
            Create a group on the left to start organizing contacts.
          </div>
        )}
      </div>
    </main>
  );
}
