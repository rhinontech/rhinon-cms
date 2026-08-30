"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  TbRocket,
  TbRefresh,
  TbCheck,
  TbX,
  TbLoader2,
  TbGitCommit,
  TbAlertTriangle,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { usePermissions } from "@/context/PermissionsContext";

type DeployStatus = "running" | "success" | "failed";

interface DeploymentSummary {
  id: string;
  target: string;
  status: DeployStatus;
  triggeredByName: string;
  commitBefore: string | null;
  commitAfter: string | null;
  commitMessage: string | null;
  exitCode: number | null;
  startedAt: string;
  finishedAt: string | null;
  log?: string;
}

interface DeployTarget {
  key: string;
  label: string;
  /** "pm2" apps rebuild before restarting; "docker" ones restart the compose service. */
  kind: "pm2" | "docker";
  /** Grouping heading — Rhinon Tech and FurrCircle are separate systems on one box. */
  app: string;
  branch: string;
  /** The pm2 process or compose service that gets restarted. */
  unit: string;
  port: number;
  description: string;
  latest: DeploymentSummary | null;
}

const POLL_MS = 2000;

/**
 * Manual backend deploys — pull, build, restart pm2 — triggered from the panel.
 *
 * Deploying prod restarts the very API this page talks to, so a failed poll is the
 * expected middle of a successful deploy, not an error: polling keeps going through
 * the gap and only the run's own exit code decides success. Nothing here ever shows
 * "failed" because a request didn't land.
 */
