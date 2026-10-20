"use client";

// 04 Services — the services half of website/components/sections/Company.tsx.
import Eyebrow from "@/components/web/ui/Eyebrow";
import GridLines, { Cross } from "@/components/web/ui/GridLines";
import Reveal, { CurtainImage } from "@/components/web/ui/Reveal";
import SplitText from "@/components/web/ui/SplitText";
import Rich from "@/components/web/ui/Rich";
import { PillButton } from "@/components/web/ui/Buttons";
import Logo from "@/components/web/ui/Logo";
import { grid4, hLg, hMd, mono, section } from "@/components/web/ui/styles";
import { company } from "@/lib/web/content";
import { cn } from "@/lib/utils";

export default function Services() {
  const { services } = company;

  return (
    <section id="services" data-theme="dark" className={cn(section, "theme-dark pt-[82px] pb-[66px] max-[809px]:pt-[55px]")}>
      <GridLines crosses />

      <div className={cn(grid4, "pb-[77px] max-[809px]:gap-10 max-[809px]:pb-20")}>
        <div className="col-[1/span_2] grid content-start gap-6 max-[809px]:col-start-1">
          <Eyebrow index={services.index} label={services.label} />
          <SplitText text={services.title} className={cn(hLg, "max-w-[580px]")} stagger={0.04} />
        </div>
        <div className="col-[3/span_2] max-[809px]:col-start-1">
          <Reveal>
            <p className="text-lg leading-[1.4] font-medium tracking-[-0.02em] text-sec-ink">
              <Rich text={services.lead} mutedClass="text-sec-muted" />
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <PillButton href={services.cta.href} tone="light" className="mt-[55px] h-[60px] max-[809px]:mt-10">
              {services.cta.label}
            </PillButton>
          </Reveal>
          <Logo className="mt-6 w-[78px] text-sec-faint" />
        </div>
      </div>

      <ol>
        {services.items.map((s, i) => (
          <li
            key={s.title}
            className={cn(grid4, "group/row relative min-h-[300px] border-t border-sec-line py-10 last:border-b max-[809px]:gap-[18px]")}
          >
            <Cross style={{ left: 0, top: 0 }} />
            <Cross style={{ left: "100%", top: 0 }} />
            <Reveal className="pl-10 font-display text-[22px] font-semibold tracking-[-0.04em] text-sec-faint max-[1199px]:pl-4 max-[809px]:pl-0">
              /{String(i + 1).padStart(2, "0")}
            </Reveal>
            <Reveal delay={0.05}>
              <h3 className={cn(hMd, "max-w-[220px]")}>{s.title}</h3>
            </Reveal>
            <div className="pr-2.5">
              <CurtainImage
                src={s.image}
                alt=""
                className="aspect-[330/210] rounded-[6px] border-6 border-[#262626] transition-transform duration-700 ease-expo group-hover/row:scale-103"
              />
            </div>
            <Reveal delay={0.1} className="flex flex-col justify-between gap-6 px-[30px] max-[1199px]:pr-0 max-[1199px]:pl-5 max-[809px]:pl-0">
              <p className={cn(mono, "max-w-[260px]")}>{s.text}</p>
              <p className={cn(mono, "flex flex-wrap gap-x-4 gap-y-1")}>
                {s.tags.map((t) => (
                  <span key={t}>
                    <span className="mr-0.5">#</span>
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
