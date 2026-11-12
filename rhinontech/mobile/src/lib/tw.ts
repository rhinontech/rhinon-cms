/**
 * Runtime Tailwind for React Native. The prototype's screens are styled with Tailwind class strings
 * resolved against per-theme CSS variables; this reads the same strings and produces RN styles, so
 * a ported screen keeps its exact classes. Text properties are returned separately (`inherit`)
 * because CSS inherits them down the tree and React Native does not.
 */
import { convertOklchIn, parseColor, toCss, withAlpha } from "./color";
import type { Palette, ThemeId } from "../theme/tokens";

export type TwEnv = { id: ThemeId; c: Palette; top: number; bottom: number; width: number; height: number; key: string };
export type TwFlags = { disabled?: boolean; focused?: boolean; pressed?: boolean };

export type Inherit = {
  color?: string;
  family?: "display" | "sans" | "mono";
  weight?: number;
  size?: number;
  sizeEm?: number;
  trackEm?: number;
  leadMul?: number;
  leadPx?: number;
  transform?: "none" | "uppercase" | "lowercase" | "capitalize";
  align?: "left" | "center" | "right" | "justify";
  underline?: boolean;
  strike?: boolean;
  italic?: boolean;
  tabular?: boolean;
  pe?: "none" | "auto";
  lines?: number;
  ellipsis?: boolean;
};
export type GridCol = { t: "fr"; n: number } | { t: "px"; n: number } | { t: "auto" };
export type Gradient = { dir: string; stops: { color: string; pos?: number }[] };
export type Meta = {
  flex?: boolean;
  inline?: boolean;
  fit?: boolean;
  grid?: { cols: GridCol[] };
  colSpan?: number;
  gradient?: Gradient;
  lines?: number;
  ellipsis?: boolean;
  nowrap?: boolean;
  anim?: string;
  press?: boolean;
  divide?: { w: number; color: string; axis: "x" | "y" };
  scroll?: "x" | "y";
  blur?: number;
  placeholder?: string;
  fill?: string;
  stroke?: string;
  radiusPct?: boolean;
};
export type Parsed = { style: Record<string, any>; inherit: Inherit; meta: Meta };

const SIZES: Record<string, [number, number]> = {
  xs: [12, 1.3333], sm: [14, 1.4286], base: [16, 1.5], lg: [18, 1.5556], xl: [20, 1.4], "2xl": [24, 1.3333],
  "3xl": [30, 1.2], "4xl": [36, 1.1111], "5xl": [48, 1], "6xl": [60, 1], "7xl": [72, 1], "8xl": [96, 1], "9xl": [128, 1],
};
const CONTAINERS: Record<string, number> = {
  xs: 320, sm: 384, md: 448, lg: 512, xl: 576, "2xl": 672, "3xl": 768, "4xl": 896, "5xl": 1024, "6xl": 1152, "7xl": 1280,
};
const SHADOWS: Record<string, string> = {
  "2xs": "0 1px 0 0 #0000000d",
  xs: "0 1px 2px 0 #0000000d",
  sm: "0 1px 3px 0 #0000001a, 0 1px 2px -1px #0000001a",
  md: "0 4px 6px -1px #0000001a, 0 2px 4px -2px #0000001a",
  lg: "0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a",
  xl: "0 20px 25px -5px #0000001a, 0 8px 10px -6px #0000001a",
  "2xl": "0 25px 50px -12px #00000040",
};
const WEIGHTS: Record<string, number> = { thin: 100, extralight: 200, light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 };
const LEADING: Record<string, number> = { none: 1, tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625, loose: 2 };
const TRACKING: Record<string, number> = { tighter: -0.05, tight: -0.025, normal: 0, wide: 0.025, wider: 0.05, widest: 0.1 };
const HUES = ["coral", "cobalt", "leaf", "violet", "sun", "rose", "sky"] as const;
const MUTED_FG = "#6d6a5f"; // oklch(0.47 0.025 78), the one token shared by every theme

/* ── Length expressions: calc(), max(), min(), var(), env() ───────────────── */

function cssVar(name: string, env: TwEnv): number | undefined {
  switch (name) {
    case "--radius": return env.c.radius;
    case "--ds": return env.c.ds;
    case "--dl": return env.c.dl;
    case "--spacing": return 4;
    case "--status": case "--inset-top": return env.top + 18;
    case "--offline": return 0;
    case "--inset-bottom": return env.bottom + 116;
    case "--inset-bottom-pushed": return env.bottom + 36;
    default: return undefined;
  }
}

