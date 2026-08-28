"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { renderMentions } from "@/components/Admin/Work/Project/MentionInput";
import { cn } from "@/lib/utils";
import {
  TbCalendar, TbCheck, TbFolder, TbLoader, TbLogout, TbMessage, TbPlus, TbSend, TbX,
} from "react-icons/tb";

interface PortalProject { id: string; name: string; status: string }
interface PortalStatus { id: string; name: string; color: string; group: string; order: number }
interface PortalComment {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  author?: { id: string; fullName: string } | null;
}
interface PortalTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  statusId: string | null;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  projectId: string | null;
  assigneeId: string | null;
  assignee?: { id: string; fullName: string } | null;
  workflowStatus?: PortalStatus | null;
}

const COLOR_CHIP: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700",
  indigo: "bg-indigo-50 text-indigo-700",
  cyan: "bg-cyan-50 text-cyan-700",
  amber: "bg-amber-50 text-amber-700",
  green: "bg-green-50 text-green-700",
  stone: "bg-stone-100 text-stone-600",
};

function fmt(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * The whole surface an external collaborator sees.
 *
 * Deliberately NOT the admin shell: guests are blocked from every internal
 * module at the API level, so rendering that navigation would be a wall of
 * links that 403. This shows only what a ProjectMember grant actually opens —
 * their projects, the tasks shared with them, and the conversation.
 */
export function CollaboratorPortal() {
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<PortalTask[]>([]);
  const [statuses, setStatuses] = useState<PortalStatus[]>([]);
  const [selected, setSelected] = useState<PortalTask | null>(null);
  const [comments, setComments] = useState<PortalComment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [me, setMe] = useState<{ id: string; fullName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch<any>("/auth/me")
      .then((u) => setMe({ id: u.id, fullName: u.fullName }))
      .catch(() => {});
    apiFetch<PortalProject[]>("/work/projects")
      .then((d) => {
        setProjects(d);
        setActiveProjectId((cur) => cur ?? d[0]?.id ?? null);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const loadTasks = useCallback(async (projectId: string) => {
    try {
      // scope=all is safe here: the API narrows a guest to their granted
      // projects and to tasks explicitly shared with them.
      const [t, s] = await Promise.all([
        apiFetch<PortalTask[]>(`/tasks?scope=all&projectId=${projectId}`),
        apiFetch<PortalStatus[]>(`/workflow/statuses?projectId=${projectId}`).catch(() => []),
      ]);
      setTasks(t);
      setStatuses(s);
    } catch {
      setTasks([]);
    }
  }, []);

  useEffect(() => {
    if (activeProjectId) loadTasks(activeProjectId);
  }, [activeProjectId, loadTasks]);

  const openTask = async (task: PortalTask) => {
    setSelected(task);
    setComments([]);
    try {
      setComments(await apiFetch<PortalComment[]>(`/tasks/${task.id}/comments`));
    } catch {
      /* a task with no readable comments simply shows none */
    }
  };

  const patchStatus = async (task: PortalTask, statusId: string) => {
    setBusy(true);
    try {
      const updated = await apiFetch<PortalTask>(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ statusId }),
      });
      setTasks((cur) => cur.map((t) => (t.id === task.id ? updated : t)));
      setSelected((cur) => (cur?.id === task.id ? updated : cur));
    } catch (err: any) {
      toast.error(err.message || "Could not update the task");
    } finally {
      setBusy(false);
    }
  };

  const addComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !commentBody.trim()) return;
    setBusy(true);
    try {
      const c = await apiFetch<PortalComment>(`/tasks/${selected.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentBody }),
      });
      setComments((cur) => [...cur, c]);
      setCommentBody("");
    } catch (err: any) {
      toast.error(err.message || "Could not post the comment");
    } finally {
      setBusy(false);
    }
  };

  const createTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !activeProjectId) return;
    setBusy(true);
    try {
      await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({ title: newTitle, projectId: activeProjectId }),
      });
      setNewTitle("");
      setCreating(false);
      await loadTasks(activeProjectId);
      toast.success("Task added");
    } catch (err: any) {
      toast.error(err.message || "Could not create the task");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    Cookies.remove("authToken");
    Cookies.remove("permissions");
    window.location.href = "/auth/login";
  };

  const grouped = useMemo(() => {
    const cols = statuses.length
      ? statuses
      : [{ id: "__none", name: "Tasks", color: "stone", group: "Active", order: 0 }];
    return cols.map((c) => ({
      status: c,
      tasks: tasks.filter((t) => (statuses.length ? t.statusId === c.id : true)),
    }));
  }, [tasks, statuses]);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-stone-400">
        <TbLoader className="mr-2 animate-spin" /> Loading your workspace…
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <TbFolder size={32} className="text-stone-300" />
        <h1 className="text-lg font-semibold text-stone-800">Nothing shared with you yet</h1>
        <p className="max-w-sm text-sm text-stone-500">
          When someone shares a project with you it will appear here. If you were expecting
          access, ask whoever invited you to confirm the project has been shared.
        </p>
        <button onClick={logout} className="mt-2 text-xs font-medium text-stone-600 underline">Sign out</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-stone-50">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold tracking-tight text-stone-900">Rhinon Tech</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
            Collaborator
          </span>
        </div>
        <div className="flex items-center gap-3">
          {me && <span className="hidden text-xs text-stone-500 sm:block">{me.fullName}</span>}
          <button onClick={logout} title="Sign out" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100">
            <TbLogout size={17} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r bg-white p-3 sm:block">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Shared with you
          </p>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { setActiveProjectId(p.id); setSelected(null); }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm",
                activeProjectId === p.id ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
              )}
            >
              <TbFolder size={15} className="shrink-0" />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </aside>

        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-stone-900">{activeProject?.name}</h1>
              <p className="text-xs text-stone-500">
                {tasks.length} task{tasks.length === 1 ? "" : "s"} shared with you
              </p>
            </div>
            <button
              onClick={() => setCreating((c) => !c)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-800"
            >
              <TbPlus size={14} /> New task
            </button>
          </div>

          {creating && (
            <form onSubmit={createTask} className="mb-4 flex gap-2 rounded-xl border bg-white p-3">
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs doing?"
                className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" disabled={busy} className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-60">
                Add
              </button>
              <button type="button" onClick={() => setCreating(false)} className="rounded-lg px-3 text-stone-500 hover:bg-stone-100">
                <TbX size={16} />
              </button>
            </form>
          )}

          <div className="space-y-5">
            {grouped.map(({ status, tasks: list }) => (
              <div key={status.id}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", COLOR_CHIP[status.color] ?? COLOR_CHIP.stone)}>
                    {status.name}
                  </span>
                  <span className="text-xs text-stone-400">{list.length}</span>
                </div>
                <div className="space-y-2">
                  {list.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => openTask(t)}
                      className="flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left hover:border-stone-300"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-stone-900">{t.title}</span>
                        {t.assignee && (
                          <span className="block truncate text-xs text-stone-500">{t.assignee.fullName}</span>
                        )}
                      </span>
                      {(t.startDate || t.dueDate) && (
                        <span className="hidden shrink-0 items-center gap-1 text-xs text-stone-500 sm:flex">
                          <TbCalendar size={13} />
                          {[fmt(t.startDate), fmt(t.dueDate)].filter(Boolean).join(" – ")}
                        </span>
                      )}
                    </button>
                  ))}
                  {!list.length && (
                    <p className="rounded-xl border border-dashed px-4 py-4 text-center text-xs text-stone-400">
                      Nothing here
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>

        {selected && (
          <aside className="fixed inset-0 z-50 flex flex-col bg-white lg:static lg:z-auto lg:w-[420px] lg:shrink-0 lg:border-l">
            <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
              <span className="text-sm font-semibold text-stone-900">Task</span>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100">
                <TbX size={17} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <h2 className="text-base font-semibold text-stone-900">{selected.title}</h2>
              {selected.description && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-600">{selected.description}</p>
              )}

              {statuses.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {statuses.map((s) => (
                      <button
                        key={s.id}
                        disabled={busy}
                        onClick={() => patchStatus(selected, s.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium disabled:opacity-60",
                          selected.statusId === s.id
                            ? "bg-stone-900 text-white"
                            : COLOR_CHIP[s.color] ?? COLOR_CHIP.stone
                        )}
                      >
                        {selected.statusId === s.id && <TbCheck size={11} />}
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  <TbMessage size={12} /> Comments
                </p>
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="rounded-lg bg-stone-50 p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium text-stone-800">{c.author?.fullName ?? "Someone"}</span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">{renderMentions(c.body)}</p>
                    </div>
                  ))}
                  {!comments.length && <p className="text-xs text-stone-400">No comments yet.</p>}
                </div>
              </div>
            </div>

            <form onSubmit={addComment} className="flex shrink-0 gap-2 border-t p-3">
              <input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a comment…"
                className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" disabled={busy || !commentBody.trim()} className="rounded-lg bg-stone-900 px-3 text-white disabled:opacity-40">
                <TbSend size={15} />
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
