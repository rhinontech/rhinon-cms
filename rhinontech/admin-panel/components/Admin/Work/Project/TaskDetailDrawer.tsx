"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { apiFetch, API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import {
  TbClock, TbFolder, TbHistory, TbLoader, TbPaperclip, TbPlayerPlay, TbPlayerStop, TbSend,
  TbSubtask, TbTrash, TbUnlink, TbUpload, TbX,
} from "react-icons/tb";
import { MentionInput, renderMentions } from "./MentionInput";
import { RichDescription } from "./RichDescription";
import { STATUS_CHIP } from "./constants";
import type { PersonOption, ProjectTask, TaskRow, WorkflowStatus } from "./types";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  author?: { id: string; fullName: string } | null;
}
interface Attachment {
  id: string; name: string; mimeType: string; size: number; url: string | null;
  uploadedBy?: { id: string; fullName: string } | null;
}
interface Activity {
  id: string;
  type: string;
  summary: string;
  createdAt: string;
  actor?: { id: string; fullName: string } | null;
}
/** One merged stream: system entries and comments share a timeline. */
type FeedItem =
  | { kind: "activity"; at: number; data: Activity }
  | { kind: "comment"; at: number; data: Comment };

interface TimePayload {
  entries: { id: string; minutes: number; note: string | null; spentOn: string; user?: { fullName: string } | null }[];
  totalMinutes: number;
}

