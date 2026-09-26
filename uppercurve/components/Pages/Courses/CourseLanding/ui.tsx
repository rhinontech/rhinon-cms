import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * The course page's section heading: a letter-spaced eyebrow over a large,
 * tight title. Bigger than the events heading because the course page is
 * one long argument rather than a listing.
 */
export function CourseHeading({
  eyebrow,
  title,
  description,
  dark = false,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  dark?: boolean;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "text-center max-w-3xl mx-auto" : "max-w-3xl"}>
      <p
        className={`text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase mb-4 ${
          dark ? "text-[#7DD3FC]" : "text-[#0052FF]"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`text-[32px] sm:text-5xl lg:text-[56px] font-extrabold tracking-[-0.03em] leading-[1.04] ${
          dark ? "text-white" : "text-[#0B1B3D]"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p className={`mt-5 text-base sm:text-lg leading-relaxed ${dark ? "text-white/65" : "text-[#475569]"}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** Brand gradient text, as on the events hero. */
export function GradientText({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-[#0052FF] via-[#0077FF] to-[#00C2FF] bg-clip-text text-transparent">
      {children}
    </span>
  );
}

/** Solid blue call to action, matching the events pages. */
export function PrimaryCta({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 bg-[#0052FF] hover:bg-[#0043CC] text-white font-bold text-xs sm:text-[13px] tracking-wider uppercase px-7 py-4 rounded-[4px] shadow-[0_14px_30px_-12px_rgba(0,82,255,0.75)] transition-all active:scale-[0.98] ${className}`}
    >
      {children}
      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

/** Faint grid used behind the dark sections. */
export function DarkGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
    />
  );
}
