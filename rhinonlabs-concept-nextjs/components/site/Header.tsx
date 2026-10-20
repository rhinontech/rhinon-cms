"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LetterRoll, RollLabel, mono } from "@/components/site/primitives";
import { navLinks, pad, siteConfig } from "@/lib/data";
import { cn } from "@/lib/utils";

const clockFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

/** Live Hyderabad time, refreshed every 10 seconds. */
function useClock() {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const tick = () => setTime(clockFormat.format(new Date()));
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/**
 * Header colour follows the section underneath it (any element with
 * data-theme), and it frosts once the page has scrolled.
 */
function useHeaderTheme() {
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let queued = false;
    const update = () => {
      queued = false;
      let theme = "light";
      for (const s of document.querySelectorAll<HTMLElement>("[data-theme]")) {
        const r = s.getBoundingClientRect();
        if (r.top <= 34 && r.bottom > 34) {
          theme = s.dataset.theme ?? "light";
          break;
        }
      }
      setDark(theme === "dark");
      setScrolled(window.scrollY > 40);
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return { dark, scrolled };
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const time = useClock();
  const { dark, scrolled } = useHeaderTheme();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <>
      <header
        data-dark={dark || undefined}
        data-scrolled={scrolled || undefined}
        className="group/hdr fixed inset-x-0 top-0 z-100 grid grid-cols-[1fr_auto_1fr] items-center px-(--gutter) py-4 text-ink transition-colors duration-450 data-dark:text-paper-2 max-sm:py-3"
      >
        {/* Frosted bar, tinted to the section underneath */}
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-1 bg-[rgb(236_236_232/0.78)] opacity-0 backdrop-blur-[14px] transition-[opacity,background-color] duration-400 group-data-dark/hdr:bg-[rgb(12_13_16/0.72)] group-data-scrolled/hdr:opacity-100"
        />
        <a href="#top" aria-label="Rhinon Labs — back to top">
          <img
            src="/img/logo-light.webp"
            alt="Rhinon Labs"
            width={120}
            height={42}
            className="h-7 w-auto brightness-0 transition-[filter] duration-450 group-data-dark/hdr:brightness-100 max-sm:h-6"
          />
        </a>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="menu"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className={cn(mono, "group/menu inline-flex h-[38px] items-center gap-[9px] justify-self-center px-1.5")}
        >
          <span aria-hidden="true" className="relative size-2.5">
            <span className="absolute top-[calc(50%-0.75px)] left-0 h-[1.5px] w-full bg-current transition-transform duration-500 ease-io group-aria-expanded/menu:rotate-45" />
            <span className="absolute top-[calc(50%-0.75px)] left-0 h-[1.5px] w-full rotate-90 bg-current transition-transform duration-500 ease-io group-aria-expanded/menu:rotate-135" />
          </span>
          <RollLabel>Index</RollLabel>
        </button>
        <div className="flex items-center gap-[18px] justify-self-end">
          <span className={cn(mono, "inline-flex items-center gap-1.5 opacity-80 max-sm:hidden")}>
            <span
              aria-hidden="true"
              className="mr-0.5 inline-block size-[7px] animate-pulse-dot rounded-full bg-electric shadow-[0_0_0_3px_oklch(54.6%_0.245_262.881/0.18)]"
            />
            Hyderabad <time>{time}</time> IST
          </span>
          <Button asChild size="sm">
            <a href={siteConfig.bookCall} target="_blank" rel="noopener">
              <RollLabel>Book a call</RollLabel>
            </a>
          </Button>
        </div>
      </header>

      <nav
        ref={menuRef}
        id="menu"
        aria-label="Site"
        data-open={open || undefined}
        className="invisible fixed top-[62px] left-1/2 z-110 w-[min(360px,calc(100vw-24px))] -translate-x-1/2 rounded-[18px] bg-ink-2 p-[22px] text-paper-2 shadow-[0_30px_80px_rgba(0,0,0,0.35)] transition-[clip-path,visibility] duration-600 ease-io [clip-path:inset(0_0_100%_0_round_18px)] data-open:visible data-open:[clip-path:inset(0_0_0_0_round_18px)]"
      >
        <ul>
          {navLinks.map((l, i) => (
            <li key={l.href} className="flex items-center justify-between border-b border-paper-2/12">
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-[13px] font-display text-[15px] font-semibold uppercase tracking-[-0.01em] [font-stretch:108%]"
              >
                <LetterRoll>{l.label}</LetterRoll>
              </a>
              <span className={cn(mono, "text-paper-2/60")}>{pad(i + 1)}</span>
            </li>
          ))}
        </ul>
        <a
          href={`mailto:${siteConfig.email}`}
          className="mt-[26px] mb-2 block font-display text-xl font-extrabold leading-[1.05] tracking-[-0.02em] break-all text-electric uppercase [font-stretch:108%]"
        >
          {siteConfig.email}
        </a>
        <div className={cn(mono, "flex justify-between gap-3 text-paper-2/60")}>
          <a href={siteConfig.phoneHref} className="hover:text-paper-2">
            Call {siteConfig.phone}
          </a>
          <a href={siteConfig.whatsapp} target="_blank" rel="noopener" className="hover:text-paper-2">
            WhatsApp ↗
          </a>
        </div>
      </nav>
    </>
  );
}
