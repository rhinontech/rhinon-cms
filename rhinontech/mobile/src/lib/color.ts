/** Colour parsing and conversion. The prototype's tokens are oklch; React Native only understands sRGB. */

export type RGBA = { r: number; g: number; b: number; a: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function oklabToLinear(L: number, C: number, h: number): [number, number, number] {
  const A = C * Math.cos(h);
  const B = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb: number[]) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);

/** Browsers gamut-map by lowering chroma, which keeps the hue; clipping channels does not. */
export function oklchToRgba(L: number, C: number, hDeg: number, a = 1): RGBA {
  const h = (hDeg * Math.PI) / 180;
  let rgb = oklabToLinear(L, C, h);
  for (let i = 0; i < 40 && !inGamut(rgb); i++) {
    C *= 0.95;
    rgb = oklabToLinear(L, C, h);
  }
  const enc = (v: number) => {
    v = clamp01(v);
    v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
    return Math.round(v * 255);
  };
  return { r: enc(rgb[0]), g: enc(rgb[1]), b: enc(rgb[2]), a };
}

const NUM = "[-+]?(?:\\d*\\.)?\\d+";
const OKLCH_RE = new RegExp(`oklch\\(\\s*(${NUM})(%?)\\s+(${NUM})\\s+(${NUM})(?:deg)?(?:\\s*/\\s*(${NUM})(%?))?\\s*\\)`, "g");
const OKLCH_ONE = new RegExp(OKLCH_RE.source);

export function parseColor(input: string): RGBA | null {
  const s = input.trim();
  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (s[0] === "#") {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  const rgb = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+)(%?))?\s*\)$/);
  if (rgb) {
    const a = rgb[4] === undefined ? 1 : rgb[5] ? +rgb[4] / 100 : +rgb[4];
    return { r: +rgb[1]!, g: +rgb[2]!, b: +rgb[3]!, a };
  }
  const ok = s.match(OKLCH_ONE);
  if (ok && ok[0] === s) {
    const L = ok[2] ? +ok[1]! / 100 : +ok[1]!;
    const a = ok[5] === undefined ? 1 : ok[6] ? +ok[5] / 100 : +ok[5];
    return oklchToRgba(L, +ok[3]!, +ok[4]!, a);
  }
  return null;
}

export function toCss({ r, g, b, a }: RGBA): string {
  if (a >= 1) return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${+a.toFixed(3)})`;
}

/** Multiply a colour's alpha: how `text-ink/60` is applied to a token that may already be translucent. */
export function withAlpha(color: string, alpha: number): string {
  const c = parseColor(color);
  if (!c) return color;
  return toCss({ ...c, a: c.a * alpha });
}

/** Replace every oklch(...) inside a longer string (a box-shadow, a gradient) with rgba(...). */
export function convertOklchIn(text: string): string {
  return text.replace(OKLCH_RE, (m) => {
    const c = parseColor(m);
    return c ? toCss(c) : m;
  });
}
