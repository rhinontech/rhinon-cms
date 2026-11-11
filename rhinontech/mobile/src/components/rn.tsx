/**
 * React Native primitives that take the prototype's `className`. They add what the web gives for free:
 * text styles that inherit down the tree, bare text inside boxes, inline runs, CSS grid rows,
 * divide-y, gradients, entrance animations and `pointer-events` inheritance.
 */
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useFocusEffect } from "expo-router";
import {
  Children, Fragment, cloneElement, createContext, forwardRef, isValidElement, useCallback, useContext, useEffect,
  useId, useMemo, useState, useSyncExternalStore, type ReactElement, type ReactNode,
} from "react";
import {
  Pressable as RNPressable, ScrollView as RNScrollView, StyleSheet, Text as RNText, TextInput as RNTextInput,
  View as RNView, useWindowDimensions,
  type PressableProps, type ScrollViewProps, type TextInputProps, type TextProps, type ViewProps,
} from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { withAlpha } from "@/lib/color";
import { navigate } from "@/lib/router";
import { tw, type Gradient, type Inherit, type Meta, type TwEnv } from "@/lib/tw";
import { fontName } from "@/theme/fonts";
import { useTheme } from "@/theme/ThemeProvider";

/* ── Environment + inherited text style ──────────────────────────────────── */

const EnvCtx = createContext<TwEnv | null>(null);
const InheritCtx = createContext<Inherit>({});
const InTextCtx = createContext(false);
/** Direction of the nearest flex container. CSS protects column children from shrinking below their content (min-height: auto); React Native does not, so columns default to no shrink. */
type Mode = "row" | "column" | "block";
const DirCtx = createContext<Mode>("block");
const isRow = (s: Record<string, any>) => s.flexDirection === "row" || s.flexDirection === "row-reverse";
/** A flex container lays its children out as flex items; a plain div is a block, where inline-level children shrink to fit. */
const modeOf = (s: Record<string, any>, meta: Meta): Mode => (isRow(s) ? "row" : meta.flex || s.flexDirection ? "column" : "block");
/** Default flex sizing for a child: rows shrink, columns and blocks do not; inline children of a block hug their content. */
const baseFor = (mode: Mode, meta: Meta, style: Record<string, any>) =>
  mode === "row" ? BASE_ROW : meta.inline && mode === "block" && style.alignSelf === undefined ? BASE_INLINE : BASE_COL;

export function TwProvider({ children }: { children: ReactNode }) {
  const t = useTheme();
  const ins = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const env = useMemo<TwEnv>(
    () => ({ id: t.id, c: t.c, top: ins.top, bottom: ins.bottom, width, height, key: `${t.id}|${ins.top}|${ins.bottom}|${width}x${height}` }),
    [t.id, t.c, ins.top, ins.bottom, width, height],
  );
  const root = useMemo<Inherit>(() => ({ color: t.c.ink, family: "sans", weight: 400, size: 16, leadMul: 1.5 }), [t.c.ink]);
  return (
    <EnvCtx.Provider value={env}>
      <InheritCtx.Provider value={root}>{children}</InheritCtx.Provider>
    </EnvCtx.Provider>
  );
}

export function useEnv(): TwEnv {
  const e = useContext(EnvCtx);
  if (!e) throw new Error("useEnv outside TwProvider");
  return e;
}
export const useInherit = () => useContext(InheritCtx);

const hasKeys = (o: object) => { for (const _ in o) return true; return false; };
const mergeCache = new WeakMap<Inherit, WeakMap<Inherit, Inherit>>();

