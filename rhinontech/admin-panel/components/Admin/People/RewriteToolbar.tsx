"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { LetterBlock } from "@/types/letterBlocks";

interface SelectionTarget {
  blockId: string;
  selectedText: string;
  rect: DOMRect;
}

// Floating "Rewrite with AI" popover, shown when the admin selects text
// inside a LetterBlocksView. Modeled on Pages/BubbleToolbar's selection
// tracking, but driven by the plain browser Selection API (no TipTap editor
// here) and scoped to a single block — see letterTemplates.ts's ai-rewrite
// route for why a rewrite never spans more than one block.
export function RewriteToolbar({
  containerRef,
  blocks,
  onApply,
}: {
  containerRef: RefObject<HTMLElement | null>;
  blocks: LetterBlock[];
  onApply: (blockId: string, newText: string) => void;
}) {
  const [target, setTarget] = useState<SelectionTarget | null>(null);
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const openRef = useRef(false);
  openRef.current = open;

  useEffect(() => {
    const handler = () => {
      // Once the panel is open, ignore further selection changes — focusing
      // the instruction textarea also fires selectionchange, and would
      // otherwise immediately close the panel it just opened.
      if (openRef.current) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setTarget(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const container = containerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setTarget(null);
        return;
      }
      const anchorEl = (range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : (range.commonAncestorContainer as HTMLElement));
      const blockEl = anchorEl?.closest<HTMLElement>("[data-block-id]");
      const text = sel.toString().trim();
      if (!blockEl || !text) {
        setTarget(null);
        return;
      }
      setTarget({ blockId: blockEl.dataset.blockId!, selectedText: text, rect: range.getBoundingClientRect() });
      setError("");
    };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [containerRef]);

  if (!target) return null;
  const block = blocks.find((b) => b.id === target.blockId);
  if (!block || block.kind === "pagebreak") return null;

  const close = () => {
    setTarget(null);
    setOpen(false);
    setInstruction("");
    setError("");
  };

  const submit = async () => {
    if (!instruction.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch<{ blockFullText: string }>("/letter-templates/ai-rewrite", {
        method: "POST",
        body: JSON.stringify({ blockFullText: block.text, selectedText: target.selectedText, instruction: instruction.trim() }),
      });
      onApply(target.blockId, res.blockFullText);
      window.getSelection()?.removeAllRanges();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rewrite failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed z-[200]"
      style={{ left: target.rect.left + target.rect.width / 2, top: target.rect.top - 8, transform: "translate(-50%, -100%)" }}
    >
      {!open ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen(true)}
          className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-stone-800"
        >
          ✦ Rewrite with AI
        </button>
      ) : (
        <div className="w-72 rounded-xl border border-stone-200 bg-white p-3 shadow-xl">
          <p className="mb-2 truncate text-[11px] font-medium text-stone-500">&ldquo;{target.selectedText}&rdquo;</p>
          <textarea
            autoFocus
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="How should this be reworded?"
            rows={2}
            className="w-full resize-none rounded-md border border-stone-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
          {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={close} className="text-xs text-stone-500 hover:text-stone-700">
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !instruction.trim()}
              onClick={submit}
              className="rounded-md bg-stone-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Rewriting…" : "Rewrite"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
