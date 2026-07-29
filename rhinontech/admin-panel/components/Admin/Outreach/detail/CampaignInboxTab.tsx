"use client";

import { useEffect, useMemo, useState } from "react";
import { TbInbox, TbLoader, TbSend } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "../shared/EmptyState";
import { EmailBodyView } from "../shared/EmailBodyView";

interface ThreadEmail {
  id: string;
  folder: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  snippet: string;
  isRead: boolean;
  sentAt: string;
  leadId: string | null;
  lead?: { id: string; name: string; company: string; email: string } | null;
}

interface Conversation {
  leadId: string;
  lead: { id: string; name: string; company: string; email: string };
  emails: ThreadEmail[];
  unread: number;
}

export function CampaignInboxTab({ campaignId }: { campaignId: string }) {
  const [emails, setEmails] = useState<ThreadEmail[] | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const fetchInbox = () => {
    apiFetch<ThreadEmail[]>(`/campaigns/${campaignId}/inbox`)
      .then(setEmails)
      .catch(() => setEmails([]));
  };

  useEffect(() => {
    fetchInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const conversations = useMemo<Conversation[]>(() => {
    if (!emails) return [];
    const byLead = new Map<string, ThreadEmail[]>();
    for (const e of emails) {
      if (!e.leadId || !e.lead) continue;
      const list = byLead.get(e.leadId) || [];
      list.push(e);
      byLead.set(e.leadId, list);
    }
    return Array.from(byLead.entries())
      .map(([leadId, list]) => ({
        leadId,
        lead: list[0].lead!,
        emails: list,
        unread: list.filter((e) => e.folder === "inbox" && !e.isRead).length,
      }))
      .sort((a, b) => {
        const aLast = a.emails[a.emails.length - 1].sentAt;
        const bLast = b.emails[b.emails.length - 1].sentAt;
        return bLast.localeCompare(aLast);
      });
  }, [emails]);

  useEffect(() => {
    if (!selectedLeadId && conversations.length > 0) setSelectedLeadId(conversations[0].leadId);
  }, [conversations, selectedLeadId]);

  const selected = conversations.find((c) => c.leadId === selectedLeadId) || null;
  const lastInbound = selected ? [...selected.emails].reverse().find((e) => e.folder === "inbox") : null;

  const handleReply = async () => {
    if (!lastInbound || !replyBody.trim()) return;
    setSending(true);
    try {
      await apiFetch(`/inbox/${lastInbound.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      toast.success("Reply sent");
      setReplyBody("");
      fetchInbox();
    } catch (err: any) {
      toast.error(err.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (emails === null) {
    return <div className="flex justify-center py-12"><TbLoader className="animate-spin text-stone-300" size={28} /></div>;
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<TbInbox size={40} />}
        title="No replies yet"
        description="When a lead replies to this campaign, the conversation shows up here."
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-lg border border-stone-100 bg-white">
      <div className="w-64 shrink-0 overflow-auto border-r border-stone-100">
        {conversations.map((c) => (
          <button
            key={c.leadId}
            onClick={() => setSelectedLeadId(c.leadId)}
            className={cn(
              "flex w-full flex-col gap-0.5 border-b border-stone-50 px-4 py-3 text-left hover:bg-stone-50",
              selectedLeadId === c.leadId && "bg-blue-50 hover:bg-blue-50"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-bold text-stone-900">{c.lead.name}</span>
              {c.unread > 0 && (
                <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                  {c.unread}
                </span>
              )}
            </div>
            <span className="truncate text-xs text-stone-400">{c.lead.company}</span>
            <span className="truncate text-xs text-stone-400">
              {c.emails[c.emails.length - 1].snippet}
            </span>
          </button>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <>
            <div className="border-b border-stone-100 px-5 py-3">
              <p className="text-sm font-bold text-stone-900">{selected.lead.name}</p>
              <p className="text-xs text-stone-400">{selected.lead.company} · {selected.lead.email}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-auto p-5">
              {selected.emails.map((e) => (
                <div
                  key={e.id}
                  className={cn(
                    "max-w-[85%] rounded-xl px-4 py-3 text-sm",
                    e.folder === "sent" ? "ml-auto bg-blue-50 text-blue-950" : "bg-stone-100 text-stone-800"
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-semibold text-stone-400">
                    <span>{e.folder === "sent" ? "You" : e.fromName}</span>
                    <span>{new Date(e.sentAt).toLocaleString()}</span>
                  </div>
                  <EmailBodyView body={e.body} />
                </div>
              ))}
            </div>
            <div className="border-t border-stone-100 p-4">
              {lastInbound ? (
                <div className="flex items-end gap-2">
                  <Textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={`Reply to ${selected.lead.name}...`}
                    className="h-20 resize-none"
                  />
                  <Button onClick={handleReply} disabled={sending || !replyBody.trim()}>
                    {sending ? <TbLoader className="animate-spin" size={14} /> : <TbSend size={14} />}
                  </Button>
                </div>
              ) : (
                <p className="text-center text-xs text-stone-400">Waiting for a reply before you can respond here.</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-stone-400">Pick a conversation</div>
        )}
      </div>
    </div>
  );
}
