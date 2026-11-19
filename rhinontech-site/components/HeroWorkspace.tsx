"use client";

import Image from "next/image";
import { Bell, Check, Mail, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { bySlug } from "@/content/products";
import { AppWindow, ProductMock } from "@/components/ProductMocks";

const VIEWS = ["crm", "outreach", "chatbot", "work", "payroll"] as const;
const SLUG: Record<(typeof VIEWS)[number], string> = { crm: "crm", outreach: "outreach", chatbot: "chatbot", work: "work", payroll: "payroll" };
const DURATION = 6000;

/**
 * The product, live in the hero: a workspace window that cycles through five
 * modules, and tilts flat as you scroll toward it.
 */
export function HeroWorkspace() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !inView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % VIEWS.length), DURATION);
    return () => clearTimeout(t);
  }, [active, paused, inView]);

  useEffect(() => {
    const el = tilt.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const p = Math.min(1, Math.max(0, (vh * 0.98 - rect.top) / (vh * 0.62)));
      el.style.transform = `perspective(1800px) rotateX(${(1 - p) * 14}deg) scale(${0.95 + p * 0.05})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const current = VIEWS[active];

  return (
    <div ref={rootRef} className="relative mx-auto max-w-[1080px]" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      {/* Events landing on the workspace */}
      <div className="glass-chip float-a absolute -top-7 right-[9%] z-10 hidden items-center gap-2.5 rounded-2xl px-3.5 py-2.5 lg:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white"><Mail className="h-4 w-4" /></span>
        <span className="text-[12.5px] leading-4"><b className="block font-semibold">Reply received 🎉</b><span className="text-muted">Priya Nair · Lumen Foods</span></span>
      </div>
      <div className="glass-chip float-b absolute top-[58%] z-10 hidden items-center gap-2.5 rounded-2xl px-3.5 py-2.5 xl:-right-24 xl:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet text-white"><Bell className="h-4 w-4" /></span>
        <span className="text-[12.5px] leading-4"><b className="block font-semibold">Meeting booked</b><span className="text-muted">Tomorrow, 11:00 am</span></span>
      </div>
      <div className="glass-chip float-c absolute -bottom-6 left-[8%] z-10 hidden items-center gap-2.5 rounded-2xl px-3.5 py-2.5 lg:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber text-white"><Wallet className="h-4 w-4" /></span>
        <span className="text-[12.5px] leading-4"><b className="block font-semibold">Payslips ready</b><span className="flex items-center gap-1 text-muted"><Check className="h-3 w-3 text-emerald-500" />42 sent</span></span>
      </div>

      <div ref={tilt} className="hero-tilt origin-top will-change-transform">
        <AppWindow url={`rhinontech.in/${current}`}>
          <div className="flex min-h-[430px]">
            <nav aria-label="Product views" className="flex w-[64px] shrink-0 flex-col gap-1 border-r border-line bg-soft/60 p-2 sm:w-[168px] sm:p-3">
              <span className="mb-2 hidden items-center gap-2 px-1.5 sm:flex">
                <Image src="/brand/mark-navy.png" alt="" width={22} height={22} />
                <b className="font-display text-[14px] font-semibold">Rhinon</b>
              </span>
              {VIEWS.map((v, i) => {
                const product = bySlug(SLUG[v])!;
                const Icon = product.icon;
                const on = i === active;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={on}
                    className={`relative flex items-center gap-2.5 overflow-hidden rounded-xl px-2.5 py-2.5 text-left text-[12.5px] font-medium transition-colors ${on ? "bg-white text-ink shadow-sm ring-1 ring-line" : "text-muted hover:bg-white/70 hover:text-ink"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" style={on ? { color: product.tone[0] } : undefined} />
                    <span className="hidden sm:inline">{product.name}</span>
                    {on && !paused && (
                      <i key={`${active}-bar`} className="progress absolute inset-x-0 bottom-0 h-[2px]" style={{ "--dur": `${DURATION}ms`, background: `linear-gradient(90deg, ${product.tone[0]}, ${product.tone[1]})` } as React.CSSProperties} />
                    )}
                  </button>
                );
              })}
            </nav>
            <div key={current} className="line-in min-w-0 flex-1 bg-white" style={{ "--d": "0ms" } as React.CSSProperties}>
              <ProductMock k={current} />
            </div>
          </div>
        </AppWindow>
      </div>
    </div>
  );
}
