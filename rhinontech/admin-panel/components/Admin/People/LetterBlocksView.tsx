"use client";

import type { LetterBlock } from "@/types/letterBlocks";

// Renders a resolved LetterBlock[] as selectable HTML — the text-selection
// counterpart to services/letters.ts's renderBlocksToPdf on the backend, kept
// in visual lockstep (same **bold** convention, same heading/list hierarchy)
// so what the admin selects here matches what ends up in the PDF. Each block
// carries data-block-id so RewriteToolbar can resolve a selection back to a
// specific block for the AI-rewrite call.
export function LetterBlocksView({ blocks }: { blocks: LetterBlock[] }) {
  return (
    <div className="px-6 py-5 text-[13px] leading-relaxed text-stone-800">
      {blocks.map((block) => (
        <BlockRow key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockRow({ block }: { block: LetterBlock }) {
  if (block.kind === "pagebreak") return null;

  if (block.kind === "heading") {
    return (
      <div data-block-id={block.id} className="mt-4 mb-2 font-bold text-[14px] text-[#005085]">
        {block.num ? `${block.num}. ` : ""}
        {renderInline(block.text)}
      </div>
    );
  }

  if (block.kind === "subheading") {
    return (
      <div data-block-id={block.id} className="mt-3 mb-1 font-bold text-stone-900">
        {renderInline(block.text)}
      </div>
    );
  }

  if (block.kind === "paragraph") {
    return (
      <p data-block-id={block.id} className="mb-2.5 text-justify">
        {renderInline(block.text)}
      </p>
    );
  }

  // bullet / numbered
  const marker = block.kind === "bullet" ? block.marker ?? "•" : block.marker;
  return (
    <div
      data-block-id={block.id}
      className="mb-1.5 flex gap-2"
      style={{ marginLeft: block.indent ? block.indent : 0 }}
    >
      <span className="shrink-0 text-stone-500">{marker}</span>
      <span className="text-justify">{renderInline(block.text)}</span>
    </div>
  );
}

// Splits on **bold** the same way drawFormattedText/drawListItem do on the
// backend, so wrapping stays in sync between the PDF and this preview.
function renderInline(text: string): React.ReactNode {
  const parts = text.split("**");
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>));
}
