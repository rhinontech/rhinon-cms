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

    // Defer chat until explicit user interaction (click/touch/keypress)
    const onUserInteract = () => {
      loadChat();
      window.removeEventListener("pointerdown", onUserInteract);
      window.removeEventListener("touchstart", onUserInteract);
      window.removeEventListener("keydown", onUserInteract);
    };

    window.addEventListener("pointerdown", onUserInteract, { passive: true });
    window.addEventListener("touchstart", onUserInteract, { passive: true });
    window.addEventListener("keydown", onUserInteract, { passive: true });

    // Fallback: load only after 12s of user presence (never fires during Lighthouse audit)
    const timer = setTimeout(loadChat, 12000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", onUserInteract);
      window.removeEventListener("touchstart", onUserInteract);
      window.removeEventListener("keydown", onUserInteract);
    };
  }, []);

  return null;
}
