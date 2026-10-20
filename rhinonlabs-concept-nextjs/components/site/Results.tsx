"use client";

import { useEffect, useRef, useState } from "react";
import { Kicker, SectionMarks, SplitHeading, Wrap, h2, mono } from "@/components/site/primitives";
import { stats } from "@/lib/data";
import { cn } from "@/lib/utils";

/** Counts from 0 to `to` (ease-out-quart) once it is mostly on screen. */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(to);
        const t0 = performance.now();
        const run = (now: number) => {
          const k = Math.min(1, (now - t0) / 1600);
          setN(Math.round(to * (1 - Math.pow(1 - k, 4))));
          if (k < 1) raf = requestAnimationFrame(run);
        };
        raf = requestAnimationFrame(run);
      },
      { threshold: 0.6 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return <span ref={ref}>{n}</span>;
}

/** 09 What changes — headline figures. */
export default function Results() {
  return (
    <section id="results" data-theme="light" className="relative bg-paper py-[clamp(61px,6.6vw,99px)]">
      <SectionMarks />
      <Wrap>
        <Kicker idx="09">What changes</Kicker>
        <SplitHeading className={h2}>
          Less busywork.
          <br />
          <em>More</em> business.
        </SplitHeading>
        <div className="mt-[clamp(44px,5vw,72px)] grid grid-cols-[repeat(4,1fr)] border-t-[1.5px] border-ink max-[1100px]:grid-cols-[repeat(2,1fr)]">
          {stats.map((s, i) => (
            <div
              key={s.label}
              data-reveal=""
              style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
              className="border-r border-ink/13 pt-[26px] pr-5 last:border-r-0 not-first:pl-5 max-[1100px]:nth-2:border-r-0 max-[1100px]:nth-3:pl-0 max-[1100px]:nth-[n+3]:mt-[26px] max-[1100px]:nth-[n+3]:border-t"
            >
              <p className="flex items-start font-display text-[clamp(56px,7vw,118px)] leading-[0.84] font-extrabold uppercase tracking-[-0.055em] tabular-nums [font-stretch:112%]">
                {s.value != null ? <CountUp to={s.value} /> : <span>{s.text}</span>}
                {s.suffix && <span className="mt-[0.06em] ml-[0.04em] text-[0.5em] leading-none text-navy">{s.suffix}</span>}
                {s.unit && (
                  <span className="mt-[0.4em] ml-[0.35em] font-mono text-[clamp(13px,1.1vw,16px)] leading-none font-medium tracking-normal uppercase">
                    {s.unit}
                  </span>
                )}
              </p>
              <span className={cn(mono, "mt-4 block text-ink/58")}>{s.label}</span>
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  );
}