function mergeInherit(parent: Inherit, own: Inherit): Inherit {
  let inner = mergeCache.get(parent);
  const hit = inner?.get(own);
  if (hit) return hit;
  const out: Inherit = { ...parent };
  for (const k in own) {
    const v = (own as Record<string, unknown>)[k];
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  if (own.sizeEm !== undefined) { out.size = (parent.size ?? 16) * own.sizeEm; delete out.sizeEm; }
  if (!inner) { inner = new WeakMap(); mergeCache.set(parent, inner); }
  inner.set(own, out);
  return out;
}

export function textStyle(h: Inherit, env: TwEnv) {
  const size = h.size ?? 16;
  const s: Record<string, any> = {
    color: h.color ?? env.c.ink,
    fontSize: size,
    fontFamily: fontName(env.id, h.family ?? "sans", h.weight ?? 400),
  };
  if (h.leadPx !== undefined) s.lineHeight = h.leadPx;
  else if (h.leadMul !== undefined) s.lineHeight = +(h.leadMul * size).toFixed(2);
  if (h.trackEm) s.letterSpacing = +(h.trackEm * size).toFixed(3);
  if (h.transform && h.transform !== "none") s.textTransform = h.transform;
  if (h.align) s.textAlign = h.align;
  if (h.italic) s.fontStyle = "italic";
  if (h.underline || h.strike) s.textDecorationLine = h.underline && h.strike ? "underline line-through" : h.underline ? "underline" : "line-through";
  if (h.tabular) s.fontVariant = ["tabular-nums"];
  return s;
}

/* ── Children: bare text, inline runs, grid, divide ──────────────────────── */

function flatten(children: ReactNode, prefix = ""): ReactNode[] {
  const out: ReactNode[] = [];
  for (const c of Children.toArray(children)) {
    if (isValidElement(c) && c.type === Fragment) {
      out.push(...flatten((c.props as { children?: ReactNode }).children, `${prefix}${c.key ?? ""}/`));
    } else if (isValidElement(c) && prefix) {
      out.push(cloneElement(c, { key: `${prefix}${c.key ?? ""}` }));
    } else out.push(c);
  }
  return out;
}

const isText = (k: ReactNode) => typeof k === "string" || typeof k === "number";

function groupInline(kids: ReactNode[], flex: boolean): ReactNode[] {
  if (!kids.some((k) => isText(k) || (isValidElement(k) && k.type === Span))) return kids;
  const out: ReactNode[] = [];
  let run: ReactNode[] = [];
  const flush = () => {
    if (!run.length) return;
    const textual = run.some(isText);
    const blank = run.every((r) => typeof r === "string" && !r.trim());
    if (blank) { run = []; return; }
    // A lone span in a block still sits on a line box sized by the parent's strut; in a flex container it is a plain item.
    if (!textual && run.length === 1 && flex) out.push(run[0]);
    else out.push(<Text key={`run${out.length}`}>{run}</Text>);
    run = [];
  };
  for (const k of kids) {
    // In a flex container every text run and every element is its own flex item (so `gap` applies between them);
    // in a block they flow together as one paragraph.
    if (isText(k) || (!flex && isValidElement(k) && k.type === Span)) run.push(k);
    else { flush(); out.push(k); }
  }
  flush();
  return out;
}

function renderGrid(kids: ReactNode[], cols: { t: string; n?: number }[], gap: number, env: TwEnv): ReactNode[] {
  const rows: { kid: ReactNode; span: number; from: number }[][] = [[]];
  let used = 0;
  for (const kid of kids) {
    const cls = isValidElement(kid) ? (kid.props as { className?: string }).className : undefined;
    const span = Math.min(cols.length, tw(cls, env).meta.colSpan ?? 1);
    if (used + span > cols.length) { rows.push([]); used = 0; }
    rows[rows.length - 1]!.push({ kid, span, from: used });
    used += span;
  }
  const allFr = cols.every((c) => c.t === "fr");
  return rows.map((row, ri) => {
    const cells = row.map(({ kid, span, from }, ci) => {
      const spanned = cols.slice(from, from + span);
      const px = spanned.length === 1 && spanned[0]!.t === "px";
      const auto = spanned.length === 1 && spanned[0]!.t === "auto";
      const fr = spanned.reduce((n, c) => n + (c.t === "fr" ? c.n ?? 1 : 0), 0);
      const style = px ? { width: spanned[0]!.n } : auto ? { flexShrink: 0 } : { flexGrow: fr || 1, flexShrink: 1, flexBasis: 0, minWidth: 0 };
      return <RNView key={`c${ci}`} style={style}>{kid}</RNView>;
    });
    const filled = row.reduce((n, r) => n + r.span, 0);
    if (allFr) for (let i = filled; i < cols.length; i++) cells.push(<RNView key={`p${i}`} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }} />);
    return <RNView key={`r${ri}`} style={{ flexDirection: "row", columnGap: gap, alignItems: "stretch" }}>{cells}</RNView>;
  });
}

function divide(kids: ReactNode[], d: NonNullable<Meta["divide"]>): ReactNode[] {
  return kids.map((k, i) =>
    i === 0 ? k : (
      <RNView key={isValidElement(k) && k.key ? k.key : `d${i}`} style={d.axis === "y" ? { borderTopWidth: d.w, borderColor: d.color } : { borderLeftWidth: d.w, borderColor: d.color }}>{k}</RNView>
    ),
  );
}

