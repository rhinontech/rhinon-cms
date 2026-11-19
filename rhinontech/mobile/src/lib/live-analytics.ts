import { api } from "./api";
import { defineLive, replace } from "./live-core";
import { ANALYTICS, VISITORS, type BrandStats, type LiveVisitor } from "./mock-more";
import { getState } from "./store";

type Overview = { current: { pageviews: number; visitors: number; sessions: number } };
type Series = { series: { date: string; pageviews: number; visitors: number }[] };
type Sources = { channels: { channel?: string; name?: string; visitors?: number; sessions?: number; count?: number }[] };
type Pages = { pages: { path?: string; url?: string; pageviews?: number; views?: number }[] };
type Live = { visitors: { id?: string; city?: string | null; country?: string | null; path?: string | null; source?: string | null; startedAt?: string | null; x?: number; y?: number }[] };

const empty = (): BrandStats => ({ visitors: 0, views: 0, avgTime: "—", bounce: 0, now: 0, series7: [], series30: [], sources: [], pages: [], places: [] });

async function syncAnalytics() {
  const brand = getState().brand;
  const [o, s30, src, top, live] = await Promise.all([
    api<Overview>("/analytics/overview").catch(() => null),
    api<Series>("/analytics/timeseries").catch(() => null),
    api<Sources>("/analytics/sources").catch(() => null),
    api<Pages>("/analytics/top-pages").catch(() => null),
    api<Live>("/analytics/visitors").catch(() => null),
  ]);
  const series = (s30?.series ?? []).map((d) => d.visitors);
  const channels = (src?.channels ?? []).map((c) => ({ name: c.channel ?? c.name ?? "Direct", n: c.visitors ?? c.sessions ?? c.count ?? 0 }));
  const total = channels.reduce((n, c) => n + c.n, 0) || 1;
  ANALYTICS[brand] = {
    ...empty(),
    visitors: o?.current.visitors ?? 0, views: o?.current.pageviews ?? 0, now: live?.visitors.length ?? 0,
    series30: series, series7: series.slice(-7),
    sources: channels.map((c) => ({ name: c.name, pct: Math.round((c.n / total) * 100) })),
    pages: (top?.pages ?? []).slice(0, 5).map((p) => ({ path: p.path ?? p.url ?? "/", views: p.pageviews ?? p.views ?? 0 })),
  };
  const dots: LiveVisitor[] = (live?.visitors ?? []).slice(0, 12).map((v, i) => ({
    id: v.id ?? `v${i}`, name: v.city ? `Visitor from ${v.city}` : "Visitor", place: v.city ?? v.country ?? "", page: v.path ?? "/", source: v.source ?? "Direct", since: v.startedAt ? "now" : "", x: v.x ?? 12 + ((i * 37) % 76), y: v.y ?? 18 + ((i * 29) % 64),
  }));
  replace(VISITORS, dots);
}

defineLive({
  name: "analytics",
  sync: syncAnalytics,
  blank: () => { for (const k of Object.keys(ANALYTICS)) ANALYTICS[k] = empty(); replace(VISITORS, []); },
});
