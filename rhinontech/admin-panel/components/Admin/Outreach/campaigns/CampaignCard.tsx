"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TbCalendar, TbDotsVertical, TbPlayerPause, TbPlayerPlay, TbRefresh, TbSend, TbTrash } from "react-icons/tb";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "../shared/StatusBadge";
import type { Campaign } from "../shared/types";

/** Column layout shared by the header and every row, so they always line up. */
export const CAMPAIGN_COLS = "minmax(220px,2.4fr) 120px minmax(150px,1.2fr) 84px 92px 92px 84px 40px";

const rate = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 1000) / 10}%` : "—");

export function CampaignTableHeader() {
  return (
    <div
      style={{ gridTemplateColumns: CAMPAIGN_COLS }}
      className="sticky top-0 z-10 grid items-center gap-4 border-b glass-thead px-4 py-2.5 text-[11px] font-medium text-muted-foreground"
    >
      <span>Campaign</span>
      <span>Status</span>
      <span>Progress</span>
      <span className="text-right">Sent</span>
      <span className="text-right">Opened</span>
      <span className="text-right">Replied</span>
      <span className="text-right">Bounced</span>
      <span />
    </div>
  );
}

/**
 * One campaign as a table row: the numbers that tell campaigns apart (sent,
 * open rate, reply rate, bounces) side by side, so a list of thirty can be
 * compared at a glance. The whole row opens the campaign.
 */
export function CampaignCard({
  campaign,
  detailHref,
  onPause,
  onResume,
  onReset,
  onDelete,
}: {
  campaign: Campaign;
  detailHref: string;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const m = campaign.metrics ?? { enrolled: campaign.leadsTotal, sent: campaign.leadsProcessed, opened: 0, replied: 0, bounced: 0 };
  const total = Math.max(m.enrolled, campaign.leadsTotal);
  const pct = total ? Math.min(100, Math.round((m.sent / total) * 100)) : 0;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(detailHref)}
      onKeyDown={(e) => { if (e.key === "Enter") router.push(detailHref); }}
      style={{ gridTemplateColumns: CAMPAIGN_COLS }}
      className="group grid cursor-pointer items-center gap-4 border-b px-4 py-3 text-[13px] outline-none transition-colors last:border-b-0 hover:bg-foreground/[0.025] focus-visible:bg-foreground/[0.04]"
    >
      <div className="min-w-0">
        <Link href={detailHref} onClick={(e) => e.stopPropagation()} className="block truncate font-medium text-foreground group-hover:text-brand">
          {campaign.name}
        </Link>
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {campaign.autoSend ? <TbCalendar size={12} className="shrink-0" /> : <TbSend size={12} className="shrink-0" />}
          <span className="shrink-0">
            {campaign.autoSend ? `${new Date(campaign.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${campaign.runTime || "09:00"}` : "Manual send"}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className={cn("truncate", !campaign.subject && "italic")}>{campaign.subject || "No subject yet"}</span>
        </p>
      </div>

      <div><StatusBadge stage={campaign.stage} /></div>

      <div className="min-w-0">
        <div className="flex items-baseline justify-between text-xs tabular-nums">
          <span className="text-foreground/80">{`${m.sent.toLocaleString()} / ${total.toLocaleString()}`}</span>
          <span className="text-muted-foreground">{`${pct}%`}</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/[0.07]">
          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <span className="text-right tabular-nums text-foreground/85">{m.sent.toLocaleString()}</span>
      <span className="text-right tabular-nums">
        <span className="text-foreground/85">{m.opened.toLocaleString()}</span>
        <span className="block text-[11px] text-muted-foreground">{rate(m.opened, m.sent)}</span>
      </span>
      <span className="text-right tabular-nums">
        <span className={cn(m.replied > 0 ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-foreground/85")}>{m.replied.toLocaleString()}</span>
        <span className="block text-[11px] text-muted-foreground">{rate(m.replied, m.sent)}</span>
      </span>
      <span className={cn("text-right tabular-nums", m.bounced > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
        {m.bounced.toLocaleString()}
      </span>

      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-lg p-1.5 text-muted-foreground opacity-60 transition-opacity hover:bg-foreground/[0.06] hover:text-foreground group-hover:opacity-100" aria-label="Campaign actions">
            <TbDotsVertical size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {campaign.stage === "Active" && (
              <DropdownMenuItem onClick={onPause}>
                <TbPlayerPause size={15} /> Pause
              </DropdownMenuItem>
            )}
            {(campaign.stage === "Paused" || campaign.stage === "Draft") && (
              <DropdownMenuItem onClick={onResume}>
                <TbPlayerPlay size={15} /> Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onReset}>
              <TbRefresh size={15} /> Reset & re-enroll
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} variant="destructive">
              <TbTrash size={15} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
