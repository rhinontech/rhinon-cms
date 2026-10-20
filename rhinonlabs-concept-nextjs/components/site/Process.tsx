"use client";

import { useEffect, useRef, useState } from "react";
import { Kicker, SplitHeading, Tick, Wrap, h2, mono } from "@/components/site/primitives";
import { pad, processSteps } from "@/lib/data";
import { cn } from "@/lib/utils";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * 06 How we work. On wide screens the section pins and the step cards scroll
 * sideways with the page; the rail fills and the current card turns dark.
 * Below 1101px the cards simply stack.
 */
export default function Process() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current!;
    const track = trackRef.current!;
    const fill = fillRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 1101px)");
    let overflow = 0;
    let isPinned = false;
    let queued = false;

    const measure = () => {
      isPinned = desktop.matches && !reduce;
      setPinned(isPinned);
      track.style.transform = "";
      overflow = isPinned ? Math.max(0, track.scrollWidth - window.innerWidth) : 0;
      section.style.height = isPinned ? `${window.innerHeight + overflow}px` : "";
    };

    const update = () => {
      queued = false;
      const vh = window.innerHeight;
      let current = 0;
      let p: number;
      if (isPinned) {
        const span = section.offsetHeight - vh;
        p = span > 0 ? clamp(-section.getBoundingClientRect().top / span, 0, 1) : 0;
        track.style.transform = `translate3d(${(-p * overflow).toFixed(1)}px,0,0)`;
        current = Math.round(p * (processSteps.length - 1));
      } else {
        [...track.children].forEach((s, i) => {
          if (s.getBoundingClientRect().top < vh * 0.6) current = i;
        });
        p = current / (processSteps.length - 1);
      }
      fill.style.transform = `scaleX(${p.toFixed(4)})`;
      setActive(current);
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    const relayout = () => {
      measure();
      update();
    };

    relayout();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", relayout);
    window.addEventListener("load", relayout);
    document.fonts?.ready.then(relayout);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", relayout);
      window.removeEventListener("load", relayout);
    };
  }, []);

  return (
    <section ref={sectionRef} id="process" data-theme="light" data-pinned={pinned || undefined} className="group/proc relative bg-paper">
      <div className="pt-[clamp(61px,6.6vw,94px)] pb-[clamp(44px,5vw,72px)] group-data-pinned/proc:sticky group-data-pinned/proc:top-0 group-data-pinned/proc:flex group-data-pinned/proc:h-screen group-data-pinned/proc:flex-col group-data-pinned/proc:justify-center group-data-pinned/proc:overflow-hidden group-data-pinned/proc:p-0">
        <Wrap className="mb-[clamp(32px,4vw,52px)] flex flex-wrap items-end justify-between gap-8">
          <div>
            <Kicker idx="06">How we work</Kicker>
            <SplitHeading className={h2}>
              Four steps from <em>chaos</em>
              <br />
              to clarity.
            </SplitHeading>
          </div>
          <div aria-hidden="true" className="relative mb-[18px] h-0.5 w-[min(420px,100%)] bg-ink/13">
            <div ref={fillRef} className="absolute inset-0 origin-left scale-x-0 bg-navy" />
            <ol className={cn(mono, "absolute inset-0 flex justify-between")}>
              {processSteps.map((_, i) => (
                <li
                  key={i}
                  className={cn("relative -translate-y-6 text-ink/58 transition-colors duration-300", i <= active && "text-navy")}
                >
                  {pad(i + 1)}
                  <span
                    className={cn(
                      "absolute top-5 size-[9px] rounded-full bg-paper shadow-[inset_0_0_0_1.5px_rgba(12,13,16,0.3)] transition-[background-color,box-shadow] duration-300",
                      i === processSteps.length - 1 ? "right-0" : "left-0",
                      i <= active && "bg-navy shadow-none"
                    )}
                  />
                </li>
              ))}
            </ol>
          </div>
        </Wrap>
        <div className="overflow-hidden">
          <div ref={trackRef} className="flex w-max gap-5 px-(--gutter) will-change-transform max-[1100px]:w-auto max-[1100px]:flex-col">
            {processSteps.map((p, i) => (
              <article
                key={p.title}
                data-active={i === active || undefined}
                className="group/step relative flex min-h-[clamp(340px,46vh,470px)] flex-[0_0_clamp(330px,40vw,600px)] flex-col overflow-hidden rounded-[24px] bg-paper-2 p-[clamp(22px,2.4vw,34px)] transition-colors duration-600 ease-io data-active:bg-ink data-active:text-paper-2 max-[1100px]:min-h-0 max-[1100px]:flex-none"
              >
                <div className={cn(mono, "flex justify-between text-ink/58 transition-colors duration-600 group-data-active/step:text-paper-2/60")}>
                  <span>Step {pad(i + 1)}</span>
                  <span>/{pad(processSteps.length)}</span>
                </div>
                <h3 className="mt-[22px] mb-3.5 max-w-[11ch] font-display text-[clamp(28px,2.7vw,44px)] leading-[0.95] font-extrabold uppercase tracking-[-0.035em] [font-stretch:112%] max-[1100px]:max-w-none">
                  {p.title}
                </h3>
                <p className="relative z-1 max-w-[40ch] text-base text-ink/58 transition-colors duration-600 group-data-active/step:text-paper-2/60">
                  {p.desc}
                </p>
                <p className={cn(mono, "relative z-1 mt-auto flex max-w-[58%] items-center gap-2.5 pt-6 text-[11px]")}>
                  <Tick />
                  You get: {p.get}
                </p>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-1.5 -bottom-[0.12em] font-display text-[clamp(150px,15vw,250px)] leading-[0.8] font-black tracking-[-0.07em] text-transparent transition-[-webkit-text-stroke-color] duration-600 [-webkit-text-stroke:1.5px_rgba(12,13,16,0.15)] [font-stretch:125%] group-data-active/step:[-webkit-text-stroke-color:oklch(54.6%_0.245_262.881/0.6)]"
                >
                  {pad(i + 1)}
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
