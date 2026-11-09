import { Pressable, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { tap } from "@/lib/haptics";

/**
 * Pressable that gives under the finger. The className sizes the touch target;
 * the scale animates a plain inner view, because NativeWind doesn't style Animated views.
 */
export function Tappable({
  className,
  onPress,
  children,
  scale = 0.97,
  ...props
}: Omit<PressableProps, "children" | "onPress"> & { className?: string; onPress: () => void; children: React.ReactNode; scale?: number }) {
  const current = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: current.value }] }));
  return (
    <Pressable
      {...props}
      className={className}
      onPressIn={() => {
        current.value = withTiming(scale, { duration: 90 });
      }}
      onPressOut={() => {
        current.value = withTiming(1, { duration: 90 });
      }}
      onPress={() => {
        tap();
        onPress();
      }}
    >
      <Animated.View style={[{ flexGrow: 1 }, animated]}>{children}</Animated.View>
    </Pressable>
  );
}
