import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/cn";

const variantClasses = {
  primary: "bg-cyan-300",
  secondary: "border border-rhinon-border bg-white/5",
  ghost: "bg-transparent",
  danger: "border border-rose-400/20 bg-rose-500/15",
} as const;

const textClasses = {
  primary: "text-slate-950",
  secondary: "text-rhinon-text",
  ghost: "text-rhinon-muted",
  danger: "text-rose-300",
} as const;

export function Button({
  children,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  className,
  textClassName,
  icon,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: keyof typeof variantClasses;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      disabled={disabled || loading}
      style={
        variant === "primary"
          ? {
              shadowColor: "#22D3EE",
              shadowOpacity: 0.18,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
              elevation: 8,
            }
          : undefined
      }
      className={cn(
        "min-h-14 flex-row items-center justify-center rounded-[22px] px-5",
        variantClasses[variant],
        disabled ? "opacity-50" : "",
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#020617" : "#F5F7FB"} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={cn("text-[13px] font-black uppercase tracking-[1.6px]", textClasses[variant], textClassName)}>
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
