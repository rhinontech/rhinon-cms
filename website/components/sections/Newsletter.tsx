"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import GridLines from "@/components/ui/GridLines";
import { LineCta } from "@/components/ui/Buttons";
import { newsletter } from "@/lib/content";
import styles from "./Newsletter.module.css";

export default function Newsletter() {
  const [done, setDone] = useState(false);

  return (
    <section className={`section theme-dark ${styles.newsletter}`}>
      <GridLines />
      <form
        className={`grid4 ${styles.inner}`}
        onSubmit={(e) => {
          e.preventDefault();
          setDone(true);
        }}
      >
        <h2 className={styles.title}>{newsletter.title}</h2>
        <p className="mono">{newsletter.text}</p>
        <label className={styles.field}>
          <span className="mono">Your email</span>
          <input type="email" required placeholder="email@address.com" autoComplete="email" />
        </label>
        <div className={styles.ctaCol}>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.p key="ok" className={`mono ${styles.thanks}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <strong>Thanks — you’re on the list.</strong>
              </motion.p>
            ) : (
              <motion.div key="cta" exit={{ opacity: 0, y: -8 }}>
                <LineCta type="submit">{newsletter.cta}</LineCta>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </section>
  );
}
