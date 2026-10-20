"use client";

import { useEffect, useRef, useState } from "react";

const TEXT = "Rhinon Labs";

/**
 * Giant "Rhinon Labs" wordmark sized to exactly fill the footer width; the
 * letters rise in when it scrolls into view and lift on hover.
 */
export default function FooterMark() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const mark = markRef.current!;
    const fit = () => {
      mark.style.fontSize = "200px";
      const w = mark.getBoundingClientRect().width;
      if (w > 0) mark.style.fontSize = `${((200 * wrap.clientWidth) / w).toFixed(2)}px`;
    };
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        setInView(true);
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    obs.observe(wrap);
    fit();
    window.addEventListener("resize", fit);
    document.fonts?.ready.then(fit);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <div ref={wrapRef} aria-hidden="true" className="mt-[clamp(48px,6vw,80px)] mb-3.5 overflow-hidden pt-[2vw]">
      <div
        ref={markRef}
        className="inline-flex font-display text-[200px] leading-[0.78] font-black whitespace-nowrap text-paper-2 uppercase tracking-[-0.06em] select-none [font-stretch:125%]"
      >
        {[...TEXT].map((c, i) => (
          <span key={i} className="inline-block transition-[transform,color] duration-700 ease-expo hover:-translate-y-[7%] hover:text-electric">
            <span
              style={{ transitionDelay: `${i * 45}ms` }}
              className={`inline-block transition-transform duration-1200 ease-expo motion-reduce:translate-y-0 ${inView ? "translate-y-0" : "translate-y-[105%]"}`}
            >
              {c === " " ? " " : c}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
