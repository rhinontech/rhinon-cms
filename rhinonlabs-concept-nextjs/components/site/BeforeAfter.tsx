"use client";

import { useEffect, useRef, useState } from "react";
import { Kicker, SectionMarks, SplitHeading, Wrap, h2, mono } from "@/components/site/primitives";
import { onboarding } from "@/lib/data";
import { cn } from "@/lib/utils";

type Mode = "manual" | "auto";

// Two states stacked in one grid cell; the outgoing one slides up and out.
const outgoing = "[grid-area:1/1] transition-[opacity,transform] duration-600 ease-io group-data-auto/ba:-translate-y-[70%] group-data-auto/ba:opacity-0";
const incoming = "[grid-area:1/1] translate-y-[70%] opacity-0 transition-[opacity,transform] duration-600 ease-io group-data-auto/ba:translate-y-0 group-data-auto/ba:opacity-100";
const stagger = "[transition-delay:calc(var(--i)*80ms)]";

function HandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <circle cx="8" cy="5" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 14c.6-2.6 2.6-4 5-4s4.4 1.4 5 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M9.2 1.5 3.5 9h4l-1 5.5L12.5 7h-4l.7-5.5Z" fill="currentColor" />
    </svg>
  );
}

/**
 * 02 Before / after — the same onboarding done by hand vs. automated. Flips to
 * "Automated" on its own shortly after it scrolls into view, unless the
 * visitor has already used the switch.
 */
export default function BeforeAfter() {
  const [mode, setMode] = useState<Mode>("manual");
  const touched = useRef(false);
  const flowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer = 0;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        timer = window.setTimeout(() => !touched.current && setMode("auto"), 1800);
      },
      { threshold: 0.5 }
    );
    if (flowRef.current) obs.observe(flowRef.current);
    return () => {
      obs.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const choose = (m: Mode) => {
    touched.current = true;
    setMode(m);
  };

  return (
    <section
      id="before-after"
      data-theme="light"
      data-auto={mode === "auto" || undefined}
      className="group/ba relative bg-paper py-[clamp(61px,6.6vw,99px)]"
    >
      <SectionMarks />
      <Wrap className="grid grid-cols-[5fr_7fr] items-center gap-[clamp(32px,6vw,100px)] max-[1100px]:grid-cols-1">
        <div>
          <Kicker idx="02">Before / after</Kicker>
          <SplitHeading className={h2}>
            Same work.
            <br />
            <em>Zero</em> busywork.
          </SplitHeading>
          <p data-reveal="" className="mt-6 max-w-[40ch] text-[clamp(17px,1.4vw,20px)] leading-normal tracking-[-0.01em] text-ink/58">
            Onboarding one new client — first by hand, then with a system we&rsquo;d build around your tools.
          </p>
          <div role="group" aria-label="Show the process" className="relative mt-[30px] mb-3 inline-grid grid-cols-2 rounded-full bg-ink/7 p-1">
            <span
              aria-hidden="true"
              className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-ink transition-[transform,background-color] duration-600 ease-io group-data-auto/ba:translate-x-full group-data-auto/ba:bg-navy"
            />
            {(["manual", "auto"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => choose(m)}
                className={cn(mono, "relative z-1 h-[42px] rounded-full px-[22px] transition-colors duration-500 ease-io aria-pressed:text-white")}
              >
                {m === "manual" ? "By hand" : "Automated"}
              </button>
            ))}
          </div>
          <p className={cn(mono, "text-ink/58")}>Illustrative example</p>
        </div>

        <div
          ref={flowRef}
          data-reveal=""
          className="rounded-[24px] bg-paper-2 p-[clamp(20px,2.4vw,34px)] shadow-[0_1px_0_rgba(12,13,16,0.05),0_40px_80px_-40px_rgba(12,13,16,0.3)]"
        >
          <div className={cn(mono, "flex justify-between pb-4 text-ink/58")}>
            <span>New client onboarding</span>
            <span className="inline-grid">
              <span className={outgoing}>6 manual steps</span>
              <span className={incoming}>1 trigger</span>
            </span>
          </div>
          <ol>
            {onboarding.map((r, i) => (
              <li
                key={r.step}
                style={{ "--i": i } as React.CSSProperties}
                className="grid grid-cols-[30px_1fr_auto] items-center gap-3.5 border-t border-dashed border-ink/17 py-3.5 max-sm:gap-2.5"
              >
                <span className="grid size-[30px] place-items-center rounded-[9px] bg-ink/6">
                  <HandIcon
                    className={cn("size-4 transition-[opacity,transform] duration-[550ms] ease-io [grid-area:1/1] group-data-auto/ba:scale-50 group-data-auto/ba:opacity-0", stagger)}
                  />
                  <BoltIcon
                    className={cn("size-4 -rotate-40 scale-50 text-navy opacity-0 transition-[opacity,transform] duration-[550ms] ease-io [grid-area:1/1] group-data-auto/ba:rotate-0 group-data-auto/ba:scale-100 group-data-auto/ba:opacity-100", stagger)}
                  />
                </span>
                <span className={cn("relative justify-self-start text-base tracking-[-0.01em] transition-colors duration-450 group-data-auto/ba:text-ink/58 max-sm:text-[15px]", stagger)}>
                  {r.step}
                  <span
                    aria-hidden="true"
                    className={cn("absolute inset-x-[-2px] top-[54%] h-[1.5px] origin-left scale-x-0 bg-current transition-transform duration-[550ms] ease-io group-data-auto/ba:scale-x-100", stagger)}
                  />
                </span>
                <span className={cn(mono, "inline-grid min-w-[76px] justify-items-end")}>
                  <span className={cn("transition-[opacity,transform] duration-500 ease-io [grid-area:1/1] group-data-auto/ba:-translate-y-2.5 group-data-auto/ba:opacity-0", stagger)}>
                    {r.manual}
                  </span>
                  <span
                    className={cn(
                      "translate-y-2.5 rounded-full bg-electric px-2 py-[3px] text-[10px] text-white opacity-0 transition-[opacity,transform] duration-500 ease-io [grid-area:1/1] group-data-auto/ba:translate-y-0 group-data-auto/ba:opacity-100",
                      stagger
                    )}
                  >
                    Auto
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-1 flex items-baseline justify-between gap-4 border-t-[1.5px] border-ink pt-[18px]">
            <span className={mono}>Total</span>
            <span className="inline-grid text-right font-display text-[clamp(17px,1.6vw,23px)] leading-[1.1] font-extrabold uppercase tracking-[-0.02em] [font-stretch:108%]">
              <span className={outgoing}>≈ 1 hour of work + 2 days of waiting</span>
              <span className={cn(incoming, "text-navy")}>Runs in under a minute</span>
            </span>
          </div>
        </div>
      </Wrap>
    </section>
  );
}
