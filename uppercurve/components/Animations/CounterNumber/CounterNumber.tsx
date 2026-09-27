"use client";

import React, { useState, useEffect, useRef } from "react";

interface CounterNumberProps {
  children: string | number;
  duration?: number;
  className?: string;
}

export function CounterNumber({
  children,
  duration = 1800,
  className,
}: CounterNumberProps) {
  const [displayValue, setDisplayValue] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  const textValue = String(children);

  useEffect(() => {
    // Extract numeric target and any prefix/suffix (e.g., "150+" => target=150, suffix="+")
    const match = textValue.match(/^([^\d]*)([\d,.]+)(.*)$/);

    if (!match) {
      // Non-numeric text (like "∞")
      setDisplayValue(textValue);
      return;
    }

    const prefix = match[1] || "";
    const targetNum = parseFloat(match[2].replace(/,/g, ""));
    const suffix = match[3] || "";

    const element = ref.current;
    if (!element) return;

    // Reset animation state if value prop changes
    hasAnimated.current = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;

          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            // Smooth ease-out quad curve: 1 - (1 - progress)^2
            const easedProgress = 1 - Math.pow(1 - progress, 2);
            const currentCount = Math.floor(easedProgress * targetNum);

            setDisplayValue(`${prefix}${currentCount.toLocaleString()}${suffix}`);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(textValue);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [textValue, duration]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}

export default CounterNumber;
