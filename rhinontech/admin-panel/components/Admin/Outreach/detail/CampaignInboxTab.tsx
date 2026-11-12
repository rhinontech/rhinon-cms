"use client";

import { useEffect, useMemo, useState } from "react";
import { TbInbox, TbLoader, TbSend2, TbArrowLeft, TbEye, TbMessageCheck, TbMail, TbUsersPlus, TbSearch } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../shared/EmptyState";
import { EmailBodyView } from "../shared/EmailBodyView";
import type { CampaignLead } from "../shared/types";
import { Avatar, listTime, stampTime, fullTime } from "../../Inbox/inboxShared";
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
  { key: "all", label: "All", icon: null, activeText: "text-foreground", activeIcon: "", activeBadge: "bg-muted text-foreground/85" },
  { key: "unopened", label: "Unopened", icon: <TbMail size={13} />, activeText: "text-foreground", activeIcon: "text-foreground/70", activeBadge: "bg-muted text-foreground/85" },
  { key: "opened", label: "Opened", icon: <TbEye size={13} />, activeText: "text-blue-900 dark:text-blue-200", activeIcon: "text-blue-600 dark:text-blue-300", activeBadge: "bg-blue-100 dark:bg-blue-400/15 text-blue-800 dark:text-blue-200" },
  { key: "reply", label: "Replied", icon: <TbMessageCheck size={13} />, activeText: "text-emerald-900 dark:text-emerald-200", activeIcon: "text-emerald-600 dark:text-emerald-300", activeBadge: "bg-emerald-100 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-200" },
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
  const [query, setQuery] = useState("");

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
    const list =
      filter === "unopened" ? buckets.unopened
        : filter === "opened" ? buckets.opened
          : filter === "reply" ? buckets.replied
            : conversations;
    const q = query.trim().toLowerCase();
    return q
      ? list.filter((c) => `${c.lead.name} ${c.lead.company} ${c.lead.email}`.toLowerCase().includes(q))
      : list;
  }, [conversations, buckets, filter, query]);

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
        <TbLoader className="animate-spin text-muted-foreground/70" size={28} />
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
    <div className="flex h-full min-h-[480px] overflow-hidden rounded-xl glass-card">
      {/* Conversation list */}
      <div className={cn("flex w-full shrink-0 flex-col overflow-hidden border-r md:w-80 lg:w-[340px]", mobileThreadOpen ? "hidden md:flex" : "flex")}>
        <div className="shrink-0 space-y-2.5 border-b p-3">
          <div className="segmented" role="tablist" aria-label="Filter conversations">
            {TAB_DEFS.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={filter === tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "flex flex-auto items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-xs font-medium transition-colors",
                  filter === tab.key ? "segment-active" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                <span className="tabular-nums text-[10.5px] text-muted-foreground">{counts[tab.key]}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <TbSearch size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people"
                className="h-8 w-full rounded-lg border border-input bg-background/70 pl-8 pr-2 text-[13px] outline-none focus:border-ring/60 focus:ring-[3px] focus:ring-ring/15"
              />
            </div>
            <Button size="sm" variant="outline" onClick={() => setGroupDialogOpen(true)} title="Save these people to a contact group">
              <TbUsersPlus /> Save
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <TbInbox size={24} className="text-muted-foreground/70" />
              <p className="text-sm font-medium text-foreground">
                {query.trim() ? "No matches"
                  : filter === "unopened" ? "Everyone has opened it"
                    : filter === "opened" ? "No opens without a reply"
                      : filter === "reply" ? "No replies yet" : "No conversations"}
              </p>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const lastEmail = c.emails[c.emails.length - 1];
              const isSelected = selectedLeadId === c.leadId;
              return (
                <button
                  key={c.leadId}
                  onClick={() => { setSelectedLeadId(c.leadId); setMobileThreadOpen(true); }}
                  className={cn(
                    "relative flex w-full gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isSelected ? "bg-[var(--surface-selected)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--brand)_18%,transparent)]" : "hover:bg-foreground/[0.04]"
                  )}
                >
                  {c.unread > 0 && <span className="absolute left-[3px] top-[26px] h-1.5 w-1.5 rounded-full bg-brand" />}
                  <Avatar name={c.lead.name} seed={c.lead.email} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className={cn("min-w-0 flex-1 truncate text-[13px]", c.unread ? "font-semibold text-foreground" : "font-medium text-foreground/85")}>{c.lead.name}</span>
                      <time className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{lastEmail ? listTime(lastEmail.sentAt) : ""}</time>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{c.lead.company || c.lead.email}</span>
                      {c.hasReply ? (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"><TbMessageCheck size={12} />Replied</span>
                      ) : c.hasOpened ? (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400"><TbEye size={12} />Opened</span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground/80"><TbMail size={12} />Sent</span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground/90">{lastEmail?.snippet}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className={cn("flex min-w-0 flex-1 flex-col", !mobileThreadOpen ? "hidden md:flex" : "flex")}>
        {selected ? (
          <>
            <div className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
              <button onClick={() => setMobileThreadOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted md:hidden" aria-label="Back to conversations">
                <TbArrowLeft size={18} />
              </button>
              <Avatar name={selected.lead.name} seed={selected.lead.email} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">{selected.lead.name}</p>
                <p className="truncate text-xs text-muted-foreground">{[selected.lead.company, selected.lead.email].filter(Boolean).join(" · ")}</p>
              </div>
              {selected.hasReply ? (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">Replied</span>
              ) : selected.hasOpened ? (
                <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20">Opened</span>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
              <div className="mx-auto flex max-w-[820px] flex-col gap-2.5">
                {selected.emails.map((e) => {
                  const mine = e.folder === "sent";
                  return (
                    <article key={e.id} className={cn("rounded-xl border bg-card shadow-xs", mine && "border-brand/15 bg-[color-mix(in_oklch,var(--card)_96%,var(--brand))]")}>
                      <header className="flex items-start gap-3 px-4 pt-3.5 sm:px-5">
                        <Avatar name={mine ? "You" : e.fromName} seed={e.fromEmail} size="sm" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[13px] font-semibold text-foreground">{mine ? "You" : e.fromName}</span>
                          <span className="ml-1.5 text-xs text-muted-foreground">{mine ? "sent" : "replied"}</span>
                        </div>
                        <time className="shrink-0 text-xs text-muted-foreground" title={fullTime(e.sentAt)}>{stampTime(e.sentAt)}</time>
                      </header>
                      <div className="px-4 pb-4 pt-2.5 sm:px-5">
                        <EmailBodyView body={e.body} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 border-t bg-foreground/[0.015] p-3">
              {lastInbound ? (
                <div className="mx-auto max-w-[820px] rounded-xl border bg-background shadow-xs focus-within:border-ring/60 focus-within:ring-[3px] focus-within:ring-ring/12">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleReply(); } }}
                    placeholder={`Reply to ${selected.lead.name}…`}
                    rows={2}
                    className="field-sizing-content block max-h-48 min-h-[64px] w-full resize-none bg-transparent px-3 py-2.5 text-[13.5px] leading-6 outline-none placeholder:text-muted-foreground/80"
                  />
                  <div className="flex items-center justify-between px-3 pb-2">
                    <span className="truncate text-[11px] text-muted-foreground">{`To ${lastInbound.fromEmail} · ⌘/Ctrl+Enter to send`}</span>
                    <Button onClick={handleReply} disabled={sending || !replyBody.trim()} size="sm">
                      {sending ? <TbLoader className="animate-spin" /> : <TbSend2 />} Send
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="py-1 text-center text-xs text-muted-foreground">You can reply here once they write back.</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">Pick a conversation from the list</div>
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
