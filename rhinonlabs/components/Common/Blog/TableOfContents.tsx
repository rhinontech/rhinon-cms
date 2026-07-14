"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { TocItem } from "./blocks";

export function TableOfContents({
  items,
  variant = "desktop",
}: {
  items: TocItem[];
  variant?: "mobile" | "desktop";
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length < 2) return;
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => !!el);
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  const nav = (
    <nav aria-label="Table of contents">
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`group flex items-start gap-2.5 text-sm leading-snug transition-colors ${
                activeId === item.id
                  ? "font-bold text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground"
              }`}
            >
              <ChevronRight
                size={14}
                className={`mt-0.5 shrink-0 transition-colors ${
                  activeId === item.id ? "text-foreground" : "text-muted-foreground/60 group-hover:text-foreground"
                }`}
              />
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  if (variant === "mobile") {
    // Compact disclosure rendered above the article on small screens.
    return (
      <details className="mb-12 rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:hidden">
        <summary className="cursor-pointer list-none text-lg font-black tracking-tight text-foreground">
          Table of contents
        </summary>
        <div className="mt-4">{nav}</div>
      </details>
    );
  }

  // Desktop rail — stickiness is applied by the page-level wrapper.
  return (
    <div>
      <p className="mb-6 text-xl font-black tracking-tight text-foreground">Table of contents</p>
      {nav}
    </div>
  );
}