export function SettingsDeploy() {
  const { has } = usePermissions();
  const canTrigger = has("deploy:trigger");

  const [enabled, setEnabled] = useState(true);
  const [targets, setTargets] = useState<DeployTarget[]>([]);
  const [history, setHistory] = useState<DeploymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<DeploymentSummary | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const logRef = useRef<HTMLPreElement>(null);
  const stickToBottom = useRef(true);

  const loadOverview = useCallback(async () => {
    const [t, h] = await Promise.all([
      apiFetch<{ enabled: boolean; targets: DeployTarget[] }>("/deploy/targets"),
      apiFetch<{ deployments: DeploymentSummary[] }>("/deploy/history?limit=20"),
    ]);
    setEnabled(t.enabled);
    setTargets(t.targets);
    setHistory(h.deployments);
  }, []);

  useEffect(() => {
    loadOverview()
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load deploys"))
      .finally(() => setLoading(false));
  }, [loadOverview]);

  // Adopt an already-running deploy on mount, so reloading the page mid-deploy (or
  // opening it in a second tab) picks the console back up instead of losing the run.
  useEffect(() => {
    if (activeId) return;
    const running = targets.find((t) => t.latest?.status === "running")?.latest;
    if (running) setActiveId(running.id);
  }, [targets, activeId]);

  // Poll the selected run. A network error here almost always means pm2 is restarting
  // the API mid-deploy — surface it as "restarting", keep polling, change nothing.
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const { deployment } = await apiFetch<{ deployment: DeploymentSummary }>(
          `/deploy/run/${activeId}`
        );
        if (cancelled) return;
        setApiUnreachable(false);
        setActive(deployment);
        if (deployment.status !== "running") {
          if (deployment.status === "success") toast.success(`${labelFor(deployment.target)} deployed`);
          else toast.error(`${labelFor(deployment.target)} deploy failed — check the log`);
          loadOverview().catch(() => {});
          return; // stop polling
        }
      } catch {
        if (!cancelled) setApiUnreachable(true);
      }
      if (!cancelled) timer = setTimeout(tick, POLL_MS);
    };

    let timer: ReturnType<typeof setTimeout> = setTimeout(tick, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Follow the log tail, but stop fighting the user once they scroll up to read.
  useEffect(() => {
    const el = logRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [active?.log]);

  const labelFor = (key: string) => targets.find((t) => t.key === key)?.label || key;

  const runDeploy = async (target: DeployTarget) => {
    const action =
      target.kind === "docker"
        ? `restarts the ${target.unit} container (deps + migrations re-run on boot)`
        : `rebuilds and restarts ${target.unit}`;
    const warning =
      target.key === "prod"
        ? `Deploy PRODUCTION?\n\nThis pulls ${target.branch}, ${action}. The API will be briefly unavailable.`
        : `Deploy ${target.label}?\n\nThis pulls ${target.branch} and ${action}.`;
    if (!confirm(warning)) return;

    setStarting(target.key);
    try {
      const { deploymentId } = await apiFetch<{ deploymentId: string }>(`/deploy/${target.key}`, {
        method: "POST",
      });
      setActive(null);
      setActiveId(deploymentId);
      stickToBottom.current = true;
      toast.info(`${target.label} deploy started`);
      loadOverview().catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the deploy");
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-r-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b border-border glass-header">
        <SubNavToggle />
        <div className="flex-1">
          <h1 className="text-base font-semibold tracking-tight">Deploy</h1>
          <p className="text-xs text-muted-foreground">
            Pull, build and restart the backend on EC2
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadOverview().catch(() => {})}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <TbRefresh size={15} /> Refresh
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {!loading && !enabled && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 max-w-3xl">
            <TbAlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="text-xs">
              <p className="font-semibold text-foreground">Deploys are disabled on this server</p>
              <p className="text-muted-foreground">
                Set <code className="font-mono">DEPLOY_ENABLED=true</code> in the backend&apos;s
                <code className="font-mono"> .env</code> and restart it once by hand. History stays
                readable either way.
              </p>
            </div>
          </div>
        )}

        {groupByApp(targets).map(([appName, appTargets]) => (
        <div key={appName} className="max-w-3xl space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {appName}
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
          {appTargets.map((t) => {
            const busy = t.latest?.status === "running" || starting === t.key;
            return (
              <div key={t.key} className="rounded-xl glass-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                  </div>
                  <StatusPill status={t.latest?.status} />
                </div>

                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <dt>Branch</dt>
                  <dd className="font-mono text-foreground">{t.branch}</dd>
                  <dt>{t.kind === "docker" ? "Service" : "Process"}</dt>
                  <dd className="font-mono text-foreground">{t.unit}</dd>
                  <dt>Last deploy</dt>
                  <dd className="text-foreground">
                    {t.latest ? `${when(t.latest.startedAt)} · ${t.latest.triggeredByName}` : "never"}
                  </dd>
                </dl>

                {t.latest?.commitMessage && (
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <TbGitCommit size={13} className="mt-0.5 shrink-0" />
                    <span className="truncate" title={t.latest.commitMessage}>
                      {t.latest.commitMessage}
                    </span>
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canTrigger || !enabled || busy}
                    onClick={() => runDeploy(t)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                      "bg-primary text-primary-foreground hover:opacity-90",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {busy ? <TbLoader2 size={14} className="animate-spin" /> : <TbRocket size={14} />}
                    {busy ? "Deploying…" : `Deploy ${t.label}`}
                  </button>
                  {t.latest && (
                    <button
                      type="button"
                      onClick={() => {
                        setActive(null);
                        setActiveId(t.latest!.id);
                      }}
                      className="rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      View log
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
        ))}

        {!canTrigger && !loading && (
          <p className="max-w-3xl text-xs text-muted-foreground">
            You can see deploy history but not trigger deploys. Ask a super-admin for the{" "}
            <code className="font-mono">deploy:trigger</code> permission.
          </p>
        )}

        {activeId && (
          <div className="max-w-3xl rounded-xl glass-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <StatusPill status={active?.status} />
              <p className="flex-1 text-xs text-muted-foreground">
                {active
                  ? `${labelFor(active.target)} · started by ${active.triggeredByName} · ${when(active.startedAt)}`
                  : "Loading run…"}
              </p>
              {active?.commitAfter && (
                <code className="font-mono text-[11px] text-muted-foreground">
                  {active.commitAfter.slice(0, 7)}
                </code>
              )}
            </div>

            {apiUnreachable && (
              <p className="flex items-center gap-2 border-b border-border bg-amber-500/10 px-4 py-2 text-[11px] text-amber-600 dark:text-amber-400">
                <TbLoader2 size={13} className="animate-spin" />
                API restarting — this is expected mid-deploy. Reconnecting…
              </p>
            )}

            <pre
              ref={logRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
              }}
              className="max-h-96 overflow-auto bg-black/85 p-4 font-mono text-[11px] leading-relaxed text-emerald-100 whitespace-pre-wrap"
            >
              {active?.log?.trim() || "Waiting for output…"}
            </pre>
          </div>
        )}

        <div className="max-w-3xl">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            History
          </h2>
          <div className="rounded-xl glass-card divide-y divide-border overflow-hidden">
            {history.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                {loading ? "Loading…" : "No deploys yet."}
              </p>
            )}
            {history.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setActive(null);
                  setActiveId(d.id);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40",
                  activeId === d.id && "bg-muted/40"
                )}
              >
                <StatusPill status={d.status} compact />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {labelFor(d.target)}
                    {d.commitMessage ? ` — ${d.commitMessage}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {d.triggeredByName} · {when(d.startedAt)}
                    {d.finishedAt ? ` · ${duration(d.startedAt, d.finishedAt)}` : ""}
                  </p>
                </div>
                {d.commitAfter && (
                  <code className="font-mono text-[11px] text-muted-foreground">
                    {d.commitAfter.slice(0, 7)}
                  </code>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Preserves server order while grouping, so Rhinon's environments stay adjacent. */
function groupByApp(targets: DeployTarget[]): [string, DeployTarget[]][] {
  const groups = new Map<string, DeployTarget[]>();
  for (const t of targets) {
    const existing = groups.get(t.app);
    if (existing) existing.push(t);
    else groups.set(t.app, [t]);
  }
  return [...groups.entries()];
}

function StatusPill({ status, compact }: { status?: DeployStatus | null; compact?: boolean }) {
  if (!status) {
    return compact ? null : (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
        No runs
      </span>
    );
  }
  const map = {
    running: { icon: <TbLoader2 size={12} className="animate-spin" />, label: "Running", cls: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
    success: { icon: <TbCheck size={12} />, label: "Success", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    failed: { icon: <TbX size={12} />, label: "Failed", cls: "bg-red-500/15 text-red-600 dark:text-red-400" },
  }[status];

  return (
    <span className={cn("flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", map.cls)}>
      {map.icon}
      {!compact && map.label}
    </span>
  );
}

function when(iso: string) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function duration(start: string, end: string) {
  const secs = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
  return secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`;
}
