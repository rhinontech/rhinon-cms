"use client";

import { useEffect } from "react";

export default function RhinonChatLoader() {
  useEffect(() => {
    // Imported here so it never runs during server rendering.
    import("@rhinon/chat").then(({ default: RhinonChat }) => {
      RhinonChat({ app_id: "3TGBGW", api_url: "https://api.rhinontech.in/widget" });
    });
  }, []);

  return null;
}
