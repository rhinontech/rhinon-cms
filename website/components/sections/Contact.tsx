"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Eyebrow from "@/components/ui/Eyebrow";
import GridLines, { Cross } from "@/components/ui/GridLines";
import Reveal from "@/components/ui/Reveal";
import SplitText from "@/components/ui/SplitText";
import RollText from "@/components/ui/RollText";
import Rich from "@/components/ui/Rich";
import Logo from "@/components/ui/Logo";
import { LineCta } from "@/components/ui/Buttons";
import { GripDots } from "@/components/ui/Icons";
import { scrollToTop } from "@/components/ui/SmoothScroll";
import { contact, navLinks, site } from "@/lib/content";
import styles from "./Contact.module.css";

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <section id="contact" className={`section ${styles.contact}`}>
      <GridLines crosses />
      <motion.img
        src="/images/gradient-arc.png"
        alt=""
        aria-hidden="true"
        className={styles.arc}
        initial={{ opacity: 0, y: 120 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className={`grid4 ${styles.top}`}>
        <Eyebrow index={contact.index} label={contact.label} className={styles.eyebrow} />
        <div className={styles.titleCol}>
          <SplitText text={contact.title} className="display" />
          <Reveal delay={0.15}>
            <p className={`lead ${styles.lead}`}>{contact.lead}</p>
          </Reveal>
        </div>
        <nav className={styles.nav} aria-label="Footer">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="roll-host">
              <RollText text={l.label} />
            </a>
          ))}
        </nav>
      </div>

      <form
        className={`grid4 ${styles.form}`}
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <label className={`${styles.field} ${styles.nameField}`}>
          <span className="mono">Name</span>
          <input name="name" required placeholder="Your name" autoComplete="name" />
          <GripDots className={styles.grip} />
          <Cross style={{ left: 0, top: "100%" }} />
        </label>
        <label className={`${styles.field} ${styles.emailField}`}>
          <span className="mono">Email Address</span>
          <input name="email" type="email" required placeholder="email@address.com" autoComplete="email" />
          <GripDots className={styles.grip} />
          <Cross style={{ left: 0, top: "100%" }} />
        </label>
        <div className={styles.submit}>
          {sent ? (
            <motion.p className={`mono ${styles.sent}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <strong>Thanks — we’ll be in touch within a day.</strong>
            </motion.p>
          ) : (
            <LineCta type="submit">{contact.cta}</LineCta>
          )}
          <p className={`mono ${styles.legal}`}>
            <Rich text={contact.legal} />
          </p>
          <p className={`mono ${styles.city}`}>
            We are based in <strong>{site.city}</strong>
          </p>
        </div>
      </form>

      <div className={`grid4 ${styles.bottom}`}>
        <Logo className={styles.logo} />
        <div className={styles.reach}>
          <a href={site.phoneHref} className="mono">
            <strong>{site.phone}</strong>
          </a>
          <a href={`mailto:${site.email}`} className={`${styles.email} roll-host`}>
            <RollText text={site.email} />
          </a>
        </div>
        <div className={styles.socials}>
          {site.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
        </div>
        <button className={`${styles.backTop} roll-host`} onClick={scrollToTop}>
          <RollText text="Back to top" />
        </button>
      </div>
    </section>
  );
}
