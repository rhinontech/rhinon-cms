"use client";

import { motion } from "motion/react";
import Eyebrow from "@/components/ui/Eyebrow";
import GridLines, { Cross } from "@/components/ui/GridLines";
import Reveal, { CurtainImage } from "@/components/ui/Reveal";
import SplitText from "@/components/ui/SplitText";
import Rich from "@/components/ui/Rich";
import { LineCta } from "@/components/ui/Buttons";
import { Dots, GripDots, LogoMark } from "@/components/ui/Icons";
import { team } from "@/lib/content";
import styles from "./Team.module.css";

const TICKS = 22;

function SkillBar({ level, delay }: { level: number; delay: number }) {
  const filled = Math.round(level * TICKS);
  return (
    <span className={styles.barcode} aria-label={`${Math.round(level * 100)}%`} role="img">
      {Array.from({ length: TICKS }, (_, i) => (
        <motion.i
          key={i}
          initial={{ opacity: 0.18 }}
          whileInView={{ opacity: i < filled ? 1 : 0.18 }}
          viewport={{ once: true, amount: 1 }}
          transition={{ duration: 0.2, delay: delay + i * 0.025 }}
        />
      ))}
    </span>
  );
}

export default function Team() {
  return (
    <section id="team" className={`section ${styles.team}`}>
      <GridLines crosses />
      <img src="/images/gradient-arc.png" alt="" className={styles.arc} aria-hidden="true" />

      <div className={styles.head}>
        <Eyebrow index={team.index} label={team.label} />
        <SplitText text={team.title} className={`display ${styles.title}`} />
      </div>

      <div className={`grid4 ${styles.cards}`}>
        {team.members.map((m, i) => (
          <motion.article
            key={m.name}
            className={styles.card}
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ type: "spring", damping: 26, stiffness: 120, delay: i * 0.1 }}
          >
            <header className={`mono ${styles.role}`}>
              {m.role}
              <Dots count={i + 1} />
            </header>
            <div className={styles.photo}>
              <CurtainImage src={m.photo} alt={m.name} className={styles.photoImg} delay={i * 0.1} />
              <span className={styles.gradientBar} />
            </div>
            <div className={styles.nameRow}>
              <LogoMark className={styles.mark} />
              <div>
                <h3 className={styles.name}>{m.name}</h3>
                <p className="mono">{m.note}</p>
              </div>
              <GripDots className={styles.grip} />
            </div>
            <ul className={styles.skills}>
              {m.skills.map(({ label, level }, si) => (
                <li key={label}>
                  <SkillBar level={level} delay={0.2 + si * 0.15} />
                  <span className="mono">
                    <strong>{label}</strong>
                  </span>
                </li>
              ))}
            </ul>
            <Cross style={{ left: 0, top: "100%" }} />
          </motion.article>
        ))}
      </div>

      <div className={`grid4 ${styles.bottom}`}>
        <SplitText text={team.statement} className={`${styles.statement}`} stagger={0.04} />
        <div className={styles.ctaCol}>
          <Reveal>
            <LineCta href={team.cta.href}>{team.cta.label}</LineCta>
          </Reveal>
          <Reveal delay={0.1}>
            <p className={`mono ${styles.note}`}>
              <Rich text={team.note} />
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
