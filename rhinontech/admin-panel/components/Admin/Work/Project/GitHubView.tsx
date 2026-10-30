"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  TbBrandGithub, TbCopy, TbEye, TbGitCommit, TbKey, TbLink, TbLoader, TbPlus,
  TbRefresh, TbServer, TbSparkles, TbTrash,
} from "react-icons/tb";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/native-select";
import { STATUS_CHIP, STATUS_DOT } from "./constants";
import { alertDialog, confirmDialog } from "@/components/ui/dialogs";

export interface RepoLink {
  id: string;
  repoFullName: string;
  defaultBranch: string;
  color: string;
  autoCreateTasks: boolean;
  deployKeyPublic: string | null;
  deployKeyReadOnly: boolean;
  hasDeployKey: boolean;
  lastPushAt: string | null;
}

interface AvailableRepo { id: number; fullName: string; private: boolean }

export interface RepoCommit {
  id: string;
  sha: string;
  message: string;
  branch: string | null;
  url: string | null;
  authorName: string | null;
  authorLogin: string | null;
  committedAt: string;
  taskIds: string[];
  author?: { id: string; fullName: string } | null;
  project?: { id: string; name: string } | null;
}

interface Secret {
  id: string;
  name: string;
  kind: "ssh_key" | "env" | "token" | "note";
  host: string | null;
  username: string | null;
  port: number | null;
  publicKey: string | null;
  createdAt: string;
  creator?: { fullName: string } | null;
}

/** Must match REPO_COLORS in the API (routes/github.ts). */
const REPO_COLORS = ["blue", "indigo", "cyan", "amber", "green", "stone", "red", "purple"];

const KIND_LABEL: Record<Secret["kind"], string> = {
  ssh_key: "SSH key", env: "Env vars", token: "Token", note: "Note",
};

const inputCls =
  "rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus:ring-[3px] focus:ring-ring/20 focus:border-ring/60";
const btnCls =
  "flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted disabled:opacity-50";
const primaryBtnCls =
  "flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50";

const copy = async (text: string, what: string) => {
  await navigator.clipboard.writeText(text);
  toast.success(`${what} copied`);
};

