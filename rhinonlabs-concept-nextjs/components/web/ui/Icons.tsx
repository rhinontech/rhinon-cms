import { cn } from "@/lib/utils";
// Small inline icons recreated from the original export.

type IconProps = { className?: string };

export function LogoMark({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 22 16" fill="currentColor" aria-hidden="true">
      <circle cx="14.0555" cy="7.94446" r="7.94446" />
      <path d="M5.26717 0.494141C2.19871 1.57906 0 4.50433 0 7.94434C0 11.3842 2.19887 14.3085 5.26717 15.3936V0.494141Z" />
    </svg>
  );
}

export function Chevron({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4l8 8-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Plus({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function Play({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 22 22" fill="currentColor" aria-hidden="true">
      <path d="M20.5 10.134C21.1667 10.5189 21.1667 11.4811 20.5 11.866L7 19.6603C6.33334 20.0452 5.5 19.564 5.5 18.7942L5.5 3.20577C5.5 2.43597 6.33333 1.95485 7 2.33975L20.5 10.134Z" />
    </svg>
  );
}

export function ArrowUpRight({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 14 14" aria-hidden="true">
      <rect width="14" height="14" fill="#D7D7D7" />
      <path d="M5 9.5L9.5 5M5.4 4.5h4.1v4.1" stroke="#171717" strokeWidth="0.95" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DoubleCheck({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <path d="M10.716 6.226 4.416 12.414a.84.84 0 0 1-1.182 0L.534 9.762a.844.844 0 0 1 1.182-1.204l2.11 2.071 5.708-5.606a.844.844 0 0 1 1.182 1.203Zm6.761-1.195a.844.844 0 0 0-1.195-.011l-5.707 5.609-.554-.544a.844.844 0 0 0-1.183 1.203l1.146 1.126a.84.84 0 0 0 1.182 0l6.3-6.188a.844.844 0 0 0 .011-1.195Z" />
    </svg>
  );
}

export function Calendar({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="0.75" />
      <path d="M16.5 2.25v3M7.5 2.25v3M3.75 8.25h16.5" strokeLinecap="round" />
      <g fill="currentColor" stroke="none">
        <circle cx="12" cy="12.4" r="1.1" />
        <circle cx="16.1" cy="12.4" r="1.1" />
        <circle cx="7.9" cy="16.1" r="1.1" />
        <circle cx="12" cy="16.1" r="1.1" />
        <circle cx="16.1" cy="16.1" r="1.1" />
      </g>
    </svg>
  );
}

export function QuoteMark({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 157 129" fill="currentColor" aria-hidden="true">
      <path d="M44.346 56.3698C44.346 30.0095 74.5459 28.4713 74.5459 28.4713V0C11.4942 0 0 43.3191 0 63.9899V129H74.5538V56.3698H44.346ZM126.792 56.3698C126.792 30.0095 157 28.4713 157 28.4713V0C93.9403 0 82.4462 43.3191 82.4462 63.9899V129H157V56.3698H126.792Z" />
    </svg>
  );
}

/** The six-dot "drag handle" glyph used in card corners. */
export function GripDots({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 8 14" fill="currentColor" aria-hidden="true">
      {[0, 5, 10].map((y) => (
        <g key={y}>
          <circle cx="1.5" cy={y + 2} r="1" />
          <circle cx="6.5" cy={y + 2} r="1" />
        </g>
      ))}
    </svg>
  );
}

/** Row of 1–4 dots used in card label bars. */
export function Dots({ count = 1, className }: IconProps & { count?: number }) {
  return (
    <span className={cn("inline-flex gap-[3px]", className)} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="size-1 rounded-full bg-current opacity-45" />
      ))}
    </span>
  );
}
