"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TbBrandGithub, TbLoader, TbTrash } from "react-icons/tb";
import { NativeSelect } from "@/components/ui/native-select";
import { confirmDialog } from "@/components/ui/dialogs";

interface Repo { id: number; fullName: string; private: boolean }
interface Access {
  id: string;
  repoId: number | string;
  repoFullName: string;
  githubLogin: string;
  permission: "pull" | "push" | "admin";
  status: "invited" | "active" | "failed";
  error: string | null;
}

const PERMISSION_LABEL = { pull: "Read", push: "Write", admin: "Admin" };
const STATUS_STYLE = {
  invited: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

/** People → employee: invite them to several repos at once, see who accepted, remove access. */
export function GitHubAccessPanel({ userId, githubLogin }: { userId: string; githubLogin?: string | null }) {
  const [access, setAccess] = useState<Access[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [permission, setPermission] = useState<Access["permission"]>("push");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, r] = await Promise.all([
        apiFetch<Access[]>(`/github/access/${userId}`),
        apiFetch<Repo[]>("/github/access/repos"),
      ]);
      setAccess(a);
      setRepos(r);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Could not load GitHub access");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { setLoading(true); setSelected(new Set()); load(); }, [load]);

  const grant = async () => {
    setSaving(true);
    try {
      const rows = await apiFetch<Access[]>(`/github/access/${userId}`, {
        method: "POST",
        body: JSON.stringify({ repoIds: [...selected], permission }),
      });
      setAccess(rows);
      setSelected(new Set());
      const failed = rows.filter((r) => r.status === "failed").length;
      if (failed) toast.error(`${failed} repo${failed === 1 ? "" : "s"} failed — see the list below`);
      else toast.success("Access granted. GitHub emails any new invites.");
    } catch (err: any) {
      toast.error(err.message || "Could not grant access");
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (a: Access) => {
    if (!(await confirmDialog(`Remove ${a.githubLogin}'s access to ${a.repoFullName}?`))) return;
    try {
      await apiFetch(`/github/access/${userId}/${a.id}`, { method: "DELETE" });
      setAccess((cur) => cur.filter((x) => x.id !== a.id));
    } catch (err: any) {
      toast.error(err.message || "Could not remove access");
      load();
    }
  };

  const granted = new Set(access.filter((a) => a.status !== "failed").map((a) => Number(a.repoId)));
  const q = query.trim().toLowerCase();
  const options = repos.filter((r) => !granted.has(r.id) && r.fullName.toLowerCase().includes(q));

  return (
    <section className="rounded-xl border p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <TbBrandGithub size={15} /> GitHub access
      </h3>

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><TbLoader className="animate-spin" size={13} /> Loading…</p>
      ) : error ? (
        <p className="mt-3 text-xs text-red-600 dark:text-red-300">{error}</p>
      ) : (
        <>
          {access.length > 0 ? (
            <ul className="mt-3 divide-y rounded-lg border">
              {access.map((a) => (
                <li key={a.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground" title={a.error ?? a.repoFullName}>{a.repoFullName}</span>
                  <span className="text-muted-foreground">{PERMISSION_LABEL[a.permission]}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", STATUS_STYLE[a.status])} title={a.error ?? undefined}>{a.status}</span>
                  <button type="button" onClick={() => revoke(a)} title="Remove access" className="rounded p-1 text-muted-foreground hover:text-red-600 dark:hover:text-red-300">
                    <TbTrash size={13} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">No repository access yet.</p>
          )}

          {!githubLogin ? (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
              Add their GitHub username (Edit) to grant access. If they don't have an account, they need to create a free one at github.com first.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Find repos to share with ${githubLogin}…`}
                className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus:ring-[3px] focus:ring-ring/20"
              />
              <div className="max-h-44 overflow-auto rounded-lg border">
                {options.map((r) => (
                  <label key={r.id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={(e) => setSelected((cur) => {
                        const next = new Set(cur);
                        if (e.target.checked) next.add(r.id); else next.delete(r.id);
                        return next;
                      })}
                    />
                    <span className="truncate">{r.fullName}</span>
                    {r.private && <span className="ml-auto text-[10px] text-muted-foreground">private</span>}
                  </label>
                ))}
                {!options.length && <p className="px-3 py-3 text-center text-xs text-muted-foreground">No more repositories.</p>}
              </div>
              <div className="flex items-center justify-end gap-2">
                <NativeSelect value={permission} onChange={(e) => setPermission(e.target.value as Access["permission"])} className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs outline-none">
                  <option value="pull">Read</option>
                  <option value="push">Write</option>
                  <option value="admin">Admin</option>
                </NativeSelect>
                <button type="button" onClick={grant} disabled={!selected.size || saving} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
                  {saving ? "Granting…" : `Grant access${selected.size ? ` (${selected.size})` : ""}`}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
