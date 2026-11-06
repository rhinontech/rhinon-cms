"use client";

import { useEffect } from "react";

/* Starts the Rhinon chat widget in the browser, once. */
export default function RhinonChatLoader() {
  useEffect(() => {
    // Imported here so it never runs during server rendering.
    import("@rhinon/chat").then(({ default: RhinonChat }) => {
      RhinonChat({ app_id: "SX5RK2", api_url: "https://api.rhinontech.in/widget" });
    });
  }, []);

  return null;
}
