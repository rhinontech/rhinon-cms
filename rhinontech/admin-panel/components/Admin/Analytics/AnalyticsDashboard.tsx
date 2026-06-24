"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TbUsers,
  TbEye,
  TbDeviceDesktopAnalytics,
  TbArrowUpRight,
  TbArrowDownRight,
  TbExternalLink,
  TbWorldSearch,
  TbPointer,
  TbShare3,
  TbLink,
  TbRefresh,
} from "react-icons/tb";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rhinonlabs.com";

type Metrics = { pageviews: number; visitors: number; sessions: number };
interface Overview {
  range: { from: string; to: string };
  current: Metrics;
  previous: Metrics;
}
interface TimeseriesPoint { date: string; pageviews: number; visitors: number }
interface ChannelRow { channel: string; pageviews: number; visitors: number }
interface CampaignRow { campaign: string; source: string | null; medium: string | null; pageviews: number; visitors: number }
interface PageRow { path: string; title: string | null; pageviews: number; visitors: number }

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function nfmt(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

// Percentage change vs the previous period. Returns null when there's no baseline.
function delta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
}

const CHANNEL_META: Record<string, { icon: React.ReactNode; color: string }> = {
  "Organic Search": { icon: <TbWorldSearch size={16} />, color: "bg-emerald-500" },
  Direct: { icon: <TbPointer size={16} />, color: "bg-sky-500" },
  Social: { icon: <TbShare3 size={16} />, color: "bg-violet-500" },
  Referral: { icon: <TbLink size={16} />, color: "bg-amber-500" },
};