function prepare(children: ReactNode, meta: Meta, style: Record<string, any>, env: TwEnv): ReactNode {
  if (children === undefined || children === null || typeof children === "boolean") return null;
  let kids = flatten(children);
  if (meta.grid) return renderGrid(kids, meta.grid.cols, Number(style.columnGap ?? style.gap ?? 0), env);
  kids = groupInline(kids, !!meta.flex);
  if (meta.divide) kids = divide(kids, meta.divide);
  return kids;
}

/* ── Animation ───────────────────────────────────────────────────────────── */

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
/** Timing only (read on the JS thread). The per-frame maths is inline in the worklet below: a worklet may not call plain JS functions. */
const ENTER: Record<string, { ms: number; easing: any }> = {
  rise: { ms: 500, easing: ease },
  screen: { ms: 340, easing: ease },
  pop: { ms: 360, easing: Easing.bezier(0.2, 1.5, 0.4, 1) },
  "fade-in": { ms: 220, easing: Easing.out(Easing.ease) },
  toast: { ms: 420, easing: Easing.bezier(0.2, 1.2, 0.3, 1) },
  grow: { ms: 900, easing: ease },
};

/** One-shot entrance. Plain shared values rather than layout animations: those take the element out of flow on web. */
function Enter({ kind, delay, style, children, ...rest }: { kind: string; delay: number; style: any; children?: ReactNode } & ViewProps) {
  const spec = ENTER[kind]!;
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withTiming(1, { duration: spec.ms, easing: spec.easing }));
    return () => cancelAnimation(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const a = useAnimatedStyle(() => {
    const t = v.value;
    const o = Math.min(1, Math.max(0, t));
    const o2 = Math.min(1, Math.max(0, t * 1.6));
    switch (kind) {
      case "rise": return { opacity: o, transform: [{ translateY: (1 - t) * 14 }] };
      case "screen": return { opacity: o, transform: [{ translateY: (1 - t) * 10 }] };
      case "pop": return { opacity: o2, transform: [{ scale: 0.85 + 0.15 * t }] };
      case "fade-in": return { opacity: o };
      case "toast": return { opacity: o2, transform: [{ translateY: (1 - t) * -16 }, { scale: 0.96 + 0.04 * t }] };
      default: return { transform: [{ scaleX: o }] };
    }
  });
  return <Animated.View {...rest} style={[style, a]}>{children}</Animated.View>;
}
const LOOPS = new Set(["spin", "shimmer", "pulse", "ping-soft", "scan"]);

function Loop({ kind, delay = 0, style, children, ...rest }: { kind: string; delay?: number; style: any; children?: ReactNode } & ViewProps) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = 0;
    const mirror = kind === "shimmer" || kind === "pulse" || kind === "scan";
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: kind === "spin" ? 1000 : kind === "ping-soft" ? 2200 : mirror ? 750 : 1000, easing: kind === "spin" ? Easing.linear : Easing.inOut(Easing.ease) }), -1, mirror));
    return () => cancelAnimation(v);
  }, [kind, v, delay]);
  const a = useAnimatedStyle(() => {
    switch (kind) {
      case "spin": return { transform: [{ rotate: `${v.value * 360}deg` }] };
      case "shimmer": return { opacity: 0.55 + 0.45 * v.value };
      case "scan": return { top: `${6 + v.value * 82}%` } as never;
      case "pulse": return { opacity: 1 - 0.5 * v.value };
      default: return { opacity: 0.55 * (1 - v.value), transform: [{ scale: 1 + 1.4 * v.value }] };
    }
  });
  return <Animated.View {...rest} style={[style, a]}>{children}</Animated.View>;
}

/* ── Gradient ────────────────────────────────────────────────────────────── */

const DIRS: Record<string, [[number, number], [number, number]]> = {
  t: [[0.5, 1], [0.5, 0]], b: [[0.5, 0], [0.5, 1]], l: [[1, 0.5], [0, 0.5]], r: [[0, 0.5], [1, 0.5]],
  tr: [[0, 1], [1, 0]], tl: [[1, 1], [0, 0]], br: [[0, 0], [1, 1]], bl: [[1, 0], [0, 1]],
};

