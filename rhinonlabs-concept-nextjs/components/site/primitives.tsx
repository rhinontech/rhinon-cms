import * as React from "react";
import { cn } from "@/lib/utils";

/** Small uppercase label type used for kickers, meta and captions. */
export const mono = "font-mono text-[11px] font-medium uppercase leading-[1.45] tracking-[0.02em]";

/** Expanded display face for headings. */
export const display = "font-display font-extrabold uppercase [font-stretch:112%]";

/** Serif-italic emphasis inside display headings. */
const displayEm =
  "[&_em]:font-serif [&_em]:font-normal [&_em]:italic [&_em]:normal-case [&_em]:[font-stretch:100%] [&_em]:text-[1.1em] [&_em]:leading-[0.8] [&_em]:tracking-[-0.015em]";

export const h2 = cn(display, displayEm, "text-[clamp(40px,6vw,98px)] leading-[0.9] tracking-[-0.042em]");

/** Section label: "(01) The problem". */
export function Kicker({ idx, children, className }: { idx: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={cn(mono, "mb-[clamp(20px,2.4vw,32px)] flex items-center gap-2.5", className)}>
      <span className="inline-grid h-5 min-w-8 place-items-center rounded-full border border-current px-[7px] text-[10px] leading-none">
        {idx}
      </span>
      {children}
    </p>
  );
}

/** Filled round tick used in fact lists and process steps. */
export function Tick() {
  return (
    <span aria-hidden="true" className="inline-grid size-[18px] flex-none place-items-center rounded-full bg-electric text-[10px] leading-none text-white">
      ✓
    </span>
  );
}

/**
 * Whole-label roll: the copy below slides up into place when the enclosing
 * link or button is hovered or focused.
 */
const rolled = "transition-transform duration-[550ms] ease-io in-[a:hover,button:hover,a:focus-visible]:-translate-y-full";
export function RollLabel({ children }: { children: string }) {
  return (
    <span className="relative inline-block h-[1.15em] overflow-hidden align-middle leading-[1.15]">
      <span className={cn("block", rolled)}>{children}</span>
      <span aria-hidden="true" className={cn("absolute top-full left-0 w-full", rolled)}>
        {children}
      </span>
    </span>
  );
}

/** Per-letter roll for text links: each letter carries its own copy as a text-shadow. */
export function LetterRoll({ children }: { children: string }) {
  return (
    <>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" className="inline-flex h-[1.3em] overflow-hidden align-top leading-[1.3]">
        {[...children].map((c, i) => (
          <span
            key={i}
            style={{ transitionDelay: `${i * 14}ms` }}
            className="inline-block whitespace-pre transition-transform duration-500 ease-io [text-shadow:0_1.3em_0_currentColor] in-[a:hover,a:focus-visible]:-translate-y-[1.3em]"
          >
            {c}
          </span>
        ))}
      </span>
    </>
  );
}

/**
 * Heading whose words rise out of a mask once it scrolls into view
 * (SiteEffects adds .is-in to [data-split]). Accepts strings, <em> and <br>.
 */
export function SplitHeading({
  as: Tag = "h2",
  className,
  children,
}: {
  as?: "h2" | "h1";
  className?: string;
  children: React.ReactNode;
}) {
  let n = 0;
  const words = (text: string, inEm: boolean) =>
    text.split(/(\s+)/).map((part, k) => {
      if (!part) return null;
      if (/^\s+$/.test(part)) return " ";
      const i = n++;
      return (
        <span
          key={`${i}-${k}`}
          className={cn(
            "-mx-[0.04em] -mb-[0.1em] inline-block overflow-hidden px-[0.04em] pb-[0.1em] align-top",
            inEm && "-mr-[0.16em] pr-[0.16em]"
          )}
        >
          <span
            style={{ transitionDelay: `${i * 50}ms` }}
            className="inline-block translate-y-[112%] transition-transform duration-[1050ms] ease-expo group-[.is-in]/split:translate-y-0 motion-reduce:translate-y-0"
          >
            {part}
          </span>
        </span>
      );
    });

  const walk = (node: React.ReactNode, inEm = false): React.ReactNode =>
    React.Children.map(node, (child) => {
      if (typeof child === "string") return words(child, inEm);
      if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === "em")
        return <em>{walk(child.props.children, true)}</em>;
      return child;
    });

  return (
    <Tag data-split="" className={cn("group/split", className)}>
      {walk(children)}
    </Tag>
  );
}

/** Crosshair markers where a section's top edge meets the outer column lines. */
export function SectionMarks() {
  const mark =
    "pointer-events-none absolute -top-1.5 z-2 size-[13px] opacity-45 max-sm:hidden [background:linear-gradient(currentColor,currentColor)_center/1px_100%_no-repeat,linear-gradient(currentColor,currentColor)_center/100%_1px_no-repeat]";
  const inset = "calc(max(0px, (100% - 1440px) / 2) + var(--gutter) - 6px)";
  return (
    <>
      <span aria-hidden="true" className={mark} style={{ left: inset }} />
      <span aria-hidden="true" className={mark} style={{ right: inset }} />
    </>
  );
}

/** Centered 1440px content column with the concept gutter. */
export function Wrap({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1440px] px-(--gutter)", className)}>{children}</div>;
}
