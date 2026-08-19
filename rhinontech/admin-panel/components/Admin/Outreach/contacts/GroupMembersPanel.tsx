"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TbUpload,
  TbUserPlus,
  TbTrash,
  TbSearch,
  TbX,
  TbBookmark,
  TbUsers,
  TbArrowLeft,
  TbLoader,
} from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LeadImportModal } from "@/components/Admin/CRM/LeadImportModal";
import { LeadPicker } from "../shared/LeadPicker";
import type { ContactGroupSummary, ContactLead } from "./types";

const LEAD_STATUSES = ["New", "Enriched", "Enrolled", "Emailed", "Interested", "Replied", "Bounced", "Unsubscribed"];

interface SavedView {
  id: string;
  name: string;
  search: string;
  status: string;
  source: string;
}

const VIEWS_KEY = "outreach_contacts_savedViews";

function loadSavedViews(): SavedView[] {
  try {
    return JSON.parse(localStorage.getItem(VIEWS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function GroupMembersPanel({
  group,
  onGroupChanged,
  onGroupDeleted,
  onBack,
}: {
  group: ContactGroupSummary;
  onGroupChanged: () => void;
  onGroupDeleted: () => void;
  onBack?: () => void;
}) {
  const confirm = useConfirm();
  const [members, setMembers] = useState<ContactLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [sources, setSources] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [showAddLeads, setShowAddLeads] = useState(false);
  const [addSelectedIds, setAddSelectedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);

  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  useEffect(() => {
    setNameDraft(group.name);
    setSelectedIds(new Set());
  }, [group.id, group.name]);

  useEffect(() => {
    setSavedViews(loadSavedViews());
    apiFetch<string[]>("/leads/sources").then(setSources).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter !== "All") query.set("status", statusFilter);
      if (sourceFilter !== "All") query.set("source", sourceFilter);
      if (search) query.set("search", search);
      const data = await apiFetch<ContactLead[]>(`/contact-groups/${group.id}/members?${query.toString()}`);
      setMembers(data);
    } catch {
      toast.error("Failed to load group members");
    } finally {
      setLoading(false);
    }
  }, [group.id, statusFilter, sourceFilter, search]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const allSelected = members.length > 0 && members.every((m) => selectedIds.has(m.id));
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(members.map((m) => m.id)));
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleRemoveSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!(await confirm({ title: `Remove ${selectedIds.size} contact(s) from "${group.name}"?`, destructive: true }))) return;
    setRemoving(true);
    try {
      await apiFetch(`/contact-groups/${group.id}/members/remove`, {
        method: "POST",
        body: JSON.stringify({ leadIds: Array.from(selectedIds) }),
      });
      setSelectedIds(new Set());
      fetchMembers();
      onGroupChanged();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove contacts");
    } finally {
      setRemoving(false);
    }
  };

  const handleAddLeads = async () => {
    if (addSelectedIds.size === 0) return;
    setAdding(true);
    try {
      await apiFetch(`/contact-groups/${group.id}/members`, {
        method: "POST",
        body: JSON.stringify({ leadIds: Array.from(addSelectedIds) }),
      });
      toast.success(`${addSelectedIds.size} contact(s) added`);
      setAddSelectedIds(new Set());
      setShowAddLeads(false);
      fetchMembers();
      onGroupChanged();
    } catch (err: any) {
      toast.error(err.message || "Failed to add contacts");
    } finally {
      setAdding(false);
    }
  };

  const handleRename = async () => {
    setRenaming(false);
    if (!nameDraft.trim() || nameDraft.trim() === group.name) {
      setNameDraft(group.name);
      return;
    }
    try {
      await apiFetch(`/contact-groups/${group.id}`, { method: "PUT", body: JSON.stringify({ name: nameDraft.trim() }) });
      onGroupChanged();
    } catch (err: any) {
      toast.error(err.message || "Rename failed");
      setNameDraft(group.name);
    }
  };

  const handleDeleteGroup = async () => {
    if (!(await confirm({ title: `Delete group "${group.name}"?`, description: "Contacts stay in the CRM — only the group is removed.", destructive: true }))) return;
    try {
      await apiFetch(`/contact-groups/${group.id}`, { method: "DELETE" });
      toast.success("Group deleted");
      onGroupDeleted();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const saveCurrentAsView = () => {
    const name = window.prompt("Name this view:");
    if (!name || !name.trim()) return;
    const view: SavedView = { id: crypto.randomUUID(), name: name.trim(), search, status: statusFilter, source: sourceFilter };
    const next = [...savedViews, view];
    setSavedViews(next);
    localStorage.setItem(VIEWS_KEY, JSON.stringify(next));
  };

  const applyView = (v: SavedView) => {
    setSearchInput(v.search);
    setSearch(v.search);
    setStatusFilter(v.status);
    setSourceFilter(v.source);
  };

  const removeView = (id: string) => {
    const next = savedViews.filter((v) => v.id !== id);
    setSavedViews(next);
    localStorage.setItem(VIEWS_KEY, JSON.stringify(next));
  };

  const hasActiveFilters = useMemo(() => !!search || statusFilter !== "All" || sourceFilter !== "All", [search, statusFilter, sourceFilter]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-2.5 border-b px-3 sm:px-4 py-2 sm:py-0">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 md:hidden shrink-0"
              aria-label="Back to groups"
            >
              <TbArrowLeft size={18} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            {renaming ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className="w-full max-w-[200px] rounded-lg border border-stone-200 px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h1
                onClick={() => setRenaming(true)}
                className="cursor-text truncate text-sm sm:text-base font-semibold tracking-tight text-gray-900 hover:underline"
                title="Click to rename"
              >
                {group.name}
              </h1>
            )}
            <p className="truncate text-xs text-gray-500">{group.memberCount} contact{group.memberCount === 1 ? "" : "s"} in this list</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button size="sm" variant="outline" className="px-2.5 sm:px-3 text-xs" onClick={() => setShowImport(true)}>
            <TbUpload size={14} /> <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Button size="sm" variant="outline" className="px-2.5 sm:px-3 text-xs" onClick={() => setShowAddLeads(true)}>
            <TbUserPlus size={14} /> <span className="hidden sm:inline">Add Leads</span>
          </Button>
          <Button size="sm" variant="outline" className="px-2 text-red-600 hover:text-red-700" onClick={handleDeleteGroup}>
            <TbTrash size={14} />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-auto p-3 sm:p-4">
        {savedViews.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {savedViews.map((v) => (
              <span key={v.id} className="group inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 py-1 pl-3 pr-1 text-xs font-medium text-stone-600">
                <button onClick={() => applyView(v)} className="hover:text-stone-900">{v.name}</button>
                <button onClick={() => removeView(v.id)} className="rounded-full p-0.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700">
                  <TbX size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search contacts..."
              className="w-full rounded-lg border border-stone-200 py-1.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 sm:w-[140px] md:w-[150px]" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="flex-1 sm:w-[140px] md:w-[150px]" size="sm">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sources</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <button onClick={saveCurrentAsView} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
              <TbBookmark size={13} /> Save as view
            </button>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5">
            <span className="text-sm font-medium text-blue-900">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds(new Set())} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white">
                Clear
              </button>
              <button
                onClick={handleRemoveSelected}
                disabled={removing}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                <TbTrash size={14} /> {removing ? "Removing..." : `Remove ${selectedIds.size}`}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-auto rounded-xl border border-stone-100">
          <div className="grid min-w-[700px] w-full grid-cols-[44px_minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)] border-b bg-stone-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span className="flex items-center justify-center px-2 py-3">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600" />
            </span>
            <span className="px-4 py-3">Contact</span>
            <span className="px-4 py-3">Company</span>
            <span className="px-4 py-3">Source</span>
            <span className="px-4 py-3">Status</span>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-center">
              <TbLoader className="animate-spin text-stone-400" size={30} />
              <p className="text-xs font-medium text-stone-400">Loading contacts...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-gray-400">
              <TbUsers size={28} className="text-stone-300" />
              No contacts in this group yet — import a CSV or add leads above.
            </div>
          ) : (
            members.map((m) => (
              <div key={m.id} className="grid min-w-[700px] w-full grid-cols-[44px_minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)] items-center border-b text-sm hover:bg-stone-50">
                <span className="flex items-center justify-center px-2 py-3">
                  <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleSelect(m.id)} className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600" />
                </span>
                <span className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-stone-900">{m.name}</span>
                    <span className="text-xs text-stone-500">{m.email}</span>
                  </div>
                </span>
                <span className="px-4 py-3 text-gray-600">{m.company}</span>
                <span className="px-4 py-3 truncate text-xs text-gray-500">{m.source}</span>
                <span className="px-4 py-3 text-xs font-semibold text-gray-500">{m.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {showImport && (
        <LeadImportModal
          contactGroupId={group.id}
          groupName={group.name}
          onClose={(didImport) => {
            setShowImport(false);
            if (didImport) {
              fetchMembers();
              onGroupChanged();
            }
          }}
        />
      )}

      <Sheet open={showAddLeads} onOpenChange={setShowAddLeads}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-xl">
          <SheetHeader className="border-b">
            <SheetTitle>Add Leads to "{group.name}"</SheetTitle>
            <SheetDescription>Pick leads from your CRM to add to this group.</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <LeadPicker selectedIds={addSelectedIds} onChange={setAddSelectedIds} />
            <div className="flex justify-end border-t pt-4">
              <Button onClick={handleAddLeads} disabled={adding || addSelectedIds.size === 0}>
                {adding ? "Adding..." : `Add ${addSelectedIds.size || ""} Lead${addSelectedIds.size === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
