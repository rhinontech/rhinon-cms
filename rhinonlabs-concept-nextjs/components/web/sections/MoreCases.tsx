"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import Eyebrow from "@/components/web/ui/Eyebrow";
import GridLines from "@/components/web/ui/GridLines";
import { moreCases } from "@/lib/web/content";
import { grid4, section } from "@/components/web/ui/styles";
import { cn } from "@/lib/utils";

export default function MoreCases() {
  const [active, setActive] = useState<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 26, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 26, mass: 0.6 });

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };

  return (
    <section id="more-cases" data-theme="light" className={cn(section, "theme-light overflow-hidden pt-[121px] pb-[127px] max-[809px]:pt-[61px] max-[809px]:pb-[66px]")} onMouseMove={onMove}>
      <GridLines crosses />
      <div className={cn(grid4, "items-start")}>
        <Eyebrow label={moreCases.label} className="pt-1.5 text-[11px]" />
        <ul className="col-[2/span_3] grid gap-[18px] max-[809px]:col-start-1 max-[809px]:mt-[30px]" onMouseLeave={() => setActive(null)}>
          {moreCases.items.map((c, i) => (
            <motion.li
              key={c.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ type: "spring", damping: 26, stiffness: 170, delay: i * 0.05 }}
            >
              <a
                href="#more-cases"
                className={cn("inline-flex items-start gap-2 transition-[opacity,transform] duration-500 ease-expo hover:translate-x-3", active !== null && active !== i && "opacity-25")}
                onMouseEnter={() => setActive(i)}
              >
                <span className="font-sans text-[clamp(26px,2.25vw,32px)] leading-[1.1] font-medium tracking-[-0.04em]">{c.name}</span>
                <sup className="top-0 font-sans text-[13px] leading-normal font-medium text-sec-faint">{c.year}</sup>
              </a>
            </motion.li>
          ))}
        </ul>
      </div>

      <motion.div className="pointer-events-none absolute top-0 left-0 z-5 max-[809px]:hidden [@media(hover:none)]:hidden" style={{ x: sx, y: sy }} aria-hidden="true">
        <AnimatePresence>
          {active !== null && (
            <motion.div
              key={active}
              className="absolute -top-[140px] left-[30px] w-[340px] rounded-[8px] bg-ink px-2 pt-2 pb-[18px] text-paper-2/70 shadow-[0_30px_60px_rgba(0,0,0,0.25)]"
              initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
            >
              <img src={moreCases.items[active].image} alt="" className="aspect-video w-full rounded-[4px] object-cover" />
              <img src={moreCases.items[active].logo} alt="" className="mx-2.5 mt-4 mb-2.5 h-[22px] w-auto" />
              <p className="px-2.5 font-mono text-[10px] leading-normal uppercase">{moreCases.items[active].blurb}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
