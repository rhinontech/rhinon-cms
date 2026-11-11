import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text as RNText, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme, type Theme } from "@/theme/ThemeProvider";
import type { Hue } from "@/theme/tokens";

export type Tone = Hue | "ink" | "paper";

/** One place that turns a tone into fill / foreground / text-on-paper colours for the active theme. */
export function tone(t: Theme, name: Tone): { bg: string; fg: string; text: string } {
  if (name === "ink") return { bg: t.c.ink, fg: t.c.paper, text: t.c.ink };
  if (name === "paper") return { bg: t.c.card, fg: t.c.ink, text: t.c.ink };
  const h = t.c.hues[name];
  return { bg: h.solid, fg: h.on, text: h.deep };
}

export function Text({ style, bold, ...p }: React.ComponentProps<typeof RNText> & { bold?: boolean }) {
  const t = useTheme();
  return <RNText {...p} style={[{ color: t.c.ink, fontFamily: bold ? t.f.sansBold : t.f.sans, fontSize: 15 }, style]} />;
}

export function Eyebrow({ children, color, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return (
    <RNText style={[{ fontFamily: t.f.mono, fontSize: t.id === "admin" ? 12.5 : 11, letterSpacing: t.id === "admin" ? 0 : 1.4, textTransform: t.id === "admin" ? "none" : "uppercase", color: color ?? `${t.c.ink}99` }, style]}>
      {children}
    </RNText>
  );
}

const DISPLAY = { hero: 76, xl: 56, lg: 38, md: 26 } as const;

/** Big headline. Size scales by the theme's own factor so a condensed face and a grotesque both fit the screen. */
export function Display({ children, size = "hero", style, color }: { children: ReactNode; size?: keyof typeof DISPLAY; style?: StyleProp<TextStyle>; color?: string }) {
  const t = useTheme();
  const px = DISPLAY[size] * t.c.ds;
  return (
    <RNText
      style={[{ fontFamily: t.f.display, fontSize: px, lineHeight: px * (0.84 + t.c.dl), letterSpacing: t.c.tracking * px, color: color ?? t.c.ink }, style]}
    >
      {children}
    </RNText>
  );
}

export function Screen({ children, scroll = true, style }: { children: ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 120 };
  return (
    <View style={{ flex: 1, backgroundColor: t.c.paper }}>
      {t.id === "admin" || t.id === "midnight" ? (
        <LinearGradient pointerEvents="none" colors={t.id === "admin" ? ["#dfe4fb", "#e4f0f8", "rgba(243,244,248,0)"] : ["rgba(76,50,160,0.55)", "rgba(76,50,160,0)"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 320 }} />
      ) : null}
      {scroll ? (
        <ScrollView contentContainerStyle={[pad, style as object]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, style]}>{children}</View>
      )}
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 28, marginBottom: 14 }}>
      <Eyebrow>{children}</Eyebrow>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: t.c.line }} />
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: t.c.card,
    borderRadius: t.c.radius + 14,
    borderWidth: t.id === "brutal" ? 2 : StyleSheet.hairlineWidth,
    borderColor: t.id === "brutal" ? t.c.ink : t.c.line,
    padding: 16,
    ...(t.id === "brutal" ? { shadowColor: t.c.ink, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 } : null),
  };
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.85 }, style]}>
      {children}
    </Pressable>
  ) : (
    <View style={[base, style]}>{children}</View>
  );
}

/** A colour block: the app's signature surface. */
export function Tile({ name, label, stat, badge, wide, onPress }: { name: Tone; label: string; stat: string; badge?: number; wide?: boolean; onPress?: () => void }) {
  const t = useTheme();
  const c = tone(t, name);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexBasis: wide ? "100%" : "48%",
        flexGrow: 1,
        minHeight: 128,
        justifyContent: "space-between",
        padding: 16,
        borderRadius: t.c.radius + 14,
        backgroundColor: c.bg,
        borderWidth: t.id === "brutal" ? 2 : 0,
        borderColor: t.c.ink,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <Eyebrow color={c.fg}>{stat}</Eyebrow>
        {badge ? (
          <View style={{ minWidth: 24, paddingHorizontal: 6, borderRadius: 99, backgroundColor: t.c.paper, alignItems: "center", justifyContent: "center" }}>
            <RNText style={{ fontFamily: t.f.monoMed, fontSize: 11, color: t.c.ink }}>{badge}</RNText>
          </View>
        ) : null}
      </View>
      <Display size="md" color={c.fg} style={{ marginTop: 18 }}>
        {label}
      </Display>
    </Pressable>
  );
}

