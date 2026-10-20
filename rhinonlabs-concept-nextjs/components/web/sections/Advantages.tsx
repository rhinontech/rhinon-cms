"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Eyebrow from "@/components/web/ui/Eyebrow";
import GridLines, { Cross } from "@/components/web/ui/GridLines";
import Reveal from "@/components/web/ui/Reveal";
import SplitText from "@/components/web/ui/SplitText";
import CountUp from "@/components/web/ui/CountUp";
import Rich from "@/components/web/ui/Rich";
import Logo from "@/components/web/ui/Logo";
import { Calendar } from "@/components/web/ui/Icons";
import { advantages } from "@/lib/web/content";
import { display, grid4, hLg, lead, mono, section } from "@/components/web/ui/styles";
import { cn } from "@/lib/utils";

const titleMuted = "text-ink/40";

function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 79 58" fill="currentColor" aria-hidden="true">
      <path d="M21.9438 29C21.9438 45.0163 34.7162 58 50.4719 58C66.2275 58 79 45.0163 79 29C79 12.9837 66.2275 0 50.4719 0C34.7162 0 21.9438 12.9837 21.9438 29Z" />
      <path d="M18.9145 1.79855C7.89493 5.7584 0 16.4418 0 28.9998C0 41.5577 7.89493 52.2411 18.9145 56.201V1.79855Z" />
    </svg>
  );
}

export default function Advantages() {
  const phoneRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: phoneRef, offset: ["start end", "end start"] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [120, -80]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], [5, -2]);
  const glowScale = useTransform(scrollYProgress, [0, 0.6], [0.85, 1.15]);

  return (
    <section data-theme="light" className={cn(section, "theme-light py-[99px] max-[809px]:pt-[61px] max-[809px]:pb-[55px]")}>
      <GridLines crosses />

      <div className={cn(grid4, "items-start")}>
        <div className="col-[1/span_2] max-[809px]:col-start-1">
          <Eyebrow index={advantages.index} label={advantages.label} />
          <SplitText text={advantages.title} className={cn(display, "mt-10")} mutedClass={titleMuted} />
          <Reveal delay={0.2}>
            <p className={cn(lead, "mt-[70px] max-w-[260px] max-[809px]:mt-[30px] max-[809px]:mb-[60px]")}>{advantages.lead}</p>
          </Reveal>
        </div>

        <div className="col-[3/span_2] max-[809px]:col-start-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", bounce: 0.35, duration: 1 }}
          >
            <BrandMark className="w-[79px] text-ink/10" />
          </motion.div>
          <SplitText text={advantages.listTitle} as="h3" className="mt-[61px] font-display text-[clamp(24px,2.2vw,32px)] font-bold tracking-[-0.06em] uppercase max-[809px]:mt-10" mutedClass={titleMuted} />
          <ul className="mt-[50px] border-t border-sec-line">
            {advantages.items.map((item, i) => (
              <motion.li
                key={item}
                className="relative flex h-[73px] items-center gap-[18px] border-b border-sec-line pl-5"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ type: "spring", damping: 26, stiffness: 180, delay: i * 0.08 }}
              >
                <Cross style={{ left: 0, top: "100%" }} />
                <span className="grid size-8 place-items-center rounded-full bg-paper-2 font-mono text-[11px] text-sec-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className={cn(mono, "text-sm")}>
                  <Rich text={item} />
                </span>
              </motion.li>
            ))}
          </ul>
          <Reveal className={cn(mono, "mt-[60px] flex items-center")} y={10}>
            <span className="w-[148px]">{advantages.source.label}</span>
            <strong>{advantages.source.value}</strong>
            <span className="ml-auto inline-flex items-center gap-2">
              <Calendar className="w-[18px] text-sec-muted" />
              <strong>{advantages.source.date}</strong>
            </span>
          </Reveal>
        </div>
      </div>

      <div ref={phoneRef} className="relative z-1 mt-[99px] h-[600px] overflow-hidden bg-paper-2 max-[809px]:-mx-(--wgutter) max-[809px]:mt-[100px] max-[809px]:h-[900px]">
        <div className="absolute top-[60px] right-0 left-[60px] grid grid-cols-[calc(var(--col)-60px)_var(--col)_var(--col)] max-[809px]:left-5 max-[809px]:grid-cols-1 max-[809px]:gap-5">
          {advantages.stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} className="font-display text-[46px] leading-none font-semibold tracking-[-0.07em]" />
              <span className={mono}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-[60px] left-[60px] w-[calc(var(--col)*2-120px)] max-[1199px]:w-[calc(var(--col)*2)] max-[809px]:top-[260px] max-[809px]:right-5 max-[809px]:bottom-auto max-[809px]:left-5 max-[809px]:w-auto">
          <Eyebrow label={advantages.mobile.label} />
          <SplitText text={advantages.mobile.title} className={cn(hLg, "mt-[30px] mb-[50px]")} />
          <Reveal delay={0.15}>
            <p className={lead}>{advantages.mobile.lead}</p>
          </Reveal>
        </div>

        <Logo className="absolute bottom-[60px] left-[calc(var(--col)*2)] w-[78px] text-ink/40 max-[809px]:hidden" />

        <motion.img src="/images/phone-glow.png" alt="" className="absolute right-0 bottom-0 w-[660px] origin-bottom-right [filter:hue-rotate(-75deg)_saturate(1.3)]" style={{ scale: glowScale }} />
        <motion.img
          src="/images/phone-hand.png"
          alt="Hand holding a phone"
          className="absolute right-[150px] -bottom-10 w-[360px] max-[1199px]:right-10 max-[1199px]:w-[300px] max-[809px]:right-5 max-[809px]:w-[240px]"
          style={{ y: phoneY, rotate: phoneRotate }}
        />
      </div>
    </section>
  );
}
