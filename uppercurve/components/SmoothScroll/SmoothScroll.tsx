"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.2,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // This instance outlives every page, because it lives in the root layout.
    // While a wheel glide is running, Lenis ignores native scroll events — so
    // the router's jump to the top of a new page (or the browser restoring the
    // list on Back) was overwritten a frame later by the glide carrying on
    // toward its old target. Freezing the glide the moment a navigation starts
    // lets the router's scroll stand.
    const settle = () => lenis.scrollTo(window.scrollY, { immediate: true, force: true });

    // Global smooth scroll click handler for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (href && href.startsWith("#") && href.length > 1) {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          lenis.scrollTo(targetElement as HTMLElement, { offset: -20 });
        }
      }
    };

    // Capture phase: next/link calls preventDefault in its own handler, so by
    // the bubble phase a route change is indistinguishable from a cancelled click.
    const handleRouteClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement).closest("a");
      const href = anchor?.getAttribute("href");
      if (!anchor || !href || href.startsWith("#") || anchor.target === "_blank") return;
      if (new URL(anchor.href, window.location.href).origin !== window.location.origin) return;
      settle();
    };

    document.addEventListener("click", handleAnchorClick);
    document.addEventListener("click", handleRouteClick, true);
    window.addEventListener("popstate", settle);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      document.removeEventListener("click", handleRouteClick, true);
      window.removeEventListener("popstate", settle);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // After every route change: re-measure (the new page is a different height)
  // and adopt wherever the router left the scroll — the top of a new page, or
  // the restored position on Back.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    lenis.resize();
    lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
