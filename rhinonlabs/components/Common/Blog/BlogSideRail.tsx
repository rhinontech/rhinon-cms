"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* Monochrome brand-ish marks for the AI tools (simple inline glyphs, white theme). */
function GptGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v5.3M12 15.2v5.3M4.6 7.75l4.6 2.65M14.8 13.6l4.6 2.65M4.6 16.25l4.6-2.65M14.8 10.4l4.6-2.65" />
    </svg>
  );
}
function ClaudeGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </svg>
  );
}
function PerplexityGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}
function GrokGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}

const AI_TOOLS = [
  { label: "ChatGPT", glyph: <GptGlyph />, href: (p: string) => `https://chatgpt.com/?q=${p}` },
  { label: "Claude", glyph: <ClaudeGlyph />, href: (p: string) => `https://claude.ai/new?q=${p}` },
  { label: "Perplexity", glyph: <PerplexityGlyph />, href: (p: string) => `https://www.perplexity.ai/search?q=${p}` },
  { label: "Grok", glyph: <GrokGlyph />, href: (p: string) => `https://grok.com/?q=${p}` },
];

export function BlogSideRail({ url }: { title?: string; url: string }) {
  const summarizePrompt = encodeURIComponent(`Summarize this article for me: ${url}`);

  return (
    <div className="space-y-8">
      {/* Assessment card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
            Rhinon Labs
          </span>
        </div>

        <p className="mb-3 text-xl font-black leading-snug tracking-tight text-foreground">
          Get an honest MVP assessment in 5 minutes.
        </p>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          We tell you what to build, what to skip, and what it&apos;ll actually cost. No fluff.
        </p>

        <Link
          href="/contact-us"
          className="group flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-bold text-slate-950 transition-all hover:bg-white/90"
        >
          Assess My Idea
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </Link>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-xs text-muted-foreground">Free · 5 minutes · No obligation</p>
        </div>
      </div>

      {/* Summarize with AI */}
      {/* <div>
        <p className="mb-4 text-lg font-black tracking-tight text-foreground">Summarize with AI</p>
        <div className="flex gap-2.5">
          {AI_TOOLS.map((tool) => (
            <a
              key={tool.label}
              href={tool.href(summarizePrompt)}
              target="_blank"
              rel="noreferrer"
              title={`Summarize with ${tool.label}`}
              aria-label={`Summarize with ${tool.label}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-foreground/80 transition-all hover:border-white/30 hover:bg-white hover:text-slate-950"
            >
              {tool.glyph}
            </a>
          ))}
        </div>
      </div> */}
    </div>
  );
}
