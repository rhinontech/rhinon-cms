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
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-muted/40"
            >
              <div>
                <div className="text-sm font-bold text-foreground">{d.label}</div>
                <div className="text-xs text-muted-foreground">{d.description}</div>
              </div>
              <TbArrowRight size={18} className="shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
