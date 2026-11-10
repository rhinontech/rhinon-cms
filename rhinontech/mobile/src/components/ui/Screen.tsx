import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { tap } from "@/lib/haptics";
import { Backdrop } from "./Backdrop";
import { Text } from "./Text";

/** A quiet round icon button for headers. */
export function HeaderButton({ icon: Icon, onPress, label, color, fill }: { icon: LucideIcon; onPress: () => void; label: string; color?: string; fill?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        tap();
        onPress();
      }}
      className="h-9 w-9 items-center justify-center rounded-full active:opacity-60"
      style={{ backgroundColor: colors.track }}
    >
      <Icon size={18} color={color ?? colors.foreground} fill={fill ?? "transparent"} />
    </Pressable>
  );
}

export function BackButton() {
  return <HeaderButton icon={ChevronLeft} label="Back" onPress={() => router.back()} />;
}

/** The panel's `glass-header`: frosted, with a hairline below. Runs under the status bar. */
export function GlassHeader({
  title,
  subtitle,
  right,
  left,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  return (
    <View style={{ backgroundColor: colors.glassHeader, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.glassCardBorder }}>
      {Platform.OS === "ios" && <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />}
      <View className="px-5 pb-3" style={{ paddingTop: insets.top + 8 }}>
        {(title || subtitle || right || left) && (
          <View className="flex-row items-center gap-3">
            {left}
            <View className="flex-1">
              {subtitle && (
                <Text numberOfLines={1} variant="caption" className="text-[13px] leading-[18px]">
                  {subtitle}
                </Text>
              )}
              {title && (
                <Text numberOfLines={1} variant={left ? "heading" : "largeTitle"}>
                  {title}
                </Text>
              )}
            </View>
            {right}
          </View>
        )}
        {children}
      </View>
    </View>
  );
}

/** A screen's scrolling body under a fixed header, with pull-to-refresh and room for the tab bar. */
export function ScrollScreen({
  children,
  refreshing = false,
  onRefresh,
  header,
  detail,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  header?: React.ReactNode;
  /** A pushed screen: no floating tab bar to clear. */
  detail?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View className="flex-1 bg-background">
      <Backdrop />
      {header}
      <ScrollView
        contentContainerStyle={{ paddingBottom: detail ? 48 : 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mutedForeground} /> : undefined}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View className="mb-3 mt-7 flex-row items-center justify-between px-5">
      <Text className="font-semibold text-[16px] leading-[22px]">{title}</Text>
      {action}
    </View>
  );
}

/** The composer tray at the bottom of chat and email screens. */
export function ComposerTray({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  return (
    <View className="px-3 pt-2.5" style={{ paddingBottom: Math.max(insets.bottom, 10), backgroundColor: colors.glassHeader, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.glassCardBorder }}>
      {Platform.OS === "ios" && <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />}
      {children}
    </View>
  );
}