function hhmm(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function TaskDetailDrawer({
  task, rows, statuses, people, projectName, onClose, onPatch, onDelete, onCreateChild, onRemoveDependency, onChanged,
}: {
  task: ProjectTask;
  projectName?: string;
  rows: TaskRow[];
  statuses: WorkflowStatus[];
  people: PersonOption[];
  onClose: () => void;
  onPatch: (id: string, patch: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  onCreateChild: (title: string, parentId: string) => void;
  onRemoveDependency: (taskId: string, depId: string) => void;
  onChanged: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [time, setTime] = useState<TimePayload>({ entries: [], totalMinutes: 0 });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [body, setBody] = useState("");
  const [childTitle, setChildTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Live timer. Only the elapsed seconds live here; the total is logged once on stop.
  const [runningSince, setRunningSince] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (runningSince === null) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [runningSince]);
  const elapsedSec = runningSince ? Math.floor((Date.now() - runningSince) / 1000) : 0;

  const panelRef = useRef<HTMLElement>(null);

  /**
   * Dismiss on an outside click or Escape.
   *
   * `onClose` is an inline arrow in the parent, so it changes identity every
   * render — held in a ref rather than listed as a dependency, which would
   * rebind both listeners on every keystroke in this panel.
   */
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const el = panelRef.current;
      if (!el || el.contains(e.target as Node)) return;
      // Clicking another task means "switch", not "dismiss". Closing here would
      // unmount the drawer before that task's click lands, so it would flicker
      // and refetch on the way back in.
      if ((e.target as HTMLElement).closest?.("[data-task-opener]")) return;
      closeRef.current();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Escape already means "cancel this edit" to the title cell, the mention
      // dropdown and the date inputs. Only close the drawer when nothing inside
      // it is claiming the key.
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      closeRef.current();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  /** Edits made here should show up in the timeline immediately. */
  const patchAndRefresh = (id: string, patch: Record<string, unknown>) => {
    onPatch(id, patch);
    // The PUT and its activity rows land together; a short delay avoids racing
    // the optimistic update in the workspace hook.
    setTimeout(() => { refreshActivity(); }, 400);
  };

  const refreshActivity = useCallback(async () => {
    setActivity(await apiFetch<Activity[]>(`/tasks/${task.id}/activity`).catch(() => []));
  }, [task.id]);

  const load = useCallback(async () => {
    const [c, a, t, act] = await Promise.all([
      apiFetch<Comment[]>(`/tasks/${task.id}/comments`).catch(() => []),
      apiFetch<Attachment[]>(`/tasks/${task.id}/attachments`).catch(() => []),
      apiFetch<TimePayload>(`/tasks/${task.id}/time`).catch(() => ({ entries: [], totalMinutes: 0 })),
      apiFetch<Activity[]>(`/tasks/${task.id}/activity`).catch(() => []),
    ]);
    setComments(c); setAttachments(a); setTime(t); setActivity(act);
  }, [task.id]);

  useEffect(() => { load(); }, [load]);

  const children = rows.filter((r) => r.task.parentTaskId === task.id).map((r) => r.task);

  /** Comments and audit entries interleaved strictly by time. */
  const feed: FeedItem[] = [
    ...activity.map((a) => ({ kind: "activity" as const, at: new Date(a.createdAt).getTime(), data: a })),
    ...comments.map((c) => ({ kind: "comment" as const, at: new Date(c.createdAt).getTime(), data: c })),
  ].sort((a, b) => a.at - b.at);

  const groupedFeed = (() => {
    const weekAgo = Date.now() - 7 * 86400000;
    const thisWeek = feed.filter((f) => f.at >= weekAgo);
    const earlier = feed.filter((f) => f.at < weekAgo);
    return [
      ...(earlier.length ? [{ label: "Earlier", items: earlier }] : []),
      ...(thisWeek.length ? [{ label: "This week", items: thisWeek }] : []),
    ];
  })();
  const deps = task.dependsOn ?? [];
  const titleOf = (id: string) => rows.find((r) => r.task.id === id)?.task.title ?? "another task";

  const addComment = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      const c = await apiFetch<Comment>(`/tasks/${task.id}/comments`, {
        method: "POST", body: JSON.stringify({ body }),
      });
      setComments((cur) => [...cur, c]);
      setBody("");
    } catch (err: any) {
      toast.error(err.message || "Could not post that comment");
    } finally { setBusy(false); }
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const token = Cookies.get("authToken");
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/tasks/${task.id}/attachments`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Upload failed");
      await load();
      onChanged();
    } catch (err: any) {
      toast.error(err.message || "Could not upload that file");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const stopTimer = async () => {
    const minutes = Math.max(1, Math.round(elapsedSec / 60));
    setRunningSince(null);
    try {
      await apiFetch(`/tasks/${task.id}/time`, {
        method: "POST",
        body: JSON.stringify({ minutes, spentOn: new Date().toISOString().slice(0, 10) }),
      });
      await load();
      toast.success(`Logged ${minutes} min`);
    } catch (err: any) {
      toast.error(err.message || "Could not log that time");
    }
  };

  return (
    <aside
      ref={panelRef}
      className={cn(
        "fixed inset-0 z-50 flex flex-col glass-modal",
        // min-h-0 is load-bearing: without it this column grows to fit its
        // scrolling child instead of scrolling inside the row, and the panel's
        // overflow-hidden then clips the bottom off.
        "lg:static lg:z-auto lg:h-full lg:min-h-0 lg:shrink-0 lg:rounded-none lg:border-l",
        // Matches the detail-pane width the rest of the Work module uses.
        "lg:w-[42%] lg:min-w-[380px] lg:max-w-[620px]"
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b glass-header px-4">
        <span className="truncate text-sm font-semibold text-stone-900">Task</span>
        <button
          onClick={() => { if (window.confirm(`Delete "${task.title}"?`)) { onDelete(task.id); onClose(); } }}
          className="ml-auto rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
          title="Delete task"
        >
          <TbTrash size={16} />
        </button>
        <button onClick={onClose} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100">
          <TbX size={17} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
        <input
          defaultValue={task.title}
          key={task.id}
          onBlur={(e) => e.target.value.trim() && e.target.value !== task.title && onPatch(task.id, { title: e.target.value.trim() })}
          className="w-full rounded border border-transparent px-1 py-0.5 text-lg font-semibold text-stone-900 outline-none hover:border-stone-200 focus:border-blue-500"
        />

        {projectName && (
          <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-800">
            <TbFolder size={12} /> {projectName}
          </span>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</span>
            <select
              value={task.statusId ?? ""}
              onChange={(e) => patchAndRefresh(task.id, { statusId: e.target.value || null })}
              className={cn(
                "mt-1 w-full rounded-lg border-0 px-2 py-1.5 text-xs font-medium outline-none",
                STATUS_CHIP[task.workflowStatus?.color ?? "stone"] ?? STATUS_CHIP.stone
              )}
            >
              <option value="">—</option>
              {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Assignee</span>
            <select
              value={task.assigneeId ?? ""}
              onChange={(e) => patchAndRefresh(task.id, { assigneeId: e.target.value || null })}
              className="mt-1 w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Start</span>
            <div className="mt-1">
              <DatePicker
                ariaLabel="Start date"
                value={task.startDate}
                onChange={(v) => patchAndRefresh(task.id, { startDate: v })}
              />
            </div>
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Due</span>
            <div className="mt-1">
              <DatePicker
                ariaLabel="Due date"
                value={task.dueDate}
                onChange={(v) => patchAndRefresh(task.id, { dueDate: v })}
              />
            </div>
          </label>
        </div>

        {/* the summary strip: subitems · files · dependencies · timer */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600">
          <span className="flex items-center gap-1"><TbSubtask size={13} /> {children.length} subitem{children.length === 1 ? "" : "s"}</span>
          <span className="flex items-center gap-1"><TbPaperclip size={13} /> {attachments.length} file{attachments.length === 1 ? "" : "s"}</span>
          <span className="flex items-center gap-1"><TbUnlink size={13} /> {deps.length} dependenc{deps.length === 1 ? "y" : "ies"}</span>
          <span className="ml-auto flex items-center gap-1.5">
            <TbClock size={13} />
            <span className="font-mono">
              {runningSince ? `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, "0")}` : hhmm(time.totalMinutes)}
            </span>
            <button
              onClick={() => (runningSince ? stopTimer() : setRunningSince(Date.now()))}
              title={runningSince ? "Stop and log" : "Start timer"}
              className={cn("rounded p-1", runningSince ? "bg-red-100 text-red-700" : "hover:bg-stone-200")}
            >
              {runningSince ? <TbPlayerStop size={13} /> : <TbPlayerPlay size={13} />}
            </button>
          </span>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">Description</p>
          <RichDescription
            key={task.id}
            html={task.descriptionHtml}
            editable
            onSave={(descriptionHtml) => patchAndRefresh(task.id, { descriptionHtml })}
          />
        </div>

        {deps.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">Waiting on</p>
            <div className="space-y-1">
              {deps.map((d) => (
                <div key={d.id} className="flex items-center gap-2 rounded-lg bg-stone-50 px-2.5 py-1.5 text-sm">
                  <span className="min-w-0 flex-1 truncate text-stone-700">{titleOf(d.predecessorId)}</span>
                  <span className="text-[10px] text-stone-400">{d.type}</span>
                  <button onClick={() => onRemoveDependency(task.id, d.id)} className="rounded p-0.5 text-stone-400 hover:text-red-600" title="Unlink">
                    <TbUnlink size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">Subitems</p>
          <div className="space-y-1">
            {children.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-lg bg-stone-50 px-2.5 py-1.5 text-sm">
                <span className="min-w-0 flex-1 truncate text-stone-700">{c.title}</span>
                {c.workflowStatus && (
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", STATUS_CHIP[c.workflowStatus.color] ?? STATUS_CHIP.stone)}>
                    {c.workflowStatus.name}
                  </span>
                )}
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (childTitle.trim()) { onCreateChild(childTitle, task.id); setChildTitle(""); } }}
            className="mt-1"
          >
            <input
              value={childTitle}
              onChange={(e) => setChildTitle(e.target.value)}
              placeholder="+ Add a subitem"
              className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Files</p>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-stone-600 hover:bg-stone-100 disabled:opacity-50"
            >
              {uploading ? <TbLoader size={12} className="animate-spin" /> : <TbUpload size={12} />} Upload
            </button>
            <input ref={fileRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          </div>
          <div className="space-y-1">
            {attachments.map((a) => (
              <a
                key={a.id}
                href={a.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg bg-stone-50 px-2.5 py-1.5 text-sm hover:bg-stone-100"
              >
                <TbPaperclip size={13} className="shrink-0 text-stone-400" />
                <span className="min-w-0 flex-1 truncate text-stone-700">{a.name}</span>
              </a>
            ))}
            {!attachments.length && <p className="text-xs text-stone-400">No files attached.</p>}
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            <TbHistory size={12} /> Activity
          </p>
          {feed.length === 0 && <p className="text-xs text-stone-400">Nothing has happened yet.</p>}
          {groupedFeed.map(({ label, items }) => (
            <div key={label} className="mb-3">
              <p className="mb-1.5 text-[11px] font-semibold text-stone-500">{label}</p>
              <div className="space-y-2">
                {items.map((item) =>
                  item.kind === "comment" ? (
                    <div key={`c-${item.data.id}`} className="rounded-lg bg-stone-50 p-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium text-stone-800">{item.data.author?.fullName ?? "Someone"}</span>
                        <span className="text-[10px] text-stone-400">{format(new Date(item.data.createdAt), "d MMM, HH:mm")}</span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-stone-700">{renderMentions(item.data.body)}</p>
                    </div>
                  ) : (
                    <div key={`a-${item.data.id}`} className="flex items-baseline gap-2 px-1 text-xs text-stone-500">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" />
                      <span className="flex-1">
                        <span className="font-medium text-stone-700">
                          {item.data.actor?.fullName ?? "System"}
                        </span>{" "}
                        {item.data.summary}
                      </span>
                      <span className="shrink-0 text-[10px] text-stone-400">
                        {format(new Date(item.data.createdAt), "d MMM, HH:mm")}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={addComment} className="flex shrink-0 items-end gap-2 border-t glass-header p-3">
        <MentionInput
          value={body}
          onChange={setBody}
          onSubmit={() => addComment()}
          people={people}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !body.trim()} className="rounded-lg bg-stone-900 px-3 py-2 text-white disabled:opacity-40">
          <TbSend size={15} />
        </button>
      </form>
    </aside>
  );
}
