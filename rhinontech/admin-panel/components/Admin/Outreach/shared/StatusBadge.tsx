import { cn } from "@/lib/utils";

export type CampaignStage = "Draft" | "Active" | "Paused" | "Completed";

const STAGE_STYLES: Record<CampaignStage, string> = {
  Draft: "border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300",
  Active: "border-emerald-200 dark:border-emerald-400/25 bg-emerald-50 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
  Paused: "border-border bg-muted text-foreground/70",
  Completed: "border-sky-200 dark:border-sky-400/25 bg-sky-50 dark:bg-sky-400/10 text-sky-700 dark:text-sky-300",
};

const STAGE_DOTS: Record<CampaignStage, string> = {
  Draft: "bg-amber-500",
  Active: "bg-emerald-500",
  Paused: "bg-muted-foreground/40",
  Completed: "bg-sky-500",
};

export function StatusBadge({ stage, className }: { stage: CampaignStage; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        STAGE_STYLES[stage] || STAGE_STYLES.Draft,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STAGE_DOTS[stage] || STAGE_DOTS.Draft, stage === "Active" && "animate-pulse")} />
      {stage}
    </span>
  );
}
