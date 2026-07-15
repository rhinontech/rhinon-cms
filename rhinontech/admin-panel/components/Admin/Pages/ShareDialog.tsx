"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TbTrash, TbWorld, TbLock } from "react-icons/tb";
import { apiFetch } from "@/lib/api";
import type { PageShareEntry } from "./types";

interface Member {
  id: string;
  fullName: string;
}

export function ShareDialog({
  pageId,
  open,
  onOpenChange,
  visibility,
  onVisibilityChange,
}: {
  pageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibility: "private" | "workspace";
  onVisibilityChange: (v: "private" | "workspace") => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [shares, setShares] = useState<PageShareEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickUserId, setPickUserId] = useState("");
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setForbidden(false);
    Promise.all([
      apiFetch<Member[]>("/people").catch(() => []),
      apiFetch<PageShareEntry[]>(`/pages/${pageId}/shares`),
    ])
      .then(([people, existing]) => {
        setMembers(people);
        setShares(existing.map((s) => ({ userId: s.userId, access: s.access })));
      })
      .catch(() => setForbidden(true))
      .finally(() => setLoading(false));
  }, [open, pageId]);

  const availableMembers = members.filter((m) => !shares.some((s) => s.userId === m.id));

  const addShare = () => {
    if (!pickUserId) return;
    setShares((prev) => [...prev, { userId: pickUserId, access: "view" }]);
    setPickUserId("");
  };

  const removeShare = (userId: string) => setShares((prev) => prev.filter((s) => s.userId !== userId));

  const setAccess = (userId: string, access: "view" | "edit") =>
    setShares((prev) => prev.map((s) => (s.userId === userId ? { ...s, access } : s)));

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch(`/pages/${pageId}/shares`, {
        method: "PUT",
        body: JSON.stringify(shares.map((s) => ({ userId: s.userId, access: s.access }))),
      });
      onOpenChange(false);
    } catch (err: any) {
      alert(err.message || "Failed to update sharing");
    } finally {
      setSaving(false);
    }
  };

  const memberName = (id: string) => members.find((m) => m.id === id)?.fullName || "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>Share this page</DialogTitle>

        {loading ? (
          <div className="py-8 text-center text-sm text-stone-400">Loading…</div>
        ) : forbidden ? (
          <div className="py-8 text-center text-sm text-stone-400">Only the page owner can manage sharing.</div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => onVisibilityChange(visibility === "workspace" ? "private" : "workspace")}
              className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-3 py-2.5 text-left hover:bg-stone-50"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-stone-800">
                {visibility === "workspace" ? <TbWorld size={16} className="text-emerald-600" /> : <TbLock size={16} className="text-stone-400" />}
                {visibility === "workspace" ? "Everyone at Rhinon can view" : "Only invited people"}
              </span>
              <span className="text-xs font-semibold text-stone-500">{visibility === "workspace" ? "Make private" : "Make workspace-visible"}</span>
            </button>

            <div className="flex gap-2">
              <select
                value={pickUserId}
                onChange={(e) => setPickUserId(e.target.value)}
                className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="">Add a team member…</option>
                {availableMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName}</option>
                ))}
              </select>
              <button
                onClick={addShare}
                disabled={!pickUserId}
                className="rounded-lg bg-stone-900 px-3.5 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>

            <div className="max-h-56 space-y-1.5 overflow-y-auto">
              {shares.length === 0 ? (
                <p className="py-3 text-center text-xs text-stone-400">Not shared with anyone individually yet.</p>
              ) : (
                shares.map((s) => (
                  <div key={s.userId} className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2">
                    <span className="truncate text-sm text-stone-800">{memberName(s.userId)}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={s.access}
                        onChange={(e) => setAccess(s.userId, e.target.value as "view" | "edit")}
                        className="rounded border border-stone-200 bg-white px-1.5 py-1 text-xs outline-none"
                      >
                        <option value="view">Can view</option>
                        <option value="edit">Can edit</option>
                      </select>
                      <button onClick={() => removeShare(s.userId)} className="text-stone-300 hover:text-red-600">
                        <TbTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
              <button onClick={() => onOpenChange(false)} className="rounded-lg px-3.5 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="rounded-lg bg-stone-900 px-3.5 py-2 text-sm font-medium text-white disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
