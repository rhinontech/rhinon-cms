"use client";

import { useEffect, useRef, useState } from "react";
import { Button, ButtonArrow } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Kicker, RollLabel, SectionMarks, SplitHeading, Wrap, h2, mono } from "@/components/site/primitives";
import { siteConfig } from "@/lib/data";
import { cn } from "@/lib/utils";

const inr = (v: number) => "₹" + Math.round(v).toLocaleString("en-IN");
const WORK_WEEKS = 48;

function Field({
  id,
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="border-t border-paper-2/12 pt-5 pb-[15px]">
      <label htmlFor={id} className={cn(mono, "mb-2.5 flex justify-between text-paper-2/60")}>
        <span>{label}</span>
        <output className="text-[13px] text-electric">{display}</output>
      </label>
      <Slider id={id} aria-label={label} min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

/** Animates a number towards its target with an ease-out-cubic tween. */
function useTween(target: number | null) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (target == null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = target;
      setShown(target);
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 600);
      const v = start + (target - start) * (1 - Math.pow(1 - k, 3));
      from.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return shown;
}

/** 03 The cost of waiting — what repetitive work costs per year. */
export default function Calculator() {
  const [people, setPeople] = useState(4);
  const [hours, setHours] = useState(6);
  const [rate, setRate] = useState(600);
  // The total counts up from ₹0 once the result card first comes into view.
  const [started, setStarted] = useState(false);
  const outRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        setStarted(true);
      },
      { threshold: 0.4 }
    );
    if (outRef.current) obs.observe(outRef.current);
    return () => obs.disconnect();
  }, []);

  const yearlyHours = people * hours * WORK_WEEKS;
  const weeks = yearlyHours / 40;
  const filled = started ? Math.min(52, Math.round(weeks)) : 0;
  const total = useTween(started ? yearlyHours * rate : null);

  const begin = (set: (v: number) => void) => (v: number) => {
    setStarted(true);
    set(v);
  };

  return (
    <section id="cost" data-theme="dark" className="relative bg-ink py-[clamp(61px,6.6vw,99px)] text-paper-2">
      <SectionMarks />
      <Wrap className="grid grid-cols-[1fr_1fr] items-start gap-[clamp(36px,6vw,110px)] max-[1100px]:grid-cols-1">
        <div>
          <Kicker idx="03">The cost of waiting</Kicker>
          <SplitHeading className={cn(h2, "mb-[clamp(28px,3vw,44px)]")}>
            What is manual work <em>costing</em> you?
          </SplitHeading>
          <Field id="cPeople" label="People doing repetitive work" value={people} display={String(people)} min={1} max={25} step={1} onChange={begin(setPeople)} />
          <Field id="cHours" label="Hours each, per week" value={hours} display={String(hours)} min={1} max={20} step={1} onChange={begin(setHours)} />
          <Field id="cRate" label="Cost per hour" value={rate} display={inr(rate)} min={200} max={3000} step={50} onChange={begin(setRate)} />
        </div>

        <div
          ref={outRef}
          data-reveal=""
          className="sticky top-[104px] flex flex-col gap-[22px] overflow-hidden rounded-[26px] border border-paper-2/12 bg-ink-2 p-[clamp(24px,3vw,44px)] max-[1100px]:relative max-[1100px]:top-0"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-[190px] -right-[170px] size-[440px] bg-[radial-gradient(circle,oklch(37.9%_0.146_265.522/0.5),oklch(37.9%_0.146_265.522/0)_65%)]"
          />
          <p className={cn(mono, "relative text-paper-2/60")}>Spent on repetitive work, every year</p>
          <p
            aria-live="polite"
            className="relative font-display text-[clamp(44px,5.8vw,94px)] leading-[0.9] font-extrabold tracking-[-0.05em] tabular-nums [font-stretch:112%]"
          >
            {inr(total)}
          </p>
          <div aria-hidden="true" className="relative grid grid-cols-[repeat(26,1fr)] gap-1">
            {Array.from({ length: 52 }, (_, i) => (
              <i
                key={i}
                style={{ transitionDelay: `${i * 7}ms` }}
                className={cn("h-[18px] rounded-[3px] bg-paper-2/10 transition-colors duration-350 max-sm:h-3.5", i < filled && "bg-electric")}
              />
            ))}
          </div>
          <p className="relative max-w-[44ch] text-paper-2/60">
            That&rsquo;s about <b className="font-semibold text-paper-2">{started ? Math.round(weeks).toLocaleString("en-IN") : 0}</b> full
            work-weeks a year — time your team could spend on work that actually grows the business.
          </p>
          <Button asChild variant="electric" className="relative self-start">
            <a href={siteConfig.bookCall} target="_blank" rel="noopener">
              <RollLabel>Find what to automate first</RollLabel>
              <ButtonArrow />
            </a>
          </Button>
          <p className={cn(mono, "relative text-paper-2/60")}>Estimate based on your inputs and 48 working weeks a year.</p>
        </div>
      </Wrap>
    </section>
  );
}
