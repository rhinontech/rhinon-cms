"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TbLoader, TbTarget, TbUsers, TbActivity, TbSettings, TbClipboardList, TbInbox } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { cn } from "@/lib/utils";
import { isLinkedInChannel } from "../shared/ChannelIcon";
import { CampaignHeader } from "./CampaignHeader";
import { FunnelStrip } from "./FunnelStrip";
import { CampaignSetupTab } from "./CampaignSetupTab";
import { LeadsTab } from "./LeadsTab";
import { CampaignInboxTab } from "./CampaignInboxTab";
import { ActivityTab } from "./ActivityTab";
import { SettingsTab } from "./SettingsTab";
import { EnrollLeadsSheet } from "./EnrollLeadsSheet";
import type { Campaign, CampaignLead, CampaignStats } from "../shared/types";

type TabKey = "setup" | "leads" | "inbox" | "activity" | "settings";

const NAV_ITEMS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "setup", label: "Setup", icon: <TbClipboardList size={16} /> },
  { key: "leads", label: "Leads", icon: <TbUsers size={16} /> },
  { key: "inbox", label: "Inbox", icon: <TbInbox size={16} /> },
  { key: "activity", label: "Activity", icon: <TbActivity size={16} /> },
  { key: "settings", label: "Settings", icon: <TbSettings size={16} /> },
];

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
  const [activeTab, setActiveTab] = useState<TabKey>("leads");
  const didInitTab = useRef(false);

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
      if (!didInitTab.current) {
        didInitTab.current = true;
        if (data.stage === "Draft") setActiveTab("setup");
      }
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
      const result = await apiFetch<{ logs?: string[] }>(`/campaigns/cron/run?campaignId=${id}`);
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

  const draftedCount = leads.filter((l) => l.aiDraft).length;

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl glass-panel">
      <CampaignHeader
        campaign={campaign}
        draftedCount={draftedCount}
        running={running}
        onBack={handleBack}
        onRunNow={handleRunNow}
        onPause={handlePause}
        onResume={handleResume}
        onReset={handleReset}
        onDelete={handleDelete}
        onEnroll={() => setEnrollOpen(true)}
        onGoToLeads={() => setActiveTab("leads")}
        onGoToSetup={() => setActiveTab("setup")}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4 overflow-auto p-3 sm:p-4">
        <FunnelStrip funnel={stats?.funnel ?? null} leads={leads} />

        <div className="flex min-h-0 flex-1 flex-col md:flex-row gap-3 sm:gap-4">
          <nav className="flex shrink-0 flex-row overflow-x-auto gap-1 border-b border-black/5 pb-2.5 pt-0.5 md:pb-0 md:pt-0 md:w-44 md:flex-col md:border-b-0 md:space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={cn(
                  "flex shrink-0 items-center justify-center md:justify-start gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  activeTab === item.key
                    ? "bg-blue-50 text-blue-900 font-semibold"
                    : "text-stone-600 hover:bg-stone-100"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1">
            {activeTab === "setup" && (
              <CampaignSetupTab
                campaign={campaign}
                leadsTotal={leads.length}
                onSaved={fetchAll}
                onOpenEnroll={() => setEnrollOpen(true)}
              />
            )}
            {activeTab === "leads" && (
              <LeadsTab campaign={campaign} leads={leads} setLeads={setLeads} onRefresh={fetchAll} onEnroll={() => setEnrollOpen(true)} />
            )}
            {activeTab === "inbox" && <CampaignInboxTab campaignId={campaign.id} leads={leads} campaignName={campaign.name} />}
            {activeTab === "activity" && (
              <ActivityTab campaignId={campaign.id} runLogs={runLogs} onClearRunLogs={() => setRunLogs(null)} />
            )}
            {activeTab === "settings" && (
              <SettingsTab campaign={campaign} onSaved={fetchAll} onReset={handleReset} onDelete={handleDelete} />
            )}
          </div>
        </div>
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
