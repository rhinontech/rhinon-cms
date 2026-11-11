import { useEffect, useState, type ReactNode } from "react";
import { ScrollView as RNScrollView, View as RNView } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { ChevronLeft, type LucideIcon } from "@/components/icons";
import { Portal, Pressable, Span, Text, View, useFocused, useEnv, type PressProps } from "@/components/rn";
import { go, back as goBack, isRootPath } from "@/lib/nav";
import { TONES, toneFor, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { useRouteName } from "@/lib/nav";
import { PhoneBackground } from "./shell";
import { useApp } from "@/lib/store";

/* ── Links ───────────────────────────────────────────────────────────────── */

/** A router Link whose destination is data, not a literal. */
export function AppLink({ to, params, replace, className, children, ...rest }: Omit<PressProps, "onPress"> & { to: string; params?: Record<string, string> | undefined; replace?: boolean | undefined }) {
  return (
    <Pressable className={className} {...rest} onPress={() => (replace ? go(to, params, true) : go(to, params))}>
      {children}
    </Pressable>
  );
}

/* ── Brand ───────────────────────────────────────────────────────────────── */

/** An "R" in the display face, with a coral horn-tip folded into the corner. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <View
      className="relative shrink-0 items-center justify-center overflow-hidden rounded-[var(--avatar-radius)] bg-ink font-display font-black text-paper"
      style={{ width: size, height: size }}
    >
      <Text style={{ fontSize: size * 0.84, lineHeight: size }} className="translate-y-[2%] text-center">
        R
      </Text>
      <View className="absolute right-0 top-0 bg-coral" style={{ width: size * 0.36, height: size * 0.36 }} />
    </View>
  );
}

/* ── Type ────────────────────────────────────────────────────────────────── */

export function Eyebrow({ children, tone, className }: { children: ReactNode; tone?: Tone | "muted" | undefined; className?: string | undefined }) {
  const color = !tone || tone === "muted" ? "text-ink/60" : TONES[tone].text;
  return <Text className={cn("font-mono text-[11px] font-medium uppercase tracking-[0.2em]", color, className)}>{children}</Text>;
}

const DISPLAY_SIZES = {
  hero: "text-[length:calc(76px*var(--ds))] leading-[calc(0.84+var(--dl))]",
  xl: "text-[length:max(30px,calc(46px*var(--ds)))] leading-[calc(0.9+var(--dl))]",
  lg: "text-[length:max(24px,calc(36px*var(--ds)))] leading-[calc(0.92+var(--dl))]",
  md: "text-[length:max(20px,calc(28px*var(--ds)))] leading-[calc(0.95+var(--dl))]",
  sm: "text-[length:max(16px,calc(22px*var(--ds)))] leading-none",
  num: "text-[length:calc(88px*var(--ds))] leading-[0.8]",
} as const;
export type DisplaySize = keyof typeof DISPLAY_SIZES;

export function Display({ size = "xl", className, style, children }: { size?: DisplaySize; as?: string; className?: string | undefined; style?: object | undefined; children: ReactNode }) {
  return (
    <Text className={cn("font-display font-black tracking-[-0.005em]", DISPLAY_SIZES[size], className)} style={style}>
      {children}
    </Text>
  );
}

/** "START HERE ————" — the mono label with a hairline that runs to the edge. */
export function SectionLabel({ children, right, className }: { children: ReactNode; right?: ReactNode; className?: string | undefined }) {
  return (
    <View className={cn("flex items-center gap-3", className)}>
      <Text className="whitespace-nowrap font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-ink/70">{children}</Text>
      <View className="h-px flex-1 bg-line" />
      {right}
    </View>
  );
}

/** Stagger helper: <View className="animate-rise" style={stagger(2)} /> */
export const stagger = (i: number) => ({ animationDelay: `${i * 55}ms` });

/* ── Screen chrome ───────────────────────────────────────────────────────── */

/** Scrolls under the tab bar (or the pushed-screen inset). The page background lives once, behind the navigator. */
export function Screen({ children, className, fab = false }: { children: ReactNode; className?: string | undefined; fab?: boolean }) {
  const tabs = isRootPath(useRouteName());
  useApp((s) => s.rev); // live data replaced in place somewhere: render again
  return (
    <RNView style={{ flex: 1 }}>
      <PhoneBackground />
      <RNScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="never">
        <View
          className={cn(
            "relative z-10 grow px-5 pt-[var(--inset-top)]",
            tabs ? "pb-[var(--inset-bottom)]" : "pb-[var(--inset-bottom-pushed)]",
            fab && (tabs ? "pb-[calc(var(--inset-bottom)+68px)]" : "pb-[calc(var(--inset-bottom-pushed)+68px)]"),
            className,
          )}
        >
          {children}
        </View>
      </RNScrollView>
    </RNView>
  );
}

export const iconBtn = "press size-11 shrink-0 items-center justify-center rounded-full border border-ink/12 bg-card text-ink";

export function IconButton({ icon: Icon, label, className, dot, onClick, onPress, ...rest }: Omit<PressProps, "children"> & { icon: LucideIcon; label: string; dot?: boolean | undefined; onClick?: (() => void) | undefined }) {
  return (
    <Pressable accessibilityLabel={label} className={cn(iconBtn, "relative", className)} onPress={onPress ?? (onClick ? () => onClick() : undefined)} {...rest}>
      <Icon size={20} strokeWidth={2} />
      {dot ? <View className="absolute right-2.5 top-2.5 size-2.5 rounded-full border-2 border-card bg-coral" /> : null}
    </Pressable>
  );
}

/** Back button, a small mono title and a slot for actions. For every pushed (non-tab) screen. */
export function TopBar({ title, center, right, back = true, fallback = "/" }: { title?: string; center?: ReactNode; right?: ReactNode; back?: boolean; fallback?: string }) {
  return (
    <View className="mb-6 flex items-center justify-between gap-3">
      {back ? (
        <Pressable accessibilityLabel="Back" onPress={() => goBack(fallback)} className={iconBtn}>
          <ChevronLeft size={22} strokeWidth={2.2} />
        </Pressable>
      ) : (
        <View className="size-11" />
      )}
      {center ?? (title ? <Text className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-ink/70">{title}</Text> : null)}
      <View className="min-w-11 flex-row justify-end gap-2">{right}</View>
    </View>
  );
}

/* ── Controls ────────────────────────────────────────────────────────────── */

export function Button({
  tone = "ink", size = "lg", full = true, icon: Icon, trailing: Trailing, className, children, onClick, onPress, ...rest
}: Omit<PressProps, "children"> & {
  tone?: Tone | "outline" | "ghost"; size?: "lg" | "md" | "sm"; full?: boolean; icon?: LucideIcon | undefined; trailing?: LucideIcon | undefined; children: ReactNode; onClick?: (() => void) | undefined;
}) {
  const sizes = { lg: "h-14 px-6 text-[16px]", md: "h-12 px-5 text-[15px]", sm: "h-9 px-4 text-[13px]" };
  const toneClass = tone === "outline" ? "border border-ink/20 bg-transparent text-ink" : tone === "ghost" ? "text-ink" : TONES[tone].solid;
  return (
    <Pressable
      className={cn("press inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.005em] disabled:opacity-40", sizes[size], toneClass, full && "w-full", className)}
      onPress={onPress ?? (onClick ? () => onClick() : undefined)}
      {...rest}
    >
      {Icon ? <Icon size={size === "sm" ? 16 : 19} strokeWidth={2.2} /> : null}
      <Text>{children}</Text>
      {Trailing ? <Trailing size={size === "sm" ? 16 : 19} strokeWidth={2.2} /> : null}
    </Pressable>
  );
}

export function Badge({ tone = "ink", dot = true, className, children }: { tone?: Tone; dot?: boolean; className?: string | undefined; children: ReactNode }) {
  return (
    <View className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-ink", TONES[tone].soft, className)}>
      {dot ? <View className={cn("size-1.5 rounded-full", tone === "paper" ? "bg-ink" : TONES[tone].dot)} /> : null}
      <Text className="whitespace-nowrap font-mono text-[10px] font-medium uppercase tracking-[0.14em]">{children}</Text>
    </View>
  );
}

export function Avatar({ name, size = 40, tone, online, className }: { name: string; size?: number; tone?: Tone | undefined; online?: boolean | undefined; className?: string | undefined }) {
  const env = useEnv();
  const t = TONES[tone ?? toneFor(name)];
  const initials = name.split(" ").map((p) => (p[0] ?? "").toUpperCase()).slice(0, 2).join("");
  return (
    <View className={cn("relative shrink-0 items-center justify-center font-display font-black uppercase", t.solid, className)} style={{ width: size, height: size, borderRadius: size * env.c.avatarRadius }}>
      <Text className="text-center" style={{ fontSize: size * 0.46, lineHeight: size * 0.46 }}>{initials}</Text>
      {online ? <View className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-paper bg-leaf" style={{ width: size * 0.3, height: size * 0.3 }} /> : null}
    </View>
  );
}

export function AvatarStack({ names, size = 28, max = 4, ring = "border-paper" }: { names: string[]; size?: number; max?: number; ring?: string }) {
  const env = useEnv();
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  const r = (size + 4) * env.c.avatarRadius;
  return (
    <View className="flex-row items-center">
      {shown.map((n, i) => (
        <View key={n} className={cn("border-2", ring, i > 0 && "-ml-2")} style={{ borderRadius: r }}>
          <Avatar name={n} size={size} />
        </View>
      ))}
      {extra > 0 ? (
        <View className={cn("-ml-2 items-center justify-center border-2 bg-ink", ring)} style={{ width: size + 4, height: size + 4, borderRadius: r }}>
          <Text className="font-mono text-[10px] text-paper">+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange, className }: { options: { value: T; label: string; badge?: number | undefined }[]; value: T; onChange: (v: T) => void; className?: string | undefined }) {
  const env = useEnv();
  const raised = env.id === "admin";
  return (
    <View className={cn("flex-row rounded-full bg-paper-deep p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className={cn("h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-full", active ? (raised ? "bg-white text-ink shadow-sm" : "bg-ink text-paper shadow-sm") : "text-ink/60")}
          >
            <Text className="font-mono text-[11px] font-medium uppercase tracking-[0.14em]">{o.label}</Text>
            {o.badge ? (
              <View className="rounded-full bg-coral px-1.5 py-px">
                <Text className="text-[10px] text-coral-foreground">{o.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ active, onClick, onPress, count, tone, className, children }: { active?: boolean | undefined; onClick?: (() => void) | undefined; onPress?: (() => void) | undefined; count?: number | undefined; tone?: Tone | undefined; className?: string | undefined; children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress ?? onClick}
      className={cn(
        "press inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5",
        active ? cn(tone ? TONES[tone].solid : "bg-ink text-paper", tone ? "border-transparent" : "border-ink") : "border-ink/20 bg-transparent text-ink",
        className,
      )}
    >
      <Text className="font-mono text-[11px] font-medium uppercase tracking-[0.14em]">{children}</Text>
      {count ? (
        <View className={cn("rounded-full px-1.5 py-px", active ? "bg-paper/25" : "bg-coral")}>
          <Text className={cn("text-[10px]", !active && "text-coral-foreground")}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** The big colour block. Label bottom-left, index bottom-right, one small stat on top. */
export function Tile({ tone, index, label, stat, selected, onClick, onPress, className, style }: { tone: Tone; index?: string | undefined; label: string[]; stat?: string | undefined; selected?: boolean | undefined; onClick?: (() => void) | undefined; onPress?: (() => void) | undefined; className?: string | undefined; style?: object | undefined }) {
  return (
    <Pressable
      onPress={onPress ?? onClick}
      style={style}
      className={cn("press relative min-h-[136px] justify-between gap-3 overflow-hidden rounded-3xl p-[18px] outline-[3px] outline-offset-[3px]", TONES[tone].solid, selected ? "outline outline-ink" : "outline outline-transparent", className)}
    >
      <Text className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] opacity-90">{stat}</Text>
      <View className="flex-row items-end justify-between gap-2">
        <View className="flex-shrink">
          {label.map((l) => (
            <Text key={l} className="font-display text-[length:calc(36px*var(--ds))] font-black leading-[0.86] tracking-[-0.005em]">{l}</Text>
          ))}
        </View>
        {index ? <Text className="pb-0.5 font-mono text-[13px] font-medium opacity-90">{index}</Text> : null}
      </View>
    </Pressable>
  );
}

export function ProgressBar({ value, tone = "ink", className, track = "bg-ink/10" }: { value: number; tone?: Tone; className?: string | undefined; track?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const w = useSharedValue(0);
  useEffect(() => { w.value = withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) }); }, [pct, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View className={cn("h-2 overflow-hidden rounded-full", track, className)}>
      <Animated.View style={[{ height: "100%", borderRadius: 999 }, fill]}>
        <View className={cn("h-full w-full rounded-full", TONES[tone].dot)} />
      </Animated.View>
    </View>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  const x = useSharedValue(on ? 22 : 2);
  useEffect(() => { x.value = withTiming(on ? 22 : 2, { duration: 200 }); }, [on, x]);
  const knob = useAnimatedStyle(() => ({ left: x.value }));
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="switch" onPress={() => onChange(!on)} className={cn("relative h-7 w-12 shrink-0 rounded-full", on ? "bg-leaf" : "bg-ink/20")}>
      <Animated.View style={[{ position: "absolute", top: 2, width: 24, height: 24 }, knob]}>
        <View className="h-full w-full rounded-full bg-paper shadow-sm" />
      </Animated.View>
    </Pressable>
  );
}

/* ── Forms ───────────────────────────────────────────────────────────────── */

export const inputClass = "w-full rounded-2xl border border-line bg-card px-4 py-3.5 text-[15px] text-ink placeholder:text-ink/35 focus:border-ink";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View>
      <View className="mb-1.5 flex-row items-baseline justify-between">
        <Text className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink/60">{label}</Text>
        {hint ? <Text className="font-mono text-[10px] normal-case tracking-normal text-ink/45">{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/** A round action pinned above the tab bar. Rendered into the overlay layer. */
export function Fab({ icon: Icon, label, onClick, pushed = false, tone = "ink" }: { icon: LucideIcon; label: string; onClick: () => void; pushed?: boolean; tone?: Tone }) {
  const focused = useFocused();
  const env = useEnv();
  if (!focused) return null;
  return (
    <Portal>
      <View pointerEvents="box-none" className="absolute inset-0 z-30">
        <Pressable
          accessibilityLabel={label}
          onPress={onClick}
          className={cn("press absolute right-5 z-30 size-[60px] animate-pop items-center justify-center rounded-full shadow-[0_16px_30px_-10px_oklch(0.19_0.015_65/0.6)]", TONES[tone].solid)}
          style={{ bottom: pushed ? 28 + env.bottom : 104 + env.bottom }}
        >
          <Icon size={26} strokeWidth={2.2} />
        </Pressable>
      </View>
    </Portal>
  );
}

/** A labelled value in a bordered cell. */
export function Meta({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <View className={cn("rounded-2xl border border-line/70 bg-card p-3.5", className)}>
      <Text className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink/50">{label}</Text>
      <View className="mt-1.5 text-[15px] font-semibold leading-tight">{children}</View>
    </View>
  );
}

/* ── Sheet ───────────────────────────────────────────────────────────────── */

export function Sheet({ open, onClose, eyebrow, title, children }: { open: boolean; onClose: () => void; eyebrow?: string; title?: string; children: ReactNode }) {
  const env = useEnv();
  const focused = useFocused();
  const [mounted, setMounted] = useState(open);
  const y = useSharedValue(900);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      y.value = withTiming(0, { duration: 360, easing: Easing.bezier(0.2, 0.9, 0.2, 1) });
      fade.value = withTiming(1, { duration: 220 });
      return;
    }
    y.value = withTiming(900, { duration: 220, easing: Easing.in(Easing.ease) });
    fade.value = withTiming(0, { duration: 220 });
    const id = setTimeout(() => setMounted(false), 230);
    return () => clearTimeout(id);
  }, [open, y, fade]);

  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: fade.value }));
  if (!mounted || !focused) return null;
  const admin = env.id === "admin";
  return (
    <Portal>
      <View pointerEvents="box-none" className="absolute inset-0 z-50 justify-end">
        <Animated.View style={[{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }, scrim]}>
          <Pressable accessibilityLabel="Close" onPress={onClose} className="absolute inset-0 bg-ink/60" />
        </Animated.View>
        <Animated.View style={[{ maxHeight: "90%" }, panel]}>
          <RNView
            style={{
              borderTopWidth: env.id === "brutal" ? 3 : admin ? 1 : 0,
              borderTopColor: env.id === "brutal" ? env.c.ink : "rgba(255,255,255,0.7)",
              borderTopLeftRadius: env.c.radius + 18,
              borderTopRightRadius: env.c.radius + 18,
              backgroundColor: admin ? "rgba(255,255,255,0.94)" : env.c.paper,
              overflow: "hidden",
            }}
          >
            <RNScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(32, env.bottom) }}>
              <View className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-ink/15" />
              {eyebrow ? <Eyebrow tone="muted">{eyebrow}</Eyebrow> : null}
              {title ? <Display size="lg" className="mb-5 mt-1.5">{title}</Display> : null}
              {children}
            </RNScrollView>
          </RNView>
        </Animated.View>
      </View>
    </Portal>
  );
}

/* ── States ──────────────────────────────────────────────────────────────── */

/** A small abstract composition of colour blocks, used wherever there is nothing to show. */
export function Blocks({ tone = "sun" }: { tone?: Tone }) {
  return (
    <View className="relative h-24 w-40">
      <View className={cn("absolute left-1 top-5 size-16 -rotate-[8deg] rounded-[calc(var(--radius)+6px)]", TONES[tone].dot)} />
      <View className="absolute left-[3.4rem] top-0 size-14 rounded-full bg-cobalt" />
      <View className="absolute bottom-0 left-8 h-10 w-24 rounded-full bg-ink" />
      <View className="absolute right-2 top-8 size-12 rotate-12 rounded-[calc(var(--radius)+2px)] bg-leaf" />
    </View>
  );
}

export function Empty({ title, body, action, tone = "sun" }: { title: string; body: string; action?: ReactNode; tone?: Tone }) {
  return (
    <View className="animate-rise items-center px-6 py-12">
      <Blocks tone={tone} />
      <Display size="lg" className="mt-7 text-center">{title}</Display>
      <Text className="mt-2 max-w-[270px] text-center text-[14px] leading-relaxed text-ink/60">{body}</Text>
      {action ? <View className="mt-6">{action}</View> : null}
    </View>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <View className={cn("animate-shimmer rounded-2xl bg-ink/10", className)} />;
}

export function ErrorState({ title = "Couldn't load this", body = "Check your connection and try again.", onRetry }: { title?: string; body?: string; onRetry?: () => void }) {
  return (
    <View className="animate-rise items-center px-6 py-10">
      <View className="size-20 items-center justify-center rounded-3xl bg-coral">
        <Text className="font-display text-[length:calc(54px*var(--ds))] font-black leading-none text-coral-foreground">!</Text>
      </View>
      <Display size="lg" className="mt-6 text-center">{title}</Display>
      <Text className="mt-2 max-w-[270px] text-center text-[14px] leading-relaxed text-ink/60">{body}</Text>
      {onRetry ? <Button tone="ink" size="md" full={false} className="mt-6" onPress={onRetry}>Try again</Button> : null}
    </View>
  );
}

/** Shown when a role lacks a permission. The backend refuses the request as well. */
export function NoAccess({ title, body }: { title: string; body: string }) {
  return (
    <View className="animate-rise items-center px-6 py-10">
      <View className="size-20 items-center justify-center rounded-3xl bg-ink">
        <LockGlyph />
      </View>
      <Display size="lg" className="mt-6 text-center">{title}</Display>
      <Text className="mt-2 max-w-[270px] text-center text-[14px] leading-relaxed text-ink/60">{body}</Text>
    </View>
  );
}

import Svg, { Path, Rect } from "react-native-svg";
import { useInherit } from "@/components/rn";

function LockGlyph() {
  const env = useEnv();
  const c = env.c.paper;
  void useInherit;
  return (
    <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={10.5} width={14} height={9.5} rx={2.5} stroke={c} strokeWidth={1.8} />
      <Path d="M8.5 10.5V8a3.5 3.5 0 1 1 7 0v2.5" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export { Span };
