import { cn } from "@/lib/utils";

export type CampaignStage = "Draft" | "Active" | "Paused" | "Completed";

const STAGE_STYLES: Record<CampaignStage, string> = {
  Draft: "border-amber-200 bg-amber-50 text-amber-700",
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Paused: "border-stone-200 bg-stone-100 text-stone-600",
  Completed: "border-sky-200 bg-sky-50 text-sky-700",
};

const STAGE_DOTS: Record<CampaignStage, string> = {
  Draft: "bg-amber-500",
  Active: "bg-emerald-500",
  Paused: "bg-stone-400",
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
