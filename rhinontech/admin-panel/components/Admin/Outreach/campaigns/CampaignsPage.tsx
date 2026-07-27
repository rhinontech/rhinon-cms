"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { TbPlus, TbTargetArrow } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../shared/EmptyState";
import { isLinkedInChannel } from "../shared/ChannelIcon";
import { CampaignCard } from "./CampaignCard";
import { NewCampaignDialog } from "./NewCampaignDialog";
import type { Campaign, CampaignStage } from "../shared/types";

const STAGE_FILTERS: ("All" | CampaignStage)[] = ["All", "Active", "Draft", "Paused", "Completed"];

export function CampaignsPage() {
  const pathname = usePathname();
  const confirm = useConfirm();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<"All" | CampaignStage>("All");
  const [wizardOpen, setWizardOpen] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await apiFetch<Campaign[]>("/campaigns");
      // This page is email campaigns only — LinkedIn lives under Publishing.
      setCampaigns(data.filter((c) => !isLinkedInChannel(c.channel)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const filtered = useMemo(
    () => (stageFilter === "All" ? campaigns : campaigns.filter((c) => c.stage === stageFilter)),
    [campaigns, stageFilter]
  );

  const handlePause = async (c: Campaign) => {
    try {
      await apiFetch(`/campaigns/${c.id}/pause`, { method: "POST" });
      toast.success(`"${c.name}" paused`);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Pause failed");
    }
  };

  const handleResume = async (c: Campaign) => {
    try {
      await apiFetch(`/campaigns/${c.id}/resume`, { method: "POST" });
      toast.success(`"${c.name}" is now Active`);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Activate failed");
    }
  };

  const handleReset = async (c: Campaign) => {
    const ok = await confirm({
      title: `Reset "${c.name}"?`,
      description: "All leads will be re-enrolled and their AI drafts cleared. The campaign returns to Active.",
      confirmLabel: "Reset campaign",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/campaigns/${c.id}/reset`, { method: "POST" });
      toast.success("Campaign reset — leads re-enrolled");
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Reset failed");
    }
  };

  const handleDelete = async (c: Campaign) => {
    const ok = await confirm({
      title: `Delete "${c.name}"?`,
      description: "Enrolled leads will be unenrolled and returned to the CRM pool. This cannot be undone.",
      confirmLabel: "Delete campaign",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/campaigns/${c.id}`, { method: "DELETE" });
      toast.success("Campaign deleted");
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl glass-panel">
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <SubNavToggle />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-gray-900">Email Campaigns</h1>
            <p className="text-xs text-gray-500">Scheduled outreach to leads from your CRM.</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          <TbPlus size={15} /> New Campaign
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        <Tabs value={stageFilter} onValueChange={(v) => setStageFilter(v as any)}>
          <TabsList>
            {STAGE_FILTERS.map((s) => (
              <TabsTrigger key={s} value={s}>
                {s}
                {s !== "All" && (
                  <span className="text-[10px] text-stone-400 tabular-nums">
                    {campaigns.filter((c) => c.stage === s).length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<TbTargetArrow size={44} />}
            title={stageFilter === "All" ? "No email campaigns yet" : `No ${stageFilter.toLowerCase()} campaigns`}
            description="Create a campaign to start reaching leads — pick Template Blast for volume or AI Agent for research-driven 1:1 emails."
            action={
              stageFilter === "All" ? (
                <Button size="sm" onClick={() => setWizardOpen(true)}>
                  <TbPlus size={15} /> New Campaign
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                detailHref={`${pathname}/${c.id}`}
                onPause={() => handlePause(c)}
                onResume={() => handleResume(c)}
                onReset={() => handleReset(c)}
                onDelete={() => handleDelete(c)}
              />
            ))}
          </div>
        )}
      </div>

      <NewCampaignDialog open={wizardOpen} onOpenChange={setWizardOpen} />
    </main>
  );
}
