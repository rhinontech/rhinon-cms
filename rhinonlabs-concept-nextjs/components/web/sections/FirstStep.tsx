"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Eyebrow from "@/components/web/ui/Eyebrow";
import GridLines from "@/components/web/ui/GridLines";
import Reveal from "@/components/web/ui/Reveal";
import SplitText from "@/components/web/ui/SplitText";
import { firstStep } from "@/lib/web/content";
import { display, grid4, mono, section } from "@/components/web/ui/styles";
import { cn } from "@/lib/utils";

export default function FirstStep() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);
  const portraitY = useTransform(scrollYProgress, [0, 1], [140, -60]);
  const lineScale = useTransform(scrollYProgress, [0.3, 0.55], [0, 1]);

  return (
    <section ref={ref} data-theme="dark" className={cn(section, "theme-dark min-h-[970px] overflow-hidden bg-[#3a3a3a] pt-[121px] max-[809px]:min-h-[1100px] max-[809px]:pt-[61px]")}>
      <motion.img src={firstStep.background} alt="" className="absolute inset-0 -z-1 size-full object-cover" style={{ scale: bgScale }} />
      <GridLines crosses />

      <motion.img
        src={firstStep.portrait}
        alt="Client success manager standing with hands in pockets"
        className="absolute -bottom-[60px] left-[110px] z-1 w-[500px] max-[809px]:left-1/2 max-[809px]:-ml-[170px] max-[809px]:w-[340px]"
        style={{ y: portraitY }}
      />

      <div className={cn(grid4, "z-2")}>
        <div className="col-[3/span_2] max-[809px]:col-start-1">
          <Eyebrow index={firstStep.index} label={firstStep.label} />
          <SplitText text={firstStep.title} className={cn(display, "mt-10 -mr-(--wgutter)")} />
          <div className="relative mt-[61px] pl-9 max-[809px]:mt-[50px]">
            <motion.span className="absolute inset-y-0 left-0 w-px origin-top bg-paper-2" style={{ scaleY: lineScale }} />
            <Reveal delay={0.1}>
              <p className="mb-14 max-w-[370px] text-2xl leading-[1.35] font-medium tracking-[-0.02em] max-[809px]:text-xl">{firstStep.quote}</p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className={mono}>
                <strong>{firstStep.person.name}</strong>
                <br />
                {firstStep.person.role}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
