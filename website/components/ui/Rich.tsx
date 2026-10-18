import { Fragment } from "react";

export type Tone = "base" | "strong" | "muted";
const MARKERS = /(\*[^*]+\*|_[^_]+_)/g;

// Renders copy with *strong* and _muted_ markers (see lib/content.ts).
export default function Rich({ text, mutedClass = "muted" }: { text: string; mutedClass?: string }) {
  const parts = text.split(MARKERS).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("*")) return <strong key={i}>{part.slice(1, -1)}</strong>;
        if (part.startsWith("_")) return <span key={i} className={mutedClass}>{part.slice(1, -1)}</span>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/** Same markers, split into words tagged with their tone (for per-word animation). */
export function toneWords(text: string): { w: string; tone: Tone }[] {
  const words: { w: string; tone: Tone }[] = [];
  for (const part of text.split(MARKERS).filter(Boolean)) {
    const tone: Tone = part.startsWith("*") ? "strong" : part.startsWith("_") ? "muted" : "base";
    const clean = tone === "base" ? part : part.slice(1, -1);
    for (const w of clean.split(/\s+/).filter(Boolean)) words.push({ w, tone });
  }
  return words;
}

/** Strip markers, for aria-labels and plain contexts. */
export const plain = (text: string) => text.replace(/[*_]/g, "");
