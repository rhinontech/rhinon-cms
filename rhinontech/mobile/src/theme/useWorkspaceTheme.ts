import { useEffect } from "react";

import { api, getSession, onSession } from "@/lib/api";
import { useSetTheme } from "./ThemeProvider";
import type { ThemeId } from "./tokens";

const IDS: ThemeId[] = ["admin", "blocks", "midnight", "brutal"];

/** Applies the theme a super admin chose in the web admin panel. Re-checks on sign-in and when the app starts. */
export function useWorkspaceTheme() {
  const setTheme = useSetTheme();
  useEffect(() => {
    const load = () => {
      if (!getSession()) { setTheme("admin"); return; }
      api<{ theme: ThemeId }>("/branding/mobile-theme")
        .then((r) => setTheme(IDS.includes(r.theme) ? r.theme : "admin"))
        .catch(() => {});
    };
    load();
    return onSession(load);
  }, [setTheme]);
}
