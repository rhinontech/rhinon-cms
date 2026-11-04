import { View } from "react-native";
import { cn } from "@/lib/cn";
import { Text } from "./Text";

const tones = {
  neutral: "bg-muted",
  brand: "bg-brand/10",
  success: "bg-success/10",
  warning: "bg-warning/15",
  danger: "bg-destructive/10",
} as const;
const textTones = {
  neutral: "text-muted-foreground",
  brand: "text-brand",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
} as const;

export type Tone = keyof typeof tones;

export function Badge({ label, tone = "neutral", className }: { label: string; tone?: Tone; className?: string }) {
  return (
    <View className={cn("rounded-full px-2.5 py-1", tones[tone], className)}>
      <Text numberOfLines={1} className={cn("font-medium text-[11px] leading-[14px]", textTones[tone])}>
        {label}
      </Text>
    </View>
  );
}

/** Count bubble for unread indicators. */
export function CountDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5">
      <Text className="font-semibold text-[11px] leading-[14px] text-brand-foreground">{count > 99 ? "99+" : count}</Text>
    </View>
  );
}
