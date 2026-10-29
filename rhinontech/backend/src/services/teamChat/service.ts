import crypto from "node:crypto";
import { Op, literal } from "sequelize";
import { sequelize } from "../../config/database";
import { User } from "../../models/User";
import { Project } from "../../models/Project";
import {
  TeamChatConversation,
  TeamChatMember,
  TeamChatMessage,
  TeamChatReaction,
  TeamCallLink,
  type TeamChatAttachment,
  type TeamChatKind,
} from "../../models/TeamChat";
import { getPresignedReadUrl, isOwnKey } from "../storage";
import { emitToUsers, presenceOf } from "./realtime";

/**
 * Internal team chat. Every function runs inside the caller's tenant context,
 * so the global hooks scope all of it to one organization; membership is the
 * second boundary and is checked here, not trusted from the client.
 */

export class ChatError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const MAX_BODY = 8000;
const MAX_ATTACHMENTS = 10;
const PAGE = 50;

// --- serialization -----------------------------------------------------------

export interface ChatUserDto {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  email: string | null;
  avatarUrl: string | null;
  presence: string;
}

async function userDto(u: User): Promise<ChatUserDto> {
  const avatarKey = u.avatarKey;
  return {
    id: u.id,
    name: u.fullName,
    title: u.roleTitle || null,
    department: u.department || null,
    email: u.companyEmail || u.personalEmail || null,
    avatarUrl: avatarKey ? await getPresignedReadUrl(avatarKey).catch(() => null) : null,
    presence: presenceOf(u.id),
  };
}

export interface MessageDto {
  id: string;
  conversationId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  attachments: (TeamChatAttachment & { url: string | null })[];
  mentions: string[];
  isSystem: boolean;
  replyCount: number;
  lastReplyAt: Date | null;
  editedAt: Date | null;
  deleted: boolean;
  pinnedAt: Date | null;
  reactions: { emoji: string; userIds: string[] }[];
  createdAt: Date;
}

async function messageDto(m: TeamChatMessage, reactions?: TeamChatReaction[]): Promise<MessageDto> {
  const rows = reactions ?? (await TeamChatReaction.findAll({ where: { messageId: m.id }, order: [["createdAt", "ASC"]] }));
  const grouped = new Map<string, string[]>();
  for (const r of rows) grouped.set(r.emoji, [...(grouped.get(r.emoji) ?? []), r.userId]);
  const deleted = !!m.deletedAt;
  return {
    id: m.id,
    conversationId: m.conversationId,
    authorId: m.authorId,
    parentId: m.parentId,
    body: deleted ? "" : m.body,
    attachments: deleted
      ? []
      : await Promise.all((m.attachments ?? []).map(async (a) => ({ ...a, url: await getPresignedReadUrl(a.key).catch(() => null) }))),
    mentions: m.mentions ?? [],
    isSystem: m.isSystem,
    replyCount: m.replyCount,
    lastReplyAt: m.lastReplyAt,
    editedAt: m.editedAt,
    deleted,
    pinnedAt: m.pinnedAt,
    reactions: Array.from(grouped, ([emoji, userIds]) => ({ emoji, userIds })),
    createdAt: m.createdAt,
  };
}

async function messageDtos(messages: TeamChatMessage[]): Promise<MessageDto[]> {
  const reactions = messages.length
    ? await TeamChatReaction.findAll({ where: { messageId: messages.map((m) => m.id) }, order: [["createdAt", "ASC"]] })
    : [];
  return Promise.all(messages.map((m) => messageDto(m, reactions.filter((r) => r.messageId === m.id))));
}

export interface ConversationDto {
  id: string;
  kind: TeamChatKind;
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
  lastReadAt: Date | null;
  lastMessage: MessageDto | null;
  lastMessageAt: Date | null;
  createdAt: Date;
}

