"use client";

import Link from "next/link";
import { TbCalendar, TbClock, TbDotsVertical, TbPlayerPause, TbPlayerPlay, TbRefresh, TbTrash } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "../shared/StatusBadge";
import { ModeBadge } from "../shared/ModeBadge";
import { ChannelIcon } from "../shared/ChannelIcon";
import type { Campaign } from "../shared/types";

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
  const pct = campaign.leadsTotal ? Math.round((campaign.leadsProcessed / campaign.leadsTotal) * 100) : 0;

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl glass-panel p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <Link href={detailHref} className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-stone-900 group-hover:underline">{campaign.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
            <ChannelIcon channel={campaign.channel} size={13} />
            {campaign.channel}
          </p>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
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

      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge stage={campaign.stage} />
        <ModeBadge mode={campaign.mode || "template"} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
          <span className="text-stone-400">Processed</span>
          <span className="text-stone-900 tabular-nums">
            {campaign.leadsProcessed} / {campaign.leadsTotal}
          </span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      <div className={cn("flex items-center gap-4 border-t border-stone-100 pt-3 text-xs text-stone-400")}>
        <span className="inline-flex items-center gap-1">
          <TbCalendar size={13} /> {new Date(campaign.startDate).toLocaleDateString()}
        </span>
        <span className="inline-flex items-center gap-1">
          <TbClock size={13} /> {campaign.runTime || "09:00"}
        </span>
        <span className="ml-auto">{campaign.template?.name || "No template"}</span>
      </div>
    </div>
  );
}