export function Button({ children, onPress, tone: name = "ink", icon: Icon, disabled }: { children: ReactNode; onPress?: () => void; tone?: Tone; icon?: LucideIcon; disabled?: boolean }) {
  const t = useTheme();
  const c = tone(t, name);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 99,
        backgroundColor: c.bg,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        borderWidth: t.id === "brutal" ? 2 : 0,
        borderColor: t.c.ink,
      })}
    >
      {Icon ? <Icon size={20} color={c.fg} /> : null}
      <RNText style={{ fontFamily: t.f.sansBold, fontSize: 16, color: c.fg }}>{children}</RNText>
    </Pressable>
  );
}

export function Avatar({ name, size = 44, hue = "violet" }: { name: string; size?: number; hue?: Hue }) {
  const t = useTheme();
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const h = t.c.hues[hue];
  return (
    <View style={{ width: size, height: size, borderRadius: size * t.c.avatarRadius, backgroundColor: h.solid, alignItems: "center", justifyContent: "center" }}>
      <RNText style={{ fontFamily: t.f.sansBold, fontSize: size * 0.36, color: h.on }}>{initials}</RNText>
    </View>
  );
}

export function toneOfPerson(name: string): Hue {
  const h = [...name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const all: Hue[] = ["coral", "cobalt", "leaf", "violet", "sun", "rose", "sky"];
  return all[h % all.length]!;
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", padding: 4, borderRadius: 99, backgroundColor: t.c.paperDeep }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={{ flex: 1, height: 40, borderRadius: 99, alignItems: "center", justifyContent: "center", backgroundColor: on ? (t.id === "midnight" ? t.c.card : t.id === "admin" ? "#fff" : t.c.ink) : "transparent" }}>
            <RNText style={{ fontFamily: t.f.sansBold, fontSize: 14, color: on ? (t.id === "midnight" || t.id === "admin" ? t.c.ink : t.c.paper) : `${t.c.ink}99` }}>{o.label}</RNText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ children, active, onPress, count, name = "ink" }: { children: ReactNode; active?: boolean; onPress?: () => void; count?: number; name?: Tone }) {
  const t = useTheme();
  const c = tone(t, name);
  return (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 38, paddingHorizontal: 16, borderRadius: 99, backgroundColor: active ? c.bg : "transparent", borderWidth: active ? 0 : t.id === "brutal" ? 2 : 1, borderColor: t.id === "brutal" ? t.c.ink : t.c.line }}>
      <RNText style={{ fontFamily: t.f.monoMed, fontSize: 11, letterSpacing: t.id === "admin" ? 0 : 1.2, textTransform: t.id === "admin" ? "none" : "uppercase", color: active ? c.fg : t.c.ink }}>{children}</RNText>
      {count ? <RNText style={{ fontFamily: t.f.monoMed, fontSize: 11, color: active ? c.fg : `${t.c.ink}80` }}>{count}</RNText> : null}
    </Pressable>
  );
}

export function ProgressBar({ value, color, track, height = 8 }: { value: number; color: string; track: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: 99, backgroundColor: track, overflow: "hidden" }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: "100%", borderRadius: 99, backgroundColor: color }} />
    </View>
  );
}

export function AvatarStack({ names, size = 28, max = 3 }: { names: string[]; size?: number; max?: number }) {
  const t = useTheme();
  const shown = names.slice(0, max);
  return (
    <View style={{ flexDirection: "row" }}>
      {shown.map((n, i) => (
        <View key={n} style={{ marginLeft: i ? -size * 0.3 : 0, borderRadius: size, borderWidth: 2, borderColor: t.c.paper }}>
          <Avatar name={n} size={size} hue={toneOfPerson(n)} />
        </View>
      ))}
      {names.length > max ? <Text style={{ marginLeft: 6, fontSize: 12, alignSelf: "center" }}>+{names.length - max}</Text> : null}
    </View>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 48, gap: 6 }}>
      <Display size="md">{title}</Display>
      <Text style={{ opacity: 0.6, textAlign: "center", maxWidth: 260 }}>{body}</Text>
    </View>
  );
}