async function conversationDto(conv: TeamChatConversation, userId: string): Promise<ConversationDto> {
  const members = await TeamChatMember.findAll({ where: { conversationId: conv.id } });
  const me = members.find((m) => m.userId === userId);
  const last = await TeamChatMessage.findOne({
    where: { conversationId: conv.id, parentId: null },
    order: [["createdAt", "DESC"]],
  });
  const unreadWhere = {
    conversationId: conv.id,
    parentId: null,
    authorId: { [Op.ne]: userId },
    deletedAt: null,
    isSystem: false,
    ...(me?.lastReadAt ? { createdAt: { [Op.gt]: me.lastReadAt } } : {}),
  };
  const [unread, mentionUnread] = me
    ? await Promise.all([
        TeamChatMessage.count({ where: unreadWhere }),
        TeamChatMessage.count({ where: { ...unreadWhere, mentions: { [Op.contains]: [userId] } } }),
      ])
    : [0, 0];
  return {
    id: conv.id,
    kind: conv.kind,
    name: conv.name,
    description: conv.description,
    isPrivate: conv.isPrivate,
    projectId: conv.projectId,
    memberIds: members.map((m) => m.userId),
    ownerIds: members.filter((m) => m.role === "owner").map((m) => m.userId),
    isMember: !!me,
    unread,
    mentionUnread,
    muted: me?.muted ?? false,
    pinned: me?.pinned ?? false,
    lastReadAt: me?.lastReadAt ?? null,
    lastMessage: last ? await messageDto(last) : null,
    lastMessageAt: conv.lastMessageAt,
    createdAt: conv.createdAt,
  };
}

// --- access ------------------------------------------------------------------

async function memberIds(conversationId: string): Promise<string[]> {
  const rows = await TeamChatMember.findAll({ where: { conversationId }, attributes: ["userId"] });
  return rows.map((r) => r.userId);
}

async function requireConversation(conversationId: string): Promise<TeamChatConversation> {
  const conv = await TeamChatConversation.findByPk(conversationId);
  if (!conv || conv.archivedAt) throw new ChatError("Chat not found", 404);
  return conv;
}

async function requireMembership(conversationId: string, userId: string) {
  const conv = await requireConversation(conversationId);
  const member = await TeamChatMember.findOne({ where: { conversationId, userId } });
  if (!member) throw new ChatError("You are not in this chat", 403);
  return { conv, member };
}

/** Members can read; anyone in the org can read a public channel (to preview before joining). */
async function requireReadable(conversationId: string, userId: string) {
  const conv = await requireConversation(conversationId);
  const member = await TeamChatMember.findOne({ where: { conversationId, userId } });
  if (!member && !(conv.kind === "channel" && !conv.isPrivate)) throw new ChatError("You are not in this chat", 403);
  return conv;
}

/** Only active internal users of this org may be added — never guests/collaborators. */
async function validUserIds(ids: unknown): Promise<string[]> {
  if (!Array.isArray(ids)) return [];
  const wanted = Array.from(new Set(ids.filter((v): v is string => typeof v === "string"))).slice(0, 500);
  if (!wanted.length) return [];
  const users = await User.findAll({ where: { id: wanted, status: "active", userType: "internal" }, attributes: ["id"] });
  return users.map((u) => u.id);
}

const cleanName = (v: unknown, max = 80) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// --- directory ---------------------------------------------------------------

export async function listDirectory(): Promise<ChatUserDto[]> {
  const users = await User.findAll({
    where: { status: "active", userType: "internal" },
    order: [["fullName", "ASC"]],
  });
  return Promise.all(users.map(userDto));
}

// --- conversations -----------------------------------------------------------

export async function listConversations(userId: string): Promise<ConversationDto[]> {
  const mine = await TeamChatMember.findAll({ where: { userId }, attributes: ["conversationId"] });
  const convs = await TeamChatConversation.findAll({
    where: { id: mine.map((m) => m.conversationId), archivedAt: null },
    order: [[literal('"lastMessageAt" IS NULL'), "ASC"], ["lastMessageAt", "DESC"]],
  });
  return Promise.all(convs.map((c) => conversationDto(c, userId)));
}

export async function getConversation(conversationId: string, userId: string): Promise<ConversationDto> {
  return conversationDto(await requireReadable(conversationId, userId), userId);
}

/** Public channels the user hasn't joined, for the "Browse channels" dialog. */
export async function browseChannels(userId: string): Promise<ConversationDto[]> {
  const mine = await TeamChatMember.findAll({ where: { userId }, attributes: ["conversationId"] });
  const convs = await TeamChatConversation.findAll({
    where: { kind: "channel", isPrivate: false, archivedAt: null, id: { [Op.notIn]: mine.map((m) => m.conversationId) } },
    order: [["name", "ASC"]],
  });
  return Promise.all(convs.map((c) => conversationDto(c, userId)));
}

