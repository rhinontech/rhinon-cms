"use client";

import { useEffect } from "react";

/**
 * Page-wide behaviour with no markup of its own:
 * - Lenis smooth scrolling, and smooth jumps for in-page "#" links
 * - scroll reveals: adds .is-in to [data-reveal] and [data-split] as they enter
 */
export default function SiteEffects() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: import("lenis").default | null = null;
    let raf = 0;
    let cancelled = false;

    import("lenis").then(({ default: Lenis }) => {
      if (reduce || cancelled) return;
      lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
      const loop = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const id = a?.getAttribute("href");
      if (!id || id === "#") return;
      const target = id === "#top" ? 0 : document.querySelector<HTMLElement>(id);
      if (target == null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -20, duration: 1.4 });
      else if (target === 0) window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    };
    document.addEventListener("click", onClick);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    document.querySelectorAll("[data-split], [data-reveal]").forEach((el) => io.observe(el));

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
      io.disconnect();
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
