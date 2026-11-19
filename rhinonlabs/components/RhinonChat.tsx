"use client";

import { useEffect } from "react";

export default function RhinonChatLoader() {
  useEffect(() => {
    // Delay chat widget loading until the browser is idle so it never blocks main thread / hydration
    const loadChat = () => {
      import("@rhinon/chat").then(({ default: RhinonChat }) => {
        RhinonChat({ app_id: "3TGBGW", api_url: "https://api.rhinontech.in/widget" });
      });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
        loadChat,
        { timeout: 3500 }
      );
      return () => {
        if ("cancelIdleCallback" in window) {
          (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle);
        }
      };
    } else {
      const timer = setTimeout(loadChat, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