async function broadcastConversation(conversationId: string, userIds?: string[]) {
  const ids = userIds ?? (await memberIds(conversationId));
  const conv = await TeamChatConversation.findByPk(conversationId);
  if (!conv) return;
  // Unread/mute differ per member, so each gets their own view.
  await Promise.all(ids.map(async (id) => emitToUsers([id], "conversation", await conversationDto(conv, id))));
}

async function systemMessage(conversationId: string, authorId: string, body: string) {
  const msg = await TeamChatMessage.create({ conversationId, authorId, body, isSystem: true });
  await TeamChatConversation.update({ lastMessageAt: msg.createdAt }, { where: { id: conversationId } });
  emitToUsers(await memberIds(conversationId), "message", await messageDto(msg));
}

export async function openDirect(userId: string, otherId: unknown): Promise<ConversationDto> {
  const [other] = await validUserIds([otherId]);
  if (!other) throw new ChatError("That person isn't available to chat");
  const directKey = [userId, other].sort().join(":");
  const existing = await TeamChatConversation.findOne({ where: { kind: "direct", directKey } });
  if (existing) return conversationDto(existing, userId);

  const conv = await sequelize.transaction(async () => {
    const c = await TeamChatConversation.create({ kind: "direct", directKey, createdById: userId });
    await TeamChatMember.bulkCreate(
      Array.from(new Set([userId, other])).map((id) => ({ conversationId: c.id, userId: id, role: "owner" as const }))
    );
    return c;
  });
  return conversationDto(conv, userId);
}

