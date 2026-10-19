"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "motion/react";

type Props = {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
};

const format = (v: number, decimals: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: false });

// Number that counts up from zero the first time it scrolls into view.
export default function CountUp({ value, prefix = "", suffix = "", duration = 1.6, className, decimals = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  useEffect(() => {
    const node = ref.current;
    if (!inView || !node) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = `${prefix}${format(v, decimals)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, value, prefix, suffix, duration, decimals]);

  return (
    <span ref={ref} className={className}>
      {`${prefix}${format(0, decimals)}${suffix}`}
    </span>
  );
}
