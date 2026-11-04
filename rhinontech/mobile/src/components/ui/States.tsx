import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { AlertCircle, type LucideIcon } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme";
import { Button } from "./Button";
import { Card } from "./Card";
import { IconTile } from "./Tile";
import { Text } from "./Text";

export function Skeleton({ className, style }: { className?: string; style?: object }) {
  const { isDark } = useTheme();
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  // The size and colour stay on a plain View: NativeWind doesn't style Animated views.
  return (
    <View className={cn("overflow-hidden rounded-lg bg-muted", className)} style={style}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)" }, animated]} />
    </View>
  );
}

/** Placeholder rows shown while a list loads. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View className="gap-2.5 px-4 pt-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} className="flex-row items-center gap-3 p-3.5">
          <Skeleton className="h-11 w-11 rounded-full" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </View>
        </Card>
      ))}
    </View>
  );
}

export function EmptyState({ icon, title, message }: { icon: LucideIcon; title: string; message?: string }) {
  return (
    <View className="items-center px-10 py-16">
      <View className="mb-5">
        <IconTile icon={icon} size={56} />
      </View>
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      {message && (
        <Text variant="caption" className="mt-1.5 text-center text-[14px] leading-5">
          {message}
        </Text>
      )}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors } = useTheme();
  return (
    <View className="items-center px-10 py-16">
      <View className="mb-5 h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertCircle size={26} color={colors.destructive} />
      </View>
      <Text variant="heading" className="text-center">
        Couldn't load this
      </Text>
      <Text variant="caption" className="mt-1.5 text-center text-[14px] leading-5">
        {message}
      </Text>
      {onRetry && <Button title="Try again" variant="outline" onPress={onRetry} className="mt-5" />}
    </View>
  );
}

export function Spinner({ color }: { color?: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={color ?? colors.mutedForeground} />
    </View>
  );
}
