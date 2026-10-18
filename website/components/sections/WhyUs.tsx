"use client";

import { motion } from "motion/react";
import Eyebrow from "@/components/ui/Eyebrow";
import GridLines, { Cross } from "@/components/ui/GridLines";
import Reveal from "@/components/ui/Reveal";
import SplitText from "@/components/ui/SplitText";
import CountUp from "@/components/ui/CountUp";
import Rich from "@/components/ui/Rich";
import Logo from "@/components/ui/Logo";
import { Dots, GripDots } from "@/components/ui/Icons";
import { EASE_OUT } from "@/lib/motion";
import { why } from "@/lib/content";
import styles from "./WhyUs.module.css";

export default function WhyUs() {
  return (
    <section className={`section ${styles.why}`}>
      <GridLines crosses />

      <div className={styles.head}>
        <Eyebrow index={why.index} label={why.label} />
        <SplitText text={why.title} className={`display ${styles.title}`} />
      </div>

      <div className={`grid4 ${styles.row}`}>
        <Cross style={{ left: 0, top: 0 }} />
        <div className={`${styles.cell} ${styles.teamCell}`}>
          <div className={styles.teamTop}>
            <p className={styles.teamLabel}>{why.teamLabel}</p>
            <Logo className={styles.logo} />
            <GripDots className={styles.grip} />
          </div>
          <div className={styles.teamBottom}>
            <div className={styles.avatars}>
              {why.avatars.map((src, i) => (
                <motion.img
                  key={src}
                  src={src}
                  alt=""
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", damping: 20, stiffness: 200, delay: i * 0.08 }}
                />
              ))}
              <span>{why.teamCount}</span>
            </div>
            <p className="mono">
              <Rich text={why.teamNote} />
            </p>
          </div>
          <motion.span
            className={styles.bar}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: EASE_OUT, delay: 0.2 }}
          />
        </div>

        {why.cards.map((c, i) => (
          <div key={c.label} className={styles.cell}>
            <header className={`mono ${styles.label}`}>
              {c.label}
              <Dots count={i + 1} />
            </header>
            <Reveal delay={i * 0.08}>
              <p className={styles.text}>{c.text}</p>
            </Reveal>
            <div className={styles.metric}>
              <span className={styles.value}>
                /<CountUp value={c.value} suffix={c.suffix} />
              </span>
              <span className="mono">{c.note}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
