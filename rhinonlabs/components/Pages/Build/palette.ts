// Accent palette for the /build campaign page.
//
// Every class here is written out in full — Tailwind scans source text, so a class
// assembled at runtime (`bg-${color}/10`) would never be generated.
export interface Accent {
  /** Icon colour. */
  icon: string;
  /** Tinted card wash, layered over the dark background. */
  card: string;
  /** Icon tile background + ring. */
  tile: string;
  /** Small chip / pill. */
  chip: string;
  /** Coloured hairline used for top bars and dividers. */
  bar: string;
}

export const ACCENTS: Record<string, Accent> = {
  blue: {
    icon: "text-blue-400",
    card: "bg-gradient-to-br from-blue-500/[0.09] via-transparent to-transparent hover:border-blue-400/30",
    tile: "bg-blue-500/12 ring-1 ring-blue-400/25",
    chip: "bg-blue-500/12 text-blue-200 border border-blue-400/25",
    bar: "bg-gradient-to-r from-blue-400 to-blue-600",
  },
  cyan: {
    icon: "text-cyan-400",
    card: "bg-gradient-to-br from-cyan-500/[0.09] via-transparent to-transparent hover:border-cyan-400/30",
    tile: "bg-cyan-500/12 ring-1 ring-cyan-400/25",
    chip: "bg-cyan-500/12 text-cyan-200 border border-cyan-400/25",
    bar: "bg-gradient-to-r from-cyan-400 to-teal-500",
  },
  violet: {
    icon: "text-violet-400",
    card: "bg-gradient-to-br from-violet-500/[0.09] via-transparent to-transparent hover:border-violet-400/30",
    tile: "bg-violet-500/12 ring-1 ring-violet-400/25",
    chip: "bg-violet-500/12 text-violet-200 border border-violet-400/25",
    bar: "bg-gradient-to-r from-violet-400 to-purple-600",
  },
  pink: {
    icon: "text-pink-400",
    card: "bg-gradient-to-br from-pink-500/[0.09] via-transparent to-transparent hover:border-pink-400/30",
    tile: "bg-pink-500/12 ring-1 ring-pink-400/25",
    chip: "bg-pink-500/12 text-pink-200 border border-pink-400/25",
    bar: "bg-gradient-to-r from-pink-400 to-rose-500",
  },
  amber: {
    icon: "text-amber-400",
    card: "bg-gradient-to-br from-amber-500/[0.09] via-transparent to-transparent hover:border-amber-400/30",
    tile: "bg-amber-500/12 ring-1 ring-amber-400/25",
    chip: "bg-amber-500/12 text-amber-200 border border-amber-400/25",
    bar: "bg-gradient-to-r from-amber-400 to-orange-500",
  },
  emerald: {
    icon: "text-emerald-400",
    card: "bg-gradient-to-br from-emerald-500/[0.09] via-transparent to-transparent hover:border-emerald-400/30",
    tile: "bg-emerald-500/12 ring-1 ring-emerald-400/25",
    chip: "bg-emerald-500/12 text-emerald-200 border border-emerald-400/25",
    bar: "bg-gradient-to-r from-emerald-400 to-teal-500",
  },
  orange: {
    icon: "text-orange-400",
    card: "bg-gradient-to-br from-orange-500/[0.09] via-transparent to-transparent hover:border-orange-400/30",
    tile: "bg-orange-500/12 ring-1 ring-orange-400/25",
    chip: "bg-orange-500/12 text-orange-200 border border-orange-400/25",
    bar: "bg-gradient-to-r from-orange-400 to-red-500",
  },
};

export type AccentName = keyof typeof ACCENTS;

/** Shared card shell — dark glass base that the per-card accent wash sits on top of. */
export const CARD_BASE =
  "rounded-[16px] border border-white/8 bg-[#0d1119]/60 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors";

/** Gradient text used for the italic serif accent in section headings. */
export const HEADING_GRADIENT =
  "bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent";

/** The page's primary call-to-action treatment. */
export const CTA_GRADIENT =
  "bg-gradient-to-r from-[#2b6bff] via-[#4f46e5] to-[#9333ea] text-white shadow-[0_8px_30px_-6px_rgba(79,70,229,0.6)] hover:shadow-[0_10px_40px_-6px_rgba(79,70,229,0.85)] hover:brightness-110";
