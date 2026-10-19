"use client";

// 01 The problem — the video + scroll-ink statement layout from
// website/components/sections/Company.tsx (its top half), with the concept's problem copy.
import { motion } from "motion/react";
import GridLines, { Cross } from "@/components/web/ui/GridLines";
import Reveal, { CurtainImage } from "@/components/web/ui/Reveal";
import Rich from "@/components/web/ui/Rich";
import { Play } from "@/components/web/ui/Icons";
import { problem } from "@/lib/web/content";
import styles from "./Problem.module.css";

export default function Problem() {
  const { video } = problem;

  return (
    <section id="why" className={`section theme-dark ${styles.company}`}>
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
              <CurtainImage src={video.thumb} alt="Product team reviewing app screens" className={styles.thumbImg} />
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

        {/* Right column: the concept's original statement markup and classes, unchanged —
            its scroll fill ([data-fill]) and reveals are driven by HomepageClient.js. */}
        <div className={styles.intro}>
          <p className="kicker mono">
            <span className="idx">01</span>The problem
          </p>
          <p className="statement__text" data-fill="">
            Your team isn&rsquo;t slow. <em>Your systems are.</em> Data gets copied between tools,
            follow-ups live in someone&rsquo;s memory, and every answer starts with &ldquo;let me
            check.&rdquo; We find the manual work hiding in your business — and build the{" "}
            <em>systems</em> that take it off your plate.
          </p>
          <ul className="statement__facts mono">
            <li data-reveal="">
              <span className="tick" aria-hidden="true">✓</span>
              Built around the tools you already use
            </li>
            <li data-reveal="" style={{ "--d": "90ms" } as React.CSSProperties}>
              <span className="tick" aria-hidden="true">✓</span>
              You own the code and the data
            </li>
            <li data-reveal="" style={{ "--d": "180ms" } as React.CSSProperties}>
              <span className="tick" aria-hidden="true">✓</span>
              Optional support after launch
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
