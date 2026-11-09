import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";
import { lift, useTheme } from "@/lib/theme";
import { Tappable } from "./Tappable";

/** The panel's `glass-card`: translucent over the backdrop, with a hairline edge. */
export function Card({ className, style, ...props }: ViewProps & { className?: string }) {
  const { colors } = useTheme();
  return (
    <View
      className={cn("rounded-2xl", className)}
      style={[{ backgroundColor: colors.glassCard, borderWidth: 1, borderColor: colors.glassCardBorder }, lift(colors.shadow), style]}
      {...props}
    />
  );
}

export function PressableCard({
  className,
  onPress,
  children,
}: {
  className?: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tappable className={className} onPress={onPress} scale={0.98}>
      <Card>{children}</Card>
    </Tappable>
  );
}
