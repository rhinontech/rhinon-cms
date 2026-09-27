import type { ReactNode } from "react";

/**
 * Section heading in the homepage's voice: a letter-spaced blue eyebrow over a
 * tight extrabold navy title.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  accentClass = "text-[#0052FF]",
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  accentClass?: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "text-center max-w-2xl mx-auto" : "max-w-2xl"}>
      <p
        className={`text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase mb-3 ${accentClass}`}
      >
        {eyebrow}
      </p>
      <h2 className="text-2xl sm:text-[32px] font-extrabold text-[#0B1B3D] tracking-tight leading-[1.15]">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-[15px] sm:text-base text-[#475569] leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}

/** White card with the hairline border and soft lift used across the site. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white border border-[#E6EAF2] rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

/** Small uppercase pill, as on the events listing ("Workshop", "Limited seats"). */
export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

/** Vertical rhythm between body sections. */
export function Section({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 py-10 sm:py-12 border-t border-[#EEF1F6] first:border-t-0 first:pt-0">
      {children}
    </section>
  );
}
