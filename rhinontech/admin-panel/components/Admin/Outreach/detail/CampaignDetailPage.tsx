"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TbLoader, TbTarget, TbUsers, TbActivity, TbSettings } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isLinkedInChannel } from "../shared/ChannelIcon";
import { CampaignHeader } from "./CampaignHeader";
import { FunnelStrip } from "./FunnelStrip";
import { LeadsTab } from "./LeadsTab";
import { ActivityTab } from "./ActivityTab";
import { SettingsTab } from "./SettingsTab";
import { EnrollLeadsSheet } from "./EnrollLeadsSheet";
import type { Campaign, CampaignLead, CampaignStats } from "../shared/types";

export function CampaignDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const confirm = useConfirm();
  const roleSlug = pathname.split("/")[1];

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runLogs, setRunLogs] = useState<string[] | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("leads");

  const fetchAll = useCallback(async () => {
    try {
      const [data, campaignLeads, campaignStats] = await Promise.all([
        apiFetch<Campaign>(`/campaigns/${id}`),
        apiFetch<CampaignLead[]>(`/leads?campaignId=${id}`),
        apiFetch<CampaignStats>(`/campaigns/${id}/stats`).catch(() => null),
      ]);
      // LinkedIn campaigns live under Publishing — bounce there.
      if (isLinkedInChannel(data.channel)) {
        router.replace(`/${roleSlug}/outreach/publishing/${id}`);
        return;
      }
      setCampaign(data);
      setLeads(campaignLeads);
      if (campaignStats) setStats(campaignStats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, router, roleSlug]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleBack = () => router.push(`/${roleSlug}/outreach/campaigns`);

  const handleRunNow = async () => {
    setRunning(true);
    setRunLogs(null);
    try {
      const result = await apiFetch<{ logs?: string[] }>("/campaigns/cron/run");
      setRunLogs(result.logs || ["Engine run triggered."]);
      setActiveTab("activity");
      fetchAll();
    } catch (err: any) {
      toast.error("Engine run failed: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  const handlePause = async () => {
    try {
      await apiFetch(`/campaigns/${id}/pause`, { method: "POST" });
      toast.success("Campaign paused");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Pause failed");
    }
  };

  const handleResume = async () => {
    try {
      await apiFetch(`/campaigns/${id}/resume`, { method: "POST" });
      toast.success("Campaign is now Active");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Activate failed");
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: "Reset this campaign?",
      description: "All leads will be re-enrolled and their AI drafts cleared. The campaign returns to Active.",
      confirmLabel: "Reset campaign",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/campaigns/${id}/reset`, { method: "POST" });
      toast.success("Campaign reset — leads re-enrolled");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Reset failed");
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete this campaign?",
      description: "Enrolled leads will be unenrolled and returned to the CRM pool. This cannot be undone.",
      confirmLabel: "Delete campaign",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/campaigns/${id}`, { method: "DELETE" });
      toast.success("Campaign deleted");
      handleBack();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <TbLoader className="animate-spin text-stone-300" size={44} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-stone-400">
        <TbTarget size={64} className="mb-4 opacity-20" />
        <p>Campaign not found</p>
      </div>
    );
  }

  const approvedCount = leads.filter((l) => l.draftApproved).length;
  const draftedCount = leads.filter((l) => l.aiDraft).length;

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl glass-panel">
      <CampaignHeader
        campaign={campaign}
        draftedCount={draftedCount}
        approvedCount={approvedCount}
        running={running}
        onBack={handleBack}
        onRunNow={handleRunNow}
        onPause={handlePause}
        onResume={handleResume}
        onReset={handleReset}
        onDelete={handleDelete}
        onEnroll={() => setEnrollOpen(true)}
        onGoToLeads={() => setActiveTab("leads")}
      />

      <div className="flex-1 space-y-4 overflow-auto p-4">
        <FunnelStrip campaign={campaign} funnel={stats?.funnel ?? null} leads={leads} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
          <TabsList>
            <TabsTrigger value="leads">
              <TbUsers size={15} /> Leads
            </TabsTrigger>
            <TabsTrigger value="activity">
              <TbActivity size={15} /> Activity
            </TabsTrigger>
            <TabsTrigger value="settings">
              <TbSettings size={15} /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <LeadsTab campaign={campaign} leads={leads} setLeads={setLeads} onRefresh={fetchAll} onEnroll={() => setEnrollOpen(true)} />
          </TabsContent>
          <TabsContent value="activity">
            <ActivityTab campaignId={campaign.id} runLogs={runLogs} onClearRunLogs={() => setRunLogs(null)} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab campaign={campaign} onSaved={fetchAll} onReset={handleReset} onDelete={handleDelete} />
          </TabsContent>
        </Tabs>
      </div>

      <EnrollLeadsSheet
        campaignId={campaign.id}
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        onEnrolled={fetchAll}
      />
    </main>
  );
}
