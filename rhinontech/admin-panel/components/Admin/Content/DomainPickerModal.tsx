"use client";

import { TbArrowRight } from "react-icons/tb";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CONTENT_DOMAINS, type ContentDomain } from "./domains";

export function DomainPickerModal({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (domain: ContentDomain) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Which site are you publishing to?</DialogTitle>
          <DialogDescription>Content is managed separately per website.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2.5">
          {CONTENT_DOMAINS.map((d) => (
            <button
              key={d.slug}
              onClick={() => onSelect(d.slug)}
              className="group flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 text-left transition-colors hover:border-stone-900 hover:bg-stone-50"
            >
              <div>
                <div className="text-sm font-bold text-stone-900">{d.label}</div>
                <div className="text-xs text-stone-500">{d.description}</div>
              </div>
              <TbArrowRight size={18} className="shrink-0 text-stone-300 transition-colors group-hover:text-stone-900" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
