"use client";

import { useCallback, useEffect, useState } from "react";
import { TbTrophy, TbCircleX, TbRefresh, TbWorld } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { EmptyState, TBtn, formatMoney, relativeTime } from "./ui";

interface ReportStage {
  stageId: string; name: string; color: string | null; probability: number;
  count: number; value: number; weightedValue: number;
}
interface ReportSource { source: string; wonCount: number; wonValue: number; lostCount: number }
interface ReportRep {
  ownerId: string | null; name: string;
  openCount: number; openValue: number; wonCount: number; wonValue: number; lostCount: number; activities: number;
}
interface AttributionSide {
  wonCount: number; wonValue: number; lostCount: number; winRate: number | null;
}

interface Reports {
  range: { from: string; to: string };
  pipeline: { stages: ReportStage[]; totalValue: number; weightedValue: number; totalCount: number };
  outcomes: {
    wonCount: number; wonValue: number; lostCount: number; lostValue: number;
    winRate: number | null; avgCycleDays: number | null; avgDealValue: number | null;
  };
  sources: ReportSource[];
  reps: ReportRep[];
  attribution: { sequenced: AttributionSide; organic: AttributionSide };
  activityByType: Record<string, number>;
  monthly: { month: string; count: number; value: number }[];
}

interface IntentCompany {
  name: string; domain: string | null; views: number; sessions: number;
  lastSeen: string; accountId: string | null; knownContacts: number;
  topPages: { path: string; views: number }[];
}
interface IntentResponse {
  enabled: boolean; message?: string; days?: number; companies: IntentCompany[];
}

const RANGES = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "12 months", days: 365 },
];

