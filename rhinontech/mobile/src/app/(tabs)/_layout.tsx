import { Tabs } from "expo-router";
import { House, Inbox, LayoutGrid, MessageCircle, SquareCheckBig, type LucideIcon } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from "react-native-reanimated";
import { Pressable, StyleSheet, Text as RNText, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/data/store";
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
/** One tab. The active pill grows and its label fades in over 300ms, like the prototype's transition-all. */
function TabItem({ label, Icon, active, fill, idle, count, glass, onPress }: { label: string; Icon: LucideIcon; active: boolean; fill: { bg: string; fg: string }; idle: string; count: number; glass: boolean; onPress: () => void }) {
  const t = useTheme();
  const p = useDerivedValue(() => withTiming(active ? 1 : 0, { duration: 300, easing: Easing.out(Easing.cubic) }), [active]);
  const pill = useAnimatedStyle(() => ({
    flexGrow: 1 + p.value * 1.1,
    backgroundColor: interpolateColor(p.value, [0, 1], [`${fill.bg}00`, fill.bg]),
  }));
  const text = useAnimatedStyle(() => ({ opacity: p.value, maxWidth: p.value * 70, marginLeft: p.value * 8 }));
  return (
    <Animated.View style={[{ flexBasis: 0, height: 48, borderRadius: 99 }, pill]}>
      <Pressable accessibilityLabel={label} onPress={onPress} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <Icon size={21} color={active ? fill.fg : idle} strokeWidth={active ? 2.4 : 2} />
        <Animated.View style={[{ overflow: "hidden" }, text]}>
          <RNText numberOfLines={1} style={{ fontFamily: t.f.monoMed, fontSize: glass ? 13 : 11, letterSpacing: glass ? 0 : 1.4, textTransform: glass ? "none" : "uppercase", color: fill.fg }}>{label}</RNText>
        </Animated.View>
      </Pressable>
      {!active && count > 0 ? (
        <View pointerEvents="none" style={{ position: "absolute", right: 6, top: 2, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: t.c.hues.coral.solid, alignItems: "center", justifyContent: "center" }}>
          <RNText style={{ fontFamily: t.f.monoMed, fontSize: 10, color: t.c.hues.coral.on }}>{count}</RNText>
        </View>
      ) : null}
    </Animated.View>
  );
}

type BarProps = { state: { index: number; routes: { key: string; name: string }[] }; navigateToTab: (routeKey: string) => void };

function TabBar({ state, navigateToTab }: BarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const glass = t.id === "admin";
  const brand = useApp((s) => s.brand);
  const mail = useApp((s) => s.threads).filter((x) => x.unread && x.folder === "inbox" && x.brand === brand).length;
  const chats = useApp((s) => s.chats).reduce((n, c) => n + c.unread, 0);
  const approvals = useApp((s) => s.approvals).length;
  const badge: Record<string, number> = { inbox: mail, chat: chats, more: approvals };
  return (
    <View
      style={{
        position: "absolute", left: 16, right: 16, bottom: insets.bottom + 10,
        flexDirection: "row", alignItems: "center", gap: 4, padding: 6, borderRadius: 99,
        backgroundColor: glass ? "rgba(255,255,255,0.97)" : t.id === "midnight" ? t.c.card : t.c.ink,
        borderWidth: glass ? StyleSheet.hairlineWidth : t.id === "brutal" ? 2 : 0,
        borderColor: t.id === "brutal" ? t.c.ink : t.c.line,
      }}
    >
      {state.routes.map((r, i) => {
        const def = TABS[r.name];
        if (!def) return null;
        const fill = def.tone === "black" ? { bg: "#000000", fg: "#ffffff" } : tone(t, def.tone);
        const idle = glass ? `${t.c.ink}94` : t.id === "midnight" ? t.c.inkSoft : `${t.c.paper}A6`;
        return (
          <TabItem key={r.key} label={def.label} Icon={def.icon} active={state.index === i} fill={fill} idle={idle} count={badge[r.name] ?? 0} glass={glass} onPress={() => navigateToTab(r.key)} />
        );
      })}
    </View>
  );
}

/** Content fades into the page colour above the bar, so rows never run hard into it. */
function Fade() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const h = insets.bottom + 140;
  return <LinearGradient pointerEvents="none" colors={[`${t.c.paper}00`, `${t.c.paper}E6`, t.c.paper]} locations={[0, 0.55, 1]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h }} />;
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <><Fade /><TabBar {...p} /></>} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="work" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
