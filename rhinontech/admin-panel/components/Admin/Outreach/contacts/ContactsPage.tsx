"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { cn } from "@/lib/utils";
import { GroupList } from "./GroupList";
import { GroupMembersPanel } from "./GroupMembersPanel";
import type { ContactGroupSummary } from "./types";

export function ContactsPage() {
  const [groups, setGroups] = useState<ContactGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

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
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-r-xl max-sm:rounded-xl glass-panel">
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-3 sm:px-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <SubNavToggle />
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight text-gray-900 truncate">Contacts</h1>
            <p className="hidden text-xs text-gray-500 sm:block truncate">Organize leads into named groups to target with campaigns.</p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className={cn(
            "h-full w-full md:w-[260px] lg:w-[280px] shrink-0",
            mobileDetailOpen ? "hidden md:block" : "block"
          )}
        >
          <GroupList
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelect={(id) => {
              setSelectedGroupId(id);
              setMobileDetailOpen(true);
            }}
            onCreated={(id) => {
              fetchGroups();
              setSelectedGroupId(id);
              setMobileDetailOpen(true);
            }}
          />
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            !mobileDetailOpen ? "hidden md:flex" : "flex"
          )}
        >
          {loading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-stone-400">Loading groups...</div>
          ) : selectedGroup ? (
            <GroupMembersPanel
              key={selectedGroup.id}
              group={selectedGroup}
              onGroupChanged={fetchGroups}
              onGroupDeleted={() => {
                setSelectedGroupId(null);
                setMobileDetailOpen(false);
                fetchGroups();
              }}
              onBack={() => setMobileDetailOpen(false)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-stone-400 p-6 text-center">
              Create a group on the left to start organizing contacts.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
