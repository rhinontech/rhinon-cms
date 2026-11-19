import { useMemo, useRef, useState } from "react";
import { PanResponder } from "react-native";

import { View } from "@/components/rn";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";

/** The prototype's <input type="range">: a track, a filled part and a thumb you drag. */
export function Slider({ value, min = 0, max = 100, step = 1, onChange, tone = "violet", className, accessibilityLabel }: { value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void; tone?: Tone; className?: string; accessibilityLabel?: string }) {
  const [w, setW] = useState(0);
  const width = useRef(0);
  width.current = w;
  const pan = useMemo(() => {
    const at = (x: number) => {
      if (!width.current) return;
      const ratio = Math.min(1, Math.max(0, x / width.current));
      const raw = min + ratio * (max - min);
      onChange(Math.min(max, Math.max(min, Math.round(raw / step) * step)));
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => at(e.nativeEvent.locationX),
      onPanResponderMove: (e) => at(e.nativeEvent.locationX),
    });
  }, [min, max, step, onChange]);
  const pct = (Math.min(max, Math.max(min, value)) - min) / (max - min || 1);
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      className={cn("h-9 justify-center", className)}
      {...pan.panHandlers}
    >
      <View pointerEvents="none" className="h-1.5 rounded-full bg-ink/15">
        <View className={cn("h-full rounded-full", TONES[tone].dot)} style={{ width: `${pct * 100}%` }} />
      </View>
      <View pointerEvents="none" className={cn("absolute size-6 rounded-full border-2 border-paper shadow-sm", TONES[tone].dot)} style={{ left: Math.max(0, pct * (w - 24)) }} />
    </View>
  );
}