export function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [series, setSeries] = useState<TimeseriesPoint[]>([]);
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    return { from: ymd(from), to: ymd(to) };
  }, [days]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = `from=${range.from}&to=${range.to}`;
    try {
      const [ov, ts, src, tp] = await Promise.all([
        apiFetch<Overview>(`/analytics/overview?${qs}`),
        apiFetch<{ series: TimeseriesPoint[] }>(`/analytics/timeseries?${qs}`),
        apiFetch<{ channels: ChannelRow[]; campaigns: CampaignRow[] }>(`/analytics/sources?${qs}`),
        apiFetch<{ pages: PageRow[] }>(`/analytics/top-pages?${qs}`),
      ]);
      setOverview(ov);
      setSeries(ts.series);
      setChannels(src.channels);
      setCampaigns(src.campaigns);
      setPages(tp.pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = overview
    ? [
        { label: "Unique Visitors", value: overview.current.visitors, prev: overview.previous.visitors, icon: <TbUsers size={18} /> },
        { label: "Pageviews", value: overview.current.pageviews, prev: overview.previous.pageviews, icon: <TbEye size={18} /> },
        { label: "Sessions", value: overview.current.sessions, prev: overview.previous.sessions, icon: <TbDeviceDesktopAnalytics size={18} /> },
      ]
    : [];

  const channelTotal = channels.reduce((s, c) => s + c.pageviews, 0);
  const maxPageRows = pages.slice(0, 10);
  const maxPageViews = Math.max(1, ...maxPageRows.map((p) => p.pageviews));

  return (
    <div className="h-full overflow-auto bg-white rounded-xl">
      <div className="mx-auto max-w-[1200px] p-6 space-y-6">
        {/* Header + range selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Website Analytics</h1>
            <p className="text-sm text-gray-500">Organic traffic to rhinonlabs.com</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setDays(r.days)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    days === r.days ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              className="p-2 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <TbRefresh size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(loading && !overview ? Array.from({ length: 3 }) : cards).map((c: any, i) => {
            const d = c ? delta(c.value, c.prev) : null;
            const up = d !== null && d >= 0;
            return (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
                {c ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">{c.label}</span>
                      <span className="text-gray-400">{c.icon}</span>
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="text-3xl font-semibold text-gray-900">{nfmt(c.value)}</span>
                      {d !== null && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 text-xs font-medium",
                            up ? "text-emerald-600" : "text-red-600"
                          )}
                        >
                          {up ? <TbArrowUpRight size={14} /> : <TbArrowDownRight size={14} />}
                          {Math.abs(d).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-400">vs previous {days} days</p>
                  </>
                ) : (
                  <div className="h-20 animate-pulse rounded bg-gray-100" />
                )}
              </div>
            );
          })}
        </div>

        {/* Trend chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Visitors &amp; Pageviews</h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Pageviews</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Visitors</span>
            </div>
          </div>
          <TrendChart data={series} loading={loading && series.length === 0} />
        </div>

        {/* Sources + campaigns */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Traffic Sources</h2>
            {channels.length === 0 ? (
              <EmptyHint loading={loading} text="No traffic yet for this range." />
            ) : (
              <div className="space-y-3">
                {channels.map((c) => {
                  const pct = channelTotal ? (c.pageviews / channelTotal) * 100 : 0;
                  const meta = CHANNEL_META[c.channel] || CHANNEL_META.Referral;
                  return (
                    <div key={c.channel}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2 text-gray-700">
                          <span className="text-gray-400">{meta.icon}</span>
                          {c.channel}
                        </span>
                        <span className="text-gray-500">
                          {nfmt(c.pageviews)} <span className="text-gray-400">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className={cn("h-full rounded-full", meta.color)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">UTM Campaigns</h2>
            {campaigns.length === 0 ? (
              <EmptyHint
                loading={loading}
                text="No tagged campaigns yet. Add ?utm_source=…&utm_medium=…&utm_campaign=… to your links."
              />
            ) : (
              <div className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                      <th className="pb-2 font-medium">Campaign</th>
                      <th className="pb-2 font-medium">Source / Medium</th>
                      <th className="pb-2 text-right font-medium">Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map((c, i) => (
                      <tr key={i}>
                        <td className="py-2 font-medium text-gray-800">{c.campaign}</td>
                        <td className="py-2 text-gray-500">
                          {[c.source, c.medium].filter(Boolean).join(" / ") || "—"}
                        </td>
                        <td className="py-2 text-right text-gray-700">{nfmt(c.visitors)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Top pages */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Top Pages</h2>
          {maxPageRows.length === 0 ? (
            <EmptyHint loading={loading} text="No pageviews yet for this range." />
          ) : (
            <div className="space-y-2">
              {maxPageRows.map((p) => (
                <div key={p.path} className="group relative flex items-center justify-between gap-4 rounded-lg px-3 py-2 hover:bg-gray-50">
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg bg-indigo-50"
                    style={{ width: `${(p.pageviews / maxPageViews) * 100}%` }}
                  />
                  <div className="relative z-10 min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-800">{p.title || p.path}</div>
                    <a
                      href={`${SITE_URL}${p.path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600"
                    >
                      {p.path} <TbExternalLink size={11} />
                    </a>
                  </div>
                  <div className="relative z-10 flex shrink-0 items-center gap-6 text-sm">
                    <span className="text-gray-700">{nfmt(p.pageviews)} <span className="text-gray-400">views</span></span>
                    <span className="hidden text-gray-500 sm:inline">{nfmt(p.visitors)} <span className="text-gray-400">visitors</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyHint({ loading, text }: { loading: boolean; text: string }) {
  if (loading) return <div className="h-24 animate-pulse rounded bg-gray-100" />;
  return <p className="py-6 text-center text-sm text-gray-400">{text}</p>;
}

// Lightweight inline SVG area+line chart — no charting dependency.
function TrendChart({ data, loading }: { data: TimeseriesPoint[]; loading: boolean }) {
  if (loading) return <div className="h-56 animate-pulse rounded bg-gray-100" />;
  if (data.length === 0) return <p className="py-16 text-center text-sm text-gray-400">No data for this range.</p>;

  const W = 1000;
  const H = 280;
  const pad = { top: 10, right: 8, bottom: 22, left: 8 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => d.pageviews));
  const n = data.length;

  const x = (i: number) => pad.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  const line = (key: "pageviews" | "visitors") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");

  const area = `${line("pageviews")} L${x(n - 1).toFixed(1)},${(pad.top + innerH).toFixed(1)} L${x(0).toFixed(1)},${(pad.top + innerH).toFixed(1)} Z`;

  // A handful of evenly-spaced date ticks.
  const tickIdxs = Array.from(new Set([0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1]));
  const fmtTick = (s: string) => {
    const d = new Date(s);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#pvFill)" />
      <path d={line("pageviews")} fill="none" stroke="#6366f1" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      <path d={line("visitors")} fill="none" stroke="#10b981" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      {tickIdxs.map((i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="fill-gray-400" fontSize="11">
          {fmtTick(data[i].date)}
        </text>
      ))}
    </svg>
  );
}