function gradientProps(g: Gradient) {
  const n = g.stops.length;
  // "transparent" is black at 0 alpha; interpolating toward it greys the fade, so fade the neighbour's own colour.
  const colors = g.stops.map((s, i) => {
    if (s.color !== "transparent") return s.color;
    const nb = g.stops[i === 0 ? 1 : i - 1]?.color ?? "#000000";
    return withAlpha(nb === "transparent" ? "#000000" : nb, 0);
  });
  let last = 0;
  const locations = g.stops.map((s, i) => { const p = Math.max(last, s.pos ?? (n === 1 ? 0 : i / (n - 1))); last = p; return p; });
  const [start, end] = DIRS[g.dir] ?? DIRS.b!;
  return { colors: colors as [string, string, ...string[]], locations: locations as [number, number, ...number[]], start: { x: start[0], y: start[1] }, end: { x: end[0], y: end[1] } };
}

/* ── View ────────────────────────────────────────────────────────────────── */

const SCROLL_INNER = /^(padding|gap|rowGap|columnGap|alignItems|justifyContent|flexDirection|flexWrap|alignContent)/;
function splitScroll(style: Record<string, any>, axis: "x" | "y") {
  const outer: Record<string, any> = {}, inner: Record<string, any> = axis === "x" ? { flexDirection: "row" } : {};
  for (const k in style) (SCROLL_INNER.test(k) ? inner : outer)[k] = style[k];
  if (axis === "x") { inner.flexDirection = style.flexDirection ?? "row"; outer.flexGrow = outer.flexGrow ?? 0; }
  return { outer, inner };
}

function peOf(h: Inherit, ownPe: Inherit["pe"]): "none" | "box-none" | undefined {
  const pe = ownPe ?? h.pe;
  return pe === "none" ? "box-none" : undefined;
}

export type BoxProps = { className?: string | undefined; children?: ReactNode };

export const View = forwardRef<any, ViewProps & BoxProps>(function View({ className, style, children, ...rest }, ref) {
  const env = useEnv();
  const parent = useContext(InheritCtx);
  const p = tw(className, env);
  const own = hasKeys(p.inherit);
  const h = own ? mergeInherit(parent, p.inherit) : parent;
  const dir = useContext(DirCtx);
  const myDir: Mode = p.meta.scroll === "x" ? "row" : modeOf(p.style, p.meta);
  const flat = StyleSheet.flatten(style) as Record<string, any> | undefined;
  const delay = flat?.animationDelay !== undefined ? parseFloat(String(flat.animationDelay)) || 0 : 0;
  const userStyle = flat && flat.animationDelay !== undefined ? { ...flat, animationDelay: undefined } : style;
  const base = baseFor(dir, p.meta, p.style);
  const merged = [base, p.style, userStyle];
  const pe = peOf(h, p.inherit.pe);
  let body = prepare(children, p.meta, p.style, env);
  if (own) body = <InheritCtx.Provider value={h}>{body}</InheritCtx.Provider>;
  if (myDir !== dir) body = <DirCtx.Provider value={myDir}>{body}</DirCtx.Provider>;
  const common = { ...rest, ...(pe ? { pointerEvents: pe } : null) } as ViewProps;
  const meta = p.meta;

  if (meta.scroll) {
    const { outer, inner } = splitScroll(p.style, meta.scroll);
    return (
      <RNScrollView horizontal={meta.scroll === "x"} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} style={[base, outer, userStyle]} contentContainerStyle={inner} keyboardShouldPersistTaps="handled" {...(pe ? { pointerEvents: pe } : null)}>
        {body}
      </RNScrollView>
    );
  }
  if (meta.anim && ENTER[meta.anim]) {
    return <Enter kind={meta.anim} delay={delay} style={merged} {...common}>{body}</Enter>;
  }
  if (meta.anim && LOOPS.has(meta.anim)) return <Loop kind={meta.anim} delay={delay} style={merged} {...common}>{body}</Loop>;
  if (meta.gradient) {
    return <LinearGradient {...gradientProps(meta.gradient)} {...common} style={merged}>{body}</LinearGradient>;
  }
  if (meta.blur) {
    return <BlurView intensity={Math.min(100, meta.blur * 6)} tint={env.id === "midnight" ? "dark" : "light"} {...common} style={merged}>{body}</BlurView>;
  }
  const el = <RNView ref={ref} {...common} style={merged}>{body}</RNView>;
  // An inline-level box in a block sits on a line box at least as tall as the parent's strut (its line-height).
  if (meta.inline && dir === "block") {
    const strut = Math.round((parent.leadMul ?? 1.5) * (parent.size ?? 16) + 1.5);
    return <RNView style={{ minHeight: strut, flexShrink: 0, alignItems: "flex-start" }}>{el}</RNView>;
  }
  return el;
});