class LenParser {
  i = 0;
  constructor(readonly s: string, readonly env: TwEnv) {}
  ws() { while (this.s[this.i] === " ") this.i++; }
  expr(): number {
    let v = this.term();
    for (;;) {
      this.ws();
      const c = this.s[this.i];
      if (c === "+" || c === "-") { this.i++; const r = this.term(); v = c === "+" ? v + r : v - r; } else return v;
    }
  }
  term(): number {
    let v = this.factor();
    for (;;) {
      this.ws();
      const c = this.s[this.i];
      if (c === "*" || c === "/") { this.i++; const r = this.factor(); v = c === "*" ? v * r : v / r; } else return v;
    }
  }
  args(): string[] {
    // read to the matching close paren, splitting on top-level commas
    const out: string[] = [];
    let depth = 0, cur = "";
    while (this.i < this.s.length) {
      const c = this.s[this.i++]!;
      if (c === "(") depth++;
      if (c === ")") { if (depth === 0) break; depth--; }
      if (c === "," && depth === 0) { out.push(cur); cur = ""; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }
  sub(s: string): number {
    const p = new LenParser(s.trim(), this.env);
    return p.expr();
  }
  factor(): number {
    this.ws();
    const s = this.s, c = s[this.i];
    if (c === "(") { this.i++; const v = this.expr(); this.ws(); this.i++; return v; }
    if (c === "-") { this.i++; return -this.factor(); }
    if (c === "+") { this.i++; return this.factor(); }
    const rest = s.slice(this.i);
    const n = rest.match(/^(\d*\.?\d+)(px|rem|em|dvh|svh|lvh|vh|dvw|vw|%)?/);
    if (n) {
      this.i += n[0].length;
      const v = +n[1]!;
      switch (n[2]) {
        case "rem": case "em": return v * 16;
        case "vh": case "dvh": case "svh": case "lvh": return (v * this.env.height) / 100;
        case "vw": case "dvw": return (v * this.env.width) / 100;
        case "%": return NaN;
        default: return v;
      }
    }
    const f = rest.match(/^([a-z-]+)\(/);
    if (f) {
      this.i += f[0].length;
      const name = f[1]!;
      if (name === "calc") { const v = this.expr(); this.ws(); this.i++; return v; }
      const a = this.args();
      if (name === "var") {
        const v = cssVar(a[0]!.trim(), this.env);
        return v ?? (a[1] ? this.sub(a[1]) : NaN);
      }
      if (name === "env") {
        const k = a[0]!.trim();
        if (k === "safe-area-inset-top") return this.env.top;
        if (k === "safe-area-inset-bottom") return this.env.bottom;
        return a[1] ? this.sub(a[1]) : 0;
      }
      const vals = a.map((x) => this.sub(x));
      if (name === "max") return Math.max(...vals);
      if (name === "min") return Math.min(...vals);
      if (name === "clamp") return Math.min(Math.max(vals[1]!, vals[0]!), vals[2]!);
    }
    this.i = s.length + 1;
    return NaN;
  }
}

export function evalLen(raw: string, env: TwEnv): number | string | undefined {
  const s = raw.replace(/_/g, " ").trim();
  if (/^-?[\d.]+%$/.test(s)) return s;
  if (s === "var(--avatar-radius)") return `${+(env.c.avatarRadius * 100).toFixed(3)}%`;
  const p = new LenParser(s, env);
  const v = p.expr();
  if (p.i < s.length || Number.isNaN(v)) return undefined;
  return +v.toFixed(3);
}

/** Tailwind spacing: a number of quarter-rems, a fraction, "full", "px", or an arbitrary [value]. */
function sp(v: string, env: TwEnv): number | string | undefined {
  if (v === "px") return 1;
  if (v === "auto") return "auto";
  if (v === "full") return "100%";
  if (/^\d+\/\d+$/.test(v)) { const [a, b] = v.split("/").map(Number); return `${+((a! / b!) * 100).toFixed(4)}%`; }
  if (/^\d*\.?\d+$/.test(v)) return +v * 4;
  if (v[0] === "[" && v.endsWith("]")) return evalLen(v.slice(1, -1), env);
  return undefined;
}

/* ── Colours ──────────────────────────────────────────────────────────────── */

function palette(n: string, env: TwEnv): string | undefined {
  const c = env.c;
  switch (n) {
    case "paper": case "background": return c.paper;
    case "paper-deep": case "secondary": case "muted": case "accent": return c.paperDeep;
    case "ink": case "foreground": case "primary": return c.ink;
    case "ink-soft": return c.inkSoft;
    case "line": case "border": case "input": return c.line;
    case "card": case "popover": return c.card;
    case "primary-foreground": return c.paper;
    case "muted-foreground": return MUTED_FG;
    case "on-ink-accent": return c.onInkAccent;
    case "destructive": return c.hues.coral.solid;
    case "ring": return c.hues.cobalt.solid;
    case "white": return "#ffffff";
    case "black": return "#000000";
    case "transparent": return "transparent";
    case "stage": return "#15110c";
    case "stage-fg": return "#f6f0e0";
    case "stage-accent": return "#f1b638";
  }
  const m = n.match(/^(coral|cobalt|leaf|violet|sun|rose|sky)(?:-(foreground|deep))?$/);
  if (m && (HUES as readonly string[]).includes(m[1]!)) {
    const h = c.hues[m[1] as (typeof HUES)[number]];
    return m[2] === "foreground" ? h.on : m[2] === "deep" ? h.deep : h.solid;
  }
  return undefined;
}

/** "ink", "ink/60", "[oklch(...)]", "coral-deep/50" → an sRGB colour string. */
export function colorOf(name: string, env: TwEnv): string | undefined {
  let base = name, op: number | undefined;
  let slash = -1, depth = 0;
  for (let i = 0; i < name.length; i++) {
    const ch = name[i];
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth--;
    else if (ch === "/" && depth === 0) slash = i;
  }
  if (slash > 0) {
    base = name.slice(0, slash);
    const o = name.slice(slash + 1);
    op = o[0] === "[" ? +o.slice(1, -1) : +o / 100;
    if (Number.isNaN(op)) return undefined;
  }
  let col: string | undefined;
  if (base[0] === "[" && base.endsWith("]")) {
    const inner = base.slice(1, -1).replace(/^color:/, "").replace(/_/g, " ");
    const c = parseColor(convertOklchIn(inner));
    col = c ? toCss(c) : undefined;
  } else col = palette(base, env);
  if (!col) return undefined;
  return op === undefined ? col : withAlpha(col, op);
}

function shadowColors(s: string): string {
  return convertOklchIn(s.replace(/_/g, " "));
}

/* ── Parser ───────────────────────────────────────────────────────────────── */

type St = {
  style: Record<string, any>;
  inh: Inherit;
  meta: Meta;
  shadows: string[];
  tx?: number | string; ty?: number | string; rot?: string; scale?: number;
  display?: "flex" | "grid";
  col?: boolean; rev?: boolean;
  lead?: { mul?: number; px?: number };
  sizeLead?: number;
  gFrom?: string; gVia?: string; gTo?: string; gFromPos?: number; gViaPos?: number; gToPos?: number;
  hasBorderW: boolean; hasBorderColor: boolean;
  f: { mono: boolean; display: boolean; border: boolean; bgCard: boolean; press: boolean };
  outline: boolean;
};

const warned = new Set<string>();
const IGNORE = /^(transition|duration-|ease-|delay-|cursor-|select-|touch-|will-|snap-|scroll-|overscroll|no-scrollbar|isolate|appearance-|outline-none|outline-hidden|mix-|selection|group|peer|break-|align-|list-|decoration-|underline-offset|object-|resize|accent-|caret-|paper-grain|phone|stage-|text-(balance|wrap|nowrap|pretty|ellipsis|clip)|whitespace-(normal|pre|pre-line|pre-wrap)|contents|inline$|block$|font-variant|ordinal|slashed|origin-center|space-[xy]-reverse|forced|no-go|no-access|self-review|to-sign|breaks|mine|tokens|content$|glance|label|icon|tone|screen|app|tappable|check|selection|will|list|from…|from$|to$|size$|scale$)/;

function newSt(): St {
  return { style: {}, inh: {}, meta: {}, shadows: [], hasBorderW: false, hasBorderColor: false, f: { mono: false, display: false, border: false, bgCard: false, press: false }, outline: false };
}

function splitVariants(tok: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = "";
  for (const ch of tok) {
    if (ch === "[" || ch === "(") depth++;
    if (ch === "]" || ch === ")") depth--;
    if (ch === ":" && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out;
}

const SIDE_PAD: Record<string, string> = { p: "padding", px: "paddingHorizontal", py: "paddingVertical", pt: "paddingTop", pr: "paddingRight", pb: "paddingBottom", pl: "paddingLeft", ps: "paddingStart", pe: "paddingEnd" };
const SIDE_MAR: Record<string, string> = { m: "margin", mx: "marginHorizontal", my: "marginVertical", mt: "marginTop", mr: "marginRight", mb: "marginBottom", ml: "marginLeft", ms: "marginStart", me: "marginEnd" };
const INSET: Record<string, string[]> = { inset: ["top", "right", "bottom", "left"], "inset-x": ["left", "right"], "inset-y": ["top", "bottom"], top: ["top"], right: ["right"], bottom: ["bottom"], left: ["left"], start: ["start"], end: ["end"] };
const BORDER_SIDES: Record<string, string[]> = { "": ["Top", "Right", "Bottom", "Left"], x: ["Left", "Right"], y: ["Top", "Bottom"], t: ["Top"], r: ["Right"], b: ["Bottom"], l: ["Left"] };
const RADIUS_SIDES: Record<string, string[]> = { "": ["TopLeft", "TopRight", "BottomRight", "BottomLeft"], t: ["TopLeft", "TopRight"], b: ["BottomLeft", "BottomRight"], l: ["TopLeft", "BottomLeft"], r: ["TopRight", "BottomRight"], tl: ["TopLeft"], tr: ["TopRight"], bl: ["BottomLeft"], br: ["BottomRight"] };

function neg(v: number | string | undefined): number | string | undefined {
  if (typeof v === "number") return -v;
  if (typeof v === "string" && v !== "auto") return v[0] === "-" ? v.slice(1) : "-" + v;
  return v;
}

function radiusOf(sz: string, env: TwEnv): number | string | undefined {
  const r = env.c.radius;
  switch (sz) {
    case "": return 4;
    case "none": return 0;
    case "xs": return 2;
    case "sm": return r - 4;
    case "md": return r - 2;
    case "lg": return r;
    case "xl": return r + 4;
    case "2xl": return r + 8;
    case "3xl": return r + 12;
    case "4xl": return r + 16;
    case "full": return 9999;
  }
  if (sz[0] === "[") return evalLen(sz.slice(1, -1), env);
  return undefined;
}

function gridCols(v: string): GridCol[] | undefined {
  if (/^\d+$/.test(v)) return Array.from({ length: +v }, () => ({ t: "fr", n: 1 }) as GridCol);
  if (v[0] !== "[") return undefined;
  const parts = v.slice(1, -1).split("_");
  const out: GridCol[] = [];
  for (const p of parts) {
    let m: RegExpMatchArray | null;
    if (p === "auto") out.push({ t: "auto" });
    else if ((m = p.match(/^([\d.]+)fr$/))) out.push({ t: "fr", n: +m[1]! });
    else if ((m = p.match(/^([\d.]+)px$/))) out.push({ t: "px", n: +m[1]! });
    else if (p.startsWith("minmax")) out.push({ t: "fr", n: 1 });
    else return undefined;
  }
  return out;
}

function applyToken(raw: string, st: St, env: TwEnv, flags: TwFlags): boolean {
  const parts = splitVariants(raw);
  let tok = parts[parts.length - 1]!;
  let important = false;
  if (tok[0] === "!") { important = true; tok = tok.slice(1); }
  void important;
  let placeholder = false;
  for (const v of parts.slice(0, -1)) {
    if (v === "max-sm") continue;
    if (v === "disabled") { if (!flags.disabled) return true; continue; }
    if (v === "focus" || v === "focus-visible") { if (!flags.focused) return true; continue; }
    if (v === "active") { if (!flags.pressed) return true; continue; }
    if (v === "placeholder") { placeholder = true; continue; }
    return true; // hover, group-*, sm/md/lg/xl, first/last, data-*, … do not apply on a phone
  }
  if (placeholder) {
    const m = tok.match(/^text-(.+)$/);
    if (m) { const c = colorOf(m[1]!, env); if (c) st.meta.placeholder = c; }
    return true;
  }
  return base(tok, st, env, flags);
}

function setBorderColor(st: St, sides: string[] | null, color: string) {
  st.hasBorderColor = true;
  if (!sides) { st.style.borderColor = color; return; }
  for (const s of sides) st.style[`border${s}Color`] = color;
}

function base(tok: string, st: St, env: TwEnv, flags: TwFlags): boolean {
  const s = st.style, inh = st.inh;
  let m: RegExpMatchArray | null;

  switch (tok) {
    case "flex": st.display = "flex"; return true;
    case "inline-flex": st.display = "flex"; st.meta.inline = true; return true;
    case "grid": st.display = "grid"; return true;
    case "inline-grid": st.display = "grid"; st.meta.inline = true; return true;
    case "block": return true;
    case "inline-block": case "inline": st.meta.inline = true; return true;
    case "hidden": case "sr-only": s.display = "none"; return true;
    case "flex-col": st.col = true; return true;
    case "flex-row": st.col = false; return true;
    case "flex-col-reverse": st.col = true; st.rev = true; return true;
    case "flex-row-reverse": st.rev = true; return true;
    case "flex-wrap": s.flexWrap = "wrap"; return true;
    case "flex-nowrap": s.flexWrap = "nowrap"; return true;
    case "flex-1": s.flexGrow = 1; s.flexShrink = 1; s.flexBasis = 0; return true;
    case "flex-auto": s.flexGrow = 1; s.flexShrink = 1; s.flexBasis = "auto"; return true;
    case "flex-none": s.flexGrow = 0; s.flexShrink = 0; return true;
    case "grow": case "flex-grow": s.flexGrow = 1; return true;
    case "grow-0": case "flex-grow-0": s.flexGrow = 0; return true;
    case "shrink-0": case "flex-shrink-0": s.flexShrink = 0; return true;
    case "shrink": case "flex-shrink": s.flexShrink = 1; return true;
    case "absolute": case "fixed": s.position = "absolute"; return true;
    case "relative": case "sticky": s.position = "relative"; return true;
    case "uppercase": inh.transform = "uppercase"; return true;
    case "lowercase": inh.transform = "lowercase"; return true;
    case "capitalize": inh.transform = "capitalize"; return true;
    case "normal-case": inh.transform = "none"; return true;
    case "italic": inh.italic = true; return true;
    case "not-italic": inh.italic = false; return true;
    case "underline": inh.underline = true; return true;
    case "line-through": inh.strike = true; return true;
    case "no-underline": inh.underline = false; return true;
    case "truncate": inh.lines = 1; inh.ellipsis = true; return true;
    case "whitespace-nowrap": inh.lines = 1; return true;
    case "tabular-nums": inh.tabular = true; return true;
    case "overflow-hidden": case "overflow-clip": s.overflow = "hidden"; return true;
    case "overflow-visible": s.overflow = "visible"; return true;
    case "overflow-x-auto": case "overflow-x-scroll": st.meta.scroll = "x"; return true;
    case "overflow-y-auto": case "overflow-y-scroll": case "overflow-auto": st.meta.scroll = "y"; return true;
    case "pointer-events-none": inh.pe = "none"; return true;
    case "pointer-events-auto": inh.pe = "auto"; return true;
    case "press": st.meta.press = true; st.f.press = true; return true;
    case "aspect-square": s.aspectRatio = 1; return true;
    case "aspect-video": s.aspectRatio = 16 / 9; return true;
    case "place-items-center": s.alignItems = "center"; s.justifyContent = "center"; return true;
    case "place-content-center": s.justifyContent = "center"; s.alignContent = "center"; return true;
    case "font-mono": st.f.mono = true; inh.family = "mono"; return true;
    case "font-display": st.f.display = true; inh.family = "display"; return true;
    case "font-sans": inh.family = "sans"; return true;
    case "border": st.f.border = true; st.hasBorderW = true; s.borderWidth = 1; return true;
    case "bg-card": st.f.bgCard = true; break;
    case "outline": st.outline = true; s.outlineStyle = "solid"; if (s.outlineWidth === undefined) s.outlineWidth = 1; return true;
    case "text-left": case "text-center": case "text-right": case "text-justify": inh.align = tok.slice(5) as Inherit["align"]; return true;
    case "text-start": inh.align = "left"; return true;
    case "text-end": inh.align = "right"; return true;
    case "shadow": st.shadows.push(shadowColors(SHADOWS.sm!)); return true;
    case "shadow-none": st.shadows = []; return true;
    case "bg-none": return true;
  }

  if (/^(items|justify|self|content)-/.test(tok)) {
    const map: Record<string, string> = { start: "flex-start", end: "flex-end", center: "center", between: "space-between", around: "space-around", evenly: "space-evenly", stretch: "stretch", baseline: "baseline", auto: "auto" };
    const [kind, ...rest] = tok.split("-");
    const v = map[rest.join("-")];
    if (v) { s[kind === "items" ? "alignItems" : kind === "justify" ? "justifyContent" : kind === "self" ? "alignSelf" : "alignContent"] = v; return true; }
  }

  if ((m = tok.match(/^(-?)(p[xytrblse]?|m[xytrblse]?)-(.+)$/))) {
    const key = m[2]!;
    const v = sp(m[3]!, env);
    if (v !== undefined) { s[(key[0] === "p" ? SIDE_PAD : SIDE_MAR)[key]!] = m[1] ? neg(v) : v; return true; }
  }
  if ((m = tok.match(/^gap(?:-([xy]))?-(.+)$/))) {
    const v = sp(m[2]!, env);
    if (v !== undefined) { s[m[1] === "x" ? "columnGap" : m[1] === "y" ? "rowGap" : "gap"] = v; return true; }
  }
  if ((m = tok.match(/^space-([xy])-(.+)$/))) {
    const v = sp(m[2]!, env);
    if (v !== undefined) { s.gap = v; return true; }
  }
  if ((m = tok.match(/^(w|h|min-w|min-h|max-w|max-h|size)-(.+)$/))) {
    const k = m[1]!, v = m[2]!;
    let val: number | string | undefined;
    if (v === "screen" || v === "dvh" || v === "svh" || v === "lvh") val = k.endsWith("w") ? env.width : env.height;
    else if (v === "dvw") val = env.width;
    else if (v === "fit" || v === "max" || v === "min") { st.meta.fit = true; return true; }
    else if (k === "max-w" && CONTAINERS[v]) val = CONTAINERS[v];
    else if (v === "none") val = undefined;
    else val = sp(v, env);
    if (val === undefined) return v === "none";
    const keys = k === "size" ? ["width", "height"] : [{ w: "width", h: "height", "min-w": "minWidth", "min-h": "minHeight", "max-w": "maxWidth", "max-h": "maxHeight" }[k]!];
    for (const key of keys) s[key] = val;
    return true;
  }
  if ((m = tok.match(/^(-?)(inset-x|inset-y|inset|top|right|bottom|left|start|end)-(.+)$/))) {
    const v = sp(m[3]!, env);
    if (v !== undefined) { for (const k of INSET[m[2]!]!) s[k] = m[1] ? neg(v) : v; return true; }
  }
  if ((m = tok.match(/^z-(?:\[(-?\d+)\]|(-?\d+))$/))) { s.zIndex = +(m[1] ?? m[2]!); return true; }
  if ((m = tok.match(/^opacity-(.+)$/))) {
    const v = m[1]![0] === "[" ? +m[1]!.slice(1, -1) : +m[1]! / 100;
    if (!Number.isNaN(v)) { s.opacity = v; return true; }
  }
  if ((m = tok.match(/^rounded(?:-(t|b|l|r|tl|tr|bl|br))?(?:-(.+))?$/))) {
    const sides = RADIUS_SIDES[m[1] ?? ""]!;
    const v = radiusOf(m[2] ?? "", env);
    if (v !== undefined) {
      if (!m[1]) s.borderRadius = v;
      else for (const side of sides) s[`border${side}Radius`] = v;
      return true;
    }
  }

  if ((m = tok.match(/^border(?:-([xytrbl]))?(?:-(.+))?$/))) {
    const sides = BORDER_SIDES[m[1] ?? ""]!;
    const v = m[2];
    if (!v) { for (const sd of sides) s[`border${sd}Width`] = 1; st.hasBorderW = true; return true; }
    if (/^\d+$/.test(v)) { if (!m[1]) s.borderWidth = +v; else for (const sd of sides) s[`border${sd}Width`] = +v; st.hasBorderW = true; return true; }
    if (/^(solid|dashed|dotted)$/.test(v)) { s.borderStyle = v; return true; }
    if (v === "none" || v === "hidden") { s.borderWidth = 0; return true; }
    if (v[0] === "[" && /^\[[\d.]+px\]$/.test(v)) { s.borderWidth = parseFloat(v.slice(1)); st.hasBorderW = true; return true; }
    const c = colorOf(v, env);
    if (c) { setBorderColor(st, m[1] ? sides : null, c); return true; }
  }
  if ((m = tok.match(/^divide-(x|y)(?:-(\d+))?$/))) { st.meta.divide = { axis: m[1] as "x" | "y", w: m[2] ? +m[2] : 1, color: st.meta.divide?.color ?? env.c.line }; return true; }
  if ((m = tok.match(/^divide-(.+)$/))) {
    const c = colorOf(m[1]!, env);
    if (c) { st.meta.divide = { axis: st.meta.divide?.axis ?? "y", w: st.meta.divide?.w ?? 1, color: c }; return true; }
  }

  if ((m = tok.match(/^bg-gradient-to-(t|tr|r|br|b|bl|l|tl)$/))) { st.meta.gradient = { dir: m[1]!, stops: [] }; return true; }
  if ((m = tok.match(/^bg-(.+)$/))) {
    const c = colorOf(m[1]!, env);
    if (c) { s.backgroundColor = c; return true; }
  }
  if ((m = tok.match(/^(from|via|to)-(.+)$/))) {
    const which = m[1] as "from" | "via" | "to", v = m[2]!;
    if (/^\d+%$/.test(v)) { const p = parseInt(v) / 100; if (which === "from") st.gFromPos = p; else if (which === "via") st.gViaPos = p; else st.gToPos = p; return true; }
    const c = colorOf(v, env);
    if (c) { if (which === "from") st.gFrom = c; else if (which === "via") st.gVia = c; else st.gTo = c; return true; }
  }

  if ((m = tok.match(/^text-(.+)$/))) {
    const v = m[1]!;
    if (SIZES[v]) { inh.size = SIZES[v]![0]; st.sizeLead = SIZES[v]![1]; return true; }
    if (v[0] === "[") {
      const inner = v.slice(1, -1);
      if (inner.startsWith("color:")) { const c = colorOf(`[${inner}]`, env); if (c) { inh.color = c; return true; } }
      const em = inner.match(/^([\d.]+)em$/);
      if (em) { inh.sizeEm = +em[1]!; return true; }
      if (/^(length:)?([\d.]+(px|rem)|calc|max|min|clamp|var)/.test(inner)) {
        const n = evalLen(inner.replace(/^length:/, ""), env);
        if (typeof n === "number") { inh.size = n; return true; }
      }
    }
    const c = colorOf(v, env);
    if (c) { inh.color = c; return true; }
  }
  if ((m = tok.match(/^font-(.+)$/))) {
    if (WEIGHTS[m[1]!] !== undefined) { inh.weight = WEIGHTS[m[1]!]; return true; }
  }
  if ((m = tok.match(/^leading-(.+)$/))) {
    const v = m[1]!;
    if (LEADING[v] !== undefined) { st.lead = { mul: LEADING[v] }; return true; }
    if (/^\d+$/.test(v)) { st.lead = { px: +v * 4 }; return true; }
    if (v[0] === "[") {
      const inner = v.slice(1, -1);
      const n = evalLen(inner, env);
      if (typeof n === "number") { st.lead = /(px|rem|em)/.test(inner) ? { px: n } : { mul: n }; return true; }
    }
  }
  if ((m = tok.match(/^tracking-(.+)$/))) {
    const v = m[1]!;
    if (TRACKING[v] !== undefined) { inh.trackEm = TRACKING[v]; return true; }
    const em = v.match(/^\[(-?[\d.]+)em\]$/);
    if (em) { inh.trackEm = +em[1]!; return true; }
  }
  if ((m = tok.match(/^line-clamp-(\d+|none)$/))) { inh.lines = m[1] === "none" ? undefined : +m[1]!; inh.ellipsis = true; return true; }

  if ((m = tok.match(/^shadow-(.+)$/))) {
    const v = m[1]!;
    if (SHADOWS[v]) { st.shadows.push(shadowColors(SHADOWS[v]!)); return true; }
    if (v[0] === "[") { st.shadows.push(shadowColors(v.slice(1, -1))); return true; }
    return true; // shadow-<colour>: tints a shadow; ignored
  }
  if ((m = tok.match(/^ring(?:-(\d+))?$/))) { st.shadows.push(`0 0 0 ${m[1] ?? 3}px ${env.c.ink}`); return true; }
  if ((m = tok.match(/^ring-(.+)$/))) {
    const c = colorOf(m[1]!, env);
    if (c && st.shadows.length) { st.shadows[st.shadows.length - 1] = st.shadows[st.shadows.length - 1]!.replace(/(?:rgba?\([^)]*\)|#[0-9a-f]{3,8})$/i, c); return true; }
    return !!c;
  }
  if ((m = tok.match(/^(-?)outline-offset-(.+)$/))) { const v = sp(m[2]!, env); if (typeof v === "number") { s.outlineOffset = m[1] ? -v : v; return true; } }
  if ((m = tok.match(/^outline-(\d+|\[.+\])$/)) ) {
    const v = m[1]![0] === "[" ? evalLen(m[1]!.slice(1, -1), env) : +m[1]!;
    if (typeof v === "number") { s.outlineWidth = v; s.outlineStyle = "solid"; return true; }
  }
  if ((m = tok.match(/^outline-(.+)$/))) { const c = colorOf(m[1]!, env); if (c) { s.outlineColor = c; return true; } }

  if ((m = tok.match(/^(-?)translate-([xy])-(.+)$/))) {
    const v = sp(m[3]!, env);
    if (v !== undefined) { const val = m[1] ? neg(v) : v; if (m[2] === "x") st.tx = val; else st.ty = val; return true; }
  }
  if ((m = tok.match(/^(-?)rotate-(\[(-?[\d.]+)deg\]|\d+)$/))) { const d = m[3] ?? m[2]!; st.rot = `${m[1]}${d}deg`; return true; }
  if ((m = tok.match(/^scale-(\[([\d.]+)\]|\d+)$/))) { st.scale = m[2] ? +m[2] : +m[1]! / 100; return true; }
  if ((m = tok.match(/^origin-(.+)$/))) {
    const map: Record<string, string> = { left: "left center", right: "right center", top: "center top", bottom: "center bottom", center: "center", "top-left": "left top", "top-right": "right top", "bottom-left": "left bottom", "bottom-right": "right bottom" };
    if (map[m[1]!]) { s.transformOrigin = map[m[1]!]; return true; }
  }

  if ((m = tok.match(/^grid-cols-(.+)$/))) { const c = gridCols(m[1]!); if (c) { st.meta.grid = { cols: c }; return true; } }
  if ((m = tok.match(/^col-span-(\d+)$/))) { st.meta.colSpan = +m[1]!; return true; }
  if ((m = tok.match(/^(grid-rows-\d+|row-span-\d+)$/))) return true;
  if ((m = tok.match(/^animate-(.+)$/))) { st.meta.anim = m[1]!; return true; }
  if ((m = tok.match(/^backdrop-blur(?:-(.+))?$/))) {
    const t: Record<string, number> = { xs: 2, sm: 4, md: 12, lg: 16, xl: 24, "2xl": 40, "3xl": 64 };
    st.meta.blur = m[1] ? t[m[1]] ?? 8 : 8;
    return true;
  }
  if ((m = tok.match(/^fill-(.+)$/))) { const c = colorOf(m[1]!, env); if (c) { st.meta.fill = c; return true; } }
  if ((m = tok.match(/^stroke-(.+)$/))) { const c = colorOf(m[1]!, env); if (c) { st.meta.stroke = c; return true; } }
  if ((m = tok.match(/^flex-\[([\d.]+)\]$/))) { s.flexGrow = +m[1]!; s.flexShrink = 1; s.flexBasis = 0; return true; }
  if ((m = tok.match(/^basis-(.+)$/))) { const v = sp(m[1]!, env); if (v !== undefined) { s.flexBasis = v; return true; } }

  void flags;
  return IGNORE.test(tok);
}

function finalize(st: St, env: TwEnv, flags: TwFlags): Parsed {
  const s = st.style, inh = st.inh, c = env.c;

  if (st.display) {
    s.flexDirection = st.col ? (st.rev ? "column-reverse" : "column") : st.display === "grid" ? "column" : st.rev ? "row-reverse" : "row";
    st.meta.flex = true;
  } else if (st.col !== undefined || st.rev) {
    s.flexDirection = st.col ? (st.rev ? "column-reverse" : "column") : st.rev ? "row-reverse" : "row";
  }

  // Text that carries a size also carries its default line height unless a leading class says otherwise.
  if (st.lead) { if (st.lead.px !== undefined) inh.leadPx = st.lead.px; else inh.leadMul = st.lead.mul; }
  else if (st.sizeLead !== undefined) inh.leadMul = st.sizeLead;

  // Theme rules from themes.css that out-rank utilities.
  if (st.f.display) { inh.weight = +c.displayWeight; inh.trackEm = c.tracking; inh.transform = "none"; }
  if (st.f.mono && env.id === "admin") { inh.transform = "none"; inh.trackEm = 0.01; }
  if (env.id === "midnight" && st.f.bgCard && st.f.border) s.borderColor = c.line;
  if (env.id === "admin" && st.f.bgCard && st.f.border) st.shadows = ["0 1px 2px 0 rgba(27,33,48,0.06)", "inset 0 1px 0 0 rgba(255,255,255,0.8)"];
  if (env.id === "brutal") {
    if (st.f.border && s.borderWidth === 1) s.borderWidth = 2;
    if (st.f.press) {
      s.borderWidth = 2; s.borderColor = c.ink; st.hasBorderW = true; st.hasBorderColor = true;
      st.shadows = flags.pressed ? [] : [`3px 3px 0 0 ${c.ink}`];
      if (flags.pressed) { st.tx = 3; st.ty = 3; }
    }
    if (st.f.bgCard && st.f.border) st.shadows = [`4px 4px 0 0 ${c.ink}`];
  }

  if (st.hasBorderW && !st.hasBorderColor && s.borderColor === undefined) s.borderColor = c.line;

  if (st.shadows.length) s.boxShadow = st.shadows.join(", ");

  const tf: Record<string, unknown>[] = [];
  if (st.tx !== undefined) tf.push({ translateX: st.tx });
  if (st.ty !== undefined) tf.push({ translateY: st.ty });
  if (st.rot) tf.push({ rotate: st.rot });
  if (st.scale !== undefined) tf.push({ scale: st.scale });
  if (tf.length) s.transform = tf;

  if (st.meta.gradient) {
    const stops: Gradient["stops"] = [];
    if (st.gFrom) stops.push({ color: st.gFrom, pos: st.gFromPos });
    if (st.gVia) stops.push({ color: st.gVia, pos: st.gViaPos });
    stops.push({ color: st.gTo ?? "transparent", pos: st.gToPos });
    st.meta.gradient.stops = stops;
  }
  if (st.meta.fit) { s.alignSelf = s.alignSelf ?? "flex-start"; }

  return { style: s, inherit: inh, meta: st.meta };
}

const cache = new Map<string, Parsed>();

export function tw(classes: string | undefined | null | false, env: TwEnv, flags: TwFlags = {}): Parsed {
  const input = classes || "";
  const key = `${env.key}|${flags.disabled ? 1 : 0}${flags.focused ? 1 : 0}${flags.pressed ? 1 : 0}|${input}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const st = newSt();
  const toks = input.split(/\s+/).filter(Boolean);
  const late: string[] = [];
  for (const t of toks) { if (t[0] === "!") late.push(t); else if (!applyToken(t, st, env, flags) && __DEV__ && !warned.has(t)) { warned.add(t); console.warn("[tw] unhandled class:", t); } }
  for (const t of late) applyToken(t, st, env, flags);
  const out = finalize(st, env, flags);
  if (cache.size > 6000) cache.clear();
  cache.set(key, out);
  return out;
}

declare const __DEV__: boolean;
