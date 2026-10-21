"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  TbCircleFilled, TbExternalLink, TbLock, TbLockOpen, TbMessageCircle, TbPin, TbPinnedOff, TbRobot, TbSearch, TbSend, TbUser,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { timeAgo } from "@/lib/dates";
import { useModuleBase } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { LoadingRows, Notice, Pill, Spinner } from "@/components/Admin/Settings/parts";
import { errorText, openChatForVisitor, useChatEvents, type ChatConversation, type ChatMessage } from "./chatbotApi";

type Filter = "open" | "human" | "closed" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "human", label: "With a person" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
];

interface Person {
  id: string;
  fullName: string;
}

const visitorLabel = (c: ChatConversation) => c.visitorName || c.visitorEmail || `Visitor ${c.visitorId.slice(-4)}`;

/** Agent replies and bot answers are plain text; visitor uploads arrive as one <a> tag. */
function MessageText({ text }: { text: string }) {
  const link = text.match(/^<a href="([^"]+)"[^>]*>([^<]*)<\/a>$/);
  if (link) return <span className="underline underline-offset-2">📎 {link[2] || "Attachment"}</span>;
  return <span className="whitespace-pre-wrap break-words">{text.replace(/<[^>]*>/g, "")}</span>;
}

export function ChatbotChats() {
  const base = useModuleBase();
  const crmBase = base.replace("/chatbot/", "/crm/");
  const { has, userId } = usePermissions();
  const canReply = has("chatbot:write");

  const [conversations, setConversations] = useState<ChatConversation[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [chatbotId, setChatbotId] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter === "open") params.set("status", "open");
      if (filter === "closed") params.set("status", "closed");
      if (filter === "human") params.set("mode", "human");
      if (query.trim()) params.set("q", query.trim());
      const res = await apiFetch<{ conversations: ChatConversation[] }>(`/chatbots/conversations?${params}`);
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

  useEffect(() => {
    apiFetch<{ chatbot: { id: string } | null }>("/chatbots").then((r) => setChatbotId(r.chatbot?.id ?? null)).catch(() => undefined);
    apiFetch<{ visitors: { visitorId: string }[] }>("/chatbots/visitors")
      .then((r) => setOnline(new Set(r.visitors.map((v) => v.visitorId))))
      .catch(() => undefined);
    apiFetch<Person[]>("/people").then(setPeople).catch(() => undefined);
  }, []);

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
        if (!matchesFilter(c)) return rest;
        return [c, ...rest].sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
      }),
    [matchesFilter]
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
    "chat:visitor": (e: { chatbotId: string; type: "online" | "offline"; visitor: { visitorId: string } }) => {
      if (chatbotId && e.chatbotId !== chatbotId) return;
      setOnline((prev) => {
        const next = new Set(prev);
        if (e.type === "online") next.add(e.visitor.visitorId);
        else next.delete(e.visitor.visitorId);
        return next;
      });
    },
    "chat:handoff": (e: { conversation: ChatConversation; reason: string }) => {
      toast.info(`${visitorLabel(e.conversation)} wants to talk to the team`, { description: e.reason });
    },
  });

  const selected = useMemo(() => conversations?.find((c) => c.id === selectedId) ?? null, [conversations, selectedId]);

  const openConversation = async (id: string) => {
    setSelectedId(id);
    setLoadingThread(true);
    setMessages([]);
    try {
      const res = await apiFetch<{ conversation: ChatConversation; messages: ChatMessage[] }>(`/chatbots/conversations/${id}`);
      setMessages(res.messages);
      upsert({ ...res.conversation, unreadCount: 0 });
      if (res.conversation.unreadCount) await apiFetch(`/chatbots/conversations/${id}/read`, { method: "POST" });
    } catch (err) {
      toast.error(errorText(err, "Could not open the chat"));
    } finally {
      setLoadingThread(false);
    }
  };

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
      upsert(res.conversation);
      if (!matchesFilter(res.conversation)) setConversations((prev) => (prev ? [res.conversation, ...prev] : prev));
      if (done) toast.success(done);
    } catch (err) {
      toast.error(errorText(err, "Could not update the chat"));
    }
  };

  if (missing) {
    return (
      <div className="p-6">
        <Notice tone="info">
          Create the chatbot first. <Link href={base} className="font-medium underline underline-offset-2">Go to Overview →</Link>
        </Notice>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden glass-panel rounded-r-xl" data-testid="chatbot-chats">
      {/* List */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-border">
        <div className="flex h-16 items-center gap-3 border-b border-border px-4 glass-header">
          <SubNavToggle />
          <h1 className="flex-1 text-base font-semibold tracking-tight">Live chats</h1>
          <span className={cn("inline-flex items-center gap-1 text-[11px]", connected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} title={connected ? "Receiving live updates" : "Reconnecting…"}>
            <TbCircleFilled size={8} /> {connected ? "Live" : "Offline"}
          </span>
        </div>
        <div className="flex flex-col gap-2 border-b border-border p-3">
          <div className="relative">
            <TbSearch size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, topic" className="pl-8" data-testid="chat-search" />
          </div>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                data-testid={`filter-${f.key}`}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto" data-testid="conversation-list">
          {error && <div className="p-3"><Notice tone="danger">{error}</Notice></div>}
          {!conversations && !error && <div className="p-3"><LoadingRows rows={5} /></div>}
          {conversations?.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No chats here yet. They appear the moment a visitor writes to the bot.
            </p>
          )}
          {conversations?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => void openConversation(c.id)}
              data-testid={`conversation-${c.id}`}
              className={cn(
                "flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                c.id === selectedId && "bg-muted"
              )}
            >
              <div className="relative mt-0.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  {c.mode === "human" ? <TbUser size={16} /> : <TbRobot size={16} />}
                </span>
                {online.has(c.visitorId) && <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500" title="On the site now" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("truncate text-sm", c.unreadCount ? "font-semibold text-foreground" : "font-medium text-foreground/90")}>{visitorLabel(c)}</span>
                  {c.isPinned && <TbPin size={12} className="shrink-0 text-muted-foreground" />}
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{timeAgo(c.lastMessageAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.lastMessagePreview || c.title}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {c.meta?.ticket ? <Pill tone="amber">Ticket</Pill> : c.meta?.handoffRequestedAt && c.mode === "bot" ? <Pill tone="amber">Wants a person</Pill> : null}
                  {c.mode === "human" && <Pill tone="blue">Person</Pill>}
                  {c.status === "closed" && <Pill>Closed</Pill>}
                  {c.unreadCount > 0 && <span className="ml-auto rounded-full bg-foreground px-1.5 text-[10px] font-semibold text-background">{c.unreadCount}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Transcript */}
      <section className="flex min-w-0 flex-1 flex-col">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <TbMessageCircle size={28} />
            <p className="text-sm">Pick a chat to read it or reply.</p>
            <p className="max-w-xs text-xs">Replying takes the chat over from the bot — the visitor sees your name and your answer instantly.</p>
          </div>
        ) : (
          <>
            <div className="flex h-16 items-center gap-3 border-b border-border px-5 glass-header">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{visitorLabel(selected)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {online.has(selected.visitorId) ? "On the site now" : `Last message ${timeAgo(selected.lastMessageAt)}`} · {selected.mode === "human" ? "Talking to your team" : "Talking to the bot"}
                </p>
              </div>
              {canReply && (
                <>
                  <Button variant="ghost" size="icon" title={selected.isPinned ? "Unpin" : "Pin"} onClick={() => patch({ isPinned: !selected.isPinned })}>
                    {selected.isPinned ? <TbPinnedOff size={16} /> : <TbPin size={16} />}
                  </Button>
                  {selected.status === "open" ? (
                    <Button variant="outline" size="sm" onClick={() => patch({ status: "closed" }, "Chat closed")} data-testid="close-chat">
                      <TbLock size={15} /> Close
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => patch({ status: "open" }, "Chat reopened")}>
                      <TbLockOpen size={15} /> Reopen
                    </Button>
                  )}
                </>
              )}
            </div>

            <div className="flex-1 overflow-auto px-5 py-4" data-testid="transcript">
              {loadingThread && <LoadingRows rows={4} />}
              <div className="mx-auto flex max-w-3xl flex-col gap-2">
                {messages.map((m, i) => {
                  const fromVisitor = m.role === "user";
                  const handover = i > 0 && m.phase === "human" && messages[i - 1].phase === "bot";
                  return (
                    <div key={m.id}>
                      {handover && (
                        <div className="my-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="h-px flex-1 bg-border" /> Moved to your team <span className="h-px flex-1 bg-border" />
                        </div>
                      )}
                      <div className={cn("flex", fromVisitor ? "justify-start" : "justify-end")}>
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                            fromVisitor
                              ? "rounded-bl-md bg-muted text-foreground"
                              : m.role === "bot"
                                ? "rounded-br-md border border-border bg-card text-foreground"
                                : "rounded-br-md bg-foreground text-background"
                          )}
                        >
                          <MessageText text={m.text} />
                          <p className={cn("mt-1 text-[10px]", fromVisitor || m.role === "bot" ? "text-muted-foreground" : "text-background/70")}>
                            {m.role === "bot" ? "Bot" : m.role === "support" ? m.agentName || "Team" : "Visitor"} · {timeAgo(m.createdAt)}
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
                className="border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <div className="mx-auto flex max-w-3xl items-end gap-2">
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
                    placeholder={selected.mode === "bot" ? "Reply to take over from the bot…" : "Write a reply — Enter to send, Shift+Enter for a new line"}
                    className="min-h-[44px] resize-none"
                    data-testid="reply-box"
                  />
                  <Button type="submit" disabled={sending || !draft.trim()} data-testid="send-reply">
                    {sending ? <Spinner /> : <TbSend size={16} />} Send
                  </Button>
                </div>
                {!online.has(selected.visitorId) && (
                  <p className="mx-auto mt-1.5 max-w-3xl text-[11px] text-muted-foreground">The visitor isn&apos;t on the site right now — they&apos;ll see your reply next time they open the chat.</p>
                )}
              </form>
            ) : (
              <p className="border-t border-border p-3 text-center text-xs text-muted-foreground">You can read chats. Replying needs the chatbot write permission.</p>
            )}
          </>
        )}
      </section>

      {/* Visitor */}
      {selected && (
        <aside className="hidden w-72 shrink-0 flex-col gap-4 overflow-auto border-l border-border p-4 xl:flex" data-testid="visitor-panel">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Visitor</p>
            <dl className="mt-2 space-y-1.5 text-sm">
              <Row label="Name" value={selected.visitorName} />
              <Row label="Email" value={selected.visitorEmail} />
              <Row label="Phone" value={selected.visitorPhone} />
              <Row label="Started" value={timeAgo(selected.createdAt)} />
              {typeof selected.meta?.pageUrl === "string" && <Row label="Page" value={selected.meta.pageUrl} />}
            </dl>
          </div>

          {selected.leadId && (
            <Link href={`${crmBase}?leadId=${selected.leadId}`} className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-2" data-testid="open-lead">
              Open lead in CRM <TbExternalLink size={14} />
            </Link>
          )}

          {typeof selected.meta?.handoffReason === "string" && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Asked for the team</p>
              <p className="mt-1 text-sm">{selected.meta.handoffReason}</p>
            </div>
          )}

          {canReply && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned to</p>
              <select
                className="mt-1.5 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
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
            </div>
          )}

          {canReply && chatbotId && online.has(selected.visitorId) && (
            <Button variant="outline" size="sm" onClick={() => openChatForVisitor(chatbotId, selected.visitorId, selected.publicKey)}>
              <TbMessageCircle size={15} /> Open the chat on their screen
            </Button>
          )}

          {selected.review && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Their feedback</p>
              <dl className="mt-2 space-y-1.5 text-sm">
                {Object.entries(selected.review)
                  .filter(([k]) => k !== "submittedAt")
                  .map(([k, v]) => (
                    <Row key={k} label={k.replace(/[_-]+/g, " ")} value={String(v)} />
                  ))}
              </dl>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 capitalize text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words text-foreground">{value || "—"}</dd>
    </div>
  );
}
