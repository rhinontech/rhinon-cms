"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Eyebrow from "@/components/ui/Eyebrow";
import GridLines from "@/components/ui/GridLines";
import Reveal from "@/components/ui/Reveal";
import SplitText from "@/components/ui/SplitText";
import ScrollText from "@/components/ui/ScrollText";
import CountUp from "@/components/ui/CountUp";
import Logo from "@/components/ui/Logo";
import { LineCta } from "@/components/ui/Buttons";
import { GripDots, QuoteMark } from "@/components/ui/Icons";
import { caseStudy } from "@/lib/content";
import styles from "./CaseStudy.module.css";

export default function CaseStudy() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section id="case" ref={ref} className={`section ${styles.case}`}>
      <div className={styles.left}>
        <GridLines />
        <div className={styles.info}>
          <div className={styles.head}>
            <Eyebrow index={caseStudy.index} label={caseStudy.label} />
            <Logo className={styles.logo} />
          </div>
          <SplitText text={caseStudy.title} className={`h-lg ${styles.title}`} />
          <Reveal delay={0.15}>
            <p className={`lead ${styles.lead}`}>{caseStudy.lead}</p>
          </Reveal>
          <dl className={styles.meta}>
            {caseStudy.meta.map((m, i) => (
              <Reveal key={m.label} className={styles.metaRow} y={16} delay={i * 0.06}>
                <dt className="mono">{m.label}</dt>
                <dd className="mono">
                  <strong>{m.value}</strong>
                </dd>
              </Reveal>
            ))}
          </dl>
          <div className={styles.cta}>
            <LineCta href={caseStudy.cta.href}>{caseStudy.cta.label}</LineCta>
          </div>
        </div>

        <div className={`theme-dark ${styles.stats}`}>
          {caseStudy.stats.map((s) => (
            <div key={s.label} className={styles.stat}>
              <p className="mono">{s.label}</p>
              <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} className={styles.statValue} />
              <GripDots className={styles.grip} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <motion.img src={caseStudy.image} alt="" className={styles.bg} style={{ y: bgY }} />
        <div className={styles.shade} />
        <div className={styles.quoteWrap}>
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", bounce: 0.35, duration: 0.9 }}
          >
            <QuoteMark className={styles.quoteMark} />
          </motion.div>
          <ScrollText as="blockquote" text={caseStudy.quote} className={styles.quote} offset={["start 0.8", "end 0.55"]} />
          <Reveal className={styles.author}>
            <img src={caseStudy.author.photo} alt="" />
            <p className="mono">
              <strong>{caseStudy.author.name}</strong>
              <br />
              {caseStudy.author.role}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