const BASE_ROW = { flexShrink: 1 } as const;
const BASE_COL = { flexShrink: 0 } as const;
const BASE_INLINE = { flexShrink: 0, alignSelf: "flex-start" } as const;

/* ── Text ────────────────────────────────────────────────────────────────── */

function TextImpl({ className, style, children, ...rest }: TextProps & BoxProps) {
  const env = useEnv();
  const parent = useContext(InheritCtx);
  const inText = useContext(InTextCtx);
  const dir = useContext(DirCtx);
  const p = tw(className, env);
  const own = hasKeys(p.inherit);
  const h = own ? mergeInherit(parent, p.inherit) : parent;
  const ts = textStyle(h, env);
  const box = p.style;

  // React Native clips glyphs to the line box and the web does not; tight display leading needs room.
  let room: Record<string, number> | undefined;
  if (!inText && ts.lineHeight && ts.lineHeight < ts.fontSize * 1.08) {
    const r = Math.ceil(ts.fontSize * 0.16);
    const n = (v: unknown) => (typeof v === "number" ? v : 0);
    room = {
      paddingTop: n(box.paddingTop ?? box.paddingVertical ?? box.padding) + r,
      paddingBottom: n(box.paddingBottom ?? box.paddingVertical ?? box.padding) + r,
      marginTop: n(box.marginTop ?? box.marginVertical ?? box.margin) - r,
      marginBottom: n(box.marginBottom ?? box.marginVertical ?? box.margin) - r,
    };
  }
  const lines = h.lines;
  const kids = inText ? children : <InTextCtx.Provider value>{children}</InTextCtx.Provider>;
  return (
    <RNText
      {...rest}
      numberOfLines={lines}
      ellipsizeMode={h.ellipsis ? "tail" : "clip"}
      {...(h.pe === "none" ? { pointerEvents: "none" as const } : null)}
      style={[dir === "row" ? BASE_ROW : BASE_COL, { includeFontPadding: false }, box, ts, room, style]}
    >
      {own ? <InheritCtx.Provider value={h}>{kids}</InheritCtx.Provider> : kids}
    </RNText>
  );
}

/** Block text: p, h1–h6. */
export function Text(props: TextProps & BoxProps) { return <TextImpl {...props} />; }
/** Inline text: span, b, em. Adjacent spans and bare strings flow together as one paragraph. */
export function Span(props: TextProps & BoxProps) { return <TextImpl {...props} />; }

/* ── Pressable + Link ────────────────────────────────────────────────────── */

export type PressProps = Omit<PressableProps, "children" | "style"> & BoxProps & { style?: any };

export const Pressable = forwardRef<any, PressProps>(function Pressable({ className, style, children, disabled, ...rest }, ref) {
  const env = useEnv();
  const parent = useContext(InheritCtx);
  const idle = tw(className, env, { disabled: !!disabled });
  const own = hasKeys(idle.inherit);
  const h = own ? mergeInherit(parent, idle.inherit) : parent;
  const pe = peOf(h, idle.inherit.pe);
  const dir = useContext(DirCtx);
  const myDir = modeOf(idle.style, idle.meta);
  let body = prepare(children, idle.meta, idle.style, env);
  if (own) body = <InheritCtx.Provider value={h}>{body}</InheritCtx.Provider>;
  if (myDir !== dir) body = <DirCtx.Provider value={myDir}>{body}</DirCtx.Provider>;
  return (
    <RNPressable
      ref={ref}
      disabled={disabled ?? undefined}
      {...rest}
      {...(pe ? { pointerEvents: pe } : null)}
      style={({ pressed }) => {
        const q = pressed ? tw(className, env, { disabled: !!disabled, pressed: true }) : idle;
        const s: any[] = [baseFor(dir, idle.meta, idle.style), q.style, style];
        if (pressed && idle.meta.press && env.id !== "brutal") s.push({ transform: [...(q.style.transform ?? []), { scale: 0.97 }] });
        return s;
      }}
    >
      {body}
    </RNPressable>
  );
});

