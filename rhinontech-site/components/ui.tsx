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

type Variant = "primary" | "ghost" | "glass";

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

export function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] ${
        dark ? "border-white/15 bg-white/5 text-white/70" : "border-line bg-white text-ink-soft"
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="ping-soft absolute inline-flex h-full w-full rounded-full bg-violet" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet" />
      </span>
      {children}
    </span>
  );
}

export function SectionHead({
  eyebrow,
  title,
  sub,
  dark = false,
  center = true,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: string;
  dark?: boolean;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-[760px] text-center" : "max-w-[640px]"}>
      {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
      <h2 className={`font-display mt-5 text-[38px] font-semibold leading-[1.04] sm:text-[56px] ${dark ? "text-white" : "text-ink"}`}>
        {title}
      </h2>
      {sub && <p className={`mt-5 text-[17px] leading-8 sm:text-[18px] ${dark ? "text-white/65" : "text-ink-soft"}`}>{sub}</p>}
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

/** The backdrop behind a hero: soft moving colour over faint grid lines. */
export function Aurora({ tones = ["#2f5bff", "#7c5cff", "#ff5fb0"], dark = false }: { tones?: string[]; dark?: boolean }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${dark ? "" : "[mask-image:linear-gradient(to_bottom,#000_65%,transparent)]"}`}>
      <div className={`${dark ? "grid-lines-dark" : "grid-lines"} absolute inset-0`} />
      <span className="blob -left-24 top-[-10%] h-[460px] w-[460px]" style={{ background: tones[0], opacity: dark ? 0.35 : 0.28 }} />
      <span className="blob right-[-6%] top-[-14%] h-[520px] w-[520px] [animation-delay:-8s]" style={{ background: tones[1], opacity: dark ? 0.4 : 0.3 }} />
      <span className="blob left-[34%] top-[18%] h-[360px] w-[360px] [animation-delay:-15s]" style={{ background: tones[2], opacity: dark ? 0.28 : 0.22 }} />
    </div>
  );
}
