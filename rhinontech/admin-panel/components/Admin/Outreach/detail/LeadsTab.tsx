"use client";

import { useState } from "react";
import { TbLoader, TbSend, TbUserPlus } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "../shared/EmptyState";
import { LeadDraftSheet } from "./LeadDraftSheet";
import type { Campaign, CampaignLead } from "../shared/types";

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

  const [sending, setSending] = useState(false);
  const [draftLead, setDraftLead] = useState<CampaignLead | null>(null);

  const draftedCount = leads.filter((l) => l.aiDraft).length;

  const handleSendNow = async () => {
    if (leads.length === 0) {
      toast.info("No enrolled leads to send to.");
      return;
    }

    let description = "This will generate drafts and send emails immediately to all enrolled leads.";
    if (campaign.autoSend && campaign.startDate) {
      const dateObj = new Date(campaign.startDate);
      const dateStr = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : campaign.startDate;
      const timeStr = campaign.runTime ? ` at ${campaign.runTime}` : "";
      description = `This campaign is scheduled for ${dateStr}${timeStr}. Do you want to send it immediately instead?`;
    }

    const ok = await confirm({
      title: `Send emails to ${leads.length} lead${leads.length > 1 ? "s" : ""} now?`,
      description,
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-stone-500">
          {draftedCount} drafted · {leads.length} enrolled
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSendNow} disabled={sending}>
            {sending ? <TbLoader className="animate-spin" size={14} /> : <TbSend size={14} />}
            Send Now
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-lg border border-stone-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Draft</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
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
                  {lead.aiDraft ? (
                    <button
                      onClick={() => setDraftLead(lead)}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      View draft
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold italic uppercase text-stone-300">Pending</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LeadDraftSheet
        lead={draftLead}
        onOpenChange={(open) => !open && setDraftLead(null)}
        onSaved={(updated) => {
          setLeads((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)));
          setDraftLead(null);
        }}
      />
    </div>
  );
}
