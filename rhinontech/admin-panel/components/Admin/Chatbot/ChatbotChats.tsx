"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  TbArrowBackUp, TbClock, TbExternalLink, TbLock, TbLockOpen, TbMail, TbMapPin, TbMessageCircle, TbPhone, TbPin, TbPinnedOff, TbRobot, TbSearch, TbSend,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { timeAgo } from "@/lib/dates";
import { useModuleBase } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { LoadingRows, Notice, Spinner } from "@/components/Admin/Settings/parts";
import { Avatar, Chip, EmptyState, PageShell, Segmented, StatusDot, pageLabel } from "./ui";
import { errorText, openChatForVisitor, useChatEvents, type ChatConversation, type ChatMessage } from "./chatbotApi";
import { useCall } from "./CallContext";

type Filter = "open" | "human" | "closed" | "all";

interface Person {
  id: string;
  fullName: string;
}

interface LiveInfo {
  visitorId: string;
  online: boolean;
  city: string | null;
  country: string | null;
  pageUrl: string | null;
  pageTitle: string | null;
}

const visitorLabel = (c: ChatConversation) => c.visitorName || c.visitorEmail || `Visitor ${c.visitorId.slice(-4).toUpperCase()}`;

/** Agent replies and bot answers are plain text; visitor uploads arrive as one <a> tag. */
function MessageText({ text }: { text: string }) {
  const link = text.match(/^<a href="([^"]+)"[^>]*>([^<]*)<\/a>$/);
  if (link) return <span className="underline underline-offset-2">📎 {link[2] || "Attachment"}</span>;
  return <span className="whitespace-pre-wrap break-words">{text.replace(/<[^>]*>/g, "")}</span>;
}

