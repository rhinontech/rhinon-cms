"use client";

import { useState } from "react";
import { TbLoader, TbSend, TbTrash, TbUserPlus } from "react-icons/tb";
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
  const [removingId, setRemovingId] = useState<string | null>(null);

  const draftedCount = leads.filter((l) => l.aiDraft).length;

  // Only these statuses are still untouched by a send — "Replied"/"Bounced"/
  // "Unsubscribed" leads are done for good and must never be re-emailed. Mirrors
  // the status sets /campaigns/:id/send actually queries (Enrolled+New for
  // drafting, Interested for dispatch), so this count matches what a plain send
  // will really do.
  const sendableLeads = leads.filter((l) => ["Enrolled", "New", "Interested"].includes(l.status));
  // Already-emailed leads are the only ones eligible for an explicit resend —
  // never Bounced/Unsubscribed/Replied, regardless of what's clicked.
  const alreadyEmailedLeads = leads.filter((l) => l.status === "Emailed");

  const handleSendNow = async () => {
    if (leads.length === 0) {
      toast.info("No enrolled leads to send to.");
      return;
    }

    const isResend = sendableLeads.length === 0;

    if (isResend && alreadyEmailedLeads.length === 0) {
      toast.info("Nothing to send — the remaining leads have replied, bounced, or unsubscribed, so they're never re-emailed.");
      return;
    }

    let title: string;
    let description: string;
    let confirmLabel: string;

    if (isResend) {
      title = `Resend to ${alreadyEmailedLeads.length} already-emailed lead${alreadyEmailedLeads.length > 1 ? "s" : ""}?`;
      description = "Every enrolled lead has already been emailed (this may have happened via the campaign's scheduled auto-send). This regenerates each lead's draft from the campaign's current subject/body and resends — any manual edits made to individual drafts since the last send will be overwritten.";
      confirmLabel = "Resend anyway";
    } else {
      title = `Send emails to ${sendableLeads.length} lead${sendableLeads.length > 1 ? "s" : ""} now?`;
      description = "This will generate drafts and send emails immediately to all pending leads.";
      confirmLabel = "Send now";
      if (campaign.autoSend && campaign.startDate) {
        const dateObj = new Date(campaign.startDate);
        const dateStr = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : campaign.startDate;
        const timeStr = campaign.runTime ? ` at ${campaign.runTime}` : "";
        description = `This campaign is scheduled for ${dateStr}${timeStr}. Do you want to send it immediately instead?`;
      }
    }

    const ok = await confirm({ title, description, confirmLabel, destructive: isResend });
    if (!ok) return;
    setSending(true);
    try {
      const r = await apiFetch<{ sent: number }>(`/campaigns/${campaign.id}/send`, {
        method: "POST",
        body: isResend ? JSON.stringify({ resend: true }) : undefined,
      });
      onRefresh();
      if (r.sent === 0) {
        toast.warning("No emails were sent — those leads were already handled by the time this ran (possibly by the campaign's scheduled auto-send).");
      } else {
        toast.success(`Sent ${r.sent} email${r.sent === 1 ? "" : "s"}.`);
      }
    } catch (err: any) {
      toast.error("Send failed: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleRemoveLead = async (lead: CampaignLead) => {
    const ok = await confirm({
      title: `Remove ${lead.name} from this campaign?`,
      description: "They'll go back to the general lead pool unenrolled — this won't delete the lead or any emails already sent to them.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;

    setRemovingId(lead.id);
    try {
      await apiFetch(`/campaigns/${campaign.id}/leads/${lead.id}`, { method: "DELETE" });
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      onRefresh();
      toast.success(`${lead.name} removed from campaign.`);
    } catch (err: any) {
      toast.error("Remove failed: " + err.message);
    } finally {
      setRemovingId(null);
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
              <TableHead className="w-8" />
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
                <TableCell>
                  <button
                    onClick={() => handleRemoveLead(lead)}
                    disabled={removingId === lead.id}
                    title="Remove from campaign"
                    className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {removingId === lead.id ? <TbLoader className="animate-spin" size={14} /> : <TbTrash size={14} />}
                  </button>
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
