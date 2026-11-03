import { RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { Text } from "./Text";

/** Large-title header used at the top of each tab, iOS Settings style. */
export function LargeHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-background px-5 pb-3" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-end justify-between">
        <View className="flex-1">
          {subtitle && <Text variant="caption" className="mb-0.5 text-[13px]">{subtitle}</Text>}
          <Text variant="largeTitle">{title}</Text>
        </View>
        {right}
      </View>
    </View>
  );
}

/** Scrollable tab body with pull-to-refresh and room for the floating tab bar. */
export function ScrollScreen({
  children,
  refreshing = false,
  onRefresh,
  header,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  header?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mutedForeground} /> : undefined}
      >
        {header}
        {children}
      </ScrollView>
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View className="mb-3 mt-7 flex-row items-center justify-between px-5">
      <Text variant="overline">{title}</Text>
      {action}
    </View>
  );
}
