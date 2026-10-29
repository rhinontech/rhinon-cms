"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TbBell,
  TbBellOff,
  TbDoorExit,
  TbEdit,
  TbFile,
  TbLoader2,
  TbMessage,
  TbPhone,
  TbPin,
  TbUserMinus,
  TbUserPlus,
  TbVideo,
  TbX,
  TbLink,
  TbLinkOff,
  TbCopy,
} from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { meetUrl, teamChatApi, teamChatSocket, type CallLink } from "./teamChatApi";
import { useTeamChat } from "./store";
import { MessageItem } from "./MessageItem";
import { Composer } from "./Composer";
import { AddMembersDialog } from "./dialogs";
import { startCall } from "./calls";
import { PRESENCE_LABEL, UserAvatar, conversationTitle, fileSize, firstName, otherMemberId, shortTime } from "./shared";
import type { ChatMessage, Conversation, SharedFile } from "./types";

function PanelShell({ title, onClose, children }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <aside className="absolute inset-0 z-20 flex flex-col bg-background lg:static lg:z-auto lg:w-80 lg:shrink-0 lg:border-l lg:bg-background/60">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="min-w-0 text-sm font-semibold">{title}</div>
        <Button size="icon" variant="ghost" onClick={onClose}><TbX className="size-4" /></Button>
      </div>
      {children}
    </aside>
  );
}

// --- thread ------------------------------------------------------------------

