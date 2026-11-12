"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Small motion toolkit for the product pages. Every demo loops only while it is
 * on screen, and holds a finished frame for people who ask for reduced motion.
 */

/** True when the visitor asked their system for less motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(q.matches);
    const on = () => setReduced(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Whether the element is on screen right now. */
export function useInView<T extends Element = HTMLDivElement>(margin = "0px 0px -8% 0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: margin, threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return [ref, inView] as const;
}

/**
 * Steps 0..count-1 on a timer and loops, only while `run`. Pass `ms` as a
 * module-level constant when it is an array. Holds the last step under reduced
 * motion, so design the last step as the finished state.
 */
export function useStepper(count: number, ms: number | readonly number[], run = true) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!run || reduced) return;
    const d = typeof ms === "number" ? ms : ms[i % ms.length];
    const t = setTimeout(() => setI((x) => (x + 1) % count), d);
    return () => clearTimeout(t);
  }, [i, run, reduced, count, ms]);
  return [reduced ? count - 1 : i, setI] as const;
}

/** A wrapper that tells its render function whether it is on screen. */
export function Live({ children, className = "", style }: { children: (live: boolean) => ReactNode; className?: string; style?: CSSProperties }) {
  const [ref, live] = useInView<HTMLDivElement>();
  return <div ref={ref} className={className} style={style}>{children(live)}</div>;
}

