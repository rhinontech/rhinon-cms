"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { HEADING_GRADIENT } from "./palette";

export const scrollVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

interface SectionHeadingProps {
  badge: string;
  /** Rendered before the italic serif accent. */
  title: React.ReactNode;
  accent?: string;
  subtitle?: string;
  /** Badge tint — lets each section carry its own colour. */
  badgeClass?: string;
}

/** The badge + gradient headline pairing used across every section of this page. */
export function SectionHeading({
  badge,
  title,
  accent,
  subtitle,
  badgeClass = "border-blue-400/30 bg-blue-500/10 text-blue-200",
}: SectionHeadingProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={scrollVariant}
      className="flex flex-col items-center text-center mb-16"
    >
      <div
        className={`mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md ${badgeClass}`}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase font-sans">{badge}</span>
      </div>
      <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white to-white/60 max-w-3xl leading-[1.15] py-1">
        {title}
        {accent ? (
          <>
            {" "}
            <span className={`font-serif italic ${HEADING_GRADIENT}`}>{accent}</span>
          </>
        ) : null}
      </h2>
      {subtitle ? <p className="opacity-60 mt-5 max-w-2xl">{subtitle}</p> : null}
    </motion.div>
  );
}