export function Badge({ children, name = "ink" }: { children: ReactNode; name?: Tone }) {
  const t = useTheme();
  const c = tone(t, name);
  return (
    <View style={{ paddingHorizontal: 10, height: 22, borderRadius: 99, backgroundColor: name === "ink" ? t.c.paperDeep : `${c.bg}33`, justifyContent: "center" }}>
      <RNText style={{ fontFamily: t.f.monoMed, fontSize: 10.5, letterSpacing: t.id === "admin" ? 0 : 1, textTransform: t.id === "admin" ? "none" : "uppercase", color: name === "ink" ? t.c.ink : c.text }}>{children}</RNText>
    </View>
  );
}

/* ── Navigation + overlays ─────────────────────────────────────────────── */
import { ArrowLeft, Plus } from "lucide-react-native";
import { KeyboardAvoidingView, Modal, Platform, TextInput, type TextInputProps } from "react-native";

import { useApp } from "@/data/store";
import { back } from "@/lib/nav";

/** Header for pushed screens: round back button, centred title, optional right slot. */
export function TopBar({ title, fallback = "/", right }: { title?: string; fallback?: string; right?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18, minHeight: 44 }}>
      <Pressable onPress={() => back(fallback)} accessibilityLabel="Back" style={{ width: 44, height: 44, borderRadius: 22, borderWidth: t.id === "brutal" ? 2 : 1, borderColor: t.id === "brutal" ? t.c.ink : t.c.line, backgroundColor: t.c.card, alignItems: "center", justifyContent: "center" }}>
        <ArrowLeft size={20} color={t.c.ink} />
      </Pressable>
      {title ? <Eyebrow>{title}</Eyebrow> : null}
      <View style={{ minWidth: 44, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable onPress={onClose} style={{ ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.45)" }} />
        <View style={{ maxHeight: "88%", backgroundColor: t.c.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36, borderWidth: t.id === "brutal" ? 2 : 0, borderColor: t.c.ink }}>
          <View style={{ alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: t.c.line, marginBottom: 14 }} />
          {title ? <Display size="md" style={{ marginBottom: 14 }}>{title}</Display> : null}
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Field({ label, style, ...p }: TextInputProps & { label?: string }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Eyebrow style={{ marginBottom: 6 }}>{label}</Eyebrow> : null}
      <TextInput
        placeholderTextColor={`${t.c.ink}66`}
        {...p}
        style={[{ minHeight: 52, borderRadius: t.c.radius + 4, paddingHorizontal: 16, paddingVertical: 12, fontFamily: t.f.sans, fontSize: 16, color: t.c.ink, backgroundColor: t.c.card, borderWidth: t.id === "brutal" ? 2 : 1, borderColor: t.id === "brutal" ? t.c.ink : t.c.line }, p.multiline ? { minHeight: 96, textAlignVertical: "top" } : null, style]}
      />
    </View>
  );
}

export function Fab({ onPress, label = "Add" }: { onPress: () => void; label?: string }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={{ position: "absolute", right: 20, bottom: insets.bottom + 92, width: 58, height: 58, borderRadius: 29, backgroundColor: t.c.ink, alignItems: "center", justifyContent: "center", borderWidth: t.id === "brutal" ? 2 : 0, borderColor: t.c.ink }}>
      <Plus size={26} color={t.c.paper} />
    </Pressable>
  );
}

/** A tappable list row: title, subtitle, optional trailing text. */
export function Row({ title, sub, right, left, onPress }: { title: string; sub?: string; right?: ReactNode; left?: ReactNode; onPress?: () => void }) {
  return (
    <Card onPress={onPress as () => void} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }}>
      {left}
      <View style={{ flex: 1 }}>
        <Text bold style={{ fontSize: 16 }}>{title}</Text>
        {sub ? <Text style={{ fontSize: 13, opacity: 0.55, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      {right}
    </Card>
  );
}

/** Mounted once at the root: shows store toasts for a couple of seconds. */
export function ToastLayer() {
  const t = useTheme();
  const toasts = useApp((s) => s.toasts);
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 16, right: 16, top: insets.top + 8, gap: 8 }}>
      {toasts.map((x) => (
        <View key={x.id} style={{ padding: 14, borderRadius: 18, backgroundColor: t.c.ink }}>
          <RNText style={{ fontFamily: t.f.sansBold, fontSize: 14, color: t.c.paper }}>{x.text}</RNText>
        </View>
      ))}
    </View>
  );
}

export function NoAccess({ area }: { area: string }) {
  return <Empty title="No access" body={`Your role can't open ${area}. Ask a super admin to change it in Settings → Roles.`} />;
}
