"use client";

import { useMotionTemplate, useMotionValue, motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Aceternity-style card spotlight: a radial glow that follows the cursor.
 * Wraps the site's standard glass card styling.
 */
export function SpotlightCard({
  children,
  className,
  radius = 320,
  color = "rgba(28, 43, 255, 0.18)",
}: {
  children: React.ReactNode;
  className?: string;
  radius?: number;
  color?: string;
}) {
  const x = useMotionValue(-radius);
  const y = useMotionValue(-radius);
  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${x}px ${y}px, ${color}, transparent 80%)`;

  return (
    <div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
      onMouseLeave={() => { x.set(-radius); y.set(-radius); }}
      className={cn(
        "group/spotlight relative overflow-hidden rounded-2xl bg-color-card border border-border/7 shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)]",
        className,
      )}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100"
        style={{ background }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
