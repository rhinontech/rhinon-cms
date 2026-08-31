"use client";

import { useState } from "react";
import { TbClock, TbLoader, TbSend, TbTrash, TbUserPlus, TbEye } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch, apiStream } from "@/lib/api";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "../shared/EmptyState";
import { LeadDraftSheet } from "./LeadDraftSheet";
import { SendConsole, type SendLogLine, type SendProgress } from "./SendConsole";
import type { Campaign, CampaignLead } from "../shared/types";

// Above this many leads a send takes long enough that a spinner reads as a hang,
// so it runs through the streaming endpoint and shows a live console instead.
const CONSOLE_THRESHOLD = 100;

type SendStreamEvent =
  | { type: "start"; total: number; resend: boolean; from: string; subject: string | null; ts?: string }
  | { type: "log"; level: SendLogLine["level"]; message: string; ts?: string }
  | ({ type: "progress"; ts?: string } & SendProgress)
  | { type: "done"; summary: { sent: number; skipped: number; failed: number; total: number; completed: boolean }; ts?: string }
  | { type: "error"; message: string; ts?: string };

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
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [logLines, setLogLines] = useState<SendLogLine[]>([]);
  const [progress, setProgress] = useState<SendProgress | null>(null);

  const draftedCount = leads.filter((l) => l.aiDraft).length;

  // Only these statuses are still untouched by a send — "Replied"/"Bounced"/
  // "Unsubscribed" leads are done for good and must never be re-emailed. Mirrors
  // the status sets /campaigns/:id/send actually queries (Enrolled+New for
  // drafting, Interested for dispatch), so this count matches what a plain send
  // will really do.
  const sendableLeads = leads.filter((l) => ["Enrolled", "New", "Enriched", "Interested"].includes(l.status));
  // Already-emailed leads are the only ones eligible for an explicit resend —
  // never Bounced/Unsubscribed/Replied, regardless of what's clicked.
  const alreadyEmailedLeads = leads.filter((l) => l.status === "Emailed");

  /**
   * Streams a large send into the console panel.
   *
   * Errors are surfaced as console lines rather than only a toast — by the time
   * one arrives the console is what the user is looking at. Closing the panel
   * doesn't cancel anything: the server keeps sending regardless.
   */
  const sendWithConsole = async (isResend: boolean) => {
    setLogLines([]);
    setProgress(null);
    setConsoleOpen(true);
    setSending(true);

    const push = (line: SendLogLine) => setLogLines((prev) => [...prev, line]);
    let summary: { sent: number; skipped: number; failed: number; completed: boolean } | null = null;

    try {
      await apiStream<SendStreamEvent>(
        `/campaigns/${campaign.id}/send/stream`,
        (event) => {
          if (event.type === "log") {
            push({ level: event.level, message: event.message, ts: event.ts });
          } else if (event.type === "start") {
            push({
              level: "info",
              message: `Dispatching ${event.total} email(s)${event.resend ? " (resend)" : ""}${event.subject ? ` · subject: ${event.subject}` : ""}`,
              ts: event.ts,
            });
          } else if (event.type === "progress") {
            setProgress({ done: event.done, total: event.total, sent: event.sent, skipped: event.skipped, failed: event.failed });
          } else if (event.type === "done") {
            summary = event.summary;
            push({
              level: event.summary.failed > 0 ? "warn" : "success",
              message: `Done — ${event.summary.sent} sent, ${event.summary.skipped} skipped, ${event.summary.failed} failed.`,
              ts: event.ts,
            });
          } else if (event.type === "error") {
            push({ level: "error", message: event.message, ts: event.ts });
          }
        },
        { body: isResend ? JSON.stringify({ resend: true }) : JSON.stringify({}) }
      );

      if (summary) {
        const s = summary as { sent: number; failed: number };
        if (s.failed > 0) toast.warning(`Sent ${s.sent}, ${s.failed} failed — see the console and Activity tab.`);
        else toast.success(`Sent ${s.sent} email${s.sent === 1 ? "" : "s"}.`);
      } else {
        // The stream ended without a completion event — treat it as unfinished
        // rather than quietly implying every lead was handled.
        push({ level: "error", message: "Stream ended before the send reported completion. Re-check the Leads list before retrying." });
        toast.warning("The send stream ended early — check the console.");
      }
    } catch (err: any) {
      push({ level: "error", message: `Send failed: ${err.message}` });
      toast.error("Send failed: " + err.message);
    } finally {
      setSending(false);
      onRefresh();
    }
  };

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
    }

    const ok = await confirm({ title, description, confirmLabel, destructive: isResend });
    if (!ok) return;

    const batchSize = isResend ? alreadyEmailedLeads.length : sendableLeads.length;
    if (batchSize > CONSOLE_THRESHOLD) {
      await sendWithConsole(isResend);
      return;
    }

    setSending(true);
    try {
      const r = await apiFetch<{ sent: number; failed?: number; failures?: { email: string; reason: string }[] }>(
        `/campaigns/${campaign.id}/send`,
        { method: "POST", body: isResend ? JSON.stringify({ resend: true }) : undefined }
      );
      onRefresh();

      const failed = r.failed ?? 0;
      if (r.sent === 0 && failed === 0) {
        toast.warning("No emails were sent — those leads were already handled by the time this ran (possibly by the campaign's scheduled auto-send).");
      } else if (failed > 0) {
        // Never report a partial send as a clean success — an undeliverable
        // address here is exactly what used to go unnoticed.
        const first = r.failures?.[0];
        toast.warning(
          `Sent ${r.sent}, ${failed} failed.` +
            (first ? ` e.g. ${first.email} — ${first.reason}` : "") +
            " See the Activity tab for each failure.",
          { duration: 10000 }
        );
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
        <p className="text-[11px] font-medium text-muted-foreground">
          {draftedCount} drafted · {leads.length} enrolled
        </p>
        <div className="flex items-center gap-2">
          {/* A scheduled campaign is driven only by Activate + the cron. Offering
              "Send Now" alongside it is the one way to double-send a list. */}
          {campaign.autoSend ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <TbClock size={13} />
              Scheduled — sends on activation
            </span>
          ) : (
              <Button size="sm" onClick={handleSendNow} disabled={sending}>
                {sending ? <TbLoader className="animate-spin" size={14} /> : <TbSend size={14} />}
                Send Now
              </Button>
            )}
          </div>
        </div>

        {consoleOpen ? (
          <SendConsole
            lines={logLines}
            progress={progress}
            running={sending}
            onClose={() => setConsoleOpen(false)}
          />
        ) : (
        <div className="overflow-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Draft</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <p className="font-bold text-foreground">{lead.name}</p>
                    <p className="text-[10px] font-medium uppercase text-muted-foreground">{lead.company}</p>
                  </TableCell>
                  <TableCell>
                    <span className="rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground/70">
                      {lead.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {lead.aiDraft ? (
                      <button
                        onClick={() => setDraftLead(lead)}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-300 hover:underline"
                      >
                        View draft
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold italic uppercase text-muted-foreground/70">Pending</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.emailOpened ? (
                      <span
                        title={lead.openedAt ? new Date(lead.openedAt).toLocaleString() : undefined}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300"
                      >
                        <TbEye size={13} /> Opened
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold italic uppercase text-muted-foreground/70">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleRemoveLead(lead)}
                      disabled={removingId === lead.id}
                      title="Remove from campaign"
                      className="rounded p-1 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-400/10 hover:text-red-600 dark:hover:text-red-300 disabled:opacity-50"
                    >
                      {removingId === lead.id ? <TbLoader className="animate-spin" size={14} /> : <TbTrash size={14} />}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
