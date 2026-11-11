import { BlurView } from "expo-blur";
import { router, usePathname } from "expo-router";
import { View as RNView } from "react-native";
import Animated, { Easing, interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { House, Inbox, LayoutGrid, MessageCircle, SquareCheckBig, WifiOff, type LucideIcon } from "@/components/icons";
import { Pressable, Text, View, useEnv } from "@/components/rn";
import { withAlpha, parseColor, convertOklchIn, toCss } from "@/lib/color";
import { isRootPath } from "@/lib/nav";
import { useApp, usePerm } from "@/lib/store";
import { TONES, type Tone } from "@/lib/tone";
import { colorOf } from "@/lib/tw";
import { cn } from "@/lib/utils";

/* ── Page background: paper + the theme's soft colour glows (--phone-bg) ──── */

const oklch = (s: string) => toCss(parseColor(convertOklchIn(s))!);

export function PhoneBackground() {
  const env = useEnv();
  const { width: W, height: H } = env;
  const glows: { cx: number; cy: number; rx: number; ry: number; color: string; stop: number }[] =
    env.id === "admin"
      ? [
          { cx: W * 0.06, cy: H * -0.04, rx: 430, ry: 330, color: oklch("oklch(0.86 0.075 268 / 0.55)"), stop: 0.62 },
          { cx: W * 1.08, cy: H * 0.04, rx: 410, ry: 330, color: oklch("oklch(0.9 0.055 218 / 0.45)"), stop: 0.58 },
          { cx: W * 0.46, cy: H * 1.1, rx: 470, ry: 430, color: oklch("oklch(0.92 0.045 305 / 0.38)"), stop: 0.62 },
        ]
      : env.id === "midnight"
        ? [{ cx: W * 0.5, cy: H * -0.04, rx: W * 0.9, ry: H * 0.42, color: oklch("oklch(0.34 0.11 285 / 0.6)"), stop: 0.72 }]
        : [];
  return (
    <RNView pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: env.c.paper }}>
      {glows.length ? (
        <Svg width="100%" height="100%">
          <Defs>
            {glows.map((g, i) => (
              <RadialGradient key={i} id={`g${i}`} cx={g.cx} cy={g.cy} rx={g.rx} ry={g.ry} fx={g.cx} fy={g.cy} gradientUnits="userSpaceOnUse">
                <Stop offset={0} stopColor={g.color} />
                <Stop offset={g.stop} stopColor={withAlpha(g.color, 0)} />
              </RadialGradient>
            ))}
          </Defs>
          {glows.map((g, i) => <Rect key={i} x={0} y={0} width="100%" height="100%" fill={`url(#g${i})`} />)}
        </Svg>
      ) : null}
    </RNView>
  );
}

/* ── Tab bar ─────────────────────────────────────────────────────────────── */

const TABS: { to: string; name: string; label: string; icon: LucideIcon; tone: Tone }[] = [
  { to: "/", name: "index", label: "Home", icon: House, tone: "paper" },
  { to: "/work", name: "work", label: "Work", icon: SquareCheckBig, tone: "cobalt" },
  { to: "/inbox", name: "inbox", label: "Inbox", icon: Inbox, tone: "coral" },
  { to: "/chat", name: "chat", label: "Chat", icon: MessageCircle, tone: "sky" },
  { to: "/more", name: "more", label: "More", icon: LayoutGrid, tone: "sun" },
];

