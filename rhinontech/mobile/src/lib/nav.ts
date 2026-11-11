import { router, usePathname } from "expo-router";

import { href } from "./router";
import type { Tone } from "./tone";

/** Screens that sit on the tab bar. Everything else is "pushed" on top with a back button. */
export const ROOT_PATHS = ["/", "/work", "/inbox", "/chat", "/more"];

export function isRootPath(pathname: string): boolean {
  const p = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return ROOT_PATHS.includes(p);
}

/** One colour per module, used by tiles, headers and the tab bar. */
export const MODULE_TONE: Record<string, Tone> = {
  work: "cobalt",
  inbox: "coral",
  chat: "sky",
  attendance: "leaf",
  leave: "sky",
  pay: "sun",
  approvals: "violet",
  crm: "rose",
  meetings: "cobalt",
  people: "coral",
  notifications: "coral",
  profile: "ink",
};

/** Typed routes are generated from the file tree at dev-server start; paths here are checked at runtime by the router. */
export function go(to: string, params?: Record<string, string>, replace = false) {
  const path = href(to, params) as never;
  if (replace) router.replace(path);
  else router.push(path);
}
export const replace = (to: string, params?: Record<string, string>) => go(to, params, true);
export const back = (fallback = "/") => (router.canGoBack() ? router.back() : router.replace(fallback as never));
export const useRouteName = () => usePathname();
