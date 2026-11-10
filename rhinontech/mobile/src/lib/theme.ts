import { useColorScheme } from "nativewind";

/**
 * Hex versions of the tokens in global.css, for props that can't take a className,
 * plus the admin panel's glass surfaces (rhinontech/admin-panel/app/globals.css).
 * The glass values carry alpha, which the channel tokens can't.
 */
const palette = {
  light: {
    background: "#F2F4F8",
    foreground: "#13161D",
    card: "#FFFFFF",
    primary: "#191D26",
    primaryForeground: "#F9FAFB",
    muted: "#F2F3F7",
    mutedForeground: "#646972",
    accent: "#EDF0F6",
    border: "#E0E3E8",
    destructive: "#DC2627",
    brand: "#3266E4",
    brandForeground: "#FCFCFC",
    success: "#16A34A",
    warning: "#D97706",
    glassCard: "rgba(255,255,255,0.84)",
    glassCardBorder: "rgba(27,33,48,0.08)",
    glassPanel: "rgba(255,255,255,0.7)",
    glassHeader: "rgba(255,255,255,0.62)",
    glassModal: "rgba(255,255,255,0.9)",
    glassEdge: "rgba(255,255,255,0.7)",
    selected: "rgba(50,102,228,0.07)",
    track: "rgba(19,22,29,0.06)",
    shadow: "#1B2130",
    glows: ["rgba(188,208,255,0.55)", "rgba(182,232,246,0.45)", "rgba(235,222,253,0.38)"],
  },
  dark: {
    background: "#0A0C11",
    foreground: "#F2F3F6",
    card: "#161920",
    primary: "#EDEEF2",
    primaryForeground: "#13161C",
    muted: "#21242B",
    mutedForeground: "#9DA2AC",
    accent: "#262A32",
    border: "#2B2E34",
    destructive: "#FF6467",
    brand: "#6594FA",
    brandForeground: "#090D16",
    success: "#4ADE80",
    warning: "#FBBF24",
    glassCard: "rgba(30,34,41,0.72)",
    glassCardBorder: "rgba(255,255,255,0.08)",
    glassPanel: "rgba(23,27,33,0.62)",
    glassHeader: "rgba(26,29,36,0.72)",
    glassModal: "rgba(26,29,36,0.9)",
    glassEdge: "rgba(255,255,255,0.1)",
    selected: "rgba(101,148,250,0.12)",
    track: "rgba(242,243,246,0.06)",
    shadow: "#000000",
    glows: ["rgba(54,73,131,0.38)", "rgba(0,80,100,0.3)", "rgba(73,55,102,0.24)"],
  },
} as const;

type Light = (typeof palette)["light"];
export type Palette = { [K in keyof Light]: K extends "glows" ? readonly [string, string, string] : string };

export function useTheme(): { colors: Palette; isDark: boolean } {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  return { colors: isDark ? palette.dark : palette.light, isDark };
}

/**
 * The panel's --shadow-xs / --glass-shadow, as native shadow props. No Android
 * `elevation`: it draws through translucent glass as a visible inner rectangle.
 */
export function lift(color: string, level: "card" | "panel" = "card") {
  return level === "card"
    ? { shadowColor: color, shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }
    : { shadowColor: color, shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } };
}