/** A pointer that glides to wherever it is told, and presses. */
export function Cursor({ x, y, down = false, hidden = false }: { x: string | number; y: string | number; down?: boolean; hidden?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="pointer-events-none absolute z-40 h-6 w-6 drop-shadow-[0_3px_6px_rgb(0_0_0_/_0.35)] transition-[left,top,transform,opacity] duration-[950ms] ease-[cubic-bezier(.55,.1,.25,1)]"
      style={{ left: x, top: y, opacity: hidden ? 0 : 1, transform: `scale(${down ? 0.8 : 1})` }}
    >
      <path d="M5 3l14 8-6 2-3 6z" fill="#0a1128" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** Counts to `to` when `run` is true, easing out; re-counts from the old value when `to` changes. */
export function CountTo({
  to,
  run = true,
  duration = 1100,
  format = (n: number) => String(Math.round(n)),
  className = "",
}: {
  to: number;
  run?: boolean;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (!run) return;
    if (reduced) {
      setV(to);
      from.current = to;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const n = a + (to - a) * (1 - Math.pow(1 - t, 3));
      setV(n);
      from.current = n;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, duration, reduced]);
  return <span className={`tabular-nums ${className}`}>{format(v)}</span>;
}

/** A progress ring that eases to `value` (0 to 1). Children sit in the middle. */
export function Ring({
  value,
  size = 120,
  stroke = 10,
  from = "#7c5cff",
  to = "#2f5bff",
  track = "rgb(10 17 40 / 0.08)",
  duration = 1100,
  children,
  className = "",
}: {
  value: number;
  size?: number;
  stroke?: number;
  from?: string;
  to?: string;
  track?: string;
  duration?: number;
  children?: ReactNode;
  className?: string;
}) {
  const id = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
          style={{ transition: `stroke-dashoffset ${duration}ms cubic-bezier(.3,.7,.2,1)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

const CONFETTI = ["#2f5bff", "#7c5cff", "#ff5fb0", "#ffb547", "#10c98f", "#2cd3ff"];

/** A burst of confetti each time `fire` goes up. Place inside a `relative` parent. */
export function Confetti({ fire, count = 26, at = { left: "50%", top: "50%" } }: { fire: number; count?: number; at?: { left: string; top: string } }) {
  const reduced = useReducedMotion();
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = (n: number) => Math.abs(Math.sin((i + 1) * 12.9898 * n) * 43758.5453) % 1;
        const angle = r(1) * Math.PI * 2;
        const dist = 70 + r(2) * 120;
        return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 40, rot: r(3) * 720 - 360, color: CONFETTI[i % CONFETTI.length], w: 5 + r(4) * 5, delay: r(5) * 90 };
      }),
    [count],
  );
  if (!fire || reduced) return null;
  return (
    <span key={fire} aria-hidden className="pointer-events-none absolute z-30 transition-[left,top] duration-500" style={at}>
      {bits.map((b, i) => (
        <i
          key={i}
          className="confetti-bit absolute block rounded-[2px]"
          style={{ width: b.w, height: b.w * 1.6, background: b.color, animationDelay: `${b.delay}ms`, "--x": `${b.x}px`, "--y": `${b.y}px`, "--r": `${b.rot}deg` } as CSSProperties}
        />
      ))}
    </span>
  );
}

/** Types `text` out when `run` turns true, and clears when it turns false. */
export function TypeText({ text, run = true, speed = 24, className = "" }: { text: string; run?: boolean; speed?: number; className?: string }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) {
      setN(0);
      return;
    }
    if (reduced) {
      setN(text.length);
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [run, text, speed, reduced]);
  return <span className={`${run && n < text.length ? "caret" : ""} ${className}`}>{text.slice(0, n)}</span>;
}

/**
 * ClickUp-style tabs: a row of cards, each with a progress bar that fills while
 * it is the active one, then moves to the next. Pointing at the row pauses it.
 */
export function AutoTabs({
  items,
  visual,
  interval = 5200,
  dark = false,
  tone = ["#7c5cff", "#2f5bff"],
  className = "",
}: {
  items: { title: string; body: string }[];
  visual: (i: number) => ReactNode;
  interval?: number;
  dark?: boolean;
  tone?: [string, string];
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [paused, setPaused] = useState(false);
  const [i, setI] = useStepper(items.length, interval, inView && !paused);
  return (
    <div ref={ref} className={className}>
      <div className={`grid gap-3 ${items.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
        {items.map((it, k) => {
          const on = k === i;
          return (
            <button
              key={it.title}
              type="button"
              onClick={() => setI(k)}
              aria-pressed={on}
              className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
                dark
                  ? on ? "border-white/25 bg-white/[0.08]" : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  : on ? "border-ink/15 bg-white shadow-[0_24px_50px_-28px_rgb(40_30_140_/_0.4)]" : "border-line bg-white/60 hover:border-ink/15"
              }`}
            >
              <span className={`block text-[16px] font-semibold ${dark ? "text-white" : "text-ink"}`}>{it.title}</span>
              <span className={`mt-1.5 block text-[14px] leading-6 ${dark ? "text-white/60" : "text-ink-soft"}`}>{it.body}</span>
              <span className={`mt-4 block h-[3px] overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-line"}`}>
                {on && (
                  <i
                    key={`${i}-${paused}`}
                    className={paused ? "block h-full w-full" : "progress block h-full w-full"}
                    style={{ background: `linear-gradient(90deg, ${tone[0]}, ${tone[1]})`, "--dur": `${interval}ms` } as CSSProperties}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-6">{visual(i)}</div>
    </div>
  );
}

/**
 * A sticky scroll story: text scenes on one side, one visual that changes with
 * the scene on the other. On small screens each scene stacks with its own visual.
 */
export function ScrollStory({
  scenes,
  visual,
  dark = false,
  tone = "#7c5cff",
  vh = 85,
}: {
  scenes: { kicker: string; title: string; body: string }[];
  visual: (i: number, progress: number) => ReactNode;
  dark?: boolean;
  tone?: string;
  vh?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      setP(span <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / span)));
    };
    const on = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  const n = scenes.length;
  const active = Math.min(n - 1, Math.floor(p * n));
  const text = dark ? "text-white" : "text-ink";
  const sub = dark ? "text-white/60" : "text-ink-soft";
  return (
    <>
      <div ref={ref} className="relative hidden lg:block" style={{ height: `${n * vh}vh` }}>
        <div className="sticky top-[88px] grid h-[calc(100vh-110px)] max-h-[720px] grid-cols-[0.9fr_1.1fr] items-center gap-14">
          <div className="relative">
            {scenes.map((s, k) => (
              <div key={s.title} className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-500" style={{ opacity: k === active ? 1 : 0, transform: `translateY(calc(-50% + ${k === active ? 0 : k < active ? -24 : 24}px))`, pointerEvents: k === active ? "auto" : "none" }}>
                <span className="font-mono text-[12px] uppercase tracking-[0.16em]" style={{ color: tone }}>{s.kicker}</span>
                <h3 className={`font-display mt-3 text-[40px] font-semibold leading-[1.05] ${text}`}>{s.title}</h3>
                <p className={`mt-4 max-w-[460px] text-[17px] leading-8 ${sub}`}>{s.body}</p>
              </div>
            ))}
            <div className="absolute -left-6 top-1/2 hidden h-40 w-[3px] -translate-y-1/2 overflow-hidden rounded-full xl:block" style={{ background: dark ? "rgb(255 255 255 / 0.12)" : "rgb(10 17 40 / 0.08)" }}>
              <i className="block w-full rounded-full transition-all duration-500" style={{ height: `${((active + 1) / n) * 100}%`, background: tone }} />
            </div>
          </div>
          <div className="relative h-full">{visual(active, p)}</div>
        </div>
      </div>
      <div className="space-y-14 lg:hidden">
        {scenes.map((s, k) => (
          <div key={s.title}>
            <span className="font-mono text-[12px] uppercase tracking-[0.16em]" style={{ color: tone }}>{s.kicker}</span>
            <h3 className={`font-display mt-3 text-[30px] font-semibold leading-[1.08] ${text}`}>{s.title}</h3>
            <p className={`mt-3 text-[16px] leading-7 ${sub}`}>{s.body}</p>
            <div className="relative mt-6 min-h-[320px]">{visual(k, (k + 1) / n)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
