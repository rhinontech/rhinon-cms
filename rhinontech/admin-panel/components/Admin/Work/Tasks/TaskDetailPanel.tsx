"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  TbCheck, TbChevronDown, TbChevronUp, TbLoader, TbLock, TbPlus, TbRepeat, TbX,
} from "react-icons/tb";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PRIORITY_COLORS, TAG_COLORS, TAG_COLOR_HEX, TAG_COLOR_STYLES } from "./constants";
import { DueBadge, initials, ordinalDate } from "./utils";
import type { ApiTask, Subtask, TaskComment, TaskStatus } from "./types";

function Detail({ label, value, extra }: { label: string; value: string; extra?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-800">{value}{extra}</p>
    </div>
  );
}

export function TaskDetailPanel({
  task, canEdit, canDeleteComment, onStatusChange, onTaskChanged,
}: {
  task: ApiTask;
  canEdit: boolean;
  canDeleteComment: (c: TaskComment) => boolean;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onTaskChanged: () => void;
}) {
  const [tab, setTab] = useState<"details" | "subtasks" | "comments">("details");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newTagColor, setNewTagColor] = useState<string>("blue");
  const [showTagInput, setShowTagInput] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      apiFetch<Subtask[]>(`/tasks/${task.id}/subtasks`),
      apiFetch<TaskComment[]>(`/tasks/${task.id}/comments`),
    ])
      .then(([s, c]) => { setSubtasks(s); setComments(c); })
      .catch(() => { setSubtasks([]); setComments([]); });
  }, [task.id]);

  useEffect(() => { load(); setTab("details"); }, [load]);

  const doneCount = subtasks.filter((s) => s.done).length;
  const allSubtasksDone = subtasks.length > 0 && doneCount === subtasks.length;

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    setAddingSubtask(true);
    try {
      const sub = await apiFetch<Subtask>(`/tasks/${task.id}/subtasks`, { method: "POST", body: JSON.stringify({ title: newSubtask.trim() }) });
      setSubtasks((s) => [...s, sub]);
      setNewSubtask("");
      onTaskChanged();
    } catch (e: any) { toast.error(e?.message || "Couldn't add that subtask."); }
    finally { setAddingSubtask(false); }
  };

  const toggleSubtask = async (sub: Subtask) => {
    const updated = { ...sub, done: !sub.done };
    setSubtasks((s) => s.map((x) => (x.id === sub.id ? updated : x)));
    await apiFetch(`/tasks/${task.id}/subtasks/${sub.id}`, { method: "PUT", body: JSON.stringify({ done: updated.done }) }).catch(() => {});
    onTaskChanged();
  };

  const deleteSubtask = async (subId: string) => {
    setSubtasks((s) => s.filter((x) => x.id !== subId));
    await apiFetch(`/tasks/${task.id}/subtasks/${subId}`, { method: "DELETE" }).catch(() => {});
    onTaskChanged();
  };

  const moveSubtask = async (index: number, dir: -1 | 1) => {
    const swap = index + dir;
    if (swap < 0 || swap >= subtasks.length) return;
    const list = [...subtasks];
    [list[index], list[swap]] = [list[swap], list[index]];
    setSubtasks(list);
    await Promise.all([
      apiFetch(`/tasks/${task.id}/subtasks/${list[index].id}`, { method: "PUT", body: JSON.stringify({ order: index }) }),
      apiFetch(`/tasks/${task.id}/subtasks/${list[swap].id}`, { method: "PUT", body: JSON.stringify({ order: swap }) }),
    ]).catch(() => {});
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const c = await apiFetch<TaskComment>(`/tasks/${task.id}/comments`, { method: "POST", body: JSON.stringify({ body: newComment.trim() }) });
      setComments((cs) => [...cs, c]);
      setNewComment("");
    } catch (e: any) { toast.error(e?.message || "Couldn't post that comment."); }
    finally { setPostingComment(false); }
  };

  const deleteComment = async (commentId: string) => {
    setComments((cs) => cs.filter((c) => c.id !== commentId));
    await apiFetch(`/tasks/${task.id}/comments/${commentId}`, { method: "DELETE" }).catch(() => {});
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    try {
      await apiFetch(`/tasks/${task.id}/tags`, { method: "POST", body: JSON.stringify({ label: newTag.trim(), color: newTagColor }) });
      setNewTag("");
      setShowTagInput(false);
      onTaskChanged();
    } catch (e: any) { toast.error(e?.message || "Couldn't add that tag."); }
  };

  const removeTag = async (tagId: string) => {
    await apiFetch(`/tasks/${task.id}/tags/${tagId}`, { method: "DELETE" }).catch(() => {});
    onTaskChanged();
  };

  const TABS = [
    { id: "details", label: "Details" },
    { id: "subtasks", label: subtasks.length > 0 ? `Subtasks (${doneCount}/${subtasks.length})` : "Subtasks" },
    { id: "comments", label: comments.length > 0 ? `Comments (${comments.length})` : "Comments" },
  ] as const;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 border-b border-gray-100">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold transition-all",
              tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div className="flex-1 space-y-4 overflow-auto p-5">
          <div>
            <div className="flex items-start gap-2">
              <h2 className="flex-1 text-lg font-bold leading-tight text-gray-900">{task.title}</h2>
              <span className={cn("mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold", PRIORITY_COLORS[task.priority])}>{task.priority}</span>
            </div>
            {task.recurrence && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-violet-600"><TbRepeat size={12} /> Repeats {task.recurrence}</p>
            )}
            {task.blocker && task.blocker.status !== "Done" && (
              <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-500">
                <TbLock size={12} /> Blocked by: <span className="font-semibold">{task.blocker.title}</span>
              </div>
            )}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{task.description || "No description."}</p>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {task.tags?.map((tg) => (
                <span key={tg.id} className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", TAG_COLOR_STYLES[tg.color] || TAG_COLOR_STYLES.blue)}>
                  {tg.label}
                  {canEdit && <button onClick={() => removeTag(tg.id)} className="hover:text-red-500"><TbX size={10} /></button>}
                </span>
              ))}
              {canEdit && !showTagInput && (
                <button onClick={() => setShowTagInput(true)} className="flex items-center gap-1 rounded-full border border-dashed border-gray-200 px-2 py-0.5 text-xs text-gray-400 transition-colors hover:border-blue-300 hover:text-blue-500">
                  <TbPlus size={10} /> Add
                </button>
              )}
            </div>
            {showTagInput && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} placeholder="Label..." className="w-28 rounded-lg border px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" autoFocus />
                <div className="flex flex-wrap gap-1">
                  {TAG_COLORS.map((c) => (
                    <button key={c} onClick={() => setNewTagColor(c)} className={cn("h-5 w-5 rounded-full border-2 transition-all", newTagColor === c ? "scale-110 border-gray-800" : "border-transparent")} style={{ backgroundColor: TAG_COLOR_HEX[c] }} title={c} />
                  ))}
                </div>
                <button onClick={addTag} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Add</button>
                <button onClick={() => setShowTagInput(false)} className="text-gray-400"><TbX size={12} /></button>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-100" />
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
            <Detail label="Assignee" value={task.assignee?.fullName ?? "Unassigned"} />
            <Detail label="Project" value={task.project?.name ?? "—"} />
            <Detail label="Due date" value={task.dueDate ? ordinalDate(task.dueDate) : "—"} extra={<DueBadge dueDate={task.dueDate} status={task.status} />} />
            <Detail label="Status" value={task.status} />
            <Detail label="Priority" value={task.priority} />
            {task.estimatedHours != null && <Detail label="Estimate" value={`${task.estimatedHours}h`} />}
          </div>
        </div>
      )}

      {tab === "subtasks" && (
        <div className="flex-1 space-y-3 overflow-auto p-5">
          {subtasks.length > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{doneCount}/{subtasks.length} done</span>
                <span>{Math.round((doneCount / subtasks.length) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(doneCount / subtasks.length) * 100}%` }} />
              </div>
            </div>
          )}

          {allSubtasksDone && task.status !== "Done" && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><TbCheck size={13} /> All done!</p>
              <button onClick={() => onStatusChange(task.id, "Done")} className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200">Mark task Done</button>
            </div>
          )}

          <div className="space-y-0.5">
            {subtasks.map((sub, i) => (
              <div key={sub.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                <input type="checkbox" checked={sub.done} onChange={() => toggleSubtask(sub)} className="shrink-0 rounded border-gray-300 text-emerald-600" />
                <span className={cn("flex-1 text-sm", sub.done && "text-gray-400 line-through")}>{sub.title}</span>
                {canEdit && (
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => moveSubtask(i, -1)} disabled={i === 0} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"><TbChevronUp size={12} /></button>
                    <button onClick={() => moveSubtask(i, 1)} disabled={i === subtasks.length - 1} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"><TbChevronDown size={12} /></button>
                    <button onClick={() => deleteSubtask(sub.id)} className="p-0.5 text-gray-400 hover:text-red-500"><TbX size={12} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSubtask()} placeholder="Add subtask..." className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <button onClick={addSubtask} disabled={addingSubtask || !newSubtask.trim()} className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50">
                {addingSubtask ? <TbLoader className="animate-spin" size={13} /> : <TbPlus size={13} />}
              </button>
            </div>
          )}
          {subtasks.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No subtasks yet.</p>}
        </div>
      )}

      {tab === "comments" && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-auto p-5">
            {comments.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No comments yet.</p>}
            {comments.map((c) => (
              <div key={c.id} className="group flex gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                  {c.author?.fullName ? initials(c.author.fullName) : "?"}
                </span>
                <div className="flex-1 rounded-xl bg-gray-50 px-3 py-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">{c.author?.fullName ?? "Unknown"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      {canDeleteComment(c) && (
                        <button onClick={() => deleteComment(c.id)} className="text-gray-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"><TbX size={11} /></button>
                      )}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex shrink-0 gap-2 border-t p-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); } }}
              placeholder="Add a comment... (Enter to send)"
              rows={2}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button onClick={postComment} disabled={postingComment || !newComment.trim()} className="self-end rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50">
              {postingComment ? <TbLoader className="animate-spin" size={13} /> : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
