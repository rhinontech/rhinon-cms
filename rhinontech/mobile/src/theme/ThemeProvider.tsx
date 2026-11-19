import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { FONTS, type FontSet } from "./fonts";
import { PALETTES, type Palette, type ThemeId } from "./tokens";

export type Theme = { id: ThemeId; dark: boolean; c: Palette; f: FontSet };

const Ctx = createContext<{ theme: Theme; setTheme: (id: ThemeId) => void } | null>(null);

/** "admin" until the workspace's chosen theme arrives (the super admin sets it in the web admin panel). */
export function ThemeProvider({ children, initial = "admin" }: { children: ReactNode; initial?: ThemeId }) {
  const [id, setTheme] = useState<ThemeId>(initial);
  const value = useMemo(
    () => ({ theme: { id, dark: id === "midnight", c: PALETTES[id], f: FONTS[id] }, setTheme }),
    [id],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): Theme {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme outside ThemeProvider");
  return v.theme;
}
export function useSetTheme(): (id: ThemeId) => void {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSetTheme outside ThemeProvider");
  return v.setTheme;
}
