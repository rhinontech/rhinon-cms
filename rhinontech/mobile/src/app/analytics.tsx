import { useRev } from "@/lib/store";
import { View, Text, Span } from "@/components/rn";
import { useState } from "react";
import { BrandChip, BrandPickSheet } from "@/components/rhinon/brand";
import { AreaChart, BarRow, VisitorMap } from "@/components/rhinon/charts";
import { Display, Eyebrow, NoAccess, Screen, SectionLabel, Segmented, TopBar, stagger } from "@/components/rhinon/ui";
import { BRANDS } from "@/lib/mock-data";
import { ANALYTICS, statsOf, VISITORS } from "@/lib/mock-more";
import { useApp, usePerm } from "@/lib/store";
const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
export default function AnalyticsPage() {
  useRev();
  const brand = useApp(s => s.brand);
  const allowed = usePerm("analytics");
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [picking, setPicking] = useState(false);
  if (!allowed) {
    return <Screen>
        <TopBar title="Analytics" fallback="/more" />
        <NoAccess title="No Analytics access" body="Traffic analytics are limited to admins. Ask an admin to grant analytics:read." />
      </Screen>;
  }
  const stats = statsOf(brand);
  const series = range === "7d" ? stats.series7 : stats.series30;
  const half = Math.floor(series.length / 2);
  const now = series.slice(half).reduce((a, b) => a + b, 0);
  const before = series.slice(0, half).reduce((a, b) => a + b, 0);
  const delta = before ? Math.round((now - before) / before * 100) : 0;
  const name = BRANDS.find(b => b.id === brand)?.name ?? "";
  return <Screen>
      <TopBar title="Analytics" fallback="/more" right={<BrandChip onClick={() => setPicking(true)} />} />
      <View className="animate-rise">
        <Eyebrow tone="violet">
          {name} · last {range === "7d" ? "7" : "30"} days
        </Eyebrow>
        <Display size="hero" className="mt-3">
          Who's
          {"\n"}
          visiting?
        </Display>
        <View className="mt-4 inline-flex items-center gap-2 rounded-full bg-leaf/15 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em]">
          <View className="relative flex size-2.5">
            <View className="absolute inset-0 animate-ping-soft rounded-full bg-leaf" />
            <View className="relative size-2.5 rounded-full bg-leaf" />
          </View>
          {stats.now} on the site now
        </View>
      </View>

      <View className="mt-6 grid grid-cols-2 gap-2.5">
        {[["Visitors", fmt(stats.visitors), "bg-violet text-violet-foreground"], ["Page views", fmt(stats.views), "bg-sun text-sun-foreground"], ["Avg time", stats.avgTime, "bg-sky text-sky-foreground"], ["Bounce", `${stats.bounce}%`, "bg-rose text-rose-foreground"]].map(([label, value, cls], i) => <View key={label} className={`animate-rise rounded-3xl p-4 ${cls}`} style={stagger(i)}>
            <Text className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] opacity-85">
              {label}
            </Text>
            <Text className="mt-6 font-display text-[length:calc(48px*var(--ds))] leading-[0.85]">
              {value}
            </Text>
          </View>)}
      </View>

      <View className="mt-3 rounded-3xl border border-line/70 bg-card p-5">
        <View className="mb-3 flex items-center justify-between gap-3">
          <Text className="font-display text-[length:calc(30px*var(--ds))] leading-none">
            Visitors
            <Span className={delta >= 0 ? "ml-2.5 text-[0.55em] text-leaf-deep" : "ml-2.5 text-[0.55em] text-coral-deep"}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
            </Span>
          </Text>
          <Segmented className="w-[132px]" value={range} onChange={setRange} options={[{
          value: "7d",
          label: "7d"
        }, {
          value: "30d",
          label: "30d"
        }]} />
        </View>
        <AreaChart data={series} tone="violet" />
      </View>

      <View className="mt-3 rounded-3xl border border-line/70 bg-card p-5">
        <SectionLabel className="mb-4">Where they come from</SectionLabel>
        <View className="space-y-4">
          {stats.sources.map((s, i) => <BarRow key={s.name} label={s.name} pct={s.pct} tone={(["violet", "sun", "sky", "rose"] as const)[i % 4] ?? "violet"} />)}
        </View>
      </View>

      <View className="mt-3 rounded-3xl border border-line/70 bg-card p-5">
        <SectionLabel className="mb-3">Top pages</SectionLabel>
        <View className="divide-y divide-line/70">
          {stats.pages.map(p => <View key={p.path} className="flex items-center justify-between gap-3 py-3">
              <Span className="truncate font-mono text-[13px]">{p.path}</Span>
              <View className="shrink-0 font-display text-[length:calc(22px*var(--ds))] leading-none">
                {fmt(p.views)}
              </View>
            </View>)}
        </View>
      </View>

      <View className="mt-3 rounded-3xl border border-line/70 bg-card p-5">
        <SectionLabel className="mb-4">Countries</SectionLabel>
        <View className="space-y-4">
          {stats.places.map(p => <BarRow key={p.name} label={p.name} pct={p.pct} tone="cobalt" />)}
        </View>
      </View>

      <Text className="mb-3 mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/60">
        Live now
      </Text>
      <VisitorMap points={VISITORS.map(v => ({
      id: v.id,
      x: v.x,
      y: v.y,
      label: v.place
    }))} />
      <Text className="mt-4 text-center text-[13px] text-ink/50">
        Read-only. Setup and detailed reports stay on the web.
      </Text>

      <BrandPickSheet open={picking} onClose={() => setPicking(false)} />
    </Screen>;
}