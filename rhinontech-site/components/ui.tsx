import Image from "next/image";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function Logo({ light = false, height = 40 }: { light?: boolean; height?: number }) {
  return (
    <Image
      src={light ? "/brand/logo-white.png" : "/brand/logo-navy.png"}
      alt="Rhinon Tech"
      width={Math.round((height * 1383) / 380)}
      height={height}
      priority
      className="w-auto"
      style={{ height }}
    />
  );
}

type Variant = "primary" | "ghost" | "glass" | "ink" | "soft";

export function Button({
  href,
  children,
  variant = "primary",
  arrow = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  arrow?: boolean;
  className?: string;
}) {
  const cls = `btn btn-${variant} group ${className}`;
  const inner = (
    <>
      {children}
      {arrow && <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
    </>
  );
  return href.startsWith("/") ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <a href={href} className={cls}>{inner}</a>
  );
}

/** Section label: violet mono caps (6.1:1 on white; a lighter violet on dark bands). */
export function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`inline-block font-mono text-[12px] font-medium uppercase tracking-[0.14em] ${dark ? "text-[#b3a6ff]" : "text-[#5b3df5]"}`}>
      {children}
    </span>
  );
}

export function SectionHead({
  eyebrow,
  title,
  sub,
  dark = false,
  as = "h2",
  center = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: string;
  dark?: boolean;
  as?: "h1" | "h2";
  /** Centred, for statement sections that introduce a full-width grid. */
  center?: boolean;
}) {
  const Tag = as;
  const size = as === "h1" ? "text-[40px] sm:text-[64px] leading-[1.02]" : "text-[34px] sm:text-[52px] leading-[1.05]";
  return (
    <div className={center ? "mx-auto max-w-[860px] text-center" : "max-w-[820px]"}>
      {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
      <Tag className={`font-display text-balance ${size} ${eyebrow ? "mt-4" : ""} ${dark ? "text-white" : "text-ink"}`}>
        {title}
      </Tag>
      {sub && <p className={`mt-5 max-w-[660px] text-[17px] leading-8 sm:text-[18px] ${center ? "mx-auto" : ""} ${dark ? "text-white/60" : "text-ink-soft"}`}>{sub}</p>}
    </div>
  );
}

/** An icon on its product's gradient. */
export function IconTile({ icon: Icon, tone, size = 44 }: { icon: LucideIcon; tone: [string, string]; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center text-white shadow-[inset_0_1px_0_rgb(255_255_255_/_0.35)]"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: `linear-gradient(140deg, ${tone[0]}, ${tone[1]})`,
        boxShadow: `0 10px 24px -10px ${tone[0]}, inset 0 1px 0 rgb(255 255 255 / 0.35)`,
      }}
    >
      <Icon style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2} />
    </span>
  );
}

/** The backdrop behind a hero: a faint grid and one soft glow. `tones` is kept for callers; only the second is used. */
export function Aurora({ tones = ["#2f5bff", "#7c5cff", "#ff5fb0"], dark = false }: { tones?: string[]; dark?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`${dark ? "grid-lines-dark" : "lt-grid"} absolute inset-0`} />
      <span className="absolute left-1/2 top-[-6%] h-[480px] w-[860px] -translate-x-1/2 rounded-full blur-[130px]" style={{ background: tones[1] ?? "#7c5cff", opacity: dark ? 0.22 : 0.13 }} />
    </div>
  );
}