export function ReportsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [data, setData] = useState<Reports | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<IntentResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      setData(await apiFetch<Reports>(`/crm/reports?from=${from}`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    apiFetch<IntentResponse>(`/crm/intent?days=${days}`).then(setIntent).catch(() => {});
  }, [days]);

  const o = data?.outcomes;

  return (
    <main className={cn("viz-root flex h-full min-h-0 w-full flex-col overflow-hidden glass-panel", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
      {/* Chart roles, defined once. The admin panel is light-mode only (see
          globals.css), so these are the light steps of the validated palette. */}
      <style>{`
        .viz-root {
          --viz-ink: #0b0b0b;
          --viz-muted: #78716c;
          --viz-grid: #e7e5e4;
          --viz-series: #2a78d6;
          --viz-good: #008300;
          --viz-bad: #e34948;
        }
        .viz-bar { border-radius: 0 4px 4px 0; background: var(--viz-series); }
        .viz-col { border-radius: 4px 4px 0 0; background: var(--viz-series); }
      `}</style>

      <div className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-stone-200/70 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <SubNavToggle />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-stone-900">Reports</h1>
            <p className="text-[11px] text-stone-500">Pipeline is as of today; everything closed is within the selected range.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                days === r.days ? "bg-stone-900 text-white" : "border border-stone-200 bg-white/70 text-stone-700 hover:bg-stone-100"
              )}
            >
              {r.label}
            </button>
          ))}
          <TBtn onClick={load} title="Refresh"><TbRefresh size={14} /></TBtn>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {error && <p className="mb-2.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700">{error}</p>}

        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-stone-100" />)}
            </div>
            <div className="h-56 animate-pulse rounded-lg bg-stone-100" />
          </div>
        ) : !data ? (
          <EmptyState title="No report data" />
        ) : (
          <div className="space-y-4">
            {/* Headline numbers — a hero number beats a chart for a single value. */}
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
              <Stat label="Open pipeline" value={formatMoney(data.pipeline.totalValue)} sub={`${data.pipeline.totalCount} deals`} />
              <Stat label="Weighted forecast" value={formatMoney(data.pipeline.weightedValue)} sub="by stage probability" />
              <Stat
                label="Win rate"
                value={o?.winRate == null ? "—" : `${o.winRate}%`}
                sub={o?.winRate == null ? "nothing closed yet" : `${o.wonCount} won · ${o.lostCount} lost`}
              />
              <Stat label="Avg sales cycle" value={o?.avgCycleDays == null ? "—" : `${o.avgCycleDays}d`} sub="create → close" />
              <Stat label="Avg won deal" value={o?.avgDealValue == null ? "—" : formatMoney(o.avgDealValue)} sub={`${formatMoney(o?.wonValue ?? 0)} total`} />
            </div>

            {/* Won vs lost. Status colour is never the only signal — both carry an
                icon and a text label, which the red/green CVD pair requires. */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Outcome
                icon={<TbTrophy size={15} />}
                label="Won"
                tone="var(--viz-good)"
                count={o?.wonCount ?? 0}
                value={formatMoney(o?.wonValue ?? 0)}
              />
              <Outcome
                icon={<TbCircleX size={15} />}
                label="Lost"
                tone="var(--viz-bad)"
                count={o?.lostCount ?? 0}
                value={formatMoney(o?.lostValue ?? 0)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <Panel title="Open pipeline by stage" hint="Bar length is deal value; the stage names carry identity, so one hue is enough.">
                {data.pipeline.stages.length === 0 ? (
                  <p className="py-6 text-center text-xs text-stone-400">No open deals.</p>
                ) : (
                  <HBars
                    rows={data.pipeline.stages.map((s) => ({
                      key: s.stageId,
                      label: s.name,
                      value: s.value,
                      meta: `${s.count} · ${s.probability}%`,
                      display: formatMoney(s.value),
                    }))}
                  />
                )}
              </Panel>

              <Panel title="Won value by month" hint="Only the best month is labelled — a number on every bar is noise.">
                <MonthlyBars rows={data.monthly} />
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <Panel title="Where the wins come from" hint="Deal source, carried over from the lead.">
                {data.sources.length === 0 ? (
                  <p className="py-6 text-center text-xs text-stone-400">Nothing closed in this range.</p>
                ) : (
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
                        <th className="py-1.5 text-left font-semibold">Source</th>
                        <th className="py-1.5 text-right font-semibold">Won</th>
                        <th className="py-1.5 text-right font-semibold">Value</th>
                        <th className="py-1.5 text-right font-semibold">Win rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sources.map((s) => {
                        const decided = s.wonCount + s.lostCount;
                        return (
                          <tr key={s.source} className="border-b border-stone-100 last:border-0">
                            <td className="py-1.5 pr-2 text-stone-800">{s.source}</td>
                            <td className="py-1.5 text-right tabular-nums text-stone-600">{s.wonCount}</td>
                            <td className="py-1.5 text-right font-medium tabular-nums text-stone-900">{formatMoney(s.wonValue)}</td>
                            <td className="py-1.5 text-right tabular-nums text-stone-600">
                              {decided ? `${Math.round((s.wonCount / decided) * 100)}%` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </Panel>

              <Panel title="By rep" hint="Open pipeline now, plus what they closed and logged in range.">
                {data.reps.length === 0 ? (
                  <p className="py-6 text-center text-xs text-stone-400">No deals assigned yet.</p>
                ) : (
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
                        <th className="py-1.5 text-left font-semibold">Rep</th>
                        <th className="py-1.5 text-right font-semibold">Open</th>
                        <th className="py-1.5 text-right font-semibold">Won</th>
                        <th className="py-1.5 text-right font-semibold">Activities</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.reps.map((r) => (
                        <tr key={r.ownerId || "unassigned"} className="border-b border-stone-100 last:border-0">
                          <td className={cn("py-1.5 pr-2", r.ownerId ? "text-stone-800" : "text-stone-400 italic")}>{r.name}</td>
                          <td className="py-1.5 text-right tabular-nums text-stone-600">{formatMoney(r.openValue)}</td>
                          <td className="py-1.5 text-right font-medium tabular-nums text-stone-900">{formatMoney(r.wonValue)}</td>
                          <td className="py-1.5 text-right tabular-nums text-stone-600">{r.activities}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Panel>
            </div>

            <Panel
              title="Did outreach touch these wins?"
              hint="Any sequence enrolment counts, with no attribution window — read it as influence, not sole credit."
            >
              {!data.attribution ? (
                <p className="py-6 text-center text-xs text-stone-400">No attribution data.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <AttributionCard label="Touched by a sequence" side={data.attribution.sequenced} />
                  <AttributionCard label="Never sequenced" side={data.attribution.organic} />
                </div>
              )}
            </Panel>

            <Panel
              title="Companies on your website"
              hint="Resolved from the visiting network at pageview time. The IP itself is never stored."
            >
              {!intent ? (
                <div className="h-16 animate-pulse rounded bg-stone-100" />
              ) : !intent.enabled ? (
                <div className="flex items-start gap-2 rounded-md border border-dashed border-stone-200 px-3 py-3">
                  <TbWorld size={16} className="mt-0.5 shrink-0 text-stone-400" />
                  <div>
                    <p className="text-[12px] font-medium text-stone-700">Not switched on yet</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">{intent.message}</p>
                  </div>
                </div>
              ) : intent.companies.length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-400">
                  No companies resolved yet — signal starts accumulating once the site sees traffic.
                </p>
              ) : (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
                      <th className="py-1.5 text-left font-semibold">Company</th>
                      <th className="py-1.5 text-left font-semibold">Reading</th>
                      <th className="py-1.5 text-right font-semibold">Visits</th>
                      <th className="py-1.5 text-right font-semibold">Last seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intent.companies.slice(0, 15).map((c) => (
                      <tr key={`${c.name}-${c.domain ?? ""}`} className="border-b border-stone-100 last:border-0">
                        <td className="py-1.5 pr-2">
                          <span className="block truncate font-medium text-stone-900">{c.name}</span>
                          <span className="block truncate text-[10px] text-stone-400">
                            {c.domain || "—"}
                            {c.accountId && <span className="ml-1 text-emerald-600">· known account</span>}
                          </span>
                        </td>
                        <td className="py-1.5 pr-2">
                          <span className="block truncate text-[11px] text-stone-600">
                            {c.topPages.map((p) => p.path).join(", ") || "—"}
                          </span>
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-stone-600">
                          {c.views}
                          <span className="ml-1 text-[10px] text-stone-400">/ {c.sessions}s</span>
                        </td>
                        <td className="py-1.5 text-right text-[11px] tabular-nums text-stone-400">{relativeTime(c.lastSeen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>

            <Panel title="Activity mix" hint="What the team actually logged in this range.">
              {Object.keys(data.activityByType).length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-400">No activity logged yet.</p>
              ) : (
                <HBars
                  rows={Object.entries(data.activityByType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => ({ key: type, label: type, value: count, display: String(count) }))}
                />
              )}
            </Panel>
          </div>
        )}
      </div>
    </main>
  );
}

function AttributionCard({ label, side }: { label: string; side: AttributionSide }) {
  const decided = side.wonCount + side.lostCount;
  return (
    <div className="rounded-lg border border-stone-200 bg-white/60 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums leading-tight text-stone-900">
        {formatMoney(side.wonValue)}
      </p>
      <p className="mt-0.5 text-[11px] tabular-nums text-stone-400">
        {side.wonCount} won · {side.lostCount} lost ·{" "}
        {side.winRate == null ? "no data" : `${side.winRate}% win rate`}
        {decided === 0 && " (nothing closed)"}
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg glass-card px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums leading-tight text-stone-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-stone-400">{sub}</p>}
    </div>
  );
}

function Outcome({
  icon, label, tone, count, value,
}: { icon: React.ReactNode; label: string; tone: string; count: number; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg glass-card px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ color: tone, background: `color-mix(in srgb, ${tone} 12%, transparent)` }}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: tone }}>{label}</p>
        <p className="text-sm font-semibold tabular-nums text-stone-900">
          {value} <span className="font-normal text-stone-400">· {count} deal{count === 1 ? "" : "s"}</span>
        </p>
      </div>
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg glass-card p-3">
      <h2 className="text-[12px] font-semibold text-stone-900">{title}</h2>
      {hint && <p className="mb-2.5 mt-0.5 text-[11px] text-stone-400">{hint}</p>}
      {children}
    </section>
  );
}

/** Horizontal bars: label left, mark centre, value directly labelled at the end. */
function HBars({ rows }: { rows: { key: string; label: string; value: number; meta?: string; display: string }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[minmax(72px,26%)_minmax(0,1fr)_auto] items-center gap-2">
          <span className="truncate text-[11px] text-stone-600" title={r.label}>{r.label}</span>
          <span className="relative h-4 rounded bg-stone-100">
            <span
              className="viz-bar absolute inset-y-0 left-0 min-w-[3px]"
              style={{ width: `${Math.max(1, (r.value / max) * 100)}%` }}
              title={`${r.label}: ${r.display}${r.meta ? ` (${r.meta})` : ""}`}
            />
          </span>
          <span className="whitespace-nowrap text-[11px] font-medium tabular-nums text-stone-800">
            {r.display}
            {r.meta && <span className="ml-1 font-normal text-stone-400">{r.meta}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Columns anchored to a baseline, with only the peak month directly labelled. */
function MonthlyBars({ rows }: { rows: { month: string; count: number; value: number }[] }) {
  if (rows.length === 0) return <p className="py-6 text-center text-xs text-stone-400">Nothing won in this range.</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const peak = rows.reduce((best, r) => (r.value > best.value ? r : best), rows[0]);

  return (
    <div>
      <div className="flex h-32 items-end gap-1 border-b border-stone-200">
        {rows.map((r) => (
          <div key={r.month} className="group relative flex min-w-0 flex-1 flex-col items-center justify-end">
            {r.month === peak.month && (
              <span className="mb-1 whitespace-nowrap text-[10px] font-medium tabular-nums text-stone-700">
                {formatMoney(r.value)}
              </span>
            )}
            <div
              className="viz-col w-full"
              style={{ height: `${Math.max(2, (r.value / max) * 100)}%` }}
              title={`${r.month}: ${formatMoney(r.value)} · ${r.count} deal${r.count === 1 ? "" : "s"}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {rows.map((r) => (
          <span key={r.month} className="min-w-0 flex-1 truncate text-center text-[9px] tabular-nums text-stone-400">
            {r.month.slice(2)}
          </span>
        ))}
      </div>
    </div>
  );
}
