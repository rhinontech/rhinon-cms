import { useId, useState } from "react";
import Svg, { Circle, Defs, LinearGradient, Path, Pattern, Rect, Stop } from "react-native-svg";

import { Span, View, useEnv } from "@/components/rn";
import { TONES, type Tone } from "@/lib/tone";
import { tw } from "@/lib/tw";
import { cn } from "@/lib/utils";

/** A smooth area chart. The line and fill take the tone's text colour, so themes recolour it. */
export function AreaChart({ data, tone = "cobalt", height = 132 }: { data: number[]; tone?: Tone; height?: number }) {
  const env = useEnv();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [w, setW] = useState(0);
  const color = tw(TONES[tone].text, env).inherit.color ?? env.c.ink;
  // The prototype draws in a 300x100 box stretched to fit with a non-scaling stroke; draw in real pixels instead.
  const gw = 300, gh = 100;
  const max = Math.max(...data, 1);
  const min = Math.min(...data) * 0.85;
  const sx = w / gw, sy = height / gh;
  const pts = data.map((v, i) => [(i / Math.max(data.length - 1, 1)) * gw * sx, (gh - ((v - min) / (max - min || 1)) * (gh - 10) - 4) * sy] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${height} L0 ${height} Z`;
  const last = pts[pts.length - 1];
  return (
    <View className="w-full" style={{ height }} onLayout={(e) => setW(e.nativeEvent.layout.width)} accessibilityLabel="Trend">
      {w > 0 ? (
        <Svg width={w} height={height} style={{ overflow: "visible" }}>
          <Defs>
            <LinearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.32} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill={`url(#${id})`} />
          <Path d={line} fill="none" stroke={color} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
          {last ? <Circle cx={last[0]} cy={last[1]} r={3.4} fill={color} /> : null}
        </Svg>
      ) : null}
    </View>
  );
}

/** A labelled horizontal bar. */
export function BarRow({ label, value, pct, tone = "cobalt" }: { label: string; value?: string; pct: number; tone?: Tone }) {
  return (
    <View>
      <View className="mb-1.5 flex items-baseline justify-between gap-3 text-[14px]">
        <Span className="shrink truncate font-medium">{label}</Span>
        <Span className="shrink-0 font-mono text-[11px] text-ink/55">{value ?? `${pct}%`}</Span>
      </View>
      <View className="h-2.5 overflow-hidden rounded-full bg-ink/10">
        <View className={cn("h-full origin-left animate-grow rounded-full", TONES[tone].dot)} style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
      </View>
    </View>
  );
}

/** Live visitors as pulsing dots on a dotted field. A sketch of a map, not a real one. */
export function VisitorMap({ points }: { points: { id: string; x: number; y: number; label: string }[] }) {
  const env = useEnv();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <View className="relative h-44 overflow-hidden rounded-3xl border border-line/70 bg-card" accessibilityLabel="Where visitors are right now">
      <Svg pointerEvents="none" width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
        <Defs>
          <Pattern id={id} patternUnits="userSpaceOnUse" width={14} height={14}>
            <Circle cx={7} cy={7} r={1.3} fill={env.c.ink} fillOpacity={0.22} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {points.map((p, i) => (
        <View key={p.id} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <View className="absolute -inset-1.5 animate-ping-soft rounded-full bg-coral/50" style={{ animationDelay: `${i * 260}ms` }} />
          <View className="relative size-2.5 rounded-full bg-coral" />
        </View>
      ))}
    </View>
  );
}
