import { Text, View } from "react-native";
import { cn } from "@/lib/cn";

const toneClasses = {
  cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  amber: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  rose: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  violet: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  slate: "border-rhinon-border bg-white/5 text-rhinon-muted",
} as const;

export function Badge({
  label,
  tone = "slate",
  className,
}: {
  label: string;
  tone?: keyof typeof toneClasses;
  className?: string;
}) {
  return (
    <View className={cn("rounded-full border px-3 py-1.5", toneClasses[tone], className)}>
      <Text className="text-[10px] font-black uppercase tracking-[2px]">{label}</Text>
    </View>
  );
}
