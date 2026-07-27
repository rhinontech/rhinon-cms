import { TbMailForward, TbRobot } from "react-icons/tb";
import { cn } from "@/lib/utils";

export type CampaignMode = "template" | "agent";

/** Labels the drafting mode so it's always obvious which flow a campaign uses. */
export function ModeBadge({ mode, className }: { mode: CampaignMode; className?: string }) {
  const isAgent = mode === "agent";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        isAgent
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-indigo-200 bg-indigo-50 text-indigo-700",
        className
      )}
    >
      {isAgent ? <TbRobot size={12} /> : <TbMailForward size={12} />}
      {isAgent ? "AI Agent" : "Template Blast"}
    </span>
  );
}
