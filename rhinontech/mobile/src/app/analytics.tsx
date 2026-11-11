import { useState } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { BRANDS } from "@/data/mock-data";
import { ANALYTICS } from "@/data/mock-more";
import { actions, useApp, usePerm } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { Card, Chip, Display, Eyebrow, NoAccess, ProgressBar, Screen, SectionLabel, Segmented, Text, Tile, TopBar } from "@/ui";

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 300, h = 110, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 8 - ((v - min) / Math.max(1, max - min)) * (h - 16)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"><Path d={d} stroke={color} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" /></Svg>;
}

export default function Analytics() {
  const t = useTheme();
  const allowed = usePerm("analytics");
  const brand = useApp((s) => s.brand);
  const [range, setRange] = useState<"7d" | "30d">("7d");
  if (!allowed) return <Screen><TopBar fallback="/more" /><NoAccess area="Analytics" /></Screen>;
  const a = ANALYTICS[brand];
  return (
    <Screen>
      <TopBar title="Traffic" fallback="/more" />
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>{BRANDS.map((b) => <Chip key={b.id} name={b.tone} active={brand === b.id} onPress={() => actions.setBrand(b.id)}>{b.name}</Chip>)}</View>
      <Display style={{ marginTop: 18 }}>{"Who's\nvisiting?"}</Display>
      <Eyebrow style={{ marginTop: 10 }}>{a.now} on the site now</Eyebrow>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
        <Tile name="violet" label={`${(a.visitors / 1000).toFixed(1)}k`} stat="Visitors" />
        <Tile name="sun" label={`${(a.views / 1000).toFixed(1)}k`} stat="Page views" />
        <Tile name="sky" label={a.avgTime} stat="Avg time" />
        <Tile name="rose" label={`${a.bounce}%`} stat="Bounce" />
      </View>
      <View style={{ marginTop: 20 }}><Segmented value={range} onChange={setRange} options={[{ value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }]} /></View>
      <Card style={{ marginTop: 14 }}><Spark data={range === "7d" ? a.series7 : a.series30} color={t.c.hues.violet.solid} /></Card>
      <SectionLabel>Where they come from</SectionLabel>
      <Card style={{ gap: 12 }}>{a.sources.map((s) => <View key={s.name}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}><Text>{s.name}</Text><Text bold>{s.pct}%</Text></View><ProgressBar value={s.pct / 100} color={t.c.hues.violet.solid} track={t.c.paperDeep} /></View>)}</Card>
      <SectionLabel>Top pages</SectionLabel>
      <Card style={{ gap: 10 }}>{a.pages.map((p) => <View key={p.path} style={{ flexDirection: "row", justifyContent: "space-between" }}><Text>{p.path}</Text><Text bold>{p.views}</Text></View>)}</Card>
    </Screen>
  );
}
