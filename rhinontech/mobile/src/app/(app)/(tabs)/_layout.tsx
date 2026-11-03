import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { Platform, Pressable, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutDashboard, Inbox, MessagesSquare, Briefcase, Settings, type LucideIcon } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { tap } from "@/lib/haptics";
import { Text } from "@/components/ui";

const ICONS: Record<string, LucideIcon> = {
  index: LayoutDashboard,
  inbox: Inbox,
  chat: MessagesSquare,
  crm: Briefcase,
  settings: Settings,
};

/** Floating, frosted tab bar — the app's signature surface. */
function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, { borderColor: colors.border, shadowOpacity: isDark ? 0.4 : 0.1 }]}>
        {/* Real blur on iOS; elsewhere blur is unreliable, so a near-opaque fill keeps content from showing through. */}
        {Platform.OS === "ios" ? (
          <BlurView intensity={70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, opacity: 0.97 }]} />
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          // Tabs the user can't open are hidden via href: null, which the router turns into `hidden`.
          if ((options as { hidden?: boolean }).hidden) return null;
          const focused = state.index === index;
          const Icon = ICONS[route.name] ?? LayoutDashboard;
          const color = focused ? colors.foreground : colors.mutedForeground;
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
              <View
                style={[styles.pill, focused && { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,17,23,0.06)" }]}
              >
                <Icon size={21} color={color} strokeWidth={focused ? 2.2 : 1.8} />
              </View>
              <Text style={{ color, fontSize: 10.5, fontFamily: focused ? "Geist_600SemiBold" : "Geist_500Medium" }}>
                {options.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { can } = useAuth();
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="inbox" options={{ title: "Inbox", href: can("inbox:read") ? undefined : null }} />
      <Tabs.Screen name="chat" options={{ title: "Chat", href: can("chat:read") ? undefined : null }} />
      <Tabs.Screen name="crm" options={{ title: "CRM", href: can("crm:read", "outreach:read") ? undefined : null }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, alignItems: "center" },
  bar: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 520,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  item: { flex: 1, alignItems: "center", gap: 2 },
  pill: { width: 52, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
});
