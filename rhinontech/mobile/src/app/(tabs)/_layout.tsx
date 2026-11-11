import { Tabs } from "expo-router";
import { House, Inbox, LayoutGrid, MessageCircle, SquareCheckBig, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text as RNText, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tone, type Tone } from "@/ui";
import { useTheme } from "@/theme/ThemeProvider";

const TABS: Record<string, { label: string; icon: LucideIcon; tone: Tone | "black" }> = {
  index: { label: "Home", icon: House, tone: "black" },
  work: { label: "Work", icon: SquareCheckBig, tone: "cobalt" },
  inbox: { label: "Inbox", icon: Inbox, tone: "coral" },
  chat: { label: "Chat", icon: MessageCircle, tone: "sky" },
  more: { label: "More", icon: LayoutGrid, tone: "sun" },
};

/** Floating pill bar. The selected tab expands with its label; Home's pill is always black. */
type BarProps = { state: { index: number; routes: { key: string; name: string }[] }; navigateToTab: (routeKey: string) => void };

function TabBar({ state, navigateToTab }: BarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const glass = t.id === "admin";
  return (
    <View
      style={{
        position: "absolute", left: 16, right: 16, bottom: insets.bottom + 10,
        flexDirection: "row", alignItems: "center", gap: 4, padding: 6, borderRadius: 99,
        backgroundColor: glass ? "rgba(255,255,255,0.86)" : t.id === "midnight" ? t.c.card : t.c.ink,
        borderWidth: glass ? StyleSheet.hairlineWidth : t.id === "brutal" ? 2 : 0,
        borderColor: t.id === "brutal" ? t.c.ink : t.c.line,
      }}
    >
      {state.routes.map((r, i) => {
        const def = TABS[r.name];
        if (!def) return null;
        const active = state.index === i;
        const Icon = def.icon;
        const fill = def.tone === "black" ? { bg: "#000", fg: "#fff" } : tone(t, def.tone);
        const idle = glass ? `${t.c.ink}94` : t.id === "midnight" ? t.c.inkSoft : `${t.c.paper}A6`;
        return (
          <Pressable
            key={r.key}
            accessibilityLabel={def.label}
            onPress={() => navigateToTab(r.key)}
            style={{
              flex: active ? 2.1 : 1, height: 48, borderRadius: 99, flexDirection: "row",
              alignItems: "center", justifyContent: "center", gap: 8,
              backgroundColor: active ? fill.bg : "transparent",
            }}
          >
            <Icon size={21} color={active ? fill.fg : idle} strokeWidth={active ? 2.4 : 2} />
            {active ? (
              <RNText style={{ fontFamily: t.f.monoMed, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: fill.fg }}>
                {def.label}
              </RNText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="work" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
