import type { ReactNode } from "react";

/* Minimal light system: Geist headlines, mono labels, generous spacing, one violet glow. */

export const MONO = "font-mono text-[11px] uppercase tracking-[0.2em]";

export function LightSection({ children, className = "", border = false }: { children: ReactNode; className?: string; border?: boolean }) {
  return (
    <section className={`relative px-5 py-24 sm:py-32 ${border ? "border-t border-line" : ""} ${className}`}>
      <div className="mx-auto max-w-[1240px]">{children}</div>
    </section>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return <p className={`${MONO} text-muted`}>{children}</p>;
}

export function H2({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`font-display text-[36px] font-semibold leading-[1.04] text-ink sm:text-[60px] ${className}`}>{children}</h2>;
}

export function Glow({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`pointer-events-none absolute rounded-full bg-[#7c5cff]/[0.13] blur-[130px] ${className}`} />;
}
