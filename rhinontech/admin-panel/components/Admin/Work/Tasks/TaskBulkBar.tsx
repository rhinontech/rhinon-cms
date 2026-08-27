"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TbLoader, TbX } from "react-icons/tb";
import { apiFetch } from "@/lib/api";
import { PRIORITIES, STATUSES } from "./constants";
import type { PersonOption, TaskPriority, TaskStatus } from "./types";

/**
 * Bulk edit for the current list selection.
 *
 * Fans out one request per task — there is no bulk endpoint yet. Uses
 * allSettled, not all: with `all` a single 403 aborted the batch AND skipped the
 * clear/refetch, leaving the UI showing stale rows as if nothing had happened.
 */
export function TaskBulkBar({
  selectedIds, people, onClear, onDone,
}: {
  selectedIds: Set<string>;
  people: PersonOption[];
  onClear: () => void;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [assignee, setAssignee] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [busy, setBusy] = useState(false);

  const ids = Array.from(selectedIds);
  if (ids.length === 0) return null;

  const run = async (body: Record<string, unknown>, verb: string) => {
    setBusy(true);
    const results = await Promise.allSettled(
      ids.map((id) => apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) }))
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    setBusy(false);
    onClear();
    onDone();
    if (failed === 0) toast.success(`${verb} ${ids.length} task${ids.length === 1 ? "" : "s"}.`);
    else toast.warning(`${ids.length - failed} of ${ids.length} updated — ${failed} failed (you may not have access).`);
  };

  const remove = async () => {
    setBusy(true);
    const results = await Promise.allSettled(ids.map((id) => apiFetch(`/tasks/${id}`, { method: "DELETE" })));
    const failed = results.filter((r) => r.status === "rejected").length;
    setBusy(false);
    onClear();
    onDone();
    if (failed === 0) toast.success(`Deleted ${ids.length} task${ids.length === 1 ? "" : "s"}.`);
    else toast.warning(`${ids.length - failed} of ${ids.length} deleted — ${failed} failed.`);
  };

  const selectClass = "rounded-md border border-stone-300 bg-white px-2 py-1 text-xs outline-none";

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-blue-50/70 px-3 py-2 sm:px-4">
      <span className="text-xs font-semibold text-blue-900">{ids.length} selected</span>

      <select
        value={status}
        onChange={(e) => { const v = e.target.value as TaskStatus; setStatus(v); if (v) run({ status: v }, "Moved"); }}
        className={selectClass}
        disabled={busy}
      >
        <option value="">Set status…</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <select
        value={assignee}
        onChange={(e) => { const v = e.target.value; setAssignee(v); if (v) run({ assigneeId: v === "__none" ? null : v }, "Reassigned"); }}
        className={selectClass}
        disabled={busy}
      >
        <option value="">Assign to…</option>
        <option value="__none">Unassigned</option>
        {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
      </select>

      <select
        value={priority}
        onChange={(e) => { const v = e.target.value as TaskPriority; setPriority(v); if (v) run({ priority: v }, "Updated"); }}
        className={selectClass}
        disabled={busy}
      >
        <option value="">Set priority…</option>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <button onClick={remove} disabled={busy} className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
        Delete
      </button>

      {busy && <TbLoader size={14} className="animate-spin text-blue-700" />}

      <button onClick={onClear} className="ml-auto rounded p-1 text-blue-900/60 hover:bg-blue-100" aria-label="Clear selection">
        <TbX size={14} />
      </button>
    </div>
  );
}
