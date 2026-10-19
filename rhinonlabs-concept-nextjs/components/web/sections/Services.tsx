// 02 Services — the services half of website/components/sections/Company.tsx, unchanged.
"use client";

import Eyebrow from "@/components/web/ui/Eyebrow";
import GridLines, { Cross } from "@/components/web/ui/GridLines";
import Reveal, { CurtainImage } from "@/components/web/ui/Reveal";
import SplitText from "@/components/web/ui/SplitText";
import Rich from "@/components/web/ui/Rich";
import { PillButton } from "@/components/web/ui/Buttons";
import Logo from "@/components/web/ui/Logo";
import { company } from "@/lib/web/content";
import styles from "./Services.module.css";

export default function Services() {
  const { services } = company;

  return (
    <section id="services" className={`section theme-dark ${styles.company}`}>
      <GridLines crosses />

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
