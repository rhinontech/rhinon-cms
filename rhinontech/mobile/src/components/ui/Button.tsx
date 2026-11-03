import { ActivityIndicator, Pressable, View } from "react-native";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/haptics";
import { useTheme } from "@/lib/theme";
import { Text } from "./Text";

const base = "h-12 flex-row items-center justify-center gap-2 rounded-xl px-5 active:opacity-85";
const variants = {
  primary: "bg-primary",
  secondary: "bg-muted",
  outline: "border border-border bg-transparent",
  destructive: "bg-destructive/10",
  ghost: "bg-transparent",
} as const;
const labels = {
  primary: "text-primary-foreground",
  secondary: "text-foreground",
  outline: "text-foreground",
  destructive: "text-destructive",
  ghost: "text-foreground",
} as const;

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  className,
}: {
  title: string;
  onPress: () => void;
  variant?: keyof typeof variants;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}) {
  const { colors } = useTheme();
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={off}
      onPress={() => {
        tap();
        onPress();
      }}
      className={cn(base, variants[variant], off && "opacity-50", className)}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.primaryForeground : colors.foreground} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={cn("font-semibold text-[15px]", labels[variant])}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}
