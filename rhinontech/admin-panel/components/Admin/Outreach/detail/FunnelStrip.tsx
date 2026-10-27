"use client";

import { TbUsers, TbSparkles, TbMailOpened, TbEye, TbMessageCircle, TbBan } from "react-icons/tb";
import { cn } from "@/lib/utils";
import type { CampaignFunnel, CampaignLead } from "../shared/types";

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

/**
 * Enrolled → Drafted → Sent → Opened → Replied as one funnel card. Each step
 * shows its rate against the step that feeds it, which is the number people
 * actually ask for ("what's our open rate?"), and a bar for the eye.
 * Prefers the server funnel; falls back to counting the loaded leads.
 */
export function FunnelStrip({
  funnel,
  leads,
}: {
  funnel: CampaignFunnel | null;
  leads: CampaignLead[];
}) {
  const counts: CampaignFunnel = funnel ?? {
    enrolled: leads.length,
    drafted: leads.filter((l) => l.aiDraft).length,
    approved: leads.filter((l) => l.draftApproved).length,
    sent: leads.filter((l) => ["Emailed", "Replied", "Bounced"].includes(l.status)).length,
    opened: leads.filter((l) => l.emailOpened).length,
    replied: leads.filter((l) => l.status === "Replied").length,
    bounced: leads.filter((l) => l.status === "Bounced").length,
  };

  const steps = [
    { label: "Enrolled", value: counts.enrolled, icon: TbUsers, rate: null, of: "", tone: "bg-slate-400" },
    { label: "Drafted", value: counts.drafted, icon: TbSparkles, rate: pct(counts.drafted, counts.enrolled), of: "of enrolled", tone: "bg-violet-500" },
    { label: "Sent", value: counts.sent, icon: TbMailOpened, rate: pct(counts.sent, counts.enrolled), of: "of enrolled", tone: "bg-sky-500" },
    { label: "Opened", value: counts.opened, icon: TbEye, rate: pct(counts.opened, counts.sent), of: "open rate", tone: "bg-amber-500" },
    { label: "Replied", value: counts.replied, icon: TbMessageCircle, rate: pct(counts.replied, counts.sent), of: "reply rate", tone: "bg-emerald-500" },
    ...(counts.bounced > 0
      ? [{ label: "Bounced", value: counts.bounced, icon: TbBan, rate: pct(counts.bounced, counts.sent), of: "bounce rate", tone: "bg-rose-500" }]
      : []),
  ];

  return (
    <div className={cn("grid overflow-hidden rounded-xl glass-card divide-border", "grid-cols-2 divide-y sm:divide-y-0 sm:divide-x", steps.length > 5 ? "sm:grid-cols-6" : "sm:grid-cols-5")}>
      {steps.map(({ label, value, icon: Icon, rate, of, tone }) => (
        <div key={label} className="min-w-0 px-4 py-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Icon size={14} className="shrink-0" />
            {label}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn("text-2xl font-semibold tracking-tight tabular-nums text-foreground", label === "Bounced" && "text-rose-600 dark:text-rose-400")}>
              {value.toLocaleString()}
            </span>
            {rate !== null && <span className="truncate text-xs tabular-nums text-muted-foreground">{`${rate}% ${of}`}</span>}
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
            <div className={cn("h-full rounded-full", tone)} style={{ width: `${rate === null ? (value > 0 ? 100 : 0) : Math.min(rate, 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
