"use client";

import { useState } from "react";
import { TbCheck, TbLoader, TbSend, TbSparkles, TbUserPlus } from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "../shared/EmptyState";
import { LeadDraftSheet } from "./LeadDraftSheet";
import type { Campaign, CampaignLead } from "../shared/types";

interface AgentProgress {
  done: number;
  total: number;
  current: string;
  currentId: string;
}

export function LeadsTab({
  campaign,
  leads,
  setLeads,
  onRefresh,
  onEnroll,
}: {
  campaign: Campaign;
  leads: CampaignLead[];
  setLeads: React.Dispatch<React.SetStateAction<CampaignLead[]>>;
  onRefresh: () => void;
  onEnroll: () => void;
}) {
  const confirm = useConfirm();
  const isAgent = campaign.mode === "agent";

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [agentProgress, setAgentProgress] = useState<AgentProgress | null>(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [draftLead, setDraftLead] = useState<CampaignLead | null>(null);

  const approvedCount = leads.filter((l) => l.draftApproved).length;
  const draftedCount = leads.filter((l) => l.aiDraft).length;
  // Never drafted, or sent and due a follow-up — skips pending/approved drafts.
  const draftTargets = leads.filter((l) => !l.draftApproved && (!l.aiDraft || l.status === "Emailed"));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(leads.map((l) => l.id)));

  /* ---------- agent mode actions ---------- */

  const runAgentOnLeads = async (targets: CampaignLead[]) => {
    setAgentRunning(true);
    let drafted = 0;
    for (let i = 0; i < targets.length; i++) {
      const lead = targets[i];
      setAgentProgress({ done: i, total: targets.length, current: lead.name, currentId: lead.id });
      try {
        const res = await apiFetch<{ lead: CampaignLead; result: { skipped: boolean } }>(
          `/leads/${lead.id}/agent-draft`,
          { method: "POST" }
        );
        setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...res.lead } : l)));
        if (res.result && !res.result.skipped) drafted++;
      } catch {
        /* skip this lead, keep going */
      }
    }
    setAgentProgress(null);
    setAgentRunning(false);
    onRefresh();
    toast.success(`Agent drafted ${drafted} of ${targets.length}. Review & approve, then Send Approved.`);
  };

  const handleRunAgent = async () => {
    const selected = leads.filter((l) => selectedIds.has(l.id));
    if (selected.length > 0) {
      await runAgentOnLeads(selected);
      setSelectedIds(new Set());
    } else if (draftTargets.length === 0) {
      toast.info("Nothing to draft — every lead is drafted or approved. Select leads to force a re-draft.");
    } else {
      await runAgentOnLeads(draftTargets);
    }
  };

  const handleRedraft = async (lead: CampaignLead) => {
    if (agentRunning || agentProgress) return;
    setAgentProgress({ done: 0, total: 1, current: lead.name, currentId: lead.id });
    try {
      const res = await apiFetch<{ lead: CampaignLead; result: { skipped?: boolean; reason?: string } }>(
        `/leads/${lead.id}/agent-draft`,
        { method: "POST" }
      );
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...res.lead } : l)));
      if (res.result?.skipped) toast.warning(`Skipped: ${res.result.reason}`);
    } catch (err: any) {
      toast.error("Re-draft failed: " + err.message);
    } finally {
      setAgentProgress(null);
    }
  };

  const toggleApprove = async (lead: CampaignLead) => {
    const next = !lead.draftApproved;
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, draftApproved: next } : l)));
    try {
      await apiFetch(`/leads/${lead.id}`, { method: "PUT", body: JSON.stringify({ draftApproved: next }) });
    } catch (err: any) {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, draftApproved: !next } : l)));
      toast.error("Failed to update approval: " + err.message);
    }
  };

  const handleSendApproved = async () => {
    if (approvedCount === 0) {
      toast.info("Approve at least one draft first.");
      return;
    }
    const ok = await confirm({
      title: `Send ${approvedCount} approved email${approvedCount > 1 ? "s" : ""}?`,
      description: "Emails go out immediately to the approved leads.",
      confirmLabel: "Send now",
    });
    if (!ok) return;
    setSending(true);
    try {
      const r = await apiFetch<{ sent: number }>(`/campaigns/${campaign.id}/send-approved`, { method: "POST" });
      onRefresh();
      toast.success(`Sent ${r.sent} email${r.sent === 1 ? "" : "s"}.`);
    } catch (err: any) {
      toast.error("Send failed: " + err.message);
    } finally {
      setSending(false);
    }
  };

  /* ---------- template mode actions ---------- */

  const handleGenerateDrafts = async () => {
    setGenerating(true);
    try {
      const r = await apiFetch<{ processed: number; total: number }>(`/campaigns/${campaign.id}/process`, {
        method: "POST",
      });
      onRefresh();
      toast.success(`Drafted ${r.processed} of ${r.total} leads.`);
    } catch (err: any) {
      toast.error("Draft generation failed: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendNow = async () => {
    const ready = leads.filter((l) => l.status === "Interested" && l.aiDraft).length;
    if (ready === 0) {
      toast.info("No drafted leads ready to send — generate drafts first.");
      return;
    }
    const ok = await confirm({
      title: `Send to ${ready} drafted lead${ready > 1 ? "s" : ""} now?`,
      description: "This sends immediately, outside the daily schedule.",
      confirmLabel: "Send now",
    });
    if (!ok) return;
    setSending(true);
    try {
      const r = await apiFetch<{ sent: number }>(`/campaigns/${campaign.id}/send`, { method: "POST" });
      onRefresh();
      toast.success(`Sent ${r.sent} email${r.sent === 1 ? "" : "s"}.`);
    } catch (err: any) {
      toast.error("Send failed: " + err.message);
    } finally {
      setSending(false);
    }
  };

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<TbUserPlus size={40} />}
        title="No leads enrolled yet"
        description="Enroll leads from your CRM to start this campaign."
        action={
          <Button size="sm" onClick={onEnroll}>
            <TbUserPlus size={15} /> Enroll Leads
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Mode-gated action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {agentProgress ? (
          <p className="flex items-center gap-2 text-[11px] font-semibold text-violet-600">
            <TbLoader className="animate-spin" size={13} />
            Drafting {agentProgress.done + 1}/{agentProgress.total}: {agentProgress.current}…
          </p>
        ) : (
          <p className="text-[11px] font-medium text-stone-500">
            {isAgent && `${approvedCount} approved · `}
            {draftedCount} drafted · {leads.length} enrolled
            {selectedIds.size > 0 && <span className="font-semibold text-violet-600"> · {selectedIds.size} selected</span>}
          </p>
        )}
        <div className="flex gap-2">
          {isAgent ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRunAgent}
                disabled={agentRunning || (selectedIds.size === 0 && draftTargets.length === 0)}
                className="border-violet-200 text-violet-700 hover:bg-violet-50"
                title="Runs the agent on selected leads (forces a re-draft), or on all leads still needing a draft"
              >
                {agentRunning ? <TbLoader className="animate-spin" size={14} /> : <TbSparkles size={14} />}
                {selectedIds.size > 0 ? `Run Agent on ${selectedIds.size}` : `Run Agent${draftTargets.length ? ` (${draftTargets.length})` : ""}`}
              </Button>
              <Button size="sm" onClick={handleSendApproved} disabled={sending || approvedCount === 0}>
                {sending ? <TbLoader className="animate-spin" size={14} /> : <TbCheck size={14} />}
                Send Approved ({approvedCount})
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={handleGenerateDrafts} disabled={generating}>
                {generating ? <TbLoader className="animate-spin" size={14} /> : <TbSparkles size={14} />}
                Generate Drafts
              </Button>
              <Button size="sm" onClick={handleSendNow} disabled={sending}>
                {sending ? <TbLoader className="animate-spin" size={14} /> : <TbSend size={14} />}
                Send Now
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-auto rounded-lg border border-stone-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-violet-600"
                  title="Select all"
                />
              </TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Draft</TableHead>
              {isAgent && <TableHead className="text-right">Approve</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className={cn(selectedIds.has(lead.id) && "bg-violet-50/50")}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id)}
                    onChange={() => toggleSelect(lead.id)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-violet-600"
                  />
                </TableCell>
                <TableCell>
                  <p className="font-bold text-stone-900">{lead.name}</p>
                  <p className="text-[10px] font-medium uppercase text-stone-400">{lead.company}</p>
                </TableCell>
                <TableCell>
                  <span className="rounded border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                    {lead.status}
                  </span>
                </TableCell>
                <TableCell>
                  {agentProgress?.currentId === lead.id ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-violet-600">
                      <TbLoader className="animate-spin" size={12} /> Drafting…
                    </span>
                  ) : lead.aiDraft ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setDraftLead(lead)}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        View draft
                      </button>
                      {isAgent && (
                        <button
                          onClick={() => handleRedraft(lead)}
                          disabled={agentRunning || !!agentProgress}
                          className="text-[10px] font-bold text-violet-600 hover:underline disabled:opacity-40"
                          title="Regenerate this lead's draft (resets approval)"
                        >
                          Re-draft
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold italic uppercase text-stone-300">Pending</span>
                  )}
                </TableCell>
                {isAgent && (
                  <TableCell className="text-right">
                    <input
                      type="checkbox"
                      checked={!!lead.draftApproved}
                      disabled={!lead.aiDraft}
                      onChange={() => toggleApprove(lead)}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600 disabled:opacity-40"
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LeadDraftSheet
        lead={draftLead}
        isAgent={isAgent}
        onOpenChange={(open) => !open && setDraftLead(null)}
        onSaved={(updated) => {
          setLeads((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)));
          setDraftLead(null);
        }}
        onApproveToggle={toggleApprove}
        onRedraft={handleRedraft}
      />
    </div>
  );
}
