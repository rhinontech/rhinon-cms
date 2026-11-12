"use client";

import Link from "next/link";
import { useRef } from "react";

/** A `.spot` card whose glow follows the cursor. Renders a link when given an href. */
export function Spot({
  href,
  className = "",
  dark = false,
  children,
}: {
  href?: string;
  className?: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const track = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  const cls = `spot ${dark ? "spot-dark" : ""} ${className}`;
  return href ? (
    <Link ref={ref as React.Ref<HTMLAnchorElement>} href={href} onPointerMove={track} className={cls}>
      {children}
    </Link>
  ) : (
    <div ref={ref as React.Ref<HTMLDivElement>} onPointerMove={track} className={cls}>
      {children}
    </div>
  );
}
