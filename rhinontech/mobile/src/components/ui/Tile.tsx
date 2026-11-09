import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme";
import { Card } from "./Card";
import { Text } from "./Text";

const tones = { brand: "bg-brand/10", success: "bg-success/10", neutral: "bg-muted" } as const;

/** An icon on a small tinted square. */
export function IconTile({ icon: Icon, tone = "brand", size = 40 }: { icon: LucideIcon; tone?: keyof typeof tones; size?: number }) {
  const { colors } = useTheme();
  const color = tone === "brand" ? colors.brand : tone === "success" ? colors.success : colors.mutedForeground;
  return (
    <View className={cn("items-center justify-center", tones[tone])} style={{ width: size, height: size, borderRadius: size * 0.28 }}>
      <Icon size={size * 0.5} color={color} strokeWidth={1.9} />
    </View>
  );
}

/** One headline number on a glass card. */
export function StatTile({ icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <Card className="flex-1 p-4">
      <IconTile icon={icon} size={36} />
      <Text numberOfLines={1} adjustsFontSizeToFit className="mt-4 font-bold text-[26px] leading-8 tracking-tight">
        {value}
      </Text>
      <Text numberOfLines={1} variant="caption" className="mt-0.5 text-[13px] leading-[18px]">
        {label}
      </Text>
      {hint && (
        <Text numberOfLines={1} variant="caption" className="mt-0.5">
          {hint}
        </Text>
      )}
    </Card>
  );
}