function TabItem({ tab, active, count }: { tab: (typeof TABS)[number]; active: boolean; count: number }) {
  const env = useEnv();
  const home = tab.to === "/";
  const glass = env.id === "admin";
  const solid = home ? "#000000" : colorOf(tab.tone === "paper" ? "ink" : tab.tone, env)!;
  const on = home ? "#ffffff" : colorOf(tab.tone === "paper" ? "paper" : `${tab.tone}-foreground`, env)!;
  const idle = glass ? "rgba(27,33,48,0.58)" : withAlpha(env.c.paper, 0.65);
  const p = useDerivedValue(() => withTiming(active ? 1 : 0, { duration: 300, easing: Easing.out(Easing.cubic) }), [active]);
  const pill = useAnimatedStyle(() => ({
    flexGrow: 1 + p.value * 1.1,
    backgroundColor: interpolateColor(p.value, [0, 1], [withAlpha(solid, 0).replace(/^rgba\((\d+),(\d+),(\d+),0\)$/, "rgba($1,$2,$3,0)"), solid]),
  }));
  const label = useAnimatedStyle(() => ({ opacity: p.value, maxWidth: p.value * 80, marginLeft: p.value * 8 }));
  const Icon = tab.icon;
  const color = active ? on : idle;
  return (
    <Animated.View
      style={[
        { flexBasis: 0, height: 48, borderRadius: 999 },
        active && home ? { borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" } : null,
        active && glass ? { boxShadow: "0 1px 2px rgba(27,33,48,0.1), inset 0 0 0 1px rgba(27,33,48,0.08)" } : null,
        pill,
      ] as never}
    >
      <Pressable accessibilityLabel={tab.label} onPress={() => router.navigate(tab.to as never)} className="h-12 flex-row items-center justify-center overflow-hidden rounded-full">
        <Icon size={21} strokeWidth={active ? 2.4 : 2} color={color} />
        <Animated.View style={[{ overflow: "hidden" }, label]}>
          <Text numberOfLines={1} style={{ color }} className="font-mono text-[11px] font-medium uppercase tracking-[0.14em]">{tab.label}</Text>
        </Animated.View>
      </Pressable>
      {!active && count > 0 ? (
        <View pointerEvents="none" className="absolute right-1.5 top-1 min-w-[17px] items-center justify-center rounded-full bg-coral px-1">
          <Text className="font-mono text-[10px] font-medium leading-[17px] text-coral-foreground">{count}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

export function TabBar() {
  const env = useEnv();
  const path = usePathname();
  const threads = useApp((s) => s.threads);
  const brand = useApp((s) => s.brand);
  const chats = useApp((s) => s.chats);
  const approvals = useApp((s) => s.approvals);
  const canApprove = usePerm("approvals");
  const glass = env.id === "admin";
  const badge: Record<string, number> = {
    "/inbox": threads.filter((t) => t.unread && t.folder === "inbox" && t.brand === brand).length,
    "/chat": chats.reduce((n, c) => n + c.unread, 0),
    "/more": canApprove ? approvals.length : 0,
  };
  const bar = (
    <>
      {TABS.map((tab) => {
        const active = tab.to === "/" ? path === "/" : path === tab.to || path.startsWith(`${tab.to}/`);
        return <TabItem key={tab.to} tab={tab} active={active} count={badge[tab.to] ?? 0} />;
      })}
    </>
  );
  const shadow = glass
    ? "0 1px 2px rgba(27,33,48,0.04), 0 14px 32px -12px rgba(27,33,48,0.22), inset 0 1px 0 0 rgba(255,255,255,0.8)"
    : "0 18px 40px -12px rgba(24,18,12,0.7)";
  return (
    <View pointerEvents="box-none" className="absolute inset-0 z-20">
      <View pointerEvents="none" className="absolute inset-x-0 bottom-0 z-20 h-[132px] bg-gradient-to-t from-paper from-35% via-paper/80 to-transparent" />
      <RNView
        accessibilityLabel="Primary"
        style={{
          position: "absolute", left: 16, right: 16, bottom: env.bottom + 10, zIndex: 30,
          flexDirection: "row", alignItems: "center", gap: 4, padding: 6, borderRadius: 999, overflow: "hidden",
          backgroundColor: glass ? "rgba(255,255,255,0.74)" : env.c.ink,
          borderWidth: glass ? 1 : 0, borderColor: "rgba(255,255,255,0.7)",
          boxShadow: shadow,
        } as never}
      >
        {glass ? <BlurView intensity={70} tint="light" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} /> : null}
        {bar}
      </RNView>
    </View>
  );
}

/** Rendered once by the root layout; hides itself on pushed screens. */
export function TabBarGate() {
  const path = usePathname();
  return isRootPath(path) ? <TabBar /> : null;
}

/* ── Offline banner + toasts ─────────────────────────────────────────────── */

export function OfflineBar() {
  const offline = useApp((s) => s.offline);
  const queued = useApp((s) => s.queued);
  if (!offline) return null;
  return (
    <View className="absolute inset-x-5 top-[calc(var(--status)-14px)] z-[45] h-10 animate-toast flex-row items-center gap-2.5 rounded-full bg-ink pl-3.5 pr-4 text-[13px] font-medium text-paper shadow-[0_12px_30px_-10px_oklch(0_0_0/0.5)]">
      <WifiOff size={16} className="shrink-0 text-on-ink-accent" />
      <Text numberOfLines={1} className="shrink">
        {queued > 0 ? `Offline · ${queued} ${queued === 1 ? "change" : "changes"} waiting` : "Offline · changes will sync later"}
      </Text>
    </View>
  );
}

export function ToastLayer() {
  const toasts = useApp((s) => s.toasts);
  return (
    <View pointerEvents="none" className="absolute inset-x-0 top-[calc(var(--inset-top)-6px)] z-[60] items-center gap-2 px-5">
      {toasts.map((t) => (
        <View key={t.id} className="animate-toast flex-row items-center gap-2.5 rounded-full bg-ink py-2.5 pl-3.5 pr-5 shadow-[0_12px_30px_-10px_oklch(0_0_0/0.6)]">
          <View className={cn("size-2.5 rounded-full", t.tone === "ink" ? "bg-paper" : TONES[t.tone].dot)} />
          <Text className="text-[14px] font-medium text-paper">{t.text}</Text>
        </View>
      ))}
    </View>
  );
}
