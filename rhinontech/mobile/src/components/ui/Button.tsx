import { ActivityIndicator, View } from "react-native";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme";
import { Tappable } from "./Tappable";
import { Text } from "./Text";

const variants = {
  primary: "bg-primary",
  secondary: "bg-muted",
  outline: "border border-border bg-card",
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
    <Tappable accessibilityRole="button" disabled={off} onPress={onPress} className={cn(off && "opacity-50", className)}>
      <View className={cn("h-12 flex-row items-center justify-center gap-2 rounded-xl px-5", variants[variant])}>
        {loading ? (
          <ActivityIndicator color={variant === "primary" ? colors.primaryForeground : colors.foreground} />
        ) : (
          <>
            {icon}
            <Text className={cn("font-semibold text-[15px]", labels[variant])}>{title}</Text>
          </>
        )}
      </View>
    </Tappable>
  );
}
