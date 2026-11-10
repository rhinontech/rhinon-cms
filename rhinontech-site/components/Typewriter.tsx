"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Types `text` out once it scrolls into view, waits, then starts over.
 * Reserves its final height up front so the page does not jump while typing.
 */
export function Typewriter({ text, speed = 22, pause = 3200, className = "" }: {
  text: string;
  speed?: number;
  pause?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text.length);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [text]);

  useEffect(() => {
    if (!live) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      setShown(i);
      if (i < text.length) {
        i += 1;
        timer = setTimeout(step, speed);
      } else {
        timer = setTimeout(() => {
          i = 0;
          step();
        }, pause);
      }
    };
    step();
    return () => clearTimeout(timer);
  }, [live, text, speed, pause]);

  return (
    <span ref={ref} className={`relative block ${className}`}>
      <span aria-hidden className="invisible block whitespace-pre-wrap">{text}</span>
      <span className="absolute inset-0 whitespace-pre-wrap">
        <span className={shown < text.length ? "caret" : ""}>{text.slice(0, shown)}</span>
      </span>
    </span>
  );
}
