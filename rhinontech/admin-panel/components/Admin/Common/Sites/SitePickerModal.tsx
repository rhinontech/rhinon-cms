"use client";

import { TbArrowRight } from "react-icons/tb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSites } from "@/lib/sites";

/**
 * "Which brand are you working in?" — the front door to every brand-split
 * module. Content shipped its own copy of this first; this is the shared one
 * the rest of the modules use, with the wording per module.
 */
export function SitePickerModal({
  open,
  onOpenChange,
  onSelect,
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (slug: string) => void;
  title: string;
  description: string;
}) {
  const { sites, loading } = useSites();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2.5">
          {loading && <p className="text-sm text-muted-foreground">Loading brands…</p>}
          {!loading && sites.length === 0 && (
            <p className="text-sm text-muted-foreground">
              This workspace has no brands configured yet.
            </p>
          )}
          {sites.map((site) => (
            <button
              key={site.slug}
              onClick={() => onSelect(site.slug)}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-muted/40"
            >
              <div>
                <div className="text-sm font-bold text-foreground">{site.name}</div>
                <div className="text-xs text-muted-foreground">
                  {site.siteUrl?.replace(/^https?:\/\//, "") ||
                    (site.isDefault ? "Default brand" : "No site URL set")}
                </div>
              </div>
              <TbArrowRight
                size={18}
                className="shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground"
              />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
