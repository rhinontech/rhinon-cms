// Mirrors the DTOs from backend services/teamChat/service.ts.

export type Presence = "online" | "busy" | "dnd" | "away" | "offline";
export type ManualStatus = "available" | "busy" | "dnd" | "away";
export type ConversationKind = "direct" | "group" | "channel";

export interface ChatUser {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  email: string | null;
  avatarUrl: string | null;
  presence: Presence;
}

export interface Attachment {
  key: string;
  name: string;
  size: number;
  mimeType: string;
  url?: string | null;
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  attachments: Attachment[];
  mentions: string[];
  isSystem: boolean;
  replyCount: number;
  lastReplyAt: string | null;
  editedAt: string | null;
  deleted: boolean;
  pinnedAt: string | null;
  reactions: Reaction[];
  createdAt: string;
  /** Echoed back for optimistic sends. */
  clientId?: string;
  /** Local-only: still sending / failed. */
  pending?: "sending" | "failed";
}

export interface Conversation {
  id: string;
  kind: ConversationKind;
  name: string | null;
  description: string | null;
  isPrivate: boolean;
  projectId: string | null;
  memberIds: string[];
  ownerIds: string[];
  isMember: boolean;
  unread: number;
  mentionUnread: number;
  muted: boolean;
  pinned: boolean;
  lastReadAt: string | null;
  lastMessage: ChatMessage | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface SharedFile extends Attachment {
  messageId: string;
  authorId: string;
  createdAt: string;
}

export interface NotifyEvent {
  conversationId: string;
  messageId: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  title: string;
  preview: string;
  mentionedIds: string[];
}

export interface TypingEvent {
  conversationId: string;
  parentId: string | null;
  userId: string;
  name: string;
}
