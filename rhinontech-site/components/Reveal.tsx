"use client";

import { useEffect, useRef } from "react";

/**
 * Fades a block up the first time it scrolls onto the screen. Content is visible
 * in the server HTML; only blocks that start below the fold are "armed" (hidden)
 * after hydration, so the first screen never waits for JavaScript to paint.
 * One observer per block; once shown it stays shown.
 */
export function Reveal({ children, className = "", delay = 0, as: Tag = "div" }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already on screen at load: leave it visible, no entrance animation.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.dataset.armed = "true";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.shown = "true";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ "--delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </Tag>
  );
}
