// Generated from the prototype's themes.css (oklch → sRGB). Edit the prototype, not this.
export type ThemeId = "admin" | "blocks" | "midnight" | "brutal";
export type Hue = "coral" | "cobalt" | "leaf" | "violet" | "sun" | "rose" | "sky";
export type Palette = { paper: string; paperDeep: string; card: string; ink: string; inkSoft: string; line: string; onInkAccent: string; hues: Record<Hue, { solid: string; on: string; deep: string }>; radius: number; avatarRadius: number; displayWeight: string; ds: number; dl: number; tracking: number };
export const PALETTES: Record<ThemeId, Palette> = {
  blocks: {
    paper: "#f6f0e0", paperDeep: "#efe6d0", card: "#fdfaf1", ink: "#19120d", inkSoft: "#2f2721", line: "#d9d0bd", onInkAccent: "#f1b638",
    hues: {
      coral: { solid: "#cf3b1d", on: "#fbf7ec", deep: "#cf3b1d" },
      cobalt: { solid: "#264ac9", on: "#fbf7ec", deep: "#264ac9" },
      leaf: { solid: "#137d4a", on: "#fbf7ec", deep: "#137d4a" },
      violet: { solid: "#6c38d2", on: "#fbf7ec", deep: "#6c38d2" },
      sun: { solid: "#f1b638", on: "#19120d", deep: "#9c6306" },
      rose: { solid: "#fa7090", on: "#19120d", deep: "#c22859" },
      sky: { solid: "#41bae4", on: "#19120d", deep: "#0d658c" },
    },
    radius: 16, avatarRadius: 0.3, displayWeight: "900", ds: 1, dl: 0, tracking: -0.005,
  },
  admin: {
    paper: "#f2f4f8", paperDeep: "rgba(27,33,48,0.06)", card: "rgba(255,255,255,0.84)", ink: "#13161d", inkSoft: "#2a2e36", line: "rgba(27,33,48,0.1)", onInkAccent: "#adaefe",
    hues: {
      coral: { solid: "#dd2729", on: "#fcfcfc", deep: "#ce0e1a" },
      cobalt: { solid: "#2f6eeb", on: "#fcfcfc", deep: "#1f5ed9" },
      leaf: { solid: "#22c08e", on: "#13161d", deep: "#107555" },
      violet: { solid: "#6c5de7", on: "#fcfcfc", deep: "#5f4dd5" },
      sun: { solid: "#f5af20", on: "#13161d", deep: "#9b6410" },
      rose: { solid: "#f45fb0", on: "#13161d", deep: "#b51c79" },
      sky: { solid: "#1ab9cc", on: "#13161d", deep: "#0d697a" },
    },
    radius: 10, avatarRadius: 0.5, displayWeight: "600", ds: 0.68, dl: 0.12, tracking: -0.045,
  },
  midnight: {
    paper: "#090d17", paperDeep: "#131824", card: "#181e2c", ink: "#eef2fa", inkSoft: "#cdd1db", line: "#30374a", onInkAccent: "#6c2dc9",
    hues: {
      coral: { solid: "#fc5855", on: "#090d17", deep: "#fd867e" },
      cobalt: { solid: "#4e73f6", on: "#f4f7fe", deep: "#83a3fd" },
      leaf: { solid: "#2ec97a", on: "#090d17", deep: "#52d88c" },
      violet: { solid: "#8e58f2", on: "#f4f7fe", deep: "#b59bfb" },
      sun: { solid: "#f3c935", on: "#090d17", deep: "#f4cd4b" },
      rose: { solid: "#fd7a9d", on: "#090d17", deep: "#ff91ac" },
      sky: { solid: "#51c7f1", on: "#090d17", deep: "#65cdf3" },
    },
    radius: 17.6, avatarRadius: 0.32, displayWeight: "700", ds: 0.78, dl: 0.1, tracking: -0.035,
  },
  brutal: {
    paper: "#fdf2b0", paperDeep: "#efdf91", card: "#ffffff", ink: "#070707", inkSoft: "#222222", line: "#070707", onInkAccent: "#fee24e",
    hues: {
      coral: { solid: "#ff5736", on: "#070707", deep: "#b22708" },
      cobalt: { solid: "#3d7efc", on: "#070707", deep: "#1740cc" },
      leaf: { solid: "#3ce074", on: "#070707", deep: "#036639" },
      violet: { solid: "#bf83fe", on: "#070707", deep: "#7024ab" },
      sun: { solid: "#fee24e", on: "#070707", deep: "#825b02" },
      rose: { solid: "#fe92ac", on: "#070707", deep: "#b60554" },
      sky: { solid: "#5bdefb", on: "#070707", deep: "#045e7d" },
    },
    radius: 6.4, avatarRadius: 0.16, displayWeight: "800", ds: 0.78, dl: 0.06, tracking: -0.04,
  },
};
