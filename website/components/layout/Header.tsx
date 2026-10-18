"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { EASE_CURTAIN, EASE_OUT } from "@/lib/motion";
import Logo from "@/components/ui/Logo";
import RollText from "@/components/ui/RollText";
import { navLinks, site } from "@/lib/content";
import styles from "./Header.module.css";

const panel: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  show: { clipPath: "inset(0 0 0% 0)", transition: { duration: 0.6, ease: EASE_CURTAIN } },
  exit: { clipPath: "inset(0 0 100% 0)", transition: { duration: 0.45, ease: EASE_CURTAIN } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.25 + i * 0.045, duration: 0.5, ease: EASE_OUT } }),
};

// Fixed header: logo + menu toggle, blended with `difference` so it reads on light and dark sections.
export default function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <motion.header
        className={styles.header}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: EASE_OUT }}
      >
        <a href="#top" className={styles.logo} aria-label={`${site.name} home`}>
          <Logo />
        </a>
        <button
          className={`${styles.toggle} roll-host`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="site-menu"
        >
          <span className={`${styles.toggleIcon} ${open ? styles.toggleOpen : ""}`} aria-hidden="true">
            <span />
            <span />
          </span>
          <RollText text="Menu" />
        </button>
      </motion.header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className={styles.scrim}
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.nav id="site-menu" className={styles.panel} variants={panel} initial="hidden" animate="show" exit="exit">
              <motion.div variants={item} custom={0}>
                <Logo className={styles.panelLogo} />
              </motion.div>
              <ul className={styles.links}>
                {[...navLinks, { label: "404", href: "#" }].map((l, i) => (
                  <motion.li key={l.label} variants={item} custom={i + 1}>
                    <a href={l.href} className="roll-host" onClick={() => setOpen(false)}>
                      <RollText text={l.label} />
                    </a>
                  </motion.li>
                ))}
              </ul>
              <motion.div className={styles.contact} variants={item} custom={9}>
                <a href={`mailto:${site.email}`} className={styles.email}>
                  {site.email}
                </a>
                <a href={site.phoneHref} className={styles.phone}>
                  {site.phone}
                </a>
              </motion.div>
              <motion.div className={styles.socials} variants={item} custom={10}>
                {site.socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                ))}
              </motion.div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
