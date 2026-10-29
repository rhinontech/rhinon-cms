import { create } from "zustand";
import type { ChatMessage, ChatUser, Conversation, ManualStatus, Presence, TypingEvent } from "./types";

/**
 * Team chat client state. Module-level (Zustand) so it outlives the shell
 * remounting between modules; the provider fills it from REST + socket events.
 */

interface MessagePage {
  items: ChatMessage[];
  hasMore: boolean;
  loaded: boolean;
}

interface TypingEntry extends TypingEvent {
  until: number;
}

interface TeamChatState {
  ready: boolean;
  error: string | null;
  users: Record<string, ChatUser>;
  presence: Record<string, Presence>;
  myStatus: ManualStatus;
  conversations: Record<string, Conversation>;
  messages: Record<string, MessagePage>;
  typing: TypingEntry[];
  /** The chat currently on screen — notifications skip it. */
  activeId: string | null;

  setDirectory: (users: ChatUser[]) => void;
  setPresence: (userId: string, presence: Presence) => void;
  setPresenceSnapshot: (snapshot: Record<string, Presence>) => void;
  setMyStatus: (s: ManualStatus) => void;
  setConversations: (list: Conversation[]) => void;
  upsertConversation: (c: Conversation) => void;
  removeConversation: (id: string) => void;
  patchConversation: (id: string, patch: Partial<Conversation>) => void;
  setPage: (conversationId: string, items: ChatMessage[], hasMore: boolean, mode: "replace" | "prepend") => void;
  receiveMessage: (m: ChatMessage, meId: string | null) => void;
  updateMessage: (m: ChatMessage) => void;
  addPending: (m: ChatMessage) => void;
  failPending: (conversationId: string, clientId: string) => void;
  dropPending: (conversationId: string, clientId: string) => void;
  addTyping: (t: TypingEvent) => void;
  pruneTyping: () => void;
  setActive: (id: string | null) => void;
  setReady: (ready: boolean, error?: string | null) => void;
}

const sortByTime = (a: ChatMessage, b: ChatMessage) => a.createdAt.localeCompare(b.createdAt);

export const useTeamChat = create<TeamChatState>((set) => ({
  ready: false,
  error: null,
  users: {},
  presence: {},
  myStatus: "available",
  conversations: {},
  messages: {},
  typing: [],
  activeId: null,

  setDirectory: (users) =>
    set((s) => ({
      users: Object.fromEntries(users.map((u) => [u.id, u])),
      presence: { ...Object.fromEntries(users.map((u) => [u.id, u.presence])), ...s.presence },
    })),
  setPresence: (userId, presence) => set((s) => ({ presence: { ...s.presence, [userId]: presence } })),
  setPresenceSnapshot: (snapshot) => set((s) => ({ presence: { ...s.presence, ...snapshot } })),
  setMyStatus: (myStatus) => set({ myStatus }),
  setConversations: (list) => set({ conversations: Object.fromEntries(list.map((c) => [c.id, c])) }),
  upsertConversation: (c) => set((s) => ({ conversations: { ...s.conversations, [c.id]: c } })),
  removeConversation: (id) =>
    set((s) => {
      const conversations = { ...s.conversations };
      delete conversations[id];
      return { conversations, activeId: s.activeId === id ? null : s.activeId };
    }),
  patchConversation: (id, patch) =>
    set((s) => (s.conversations[id] ? { conversations: { ...s.conversations, [id]: { ...s.conversations[id], ...patch } } } : {})),

  setPage: (conversationId, items, hasMore, mode) =>
    set((s) => {
      const prev = s.messages[conversationId];
      const merged = mode === "prepend" && prev ? [...items, ...prev.items] : items;
      const unique = Array.from(new Map(merged.map((m) => [m.id, m])).values()).sort(sortByTime);
      return { messages: { ...s.messages, [conversationId]: { items: unique, hasMore, loaded: true } } };
    }),

  receiveMessage: (m, meId) =>
    set((s) => {
      const conv = s.conversations[m.conversationId];
      let conversations = s.conversations;
      // Top-level messages bump the chat; thread replies only touch their root.
      if (conv && !m.parentId) {
        const viewing = s.activeId === m.conversationId && typeof document !== "undefined" && !document.hidden;
        const fromOther = m.authorId !== meId && !m.isSystem;
        conversations = {
          ...s.conversations,
          [conv.id]: {
            ...conv,
            lastMessage: m,
            lastMessageAt: m.createdAt,
            unread: fromOther && !viewing ? conv.unread + 1 : conv.unread,
            mentionUnread: fromOther && !viewing && meId && m.mentions.includes(meId) ? conv.mentionUnread + 1 : conv.mentionUnread,
          },
        };
      }
      const page = s.messages[m.conversationId];
      if (!page || m.parentId) return { conversations };
      // Replace the optimistic copy if this is our own echo.
      const items = page.items.filter((x) => x.id !== m.id && !(m.clientId && x.clientId === m.clientId));
      return {
        conversations,
        messages: { ...s.messages, [m.conversationId]: { ...page, items: [...items, { ...m, pending: undefined }].sort(sortByTime) } },
      };
    }),

  updateMessage: (m) =>
    set((s) => {
      const page = s.messages[m.conversationId];
      const conv = s.conversations[m.conversationId];
      const conversations =
        conv?.lastMessage?.id === m.id ? { ...s.conversations, [conv.id]: { ...conv, lastMessage: m } } : s.conversations;
      if (!page) return { conversations };
      return {
        conversations,
        messages: { ...s.messages, [m.conversationId]: { ...page, items: page.items.map((x) => (x.id === m.id ? m : x)) } },
      };
    }),

  addPending: (m) =>
    set((s) => {
      const page = s.messages[m.conversationId] ?? { items: [], hasMore: false, loaded: true };
      return { messages: { ...s.messages, [m.conversationId]: { ...page, items: [...page.items, m] } } };
    }),
  failPending: (conversationId, clientId) =>
    set((s) => {
      const page = s.messages[conversationId];
      if (!page) return {};
      return {
        messages: {
          ...s.messages,
          [conversationId]: { ...page, items: page.items.map((x) => (x.clientId === clientId && x.pending ? { ...x, pending: "failed" as const } : x)) },
        },
      };
    }),
  dropPending: (conversationId, clientId) =>
    set((s) => {
      const page = s.messages[conversationId];
      if (!page) return {};
      return { messages: { ...s.messages, [conversationId]: { ...page, items: page.items.filter((x) => !(x.clientId === clientId && x.pending)) } } };
    }),

  addTyping: (t) =>
    set((s) => ({
      typing: [
        ...s.typing.filter((x) => !(x.userId === t.userId && x.conversationId === t.conversationId && x.parentId === t.parentId)),
        { ...t, until: Date.now() + 4000 },
      ],
    })),
  pruneTyping: () => set((s) => (s.typing.some((t) => t.until < Date.now()) ? { typing: s.typing.filter((t) => t.until >= Date.now()) } : {})),
  setActive: (activeId) => set({ activeId }),
  setReady: (ready, error = null) => set({ ready, error }),
}));

/** Sidebar badge: unread across unmuted chats. */
export const selectUnreadTotal = (s: TeamChatState) =>
  Object.values(s.conversations).reduce((n, c) => n + (c.muted ? c.mentionUnread : c.unread), 0);
