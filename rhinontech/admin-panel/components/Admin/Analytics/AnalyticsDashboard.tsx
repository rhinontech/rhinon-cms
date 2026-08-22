"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
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
  TbMapPin,
  TbMail,
  TbSearch,
  TbCopy,
  TbCheck,
  TbClock,
  TbGlobe,
  TbCalendar,
  TbCalendarOff,
  TbX,
} from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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
interface VisitorRow {
  id: string;
  email: string;
  ip: string;
  city: string | null;
  region: string | null;
  country: string | null;
  location: string | null;
  path: string | null;
  referrer: string | null;
  userAgent: string | null;
  visitedAt: string;
}

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

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  "Organic Search": <TbWorldSearch size={16} />,
  Direct: <TbPointer size={16} />,
  Social: <TbShare3 size={16} />,
  Referral: <TbLink size={16} />,
};

const CHANNEL_COLOR: Record<string, string> = {
  "Organic Search": "var(--chart-1)",
  Direct: "var(--chart-2)",
  Social: "var(--chart-3)",
  Referral: "var(--chart-4)",
};

const trendConfig: ChartConfig = {
  pageviews: { label: "Pageviews", color: "var(--chart-1)" },
  visitors: { label: "Visitors", color: "var(--chart-2)" },
};

const pagesConfig: ChartConfig = {
  pageviews: { label: "Pageviews", color: "var(--chart-1)" },
  visitors: { label: "Visitors", color: "var(--chart-2)" },
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
  const [visitors, setVisitors] = useState<VisitorRow[]>([]);

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
      const [ov, ts, src, tp, vis] = await Promise.all([
        apiFetch<Overview>(`/analytics/overview?${qs}`),
        apiFetch<{ series: TimeseriesPoint[] }>(`/analytics/timeseries?${qs}`),
        apiFetch<{ channels: ChannelRow[]; campaigns: CampaignRow[] }>(`/analytics/sources?${qs}`),
        apiFetch<{ pages: PageRow[] }>(`/analytics/top-pages?${qs}`),
        apiFetch<{ visitors: VisitorRow[] }>(`/analytics/visitors?${qs}`),
      ]);
      setOverview(ov);
      setSeries(ts.series);
      setChannels(src.channels);
      setCampaigns(src.campaigns);
      setPages(tp.pages);
      setVisitors(vis.visitors || []);
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
        {
          key: "visitors" as const,
          label: "Unique Visitors",
          icon: <TbUsers size={16} />,
          value: overview.current.visitors,
          prev: overview.previous.visitors,
        },
        {
          key: "pageviews" as const,
          label: "Pageviews",
          icon: <TbEye size={16} />,
          value: overview.current.pageviews,
          prev: overview.previous.pageviews,
        },
        {
          key: "sessions" as const,
          label: "Sessions",
          icon: <TbDeviceDesktopAnalytics size={16} />,
          value: overview.current.sessions,
          prev: overview.previous.sessions,
        },
      ]
    : [];

  return (
    <div className="h-full overflow-auto bg-muted/30 rounded-xl">
      <div className="mx-auto max-w-[1280px] space-y-6 p-6">
        {/* Header + range selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Website Analytics</h1>
            <p className="text-sm text-muted-foreground">Organic & tagged traffic to rhinonlabs.com</p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <TabsList>
                {RANGES.map((r) => (
                  <TabsTrigger key={r.days} value={String(r.days)}>
                    {r.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" onClick={load} title="Refresh">
              <TbRefresh size={16} className={loading ? "animate-spin" : ""} />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={SITE_URL} target="_blank" rel="noreferrer" className="gap-1.5">
                Visit site <TbExternalLink size={14} />
              </a>
            </Button>
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
              <Card key={i}>
                {c ? (
                  <>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardDescription className="flex items-center gap-1.5 font-medium">
                          <span className="text-muted-foreground">{c.icon}</span>
                          {c.label}
                        </CardDescription>
                        {c.key !== "sessions" && (
                          <MiniTrend
                            data={series}
                            dataKey={c.key}
                            color={c.key === "pageviews" ? "var(--chart-1)" : "var(--chart-2)"}
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-end justify-between gap-2">
                        <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                          {nfmt(c.value)}
                        </span>
                        {d !== null && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                              up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                            )}
                          >
                            {up ? <TbArrowUpRight size={14} /> : <TbArrowDownRight size={14} />}
                            {Math.abs(d).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">vs. previous {days} days</p>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Pageviews + Visitors Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Trend</CardTitle>
            <CardDescription>Daily pageviews and unique visitors over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={series} loading={loading && series.length === 0} />
          </CardContent>
        </Card>

        {/* Sources + campaigns */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where your pageviews are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <SourcesChart channels={channels} loading={loading && channels.length === 0} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>UTM Campaigns</CardTitle>
              <CardDescription>Performance of your tagged links</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && campaigns.length === 0 ? (
                <Skeleton className="h-56 w-full" />
              ) : campaigns.length === 0 ? (
                <EmptyHint text="No tagged campaigns yet. Add ?utm_source=…&utm_medium=…&utm_campaign=… to your links." />
              ) : (
                <div className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="pb-2 font-medium">Campaign</th>
                        <th className="pb-2 font-medium">Source / Medium</th>
                        <th className="pb-2 text-right font-medium">Visitors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {campaigns.map((c, i) => (
                        <tr key={i}>
                          <td className="py-2.5 font-medium text-foreground">{c.campaign}</td>
                          <td className="py-2.5 text-muted-foreground">
                            {[c.source, c.medium].filter(Boolean).join(" / ") || "—"}
                          </td>
                          <td className="py-2.5 text-right font-medium text-foreground tabular-nums">
                            {nfmt(c.visitors)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Your highest-traffic pages in this range</CardDescription>
          </CardHeader>
          <CardContent>
            <TopPagesChart pages={pages} loading={loading && pages.length === 0} />
          </CardContent>
        </Card>

        {/* Identified Email Visitors Table */}
        <VisitorsTable visitors={visitors} loading={loading && visitors.length === 0} />
      </div>
    </div>
  );
}

function VisitorsTable({ visitors, loading }: { visitors: VisitorRow[]; loading: boolean }) {
  const [query, setQuery] = useState("");
  // Default to today's date (YYYY-MM-DD); null means "All Dates"
  const [selectedDate, setSelectedDate] = useState<string | null>(() => ymd(new Date()));
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const todayStr = useMemo(() => ymd(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return ymd(d);
  }, []);

  const filtered = useMemo(() => {
    return visitors.filter((v) => {
      // Date filter
      if (selectedDate) {
        const vDate = v.visitedAt ? ymd(new Date(v.visitedAt)) : "";
        if (vDate !== selectedDate) return false;
      }
      // Search query filter
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const matches =
          v.email.toLowerCase().includes(q) ||
          v.ip.toLowerCase().includes(q) ||
          (v.location && v.location.toLowerCase().includes(q)) ||
          (v.path && v.path.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [visitors, selectedDate, query]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formattedDateLabel = useMemo(() => {
    if (!selectedDate) return "All Time";
    if (selectedDate === todayStr) return "Today";
    if (selectedDate === yesterdayStr) return "Yesterday";
    return new Date(selectedDate + "T00:00:00").toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate, todayStr, yesterdayStr]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Identified Visitors</CardTitle>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
                {filtered.length} {selectedDate ? `on ${formattedDateLabel}` : "total"}
              </span>
            </div>
            <CardDescription>
              Visitors arriving with email parameters (e.g. ?email=...) with IP & resolved location
            </CardDescription>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <TbSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder="Search email, IP, location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-border/60">
          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant={selectedDate === todayStr ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDate(todayStr)}
              className={cn("h-7.5 px-2.5 text-xs", selectedDate === todayStr && "shadow-sm")}
            >
              Today
            </Button>
            <Button
              variant={selectedDate === yesterdayStr ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDate(yesterdayStr)}
              className={cn("h-7.5 px-2.5 text-xs", selectedDate === yesterdayStr && "shadow-sm")}
            >
              Yesterday
            </Button>
            <Button
              variant={selectedDate === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDate(null)}
              className={cn("h-7.5 px-2.5 text-xs", selectedDate === null && "shadow-sm")}
            >
              All Dates
            </Button>
          </div>

          {/* Custom date picker */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex items-center">
              <TbCalendar className="absolute left-2.5 text-muted-foreground pointer-events-none" size={14} />
              <input
                type="date"
                max={todayStr}
                value={selectedDate || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedDate(null);
                  } else if (val > todayStr) {
                    setSelectedDate(todayStr);
                  } else {
                    setSelectedDate(val);
                  }
                }}
                className="h-8 pl-8 pr-2 text-xs rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(null)}
                title="Clear date filter (Show all)"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <TbX size={13} />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
            <TbCalendarOff size={28} className="mx-auto text-muted-foreground/60" />
            <p className="font-medium text-foreground">
              {selectedDate
                ? `No visitors recorded on ${formattedDateLabel}`
                : query
                ? "No visitors matched your search query."
                : "No email-tagged visitors recorded yet."}
            </p>
            {selectedDate && (
              <p className="text-xs">
                Try picking another date or click{" "}
                <button
                  onClick={() => setSelectedDate(null)}
                  className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
                >
                  All Dates
                </button>{" "}
                to view all visits.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Visitor Email</th>
                  <th className="pb-3 font-medium">IP Address</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Page Path</th>
                  <th className="pb-3 text-right font-medium">Visited At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/40 transition-colors">
                    {/* Email */}
                    <td className="py-3 pr-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          <TbMail size={14} />
                        </div>
                        <span className="font-semibold">{v.email}</span>
                        <button
                          onClick={() => copyToClipboard(v.email, `email-${v.id}`)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                          title="Copy email"
                        >
                          {copiedId === `email-${v.id}` ? <TbCheck size={13} className="text-emerald-600" /> : <TbCopy size={13} />}
                        </button>
                      </div>
                    </td>

                    {/* IP */}
                    <td className="py-3 pr-3">
                      <span className="inline-flex items-center font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/80">
                        {v.ip}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3 pr-3 text-foreground">
                      <div className="flex items-center gap-1.5 text-xs">
                        <TbMapPin size={14} className="text-rose-500 shrink-0" />
                        <span className="font-medium">
                          {v.location || [v.city, v.region, v.country].filter(Boolean).join(", ") || "Unknown Location"}
                        </span>
                      </div>
                    </td>

                    {/* Path */}
                    <td className="py-3 pr-3">
                      <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                        {v.path || "/"}
                      </span>
                    </td>

                    {/* Visited At */}
                    <td className="py-3 text-right text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <TbClock size={12} className="text-muted-foreground shrink-0" />
                        <span>
                          {new Date(v.visitedAt).toLocaleDateString([], { month: "short", day: "numeric" })},{" "}
                          {new Date(v.visitedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>;
}

/** Small inline sparkline used inside the stat cards — deliberately raw recharts (no ChartContainer chrome). */
function MiniTrend({ data, dataKey, color }: { data: TimeseriesPoint[]; dataKey: "pageviews" | "visitors"; color: string }) {
  if (!data.length) return null;
  const gradientId = `mini-${dataKey}`;
  return (
    <div className="h-8 w-20 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            dataKey={dataKey}
            type="monotone"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendChart({ data, loading }: { data: TimeseriesPoint[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-72 w-full" />;
  if (data.length === 0) return <EmptyHint text="No traffic data recorded for this range." />;

  return (
    <ChartContainer config={trendConfig} className="w-full aspect-auto h-72">
      <AreaChart data={data} margin={{ left: 12, right: 12 }}>
        <defs>
          <linearGradient id="fillPageviews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-pageviews)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-pageviews)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={nfmt} width={36} />
        <ChartTooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltipContent indicator="dot" />} />
        <Area
          dataKey="pageviews"
          type="natural"
          fill="url(#fillPageviews)"
          fillOpacity={0.4}
          stroke="var(--color-pageviews)"
          strokeWidth={2}
        />
        <Area
          dataKey="visitors"
          type="natural"
          fill="url(#fillVisitors)"
          fillOpacity={0.4}
          stroke="var(--color-visitors)"
          strokeWidth={2}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}

function SourcesChart({ channels, loading }: { channels: ChannelRow[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-56 w-full" />;
  if (channels.length === 0) return <EmptyHint text="No traffic sources recorded for this range." />;

  const total = channels.reduce((sum, c) => sum + c.pageviews, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <ChartContainer config={{}} className="mx-auto aspect-square max-h-[220px] w-full sm:w-[220px]">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie data={channels} dataKey="pageviews" nameKey="channel" innerRadius={60} strokeWidth={5}>
            {channels.map((c) => (
              <Cell key={c.channel} fill={CHANNEL_COLOR[c.channel] || "var(--chart-5)"} />
            ))}
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} className="fill-foreground text-2xl font-bold">
                        {nfmt(total)}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 16} className="fill-muted-foreground text-[11px]">
                        pageviews
                      </tspan>
                    </text>
                  );
                }
                return null;
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <div className="flex-1 space-y-3">
        {channels.map((c) => {
          const pct = total ? (c.pageviews / total) * 100 : 0;
          return (
            <div key={c.channel} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <span className="text-muted-foreground">{CHANNEL_ICON[c.channel] || <TbLink size={16} />}</span>
                {c.channel}
              </span>
              <span className="flex items-baseline gap-1.5 tabular-nums">
                <span className="font-semibold text-foreground">{nfmt(c.pageviews)}</span>
                <span className="text-xs text-muted-foreground">({pct.toFixed(0)}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopPagesChart({ pages, loading }: { pages: PageRow[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-72 w-full" />;
  if (pages.length === 0) return <EmptyHint text="No pageviews yet for this range." />;

  const rows = pages.slice(0, 8).map((p) => ({ ...p, label: p.title || p.path }));
  const height = Math.max(220, rows.length * 44);

  return (
    <ChartContainer config={pagesConfig} className="w-full aspect-auto" style={{ height }}>
      <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 16 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={nfmt} />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          width={172}
          tick={{ fontSize: 12 }}
          tickFormatter={(v: string) => (v.length > 24 ? `${v.slice(0, 24)}…` : v)}
        />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent indicator="line" />} />
        <Bar dataKey="pageviews" fill="var(--color-pageviews)" radius={[0, 4, 4, 0]} barSize={11} />
        <Bar dataKey="visitors" fill="var(--color-visitors)" radius={[0, 4, 4, 0]} barSize={11} />
      </BarChart>
    </ChartContainer>
  );
}
