"use client";

import { useEffect } from "react";

export default function RhinonChatLoader() {
  useEffect(() => {
    let loaded = false;
    const loadChat = () => {
      if (loaded) return;
      loaded = true;
      import("@rhinon/chat")
        .then(({ default: RhinonChat }) => {
          RhinonChat({ app_id: "3TGBGW", api_url: "https://api.rhinontech.in/widget" });
        })
        .catch(() => {});
    };

    // Defer until first user interaction or fallback timeout (4s)
    const onUserInteract = () => {
      loadChat();
      window.removeEventListener("scroll", onUserInteract);
      window.removeEventListener("pointerdown", onUserInteract);
      window.removeEventListener("touchstart", onUserInteract);
    };

    window.addEventListener("scroll", onUserInteract, { passive: true });
    window.addEventListener("pointerdown", onUserInteract, { passive: true });
    window.addEventListener("touchstart", onUserInteract, { passive: true });

    const timer = setTimeout(loadChat, 4000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onUserInteract);
      window.removeEventListener("pointerdown", onUserInteract);
      window.removeEventListener("touchstart", onUserInteract);
    };
  }, []);

  return null;
}
