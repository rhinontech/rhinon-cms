"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Kicker, SectionMarks, SplitHeading, Wrap, h2, mono } from "@/components/site/primitives";
import { categoryLabels, pad, systems, type SystemCategory } from "@/lib/data";
import { cn } from "@/lib/utils";

type Filter = "all" | SystemCategory;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "dashboards", label: "Dashboards" },
  { id: "automation", label: "Automations" },
  { id: "agents", label: "AI agents" },
];

// Line icons that draw themselves on hover (pathLength=1 + dashoffset)
const iconPaths: Record<SystemCategory, React.ReactNode> = {
  dashboards: (
    <>
      <rect pathLength={1} x="3.5" y="3.5" width="23" height="23" rx="4" />
      <path pathLength={1} d="M3.5 11.5h23M11.5 11.5v15" />
      <path pathLength={1} d="M15.5 21.5l3-4 3 2 3-5" />
    </>
  ),
  automation: (
    <>
      <path pathLength={1} d="M5 10.5h16.5l-4-4" />
      <path pathLength={1} d="M25 19.5H8.5l4 4" />
      <circle pathLength={1} cx="5" cy="19.5" r="1.6" />
      <circle pathLength={1} cx="25" cy="10.5" r="1.6" />
    </>
  ),
  agents: (
    <>
      <circle pathLength={1} cx="15" cy="15" r="5" />
      <path pathLength={1} d="M15 3.5V8M15 22v4.5M3.5 15H8M22 15h4.5M6.9 6.9l3.2 3.2M19.9 19.9l3.2 3.2M6.9 23.1l3.2-3.2M19.9 10.1l3.2-3.2" />
    </>
  ),
};

const count = (f: Filter) => pad(f === "all" ? systems.length : systems.filter((s) => s.cat === f).length);

/** 05 What we build — filterable board of example systems. */
export default function Systems() {
  const [filter, setFilter] = useState<Filter>("all");
  const listRef = useRef<HTMLUListElement>(null);
  const before = useRef<Map<Element, DOMRect> | null>(null);

  const choose = (f: Filter) => {
    // Remember where every card was, so the cards that stay can glide (FLIP).
    const cards = listRef.current ? [...listRef.current.children] : [];
    before.current = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));
    setFilter(f);
  };

  useLayoutEffect(() => {
    const prev = before.current;
    before.current = null;
    if (!prev || !listRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const c of listRef.current.children as HTMLCollectionOf<HTMLElement>) {
      if (c.hidden) continue;
      const a = prev.get(c);
      const b = c.getBoundingClientRect();
      if (!a || !a.width) {
        c.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], {
          duration: 500,
          easing: "cubic-bezier(.16,1,.3,1)",
        });
        continue;
      }
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (dx || dy)
        c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
          duration: 650,
          easing: "cubic-bezier(.16,1,.3,1)",
        });
    }
  }, [filter]);

  return (
    <section id="build" data-theme="light" className="relative bg-paper py-[clamp(61px,6.6vw,99px)]">
      <SectionMarks />
      <Wrap>
        <div className="mb-[clamp(36px,4vw,56px)] flex flex-wrap items-end justify-between gap-7">
          <div>
            <Kicker idx="05">What we build</Kicker>
            <SplitHeading className={h2}>
              Systems, <em>not</em>
              <br />
              more tools.
            </SplitHeading>
          </div>
          <div role="tablist" aria-label="Filter systems" className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => choose(f.id)}
                className={cn(
                  mono,
                  "inline-flex h-[38px] items-center gap-1.5 rounded-full px-[15px] shadow-[inset_0_0_0_1px_rgba(12,13,16,0.2)] transition-[background-color,color,box-shadow] duration-350 hover:shadow-[inset_0_0_0_1px_var(--color-ink)] aria-selected:bg-ink aria-selected:text-paper-2 aria-selected:shadow-none"
                )}
              >
                {f.label} <sup className="top-0 text-[9px] leading-normal opacity-55">{count(f.id)}</sup>
              </button>
            ))}
          </div>
        </div>

        <ul
          ref={listRef}
          className="grid grid-cols-[repeat(3,1fr)] gap-px overflow-hidden rounded-[6px] border border-ink/13 bg-ink/13 max-[1100px]:grid-cols-[repeat(2,1fr)] max-sm:grid-cols-[1fr]"
        >
          {systems.map((s, i) => (
            <li
              key={s.title}
              hidden={!(filter === "all" || filter === s.cat)}
              className="group/sys relative flex min-h-[236px] flex-col gap-3 bg-paper px-6 pt-6 pb-7 transition-colors duration-350 hover:bg-paper-2 max-sm:min-h-0"
            >
              <div className={cn(mono, "flex items-center justify-between text-ink/58")}>
                <span>S/{pad(i + 1)}</span>
                <span className="inline-flex h-[22px] items-center rounded-full px-[9px] text-[10px] whitespace-nowrap shadow-[inset_0_0_0_1px_currentColor]">
                  {categoryLabels[s.cat]}
                </span>
              </div>
              <svg
                viewBox="0 0 30 30"
                aria-hidden="true"
                className={cn(
                  "mt-1.5 size-[30px] *:fill-none *:stroke-current *:[stroke-dasharray:1] *:[stroke-linecap:round] *:[stroke-linejoin:round] *:[stroke-width:1.5] group-hover/sys:*:animate-draw",
                  s.cat === "agents" ? "text-navy" : "text-ink"
                )}
              >
                {iconPaths[s.cat]}
              </svg>
              <h3 className="mt-auto font-display text-[clamp(19px,1.5vw,22px)] leading-[1.05] font-extrabold uppercase tracking-[-0.025em] [font-stretch:108%]">
                {s.title}
              </h3>
              <p className="max-w-[34ch] text-[15px] leading-[1.45] text-ink/58">{s.desc}</p>
            </li>
          ))}
        </ul>
      </Wrap>
    </section>
  );
}
