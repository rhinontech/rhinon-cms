"use client";

import { motion } from "motion/react";
import Eyebrow from "@/components/ui/Eyebrow";
import GridLines, { Cross } from "@/components/ui/GridLines";
import Reveal, { CurtainImage } from "@/components/ui/Reveal";
import ScrollText from "@/components/ui/ScrollText";
import SplitText from "@/components/ui/SplitText";
import Rich from "@/components/ui/Rich";
import { PillButton } from "@/components/ui/Buttons";
import { Play } from "@/components/ui/Icons";
import Logo from "@/components/ui/Logo";
import { company } from "@/lib/content";
import styles from "./Company.module.css";

export default function Company() {
  const { video, intro, services } = company;

  return (
    <section id="company" className={`section theme-dark ${styles.company}`}>
      <GridLines crosses />

      <div className={`grid4 ${styles.top}`}>
        <aside className={styles.videoCol}>
          <Reveal className={styles.videoCard}>
            <Cross style={{ left: 0, top: 0 }} />
            <Cross style={{ left: "100%", top: 0 }} />
            <Cross style={{ left: 0, top: "100%" }} />
            <Cross style={{ left: "100%", top: "100%" }} />
            <div className={styles.videoHead}>
              <span className="mono">{video.label}</span>
              <span className={`mono ${styles.duration}`}>
                <i /> <strong>{video.duration}</strong>
              </span>
            </div>
            <h3 className={styles.videoTitle}>{video.title}</h3>
            <button className={styles.thumb} aria-label="Play video">
              <CurtainImage src={video.thumb} alt="Team meeting in a glass office" className={styles.thumbImg} />
              <motion.span className={styles.play} whileHover={{ scale: 1.12 }} transition={{ type: "spring", bounce: 0.4 }}>
                <Play />
              </motion.span>
            </button>
          </Reveal>
          <Reveal delay={0.15}>
            <p className={`mono ${styles.videoNote}`}>
              <Rich text={video.note} />
            </p>
          </Reveal>
        </aside>

        <div className={styles.intro}>
          <Eyebrow index={intro.index} label={intro.label} />
          <ScrollText text={intro.text} className={styles.statement} />
          <Reveal className={styles.person}>
            <img src={intro.person.photo} alt="" />
            <p className="mono">
              <strong>{intro.person.name}</strong>
              <br />
              {intro.person.role}
            </p>
          </Reveal>
        </div>
      </div>

      <div className={`grid4 ${styles.servicesHead}`}>
        <div className={styles.servicesTitle}>
          <Eyebrow index={services.index} label={services.label} />
          <SplitText text={services.title} className="h-lg" stagger={0.04} />
        </div>
        <div className={styles.servicesLead}>
          <Reveal>
            <p className={styles.lead}>
              <Rich text={services.lead} />
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <PillButton href={services.cta.href} tone="light" className={styles.about}>
              {services.cta.label}
            </PillButton>
          </Reveal>
          <Logo className={styles.miniLogo} />
        </div>
      </div>

      <ol className={styles.list}>
        {services.items.map((s, i) => (
          <li key={s.title} className={`grid4 ${styles.row}`}>
            <Cross style={{ left: 0, top: 0 }} />
            <Cross style={{ left: "100%", top: 0 }} />
            <Reveal className={styles.num}>/{String(i + 1).padStart(2, "0")}</Reveal>
            <Reveal className={styles.rowTitle} delay={0.05}>
              <h3 className="h-md">{s.title}</h3>
            </Reveal>
            <div className={styles.rowMedia}>
              <CurtainImage src={s.image} alt="" className={styles.rowImg} />
            </div>
            <Reveal className={styles.rowText} delay={0.1}>
              <p className="mono">{s.text}</p>
              <p className={`mono ${styles.tags}`}>
                {s.tags.map((t) => (
                  <span key={t}>
                    <span className={styles.hash}>#</span>
                    <strong>{t}</strong>
                  </span>
                ))}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