export function Link({ to, params, replace, className, children, onPress, ...rest }: Omit<PressProps, "onPress"> & { to: string; params?: Record<string, string> | undefined; replace?: boolean | undefined; onPress?: PressableProps["onPress"] }) {
  return (
    <Pressable className={className} {...rest} onPress={(e) => { onPress?.(e); navigate({ to, params, replace }); }}>
      {children}
    </Pressable>
  );
}

/* ── TextInput + ScrollView ──────────────────────────────────────────────── */

export const TextInput = forwardRef<any, TextInputProps & BoxProps & { rows?: number }>(function TextInput(
  { className, style, onFocus, onBlur, multiline, rows, placeholderTextColor, ...rest },
  ref,
) {
  const env = useEnv();
  const parent = useContext(InheritCtx);
  const [focused, setFocused] = useState(false);
  const dir = useContext(DirCtx);
  const p = tw(className, env, { focused });
  const h = hasKeys(p.inherit) ? mergeInherit(parent, p.inherit) : parent;
  const ts = textStyle(h, env);
  const lineH = ts.lineHeight as number | undefined;
  delete ts.lineHeight;
  const box = p.style;
  const n = (v: unknown) => (typeof v === "number" ? v : 0);
  const padT = n(box.paddingTop ?? box.paddingVertical ?? box.padding);
  const padB = n(box.paddingBottom ?? box.paddingVertical ?? box.padding);
  const pad = padT + padB;
  // A browser input is as tall as its line box + padding + border; a native one is only as tall as its glyphs.
  const single = !(multiline || rows) && box.height === undefined && lineH !== undefined;
  const natural = single ? lineH! + pad + n(box.borderTopWidth ?? box.borderWidth) + n(box.borderBottomWidth ?? box.borderWidth) : undefined;
  return (
    <RNTextInput
      ref={ref}
      multiline={multiline || !!rows}
      placeholderTextColor={placeholderTextColor ?? p.meta.placeholder ?? withAlpha(h.color ?? env.c.ink, 0.4)}
      selectionColor={env.c.ink}
      {...rest}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      style={[dir === "row" ? BASE_ROW : BASE_COL, box, ts, rows ? { minHeight: rows * (h.size ?? 16) * 1.4 + pad, textAlignVertical: "top" } : null, natural ? { minHeight: natural } : null, { outlineWidth: 0 }, style]}
    />
  );
});

export const ScrollView = forwardRef<any, ScrollViewProps & BoxProps & { contentClassName?: string }>(function ScrollView(
  { className, contentClassName, style, contentContainerStyle, children, ...rest },
  ref,
) {
  const env = useEnv();
  const parent = useContext(InheritCtx);
  const p = tw(className, env);
  const c = tw(contentClassName, env);
  const own = hasKeys(p.inherit) || hasKeys(c.inherit);
  const h = own ? mergeInherit(mergeInherit(parent, p.inherit), c.inherit) : parent;
  const body = prepare(children, c.meta, c.style, env);
  return (
    <RNScrollView ref={ref} {...rest} style={[p.style, style]} contentContainerStyle={[c.style, contentContainerStyle]}>
      {own ? <InheritCtx.Provider value={h}>{body}</InheritCtx.Provider> : body}
    </RNScrollView>
  );
});

/* ── Portal (the prototype's overlay layer: sheets, FABs) ────────────────── */

const portals = new Map<string, ReactNode>();
const listeners = new Set<() => void>();
let version = 0;
let snapshot: [string, ReactNode][] = [];
const emit = () => { version++; snapshot = [...portals.entries()]; listeners.forEach((l) => l()); };

/** True while the screen that rendered this is the visible one. A stack keeps earlier screens mounted. */
export function useFocused(): boolean {
  const [f, setF] = useState(true);
  useFocusEffect(useCallback(() => { setF(true); return () => setF(false); }, []));
  return f;
}

export function Portal({ children }: { children: ReactNode }) {
  const id = useId();
  const inh = useContext(InheritCtx);
  useEffect(() => { portals.set(id, <InheritCtx.Provider value={inh}>{children}</InheritCtx.Provider>); emit(); });
  useEffect(() => () => { portals.delete(id); emit(); }, [id]);
  return null;
}

export function PortalHost() {
  const items = useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => snapshot, () => snapshot);
  void version;
  return (
    <RNView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {items.map(([k, el]) => <Fragment key={k}>{el}</Fragment>)}
    </RNView>
  );
}

export type { ReactElement };
