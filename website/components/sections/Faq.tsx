"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Eyebrow from "@/components/ui/Eyebrow";
import GridLines from "@/components/ui/GridLines";
import Reveal from "@/components/ui/Reveal";
import SplitText from "@/components/ui/SplitText";
import { LineCta } from "@/components/ui/Buttons";
import { faq } from "@/lib/content";
import { EASE_OUT } from "@/lib/motion";
import styles from "./Faq.module.css";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const { contact } = faq;

  return (
    <section className={`section ${styles.faq}`}>
      <GridLines crosses />

      <div className={`grid4 ${styles.head}`}>
        <Eyebrow index={faq.index} label={faq.label} className={styles.eyebrow} />
        <SplitText text={faq.title} className={`display ${styles.title}`} />
      </div>

      <div className={`grid4`}>
        <ul className={styles.list}>
          {faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className={styles.item}>
                <button className={styles.question} onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                  <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.qText}>{item.q}</span>
                  <span className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`} aria-hidden="true">
                    <i />
                    <i />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: EASE_OUT }}
                      className={styles.answerWrap}
                    >
                      <p className={`mono ${styles.answer}`}>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`grid4 ${styles.contact}`}>
        <Eyebrow label={contact.label} className={styles.eyebrow} />
        <div className={styles.unsure}>
          <SplitText text={contact.title} className="h-lg" />
          <Reveal className={styles.cta}>
            <LineCta href={contact.cta.href}>{contact.cta.label}</LineCta>
          </Reveal>
        </div>
        <Reveal className={styles.quoteCol}>
          <p className={styles.quote}>{contact.quote}</p>
          <div className={styles.person}>
            <img src={contact.person.photo} alt="" />
            <p className="mono">
              <strong>{contact.person.name}</strong>
              <br />
              {contact.person.role}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
