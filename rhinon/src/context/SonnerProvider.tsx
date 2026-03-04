"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function SonnerProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="bottom-right" // change from "top-center" to "top-right"
      theme={theme as "light" | "dark" | "system"}
      closeButton
      richColors
    />
  );
}
