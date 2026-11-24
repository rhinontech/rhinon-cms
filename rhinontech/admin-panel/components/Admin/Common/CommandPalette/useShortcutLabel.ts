"use client";

import { useEffect, useState } from "react";

/** "⌘K" on a Mac, "Ctrl K" elsewhere — decided after mount so the server and client markup agree. */
export function useShortcutLabel(): string {
  const [label, setLabel] = useState("⌘K");
  useEffect(() => {
    const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.userAgent;
    if (!/Mac|iPhone|iPad/i.test(platform)) setLabel("Ctrl K");
  }, []);
  return label;
}
