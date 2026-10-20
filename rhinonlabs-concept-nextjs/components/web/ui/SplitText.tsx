"use client";

import { motion } from "motion/react";
import { toneWords, plain } from "./Rich";
import { muted } from "./styles";

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  mutedClass?: string;
  delay?: number;
  stagger?: number;
  /** Play on mount instead of when scrolled into view. */
  onMount?: boolean;
};

// Headline that rises in word by word, each word clipped by its own mask.
export default function SplitText({ text, as = "h2", className, mutedClass = muted, delay = 0, stagger = 0.05, onMount = false }: Props) {
  const Tag = motion[as];
  const words = toneWords(text);
  const trigger = onMount ? { animate: "show" } : { whileInView: "show", viewport: { once: true, amount: 0.4 } };

  return (
    <Tag className={className} initial="hidden" {...trigger} aria-label={plain(text)}>
      {words.map(({ w, tone }, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="-mb-[0.08em] inline-block overflow-hidden pb-[0.08em] align-top"
        >
          <motion.span
            className={tone === "muted" ? `inline-block whitespace-pre ${mutedClass}` : "inline-block whitespace-pre"}
            variants={{
              hidden: { y: "110%" },
              show: { y: "0%", transition: { type: "spring", damping: 26, stiffness: 160, mass: 0.6, delay: delay + i * stagger } },
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
