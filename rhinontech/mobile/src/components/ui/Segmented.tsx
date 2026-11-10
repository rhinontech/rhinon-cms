import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/haptics";
import { lift, useTheme } from "@/lib/theme";
import { Text } from "./Text";

const INSET = 3;

/** The panel's `segmented` track, with its `segment-active` card on the selected option. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: LucideIcon }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segment = width ? (width - INSET * 2) / options.length : 0;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} className="flex-row rounded-xl" style={{ padding: INSET, backgroundColor: colors.track }}>
      {segment > 0 && (
        <View style={[styles.thumb, { width: segment, transform: [{ translateX: index * segment }], backgroundColor: colors.card, borderColor: colors.glassCardBorder }, lift(colors.shadow)]} />
      )}
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) tap();
              onChange(o.value);
            }}
            className="flex-1 flex-row items-center justify-center gap-1.5 py-2"
          >
            {Icon && <Icon size={15} color={active ? colors.foreground : colors.mutedForeground} />}
            <Text className={cn("font-medium text-[13px] leading-[18px]", active ? "text-foreground" : "text-muted-foreground")}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Horizontally scrolling filter chips. Sit them inside a 20px page gutter. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 grow-0" contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) tap();
              onChange(o.value);
            }}
            className="rounded-full px-3.5 py-1.5"
            style={{ backgroundColor: active ? colors.selected : colors.track }}
          >
            <Text className={cn("font-medium text-[13px] leading-[18px]", active ? "text-brand" : "text-muted-foreground")}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  thumb: { position: "absolute", top: INSET, bottom: INSET, left: INSET, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth },
});
