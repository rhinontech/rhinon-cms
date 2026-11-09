import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { Platform, Pressable, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutDashboard, Inbox, MessagesSquare, KanbanSquare, Menu, type LucideIcon } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { tap } from "@/lib/haptics";
import { CountDot, Text } from "@/components/ui";

const ICONS: Record<string, LucideIcon> = {
  index: LayoutDashboard,
  work: KanbanSquare,
  inbox: Inbox,
  chat: MessagesSquare,
  more: Menu,
};

function TabPill({ icon: Icon, focused, count }: { icon: LucideIcon; focused: boolean; count?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pill, focused && { backgroundColor: colors.selected }]}>
      <Icon size={20} color={focused ? colors.brand : colors.mutedForeground} strokeWidth={focused ? 2.2 : 1.8} />
      {!!count && (
        <View style={styles.badge}>
          <CountDot count={count} />
        </View>
      )}
    </View>
  );
}

/** Floating, frosted tab bar in the panel's glass, with its brand mark on the active tab. */
function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { can } = useAuth();
  const inboxCounts = useApi<{ unread: number }>("/inbox/counts", { enabled: can("inbox:read"), pollMs: 60_000 });
  const chatUnread = useApi<{ total: number }>("/team-chat/unread", { enabled: can("chat:read"), pollMs: 30_000 });
  const counts: Record<string, number | undefined> = { inbox: inboxCounts.data?.unread, chat: chatUnread.data?.total };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.shadow, { shadowOpacity: isDark ? 0.55 : 0.14 }]}>
        <View style={[styles.bar, { borderColor: colors.glassEdge }]}>
          {/* Real blur on iOS; elsewhere blur is unreliable, so a near-opaque fill keeps content from showing through. */}
          {Platform.OS === "ios" ? (
            <>
              <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassPanel }]} />
            </>
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, opacity: 0.97 }]} />
          )}
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            // Tabs the user can't open are hidden via href: null, which the router turns into `hidden`.
            if ((options as { hidden?: boolean }).hidden) return null;
            const focused = state.index === index;
            const Icon = ICONS[route.name] ?? LayoutDashboard;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                onPress={() => {
                  const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) {
                    tap();
                    navigateToTab(route.key);
                  }
                }}
                style={styles.item}
              >
                <TabPill icon={Icon} focused={focused} count={counts[route.name]} />
                <Text style={{ color: focused ? colors.foreground : colors.mutedForeground, fontSize: 10.5, lineHeight: 14, fontFamily: focused ? "Geist_600SemiBold" : "Geist_500Medium" }}>
                  {options.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { can } = useAuth();
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="work" options={{ title: "Work", href: can("work:read") ? undefined : null }} />
      <Tabs.Screen name="inbox" options={{ title: "Inbox", href: can("inbox:read") ? undefined : null }} />
      <Tabs.Screen name="chat" options={{ title: "Chat", href: can("chat:read") ? undefined : null }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 14, right: 14, alignItems: "center" },
  shadow: { width: "100%", maxWidth: 520, borderRadius: 30, shadowColor: "#1E2230", shadowRadius: 26, shadowOffset: { width: 0, height: 12 } },
  bar: { flexDirection: "row", borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", paddingVertical: 8, paddingHorizontal: 5 },
  item: { flex: 1, alignItems: "center", gap: 3 },
  pill: { width: 50, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
    badge: { position: "absolute", top: -5, right: -2 },
});
