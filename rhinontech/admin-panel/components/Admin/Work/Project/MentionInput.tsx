"use client";

import { KeyboardEvent, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PersonOption } from "./types";

/**
 * Mentions are stored in the comment body as `@[Full Name](userId)`.
 *
 * Encoding the id alongside the display name means a rename doesn't orphan the
 * reference, and the raw body stays human-readable anywhere it is shown without
 * a parser (email digests, the collaborator portal).
 */
export const MENTION_RE = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;

/** Renders a stored body, turning mention tokens into chips. */
export function renderMentions(body: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(MENTION_RE.source, "g");
  while ((m = re.exec(body)) !== null) {
    if (m.index > last) out.push(body.slice(last, m.index));
    out.push(
      <span key={`${m.index}-${m[2]}`} className="rounded bg-blue-50 px-1 font-medium text-blue-700">
        @{m[1]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < body.length) out.push(body.slice(last));
  return out;
}

/** Plain-text form, for anywhere a chip can't render. */
export function stripMentions(body: string): string {
  return body.replace(new RegExp(MENTION_RE.source, "g"), "@$1");
}

export function MentionInput({
  value, onChange, onSubmit, people, placeholder, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  people: PersonOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<{ text: string; at: number } | null>(null);
  const [highlight, setHighlight] = useState(0);

  const matches = useMemo(() => {
    if (!query) return [];
    const q = query.text.toLowerCase();
    return people.filter((p) => p.fullName.toLowerCase().includes(q)).slice(0, 6);
  }, [query, people]);

  /** Re-derives the active @query from the caret each time the text changes. */
  const syncQuery = (text: string, caret: number) => {
    const upto = text.slice(0, caret);
    const at = upto.lastIndexOf("@");
    // Only a bare @ that starts a word and has no whitespace after it counts.
    if (at === -1 || (at > 0 && !/\s/.test(upto[at - 1]))) { setQuery(null); return; }
    const frag = upto.slice(at + 1);
    if (/\s/.test(frag) || frag.length > 30) { setQuery(null); return; }
    setQuery({ text: frag, at });
    setHighlight(0);
  };

  const pick = (person: PersonOption) => {
    if (!query) return;
    const caret = ref.current?.selectionStart ?? value.length;
    const next = `${value.slice(0, query.at)}@[${person.fullName}](${person.id}) ${value.slice(caret)}`;
    onChange(next);
    setQuery(null);
    requestAnimationFrame(() => ref.current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (query && matches.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => (h + 1) % matches.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => (h - 1 + matches.length) % matches.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pick(matches[highlight]); return; }
      if (e.key === "Escape") { setQuery(null); return; }
    }
    // Enter sends; Shift+Enter is a newline.
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); }
  };

  return (
    <div className="relative flex-1">
      {query && matches.length > 0 && (
        <div className="absolute bottom-full left-0 z-20 mb-1 w-64 overflow-hidden rounded-lg border bg-white shadow-lg">
          {matches.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); pick(p); }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "block w-full truncate px-3 py-1.5 text-left text-sm",
                i === highlight ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
              )}
            >
              {p.fullName}
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={ref}
        rows={1}
        value={value}
        disabled={disabled}
        placeholder={placeholder ?? "Write a comment…  @ to mention"}
        onChange={(e) => { onChange(e.target.value); syncQuery(e.target.value, e.target.selectionStart); }}
        onClick={(e) => syncQuery(value, (e.target as HTMLTextAreaElement).selectionStart)}
        onKeyDown={onKeyDown}
        className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
