"use client";

import { TbUsers, TbSparkles, TbMailOpened, TbEye, TbMessageCircle, TbBan } from "react-icons/tb";
import { StatCard } from "../shared/StatCard";
import type { CampaignFunnel, CampaignLead } from "../shared/types";

/**
 * Enrolled / Drafted / Sent / Replied at a glance — same stat-tile language as
 * the Outreach Overview page, so the detail page reads as part of one product.
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

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <StatCard label="Enrolled" value={counts.enrolled} icon={<TbUsers size={16} />} />
      <StatCard label="Drafted" value={counts.drafted} icon={<TbSparkles size={16} />} />
      <StatCard label="Sent" value={counts.sent} icon={<TbMailOpened size={16} />} />
      <StatCard label="Opened" value={counts.opened} icon={<TbEye size={16} />} />
      <StatCard
        label="Replied"
        value={counts.replied}
        icon={<TbMessageCircle size={16} />}
        className={counts.replied > 0 ? "ring-1 ring-emerald-200 bg-emerald-50/40 dark:bg-emerald-400/10" : undefined}
      />
      {counts.bounced > 0 && (
        <StatCard
          label="Bounced"
          value={counts.bounced}
          icon={<TbBan size={16} />}
          className="ring-1 ring-red-200 bg-red-50/40 dark:bg-red-400/10 sm:col-span-5"
        />
      )}
    </div>
  );
}
