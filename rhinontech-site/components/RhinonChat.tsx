"use client";

import { useEffect } from "react";

const INTERACTIONS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
/** Upper bound on the wait for a visitor who reads without touching anything. */
const IDLE_FALLBACK_MS = 6000;

/*
 * Starts the Rhinon chat widget in the browser, once — but only after the first interaction
 * or a few idle seconds, so its script, API calls and greeting never compete with the first
 * screen for bandwidth or the main thread.
 */
export default function RhinonChatLoader() {
  useEffect(() => {
    let started = false;
    let timer: number | undefined;

    const start = () => {
      if (started) return;
      started = true;
      cleanup();
      // Imported here so it never runs during server rendering.
      import("@rhinon/chat").then(({ default: RhinonChat }) => {
        RhinonChat({ app_id: "SX5RK2", api_url: "https://api.rhinontech.in/widget" });
      });
    };
    const cleanup = () => {
      INTERACTIONS.forEach((e) => window.removeEventListener(e, start));
      if (timer) window.clearTimeout(timer);
    };

    INTERACTIONS.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));
    timer = window.setTimeout(() => {
      if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 2000 });
      else start();
    }, IDLE_FALLBACK_MS);

    return cleanup;
  }, []);

  return null;
}
