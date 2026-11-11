import { router } from "expo-router";

/** Typed routes are generated from the file tree at dev-server start; paths here are checked at runtime by the router. */
export const go = (path: string) => router.push(path as never);
export const back = (fallback = "/") => (router.canGoBack() ? router.back() : router.replace(fallback as never));
