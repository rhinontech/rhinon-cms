"use client";

import { TbBrandLinkedin, TbCopy, TbMail, TbPhoto, TbTrash } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { CHANNEL_COLORS, isSocialChannel, type Template } from "./types";

export function TemplateCard({
  template,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  template: Template;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const social = isSocialChannel(template.channel);
  return (
    <div
      onClick={onOpen}
      className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl glass-panel p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className={cn("shrink-0 rounded-lg border p-2 text-lg", CHANNEL_COLORS[template.channel] || "border-stone-100 bg-stone-50 text-stone-400")}>
          {social ? <TbBrandLinkedin size={18} /> : <TbMail size={18} />}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-stone-900">{template.name}</h3>
          <div className="mt-0.5 flex items-center gap-2">
            <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest", CHANNEL_COLORS[template.channel] || "border-stone-200 bg-stone-100 text-stone-500")}>
              {template.channel}
            </span>
            {template.imageUrl && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-widest text-stone-400">
                <TbPhoto size={10} /> Image
              </span>
            )}
            {!social && template.subject && (
              <span className="max-w-[180px] truncate text-xs text-stone-400">{template.subject}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="rounded p-1.5 text-stone-300 hover:text-stone-700"
          title="Duplicate"
        >
          <TbCopy size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded p-1.5 text-stone-300 hover:text-red-600"
          title="Delete"
        >
          <TbTrash size={16} />
        </button>
      </div>
    </div>
  );
}
