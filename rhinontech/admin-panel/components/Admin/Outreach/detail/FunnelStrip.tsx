"use client";

import { Fragment } from "react";
import { TbChevronRight } from "react-icons/tb";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignFunnel, CampaignLead } from "../shared/types";

/**
 * Enrolled → Drafted → (Approved) → Sent → Replied at a glance.
 * Prefers the server funnel; falls back to counting the loaded leads.
 */
export function FunnelStrip({
  campaign,
  funnel,
  leads,
}: {
  campaign: Campaign;
  funnel: CampaignFunnel | null;
  leads: CampaignLead[];
}) {
  const counts: CampaignFunnel = funnel ?? {
    enrolled: leads.length,
    drafted: leads.filter((l) => l.aiDraft).length,
    approved: leads.filter((l) => l.draftApproved).length,
    sent: leads.filter((l) => ["Emailed", "Replied", "Bounced", "Unsubscribed"].includes(l.status)).length,
    replied: leads.filter((l) => l.status === "Replied").length,
    bounced: leads.filter((l) => l.status === "Bounced").length,
  };

  const steps = [
    { label: "Enrolled", value: counts.enrolled },
    { label: "Drafted", value: counts.drafted },
    ...(campaign.mode === "agent" ? [{ label: "Approved", value: counts.approved }] : []),
    { label: "Sent", value: counts.sent },
    { label: "Replied", value: counts.replied, highlight: counts.replied > 0 },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-xl glass-panel px-4 py-3">
      {steps.map((step, i) => (
        <Fragment key={step.label}>
          {i > 0 && <TbChevronRight size={16} className="shrink-0 text-stone-300" />}
          <div className="flex min-w-20 flex-col items-center px-2">
            <span
              className={cn(
                "text-xl font-bold tabular-nums",
                (step as any).highlight ? "text-emerald-600" : step.value > 0 ? "text-stone-900" : "text-stone-300"
              )}
            >
              {step.value}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{step.label}</span>
          </div>
        </Fragment>
      ))}
      {counts.bounced > 0 && (
        <div className="ml-auto flex min-w-20 flex-col items-center border-l border-stone-100 px-2">
          <span className="text-xl font-bold text-red-500 tabular-nums">{counts.bounced}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Bounced</span>
        </div>
      )}
    </div>
  );
}
