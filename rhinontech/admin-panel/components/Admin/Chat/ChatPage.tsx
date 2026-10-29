"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  TbAt,
  TbBell,
  TbBellOff,
  TbHash,
  TbLoader2,
  TbMessages,
  TbPaperclip,
  TbPin,
  TbPlus,
  TbSearch,
  TbUsers,
  TbUser,
} from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/context/PermissionsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { teamChatApi, teamChatSocket } from "./teamChatApi";
import { useTeamChat } from "./store";
import { ConversationView } from "./ConversationView";
import { BrowseChannelsDialog, NewChatDialog, SearchDialog } from "./dialogs";
import { ConversationIcon, PRESENCE_COLOR, PRESENCE_LABEL, UserAvatar, conversationTitle, firstName, shortTime } from "./shared";
import type { ChatMessage, Conversation, ManualStatus } from "./types";

type Filter = "all" | "unread" | "channels" | "chats";

const STATUSES: { value: ManualStatus; presence: keyof typeof PRESENCE_COLOR }[] = [
  { value: "available", presence: "online" },
  { value: "busy", presence: "busy" },
  { value: "dnd", presence: "dnd" },
  { value: "away", presence: "away" },
];

function StatusPicker({ meId }: { meId: string | null }) {
  const status = useTeamChat((s) => s.myStatus);
  const current = STATUSES.find((s) => s.value === status) ?? STATUSES[0];
  const set = (value: ManualStatus) => {
    useTeamChat.getState().setMyStatus(value);
    teamChatSocket()?.emit("status", { status: value });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full" title={`Status: ${PRESENCE_LABEL[current.presence]}`}>
          {meId ? <UserAvatar userId={meId} size="sm" /> : <span className={cn("block size-3 rounded-full", PRESENCE_COLOR[current.presence])} />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Set status</DropdownMenuLabel>
        {STATUSES.map((s) => (
          <DropdownMenuItem key={s.value} onClick={() => set(s.value)}>
            <span className={cn("size-2.5 rounded-full", PRESENCE_COLOR[s.presence])} />
            {PRESENCE_LABEL[s.presence]}
            {s.value === "dnd" && <span className="ml-auto text-[10px] text-muted-foreground">mentions only</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  useEffect(() => {
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
  }, []);
  if (permission !== "default") return null;
  return (
    <button
      onClick={() => Notification.requestPermission().then(setPermission)}
      className="mx-4 mb-2 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-left text-xs text-primary hover:bg-primary/15"
    >
      <TbBell className="size-4 shrink-0" /> Turn on desktop notifications for new messages and calls
    </button>
  );
}

function ConversationList({
  activeId,
  meId,
  onSelect,
  onNew,
  onBrowse,
  onSearch,
}: {
  activeId: string | null;
  meId: string | null;
  onSelect: (id: string) => void;
  onNew: (kind: "direct" | "group" | "channel") => void;
  onBrowse: () => void;
  onSearch: () => void;
}) {
  const conversations = useTeamChat((s) => s.conversations);
  const users = useTeamChat((s) => s.users);
  const ready = useTeamChat((s) => s.ready);
  const error = useTeamChat((s) => s.error);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(conversations)
      .filter((c) =>
        filter === "unread" ? c.unread > 0 || c.mentionUnread > 0 : filter === "channels" ? c.kind === "channel" : filter === "chats" ? c.kind !== "channel" : true
      )
      .filter((c) => !q || conversationTitle(c, users, meId).toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt);
      });
  }, [conversations, users, filter, query, meId]);

  // People you haven't chatted with yet, surfaced while searching.
  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const withDm = new Set(Object.values(conversations).filter((c) => c.kind === "direct").flatMap((c) => c.memberIds));
    return Object.values(users)
      .filter((u) => u.id !== meId && !withDm.has(u.id) && u.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [conversations, users, query, meId]);

  const openPerson = async (userId: string) => {
    try {
      const c = await teamChatApi.openDirect(userId);
      useTeamChat.getState().upsertConversation(c);
      setQuery("");
      onSelect(c.id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const preview = (c: Conversation) => {
    const m = c.lastMessage;
    if (!m) return c.kind === "channel" ? c.description || "No messages yet" : "No messages yet";
    if (m.isSystem) return m.body;
    if (m.deleted) return "Message deleted";
    const who = m.authorId === meId ? "You: " : c.kind !== "direct" ? `${firstName(users[m.authorId]?.name ?? "Someone")}: ` : "";
    return who + (m.body || (m.attachments.length ? `📎 ${m.attachments[0].name}` : ""));
  };

  return (
    <aside className="flex h-full w-full flex-col border-r md:w-80 md:shrink-0">
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <StatusPicker meId={meId} />
        <h1 className="text-xl font-bold tracking-tight">Chat</h1>
        <div className="ml-auto flex gap-0.5">
          <Button size="icon" variant="ghost" title="Search messages" onClick={onSearch}><TbSearch className="size-5" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" title="New chat"><TbPlus className="size-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onNew("direct")}><TbUser /> New chat</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNew("group")}><TbUsers /> New group</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNew("channel")}><TbHash /> New channel</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onBrowse}><TbSearch /> Browse channels</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="px-4 pb-2">
        <div className="relative">
          <TbSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a chat or person" className="pl-8" />
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto px-4 pb-2">
        {(["all", "unread", "chats", "channels"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition",
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <NotificationPrompt />

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {!ready && !error && (
          <div className="space-y-2 px-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="size-9 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-3/4 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
        {error && <p className="px-3 py-10 text-center text-sm text-destructive">{error}</p>}
        {ready && visible.length === 0 && people.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <TbMessages className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {query ? "No chats match." : filter === "unread" ? "You're all caught up." : "No chats yet. Start one with a teammate."}
            </p>
            {!query && filter === "all" && <Button size="sm" onClick={() => onNew("direct")}><TbPlus /> New chat</Button>}
          </div>
        )}
        {visible.map((c) => {
          const name = conversationTitle(c, users, meId);
          const unread = c.unread > 0 || c.mentionUnread > 0;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition", c.id === activeId ? "bg-primary/10" : "hover:bg-muted")}
            >
              <ConversationIcon conversation={c} meId={meId} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{name}</p>
                  {c.pinned && <TbPin className="size-3.5 shrink-0 text-muted-foreground" />}
                  {c.muted && <TbBellOff className="size-3.5 shrink-0 text-muted-foreground" />}
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{shortTime(c.lastMessageAt ?? c.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className={cn("truncate text-xs", unread ? "text-foreground" : "text-muted-foreground")}>
                    {c.lastMessage?.attachments.length && !c.lastMessage.body ? <TbPaperclip className="mr-0.5 inline size-3" /> : null}
                    {preview(c)}
                  </p>
                  {c.mentionUnread > 0 && <TbAt className="ml-auto size-4 shrink-0 text-amber-500" title="You were mentioned" />}
                  {c.unread > 0 && (
                    <span
                      className={cn(
                        "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                        c.mentionUnread === 0 && "ml-auto",
                        c.muted ? "bg-muted-foreground/30 text-foreground" : "bg-primary text-primary-foreground",
                      )}
                    >
                      {c.unread > 99 ? "99+" : c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        {people.length > 0 && (
          <>
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">People</p>
            {people.map((u) => (
              <button key={u.id} onClick={() => openPerson(u.id)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-muted">
                <UserAvatar userId={u.id} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.title ?? "Start a chat"}</p>
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}

export function ChatPage() {
  const { userId: meId, has, ready: permsReady } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeId = params.get("c");
  const threadId = params.get("t");
  const jumpTo = params.get("m");
  const conversation = useTeamChat((s) => (activeId ? s.conversations[activeId] : undefined));
  const ready = useTeamChat((s) => s.ready);
  const [newKind, setNewKind] = useState<"direct" | "group" | "channel" | null>(null);
  const [browsing, setBrowsing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [preview, setPreview] = useState<Conversation | null>(null);

  const navigate = useCallback(
    (next: { c?: string | null; t?: string | null; m?: string | null }) => {
      const q = new URLSearchParams();
      if (next.c) q.set("c", next.c);
      if (next.t) q.set("t", next.t);
      if (next.m) q.set("m", next.m);
      router.replace(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    useTeamChat.getState().setActive(activeId);
    return () => useTeamChat.getState().setActive(null);
  }, [activeId]);

  // A link to a chat that isn't in my list — a public channel I haven't joined — opens as a preview.
  useEffect(() => {
    if (!ready || !activeId || conversation) {
      setPreview(null);
      return;
    }
    teamChatApi
      .conversation(activeId)
      .then((c) => (c.isMember ? useTeamChat.getState().upsertConversation(c) : setPreview(c)))
      .catch(() => {
        toast.error("That chat isn't available");
        navigate({});
      });
  }, [ready, activeId, conversation, navigate]);

  // Desktop opens the most recent chat by default.
  useEffect(() => {
    if (!ready || activeId || typeof window === "undefined" || window.innerWidth < 768) return;
    const latest = Object.values(useTeamChat.getState().conversations).sort((a, b) =>
      (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt)
    )[0];
    if (latest) navigate({ c: latest.id });
  }, [ready, activeId, navigate]);

  const shown = conversation ?? (preview?.id === activeId ? preview : undefined);

  const openDirect = async (userId: string) => {
    try {
      const c = await teamChatApi.openDirect(userId);
      useTeamChat.getState().upsertConversation(c);
      navigate({ c: c.id });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const jump = (m: ChatMessage) => navigate({ c: m.conversationId, t: m.parentId, m: m.parentId ?? m.id });

  if (permsReady && !has("chat:read")) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        You don&apos;t have access to team chat. Ask an admin to grant the Chat permission to your role.
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden rounded-xl border bg-muted/30">
      <div className={cn("h-full w-full md:w-auto", activeId ? "hidden md:block" : "block")}>
        <ConversationList
          activeId={activeId}
          meId={meId}
          onSelect={(id) => navigate({ c: id })}
          onNew={setNewKind}
          onBrowse={() => setBrowsing(true)}
          onSearch={() => setSearching(true)}
        />
      </div>
      <div className={cn("min-w-0 flex-1", activeId ? "flex" : "hidden md:flex")}>
        {shown ? (
          <ConversationView
            key={shown.id}
            conversation={shown}
            meId={meId}
            threadId={threadId}
            jumpTo={jumpTo}
            onOpenThread={(t) => navigate({ c: shown.id, t })}
            onBack={() => navigate({})}
            onSearch={() => setSearching(true)}
            onOpenDirect={openDirect}
            onJump={jump}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            {activeId ? (
              <TbLoader2 className="size-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><TbMessages className="size-7" /></div>
                <p className="font-semibold">Pick a chat or start a new one</p>
                <p className="max-w-xs text-sm text-muted-foreground">Message a teammate, start a group, or create a channel for your team or project.</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setNewKind("direct")}><TbPlus /> New chat</Button>
                  <Button size="sm" variant="outline" onClick={() => setBrowsing(true)}><TbHash /> Browse channels</Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <NewChatDialog
        open={newKind !== null}
        onOpenChange={(o) => !o && setNewKind(null)}
        meId={meId}
        initialKind={newKind ?? "direct"}
        onCreated={(c) => navigate({ c: c.id })}
      />
      <BrowseChannelsDialog open={browsing} onOpenChange={setBrowsing} onJoined={(c) => navigate({ c: c.id })} />
      <SearchDialog open={searching} onOpenChange={setSearching} meId={meId} onPick={jump} />
    </div>
  );
}