export async function createGroupOrChannel(
  userId: string,
  input: { kind?: unknown; name?: unknown; description?: unknown; isPrivate?: unknown; memberIds?: unknown; projectId?: unknown }
): Promise<ConversationDto> {
  const kind = input.kind === "channel" ? "channel" : "group";
  const name = cleanName(input.name);
  if (kind === "channel" && !name) throw new ChatError("A channel needs a name");
  const members = await validUserIds([userId, ...(Array.isArray(input.memberIds) ? input.memberIds : [])]);
  if (kind === "group" && members.length < 2) throw new ChatError("Add at least one other person");

  let projectId: string | null = null;
  if (kind === "channel" && typeof input.projectId === "string" && input.projectId) {
    const project = await Project.findByPk(input.projectId, { attributes: ["id"] });
    if (!project) throw new ChatError("Project not found", 404);
    const taken = await TeamChatConversation.findOne({ where: { projectId: project.id, archivedAt: null } });
    if (taken) throw new ChatError("That project already has a channel");
    projectId = project.id;
  }

  const conv = await sequelize.transaction(async () => {
    const c = await TeamChatConversation.create({
      kind,
      name: name || null,
      description: cleanName(input.description, 500) || null,
      isPrivate: kind === "channel" ? input.isPrivate === true : true,
      projectId,
      createdById: userId,
    });
    await TeamChatMember.bulkCreate(
      members.map((id) => ({ conversationId: c.id, userId: id, role: id === userId ? ("owner" as const) : ("member" as const) }))
    );
    return c;
  });
  const creator = await User.findByPk(userId, { attributes: ["fullName"] });
  await systemMessage(conv.id, userId, `${creator?.fullName ?? "Someone"} created ${kind === "channel" ? `#${conv.name}` : "the group"}`);
  await broadcastConversation(conv.id);
  return conversationDto(conv, userId);
}

export async function updateConversation(
  conversationId: string,
  userId: string,
  input: { name?: unknown; description?: unknown }
): Promise<ConversationDto> {
  const { conv } = await requireMembership(conversationId, userId);
  if (conv.kind === "direct") throw new ChatError("One-to-one chats can't be renamed");
  const name = cleanName(input.name);
  if (input.name !== undefined) {
    if (!name && conv.kind === "channel") throw new ChatError("A channel needs a name");
    conv.name = name || null;
  }
  if (input.description !== undefined) conv.description = cleanName(input.description, 500) || null;
  await conv.save();
  if (input.name !== undefined) {
    const me = await User.findByPk(userId, { attributes: ["fullName"] });
    await systemMessage(conv.id, userId, `${me?.fullName ?? "Someone"} renamed this to ${conv.kind === "channel" ? "#" : ""}${conv.name ?? "a group"}`);
  }
  await broadcastConversation(conv.id);
  return conversationDto(conv, userId);
}

export async function addMembers(conversationId: string, userId: string, ids: unknown): Promise<ConversationDto> {
  const { conv } = await requireMembership(conversationId, userId);
  if (conv.kind === "direct") throw new ChatError("Start a group chat to add more people");
  const existing = new Set(await memberIds(conv.id));
  const toAdd = (await validUserIds(ids)).filter((id) => !existing.has(id));
  if (!toAdd.length) return conversationDto(conv, userId);
  await TeamChatMember.bulkCreate(toAdd.map((id) => ({ conversationId: conv.id, userId: id })));
  const users = await User.findAll({ where: { id: [userId, ...toAdd] }, attributes: ["id", "fullName"] });
  const nameOf = (id: string) => users.find((u) => u.id === id)?.fullName ?? "someone";
  await systemMessage(conv.id, userId, `${nameOf(userId)} added ${toAdd.map(nameOf).join(", ")}`);
  await broadcastConversation(conv.id);
  return conversationDto(conv, userId);
}

export async function joinChannel(conversationId: string, userId: string): Promise<ConversationDto> {
  const conv = await requireConversation(conversationId);
  if (conv.kind !== "channel" || conv.isPrivate) throw new ChatError("This channel is invite-only", 403);
  const [, created] = await TeamChatMember.findOrCreate({ where: { conversationId, userId }, defaults: { conversationId, userId } });
  if (created) {
    const me = await User.findByPk(userId, { attributes: ["fullName"] });
    await systemMessage(conv.id, userId, `${me?.fullName ?? "Someone"} joined`);
    await broadcastConversation(conv.id);
  }
  return conversationDto(conv, userId);
}

/** Leave a group/channel, or (owner) remove someone else from it. */
export async function removeMember(conversationId: string, userId: string, targetId: string): Promise<void> {
  const { conv, member } = await requireMembership(conversationId, userId);
  if (conv.kind === "direct") throw new ChatError("You can't leave a one-to-one chat");
  if (targetId !== userId && member.role !== "owner") throw new ChatError("Only the chat's owners can remove people", 403);
  const target = await TeamChatMember.findOne({ where: { conversationId, userId: targetId } });
  if (!target) return;
  const before = await memberIds(conv.id);
  await target.destroy();
  const users = await User.findAll({ where: { id: [userId, targetId] }, attributes: ["id", "fullName"] });
  const nameOf = (id: string) => users.find((u) => u.id === id)?.fullName ?? "Someone";
  await systemMessage(conv.id, userId, targetId === userId ? `${nameOf(userId)} left` : `${nameOf(userId)} removed ${nameOf(targetId)}`);
  // The person who left gets a removal event; everyone else a fresh view.
  emitToUsers([targetId], "conversation:removed", { conversationId: conv.id });
  await broadcastConversation(conv.id, before.filter((id) => id !== targetId));

  // A chat whose last owner left gets a new owner, so it can still be managed.
  const owners = await TeamChatMember.count({ where: { conversationId, role: "owner" } });
  if (!owners) {
    const next = await TeamChatMember.findOne({ where: { conversationId }, order: [["createdAt", "ASC"]] });
    if (next) await next.update({ role: "owner" });
  }
}

export async function updatePreferences(conversationId: string, userId: string, input: { muted?: unknown; pinned?: unknown }) {
  const { member } = await requireMembership(conversationId, userId);
  if (typeof input.muted === "boolean") member.muted = input.muted;
  if (typeof input.pinned === "boolean") member.pinned = input.pinned;
  await member.save();
  const dto = await getConversation(conversationId, userId);
  emitToUsers([userId], "conversation", dto);
  return dto;
}

export async function markRead(conversationId: string, userId: string): Promise<void> {
  const { member } = await requireMembership(conversationId, userId);
  member.lastReadAt = new Date();
  await member.save();
  // Other tabs of the same user clear their badge; other members see the read receipt.
  emitToUsers(await memberIds(conversationId), "read", { conversationId, userId, lastReadAt: member.lastReadAt });
}

/** Read receipts: when each member last read the chat. */
export async function readStates(conversationId: string, userId: string) {
  await requireMembership(conversationId, userId);
  const rows = await TeamChatMember.findAll({ where: { conversationId }, attributes: ["userId", "lastReadAt"] });
  return rows.map((r) => ({ userId: r.userId, lastReadAt: r.lastReadAt }));
}

// --- messages ----------------------------------------------------------------

export async function listMessages(conversationId: string, userId: string, before?: string): Promise<{ messages: MessageDto[]; hasMore: boolean }> {
  await requireReadable(conversationId, userId);
  const where: Record<string | symbol, unknown> = { conversationId, parentId: null };
  const cursor = before ? new Date(before) : null;
  if (cursor && !isNaN(cursor.getTime())) where.createdAt = { [Op.lt]: cursor };
  const rows = await TeamChatMessage.findAll({ where, order: [["createdAt", "DESC"]], limit: PAGE + 1 });
  const hasMore = rows.length > PAGE;
  return { messages: await messageDtos(rows.slice(0, PAGE).reverse()), hasMore };
}

export async function listThread(conversationId: string, userId: string, rootId: string) {
  await requireReadable(conversationId, userId);
  const root = await TeamChatMessage.findOne({ where: { id: rootId, conversationId, parentId: null } });
  if (!root) throw new ChatError("Message not found", 404);
  const replies = await TeamChatMessage.findAll({ where: { parentId: root.id }, order: [["createdAt", "ASC"]] });
  return { root: await messageDto(root), replies: await messageDtos(replies) };
}

export async function listPinned(conversationId: string, userId: string): Promise<MessageDto[]> {
  await requireReadable(conversationId, userId);
  const rows = await TeamChatMessage.findAll({
    where: { conversationId, pinnedAt: { [Op.ne]: null }, deletedAt: null },
    order: [["pinnedAt", "DESC"]],
  });
  return messageDtos(rows);
}

export async function listFiles(conversationId: string, userId: string) {
  await requireReadable(conversationId, userId);
  const rows = await TeamChatMessage.findAll({
    where: { conversationId, deletedAt: null, [Op.and]: [literal("jsonb_array_length(\"attachments\") > 0")] },
    order: [["createdAt", "DESC"]],
    limit: 200,
  });
  const out: (TeamChatAttachment & { url: string | null; messageId: string; authorId: string; createdAt: Date })[] = [];
  for (const m of rows) {
    for (const a of m.attachments) {
      out.push({ ...a, url: await getPresignedReadUrl(a.key).catch(() => null), messageId: m.id, authorId: m.authorId, createdAt: m.createdAt });
    }
  }
  return out;
}

async function validAttachments(input: unknown): Promise<TeamChatAttachment[]> {
  if (!Array.isArray(input)) return [];
  const out: TeamChatAttachment[] = [];
  for (const a of input.slice(0, MAX_ATTACHMENTS)) {
    if (!a || typeof a.key !== "string" || !a.key.startsWith("chat/")) continue;
    // Never attach a key the caller doesn't own — it would presign another tenant's file.
    if (!(await isOwnKey(a.key))) continue;
    out.push({
      key: a.key,
      name: cleanName(a.name, 200) || "file",
      size: Number.isFinite(Number(a.size)) ? Number(a.size) : 0,
      mimeType: cleanName(a.mimeType, 120) || "application/octet-stream",
    });
  }
  return out;
}

export async function sendMessage(
  conversationId: string,
  userId: string,
  input: { body?: unknown; attachments?: unknown; parentId?: unknown; mentions?: unknown; clientId?: unknown }
): Promise<MessageDto> {
  const { conv } = await requireMembership(conversationId, userId);
  const body = typeof input.body === "string" ? input.body.trim().slice(0, MAX_BODY) : "";
  const attachments = await validAttachments(input.attachments);
  if (!body && !attachments.length) throw new ChatError("Message is empty");

  const members = await memberIds(conv.id);
  const mentions = Array.isArray(input.mentions)
    ? Array.from(new Set(input.mentions.filter((id): id is string => typeof id === "string" && members.includes(id) && id !== userId)))
    : [];

  let parent: TeamChatMessage | null = null;
  if (typeof input.parentId === "string" && input.parentId) {
    parent = await TeamChatMessage.findOne({ where: { id: input.parentId, conversationId: conv.id, parentId: null } });
    if (!parent) throw new ChatError("The message you're replying to is gone", 404);
  }

  const msg = await sequelize.transaction(async () => {
    const m = await TeamChatMessage.create({ conversationId: conv.id, authorId: userId, body, attachments, mentions, parentId: parent?.id ?? null });
    if (parent) {
      await parent.update({ replyCount: parent.replyCount + 1, lastReplyAt: m.createdAt });
    } else {
      await conv.update({ lastMessageAt: m.createdAt });
      // Sending implies having read everything before it.
      await TeamChatMember.update({ lastReadAt: m.createdAt }, { where: { conversationId: conv.id, userId } });
    }
    return m;
  });

  const dto = await messageDto(msg, []);
  emitToUsers(members, "message", { ...dto, clientId: typeof input.clientId === "string" ? input.clientId : undefined });
  if (parent) emitToUsers(members, "message:updated", await messageDto(parent));

  // Notifications: everyone else, unless they muted the chat — but a mention always gets through.
  const memberRows = await TeamChatMember.findAll({ where: { conversationId: conv.id } });
  const author = await User.findByPk(userId, { attributes: ["fullName"] });
  const notify = memberRows
    .filter((m) => m.userId !== userId && (!m.muted || mentions.includes(m.userId)))
    .map((m) => m.userId);
  if (notify.length) {
    emitToUsers(notify, "notify", {
      conversationId: conv.id,
      messageId: msg.id,
      parentId: msg.parentId,
      authorId: userId,
      authorName: author?.fullName ?? "Someone",
      title: conv.kind === "direct" ? author?.fullName ?? "New message" : conv.kind === "channel" ? `#${conv.name}` : conv.name ?? "Group chat",
      preview: body ? body.slice(0, 140) : `📎 ${attachments[0]?.name ?? "Attachment"}`,
      mentionedIds: mentions,
    });
  }
  return dto;
}

async function requireOwnMessage(messageId: string, userId: string) {
  const msg = await TeamChatMessage.findByPk(messageId);
  if (!msg || msg.deletedAt) throw new ChatError("Message not found", 404);
  await requireMembership(msg.conversationId, userId);
  if (msg.authorId !== userId || msg.isSystem) throw new ChatError("You can only change your own messages", 403);
  return msg;
}

export async function editMessage(messageId: string, userId: string, body: unknown): Promise<MessageDto> {
  const msg = await requireOwnMessage(messageId, userId);
  const text = typeof body === "string" ? body.trim().slice(0, MAX_BODY) : "";
  if (!text && !msg.attachments.length) throw new ChatError("Message is empty");
  await msg.update({ body: text, editedAt: new Date() });
  const dto = await messageDto(msg);
  emitToUsers(await memberIds(msg.conversationId), "message:updated", dto);
  return dto;
}

export async function deleteMessage(messageId: string, userId: string): Promise<void> {
  const msg = await requireOwnMessage(messageId, userId);
  // Soft delete: the row stays so threads and reply counts stay coherent.
  await msg.update({ deletedAt: new Date(), pinnedAt: null, pinnedById: null });
  emitToUsers(await memberIds(msg.conversationId), "message:updated", await messageDto(msg));
}

export async function toggleReaction(messageId: string, userId: string, emoji: unknown): Promise<MessageDto> {
  if (typeof emoji !== "string" || !emoji.trim() || emoji.length > 32) throw new ChatError("Pick an emoji");
  const msg = await TeamChatMessage.findByPk(messageId);
  if (!msg || msg.deletedAt) throw new ChatError("Message not found", 404);
  await requireMembership(msg.conversationId, userId);
  const existing = await TeamChatReaction.findOne({ where: { messageId, userId, emoji } });
  if (existing) await existing.destroy();
  else await TeamChatReaction.create({ messageId, userId, emoji });
  const dto = await messageDto(msg);
  emitToUsers(await memberIds(msg.conversationId), "message:updated", dto);
  return dto;
}

export async function togglePin(messageId: string, userId: string): Promise<MessageDto> {
  const msg = await TeamChatMessage.findByPk(messageId);
  if (!msg || msg.deletedAt || msg.isSystem) throw new ChatError("Message not found", 404);
  await requireMembership(msg.conversationId, userId);
  await msg.update(msg.pinnedAt ? { pinnedAt: null, pinnedById: null } : { pinnedAt: new Date(), pinnedById: userId });
  const dto = await messageDto(msg);
  emitToUsers(await memberIds(msg.conversationId), "message:updated", dto);
  return dto;
}

// --- search ------------------------------------------------------------------

export async function search(userId: string, q: unknown) {
  const query = typeof q === "string" ? q.trim().slice(0, 100) : "";
  if (query.length < 2) return [];
  const mine = await TeamChatMember.findAll({ where: { userId }, attributes: ["conversationId"] });
  const escaped = query.replace(/[\\%_]/g, (c) => `\\${c}`);
  const rows = await TeamChatMessage.findAll({
    where: {
      conversationId: mine.map((m) => m.conversationId),
      deletedAt: null,
      isSystem: false,
      body: { [Op.iLike]: `%${escaped}%` },
    },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });
  return messageDtos(rows);
}

/** Total unread across all chats — the sidebar badge. */
export async function unreadTotal(userId: string): Promise<number> {
  const mine = await TeamChatMember.findAll({ where: { userId, muted: false } });
  if (!mine.length) return 0;
  const counts = await Promise.all(
    mine.map((m) =>
      TeamChatMessage.count({
        where: {
          conversationId: m.conversationId,
          parentId: null,
          deletedAt: null,
          isSystem: false,
          authorId: { [Op.ne]: userId },
          ...(m.lastReadAt ? { createdAt: { [Op.gt]: m.lastReadAt } } : {}),
        },
      })
    )
  );
  return counts.reduce((a, b) => a + b, 0);
}

export async function isMember(conversationId: string, userId: string): Promise<boolean> {
  return !!(await TeamChatMember.findOne({ where: { conversationId, userId }, attributes: ["id"] }));
}

/** Call history ("Missed call", "Call ended · 4:12") as a system line in the chat. */
export async function postCallEvent(conversationId: string, authorId: string, body: string): Promise<void> {
  await systemMessage(conversationId, authorId, body);
}

export async function conversationMemberIds(conversationId: string): Promise<string[]> {
  return memberIds(conversationId);
}

export async function conversationLabel(conversationId: string): Promise<{ kind: TeamChatKind; name: string | null } | null> {
  const conv = await TeamChatConversation.findByPk(conversationId, { attributes: ["kind", "name"] });
  return conv ? { kind: conv.kind, name: conv.name } : null;
}

// --- meeting links (guests join a chat's call without an account) ------------

export interface CallLinkDto {
  id: string;
  token: string;
  requireApproval: boolean;
  expiresAt: Date | null;
  createdById: string;
  createdAt: Date;
}

const linkDto = (l: TeamCallLink): CallLinkDto => ({
  id: l.id,
  token: l.token,
  requireApproval: l.requireApproval,
  expiresAt: l.expiresAt,
  createdById: l.createdById,
  createdAt: l.createdAt,
});

export async function listCallLinks(conversationId: string, userId: string): Promise<CallLinkDto[]> {
  await requireMembership(conversationId, userId);
  const rows = await TeamCallLink.findAll({
    where: { conversationId, revokedAt: null, [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }] },
    order: [["createdAt", "DESC"]],
  });
  return rows.map(linkDto);
}