function Section({ icon, title, action, children }: {
  icon: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border bg-card/60">
      <header className="flex items-center gap-2 border-b px-4 py-2.5">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <div className="ml-auto">{action}</div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** One commit line — shared with the daily Commits page. */
export function CommitRow({ c, showProject = false }: { c: RepoCommit; showProject?: boolean }) {
  const [subject, ...rest] = c.message.split("\n");
  return (
    <div className="flex items-start gap-3 border-b px-4 py-2.5 last:border-b-0 hover:bg-muted/40">
      <TbGitCommit size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground" title={c.message}>{subject}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
          <span className={c.author ? "font-medium text-foreground/75" : ""}>
            {c.author?.fullName ?? c.authorLogin ?? c.authorName ?? "Unknown"}
          </span>
          {showProject && c.project && <span>· {c.project.name}</span>}
          {c.branch && <span>· {c.branch}</span>}
          <span title={format(new Date(c.committedAt), "dd MMM yyyy, HH:mm")}>
            · {formatDistanceToNow(new Date(c.committedAt), { addSuffix: true })}
          </span>
          {c.taskIds.length > 0 && (
            <span className="rounded bg-emerald-50 dark:bg-emerald-400/10 px-1.5 text-emerald-700 dark:text-emerald-300">
              {c.taskIds.length === 1 ? "1 task" : `${c.taskIds.length} tasks`}
            </span>
          )}
          {rest.join("").trim() && <span className="italic">· has description</span>}
        </p>
      </div>
      {c.url ? (
        <a href={c.url} target="_blank" rel="noreferrer" className="shrink-0 font-mono text-xs text-blue-600 dark:text-blue-300 hover:underline">
          {c.sha.slice(0, 7)}
        </a>
      ) : (
        <span className="shrink-0 font-mono text-xs text-muted-foreground">{c.sha.slice(0, 7)}</span>
      )}
    </div>
  );
}

function RepoCard({ link, onChanged }: { link: RepoLink; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    try {
      await fn();
      if (ok) toast.success(ok);
      onChanged();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const patch = (body: Partial<RepoLink>) =>
    run("patch", () => apiFetch(`/github/repos/${link.id}`, { method: "PATCH", body: JSON.stringify(body) }));

  const createKey = async (readOnly: boolean) => {
    if (link.hasDeployKey && !(await confirmDialog("Replace the current deploy key? Servers using the old key will lose access."))) return;
    run("key", () => apiFetch(`/github/repos/${link.id}/deploy-key`, { method: "POST", body: JSON.stringify({ readOnly }) }), "Deploy key added on GitHub");
  };

  const revealKey = async () => {
    if (!(await confirmDialog("Show the private deploy key? This is recorded in the audit log."))) return;
    try {
      const { privateKey } = await apiFetch<{ privateKey: string }>(`/github/repos/${link.id}/deploy-key/reveal`, { method: "POST" });
      await copy(privateKey, "Private key");
    } catch (err: any) {
      toast.error(err.message || "Could not reveal key");
    }
  };

  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <TbBrandGithub size={16} />
        <a href={`https://github.com/${link.repoFullName}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-foreground hover:underline">
          {link.repoFullName}
        </a>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground/70">{link.defaultBranch}</span>
        <span className="text-[11px] text-muted-foreground">
          {link.lastPushAt ? `Last push ${formatDistanceToNow(new Date(link.lastPushAt), { addSuffix: true })}` : "No pushes received yet"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            className={btnCls}
            disabled={busy === "sync"}
            onClick={() => run("sync", () => apiFetch(`/github/repos/${link.id}/sync`, { method: "POST", body: JSON.stringify({ days: 14 }) }), "Synced the last 14 days")}
            title="Pull the last 14 days of commits from GitHub"
          >
            {busy === "sync" ? <TbLoader size={13} className="animate-spin" /> : <TbRefresh size={13} />} Sync
          </button>
          <button
            className="rounded p-1.5 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-400/10 hover:text-red-600 dark:hover:text-red-300"
            title="Unlink repository"
            onClick={async () => {
              if (!(await confirmDialog(`Unlink ${link.repoFullName}? Its commit history here and its deploy key on GitHub are removed. Tasks are kept.`))) return;
              run("unlink", () => apiFetch(`/github/repos/${link.id}`, { method: "DELETE" }), "Repository unlinked");
            }}
          >
            <TbTrash size={14} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-foreground/80">
        Card color
        {REPO_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => c !== link.color && patch({ color: c })}
            disabled={busy === "patch"}
            title={c}
            className={cn("h-5 w-5 rounded-full ring-offset-2 ring-offset-card", STATUS_DOT[c], link.color === c && "ring-2 ring-foreground/60")}
          />
        ))}
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", STATUS_CHIP[link.color] ?? STATUS_CHIP.stone)}>
          {link.repoFullName.split("/").pop()}
        </span>
        <span className="text-muted-foreground">— tag on this repo's cards</span>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs text-foreground/80">
        <Switch
          checked={link.autoCreateTasks}
          disabled={busy === "patch"}
          onCheckedChange={(v) => patch({ autoCreateTasks: v })}
        />
        Daily at 2 AM IST, AI groups the previous 24 hours of commits into feature-level Done cards
      </label>

      <GroupingPanel linkId={link.id} onFinished={onChanged} />

      <div className="mt-3 rounded-lg bg-muted/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <TbKey size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Deploy key</span>
          {link.hasDeployKey ? (
            <span className="rounded bg-emerald-50 dark:bg-emerald-400/10 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">
              Active · {link.deployKeyReadOnly ? "read-only" : "read & write"}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">None — servers can't clone this repo with a project key yet</span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {link.hasDeployKey && (
              <>
                <button className={btnCls} onClick={() => copy(link.deployKeyPublic ?? "", "Public key")}><TbCopy size={13} /> Public</button>
                <button className={btnCls} onClick={revealKey}><TbEye size={13} /> Copy private</button>
              </>
            )}
            <button className={btnCls} disabled={busy === "key"} onClick={() => createKey(true)}>
              {busy === "key" ? <TbLoader size={13} className="animate-spin" /> : <TbPlus size={13} />}
              {link.hasDeployKey ? "Rotate" : "Generate"}
            </button>
            {link.hasDeployKey && (
              <button
                className="rounded p-1.5 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-400/10 hover:text-red-600 dark:hover:text-red-300"
                title="Remove deploy key"
                onClick={async () => {
                  if (!(await confirmDialog("Remove the deploy key from GitHub? Servers using it will lose access."))) return;
                  run("key", () => apiFetch(`/github/repos/${link.id}/deploy-key`, { method: "DELETE" }), "Deploy key removed");
                }}
              >
                <TbTrash size={14} />
              </button>
            )}
          </div>
        </div>
        {link.deployKeyPublic && (
          <p className="mt-2 truncate font-mono text-[10px] text-muted-foreground" title={link.deployKeyPublic}>{link.deployKeyPublic}</p>
        )}
      </div>
    </div>
  );
}

interface GroupingJob {
  state: "syncing" | "grouping" | "done" | "failed";
  from: string | null;
  to: string | null;
  trigger: "manual" | "nightly";
  startedAt: string;
  finishedAt: string | null;
  synced: number | null;
  result: { commits: number; created: number; extended: number } | null;
  error: string | null;
}

/** IST calendar day "YYYY-MM-DD" → the instant it starts. */
const istDayStart = (day: string) => new Date(`${day}T00:00:00+05:30`);
const istToday = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
const istDaysAgo = (n: number) => new Date(Date.now() + 330 * 60_000 - n * 86400_000).toISOString().slice(0, 10);
const shortDay = (iso: string) => format(new Date(iso), "d MMM");

/**
 * Run AI grouping over a date range (IST days, inclusive). The run happens on
 * the server in the background; this polls its state while it's live.
 */
function GroupingPanel({ linkId, onFinished }: { linkId: string; onFinished: () => void }) {
  const [from, setFrom] = useState(() => istDaysAgo(7));
  const [to, setTo] = useState(istToday);
  const [job, setJob] = useState<GroupingJob | null>(null);
  const [starting, setStarting] = useState(false);
  const live = job?.state === "syncing" || job?.state === "grouping";
  // A ref, so a parent re-render doesn't restart polling.
  const finished = useRef(onFinished);
  finished.current = onFinished;

  const poll = useCallback(async () => {
    try {
      const j = await apiFetch<GroupingJob | null>(`/github/repos/${linkId}/group`);
      setJob((prev) => {
        // Refresh the cards and commits once, when a run we were watching finishes.
        if (prev && (prev.state === "syncing" || prev.state === "grouping") && j && (j.state === "done" || j.state === "failed")) finished.current();
        return j;
      });
    } catch {
      /* keep the last known state */
    }
  }, [linkId]);

  useEffect(() => { poll(); }, [poll]);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [live, poll]);

  const start = async () => {
    if (from > to) {
      toast.error("The start date is after the end date.");
      return;
    }
    setStarting(true);
    try {
      // End date is inclusive: run up to the start of the next IST day.
      const end = new Date(+istDayStart(to) + 86400_000);
      setJob(await apiFetch<GroupingJob>(`/github/repos/${linkId}/group`, {
        method: "POST",
        body: JSON.stringify({ from: istDayStart(from).toISOString(), to: end.toISOString() }),
      }));
    } catch (err: any) {
      toast.error(err.message || "Could not start");
    } finally {
      setStarting(false);
    }
  };

  const range = job?.from && job.to ? `${shortDay(job.from)} – ${shortDay(new Date(+new Date(job.to) - 1).toISOString())}` : "";

  return (
    <div className="mt-3 rounded-lg border border-violet-300/40 bg-violet-50/50 dark:bg-violet-400/5 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <TbSparkles size={14} className="text-violet-500" />
        <span className="text-xs font-medium text-foreground">Create cards from commits</span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5 text-xs">
          <input type="date" value={from} max={istToday()} onChange={(e) => e.target.value && setFrom(e.target.value)} className={inputCls} aria-label="Start date" />
          <span className="text-muted-foreground">to</span>
          <input type="date" value={to} max={istToday()} onChange={(e) => e.target.value && setTo(e.target.value)} className={inputCls} aria-label="End date" />
          <button className={primaryBtnCls} disabled={starting || live} onClick={start}>
            {starting || live ? <TbLoader size={13} className="animate-spin" /> : <TbSparkles size={13} />}
            {live ? "Running…" : "Run"}
          </button>
        </div>
      </div>
      {job && (
        <p className={cn(
          "mt-2 text-[11px]",
          job.state === "failed" ? "text-red-600 dark:text-red-300" : job.state === "done" ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
        )}>
          {job.trigger === "nightly" ? "Nightly run" : "Run"}{range && ` for ${range}`}:{" "}
          {job.state === "syncing" && "pulling commits from GitHub…"}
          {job.state === "grouping" && `${job.synced != null ? `${job.synced} new commit${job.synced === 1 ? "" : "s"} pulled · ` : ""}AI is grouping commits into cards…`}
          {job.state === "failed" && job.error}
          {job.state === "done" && job.result && (job.result.commits
            ? `grouped ${job.result.commits} commit${job.result.commits === 1 ? "" : "s"} into ${job.result.created} new card${job.result.created === 1 ? "" : "s"}${job.result.extended ? ` and extended ${job.result.extended}` : ""}`
            : "nothing new — every commit in that range already has a card")}
          {job.finishedAt && ` · ${formatDistanceToNow(new Date(job.finishedAt), { addSuffix: true })}`}
        </p>
      )}
      {!job && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Pulls the range from GitHub and turns commits that have no card yet into Done cards, one per feature, dated by when the work shipped.
        </p>
      )}
    </div>
  );
}

function AddSecretForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [form, setForm] = useState({ name: "", kind: "ssh_key" as Secret["kind"], host: "", username: "", port: "", value: "", generate: true });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const generating = form.kind === "ssh_key" && form.generate;

  const save = async () => {
    setSaving(true);
    try {
      const created = await apiFetch<Secret>(`/github/projects/${projectId}/secrets`, {
        method: "POST",
        body: JSON.stringify({ ...form, generate: generating, value: generating ? undefined : form.value }),
      });
      if (created.publicKey && generating) {
        await alertDialog(`Key created. Add this public key to ~/.ssh/authorized_keys on the server:\n\n${created.publicKey}`);
      }
      onDone();
    } catch (err: any) {
      toast.error(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-3 grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
      <input className={inputCls} placeholder="Name (e.g. Prod server)" value={form.name} onChange={(e) => set("name", e.target.value)} />
      <NativeSelect className={inputCls} value={form.kind} onChange={(e) => set("kind", e.target.value)}>
        {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </NativeSelect>
      {form.kind === "ssh_key" && (
        <>
          <input className={inputCls} placeholder="Host (e.g. 13.233.1.2)" value={form.host} onChange={(e) => set("host", e.target.value)} />
          <div className="flex gap-2">
            <input className={cn(inputCls, "flex-1")} placeholder="User (ubuntu)" value={form.username} onChange={(e) => set("username", e.target.value)} />
            <input className={cn(inputCls, "w-20")} placeholder="Port" value={form.port} onChange={(e) => set("port", e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground/80 sm:col-span-2">
            <Switch checked={form.generate} onCheckedChange={(v) => set("generate", v)} />
            Generate a new key pair (otherwise paste an existing private key)
          </label>
        </>
      )}
      {!generating && (
        <textarea
          className={cn(inputCls, "min-h-24 font-mono sm:col-span-2")}
          placeholder={form.kind === "ssh_key" ? "-----BEGIN OPENSSH PRIVATE KEY-----" : form.kind === "env" ? "KEY=value\nOTHER=value" : "Value"}
          value={form.value}
          onChange={(e) => set("value", e.target.value)}
        />
      )}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button className={primaryBtnCls} disabled={saving || !form.name.trim() || (!generating && !form.value)} onClick={save}>
          {saving && <TbLoader size={13} className="animate-spin" />} Save
        </button>
      </div>
    </div>
  );
}

/**
 * The project's GitHub tab: linked repos (with their deploy keys), recent
 * commits, and the project's server credentials. Platform workspace only —
 * the API refuses everyone else, and ProjectWorkspace hides the tab.
 */
export function GitHubView({ projectId, onCardsChanged }: {
  projectId: string;
  /** The workspace's task list — refreshed when a grouping run adds cards. */
  onCardsChanged?: () => void;
}) {
  const [status, setStatus] = useState<{ configured: boolean; installUrl: string | null } | null>(null);
  const [links, setLinks] = useState<RepoLink[]>([]);
  const [commits, setCommits] = useState<RepoCommit[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<AvailableRepo[] | null>(null);
  const [picked, setPicked] = useState("");
  const [linking, setLinking] = useState(false);
  const [addingSecret, setAddingSecret] = useState(false);

  const load = useCallback(async () => {
    try {
      const from = new Date(Date.now() - 14 * 86400_000).toISOString();
      const [s, l, c, sec] = await Promise.all([
        apiFetch<{ configured: boolean; installUrl: string | null }>("/github/status"),
        apiFetch<RepoLink[]>(`/github/projects/${projectId}/repos`),
        apiFetch<RepoCommit[]>(`/github/commits?projectId=${projectId}&from=${encodeURIComponent(from)}`),
        apiFetch<Secret[]>(`/github/projects/${projectId}/secrets`),
      ]);
      setStatus(s); setLinks(l); setCommits(c); setSecrets(sec);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Could not load GitHub data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const openPicker = async () => {
    try {
      setAvailable(await apiFetch<AvailableRepo[]>("/github/repos/available"));
    } catch (err: any) {
      toast.error(err.message || "Could not list repositories");
    }
  };

  const link = async () => {
    setLinking(true);
    try {
      await apiFetch(`/github/projects/${projectId}/repos`, { method: "POST", body: JSON.stringify({ repoId: Number(picked) }) });
      toast.success("Linked — importing the last 14 days of commits");
      setAvailable(null); setPicked("");
      await load();
      // The backfill runs after the response; pick its results up shortly.
      setTimeout(load, 4000);
    } catch (err: any) {
      toast.error(err.message || "Could not link");
    } finally {
      setLinking(false);
    }
  };

  const revealSecret = async (s: Secret) => {
    if (!(await confirmDialog(`Copy "${s.name}" to the clipboard? This is recorded in the audit log.`))) return;
    try {
      const { value } = await apiFetch<{ value: string }>(`/github/projects/${projectId}/secrets/${s.id}/reveal`, { method: "POST" });
      await copy(value, s.name);
    } catch (err: any) {
      toast.error(err.message || "Could not reveal");
    }
  };

  const deleteSecret = async (s: Secret) => {
    if (!(await confirmDialog(`Delete "${s.name}"? This cannot be undone.`))) return;
    try {
      await apiFetch(`/github/projects/${projectId}/secrets/${s.id}`, { method: "DELETE" });
      load();
    } catch (err: any) {
      toast.error(err.message || "Could not delete");
    }
  };

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <TbLoader className="animate-spin" size={15} /> Loading GitHub…
      </p>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-sm text-foreground/85">{error}</p>
        <button className={btnCls} onClick={() => { setLoading(true); load(); }}><TbRefresh size={13} /> Retry</button>
      </div>
    );
  }

  const linkedIds = new Set(links.map((l) => l.repoFullName));
  const linkable = available?.filter((r) => !linkedIds.has(r.fullName)) ?? [];

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-4 p-4">
        {!status?.configured && (
          <div className="rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-400/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
            The GitHub App isn't configured on this server (GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY / GITHUB_WEBHOOK_SECRET).
          </div>
        )}

        <Section
          icon={<TbBrandGithub size={16} />}
          title="Repositories"
          action={status?.configured && available === null && (
            <button className={primaryBtnCls} onClick={openPicker}><TbLink size={13} /> Link repository</button>
          )}
        >
          {available !== null && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border p-3">
              <NativeSelect className={cn(inputCls, "min-w-64")} value={picked} onChange={(e) => setPicked(e.target.value)}>
                <option value="">{linkable.length ? "Choose a repository…" : "No other repositories available"}</option>
                {linkable.map((r) => <option key={r.id} value={r.id}>{r.fullName}{r.private ? " (private)" : ""}</option>)}
              </NativeSelect>
              <button className={primaryBtnCls} disabled={!picked || linking} onClick={link}>
                {linking && <TbLoader size={13} className="animate-spin" />} Link
              </button>
              <button className={btnCls} onClick={() => { setAvailable(null); setPicked(""); }}>Cancel</button>
              {status?.installUrl && (
                <a href={status.installUrl} target="_blank" rel="noreferrer" className="ml-auto text-[11px] text-blue-600 dark:text-blue-300 hover:underline">
                  Repo missing? Add it to the GitHub App
                </a>
              )}
            </div>
          )}
          {links.length ? (
            <div className="grid gap-3">
              {links.map((l) => <RepoCard key={l.id} link={l} onChanged={() => { load(); onCardsChanged?.(); }} />)}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No repository linked yet.</p>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Reference a task in a commit message with its ref, e.g. <span className="font-mono">feat: login page T-1a2b3c4d</span>.
            Writing <span className="font-mono">fixes T-1a2b3c4d</span> on the default branch also completes it. Copy a task's ref from its detail drawer.
            Commits without a ref are grouped by AI into feature cards: daily at 2 AM, or with Run under "Create cards from commits".
          </p>
        </Section>

        <Section icon={<TbGitCommit size={16} />} title={`Commits · last 14 days (${commits.length})`}>
          {commits.length ? (
            <div className="-m-4 max-h-[420px] overflow-auto">
              {commits.map((c) => <CommitRow key={c.id} c={c} />)}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {links.length ? "No commits in the last 14 days." : "Link a repository to see its commits here."}
            </p>
          )}
        </Section>

        <Section
          icon={<TbServer size={16} />}
          title="Server keys & secrets"
          action={!addingSecret && <button className={btnCls} onClick={() => setAddingSecret(true)}><TbPlus size={13} /> Add</button>}
        >
          {addingSecret && <AddSecretForm projectId={projectId} onDone={() => { setAddingSecret(false); load(); }} />}
          {secrets.length ? (
            <div className="-mx-4 -mb-4">
              {secrets.map((s) => (
                <div key={s.id} className="flex items-center gap-3 border-t px-4 py-2.5 text-sm">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">{KIND_LABEL[s.kind]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{s.name}</p>
                    {(s.host || s.username) && (
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {s.username ? `${s.username}@` : ""}{s.host}{s.port ? `:${s.port}` : ""}
                      </p>
                    )}
                  </div>
                  {s.publicKey && (
                    <button className={btnCls} onClick={() => copy(s.publicKey!, "Public key")}><TbCopy size={13} /> Public</button>
                  )}
                  <button className={btnCls} onClick={() => revealSecret(s)}><TbEye size={13} /> Copy</button>
                  <button
                    className="rounded p-1.5 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-400/10 hover:text-red-600 dark:hover:text-red-300"
                    title="Delete"
                    onClick={() => deleteSecret(s)}
                  >
                    <TbTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            !addingSecret && <p className="py-4 text-center text-sm text-muted-foreground">No keys or secrets stored for this project.</p>
          )}
          <p className="mt-4 text-[11px] text-muted-foreground">Encrypted at rest. Every copy of a secret is recorded in the audit log.</p>
        </Section>
      </div>
    </div>
  );
}
