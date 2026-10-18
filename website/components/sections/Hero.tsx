"use client";

import { motion } from "motion/react";
import { CurtainImage } from "@/components/ui/Reveal";
import { PillButton } from "@/components/ui/Buttons";
import GridLines from "@/components/ui/GridLines";
import Rich from "@/components/ui/Rich";
import { Plus } from "@/components/ui/Icons";
import { hero, site } from "@/lib/content";
import styles from "./Hero.module.css";

import { spring, EASE_OUT } from "@/lib/motion";

function Letters({ text, delay }: { text: string; delay: number }) {
  return (
    <>
      {text.split(" ").map((word, wi) => (
        <span key={wi} className={styles.word}>
          {[...word].map((c, ci) => (
            <motion.span
              key={ci}
              className={styles.letter}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{ ...spring(delay + (wi * 4 + ci) * 0.035), opacity: { duration: 0.3, delay: delay + (wi * 4 + ci) * 0.035 } }}
            >
              {c}
            </motion.span>
          ))}
        </span>
      ))}
    </>
  );
}

export default function Hero() {
  return (
    <section id="top" className={`section ${styles.hero}`} data-section="hero">
      <CurtainImage
        immediate
        src="/images/hero-portrait.jpg"
        alt="Portrait of a woman with digital abstract effects and color overlays"
        className={styles.image}
        position="right center"
      />
      <GridLines />

      <motion.a
        href={site.bookingUrl}
        target="_blank"
        rel="noreferrer"
        className={styles.callout}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring(0.8)}
      >
        <p className="mono">
          <Rich text={hero.callout} />
        </p>
        <span className={styles.calloutAvatar}>
          <img src="/images/contact-avatar.jpg" alt="" />
        </span>
        <span className={styles.calloutPlus}>
          <Plus />
        </span>
      </motion.a>

      <div className={styles.content}>
        <motion.div className={styles.rating} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring(0.2)}>
          <div className={styles.avatars}>
            {hero.avatars.map((src, i) => (
              <motion.span
                key={src}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.35, duration: 0.7, delay: 0.35 + i * 0.07 }}
              >
                <img src={src} alt="" />
              </motion.span>
            ))}
          </div>
          <div>
            <p className={`mono ${styles.score}`}>
              <span className={styles.stars} aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
              <strong>{hero.rating}</strong>
            </p>
            <p className="mono">
              <Rich text={hero.ratingNote} />
            </p>
          </div>
        </motion.div>

        <h1 className={styles.title} aria-label={`${hero.title} ${hero.subtitle}`}>
          <span className={styles.titleMain} aria-hidden="true">
            <Letters text={hero.title} delay={0.3} />
          </span>
        </h1>
        <p className={styles.subtitle} aria-hidden="true">
          <Letters text={hero.subtitle} delay={0.65} />
        </p>

        <motion.p
          className={styles.lead}
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 1, ease: EASE_OUT }}
        >
          <Rich text={hero.lead} />
        </motion.p>

        <motion.div className={styles.buttons} initial={{ y: 250 }} animate={{ y: 0 }} transition={spring(0.1)}>
          <PillButton href={hero.primary.href}>{hero.primary.label}</PillButton>
          <PillButton href={hero.secondary.href} tone="light">
            {hero.secondary.label}
          </PillButton>
        </motion.div>

        <motion.div className={styles.ticker} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.2 }}>
          <div className={styles.track}>
            {[...hero.clients, ...hero.clients].map((src, i) => (
              <img key={i} src={src} alt="" aria-hidden={i >= hero.clients.length} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
