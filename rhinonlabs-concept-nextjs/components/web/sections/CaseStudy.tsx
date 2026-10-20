"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Eyebrow from "@/components/web/ui/Eyebrow";
import GridLines from "@/components/web/ui/GridLines";
import Reveal from "@/components/web/ui/Reveal";
import SplitText from "@/components/web/ui/SplitText";
import ScrollText from "@/components/web/ui/ScrollText";
import CountUp from "@/components/web/ui/CountUp";
import Logo from "@/components/web/ui/Logo";
import { LineCta } from "@/components/web/ui/Buttons";
import { GripDots, QuoteMark } from "@/components/web/ui/Icons";
import { caseStudy } from "@/lib/web/content";
import { hLg, lead, mono } from "@/components/web/ui/styles";
import { cn } from "@/lib/utils";

export default function CaseStudy() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section id="case" ref={ref} data-theme="light" className="theme-light relative isolate grid min-h-[1100px] grid-cols-[1fr_1fr] leading-[1.4] [font-stretch:112%] max-[809px]:grid-cols-1">
      <div className="relative flex flex-col bg-paper">
        <GridLines />
        <div className="relative z-1 flex flex-1 flex-col pt-20 pl-(--wgutter) max-[809px]:pt-[55px]">
          <div className="flex items-center justify-between pr-(--wgutter)">
            <Eyebrow index={caseStudy.index} label={caseStudy.label} />
            <Logo className="w-[78px] text-ink/40" />
          </div>
          <SplitText text={caseStudy.title} className={cn(hLg, "mt-10")} />
          <Reveal delay={0.15}>
            <p className={cn(lead, "mt-[50px] max-w-[460px]")}>{caseStudy.lead}</p>
          </Reveal>
          <dl className="mt-20 mr-(--wgutter) border-t border-sec-line">
            {caseStudy.meta.map((m, i) => (
              <Reveal key={m.label} className="flex justify-between gap-5 border-b border-sec-line py-5 pl-4" y={16} delay={i * 0.06}>
                <dt className={mono}>{m.label}</dt>
                <dd className={cn(mono, "text-right")}>
                  <strong>{m.value}</strong>
                </dd>
              </Reveal>
            ))}
          </dl>
          <div className="mt-auto ml-(--col) w-[calc(var(--col)+var(--wgutter)+1px)] max-[809px]:mt-[60px] max-[809px]:-ml-(--wgutter) max-[809px]:w-[calc(100%+var(--wgutter))]">
            <LineCta href={caseStudy.cta.href} className="h-20">{caseStudy.cta.label}</LineCta>
          </div>
        </div>

        <div className="theme-dark relative z-1 grid grid-cols-[var(--col)_var(--col)] pl-(--wgutter) max-[809px]:grid-cols-2 max-[809px]:pl-0">
          {caseStudy.stats.map((s) => (
            <div key={s.label} className="relative flex h-[270px] flex-col justify-between border-x border-sec-line px-10 pt-11 pb-[30px] not-first:border-l-0 max-[809px]:h-[200px] max-[809px]:p-5 max-[809px]:py-6">
              <p className={cn(mono, "max-w-[100px] self-end text-right")}>{s.label}</p>
              <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} className="font-display text-[64px] leading-none font-semibold tracking-[-0.06em] max-[809px]:text-[44px]" />
              <GripDots className="absolute right-10 bottom-9 w-2 text-sec-faint max-[809px]:hidden" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden bg-[#222] text-paper-2">
        <motion.img src={caseStudy.image} alt="" className="absolute inset-x-0 -top-[12%] h-[124%] w-full object-cover" style={{ y: bgY }} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.25),rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.3))]" />
        <div className="relative z-1 flex h-full flex-col pt-[90px] pr-(--wgutter) pb-[70px] pl-[70px] max-[809px]:min-h-[760px] max-[809px]:px-(--wgutter) max-[809px]:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", bounce: 0.35, duration: 0.9 }}
          >
            <QuoteMark className="w-[88px] text-paper-2" />
          </motion.div>
          <ScrollText as="blockquote" text={caseStudy.quote} className="mt-[60px] font-display text-[clamp(34px,4.2vw,61px)] leading-none font-bold tracking-[-0.06em] uppercase" offset={["start 0.8", "end 0.55"]} />
          <Reveal className="mt-auto flex items-center gap-4">
            <img src={caseStudy.author.photo} alt="" className="size-[42px] rounded-full" />
            <p className="font-mono text-[13px] leading-[1.6] font-medium tracking-[0.02em] text-paper-2/60 uppercase">
              <strong className="font-medium text-paper-2">{caseStudy.author.name}</strong>
              <br />
              {caseStudy.author.role}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
