"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Eyebrow from "@/components/web/ui/Eyebrow";
import GridLines, { Cross } from "@/components/web/ui/GridLines";
import Reveal from "@/components/web/ui/Reveal";
import SplitText from "@/components/web/ui/SplitText";
import CountUp from "@/components/web/ui/CountUp";
import Rich from "@/components/web/ui/Rich";
import Logo from "@/components/web/ui/Logo";
import { Calendar } from "@/components/web/ui/Icons";
import { advantages } from "@/lib/web/content";
import styles from "./Advantages.module.css";

function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 79 58" fill="currentColor" aria-hidden="true">
      <path d="M21.9438 29C21.9438 45.0163 34.7162 58 50.4719 58C66.2275 58 79 45.0163 79 29C79 12.9837 66.2275 0 50.4719 0C34.7162 0 21.9438 12.9837 21.9438 29Z" />
      <path d="M18.9145 1.79855C7.89493 5.7584 0 16.4418 0 28.9998C0 41.5577 7.89493 52.2411 18.9145 56.201V1.79855Z" />
    </svg>
  );
}

export default function Advantages() {
  const phoneRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: phoneRef, offset: ["start end", "end start"] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [120, -80]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], [5, -2]);
  const glowScale = useTransform(scrollYProgress, [0, 0.6], [0.85, 1.15]);

  return (
    <section className={`section ${styles.advantages}`}>
      <GridLines crosses />

      <div className={`grid4 ${styles.top}`}>
        <div className={styles.left}>
          <Eyebrow index={advantages.index} label={advantages.label} />
          <SplitText text={advantages.title} className={`display ${styles.title}`} mutedClass={styles.titleMuted} />
          <Reveal delay={0.2}>
            <p className={`lead ${styles.lead}`}>{advantages.lead}</p>
          </Reveal>
        </div>

        <div className={styles.right}>
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", bounce: 0.35, duration: 1 }}
          >
            <BrandMark className={styles.mark} />
          </motion.div>
          <SplitText text={advantages.listTitle} as="h3" className={styles.listTitle} mutedClass={styles.titleMuted} />
          <ul className={styles.list}>
            {advantages.items.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ type: "spring", damping: 26, stiffness: 180, delay: i * 0.08 }}
              >
                <Cross style={{ left: 0, top: "100%" }} />
                <span className={styles.badge}>{String(i + 1).padStart(2, "0")}</span>
                <span className={`mono ${styles.item}`}>
                  <Rich text={item} />
                </span>
              </motion.li>
            ))}
          </ul>
          <Reveal className={`mono ${styles.source}`} y={10}>
            <span>{advantages.source.label}</span>
            <strong>{advantages.source.value}</strong>
            <span className={styles.date}>
              <Calendar className={styles.calendar} />
              <strong>{advantages.source.date}</strong>
            </span>
          </Reveal>
        </div>
      </div>

      <div className={styles.panel} ref={phoneRef}>
        <div className={styles.stats}>
          {advantages.stats.map((s) => (
            <div key={s.label} className={styles.stat}>
              <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} className={styles.statValue} />
              <span className="mono">{s.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.mobileCopy}>
          <Eyebrow label={advantages.mobile.label} />
          <SplitText text={advantages.mobile.title} className={`h-lg ${styles.mobileTitle}`} />
          <Reveal delay={0.15}>
            <p className="lead">{advantages.mobile.lead}</p>
          </Reveal>
        </div>

        <Logo className={styles.panelLogo} />

        <motion.img src="/images/phone-glow.png" alt="" className={styles.glow} style={{ scale: glowScale }} />
        <motion.img
          src="/images/phone-hand.png"
          alt="Hand holding a phone"
          className={styles.phone}
          style={{ y: phoneY, rotate: phoneRotate }}
        />
      </div>
    </section>
  );
}
