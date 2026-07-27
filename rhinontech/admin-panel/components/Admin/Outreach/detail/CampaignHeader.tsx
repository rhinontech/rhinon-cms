"use client";

import {
  TbArrowLeft,
  TbDotsVertical,
  TbLoader,
  TbPlayerPause,
  TbPlayerPlay,
  TbRefresh,
  TbTrash,
  TbUserPlus,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "../shared/StatusBadge";
import type { Campaign } from "../shared/types";

/**
 * The "what now?" hint — one obvious next step given the campaign's state.
 * Keeps the user oriented without reading the whole page.
 */
function nextAction(campaign: Campaign, draftedCount: number): { label: string; hint: "setup" | "enroll" | "leads" } | null {
  if (!campaign.body?.trim() || !campaign.subject?.trim()) return { label: "Write your subject & email content", hint: "setup" };
  if (campaign.leadsTotal === 0) return { label: "Enroll leads to get started", hint: "enroll" };
  if (draftedCount === 0) return { label: "Generate drafts from your email", hint: "leads" };
  if (campaign.stage !== "Active" && campaign.autoSend) return { label: "Activate to start the schedule", hint: "leads" };
  return null;
}

export function CampaignHeader({
  campaign,
  draftedCount,
  running,
  onBack,
  onRunNow,
  onPause,
  onResume,
  onReset,
  onDelete,
  onEnroll,
  onGoToLeads,
  onGoToSetup,
}: {
  campaign: Campaign;
  draftedCount: number;
  running: boolean;
  onBack: () => void;
  onRunNow: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onDelete: () => void;
  onEnroll: () => void;
  onGoToLeads: () => void;
  onGoToSetup: () => void;
}) {
  const action = nextAction(campaign, draftedCount);
  const handleActionClick = () => {
    if (action?.hint === "enroll") onEnroll();
    else if (action?.hint === "setup") onGoToSetup();
    else onGoToLeads();
  };

  return (
    <div className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onBack}
          className="-ml-2 rounded-lg p-2 text-gray-500 transition-colors hover:bg-stone-100 hover:text-gray-900"
        >
          <TbArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-bold tracking-tight text-gray-900">{campaign.name}</h1>
            <StatusBadge stage={campaign.stage} />
          </div>
          {action && (
            <button onClick={handleActionClick} className="mt-0.5 text-xs font-medium text-blue-600 hover:underline">
              Next: {action.label} →
            </button>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {campaign.stage === "Active" ? (
          <Button variant="outline" size="sm" onClick={onPause}>
            <TbPlayerPause size={15} /> Pause
          </Button>
        ) : campaign.stage !== "Completed" && campaign.autoSend ? (
          <Button variant="outline" size="sm" onClick={onResume}>
            <TbPlayerPlay size={15} /> Activate
          </Button>
        ) : null}
        {campaign.stage === "Active" && (
          <Button size="sm" onClick={onRunNow} disabled={running}>
            {running ? <TbLoader className="animate-spin" size={15} /> : <TbPlayerPlay size={15} />}
            Run Now
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800">
            <TbDotsVertical size={17} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEnroll}>
              <TbUserPlus size={15} /> Enroll more leads
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onReset}>
              <TbRefresh size={15} /> Reset & re-enroll
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} variant="destructive">
              <TbTrash size={15} /> Delete campaign
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