const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export function ChatbotChats() {
  const base = useModuleBase();
  const params = useSearchParams();
  const crmBase = base.replace("/chatbot/", "/crm/");
  const { has, userId } = usePermissions();
  const canReply = has("chatbot:write");
  const { startCall, isInCall, isCalling } = useCall();

  const [conversations, setConversations] = useState<ChatConversation[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [live, setLive] = useState<Map<string, LiveInfo>>(new Map());
  const [chatbotId, setChatbotId] = useState<string | null>(null);
  const [accent, setAccent] = useState("#1c1917");
  const [people, setPeople] = useState<Person[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (filter === "open") qs.set("status", "open");
      if (filter === "closed") qs.set("status", "closed");
      if (filter === "human") qs.set("mode", "human");
      if (query.trim()) qs.set("q", query.trim());
      const res = await apiFetch<{ conversations: ChatConversation[] }>(`/chatbots/conversations?${qs}`);
      setConversations(res.conversations);
      setError(null);
    } catch (err) {
      const message = errorText(err, "Could not load chats");
      if (/no chatbot/i.test(message)) setMissing(true);
      else setError(message);
    }
  }, [filter, query]);

  useEffect(() => {
    const t = setTimeout(() => void load(), query ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  const loadLive = useCallback(() => {
    apiFetch<{ visitors: LiveInfo[] }>("/chatbots/visitors")
      .then((r) => setLive(new Map(r.visitors.map((v) => [v.visitorId, v]))))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    apiFetch<{ chatbot: { id: string; config: { primaryColor?: string } } | null }>("/chatbots")
      .then((r) => {
        setChatbotId(r.chatbot?.id ?? null);
        if (r.chatbot?.config.primaryColor) setAccent(r.chatbot.config.primaryColor);
      })
      .catch(() => undefined);
    loadLive();
    apiFetch<Person[]>("/people").then(setPeople).catch(() => undefined);
  }, [loadLive]);

  const matchesFilter = useCallback(
    (c: ChatConversation) =>
      filter === "all" || (filter === "open" && c.status === "open") || (filter === "closed" && c.status === "closed") || (filter === "human" && c.mode === "human"),
    [filter]
  );

  const upsert = useCallback(
    (c: ChatConversation) =>
      setConversations((prev) => {
        if (!prev) return prev;
        const rest = prev.filter((x) => x.id !== c.id);
        if (!matchesFilter(c) && c.id !== selectedId) return rest;
        return [c, ...rest].sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
      }),
    [matchesFilter, selectedId]
  );

  const { connected } = useChatEvents({
    "chat:conversation": (c: ChatConversation) => {
      if (chatbotId && c.chatbotId !== chatbotId) return;
      upsert(c);
    },
    "chat:message": (e: { conversation: ChatConversation; message: ChatMessage }) => {
      if (chatbotId && e.conversation.chatbotId !== chatbotId) return;
      const viewing = e.conversation.id === selectedId;
      upsert(viewing ? { ...e.conversation, unreadCount: 0 } : e.conversation);
      if (viewing) {
        setMessages((prev) => (prev.some((m) => m.id === e.message.id) ? prev : [...prev, e.message]));
        if (e.message.role === "user") void apiFetch(`/chatbots/conversations/${e.conversation.id}/read`, { method: "POST" }).catch(() => undefined);
      }
    },
    "chat:conversation:deleted": (e: { id: string }) => setConversations((prev) => prev?.filter((c) => c.id !== e.id) ?? prev),
    "chat:visitor": (e: { chatbotId: string; visitor: LiveInfo }) => {
      if (chatbotId && e.chatbotId !== chatbotId) return;
      setLive((prev) => new Map(prev).set(e.visitor.visitorId, e.visitor));
    },
    "chat:handoff": (e: { conversation: ChatConversation; reason: string }) => {
      toast.info(`${visitorLabel(e.conversation)} wants to talk to the team`, { description: e.reason });
    },
  });

  const selected = useMemo(() => conversations?.find((c) => c.id === selectedId) ?? null, [conversations, selectedId]);
  const isOnline = (visitorId: string) => !!live.get(visitorId)?.online;

  const openConversation = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setLoadingThread(true);
      setMessages([]);
      try {
        const res = await apiFetch<{ conversation: ChatConversation; messages: ChatMessage[] }>(`/chatbots/conversations/${id}`);
        setMessages(res.messages);
        setConversations((prev) => {
          const c = { ...res.conversation, unreadCount: 0 };
          if (!prev) return [c];
          return prev.some((x) => x.id === c.id) ? prev.map((x) => (x.id === c.id ? c : x)) : [c, ...prev];
        });
        if (res.conversation.unreadCount) await apiFetch(`/chatbots/conversations/${id}/read`, { method: "POST" });
      } catch (err) {
        toast.error(errorText(err, "Could not open the chat"));
      } finally {
        setLoadingThread(false);
      }
    },
    []
  );

  // Deep link from Live visitors: ?c=<conversation id>
  const deepLink = params.get("c");
  useEffect(() => {
    if (deepLink && conversations && !selectedId) void openConversation(deepLink);
  }, [deepLink, conversations, selectedId, openConversation]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, selectedId]);

  const send = async () => {
    if (!selected || !draft.trim()) return;
    setSending(true);
    try {
      const res = await apiFetch<{ message: ChatMessage; conversation: ChatConversation }>(`/chatbots/conversations/${selected.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: draft.trim() }),
      });
      setDraft("");
      setMessages((prev) => (prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]));
      upsert(res.conversation);
    } catch (err) {
      toast.error(errorText(err, "Could not send"));
    } finally {
      setSending(false);
    }
  };

  const patch = async (body: Record<string, unknown>, done?: string) => {
    if (!selected) return;
    try {
      const res = await apiFetch<{ conversation: ChatConversation }>(`/chatbots/conversations/${selected.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setConversations((prev) => prev?.map((c) => (c.id === res.conversation.id ? res.conversation : c)) ?? prev);
      if (done) toast.success(done);
    } catch (err) {
      toast.error(errorText(err, "Could not update the chat"));
    }
  };

  if (missing) {
    return (
      <PageShell title="Live chats">
        <Notice tone="info">
          Create the chatbot first. <Link href={base} className="font-medium underline underline-offset-2">Go to Overview →</Link>
        </Notice>
      </PageShell>
    );
  }

  const info = selected ? live.get(selected.visitorId) : undefined;

  return (
    <PageShell
      flush
      title="Live chats"
      subtitle="Every website conversation. Reply to take over from the bot."
      actions={
        <Chip tone={connected ? "green" : "neutral"}>
          <StatusDot online={connected} className="mr-0.5 size-2" /> {connected ? "Live" : "Reconnecting…"}
        </Chip>
      }
    >
      <div className="flex h-full overflow-hidden" data-testid="chatbot-chats">
        {/* Conversation list */}
        <aside className="flex w-[22rem] shrink-0 flex-col border-r border-border/70">
          <div className="flex flex-col gap-3 border-b border-border/70 p-3">
            <div className="relative">
              <TbSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or topic" className="h-9 rounded-xl pl-9" data-testid="chat-search" />
            </div>
            <Segmented
              size="sm"
              value={filter}
              onChange={setFilter}
              testIdPrefix="filter"
              options={[
                { value: "open", label: "Open" },
                { value: "human", label: "With team" },
                { value: "closed", label: "Closed" },
                { value: "all", label: "All" },
              ]}
            />
          </div>
          <div className="flex-1 overflow-auto p-2" data-testid="conversation-list">
            {error && <div className="p-2"><Notice tone="danger">{error}</Notice></div>}
            {!conversations && !error && <div className="p-2"><LoadingRows rows={6} /></div>}
            {conversations?.length === 0 && (
              <EmptyState icon={<TbMessageCircle size={22} />} title="No chats here" body="They appear the moment a visitor writes to the bot." />
            )}
            {conversations?.map((c) => {
              const active = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => void openConversation(c.id)}
                  data-testid={`conversation-${c.id}`}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    active ? "bg-foreground/[0.06] dark:bg-white/[0.07]" : "hover:bg-muted/60"
                  )}
                >
                  <div className="relative mt-0.5">
                    <Avatar name={visitorLabel(c)} seed={c.visitorId} />
                    {isOnline(c.visitorId) && <StatusDot online className="absolute -bottom-0.5 -right-0.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("truncate text-sm", c.unreadCount ? "font-semibold text-foreground" : "font-medium text-foreground/90")}>{visitorLabel(c)}</span>
                      {c.isPinned && <TbPin size={12} className="shrink-0 text-muted-foreground" />}
                      <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <p className={cn("mt-0.5 truncate text-xs", c.unreadCount ? "text-foreground/80" : "text-muted-foreground")}>{c.lastMessagePreview || c.title}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {c.meta?.ticket ? <Chip tone="amber">Ticket</Chip> : c.meta?.handoffRequestedAt && c.mode === "bot" ? <Chip tone="amber">Wants a person</Chip> : null}
                      {c.mode === "human" ? <Chip tone="blue">Team</Chip> : <Chip><TbRobot size={11} /> Bot</Chip>}
                      {c.status === "closed" && <Chip>Closed</Chip>}
                      {c.unreadCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-white" style={{ background: accent }}>
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Transcript */}
        <section className="flex min-w-0 flex-1 flex-col">
          {!selected ? (
            <EmptyState
              className="flex-1"
              icon={<TbMessageCircle size={24} />}
              title="Pick a conversation"
              body="Replying takes the chat over from the bot — the visitor sees your name and answer instantly."
            />
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border/70 px-5 py-3">
                <Avatar name={visitorLabel(selected)} seed={selected.visitorId} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{visitorLabel(selected)}</p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <StatusDot online={isOnline(selected.visitorId)} className="size-2" />
                    {isOnline(selected.visitorId) ? "On your site now" : `Last active ${timeAgo(selected.lastMessageAt)}`}
                    <span>·</span>
                    {selected.mode === "human" ? "Talking to your team" : "Talking to the bot"}
                  </p>
                </div>
                {canReply && (
                  <div className="flex items-center gap-1">
                    {isOnline(selected.visitorId) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1.5"
                        title={`Call ${visitorLabel(selected)}`}
                        onClick={() => void startCall(selected.visitorId, visitorLabel(selected))}
                        disabled={isInCall || isCalling}
                      >
                        <TbPhone size={15} /> Call
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title={selected.isPinned ? "Unpin" : "Pin"} onClick={() => patch({ isPinned: !selected.isPinned })}>
                      {selected.isPinned ? <TbPinnedOff size={16} /> : <TbPin size={16} />}
                    </Button>
                    {selected.mode === "human" && (
                      <Button variant="ghost" size="sm" title="Let the AI answer again" onClick={() => patch({ mode: "bot" }, "Handed back to the bot")}>
                        <TbArrowBackUp size={15} /> To bot
                      </Button>
                    )}
                    {selected.status === "open" ? (
                      <Button variant="outline" size="sm" onClick={() => patch({ status: "closed" }, "Chat closed")} data-testid="close-chat">
                        <TbLock size={15} /> Close
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => patch({ status: "open" }, "Chat reopened")}>
                        <TbLockOpen size={15} /> Reopen
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-auto bg-muted/20 px-5 py-5" data-testid="transcript">
                {loadingThread && <LoadingRows rows={4} />}
                <div className="mx-auto flex max-w-3xl flex-col gap-3">
                  {messages.map((m, i) => {
                    const fromVisitor = m.role === "user";
                    const handover = i > 0 && m.phase === "human" && messages[i - 1].phase === "bot";
                    return (
                      <div key={m.id}>
                        {handover && (
                          <div className="my-2 flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                            <span className="h-px flex-1 bg-border" /> Handed to your team <span className="h-px flex-1 bg-border" />
                          </div>
                        )}
                        <div className={cn("flex items-end gap-2", fromVisitor ? "justify-start" : "justify-end")}>
                          {fromVisitor && <Avatar name={visitorLabel(selected)} seed={selected.visitorId} size="sm" />}
                          <div className="max-w-[72%]">
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-[0_1px_1px_rgb(0_0_0/0.04)]",
                                fromVisitor && "rounded-bl-md border border-border/70 bg-background text-foreground",
                                m.role === "bot" && "rounded-br-md border border-border/70 bg-background text-foreground",
                                m.role === "support" && "rounded-br-md text-white"
                              )}
                              style={m.role === "support" ? { background: accent } : undefined}
                            >
                              <MessageText text={m.text} />
                            </div>
                            <p className={cn("mt-1 flex items-center gap-1 px-1 text-[10px] text-muted-foreground", !fromVisitor && "justify-end")}>
                              {m.role === "bot" && <TbRobot size={11} />}
                              {m.role === "bot" ? "AI" : m.role === "support" ? m.agentName || "Team" : "Visitor"} · {clock(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottom} />
                </div>
              </div>

              {canReply ? (
                <form
                  className="border-t border-border/70 p-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send();
                  }}
                >
                  <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-2 focus-within:border-foreground/30">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      rows={2}
                      placeholder={selected.mode === "bot" ? "Reply to take over from the bot…" : "Write a reply…"}
                      className="min-h-[44px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                      data-testid="reply-box"
                    />
                    <div className="flex items-center justify-between px-1 pt-1">
                      <span className="text-[11px] text-muted-foreground">
                        {isOnline(selected.visitorId) ? "Enter to send · Shift+Enter for a new line" : "They're not on the site — they'll see it next time they open the chat."}
                      </span>
                      <Button type="submit" size="sm" disabled={sending || !draft.trim()} data-testid="send-reply" style={{ background: accent }} className="text-white hover:opacity-90">
                        {sending ? <Spinner /> : <TbSend size={15} />} Send
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <p className="border-t border-border/70 p-3 text-center text-xs text-muted-foreground">You can read chats. Replying needs the chatbot write permission.</p>
              )}
            </>
          )}
        </section>

        {/* Visitor details */}
        {selected && (
          <aside className="hidden w-80 shrink-0 flex-col gap-5 overflow-auto border-l border-border/70 p-5 xl:flex" data-testid="visitor-panel">
            <div className="flex flex-col items-center gap-2 text-center">
              <Avatar name={visitorLabel(selected)} seed={selected.visitorId} size="lg" />
              <p className="text-sm font-semibold">{visitorLabel(selected)}</p>
              <Chip tone={isOnline(selected.visitorId) ? "green" : "neutral"}>
                <StatusDot online={isOnline(selected.visitorId)} className="mr-0.5 size-2" /> {isOnline(selected.visitorId) ? "Online" : "Offline"}
              </Chip>
            </div>

            <Section title="Contact">
              <Detail icon={<TbMail size={14} />} value={selected.visitorEmail} />
              <Detail icon={<TbPhone size={14} />} value={selected.visitorPhone} />
              <Detail icon={<TbMapPin size={14} />} value={[info?.city, info?.country].filter(Boolean).join(", ") || null} />
              <Detail icon={<TbClock size={14} />} value={`First message ${timeAgo(selected.createdAt)}`} />
            </Section>

            {(info?.pageUrl || typeof selected.meta?.pageUrl === "string") && (
              <Section title={info?.online ? "Looking at" : "Started on"}>
                <a
                  href={(info?.pageUrl || selected.meta?.pageUrl) as string}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs hover:text-foreground"
                >
                  <span className="truncate">{info?.pageTitle || pageLabel((info?.pageUrl || selected.meta?.pageUrl) as string)}</span>
                  <TbExternalLink size={12} className="shrink-0" />
                </a>
              </Section>
            )}

            {typeof selected.meta?.handoffReason === "string" && (
              <Section title="Asked the team for">
                <p className="text-sm">{selected.meta.handoffReason}</p>
              </Section>
            )}

            {selected.leadId && (
              <Link
                href={`${crmBase}?leadId=${selected.leadId}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60"
                data-testid="open-lead"
              >
                Open lead in CRM <TbExternalLink size={14} />
              </Link>
            )}

            {canReply && (
              <Section title="Assigned to">
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={selected.assignedUserId ?? ""}
                  onChange={(e) => patch({ assignedUserId: e.target.value || null }, "Assignment updated")}
                  data-testid="assign-select"
                >
                  <option value="">Nobody</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id === userId ? `${p.fullName} (me)` : p.fullName}
                    </option>
                  ))}
                </select>
              </Section>
            )}

            {canReply && isOnline(selected.visitorId) && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="text-emerald-600 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1.5"
                  onClick={() => void startCall(selected.visitorId, visitorLabel(selected))}
                  disabled={isInCall || isCalling}
                >
                  <TbPhone size={15} /> Voice call visitor
                </Button>
                {chatbotId && (
                  <Button variant="outline" onClick={() => openChatForVisitor(chatbotId, selected.visitorId, selected.publicKey)}>
                    <TbMessageCircle size={15} /> Open the chat on their screen
                  </Button>
                )}
              </div>
            )}

            {selected.review && (
              <Section title="Their feedback">
                {Object.entries(selected.review)
                  .filter(([k]) => k !== "submittedAt")
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 text-sm">
                      <span className="capitalize text-muted-foreground">{k.replace(/[_-]+/g, " ")}</span>
                      <span className="text-right">{String(v)}</span>
                    </div>
                  ))}
              </Section>
            )}
          </aside>
        )}
      </div>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Detail({ icon, value }: { icon: React.ReactNode; value: string | null | undefined }) {
  return (
    <p className={cn("flex items-center gap-2 text-sm", value ? "text-foreground" : "text-muted-foreground")}>
      <span className="text-muted-foreground">{icon}</span>
      <span className="truncate">{value || "—"}</span>
    </p>
  );
}
