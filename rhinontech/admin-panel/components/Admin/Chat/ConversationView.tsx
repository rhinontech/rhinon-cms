"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TbArrowDown, TbArrowLeft, TbBellOff, TbInfoCircle, TbLoader2, TbPhone, TbSearch, TbUpload, TbVideo } from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { teamChatApi } from "./teamChatApi";
import { useTeamChat } from "./store";
import { MessageItem } from "./MessageItem";
import { Composer, type ComposerHandle } from "./Composer";
import { DetailsPanel, ThreadPanel } from "./panels";
import { startCall, useCall } from "./calls";
import { ConversationIcon, PRESENCE_LABEL, conversationTitle, dayLabel, firstName, otherMemberId } from "./shared";
import type { ChatMessage, Conversation } from "./types";

const GROUP_WINDOW_MS = 5 * 60_000;

interface Props {
  conversation: Conversation;
  meId: string | null;
  threadId: string | null;
  jumpTo: string | null;
  onOpenThread: (id: string | null) => void;
  onBack: () => void;
  onSearch: () => void;
  onOpenDirect: (userId: string) => void;
  onJump: (m: ChatMessage) => void;
}

export function ConversationView({ conversation, meId, threadId, jumpTo, onOpenThread, onBack, onSearch, onOpenDirect, onJump }: Props) {
  const users = useTeamChat((s) => s.users);
  const presence = useTeamChat((s) => s.presence);
  const page = useTeamChat((s) => s.messages[conversation.id]);
  const allTyping = useTeamChat((s) => s.typing);
  const runningCall = useCall((s) => s.active[conversation.id]);
  const inThisCall = useCall((s) => s.callId !== null && s.callId === runningCall?.callId);
  const [showDetails, setShowDetails] = useState(false);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [readStates, setReadStates] = useState<Record<string, string | null>>({});
  // The "New messages" divider sits where the user's read position was when they opened the chat.
  const [unreadFrom, setUnreadFrom] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<ComposerHandle>(null);
  const prevHeight = useRef<number | null>(null);

  const items = page?.items ?? [];
  const otherId = conversation.kind === "direct" ? otherMemberId(conversation, meId) : null;
  const title = conversationTitle(conversation, users, meId);
  const typing = useMemo(
    () => allTyping.filter((t) => t.conversationId === conversation.id && !t.parentId && t.userId !== meId),
    [allTyping, conversation.id, meId]
  );

  // --- loading -----------------------------------------------------------------

  useEffect(() => {
    setEditing(null);
    setLoadError(null);
    setHighlight(null);
    setUnreadFrom(conversation.unread > 0 ? conversation.lastReadAt ?? "1970-01-01T00:00:00.000Z" : null);
    if (!useTeamChat.getState().messages[conversation.id]?.loaded) {
      teamChatApi
        .messages(conversation.id)
        .then((r) => useTeamChat.getState().setPage(conversation.id, r.messages, r.hasMore, "replace"))
        .catch((e) => setLoadError(e.message));
    }
    if (conversation.isMember) {
      teamChatApi
        .readStates(conversation.id)
        .then((rows) => setReadStates(Object.fromEntries(rows.map((r) => [r.userId, r.lastReadAt]))))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  useEffect(() => {
    const onRead = (e: Event) => {
      const d = (e as CustomEvent<{ conversationId: string; userId: string; lastReadAt: string }>).detail;
      if (d.conversationId === conversation.id) setReadStates((r) => ({ ...r, [d.userId]: d.lastReadAt }));
    };
    window.addEventListener("team-chat:read", onRead);
    return () => window.removeEventListener("team-chat:read", onRead);
  }, [conversation.id]);

  const loadOlder = useCallback(async () => {
    const current = useTeamChat.getState().messages[conversation.id];
    if (!current?.hasMore || loadingOlder) return false;
    const oldest = current.items.find((m) => !m.pending);
    if (!oldest) return false;
    setLoadingOlder(true);
    prevHeight.current = scrollRef.current?.scrollHeight ?? null;
    try {
      const r = await teamChatApi.messages(conversation.id, oldest.createdAt);
      useTeamChat.getState().setPage(conversation.id, r.messages, r.hasMore, "prepend");
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setLoadingOlder(false);
    }
  }, [conversation.id, loadingOlder]);

  // Keep the viewport anchored when older messages are prepended.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && prevHeight.current !== null) {
      el.scrollTop += el.scrollHeight - prevHeight.current;
      prevHeight.current = null;
    }
  }, [items.length]);

  // --- scrolling ---------------------------------------------------------------

  const scrollToBottom = (smooth = false) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  // Open at the bottom; follow new messages only if already near the bottom (or they're mine).
  const lastId = items[items.length - 1]?.id;
  const lastMine = items[items.length - 1]?.authorId === meId;
  useLayoutEffect(() => {
    if (!page?.loaded || jumpTo) return;
    if (atBottom || lastMine) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId, page?.loaded]);

  useLayoutEffect(() => {
    setAtBottom(true);
    requestAnimationFrame(() => scrollToBottom());
  }, [conversation.id]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 120);
    if (el.scrollTop < 80) void loadOlder();
  };

  // Jump to a message from search or pins: page back until it's loaded.
  useEffect(() => {
    if (!jumpTo || !page?.loaded) return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 20 && !cancelled; i++) {
        const el = document.getElementById(`msg-${jumpTo}`);
        if (el) {
          el.scrollIntoView({ block: "center" });
          setHighlight(jumpTo);
          setTimeout(() => setHighlight(null), 2000);
          return;
        }
        if (!(await loadOlder())) break;
        await new Promise((r) => setTimeout(r, 50));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpTo, page?.loaded]);

  // --- read state --------------------------------------------------------------

  useEffect(() => {
    if (!conversation.isMember || !page?.loaded) return;
    const mark = () => {
      if (document.hidden) return;
      const c = useTeamChat.getState().conversations[conversation.id];
      if (!c || (c.unread === 0 && c.mentionUnread === 0 && c.lastMessage?.authorId === meId)) return;
      useTeamChat.getState().patchConversation(conversation.id, { unread: 0, mentionUnread: 0 });
      teamChatApi.markRead(conversation.id).catch(() => {});
    };
    mark();
    document.addEventListener("visibilitychange", mark);
    return () => document.removeEventListener("visibilitychange", mark);
  }, [conversation.id, conversation.isMember, lastId, page?.loaded, meId]);

  // --- actions -----------------------------------------------------------------

  const join = async () => {
    try {
      useTeamChat.getState().upsertConversation(await teamChatApi.join(conversation.id));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const retry = async (m: ChatMessage) => {
    if (!m.clientId) return;
    useTeamChat.getState().dropPending(conversation.id, m.clientId);
    useTeamChat.getState().addPending({ ...m, pending: "sending" });
    try {
      await teamChatApi.send(conversation.id, { body: m.body, attachments: m.attachments, mentions: m.mentions, clientId: m.clientId });
    } catch (e) {
      useTeamChat.getState().failPending(conversation.id, m.clientId);
      toast.error((e as Error).message);
    }
  };

  // "Seen" under my latest message in a 1:1, once the other person has read past it.
  const seenId = useMemo(() => {
    if (!otherId) return null;
    const seenAt = readStates[otherId];
    if (!seenAt) return null;
    const mine = [...items].reverse().find((m) => m.authorId === meId && !m.pending && !m.isSystem);
    return mine && mine.createdAt <= seenAt ? mine.id : null;
  }, [items, readStates, otherId, meId]);

  const subtitle = otherId
    ? [PRESENCE_LABEL[presence[otherId] ?? "offline"], users[otherId]?.title].filter(Boolean).join(" · ")
    : conversation.kind === "channel"
      ? conversation.description || `${conversation.memberIds.length} members`
      : `${conversation.memberIds.length} members`;

  return (
    <div className="relative flex min-w-0 flex-1">
      <section
        className="relative flex min-w-0 flex-1 flex-col"
        onDragOver={(e) => {
          if (!conversation.isMember || !e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          composerRef.current?.addFiles(Array.from(e.dataTransfer.files));
        }}
      >
        {dragging && (
          <div className="pointer-events-none absolute inset-2 z-30 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-primary/5 text-primary">
            <TbUpload className="size-8" />
            <p className="text-sm font-medium">{`Drop to share in ${title}`}</p>
          </div>
        )}

        <header className="flex items-center gap-3 border-b px-3 py-3 sm:px-4">
          <Button size="icon" variant="ghost" className="md:hidden" onClick={onBack} title="Back"><TbArrowLeft className="size-5" /></Button>
          <ConversationIcon conversation={conversation} meId={meId} />
          <button className="min-w-0 text-left" onClick={() => setShowDetails(true)}>
            <p className="flex items-center gap-1.5 truncate font-semibold">
              {conversation.kind === "channel" ? `# ${title}` : title}
              {conversation.muted && <TbBellOff className="size-3.5 text-muted-foreground" />}
            </p>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </button>
          <div className="ml-auto flex items-center gap-1">
            {conversation.isMember && (
              <>
                <Button size="icon" variant="ghost" title="Video call" onClick={() => void startCall(conversation.id, true, title)}>
                  <TbVideo className="size-5" />
                </Button>
                <Button size="icon" variant="ghost" title="Audio call" onClick={() => void startCall(conversation.id, false, title)}>
                  <TbPhone className="size-5" />
                </Button>
              </>
            )}
            <Button size="icon" variant="ghost" title="Search messages" onClick={onSearch}><TbSearch className="size-5" /></Button>
            <Button size="icon" variant={showDetails ? "secondary" : "ghost"} title="Details" onClick={() => setShowDetails((v) => !v)}>
              <TbInfoCircle className="size-5" />
            </Button>
          </div>
        </header>

        {runningCall && !inThisCall && conversation.isMember && (
          <div className="flex items-center gap-3 border-b bg-emerald-500/10 px-4 py-2 text-sm">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="min-w-0 flex-1 truncate">
              {`${runningCall.video ? "Video call" : "Call"} in progress · ${runningCall.participantIds.map((id) => firstName(users[id]?.name ?? runningCall.participantNames?.[id] ?? "Someone")).join(", ")}`}
            </span>
            <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => void startCall(conversation.id, runningCall.video, title)}>
              Join
            </Button>
          </div>
        )}

        <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 sm:px-4">
          {loadingOlder && <div className="flex justify-center py-3"><TbLoader2 className="size-4 animate-spin text-muted-foreground" /></div>}
          {page && !page.hasMore && page.loaded && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ConversationIcon conversation={conversation} meId={meId} />
              <p className="text-sm font-medium">{conversation.kind === "direct" ? `This is the start of your chat with ${title}` : `Welcome to ${conversation.kind === "channel" ? "#" : ""}${title}`}</p>
              {conversation.description && <p className="max-w-sm text-xs text-muted-foreground">{conversation.description}</p>}
            </div>
          )}
          {!page && !loadError && (
            <div className="flex h-full items-center justify-center"><TbLoader2 className="size-6 animate-spin text-muted-foreground" /></div>
          )}
          {loadError && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm">
              <p className="text-destructive">{loadError}</p>
              <Button size="sm" variant="outline" onClick={() => {
                setLoadError(null);
                teamChatApi.messages(conversation.id).then((r) => useTeamChat.getState().setPage(conversation.id, r.messages, r.hasMore, "replace")).catch((e) => setLoadError(e.message));
              }}>Retry</Button>
            </div>
          )}

          {items.map((m, i) => {
            const prev = items[i - 1];
            const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
            const showUnread = !!unreadFrom && m.authorId !== meId && !m.isSystem && m.createdAt > unreadFrom && (!prev || prev.createdAt <= unreadFrom);
            const grouped =
              !newDay && !showUnread && !!prev && !prev.isSystem && !m.isSystem && prev.authorId === m.authorId &&
              Date.parse(m.createdAt) - Date.parse(prev.createdAt) < GROUP_WINDOW_MS;
            return (
              <div key={m.clientId ?? m.id} id={`msg-${m.id}`} className={cn("rounded-lg transition-colors duration-700", highlight === m.id && "bg-amber-100/70 dark:bg-amber-500/15")}>
                {newDay && (
                  <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    {dayLabel(m.createdAt)}
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                {showUnread && (
                  <div className="my-3 flex items-center gap-3 text-xs font-medium text-rose-500">
                    <div className="h-px flex-1 bg-rose-400/60" />
                    New messages
                    <div className="h-px flex-1 bg-rose-400/60" />
                  </div>
                )}
                <MessageItem
                  message={m}
                  meId={meId}
                  grouped={grouped}
                  onOpenThread={(msg) => onOpenThread(msg.id)}
                  onEdit={setEditing}
                  onRetry={retry}
                />
                {seenId === m.id && <p className="mt-0.5 text-right text-[10px] text-muted-foreground">Seen</p>}
              </div>
            );
          })}
        </div>

        {!atBottom && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-32 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background px-3 py-1.5 text-xs shadow-md hover:bg-muted"
          >
            <TbArrowDown className="size-3.5" /> Latest
          </button>
        )}

        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
          <p className="h-5 px-1 text-xs italic text-muted-foreground">
            {typing.length === 1
              ? `${firstName(typing[0].name)} is typing…`
              : typing.length > 1
                ? `${typing.map((t) => firstName(t.name)).join(", ")} are typing…`
                : ""}
          </p>
          {conversation.isMember ? (
            <Composer
              ref={composerRef}
              conversationId={conversation.id}
              memberIds={conversation.memberIds}
              meId={meId}
              placeholder={`Message ${conversation.kind === "channel" ? "#" : ""}${title}`}
              editing={editing}
              onCancelEdit={() => setEditing(null)}
            />
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3 text-sm">
              <span className="text-muted-foreground">{`You're previewing #${title}.`}</span>
              <Button size="sm" onClick={join}>Join channel</Button>
            </div>
          )}
        </div>
      </section>

      {threadId ? (
        <ThreadPanel conversation={conversation} rootId={threadId} meId={meId} onClose={() => onOpenThread(null)} />
      ) : (
        showDetails && (
          <DetailsPanel
            conversation={conversation}
            meId={meId}
            onClose={() => setShowDetails(false)}
            onJumpTo={onJump}
            onOpenDirect={onOpenDirect}
          />
        )
      )}
    </div>
  );
}
