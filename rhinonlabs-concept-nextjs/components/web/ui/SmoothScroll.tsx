"use client";

import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

// Smooth wheel scrolling (the original used Lenis too) plus smooth in-page anchors.
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.1, autoRaf: true, anchors: true });
    window.__lenis = lenis;
    return () => {
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return null;
}

export function scrollToTop() {
  if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.6 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}
