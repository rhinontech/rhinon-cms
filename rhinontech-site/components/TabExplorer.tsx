"use client";

import { useId, useRef, useState } from "react";

/**
 * Pill tabs over a set of panels (WAI-ARIA tabs pattern: arrow keys move between tabs).
 * Every panel is rendered into the HTML; inactive ones carry `hidden`, so all the content is
 * in the page for readers and crawlers, and switching only toggles visibility.
 */
export function TabExplorer({ tabs, label }: { tabs: { id: string; label: string; panel: React.ReactNode }[]; label: string }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex flex-wrap justify-center gap-2">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el; }}
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={active === i}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
            className={`rounded-full border px-4 py-2 text-[14.5px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric ${active === i ? "border-[#5b3df5] bg-[#f3f0ff] text-[#4527d9]" : "border-line bg-white text-ink-soft hover:border-ink/20 hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={active !== i}
          tabIndex={0}
          className={`mt-10 focus:outline-none ${active === i ? "tab-in" : ""}`}
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
