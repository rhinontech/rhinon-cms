"use client";

import { motion } from "motion/react";
import Eyebrow from "@/components/ui/Eyebrow";
import GridLines from "@/components/ui/GridLines";
import Reveal from "@/components/ui/Reveal";
import SplitText from "@/components/ui/SplitText";
import RollText from "@/components/ui/RollText";
import { ArrowUpRight } from "@/components/ui/Icons";
import { news } from "@/lib/content";
import styles from "./News.module.css";

export default function News() {
  return (
    <section id="news" className={`section ${styles.news}`}>
      <GridLines crosses />

      <div className={`grid4 ${styles.head}`}>
        <div className={styles.titleCol}>
          <Eyebrow index={news.index} label={news.label} />
          <SplitText text={news.title} className={`display ${styles.title}`} />
        </div>
        <Reveal className={styles.allCol}>
          <a href="#news" className={`${styles.all} roll-host`}>
            <RollText text={news.allLabel} />
            <ArrowUpRight className={styles.arrow} />
          </a>
        </Reveal>
      </div>

      <div className={`grid4 ${styles.posts}`}>
        {news.posts.map((p, i) => (
          <motion.a
            key={p.title}
            href="#news"
            className={styles.post}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: "spring", damping: 26, stiffness: 140, delay: i * 0.08 }}
          >
            <p className={`mono ${styles.date}`}>
              <i /> {p.date}
            </p>
            <div className={styles.media}>
              <img src={p.image} alt="" loading="lazy" />
            </div>
            <h3 className={styles.postTitle}>{p.title}</h3>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
