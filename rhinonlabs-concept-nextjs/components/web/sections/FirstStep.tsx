"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Eyebrow from "@/components/web/ui/Eyebrow";
import GridLines from "@/components/web/ui/GridLines";
import Reveal from "@/components/web/ui/Reveal";
import SplitText from "@/components/web/ui/SplitText";
import { firstStep } from "@/lib/web/content";
import styles from "./FirstStep.module.css";

export default function FirstStep() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);
  const portraitY = useTransform(scrollYProgress, [0, 1], [140, -60]);
  const lineScale = useTransform(scrollYProgress, [0.3, 0.55], [0, 1]);

  return (
    <section ref={ref} className={`section theme-dark ${styles.first}`}>
      <motion.img src={firstStep.background} alt="" className={styles.bg} style={{ scale: bgScale }} />
      <GridLines crosses />

      <motion.img
        src={firstStep.portrait}
        alt="Client success manager standing with hands in pockets"
        className={styles.portrait}
        style={{ y: portraitY }}
      />

      <div className={`grid4 ${styles.inner}`}>
        <div className={styles.content}>
          <Eyebrow index={firstStep.index} label={firstStep.label} />
          <SplitText text={firstStep.title} className={`display ${styles.title}`} />
          <div className={styles.quoteBlock}>
            <motion.span className={styles.rule} style={{ scaleY: lineScale }} />
            <Reveal delay={0.1}>
              <p className={styles.quote}>{firstStep.quote}</p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mono">
                <strong>{firstStep.person.name}</strong>
                <br />
                {firstStep.person.role}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
