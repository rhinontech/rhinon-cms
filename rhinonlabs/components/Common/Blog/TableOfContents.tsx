"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";
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
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`group flex items-start gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold leading-snug transition-colors ${
                activeId === item.id
                  ? "text-cyan-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`mt-1 h-4 w-0.5 shrink-0 rounded-full transition-colors ${
                  activeId === item.id ? "bg-cyan-400" : "bg-white/10 group-hover:bg-white/25"
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
      <details className="mb-12 rounded-2xl border border-white/5 bg-secondary/20 p-4 backdrop-blur-md lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          <List size={14} className="text-cyan-400" /> On this page
        </summary>
        <div className="mt-3">{nav}</div>
      </details>
    );
  }

  // Sticky rail beside the article on desktop.
  return (
    <div className="sticky top-32 hidden lg:block">
      <p className="mb-4 flex items-center gap-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
        <List size={14} className="text-cyan-400" /> On this page
      </p>
      {nav}
    </div>
  );
}
