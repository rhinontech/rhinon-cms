"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";

const spring = { type: "spring", damping: 27, mass: 0.3, stiffness: 219 } as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  y?: number;
  x?: number;
  amount?: number;
};

// Fade/slide in once the element enters the viewport.
export default function Reveal({ children, delay = 0, y = 40, x = 0, className, style, amount = 0.25 }: RevealProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, amount }}
      transition={{ ...spring, delay, opacity: { duration: 0.6, delay } }}
    >
      {children}
    </motion.div>
  );
}

type CurtainImageProps = {
  src: string;
  alt?: string;
  className?: string;
  position?: string;
  delay?: number;
  /** Animate on mount instead of on scroll-into-view (above-the-fold images). */
  immediate?: boolean;
};

/** Image that unveils behind a curtain then settles from a zoom — the original's image entrance. */
export function CurtainImage({ src, alt = "", className, position = "center", delay = 0, immediate }: CurtainImageProps) {
  const trigger = immediate
    ? { animate: "show" }
    : { whileInView: "show", viewport: { once: true, amount: 0.2 } };
  return (
    <motion.div className={className} style={{ position: "relative", overflow: "hidden" }} initial="hidden" {...trigger}>
      <motion.img
        src={src}
        alt={alt}
        loading={immediate ? "eager" : "lazy"}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: position, display: "block" }}
        variants={{
          hidden: { scale: 1.4, opacity: 0 },
          show: { scale: 1, opacity: 1, transition: { duration: 1.6, ease: [0.68, 0, 0, 1], delay } },
        }}
      />
      <motion.span
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: "var(--bg)", transformOrigin: "center top", pointerEvents: "none" }}
        variants={{
          hidden: { scaleY: 1 },
          show: { scaleY: 0, transition: { duration: 1.2, ease: [0.68, 0, 0, 1], delay } },
        }}
      />
    </motion.div>
  );
}
