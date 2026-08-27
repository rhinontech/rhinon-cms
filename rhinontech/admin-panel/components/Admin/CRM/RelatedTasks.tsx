"use client";

import { useCallback, useEffect, useState } from "react";
import { TbPlus, TbCheck, TbCalendar } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import type { UserRef } from "./types";
import { Avatar, TBtn, formatDate } from "./ui";

interface CrmTask {
  id: string;
  title: string;
  status: "Pending" | "In progress" | "Done";
  priority: "Low" | "Medium" | "High";
  dueDate: string | null;
  assigneeId: string | null;
  assignee?: UserRef | null;
}

/**
 * Follow-ups hanging off a lead / deal / account. Fetched with the record's id
 * as the scope, so it returns every task attached to it regardless of who owns
 * it — not just the viewer's own.
 */
export function RelatedTasks({
  leadId,
  dealId,
  accountId,
  owners,
}: {
  leadId?: string;
  dealId?: string;
  accountId?: string;
  owners: UserRef[];
}) {
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = leadId ? `leadId=${leadId}` : dealId ? `dealId=${dealId}` : `accountId=${accountId}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await apiFetch<CrmTask[]>(`/tasks?${query}`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          dueDate: dueDate || undefined,
          assigneeId: assigneeId || undefined,
          leadId, dealId, accountId,
        }),
      });
      setTitle(""); setDueDate(""); setAssigneeId(""); setAdding(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (task: CrmTask) => {
    const next = task.status === "Done" ? "Pending" : "Done";
    setTasks((cur) => cur.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    try {
      await apiFetch(`/tasks/${task.id}`, { method: "PUT", body: JSON.stringify({ status: next }) });
    } catch {
      load();
    }
  };

  const open = tasks.filter((t) => t.status !== "Done");
  const done = tasks.filter((t) => t.status === "Done");

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          Follow-ups{open.length > 0 && <span className="ml-1 text-stone-400">({open.length} open)</span>}
        </p>
        {!adding && (
          <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-800">
            <TbPlus size={12} /> Add
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-2 rounded-lg border border-stone-200 bg-white/70 p-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") setAdding(false); }}
            placeholder="Call back about pricing…"
            className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded border border-stone-200 bg-white px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="rounded border border-stone-200 bg-white px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Me</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
            </select>
            <span className="flex-1" />
            <TBtn onClick={() => setAdding(false)}>Cancel</TBtn>
            <TBtn variant="solid" onClick={create} disabled={saving || !title.trim()}>
              {saving ? "Adding…" : "Add"}
            </TBtn>
          </div>
        </div>
      )}

      {error && <p className="mb-1.5 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-700">{error}</p>}

      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-6 animate-pulse rounded bg-stone-100" />)}
        </div>
      ) : tasks.length === 0 ? (
        !adding && <p className="py-2 text-[11px] text-stone-400">No follow-ups yet.</p>
      ) : (
        <ul className="space-y-0.5">
          {[...open, ...done].map((task) => {
            const overdue = task.status !== "Done" && task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString());
            return (
              <li key={task.id} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-stone-50">
                <button
                  onClick={() => toggle(task)}
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    task.status === "Done"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-stone-300 hover:border-stone-400"
                  )}
                  title={task.status === "Done" ? "Mark not done" : "Mark done"}
                >
                  {task.status === "Done" && <TbCheck size={11} />}
                </button>
                <span className={cn("min-w-0 flex-1 truncate text-[13px]", task.status === "Done" ? "text-stone-400 line-through" : "text-stone-800")}>
                  {task.title}
                </span>
                {task.dueDate && (
                  <span className={cn("flex shrink-0 items-center gap-1 text-[10px] tabular-nums", overdue ? "text-rose-500" : "text-stone-400")}>
                    <TbCalendar size={10} /> {formatDate(task.dueDate)}
                  </span>
                )}
                <Avatar name={task.assignee?.fullName} size={16} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
