"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TbPlus,
  TbTrash,
  TbArrowUp,
  TbArrowDown,
  TbAlignJustified,
  TbPhoto,
  TbVideo,
  TbBrandYoutube,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { type BlogBlock, type BlogBlockType, newBlockId } from "./types";
import { ParagraphBlock } from "./ParagraphBlock";
import { ImageBlock } from "./ImageBlock";
import { VideoBlock } from "./VideoBlock";
import { YouTubeBlock } from "./YouTubeBlock";

const BLOCK_META: Record<BlogBlockType, { label: string; icon: React.ReactNode }> = {
  paragraph: { label: "Paragraph", icon: <TbAlignJustified size={15} /> },
  image: { label: "Image", icon: <TbPhoto size={15} /> },
  video: { label: "Video", icon: <TbVideo size={15} /> },
  youtube: { label: "YouTube Video", icon: <TbBrandYoutube size={15} /> },
};

function makeBlock(type: BlogBlockType): BlogBlock {
  const id = newBlockId();
  switch (type) {
    case "paragraph":
      return { id, type, html: "" };
    case "image":
      return { id, type, url: "", alt: "", credit: "" };
    case "video":
      return { id, type, url: "", caption: "" };
    case "youtube":
      return { id, type, url: "", caption: "" };
  }
}

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: BlogBlock[];
  onChange: (blocks: BlogBlock[]) => void;
}) {
  const addBlock = (type: BlogBlockType) => onChange([...blocks, makeBlock(type)]);

  const patchBlock = (id: string, patch: Partial<BlogBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as BlogBlock) : b)));

  const removeBlock = (id: string) => onChange(blocks.filter((b) => b.id !== id));

  const moveBlock = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {blocks.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 py-10 text-center text-sm text-stone-400">
          No content yet — add your first block below.
        </div>
      )}

      {blocks.map((block, index) => (
        <div key={block.id} className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-500">
              {BLOCK_META[block.type].icon}
              {BLOCK_META[block.type].label}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => moveBlock(index, -1)}
                disabled={index === 0}
                className={cn("p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700", index === 0 && "opacity-30 pointer-events-none")}
                title="Move up"
              >
                <TbArrowUp size={15} />
              </button>
              <button
                type="button"
                onClick={() => moveBlock(index, 1)}
                disabled={index === blocks.length - 1}
                className={cn("p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700", index === blocks.length - 1 && "opacity-30 pointer-events-none")}
                title="Move down"
              >
                <TbArrowDown size={15} />
              </button>
              <span className="mx-1 h-4 w-px bg-stone-200" />
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="p-1.5 rounded-md text-stone-400 hover:bg-red-50 hover:text-red-600"
                title="Delete block"
              >
                <TbTrash size={15} />
              </button>
            </div>
          </div>

          {block.type === "paragraph" && (
            <div className="p-3">
              <ParagraphBlock html={block.html} onChange={(html) => patchBlock(block.id, { html })} />
            </div>
          )}
          {block.type === "image" && (
            <ImageBlock url={block.url} alt={block.alt} credit={block.credit} onChange={(p) => patchBlock(block.id, p)} />
          )}
          {block.type === "video" && (
            <VideoBlock url={block.url} caption={block.caption} onChange={(p) => patchBlock(block.id, p)} />
          )}
          {block.type === "youtube" && (
            <YouTubeBlock url={block.url} caption={block.caption} onChange={(p) => patchBlock(block.id, p)} />
          )}
        </div>
      ))}

      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium hover:bg-stone-100 transition-colors"
            >
              <TbPlus size={15} /> Add Content
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="min-w-[190px]">
            {(Object.keys(BLOCK_META) as BlogBlockType[]).map((type) => (
              <DropdownMenuItem key={type} onSelect={() => addBlock(type)} className="gap-2.5">
                {BLOCK_META[type].icon}
                Add {BLOCK_META[type].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
