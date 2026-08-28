"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { TbMail, TbPlus, TbUserOff, TbUsersPlus, TbX } from "react-icons/tb";

interface Collaborator {
  id: string;
  userId: string;
  access: "view" | "collaborate";
  user?: { id: string; fullName: string; companyEmail: string; onboarded: boolean } | null;
  invitedBy?: { id: string; fullName: string } | null;
}

/**
 * Invite and manage external collaborators on one project.
 *
 * The "share existing tasks" checkbox is deliberately unticked: adding someone
 * to a live project must not retroactively expose its whole history. Tasks are
 * shared one at a time from the board unless this is explicitly chosen.
 */
export function ProjectCollaborators({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<Collaborator[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", access: "collaborate", shareExistingTasks: false });

  const load = useCallback(async () => {
    try {
      setRows(await apiFetch<Collaborator[]>(`/work/projects/${projectId}/collaborators`));
    } catch {
      setRows([]);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch<{ warning?: string }>(`/work/projects/${projectId}/collaborators`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res.warning) toast.warning(res.warning);
      else toast.success(`Invite sent to ${form.email}`);
      setForm({ fullName: "", email: "", access: "collaborate", shareExistingTasks: false });
      setOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Could not invite that person");
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (userId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this project? They lose access immediately.`)) return;
    try {
      await apiFetch(`/work/projects/${projectId}/collaborators/${userId}`, { method: "DELETE" });
      await load();
      toast.success("Collaborator removed");
    } catch (err: any) {
      toast.error(err.message || "Could not remove them");
    }
  };

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <TbUsersPlus size={13} /> Collaborators
        </p>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-foreground/70 hover:bg-muted"
        >
          {open ? <TbX size={13} /> : <TbPlus size={13} />} {open ? "Cancel" : "Invite"}
        </button>
      </div>

      {open && (
        <form onSubmit={invite} className="mt-3 space-y-2 rounded-lg bg-muted/40 p-3">
          <input
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            placeholder="Full name"
            required
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="their@email.com"
            required
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={form.access}
            onChange={(e) => setForm((f) => ({ ...f, access: e.target.value }))}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="collaborate">Can comment and add tasks</option>
            <option value="view">View only</option>
          </select>
          <label className="flex items-start gap-2 text-xs text-foreground/70">
            <input
              type="checkbox"
              checked={form.shareExistingTasks}
              onChange={(e) => setForm((f) => ({ ...f, shareExistingTasks: e.target.checked }))}
              className="mt-0.5 h-3.5 w-3.5"
            />
            <span>
              Share this project&apos;s existing tasks with them.
              <span className="block text-muted-foreground">
                Off by default — otherwise every past task and its comments become visible at once.
              </span>
            </span>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <TbMail size={13} /> {saving ? "Sending…" : "Send invite"}
          </button>
        </form>
      )}

      <div className="mt-3 space-y-1.5">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate text-foreground">
              {row.user?.fullName ?? "Unknown"}
              {row.user && !row.user.onboarded && (
                <span className="ml-1.5 rounded-full bg-amber-50 dark:bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                  invite pending
                </span>
              )}
              {row.access === "view" && (
                <span className="ml-1.5 text-[10px] text-muted-foreground">view only</span>
              )}
            </span>
            <button
              onClick={() => revoke(row.userId, row.user?.fullName ?? "this person")}
              title="Remove from project"
              className="rounded p-1 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-400/10 hover:text-red-600 dark:hover:text-red-300"
            >
              <TbUserOff size={14} />
            </button>
          </div>
        ))}
        {!rows.length && !open && (
          <p className="text-xs text-muted-foreground">No external collaborators on this project.</p>
        )}
      </div>
    </div>
  );
}
