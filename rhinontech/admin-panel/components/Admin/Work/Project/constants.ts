/** Chip styling per workflow-status colour. Shared by Table, Board and Calendar. */
export const STATUS_CHIP: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800",
  indigo: "bg-indigo-100 text-indigo-800",
  cyan: "bg-cyan-100 text-cyan-800",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-green-100 text-green-800",
  stone: "bg-stone-100 text-stone-700",
  red: "bg-red-100 text-red-800",
  purple: "bg-purple-100 text-purple-800",
};

export const STATUS_DOT: Record<string, string> = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  cyan: "bg-cyan-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
  stone: "bg-stone-400",
  red: "bg-red-500",
  purple: "bg-purple-500",
};

/**
 * Chart hexes for each workflow-status colour name.
 *
 * These five chromatic slots were validated together as a categorical palette
 * (lightness band, chroma floor, CVD separation, normal-vision floor all PASS on
 * the adjacent pairlist). `stone` is deliberately NOT one of them — it is the
 * de-emphasis gray for cancelled work, which is a role, not a category.
 *
 * Two slots (aqua, yellow) sit under 3:1 against the light surface, so the relief
 * rule applies: every bar carries a visible direct label. Do not remove those
 * labels without re-validating.
 */
export const CHART_HEX: Record<string, string> = {
  blue: "#2a78d6",
  indigo: "#4a3aa7",
  cyan: "#1baf7a",
  amber: "#eda100",
  green: "#008300",
  // de-emphasis, outside the categorical set
  stone: "#a8a29e",
  red: "#e34948",
  purple: "#4a3aa7",
};

/** Single hue for ranked magnitude bars — length already encodes the value. */
export const CHART_SEQUENTIAL = "#2a78d6";

export const CHART_INK = {
  primary: "#1c1917",
  secondary: "#57534e",
  muted: "#a8a29e",
  grid: "#e7e5e4",
};

/** Very light column washes for the board — surface only, never data encoding. */
export const COLUMN_TINT: Record<string, string> = {
  blue: "bg-blue-50/50",
  indigo: "bg-indigo-50/50",
  cyan: "bg-cyan-50/50",
  amber: "bg-amber-50/50",
  green: "bg-green-50/50",
  stone: "bg-stone-50/70",
  red: "bg-red-50/50",
  purple: "bg-purple-50/50",
};
