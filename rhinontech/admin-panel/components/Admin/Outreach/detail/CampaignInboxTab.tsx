"use client";

import { useEffect, useMemo, useState } from "react";
import { TbInbox, TbLoader, TbSend, TbArrowLeft, TbEye, TbMessageCheck, TbMail, TbUsersPlus } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "../shared/EmptyState";
import { EmailBodyView } from "../shared/EmailBodyView";
import type { CampaignLead } from "../shared/types";
import { SaveSegmentToGroupDialog, type GroupSegment } from "./SaveSegmentToGroupDialog";

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
  lead?: {
    id: string;
    name: string;
    company: string;
    email: string;
    emailOpened?: boolean;
    openedAt?: string | null;
    status?: string;
  } | null;
}

interface Conversation {
  leadId: string;
  lead: {
    id: string;
    name: string;
    company: string;
    email: string;
    emailOpened?: boolean;
    openedAt?: string | null;
    status?: string;
  };
  emails: ThreadEmail[];
  unread: number;
  hasReply: boolean;
  hasOpened: boolean;
  latestSentAt: string;
}

// The four tabs partition the inbox: every conversation falls in exactly one of
// unopened / opened / reply. "opened" therefore means "opened but has not
// replied" — a lead who replied lives under "reply" only, which is both how the
// row badges already read and what makes the counts add up to "all".
type FilterTab = "all" | "unopened" | "opened" | "reply";

const TAB_DEFS: {
  key: FilterTab;
  label: string;
  icon: React.ReactNode | null;
  activeText: string;
  activeIcon: string;
  activeBadge: string;
}[] = [
  { key: "all", label: "All", icon: null, activeText: "text-stone-900", activeIcon: "", activeBadge: "bg-stone-100 text-stone-700" },
  { key: "unopened", label: "Unopened", icon: <TbMail size={13} />, activeText: "text-stone-900", activeIcon: "text-stone-600", activeBadge: "bg-stone-100 text-stone-700" },
  { key: "opened", label: "Opened", icon: <TbEye size={13} />, activeText: "text-blue-900", activeIcon: "text-blue-600", activeBadge: "bg-blue-100 text-blue-800" },
  { key: "reply", label: "Replied", icon: <TbMessageCheck size={13} />, activeText: "text-emerald-900", activeIcon: "text-emerald-600", activeBadge: "bg-emerald-100 text-emerald-800" },
];

