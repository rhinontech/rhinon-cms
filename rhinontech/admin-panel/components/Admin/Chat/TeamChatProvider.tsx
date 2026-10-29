"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePermissions } from "@/context/PermissionsContext";
import { acquireTeamChatSocket, releaseTeamChatSocket, teamChatApi } from "./teamChatApi";
import { selectUnreadTotal, useTeamChat } from "./store";
import { bindCallEvents, useCall } from "./calls";
import { CallOverlay } from "./CallOverlay";
import type { ChatMessage, Conversation, NotifyEvent, Presence, TypingEvent } from "./types";

/**
 * Keeps team chat live across the whole admin panel — not just the Chat page —
 * so the sidebar badge, message toasts and incoming calls work wherever the
 * user is. Mounted once per shell.
 */
export function TeamChatProvider() {
  const { has, ready: permsReady, userId, fullName } = usePermissions();
  const enabled = permsReady && has("chat:read");
  const router = useRouter();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1] || "";
  const meRef = useRef(userId);
  meRef.current = userId;
  const roleRef = useRef(roleSlug);
  roleRef.current = roleSlug;

  useEffect(() => {
    if (!enabled) return;
    const socket = acquireTeamChatSocket();
    if (!socket) return;
    const store = useTeamChat.getState;

    const load = async () => {
      try {
        const [directory, conversations] = await Promise.all([teamChatApi.directory(), teamChatApi.conversations()]);
        store().setDirectory(directory);
        store().setConversations(conversations);
        store().setReady(true);
      } catch (err) {
        store().setReady(false, (err as Error).message || "Couldn't load chat");
      }
    };
    // Initial load, and a refresh after any reconnect (events may have been missed).
    void load();
    const onReconnect = () => void load();
    socket.io.on("reconnect", onReconnect);

    const onMessage = (m: ChatMessage) => {
      store().receiveMessage(m, meRef.current);
      // Unknown chat (someone just added me / started a DM): fetch it.
      if (!store().conversations[m.conversationId]) {
        void teamChatApi.conversation(m.conversationId).then((c) => store().upsertConversation(c)).catch(() => {});
      }
    };
    const onUpdated = (m: ChatMessage) => store().updateMessage(m);
    const onConversation = (c: Conversation) => {
      const existing = store().conversations[c.id];
      // The server's unread counts are authoritative, except for the chat being read right now.
      store().upsertConversation(store().activeId === c.id && existing ? { ...c, unread: 0, mentionUnread: 0 } : c);
    };
    const onRemoved = ({ conversationId }: { conversationId: string }) => store().removeConversation(conversationId);
    const onRead = (d: { conversationId: string; userId: string; lastReadAt: string }) => {
      if (d.userId === meRef.current) store().patchConversation(d.conversationId, { unread: 0, mentionUnread: 0, lastReadAt: d.lastReadAt });
      window.dispatchEvent(new CustomEvent("team-chat:read", { detail: d }));
    };
    const onTyping = (t: TypingEvent) => store().addTyping(t);
    const onPresence = (d: { userId: string; presence: Presence }) => store().setPresence(d.userId, d.presence);
    const onSnapshot = (snap: Record<string, Presence>) => store().setPresenceSnapshot(snap);
    const onNotify = (n: NotifyEvent) => {
      const s = store();
      const viewing = s.activeId === n.conversationId && !document.hidden;
      if (viewing) return;
      const mentioned = !!meRef.current && n.mentionedIds.includes(meRef.current);
      // Do not disturb: only mentions get through.
      if (s.myStatus === "dnd" && !mentioned) return;
      const open = () => router.push(`/${roleRef.current}/chat?c=${n.conversationId}${n.parentId ? `&t=${n.parentId}` : ""}`);
      const direct = n.title === n.authorName;
      const title = mentioned ? (direct ? `${n.authorName} mentioned you` : `${n.authorName} mentioned you in ${n.title}`) : n.title;
      const body = direct ? n.preview : `${n.authorName}: ${n.preview}`;
      if (document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
        const note = new Notification(title, { body, tag: n.conversationId });
        note.onclick = () => {
          window.focus();
          open();
          note.close();
        };
      } else {
        toast(title, { description: body, action: { label: "Open", onClick: open } });
      }
    };
    const onAuthError = () => store().setReady(false, "Sign in again to use chat.");

    socket.on("message", onMessage);
    socket.on("message:updated", onUpdated);
    socket.on("conversation", onConversation);
    socket.on("conversation:removed", onRemoved);
    socket.on("read", onRead);
    socket.on("typing", onTyping);
    socket.on("presence", onPresence);
    socket.on("presence:snapshot", onSnapshot);
    socket.on("notify", onNotify);
    socket.on("connect_error", onAuthError);
    const unbindCalls = bindCallEvents();
    const prune = setInterval(() => store().pruneTyping(), 1000);

    return () => {
      socket.io.off("reconnect", onReconnect);
      socket.off("message", onMessage);
      socket.off("message:updated", onUpdated);
      socket.off("conversation", onConversation);
      socket.off("conversation:removed", onRemoved);
      socket.off("read", onRead);
      socket.off("typing", onTyping);
      socket.off("presence", onPresence);
      socket.off("presence:snapshot", onSnapshot);
      socket.off("notify", onNotify);
      socket.off("connect_error", onAuthError);
      unbindCalls();
      clearInterval(prune);
      releaseTeamChatSocket();
    };
  }, [enabled, router]);

  // Unread count in the tab title, like Teams' "(3) Chat".
  const unread = useTeamChat(selectUnreadTotal);
  useEffect(() => {
    if (!enabled) return;
    const strip = (t: string) => t.replace(/^\(\d+\)\s*/, "");
    const apply = () => {
      const base = strip(document.title);
      const next = unread > 0 ? `(${unread}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    // Next.js rewrites the title on navigation; re-apply after it.
    const observer = new MutationObserver(apply);
    const titleEl = document.querySelector("title");
    if (titleEl) observer.observe(titleEl, { childList: true });
    return () => observer.disconnect();
  }, [unread, enabled]);

  // A guest knocking on a meeting link while I'm not in that chat's call: tell me.
  useEffect(() => {
    if (!enabled) return;
    const onLobby = (e: Event) => {
      const { conversationId, guests } = (e as CustomEvent<{ conversationId: string; guests: { name: string }[] }>).detail;
      const inThatCall = useCall.getState().conversationId === conversationId && useCall.getState().phase === "active";
      if (inThatCall) return; // the in-call banner handles it
      const conv = useTeamChat.getState().conversations[conversationId];
      const where = conv?.name ? ` in ${conv.name}` : "";
      toast(`${guests.map((g) => g.name).join(", ")} ${guests.length > 1 ? "are" : "is"} waiting to join a call${where}`, {
        description: "Join the call to let them in.",
        action: { label: "Join call", onClick: () => router.push(`/${roleRef.current}/chat?c=${conversationId}`) },
      });
    };
    window.addEventListener("team-chat:lobby", onLobby);
    return () => window.removeEventListener("team-chat:lobby", onLobby);
  }, [enabled, router]);

  return enabled ? <CallOverlay selfId={userId} selfName={fullName} /> : null;
}
