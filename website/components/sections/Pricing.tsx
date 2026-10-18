"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "motion/react";
import GridLines, { Cross } from "@/components/ui/GridLines";
import Reveal from "@/components/ui/Reveal";
import SplitText from "@/components/ui/SplitText";
import Logo from "@/components/ui/Logo";
import { PillButton } from "@/components/ui/Buttons";
import { DoubleCheck, GripDots } from "@/components/ui/Icons";
import { pricing } from "@/lib/content";
import { EASE_OUT } from "@/lib/motion";
import styles from "./Pricing.module.css";

/** Price that tweens between values whenever the billing period changes. */
function Price({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const current = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!inView || !node) return;
    const controls = animate(current.current, value, {
      duration: 0.9,
      ease: EASE_OUT,
      onUpdate: (v) => {
        current.current = v;
        node.textContent = `$${Math.round(v)}`;
      },
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className={styles.price}>
      $0
    </span>
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const factor = annual ? 1 - pricing.annualDiscount : 1;

  return (
    <section id="pricing" className={`section theme-dark ${styles.pricing}`}>
      <GridLines crosses />

      <div className={styles.head}>
        <Logo className={styles.logo} />
        <SplitText text={pricing.title} className={`display ${styles.title}`} />
        <Reveal delay={0.2}>
          <p className={styles.lead}>{pricing.lead}</p>
        </Reveal>
      </div>

      <div className={styles.plans}>
        {[0, 1, 2, 3].map((i) => (
          <Cross key={i} style={{ left: `${(i / 3) * 100}%`, top: 0 }} />
        ))}

        {pricing.plans.map((plan, i) => (
          <motion.article
            key={plan.name}
            className={`${styles.plan} ${plan.featured ? styles.featured : ""}`}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: "spring", damping: 26, stiffness: 130, delay: i * 0.1 }}
          >
            {plan.featured && (
              <div className={styles.toggleRow}>
                <span className={`mono ${!annual ? styles.on : ""}`}>Monthly</span>
                <button
                  className={styles.switch}
                  role="switch"
                  aria-checked={annual}
                  aria-label="Bill annually"
                  onClick={() => setAnnual((a) => !a)}
                >
                  <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className={styles.knob} data-on={annual} />
                </button>
                <span className={`mono ${annual ? styles.on : ""}`}>Annual</span>
                <span className={`mono ${styles.save}`}>Save 20%</span>
                <Cross style={{ left: 0, top: "100%" }} />
                <Cross style={{ left: "100%", top: "100%" }} />
              </div>
            )}

            <div className={styles.planTop}>
              <GripDots className={styles.grip} />
              <h3 className={styles.name}>
                {plan.name}
                {plan.badge && <span className={styles.badge}>{plan.badge}</span>}
              </h3>
              <p className="mono">{plan.note}</p>
              <p className={styles.priceRow}>
                <Price value={Math.round(plan.price * factor)} />
                <span className="mono">/month</span>
              </p>
            </div>

            <ul className={styles.features}>
              {plan.features.map((f) => (
                <li key={f} className="mono">
                  <DoubleCheck className={styles.check} />
                  <strong>{f}</strong>
                </li>
              ))}
            </ul>

            <div className={styles.cta}>
              <PillButton href="#contact" tone={plan.featured ? "glow" : "outline"}>
                {plan.cta}
              </PillButton>
            </div>

            {plan.featured && <img src="/images/pricing-toggle.jpg" alt="" className={styles.glow} aria-hidden="true" />}
          </motion.article>
        ))}
      </div>
    </section>
  );
}
