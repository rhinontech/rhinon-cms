"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  TbTarget,
  TbLoader,
  TbArrowLeft,
  TbUsers,
  TbActivity,
  TbSettings,
  TbPlayerPlay,
  TbPlayerPause,
  TbTrash,
  TbChevronRight,
  TbRefresh,
  TbCheck,
  TbX,
  TbCalendar,
  TbLayoutSidebarFilled,
  TbLayoutSidebarRightFilled,
  TbBrandLinkedin,
  TbSend,
  TbSparkles,
  TbHeart,
  TbMessageCircle,
  TbShare,
  TbEye,
  TbPhoto,
  TbPhotoPlus,
  TbPhotoX,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";

type CampaignChannel = "Email" | "Cold Email" | "LinkedIn DM" | "LinkedIn Connection" | "LinkedIn Post" | "LinkedIn Video" | "LinkedIn Article";

interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  stage: "Draft" | "Active" | "Paused" | "Completed";
  leadsProcessed: number;
  leadsTotal: number;
  dailyLimit: number;
  startDate: string;
  runTime: string;
  scheduleDays: string[];
  objective: string;
  notes: string;
  aiDraft?: string;
  mediaUrl?: string;
  visibility?: "PUBLIC" | "CONNECTIONS";
  mediaTitle?: string;
  mediaDescription?: string;
  articleUrl?: string;
  platformPostId?: string;
  organizationId?: string | null;
  socialStats?: { likes: number; comments: number; shares: number; impressions: number; lastUpdated?: string };
  template?: { name: string };
  leads?: any[];
  activities?: any[];
}

const STAGE_COLORS = {
  Draft: "bg-stone-100 text-stone-600 border-stone-200",
  Active: "bg-green-50 text-green-700 border-green-100",
  Paused: "bg-yellow-50 text-yellow-700 border-yellow-100",
  Completed: "bg-blue-50 text-blue-700 border-blue-100",
};

