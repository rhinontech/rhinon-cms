// Type scale and scaffolding for the sections ported from website/.
// Sections set theme-light / theme-dark, so the sec-* colours follow them.

/** Section shell: themed background, the website's gutter, widened Archivo. */
export const section = "relative isolate px-(--wgutter) leading-[1.4] [font-stretch:112%]";

/** 4-column grid the website lays everything on (1 column on phones). */
export const grid4 = "relative z-1 grid grid-cols-4 max-[809px]:grid-cols-1";

export const display =
  "font-display font-bold uppercase [font-stretch:normal] text-[clamp(52px,6.67vw,96px)] leading-[0.9] tracking-[-0.05em]";
export const hLg = "font-display font-bold uppercase text-[clamp(34px,3.4vw,48px)] leading-none tracking-[-0.05em]";
export const hMd = "font-display font-bold uppercase text-[clamp(18px,1.6vw,22px)] leading-[1.1] tracking-[-0.04em]";

/** Uppercase mono label; *strong* parts read in full ink. */
export const mono =
  "font-mono text-[11px] font-medium uppercase leading-[1.45] tracking-[0.02em] text-sec-muted [&_strong]:font-medium [&_strong]:text-sec-ink";

export const lead = "font-sans text-[clamp(17px,1.3vw,18px)] font-medium leading-[1.4] tracking-[-0.02em] text-sec-muted";

/** _muted_ words inside headings. */
export const muted = "text-sec-faint";
