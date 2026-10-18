"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import Eyebrow from "@/components/ui/Eyebrow";
import GridLines from "@/components/ui/GridLines";
import { moreCases } from "@/lib/content";
import styles from "./MoreCases.module.css";

export default function MoreCases() {
  const [active, setActive] = useState<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 26, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 26, mass: 0.6 });

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };

  return (
    <section id="more-cases" className={`section ${styles.more}`} onMouseMove={onMove}>
      <GridLines crosses />
      <div className={`grid4 ${styles.inner}`}>
        <Eyebrow label={moreCases.label} className={styles.eyebrow} />
        <ul className={styles.list} onMouseLeave={() => setActive(null)}>
          {moreCases.items.map((c, i) => (
            <motion.li
              key={c.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ type: "spring", damping: 26, stiffness: 170, delay: i * 0.05 }}
            >
              <a
                href="#more-cases"
                className={`${styles.item} ${active !== null && active !== i ? styles.dim : ""}`}
                onMouseEnter={() => setActive(i)}
              >
                <span className={styles.name}>{c.name}</span>
                <sup className={styles.year}>{c.year}</sup>
              </a>
            </motion.li>
          ))}
        </ul>
      </div>

      <motion.div className={styles.preview} style={{ x: sx, y: sy }} aria-hidden="true">
        <AnimatePresence>
          {active !== null && (
            <motion.div
              key={active}
              className={styles.card}
              initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
            >
              <img src={moreCases.items[active].image} alt="" className={styles.cardImg} />
              <img src={moreCases.items[active].logo} alt="" className={styles.cardLogo} />
              <p>{moreCases.items[active].blurb}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
