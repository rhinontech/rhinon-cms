import { ActivityIndicator, View } from "react-native";
import { useEffect, useRef } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { AlertCircle } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme";
import { Button } from "./Button";
import { Text } from "./Text";

export function Skeleton({ className, style }: { className?: string; style?: object }) {
  const opacity = useSharedValue(0.5);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View className={cn("rounded-lg bg-muted", className)} style={[animated, style]} />;
}

/** Placeholder rows shown while a list loads. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View className="gap-5 px-5 pt-4">
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} className="flex-row items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function EmptyState({ icon, title, message }: { icon: React.ReactNode; title: string; message?: string }) {
  return (
    <View className="items-center px-10 py-16">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-muted">{icon}</View>
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      {message && (
        <Text variant="caption" className="mt-1.5 text-center text-[13px] leading-5">
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
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertCircle size={24} color={colors.destructive} />
      </View>
      <Text variant="heading" className="text-center">
        Couldn't load this
      </Text>
      <Text variant="caption" className="mt-1.5 text-center text-[13px] leading-5">
        {message}
      </Text>
      {onRetry && <Button title="Try again" variant="outline" onPress={onRetry} className="mt-5 h-10" />}
    </View>
  );
}

export function Spinner() {
  const { colors } = useTheme();
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color={colors.mutedForeground} />
    </View>
  );
}
