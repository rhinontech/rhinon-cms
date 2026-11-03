import { useColorScheme } from "nativewind";

/** Hex versions of the tokens in global.css, for props that can't take a className (icons, tab bar). */
const palette = {
  light: {
    background: "#FFFFFF",
    foreground: "#15171E",
    card: "#FFFFFF",
    primary: "#1C1E26",
    primaryForeground: "#FAFAFC",
    muted: "#F3F4F7",
    mutedForeground: "#6B707D",
    border: "#E3E5EB",
    destructive: "#DC2626",
    brand: "#4F46E5",
    success: "#16A34A",
    warning: "#D97706",
  },
  dark: {
    background: "#0E0F14",
    foreground: "#F3F4F7",
    card: "#181A20",
    primary: "#EEEFF2",
    primaryForeground: "#15171E",
    muted: "#202229",
    mutedForeground: "#A0A5B2",
    border: "#282A32",
    destructive: "#EF4444",
    brand: "#818CF8",
    success: "#4ADE80",
    warning: "#FBBF24",
  },
} as const;

export type Palette = Record<keyof (typeof palette)["light"], string>;

export function useTheme(): { colors: Palette; isDark: boolean } {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  return { colors: isDark ? palette.dark : palette.light, isDark };
}
