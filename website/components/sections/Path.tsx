"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionTemplate, useMotionValue } from "motion/react";
import Eyebrow from "@/components/ui/Eyebrow";
import GridLines, { Cross } from "@/components/ui/GridLines";
import Reveal from "@/components/ui/Reveal";
import SplitText from "@/components/ui/SplitText";
import Rich from "@/components/ui/Rich";
import { LineCta } from "@/components/ui/Buttons";
import { GripDots } from "@/components/ui/Icons";
import { path } from "@/lib/content";
import { EASE_OUT } from "@/lib/motion";
import styles from "./Path.module.css";

function Pie({ value }: { value: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const slice = useMotionValue(0);
  const background = useMotionTemplate`conic-gradient(#f5f5f5 0 ${slice}%, #171717 ${slice}% 100%)`;

  useEffect(() => {
    if (!inView) return;
    const controls = animate(slice, value, { duration: 1.6, ease: EASE_OUT });
    return () => controls.stop();
  }, [inView, slice, value]);

  return <motion.div ref={ref} className={styles.pie} style={{ background }} aria-label={`${value}%`} role="img" />;
}

export default function Path() {
  return (
    <section id="path" className={`section ${styles.path}`}>
      <GridLines crosses />

      <div className={`grid4 ${styles.top}`}>
        <div className={styles.left}>
          <Eyebrow index={path.index} label={path.label} />
          <SplitText text={path.title} className={`display ${styles.title}`} mutedClass={styles.muted} />
          <Reveal delay={0.2}>
            <p className={`lead ${styles.lead}`}>{path.lead}</p>
          </Reveal>
          <Reveal className={styles.cta}>
            <LineCta href={path.cta.href}>{path.cta.label}</LineCta>
          </Reveal>
        </div>

        <div className={styles.right}>
          <div className={styles.steps}>
            <Cross style={{ left: "50%", top: "50%" }} />
            {path.steps.map((step, i) => (
              <motion.article
                key={step}
                className={styles.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ type: "spring", damping: 26, stiffness: 170, delay: i * 0.08 }}
                whileHover={{ backgroundColor: "#fafafa" }}
              >
                <span className={styles.stepNum}>{String(i + 1).padStart(2, "0")}/</span>
                <GripDots className={styles.grip} />
                <p className="mono">{step}</p>
              </motion.article>
            ))}
          </div>

          <div className={styles.pieWrap}>
            <Pie value={path.pie.value} />
            <Reveal y={16}>
              <p className={`mono ${styles.pieNote}`}>
                <Rich text={path.pie.note} />
              </p>
            </Reveal>
          </div>
        </div>
      </div>

      <div className={styles.delay}>
        <Eyebrow label={path.delay.label} />
        <SplitText text={path.delay.title} className={`h-lg ${styles.delayTitle}`} mutedClass={styles.mutedDark} stagger={0.03} />

        <ul className={styles.bars}>
          {path.delay.rows.map((row, i) => (
            <li key={row.tag} className={styles.bar}>
              <motion.div
                className={styles.fill}
                initial={{ width: "0%" }}
                whileInView={{ width: `${row.value * 0.9}%` }}
                viewport={{ once: true, amount: 0.9 }}
                transition={{ duration: 1.4, ease: EASE_OUT, delay: i * 0.1 }}
              >
                <span className={styles.pill}>+{row.value}%</span>
              </motion.div>
              <span className={`mono ${styles.barText}`}>
                <span className={styles.barNum}>{String(i + 1).padStart(2, "0")}/</span>
                <Rich text={row.text} />
              </span>
              <span className={`mono ${styles.barTag}`}>{row.tag}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
