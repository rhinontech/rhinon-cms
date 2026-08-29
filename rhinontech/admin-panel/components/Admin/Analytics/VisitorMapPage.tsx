"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TbRefresh, TbRobot, TbUsers, TbMailCheck, TbAlertTriangle, TbArrowLeft } from "react-icons/tb";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VisitorsMap, type MappableVisitor } from "./VisitorsMap";

interface MapPoint extends MappableVisitor {
  identified: boolean;
}

interface MapResponse {
  points: MapPoint[];
  countries: { country: string; count: number }[];
  stats: {
    anonymous: number;
    identified: number;
    totalPageviews: number;
    locatedPageviews: number;
  };
}

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
];

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

export function VisitorMapPage() {
  const router = useRouter();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];

  const [days, setDays] = useState(30);
  const [includeBots, setIncludeBots] = useState(false);
  const [showAnonymous, setShowAnonymous] = useState(true);
  const [showIdentified, setShowIdentified] = useState(true);
  const [data, setData] = useState<MapResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        from: isoDaysAgo(days),
        to: new Date().toISOString().slice(0, 10),
        includeBots: String(includeBots),
      });
      setData(await apiFetch<MapResponse>(`/analytics/visitor-map?${qs}`));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [days, includeBots]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (!data) return [];
    return data.points.filter((p) => (p.identified ? showIdentified : showAnonymous));
  }, [data, showAnonymous, showIdentified]);

  // How much of the traffic in this window could be placed on the map at all. Pageviews
  // recorded before geo capture existed have no coordinates and never will.
  const coverage =
    data && data.stats.totalPageviews > 0
      ? Math.round((data.stats.locatedPageviews / data.stats.totalPageviews) * 100)
      : 0;

  return (
    <main className="flex h-full min-h-0 w-full flex-col gap-4 overflow-auto p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${roleSlug}/analytics`)}
            className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Back to Analytics"
          >
            <TbArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Visitor Map</h1>
            <p className="text-xs text-muted-foreground">
              Every located visitor — one dot per person, anonymous and identified.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              size="sm"
              variant={days === r.days ? "default" : "outline"}
              onClick={() => setDays(r.days)}
              className="h-8 px-3 text-xs"
            >
              {r.label}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={load} className="h-8 px-2.5" title="Refresh">
            <TbRefresh size={14} />
          </Button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={<TbUsers size={15} />}
          label="Anonymous visitors"
          value={data?.stats.anonymous ?? 0}
          loading={loading}
          dot="bg-blue-500"
        />
        <StatTile
          icon={<TbMailCheck size={15} />}
          label="Identified visitors"
          value={data?.stats.identified ?? 0}
          loading={loading}
          dot="bg-emerald-500"
        />
        <StatTile
          icon={<TbRobot size={15} />}
          label="Countries"
          value={data?.countries.length ?? 0}
          loading={loading}
        />
        <StatTile
          icon={<TbAlertTriangle size={15} />}
          label="Traffic with a location"
          value={`${coverage}%`}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
        {/* Map */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">
                {visible.length.toLocaleString()} visitors plotted
              </CardTitle>
              <CardDescription className="text-xs">
                Last {days} days. One dot is one visitor.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Toggle active={showAnonymous} onClick={() => setShowAnonymous((v) => !v)} dot="bg-blue-500">
                Anonymous
              </Toggle>
              <Toggle active={showIdentified} onClick={() => setShowIdentified((v) => !v)} dot="bg-emerald-500">
                Identified
              </Toggle>
              <Toggle active={includeBots} onClick={() => setIncludeBots((v) => !v)}>
                Include bots
              </Toggle>
            </div>
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <Skeleton className="aspect-2/1 w-full rounded-xl" />
            ) : (
              <VisitorsMap visitors={visible} showSummary={false} />
            )}
          </CardContent>
        </Card>

        {/* Country breakdown */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">By country</CardTitle>
            <CardDescription className="text-xs">Located visitors in this range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {loading && !data ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-7 w-full" />)
            ) : !data?.countries.length ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No located visitors yet.</p>
            ) : (
              data.countries.map((c) => {
                const pct = Math.round((c.count / data.countries[0].count) * 100);
                return (
                  <div key={c.country} className="relative overflow-hidden rounded-md px-2.5 py-1.5">
                    <div
                      className="absolute inset-y-0 left-0 bg-blue-500/10"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-foreground">{c.country}</span>
                      <span className="shrink-0 font-semibold text-muted-foreground">{c.count}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {coverage < 100 && !loading && (
        <p className="pb-2 text-xs text-muted-foreground">
          <TbAlertTriangle size={13} className="mr-1 inline" />
          {100 - coverage}% of pageviews in this range have no location. Geolocation is resolved at
          capture time, so pageviews recorded before this feature shipped cannot be placed on the map.
        </p>
      )}
    </main>
  );
}

function StatTile({
  icon,
  label,
  value,
  loading,
  dot,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  loading: boolean;
  dot?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {dot ? <span className={cn("h-2 w-2 rounded-full", dot)} /> : icon}
        {label}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      )}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:bg-muted"
      )}
    >
      {dot && <span className={cn("h-2 w-2 rounded-full", active ? dot : "bg-muted-foreground/40")} />}
      {children}
    </button>
  );
}