export function CampaignDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isExpanded: isSubNavExpanded, toggleSideNav } = useSideNav();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"leads" | "activity" | "settings" | "social">("leads");
  const [running, setRunning] = useState(false);
  const [runLogs, setRunLogs] = useState<string[] | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ dailyLimit: 0, startDate: "", runTime: "09:00", scheduleDays: ["Mon","Tue","Wed","Thu","Fri"] as string[], objective: "", notes: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentProgress, setAgentProgress] = useState<{ done: number; total: number; current: string; currentId: string } | null>(null);
  const [sendingApproved, setSendingApproved] = useState(false);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [socialStats, setSocialStats] = useState<Campaign["socialStats"] | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);

  const fetchCampaign = useCallback(async () => {
    try {
      const [data, campaignLeads] = await Promise.all([
        apiFetch<Campaign>(`/campaigns/${id}`),
        apiFetch<any[]>(`/leads?campaignId=${id}`)
      ]);
      setCampaign(data);
      setLeads(campaignLeads);
      if (isSocialChannel(data.channel)) setActiveTab("social");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  useEffect(() => {
    if (campaign) {
      setSettingsForm({
        dailyLimit: campaign.dailyLimit,
        startDate: campaign.startDate.split("T")[0],
        runTime: campaign.runTime || "09:00",
        scheduleDays: campaign.scheduleDays || ["Mon","Tue","Wed","Thu","Fri"],
        objective: campaign.objective || "",
        notes: campaign.notes || "",
      });
    }
  }, [campaign]);

  const handleBack = () => {
    const parentPath = pathname.split("/").slice(0, -1).join("/");
    router.push(`${parentPath}?id=${id}`);
  };

  const handleRunNow = async () => {
    setRunning(true);
    setRunLogs(null);
    try {
      const result = await apiFetch<any>("/campaigns/cron/run");
      setRunLogs(result.logs || ["Successfully triggered engine run."]);
      fetchCampaign();
    } catch (err: any) {
      alert("Execution failed: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  const updateStage = async (stage: string) => {
    try {
      await apiFetch(`/campaigns/${id}`, {
        method: "PUT",
        body: JSON.stringify({ stage })
      });
      fetchCampaign();
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await apiFetch(`/campaigns/${id}`, {
        method: "PUT",
        body: JSON.stringify(settingsForm),
      });
      setEditingSettings(false);
      fetchCampaign();
    } catch (err) {
      alert("Save failed");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset this campaign to Active? All leads will be re-enrolled and AI drafts cleared.")) return;
    try {
      await apiFetch(`/campaigns/${id}/reset`, { method: "POST" });
      fetchCampaign();
    } catch (err) {
      alert("Reset failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this campaign? All enrolled leads will be unenrolled.")) return;
    try {
      await apiFetch(`/campaigns/${id}`, { method: "DELETE" });
      handleBack();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const isSocialChannel = (channel?: CampaignChannel) =>
    channel && ["LinkedIn Post", "LinkedIn Video", "LinkedIn Article", "LinkedIn DM", "LinkedIn Connection"].includes(channel);

  const handleGenerateDraft = async () => {
    setGenerating(true);
    try {
      await apiFetch(`/campaigns/${id}/process`, { method: "POST" });
      fetchCampaign();
    } catch (err: any) {
      alert("Draft generation failed: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Leads that still need a draft: never drafted yet, OR already sent and due for a follow-up.
  // Excludes leads with a pending (unsent) draft and approved leads, so re-running won't overwrite them.
  const draftTargets = leads.filter(l => !l.draftApproved && (!l.aiDraft || l.status === "Emailed"));

  const toggleSelectLead = (leadId: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };
  const allLeadsSelected = leads.length > 0 && leads.every(l => selectedLeadIds.has(l.id));
  const toggleSelectAllLeads = () => {
    setSelectedLeadIds(allLeadsSelected ? new Set() : new Set(leads.map(l => l.id)));
  };

  // Run the agent over a specific set of leads, one at a time, updating the table live.
  const runAgentOnLeads = async (targets: any[]) => {
    if (targets.length === 0) { alert("No leads selected to run the agent on."); return; }
    setAgentRunning(true);
    let drafted = 0;
    for (let i = 0; i < targets.length; i++) {
      const lead = targets[i];
      setAgentProgress({ done: i, total: targets.length, current: lead.name, currentId: lead.id });
      try {
        const res = await apiFetch<{ lead: any; result: { skipped: boolean } }>(`/leads/${lead.id}/agent-draft`, { method: "POST" });
        setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, ...res.lead } : l)));
        if (res.result && !res.result.skipped) drafted++;
      } catch {
        /* skip this lead, keep going */
      }
    }
    setAgentProgress(null);
    setAgentRunning(false);
    fetchCampaign();
    alert(`Agent finished. Drafted ${drafted} of ${targets.length}. Review, approve, then Send Approved.`);
  };

  // If leads are selected, run on those (forces a re-draft). Otherwise draft the ones that still need it.
  const handleRunAgent = async () => {
    const selected = leads.filter(l => selectedLeadIds.has(l.id));
    if (selected.length > 0) {
      await runAgentOnLeads(selected);
      setSelectedLeadIds(new Set());
    } else {
      if (draftTargets.length === 0) { alert("Nothing to draft — every lead is already drafted or approved. Select leads to force a re-draft."); return; }
      await runAgentOnLeads(draftTargets);
    }
  };

  const handleRedraft = async (lead: any) => {
    if (agentRunning || agentProgress) return;
    setAgentProgress({ done: 0, total: 1, current: lead.name, currentId: lead.id });
    try {
      const res = await apiFetch<{ lead: any; result: { skipped?: boolean; reason?: string } }>(`/leads/${lead.id}/agent-draft`, { method: "POST" });
      setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, ...res.lead } : l)));
      if (res.result?.skipped) alert(`Skipped: ${res.result.reason}`);
    } catch (err: any) {
      alert("Re-draft failed: " + err.message);
    } finally {
      setAgentProgress(null);
    }
  };

  const toggleApprove = async (lead: any) => {
    const next = !lead.draftApproved;
    setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, draftApproved: next } : l)));
    try {
      await apiFetch(`/leads/${lead.id}`, { method: "PUT", body: JSON.stringify({ draftApproved: next }) });
    } catch (err: any) {
      setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, draftApproved: !next } : l)));
      alert("Failed to update approval: " + err.message);
    }
  };

  const handleSendApproved = async () => {
    const count = leads.filter(l => l.draftApproved).length;
    if (count === 0) { alert("Approve at least one draft first."); return; }
    if (!confirm(`Send ${count} approved email(s) now?`)) return;
    setSendingApproved(true);
    try {
      const r = await apiFetch<{ sent: number }>(`/campaigns/${id}/send-approved`, { method: "POST" });
      await fetchCampaign();
      alert(`Sent ${r.sent} email(s).`);
    } catch (err: any) {
      alert("Send failed: " + err.message);
    } finally {
      setSendingApproved(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("Publish this post to LinkedIn now?")) return;
    setPublishing(true);
    try {
      await apiFetch(`/campaigns/${id}/send`, { method: "POST" });
      fetchCampaign();
      alert("Successfully published to LinkedIn!");
    } catch (err: any) {
      alert("Publish failed: " + err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setGeneratingImage(true);
    try {
      const result = await apiFetch<{ url: string }>("/ai/images/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      setPreviewImageUrl(result.url);
    } catch (err: any) {
      alert("Image generation failed: " + err.message);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleAttachImage = async () => {
    if (!previewImageUrl) return;
    setSavingImage(true);
    try {
      await apiFetch(`/campaigns/${id}`, {
        method: "PUT",
        body: JSON.stringify({ mediaUrl: previewImageUrl }),
      });
      fetchCampaign();
    } catch (err: any) {
      alert("Failed to attach image: " + err.message);
    } finally {
      setSavingImage(false);
    }
  };

  const handleFetchStats = async () => {
    setLoadingStats(true);
    try {
      const stats = await apiFetch<Campaign["socialStats"]>(`/linkedin/campaigns/${id}/stats`);
      setSocialStats(stats);
    } catch (err: any) {
      alert("Failed to fetch stats: " + err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <TbLoader className="animate-spin text-stone-300" size={48} />
    </div>
  );

  if (!campaign) return (
    <div className="flex flex-col items-center justify-center h-full text-stone-400">
      <TbTarget size={64} className="mb-4 opacity-20" />
      <p>Campaign not found</p>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl bg-stone-50 border">
        <div className="flex h-16 items-center justify-between border-b px-4 bg-white">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-stone-100 hover:text-gray-900 transition-colors">
              <TbArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900">{campaign.name}</h1>
              <p className="text-xs text-gray-500">Automated outreach campaign monitoring.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunNow}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 disabled:opacity-50"
            >
              {running ? <TbLoader className="animate-spin" size={14} /> : <TbPlayerPlay size={14} />}
              Run Now
            </button>
            {!isPreviewExpanded && (
              <button onClick={() => setIsPreviewExpanded(true)} className="rounded-lg p-2 text-gray-600 hover:bg-stone-100">
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Leads", value: campaign.leadsTotal, icon: <TbUsers />, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Processed", value: campaign.leadsProcessed, icon: <TbCheck />, color: "text-green-600", bg: "bg-green-50" },
              { label: "Remaining", value: campaign.leadsTotal - campaign.leadsProcessed, icon: <TbRefresh />, color: "text-stone-400", bg: "bg-stone-100/50" },
              { label: "Daily Limit", value: campaign.dailyLimit, icon: <TbSettings />, color: "text-stone-900", bg: "bg-stone-200/50" },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-3">
                <div className={cn("p-2 rounded-lg text-xl", stat.bg, stat.color)}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-lg font-bold text-stone-900 leading-none mt-1">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col overflow-hidden flex-1">
            <div className="flex border-b border-stone-100 bg-stone-50/30">
              {[
                ...(!isSocialChannel(campaign.channel) ? [{ id: "leads", label: "Enrolled Leads", icon: <TbUsers /> }] : []),
                ...(isSocialChannel(campaign.channel) ? [{ id: "social", label: "Social Draft", icon: <TbBrandLinkedin /> }] : []),
                { id: "activity", label: "Execution Log", icon: <TbActivity /> },
                { id: "settings", label: "Campaign Settings", icon: <TbSettings /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all border-b-2 -mb-px",
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600 bg-white"
                      : "border-transparent text-stone-400 hover:text-stone-600"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === "leads" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {agentProgress ? (
                      <p className="flex items-center gap-2 text-[11px] font-semibold text-violet-600">
                        <TbLoader className="animate-spin" size={13} />
                        Drafting {agentProgress.done + 1}/{agentProgress.total}: {agentProgress.current}…
                      </p>
                    ) : (
                      <p className="text-[11px] font-medium text-stone-500">
                        {leads.filter(l => l.draftApproved).length} approved · {leads.filter(l => l.aiDraft).length} drafted · {leads.length} total
                        {selectedLeadIds.size > 0 && <span className="text-violet-600 font-semibold"> · {selectedLeadIds.size} selected</span>}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleRunAgent}
                        disabled={agentRunning || (selectedLeadIds.size === 0 && draftTargets.length === 0)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                        title="Runs the agent on selected leads (forces a re-draft), or on all leads still needing a draft"
                      >
                        {agentRunning ? <TbLoader className="animate-spin" size={14} /> : <TbSparkles size={14} />}
                        {selectedLeadIds.size > 0
                          ? `Run Agent on Selected (${selectedLeadIds.size})`
                          : `Run Agent (Draft)${draftTargets.length ? ` (${draftTargets.length})` : ""}`}
                      </button>
                      <button
                        onClick={handleSendApproved}
                        disabled={sendingApproved || leads.filter(l => l.draftApproved).length === 0}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {sendingApproved ? <TbLoader className="animate-spin" size={14} /> : <TbCheck size={14} />}
                        Send Approved ({leads.filter(l => l.draftApproved).length})
                      </button>
                    </div>
                  </div>
                  <div className="overflow-auto rounded-lg border border-stone-100">
                  <table className="w-full text-left">
                    <thead className="bg-stone-100/50 border-b border-stone-100">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={allLeadsSelected}
                            onChange={toggleSelectAllLeads}
                            className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-violet-600"
                            title="Select all"
                          />
                        </th>
                        <th className="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Lead</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Draft</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Approve</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {leads.map(lead => (
                        <Fragment key={lead.id}>
                        <tr className={cn("hover:bg-stone-50 transition-colors text-sm", selectedLeadIds.has(lead.id) && "bg-violet-50/50")}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedLeadIds.has(lead.id)}
                              onChange={() => toggleSelectLead(lead.id)}
                              className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-violet-600"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <p className="font-bold text-stone-900">{lead.name}</p>
                            <p className="text-[10px] text-stone-400 font-medium uppercase">{lead.company}</p>
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            {agentProgress?.currentId === lead.id ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-violet-600">
                                <TbLoader className="animate-spin" size={12} /> Drafting…
                              </span>
                            ) : lead.aiDraft ? (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                                  className="text-blue-600 text-[10px] font-bold hover:underline"
                                >
                                  {expandedLeadId === lead.id ? "Hide draft" : "View draft"}
                                </button>
                                <button
                                  onClick={() => handleRedraft(lead)}
                                  disabled={agentRunning || !!agentProgress}
                                  className="text-violet-600 text-[10px] font-bold hover:underline disabled:opacity-40"
                                  title="Regenerate this lead's draft (resets approval)"
                                >
                                  Re-draft
                                </button>
                              </div>
                            ) : (
                              <span className="text-stone-300 text-[10px] font-bold italic uppercase">Pending</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <input
                              type="checkbox"
                              checked={!!lead.draftApproved}
                              disabled={!lead.aiDraft}
                              onChange={() => toggleApprove(lead)}
                              className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600 disabled:opacity-40"
                            />
                          </td>
                        </tr>
                        {expandedLeadId === lead.id && lead.aiDraft && (
                          <tr className="bg-stone-50/60">
                            <td colSpan={5} className="px-6 py-4">
                              {lead.draftSubject && <p className="text-xs font-bold text-stone-800 mb-1">Subject: {lead.draftSubject}</p>}
                              <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-700">{lead.aiDraft}</p>
                            </td>
                          </tr>
                        )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}

              {activeTab === "social" && (
                <div className="space-y-4">

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      {campaign.channel} — Content Draft
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerateDraft}
                        disabled={generating}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                      >
                        {generating ? <TbLoader className="animate-spin" size={14} /> : <TbSparkles size={14} />}
                        Generate Draft
                      </button>
                      <button
                        onClick={handlePublish}
                        disabled={publishing || !campaign.aiDraft || campaign.stage === "Completed"}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {publishing ? <TbLoader className="animate-spin" size={14} /> : <TbBrandLinkedin size={14} />}
                        Publish to LinkedIn
                      </button>
                    </div>
                  </div>

                  {campaign.aiDraft ? (
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Post Content Preview</p>
                      <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{campaign.aiDraft}</p>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-stone-400 border border-dashed border-stone-200 rounded-xl">
                      <TbBrandLinkedin size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-sm font-medium">No AI draft yet.</p>
                      <p className="text-xs mt-1 text-stone-300">Click "Generate Draft" to create content with AI.</p>
                    </div>
                  )}

                  {/* AI Image Generator */}
                  <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Post Image</p>
                    {campaign.mediaUrl ? (
                      <div className="relative group">
                        <img src={campaign.mediaUrl} alt="Campaign media" className="w-full rounded-lg object-cover max-h-48" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={async () => {
                              await apiFetch(`/campaigns/${id}`, { method: "PUT", body: JSON.stringify({ mediaUrl: null }) });
                              fetchCampaign();
                            }}
                            className="bg-white border border-stone-200 p-1.5 rounded-lg text-red-500 hover:bg-red-50 shadow"
                          >
                            <TbPhotoX size={14} />
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-2 font-medium">Image attached — will be included when publishing.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={imagePrompt}
                            onChange={e => setImagePrompt(e.target.value)}
                            placeholder="Describe the image to generate..."
                            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-400"
                            onKeyDown={e => e.key === "Enter" && handleGenerateImage()}
                          />
                          <button
                            onClick={handleGenerateImage}
                            disabled={generatingImage || !imagePrompt.trim()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            {generatingImage ? <TbLoader className="animate-spin" size={13} /> : <TbPhotoPlus size={13} />}
                            Generate
                          </button>
                        </div>
                        {previewImageUrl && (
                          <div className="space-y-2">
                            <img src={previewImageUrl} alt="Generated preview" className="w-full rounded-lg object-cover max-h-48" />
                            <div className="flex gap-2">
                              <button
                                onClick={handleAttachImage}
                                disabled={savingImage}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
                              >
                                {savingImage ? <TbLoader className="animate-spin" size={13} /> : <TbCheck size={13} />}
                                Attach to Campaign
                              </button>
                              <button
                                onClick={() => setPreviewImageUrl(null)}
                                className="px-3 py-2 rounded-lg border border-stone-200 text-xs font-semibold text-stone-400 hover:text-red-500 hover:border-red-200"
                              >
                                <TbX size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                        {!previewImageUrl && (
                          <div className="flex items-center justify-center py-6 border border-dashed border-stone-200 rounded-lg">
                            <div className="text-center text-stone-300">
                              <TbPhoto size={28} className="mx-auto mb-1" />
                              <p className="text-[10px]">Optional image for your post</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {campaign.platformPostId && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Live Stats</p>
                        <button
                          onClick={handleFetchStats}
                          disabled={loadingStats}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1"
                        >
                          {loadingStats ? <TbLoader className="animate-spin" size={12} /> : <TbRefresh size={12} />}
                          Refresh
                        </button>
                      </div>
                      {(socialStats || campaign.socialStats) && (
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { icon: <TbHeart />, label: "Likes", value: (socialStats || campaign.socialStats)?.likes ?? 0, color: "text-red-500" },
                            { icon: <TbMessageCircle />, label: "Comments", value: (socialStats || campaign.socialStats)?.comments ?? 0, color: "text-blue-500" },
                            { icon: <TbShare />, label: "Shares", value: (socialStats || campaign.socialStats)?.shares ?? 0, color: "text-green-500" },
                            { icon: <TbEye />, label: "Impressions", value: (socialStats || campaign.socialStats)?.impressions ?? 0, color: "text-violet-500" },
                          ].map((s, i) => (
                            <div key={i} className="bg-white border border-stone-100 rounded-xl p-3 text-center">
                              <div className={cn("text-xl mx-auto mb-1", s.color)}>{s.icon}</div>
                              <p className="text-lg font-bold text-stone-900">{s.value}</p>
                              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-stone-400 font-mono">Post ID: {campaign.platformPostId}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "activity" && (
                <div className="space-y-4">
                  {runLogs ? (
                    <div className="bg-stone-900 text-stone-300 p-6 rounded-xl font-mono text-xs leading-relaxed shadow-inner border border-stone-800">
                      <div className="flex items-center justify-between mb-4 border-b border-stone-800 pb-2">
                        <span className="text-stone-500">Live Execution Log — {new Date().toLocaleTimeString()}</span>
                        <button onClick={() => setRunLogs(null)} className="hover:text-white"><TbX /></button>
                      </div>
                      {runLogs.map((log, i) => (
                        <div key={i} className="mb-1">{log}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-stone-400 border border-dashed border-stone-200 rounded-xl">
                      <TbActivity size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-sm">Click "Run Now" to trigger the automated outreach cycle.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "settings" && (
                <div className="max-w-xl space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Campaign Settings</p>
                    {!editingSettings ? (
                      <button
                        onClick={() => setEditingSettings(true)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Edit
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingSettings(false); if (campaign) setSettingsForm({ dailyLimit: campaign.dailyLimit, startDate: campaign.startDate.split("T")[0], runTime: campaign.runTime || "09:00", scheduleDays: campaign.scheduleDays || ["Mon","Tue","Wed","Thu","Fri"], objective: campaign.objective || "", notes: campaign.notes || "" }); }}
                          className="text-xs font-semibold text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveSettings}
                          disabled={savingSettings}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
                        >
                          {savingSettings ? <TbLoader className="animate-spin" size={12} /> : <TbCheck size={12} />}
                          Save
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-stone-700">Daily Email Limit</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">Max emails sent per day for this campaign.</p>
                      </div>
                      {editingSettings ? (
                        <input
                          type="number"
                          min={1}
                          value={settingsForm.dailyLimit}
                          onChange={e => setSettingsForm(f => ({ ...f, dailyLimit: Number(e.target.value) }))}
                          className="w-24 border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-900 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm font-bold text-stone-900">{campaign.dailyLimit} / day</p>
                      )}
                    </div>

                    <div className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-stone-700">Start Date</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">The cron engine will not send before this date.</p>
                      </div>
                      {editingSettings ? (
                        <input
                          type="date"
                          value={settingsForm.startDate}
                          onChange={e => setSettingsForm(f => ({ ...f, startDate: e.target.value }))}
                          className="border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm font-bold text-stone-900">{new Date(campaign.startDate).toLocaleDateString()}</p>
                      )}
                    </div>

                    <div className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-stone-700">Run Time</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">Daily time the outreach engine runs.</p>
                      </div>
                      {editingSettings ? (
                        <input
                          type="time"
                          value={settingsForm.runTime}
                          onChange={e => setSettingsForm(f => ({ ...f, runTime: e.target.value }))}
                          className="border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm font-bold text-stone-900">{campaign.runTime || "09:00"}</p>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs font-bold text-stone-700">Active Days</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">Cron only sends on selected days.</p>
                        </div>
                      </div>
                      {editingSettings ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {DAYS.map((day) => {
                            const active = settingsForm.scheduleDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => setSettingsForm(f => ({
                                  ...f,
                                  scheduleDays: active
                                    ? f.scheduleDays.filter(d => d !== day)
                                    : [...f.scheduleDays, day],
                                }))}
                                className={cn(
                                  "px-3 py-1 rounded-lg text-xs font-bold border transition-colors",
                                  active
                                    ? "bg-stone-900 text-white border-stone-900"
                                    : "bg-white text-stone-400 border-stone-200 hover:border-stone-400"
                                )}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex gap-1.5 flex-wrap">
                          {DAYS.map((day) => (
                            <span key={day} className={cn(
                              "px-3 py-1 rounded-lg text-xs font-bold border",
                              (campaign.scheduleDays || []).includes(day)
                                ? "bg-stone-900 text-white border-stone-900"
                                : "bg-stone-50 text-stone-300 border-stone-100"
                            )}>{day}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-xs font-bold text-stone-700 mb-2">Objective</p>
                      {editingSettings ? (
                        <textarea
                          rows={3}
                          value={settingsForm.objective}
                          onChange={e => setSettingsForm(f => ({ ...f, objective: e.target.value }))}
                          placeholder="Describe the campaign goal..."
                          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      ) : (
                        <p className="text-sm text-stone-600 leading-relaxed">{campaign.objective || <span className="italic text-stone-300">No objective defined.</span>}</p>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-xs font-bold text-stone-700 mb-2">Notes</p>
                      {editingSettings ? (
                        <textarea
                          rows={3}
                          value={settingsForm.notes}
                          onChange={e => setSettingsForm(f => ({ ...f, notes: e.target.value }))}
                          placeholder="Internal notes about this campaign..."
                          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      ) : (
                        <p className="text-sm text-stone-600 leading-relaxed">{campaign.notes || <span className="italic text-stone-300">No notes.</span>}</p>
                      )}
                    </div>

                    {campaign.template && (
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-stone-700">Template</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">Email template used for AI draft generation.</p>
                        </div>
                        <span className="text-xs font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg">
                          {campaign.template.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Aside Panel */}
      <aside className={`flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out ${isPreviewExpanded ? "w-[42%] ml-2" : "w-0"}`}>
        {isPreviewExpanded && (
          <div className="flex h-full flex-1 flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-5">
              <p className="-mb-px flex self-stretch items-center border-b-2 border-blue-600 text-md font-medium tracking-tight text-black">
                Summary
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsPreviewExpanded(false)} className="text-gray-600 hover:text-gray-900">
                  <TbLayoutSidebarRightFilled size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-6">
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-1">Current Stage</p>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest", STAGE_COLORS[campaign.stage])}>
                    {campaign.stage}
                  </span>
                </div>

                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-2">Controls</p>
                  <div className="flex gap-2">
                    {campaign.stage === "Active" ? (
                      <button onClick={() => updateStage("Paused")} className="flex-1 bg-yellow-50 text-yellow-600 border border-yellow-200 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                        <TbPlayerPause /> Pause
                      </button>
                    ) : campaign.stage === "Completed" ? (
                      <button onClick={handleReset} className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                        <TbRefresh /> Reset & Retest
                      </button>
                    ) : (
                      <button onClick={() => updateStage("Active")} className="flex-1 bg-green-50 text-green-600 border border-green-200 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                        <TbPlayerPlay /> Activate
                      </button>
                    )}
                    <button onClick={handleDelete} className="p-2 text-stone-400 hover:text-red-600 border border-stone-200 rounded-lg transition-colors">
                      <TbTrash size={18} />
                    </button>
                  </div>
                  <button
                    onClick={handleReset}
                    className="w-full mt-2 flex items-center justify-center gap-2 border border-dashed border-stone-300 text-stone-400 hover:text-blue-600 hover:border-blue-300 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                  >
                    <TbRefresh size={12} /> Reset for Testing
                  </button>
                </div>

                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-1">Details</p>
                  <div className="space-y-3 mt-3">
                    <DetailItem label="Channel" value={campaign.channel || "Email"} />
                    {!isSocialChannel(campaign.channel) && <DetailItem label="Daily Limit" value={`${campaign.dailyLimit} emails/day`} />}
                    <DetailItem label="Start Date" value={new Date(campaign.startDate).toLocaleDateString()} />
                    {!isSocialChannel(campaign.channel) && <DetailItem label="Run Time" value={campaign.runTime || "09:00"} />}
                    <DetailItem label="Template" value={campaign.template?.name || "None"} />
                    {campaign.platformPostId && <DetailItem label="Published" value="Yes — Live on LinkedIn" />}
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-1.5">Active Days</p>
                    <div className="flex gap-1 flex-wrap">
                      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                        <span key={d} className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          (campaign.scheduleDays || []).includes(d)
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-stone-50 text-stone-300 border-stone-100"
                        )}>{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}
