import Cookies from "js-cookie";
import { io, type Socket } from "socket.io-client";
import { API_URL, apiFetch, apiUpload } from "@/lib/api";
import type { Attachment, ChatMessage, ChatUser, Conversation, SharedFile } from "./types";

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

export const teamChatApi = {
  directory: () => apiFetch<ChatUser[]>("/team-chat/directory"),
  unread: () => apiFetch<{ total: number }>("/team-chat/unread"),
  search: (q: string) => apiFetch<ChatMessage[]>(`/team-chat/search?q=${encodeURIComponent(q)}`),
  iceServers: () => apiFetch<{ iceServers: RTCIceServer[] }>("/team-chat/ice-servers"),

  conversations: () => apiFetch<Conversation[]>("/team-chat/conversations"),
  conversation: (id: string) => apiFetch<Conversation>(`/team-chat/conversations/${id}`),
  browseChannels: () => apiFetch<Conversation[]>("/team-chat/channels/browse"),
  openDirect: (userId: string) => apiFetch<Conversation>("/team-chat/conversations/direct", { method: "POST", ...json({ userId }) }),
  create: (input: { kind: "group" | "channel"; name?: string; description?: string; isPrivate?: boolean; memberIds: string[]; projectId?: string | null }) =>
    apiFetch<Conversation>("/team-chat/conversations", { method: "POST", ...json(input) }),
  update: (id: string, input: { name?: string; description?: string }) =>
    apiFetch<Conversation>(`/team-chat/conversations/${id}`, { method: "PATCH", ...json(input) }),
  addMembers: (id: string, userIds: string[]) =>
    apiFetch<Conversation>(`/team-chat/conversations/${id}/members`, { method: "POST", ...json({ userIds }) }),
  removeMember: (id: string, userId: string) => apiFetch(`/team-chat/conversations/${id}/members/${userId}`, { method: "DELETE" }),
  join: (id: string) => apiFetch<Conversation>(`/team-chat/conversations/${id}/join`, { method: "POST" }),
  preferences: (id: string, input: { muted?: boolean; pinned?: boolean }) =>
    apiFetch<Conversation>(`/team-chat/conversations/${id}/preferences`, { method: "PATCH", ...json(input) }),
  markRead: (id: string) => apiFetch(`/team-chat/conversations/${id}/read`, { method: "POST" }),
  readStates: (id: string) => apiFetch<{ userId: string; lastReadAt: string | null }[]>(`/team-chat/conversations/${id}/read-states`),

  messages: (id: string, before?: string) =>
    apiFetch<{ messages: ChatMessage[]; hasMore: boolean }>(
      `/team-chat/conversations/${id}/messages${before ? `?before=${encodeURIComponent(before)}` : ""}`
    ),
  send: (id: string, input: { body: string; attachments?: Attachment[]; parentId?: string | null; mentions?: string[]; clientId?: string }) =>
    apiFetch<ChatMessage>(`/team-chat/conversations/${id}/messages`, { method: "POST", ...json(input) }),
  thread: (id: string, messageId: string) =>
    apiFetch<{ root: ChatMessage; replies: ChatMessage[] }>(`/team-chat/conversations/${id}/threads/${messageId}`),
  pinned: (id: string) => apiFetch<ChatMessage[]>(`/team-chat/conversations/${id}/pinned`),
  files: (id: string) => apiFetch<SharedFile[]>(`/team-chat/conversations/${id}/files`),

  edit: (messageId: string, body: string) => apiFetch<ChatMessage>(`/team-chat/messages/${messageId}`, { method: "PATCH", ...json({ body }) }),
  remove: (messageId: string) => apiFetch(`/team-chat/messages/${messageId}`, { method: "DELETE" }),
  react: (messageId: string, emoji: string) =>
    apiFetch<ChatMessage>(`/team-chat/messages/${messageId}/reactions`, { method: "POST", ...json({ emoji }) }),
  pin: (messageId: string) => apiFetch<ChatMessage>(`/team-chat/messages/${messageId}/pin`, { method: "POST" }),

  upload: (file: File) => apiUpload<Attachment>("/team-chat/uploads", file, "file"),

  callLinks: (id: string) => apiFetch<CallLink[]>(`/team-chat/conversations/${id}/call-links`),
  createCallLink: (id: string, input: { expiresInHours: number; requireApproval: boolean }) =>
    apiFetch<CallLink>(`/team-chat/conversations/${id}/call-links`, { method: "POST", ...json(input) }),
  revokeCallLink: (id: string, linkId: string) => apiFetch(`/team-chat/conversations/${id}/call-links/${linkId}`, { method: "DELETE" }),
};

export interface CallLink {
  id: string;
  token: string;
  requireApproval: boolean;
  expiresAt: string | null;
  createdById: string;
  createdAt: string;
}

export const meetUrl = (token: string) => `${window.location.origin}/meet/${token}`;

/** Public (no account) endpoints behind a meeting link. */
export const meetApi = {
  info: async (token: string) => {
    const res = await fetch(`${API_URL}/public/meet/${encodeURIComponent(token)}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.message || "This meeting link is invalid or has expired.");
    return body as { title: string; orgName: string; requireApproval: boolean };
  },
  join: async (token: string, name: string) => {
    const res = await fetch(`${API_URL}/public/meet/${encodeURIComponent(token)}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.message || "Couldn't join the meeting");
    return body as { guestToken: string; guestId: string; title: string; iceServers: RTCIceServer[] };
  },
};

/**
 * One socket per tab on the `/team-chat` namespace, shared by the provider and
 * the call module. Reference-counted: the shell remounts on every module
 * navigation, and the socket should survive that rather than reconnect.
 */
let socket: Socket | null = null;
let users = 0;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;

export function acquireTeamChatSocket(): Socket | null {
  const token = Cookies.get("authToken");
  if (!token) return null;
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  users += 1;
  if (!socket) {
    socket = io(`${API_URL}/team-chat`, { auth: { token }, transports: ["websocket"], reconnectionDelayMax: 10_000 });
  }
  return socket;
}

export function releaseTeamChatSocket() {
  users = Math.max(0, users - 1);
  if (users > 0) return;
  // Grace period so a route change (unmount → remount) doesn't drop the connection.
  releaseTimer = setTimeout(() => {
    if (users === 0 && socket) {
      socket.disconnect();
      socket = null;
    }
  }, 3000);
}

/** A guest's socket (meeting link): call events only, authenticated by the guest token. */
export function connectGuestSocket(guestToken: string): Socket {
  socket?.disconnect();
  socket = io(`${API_URL}/team-chat`, { auth: { guestToken }, transports: ["websocket"], reconnectionDelayMax: 10_000 });
  users = 1;
  return socket;
}

export function teamChatSocket(): Socket | null {
  return socket;
}