export async function createCallLink(
  conversationId: string,
  userId: string,
  input: { expiresInHours?: unknown; requireApproval?: unknown }
): Promise<CallLinkDto> {
  await requireMembership(conversationId, userId);
  // 0 / missing = never expires; otherwise clamp to 1 hour … 90 days.
  const hours = Number(input.expiresInHours);
  const expiresAt = Number.isFinite(hours) && hours > 0 ? new Date(Date.now() + Math.min(Math.max(hours, 1), 24 * 90) * 3_600_000) : null;
  const link = await TeamCallLink.create({
    conversationId,
    token: crypto.randomBytes(18).toString("base64url"),
    createdById: userId,
    requireApproval: input.requireApproval !== false,
    expiresAt,
  });
  return linkDto(link);
}

export async function revokeCallLink(conversationId: string, userId: string, linkId: string): Promise<void> {
  await requireMembership(conversationId, userId);
  const link = await TeamCallLink.findOne({ where: { id: linkId, conversationId } });
  if (!link) throw new ChatError("Link not found", 404);
  await link.update({ revokedAt: new Date() });
  // Guests already in the call stay; nobody new can use the link.
}

/** A link a guest may still use. Callers run this under system context (no tenant yet). */
export async function findUsableLink(token: string): Promise<TeamCallLink | null> {
  if (!/^[\w-]{16,64}$/.test(token)) return null;
  const link = await TeamCallLink.unscoped().findOne({ where: { token } });
  if (!link || link.revokedAt || (link.expiresAt && link.expiresAt < new Date())) return null;
  const conv = await TeamChatConversation.unscoped().findByPk(link.conversationId, { attributes: ["id", "archivedAt"] });
  return conv && !conv.archivedAt ? link : null;
}
