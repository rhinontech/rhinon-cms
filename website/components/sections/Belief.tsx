"use client";

import { motion } from "motion/react";
import Eyebrow from "@/components/ui/Eyebrow";
import GridLines, { Cross } from "@/components/ui/GridLines";
import Reveal, { CurtainImage } from "@/components/ui/Reveal";
import ScrollText from "@/components/ui/ScrollText";
import { QuoteMark } from "@/components/ui/Icons";
import { belief } from "@/lib/content";
import { EASE_OUT } from "@/lib/motion";
import styles from "./Belief.module.css";

export default function Belief() {
  return (
    <section className={`section ${styles.belief}`}>
      <GridLines crosses />

      <div className={`grid4 ${styles.top}`}>
        <div className={styles.founder}>
          <CurtainImage src={belief.founder.photo} alt={belief.founder.name} className={styles.photo} />
          <Reveal className={styles.founderName}>
            <p className={styles.name}>{belief.founder.name}</p>
            <p className="mono">{belief.founder.role}</p>
          </Reveal>
        </div>

        <motion.div
          className={styles.mark}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE_OUT }}
        >
          <QuoteMark />
        </motion.div>

        <div className={styles.copy}>
          <Eyebrow index={belief.index} label={belief.label} />
          <ScrollText text={belief.quote} className={styles.quote} />
          <Reveal>
            <p className={`lead ${styles.lead}`}>{belief.lead}</p>
          </Reveal>
        </div>
      </div>

      <ol className={`grid4 ${styles.timeline}`}>
        {belief.timeline.map((t, i) => (
          <motion.li
            key={t.year}
            className={styles.event}
            style={{ marginTop: (3 - i) * 30 }}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ type: "spring", damping: 26, stiffness: 140, delay: i * 0.12 }}
          >
            <motion.span
              className={styles.eventBar}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.2 + i * 0.12 }}
            />
            <div className={styles.eventHead}>
              <span className={styles.year}>{t.year}</span>
              <img src={t.logo} alt="" />
            </div>
            <p className="mono">{t.text}</p>
            <Cross style={{ left: 0, top: "100%" }} />
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