export function CampaignInboxTab({
  campaignId,
  leads = [],
  campaignName,
}: {
  campaignId: string;
  leads?: CampaignLead[];
  campaignName?: string;
}) {
  const [emails, setEmails] = useState<ThreadEmail[] | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);

  const fetchInbox = () => {
    apiFetch<ThreadEmail[]>(`/campaigns/${campaignId}/inbox`)
      .then(setEmails)
      .catch(() => setEmails([]));
  };

  useEffect(() => {
    fetchInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // Lead lookup map for enriching conversations with opened & status info
  const leadMap = useMemo(() => {
    const map = new Map<string, CampaignLead>();
    for (const lead of leads) {
      map.set(lead.id, lead);
    }
    return map;
  }, [leads]);

  // Group emails by lead and sort:
  // 1. Replied leads ALWAYS appear at the top, sorted by latest message timestamp (descending).
  // 2. Non-replied leads follow, also sorted by latest message timestamp (descending).
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
      .map(([leadId, list]) => {
        const enrichedLead = leadMap.get(leadId);
        const baseLead = list[0].lead!;
        const combinedLead = {
          id: leadId,
          name: enrichedLead?.name || baseLead.name,
          company: enrichedLead?.company || baseLead.company,
          email: enrichedLead?.email || baseLead.email,
          emailOpened: enrichedLead?.emailOpened ?? baseLead.emailOpened,
          openedAt: enrichedLead?.openedAt ?? baseLead.openedAt,
          status: enrichedLead?.status ?? baseLead.status,
        };

        const hasReply = list.some((e) => e.folder === "inbox") || combinedLead.status === "Replied";
        const hasOpened = Boolean(combinedLead.emailOpened || combinedLead.openedAt);
        const latestSentAt = list[list.length - 1]?.sentAt || "";

        return {
          leadId,
          lead: combinedLead,
          emails: list,
          unread: list.filter((e) => e.folder === "inbox" && !e.isRead).length,
          hasReply,
          hasOpened,
          latestSentAt,
        };
      })
      .sort((a, b) => {
        // Priority 1: Replied leads always come on top
        if (a.hasReply !== b.hasReply) {
          return a.hasReply ? -1 : 1;
        }
        // Priority 2: Sort by latest email timestamp descending
        return b.latestSentAt.localeCompare(a.latestSentAt);
      });
  }, [emails, leadMap]);

  // Mutually exclusive engagement buckets — the basis for both the tabs and the
  // "save to group" segments, so what you filter to is exactly what you save.
  const buckets = useMemo(() => {
    const replied = conversations.filter((c) => c.hasReply);
    const opened = conversations.filter((c) => !c.hasReply && c.hasOpened);
    const unopened = conversations.filter((c) => !c.hasReply && !c.hasOpened);
    return { replied, opened, unopened };
  }, [conversations]);

  const counts = useMemo(
    () => ({
      all: conversations.length,
      unopened: buckets.unopened.length,
      opened: buckets.opened.length,
      reply: buckets.replied.length,
    }),
    [conversations, buckets]
  );

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    if (filter === "unopened") return buckets.unopened;
    if (filter === "opened") return buckets.opened;
    if (filter === "reply") return buckets.replied;
    return conversations;
  }, [conversations, buckets, filter]);

  const segments = useMemo<GroupSegment[]>(
    () => [
      {
        key: "unopened",
        label: "Not opened",
        hint: "Received the email but never opened it",
        leadIds: buckets.unopened.map((c) => c.leadId),
      },
      {
        key: "opened",
        label: "Opened, no reply",
        hint: "Engaged but hasn't written back",
        leadIds: buckets.opened.map((c) => c.leadId),
      },
      {
        key: "replied",
        label: "Replied",
        hint: "Wrote back — warmest of the three",
        leadIds: buckets.replied.map((c) => c.leadId),
      },
      {
        key: "all",
        label: "Everyone in this inbox",
        hint: "Every contact this campaign emailed",
        leadIds: conversations.map((c) => c.leadId),
      },
    ],
    [buckets, conversations]
  );

  // Opening the dialog from a tab pre-selects that tab's segment.
  const defaultSegmentKey = filter === "reply" ? "replied" : filter;

  // Maintain selected conversation within active filter
  useEffect(() => {
    if (filteredConversations.length > 0) {
      const isCurrentInFiltered = filteredConversations.some((c) => c.leadId === selectedLeadId);
      if (!isCurrentInFiltered) {
        setSelectedLeadId(filteredConversations[0].leadId);
      }
    } else {
      setSelectedLeadId(null);
    }
  }, [filteredConversations, selectedLeadId]);

  // When a conversation is selected/opened, mark its unread emails as read
  useEffect(() => {
    if (!selectedLeadId || !emails) return;
    const unreadEmails = emails.filter(
      (e) => e.leadId === selectedLeadId && e.folder === "inbox" && !e.isRead
    );
    if (unreadEmails.length > 0) {
      // 1. Instantly clear unread count in frontend state
      setEmails((prev) =>
        prev
          ? prev.map((e) =>
              e.leadId === selectedLeadId && e.folder === "inbox" ? { ...e, isRead: true } : e
            )
          : null
      );
      // 2. Persist read status to backend
      for (const unread of unreadEmails) {
        apiFetch(`/inbox/${unread.id}`).catch(() => {});
      }
    }
  }, [selectedLeadId, emails]);

  const selected = filteredConversations.find((c) => c.leadId === selectedLeadId) || conversations.find((c) => c.leadId === selectedLeadId) || null;
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
    return (
      <div className="flex justify-center py-12">
        <TbLoader className="animate-spin text-stone-300" size={28} />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<TbInbox size={40} />}
        title="No emails yet"
        description="When campaign emails are sent or replies are received, conversations will appear here."
      />
    );
  }

  return (
    <div className="flex h-full min-h-[480px] overflow-hidden rounded-xl border border-stone-200/80 bg-white">
      {/* Conversation List Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r border-stone-100 w-full md:w-72 lg:w-80 shrink-0 overflow-hidden",
          mobileThreadOpen ? "hidden md:flex" : "flex"
        )}
      >
        {/* Filter Navigation Tabs */}
        <div className="border-b border-stone-100 p-2.5 bg-stone-50/60 shrink-0 space-y-2">
          {/* Four tabs in a 2x2 grid — a single row can't hold "Unopened" plus a
              count inside the 288px sidebar without truncating. */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-stone-200/60 p-1">
            {TAB_DEFS.map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-xs font-medium transition-all",
                    active ? `bg-white shadow-sm font-semibold ${tab.activeText}` : "text-stone-600 hover:text-stone-900"
                  )}
                >
                  {tab.icon ? (
                    <span className={active ? tab.activeIcon : "text-stone-400"}>{tab.icon}</span>
                  ) : null}
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-tight",
                      active ? tab.activeBadge : "text-stone-500"
                    )}
                  >
                    {counts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => setGroupDialogOpen(true)}
            disabled={conversations.length === 0}
          >
            <TbUsersPlus size={14} /> Save to contact group
          </Button>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400 flex flex-col items-center gap-2 mt-4">
              <TbInbox size={28} className="text-stone-300" />
              <p className="font-medium text-stone-500">
                {filter === "unopened"
                  ? "Everyone has opened their email"
                  : filter === "opened"
                  ? "No opened emails found"
                  : filter === "reply"
                  ? "No replied leads found"
                  : "No conversations found"}
              </p>
              <p className="text-[11px] text-stone-400">
                {filter === "unopened"
                  ? "Recipients who haven't opened yet will show here."
                  : filter === "opened"
                  ? "Recipients who open but don't reply will show here."
                  : filter === "reply"
                  ? "When leads reply to this campaign, they'll show here."
                  : ""}
              </p>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const lastEmail = c.emails[c.emails.length - 1];
              const isSelected = selectedLeadId === c.leadId;

              return (
                <button
                  key={c.leadId}
                  onClick={() => {
                    setSelectedLeadId(c.leadId);
                    setMobileThreadOpen(true);
                  }}
                  className={cn(
                    "flex w-full flex-col gap-1 border-b border-stone-50 px-4 py-3 text-left transition-colors relative",
                    isSelected
                      ? "bg-blue-50/80 hover:bg-blue-50"
                      : "hover:bg-stone-50/80"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-stone-900">
                      {c.lead.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-stone-400">
                      {lastEmail ? new Date(lastEmail.sentAt).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-stone-500 font-normal">
                      {c.lead.company}
                    </span>

                    {/* Badges */}
                    <div className="flex items-center gap-1 shrink-0">
                      {c.hasReply && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                          <TbMessageCheck size={11} />
                          <span>Replied</span>
                        </span>
                      )}
                      {!c.hasReply && c.hasOpened && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200/60">
                          <TbEye size={11} />
                          <span>Opened</span>
                        </span>
                      )}
                      {c.unread > 0 && (
                        <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="line-clamp-1 text-xs text-stone-400 font-normal mt-0.5">
                    {lastEmail ? lastEmail.snippet : ""}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Conversation Thread Detail */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col bg-stone-50/20",
          !mobileThreadOpen ? "hidden md:flex" : "flex"
        )}
      >
        {selected ? (
          <>
            {/* Thread Header */}
            <div className="flex items-center justify-between gap-2 border-b border-stone-100 bg-white px-4 py-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileThreadOpen(false)}
                  className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 md:hidden shrink-0"
                  aria-label="Back to conversations"
                >
                  <TbArrowLeft size={18} />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-stone-900">{selected.lead.name}</p>
                    {selected.hasReply ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                        <TbMessageCheck size={11} /> Replied
                      </span>
                    ) : selected.hasOpened ? (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                        <TbEye size={11} /> Opened
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-stone-400">
                    {selected.lead.company} · {selected.lead.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Messages List */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
              {selected.emails.map((e) => (
                <div
                  key={e.id}
                  className={cn(
                    "max-w-[92%] sm:max-w-[85%] rounded-xl px-4 py-3 text-sm break-words shadow-sm",
                    e.folder === "sent"
                      ? "ml-auto bg-blue-600 text-white"
                      : "bg-white border border-stone-200/80 text-stone-800"
                  )}
                >
                  <div
                    className={cn(
                      "mb-1.5 flex items-center justify-between gap-3 text-[11px] font-semibold",
                      e.folder === "sent" ? "text-blue-100" : "text-stone-400"
                    )}
                  >
                    <span>{e.folder === "sent" ? "You" : e.fromName}</span>
                    <span className="shrink-0 text-[10px]">
                      {new Date(e.sentAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={e.folder === "sent" ? "[&_p]:text-white [&_a]:text-blue-100" : ""}>
                    <EmailBodyView body={e.body} />
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Composer */}
            <div className="border-t border-stone-100 bg-white p-3 sm:p-4 shrink-0">
              {lastInbound ? (
                <div className="flex items-end gap-2">
                  <Textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={`Reply to ${selected.lead.name}...`}
                    className="h-20 resize-none text-sm"
                  />
                  <Button onClick={handleReply} disabled={sending || !replyBody.trim()} size="sm" className="h-10 px-3">
                    {sending ? <TbLoader className="animate-spin" size={14} /> : <TbSend size={14} />}
                  </Button>
                </div>
              ) : (
                <p className="text-center text-xs text-stone-400 py-1">
                  Waiting for a reply before you can respond here.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-stone-400 p-6 text-center">
            Pick a conversation from the list
          </div>
        )}
      </div>

      <SaveSegmentToGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        segments={segments}
        defaultSegmentKey={defaultSegmentKey}
        campaignName={campaignName}
      />
    </div>
  );
}