export function ThreadPanel({
  conversation,
  rootId,
  meId,
  onClose,
}: {
  conversation: Conversation;
  rootId: string;
  meId: string | null;
  onClose: () => void;
}) {
  const [root, setRoot] = useState<ChatMessage | null>(null);
  const [replies, setReplies] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const allTyping = useTeamChat((s) => s.typing);
  const typing = useMemo(() => allTyping.filter((t) => t.conversationId === conversation.id && t.parentId === rootId), [allTyping, conversation.id, rootId]);

  const load = useCallback(() => {
    teamChatApi
      .thread(conversation.id, rootId)
      .then((t) => {
        setRoot(t.root);
        setReplies(t.replies);
        setError(null);
      })
      .catch((e) => setError(e.message));
  }, [conversation.id, rootId]);

  useEffect(() => {
    setRoot(null);
    setReplies([]);
    load();
  }, [load]);

  // Live: replies arrive as "message" with parentId; edits/reactions as "message:updated".
  useEffect(() => {
    const socket = teamChatSocket();
    if (!socket) return;
    const onMessage = (m: ChatMessage) => {
      if (m.parentId === rootId) setReplies((r) => (r.some((x) => x.id === m.id) ? r : [...r, m]));
    };
    const onUpdated = (m: ChatMessage) => {
      if (m.id === rootId) setRoot(m);
      else if (m.parentId === rootId) setReplies((r) => r.map((x) => (x.id === m.id ? m : x)));
    };
    socket.on("message", onMessage);
    socket.on("message:updated", onUpdated);
    return () => {
      socket.off("message", onMessage);
      socket.off("message:updated", onUpdated);
    };
  }, [rootId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [replies.length]);

  return (
    <PanelShell title="Thread" onClose={onClose}>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {error && <p className="py-8 text-center text-sm text-destructive">{error}</p>}
        {!root && !error && (
          <div className="flex justify-center py-10"><TbLoader2 className="size-5 animate-spin text-muted-foreground" /></div>
        )}
        {root && (
          <>
            <MessageItem message={root} meId={meId} grouped={false} inThread onEdit={setEditing} />
            <div className="my-3 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              {replies.length === 1 ? "1 reply" : `${replies.length} replies`}
              <div className="h-px flex-1 bg-border" />
            </div>
            {replies.map((m, i) => (
              <MessageItem
                key={m.id}
                message={m}
                meId={meId}
                inThread
                onEdit={setEditing}
                grouped={i > 0 && replies[i - 1].authorId === m.authorId && Date.parse(m.createdAt) - Date.parse(replies[i - 1].createdAt) < 300_000}
              />
            ))}
          </>
        )}
      </div>
      <div className="px-3 pb-3">
        <p className="h-5 px-1 text-xs italic text-muted-foreground">
          {typing.length ? `${typing.map((t) => firstName(t.name)).join(", ")} ${typing.length > 1 ? "are" : "is"} typing…` : ""}
        </p>
        <Composer
          conversationId={conversation.id}
          memberIds={conversation.memberIds}
          meId={meId}
          parentId={rootId}
          placeholder="Reply in thread"
          editing={editing}
          onCancelEdit={() => setEditing(null)}
          disabled={!conversation.isMember}
        />
      </div>
    </PanelShell>
  );
}

// --- meeting links -----------------------------------------------------------

const EXPIRY_OPTIONS = [
  { hours: 24, label: "24 hours" },
  { hours: 24 * 7, label: "7 days" },
  { hours: 24 * 30, label: "30 days" },
  { hours: 0, label: "Never" },
];

/** Shareable links that let people without an account join this chat's calls as guests. */
function MeetingLinks({ conversationId }: { conversationId: string }) {
  const confirm = useConfirm();
  const [links, setLinks] = useState<CallLink[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [expiry, setExpiry] = useState(24 * 7);
  const [lobby, setLobby] = useState(true);

  useEffect(() => {
    setLinks(null);
    teamChatApi.callLinks(conversationId).then(setLinks).catch(() => setLinks([]));
  }, [conversationId]);

  const copy = (token: string) =>
    navigator.clipboard.writeText(meetUrl(token)).then(() => toast.success("Link copied"), () => toast.error("Couldn't copy"));

  const create = async () => {
    setCreating(true);
    try {
      const link = await teamChatApi.createCallLink(conversationId, { expiresInHours: expiry, requireApproval: lobby });
      setLinks((l) => [link, ...(l ?? [])]);
      await copy(link.token);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (link: CallLink) => {
    const ok = await confirm({ title: "Turn off this link?", description: "Anyone who has it won't be able to join any more.", confirmLabel: "Turn off", destructive: true });
    if (!ok) return;
    try {
      await teamChatApi.revokeCallLink(conversationId, link.id);
      setLinks((l) => (l ?? []).filter((x) => x.id !== link.id));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <section>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meeting links</p>
      <p className="mb-2 text-xs text-muted-foreground">Anyone with a link can join this chat&apos;s calls from a browser, without an account. They can&apos;t see the chat.</p>
      <div className="space-y-2 rounded-lg border p-2.5">
        <div className="flex gap-2">
          <select value={expiry} onChange={(e) => setExpiry(Number(e.target.value))} className="h-8 flex-1 rounded-md border bg-background px-2 text-xs" aria-label="Link expires after">
            {EXPIRY_OPTIONS.map((o) => (
              <option key={o.hours} value={o.hours}>{`Expires: ${o.label}`}</option>
            ))}
          </select>
          <Button size="sm" onClick={create} disabled={creating}>
            {creating ? <TbLoader2 className="animate-spin" /> : <TbLink />} Create
          </Button>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={lobby} onChange={(e) => setLobby(e.target.checked)} />
          Guests wait in a lobby until someone lets them in
        </label>
      </div>
      <div className="mt-2 space-y-1.5">
        {links === null && <TbLoader2 className="mx-auto size-4 animate-spin text-muted-foreground" />}
        {links?.map((l) => (
          <div key={l.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-xs">{`/meet/${l.token}`}</p>
              <p className="text-[11px] text-muted-foreground">
                {`${l.requireApproval ? "Lobby on" : "Lobby off"} · ${l.expiresAt ? `expires ${shortTime(l.expiresAt)}` : "never expires"}`}
              </p>
            </div>
            <button onClick={() => copy(l.token)} title="Copy link" className="rounded p-1 hover:bg-muted"><TbCopy className="size-4" /></button>
            <button onClick={() => revoke(l)} title="Turn off link" className="rounded p-1 text-destructive hover:bg-destructive/10"><TbLinkOff className="size-4" /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- details -----------------------------------------------------------------

type Tab = "about" | "files" | "pinned";

export function DetailsPanel({
  conversation,
  meId,
  onClose,
  onJumpTo,
  onOpenDirect,
}: {
  conversation: Conversation;
  meId: string | null;
  onClose: () => void;
  onJumpTo: (m: ChatMessage) => void;
  onOpenDirect: (userId: string) => void;
}) {
  const users = useTeamChat((s) => s.users);
  const presence = useTeamChat((s) => s.presence);
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("about");
  const [files, setFiles] = useState<SharedFile[] | null>(null);
  const [pinned, setPinned] = useState<ChatMessage[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(conversation.name ?? "");
  const [description, setDescription] = useState(conversation.description ?? "");

  const isOwner = !!meId && conversation.ownerIds.includes(meId);
  const direct = conversation.kind === "direct" ? users[otherMemberId(conversation, meId)] : null;

  useEffect(() => {
    setTab("about");
    setRenaming(false);
  }, [conversation.id]);

  useEffect(() => {
    setName(conversation.name ?? "");
    setDescription(conversation.description ?? "");
  }, [conversation.name, conversation.description]);

  useEffect(() => {
    if (tab === "files") {
      setFiles(null);
      teamChatApi.files(conversation.id).then(setFiles).catch((e) => toast.error(e.message));
    }
    if (tab === "pinned") {
      setPinned(null);
      teamChatApi.pinned(conversation.id).then(setPinned).catch((e) => toast.error(e.message));
    }
  }, [tab, conversation.id, conversation.lastMessageAt]);

  const setPref = (input: { muted?: boolean; pinned?: boolean }) =>
    teamChatApi
      .preferences(conversation.id, input)
      .then((c) => useTeamChat.getState().upsertConversation(c))
      .catch((e) => toast.error(e.message));

  const saveRename = async () => {
    try {
      useTeamChat.getState().upsertConversation(await teamChatApi.update(conversation.id, { name, description }));
      setRenaming(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const leave = async () => {
    const ok = await confirm({
      title: `Leave ${conversationTitle(conversation, users, meId)}?`,
      description: conversation.kind === "channel" && !conversation.isPrivate ? "You can rejoin from Browse channels." : "Someone will have to add you back.",
      confirmLabel: "Leave",
      destructive: true,
    });
    if (!ok || !meId) return;
    try {
      await teamChatApi.removeMember(conversation.id, meId);
      useTeamChat.getState().removeConversation(conversation.id);
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const removeMember = async (userId: string) => {
    const ok = await confirm({ title: `Remove ${users[userId]?.name ?? "this person"}?`, confirmLabel: "Remove", destructive: true });
    if (ok) teamChatApi.removeMember(conversation.id, userId).catch((e) => toast.error(e.message));
  };

  return (
    <PanelShell title="Details" onClose={onClose}>
      <div className="flex gap-1 border-b px-3 py-2">
        {(["about", "files", "pinned"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-full px-3 py-1 text-xs font-medium capitalize", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        {tab === "about" && (
          <>
            {direct ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <UserAvatar userId={direct.id} size="lg" />
                <div>
                  <p className="font-semibold">{direct.name}</p>
                  <p className="text-xs text-muted-foreground">{[direct.title, direct.department].filter(Boolean).join(" · ")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{PRESENCE_LABEL[presence[direct.id] ?? "offline"]}</p>
                  {direct.email && <p className="mt-1 text-xs text-muted-foreground">{direct.email}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void startCall(conversation.id, false, direct.name)}><TbPhone /> Call</Button>
                  <Button size="sm" variant="outline" onClick={() => void startCall(conversation.id, true, direct.name)}><TbVideo /> Video</Button>
                </div>
              </div>
            ) : renaming ? (
              <div className="space-y-2">
                <Input value={name} onChange={(e) => setName(e.target.value.replace(/^#/, ""))} placeholder="Name" maxLength={80} />
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" maxLength={500} />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setRenaming(false)}>Cancel</Button>
                  <Button size="sm" onClick={saveRename}>Save</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{conversationTitle(conversation, users, meId)}</p>
                  {conversation.isMember && (
                    <button onClick={() => setRenaming(true)} className="text-muted-foreground hover:text-foreground" title="Rename"><TbEdit className="size-4" /></button>
                  )}
                </div>
                {conversation.description && <p className="text-sm text-muted-foreground">{conversation.description}</p>}
                <p className="text-xs text-muted-foreground">
                  {conversation.kind === "channel" ? (conversation.isPrivate ? "Private channel" : "Public channel") : "Group chat"}
                  {conversation.projectId ? " · linked to a project" : ""}
                </p>
              </div>
            )}

            {conversation.isMember && (
              <div className="space-y-1">
                <button onClick={() => setPref({ muted: !conversation.muted })} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                  {conversation.muted ? <TbBell className="size-4" /> : <TbBellOff className="size-4" />}
                  {conversation.muted ? "Unmute notifications" : "Mute notifications"}
                </button>
                <button onClick={() => setPref({ pinned: !conversation.pinned })} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                  <TbPin className="size-4" /> {conversation.pinned ? "Unpin from top" : "Pin to top"}
                </button>
                {conversation.kind !== "direct" && (
                  <button onClick={leave} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10">
                    <TbDoorExit className="size-4" /> Leave
                  </button>
                )}
              </div>
            )}

            {conversation.kind !== "direct" && (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{`Members · ${conversation.memberIds.length}`}</p>
                  {conversation.isMember && (
                    <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <TbUserPlus className="size-3.5" /> Add
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {[...conversation.memberIds]
                    .sort((a, b) => (users[a]?.name ?? "").localeCompare(users[b]?.name ?? ""))
                    .map((id) => (
                      <div key={id} className="group flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-muted">
                        <UserAvatar userId={id} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">
                            {id === meId ? `${users[id]?.name ?? "You"} (you)` : users[id]?.name ?? "Former member"}
                            {conversation.ownerIds.includes(id) && <span className="ml-1.5 text-[10px] text-muted-foreground">Owner</span>}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{users[id]?.title ?? ""}</p>
                        </div>
                        {id !== meId && (
                          <div className="hidden gap-0.5 group-hover:flex">
                            <button onClick={() => onOpenDirect(id)} className="rounded p-1 hover:bg-background" title="Message"><TbMessage className="size-4" /></button>
                            {isOwner && (
                              <button onClick={() => removeMember(id)} className="rounded p-1 text-destructive hover:bg-background" title="Remove"><TbUserMinus className="size-4" /></button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            )}

            {conversation.isMember && <MeetingLinks conversationId={conversation.id} />}
          </>
        )}

        {tab === "files" && (
          <section className="space-y-1.5">
            {!files && <div className="flex justify-center py-8"><TbLoader2 className="size-5 animate-spin text-muted-foreground" /></div>}
            {files?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No files shared yet.</p>}
            {files?.map((f) => (
              <a key={f.key} href={f.url ?? undefined} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-muted">
                {f.mimeType.startsWith("image/") && f.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt="" className="size-9 rounded object-cover" />
                ) : (
                  <TbFile className="size-9 shrink-0 text-blue-600" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{`${fileSize(f.size)} · ${users[f.authorId]?.name ?? "Unknown"} · ${shortTime(f.createdAt)}`}</p>
                </div>
              </a>
            ))}
          </section>
        )}

        {tab === "pinned" && (
          <section className="space-y-2">
            {!pinned && <div className="flex justify-center py-8"><TbLoader2 className="size-5 animate-spin text-muted-foreground" /></div>}
            {pinned?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nothing pinned. Use a message&apos;s ⋯ menu to pin it.</p>}
            {pinned?.map((m) => (
              <button key={m.id} onClick={() => onJumpTo(m)} className="w-full rounded-lg border p-2.5 text-left hover:bg-muted">
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <UserAvatar userId={m.authorId} size="xs" showPresence={false} />
                  <span className="font-medium">{users[m.authorId]?.name ?? "Unknown"}</span>
                  <span className="ml-auto text-muted-foreground">{shortTime(m.createdAt)}</span>
                </div>
                <p className="line-clamp-3 text-sm">{m.body || m.attachments.map((a) => a.name).join(", ")}</p>
              </button>
            ))}
          </section>
        )}
      </div>
      {conversation.kind !== "direct" && <AddMembersDialog open={adding} onOpenChange={setAdding} conversation={conversation} />}
    </PanelShell>
  );
}
