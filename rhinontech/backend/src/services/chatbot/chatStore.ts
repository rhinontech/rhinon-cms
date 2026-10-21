import crypto from "node:crypto";
import { Chatbot } from "../../models/Chatbot";
import { Site } from "../../models/Site";
import { ChatConversation } from "../../models/ChatConversation";
import { ChatMessage, type ChatMessagePhase, type ChatMessageRole, type ChatAttachment } from "../../models/ChatMessage";
import { runAsSystem, runForOrg } from "../tenantContext";
import { runForSite } from "../siteContext";
import { emitToConversation, emitToOrg } from "./realtime";

/**
 * Conversations and messages for the website chat — the one place both the
 * widget endpoints and the socket write through, so the admin's live view gets
 * the same events whichever way a line arrived.
 */

export interface ResolvedBot {
  bot: Chatbot;
  organizationId: string;
  site: { id: string; slug: string } | null;
}

/**
 * Finds the bot behind a public id. The id carries no tenant, so this is the
 * one deliberately unscoped lookup; everything after it runs inside the bot's
 * own workspace and brand (see withBot).
 */
export async function resolveBot(publicId: unknown): Promise<ResolvedBot | null> {
  if (typeof publicId !== "string" || !/^[A-Z0-9]{6}$/.test(publicId)) return null;
  return runAsSystem("chatbot:resolve-public-id", async () => {
    const bot = await Chatbot.unscoped().findOne({ where: { publicId, isActive: true } });
    if (!bot) return null;
    const organizationId = (bot as any).organizationId as string;
    const site = bot.siteId ? await Site.unscoped().findByPk(bot.siteId, { attributes: ["id", "slug"] }) : null;
    return { bot, organizationId, site: site ? { id: site.id, slug: site.slug } : null };
  });
}

/** Runs `fn` scoped to the bot's workspace and brand. */
export function withBot<T>(resolved: ResolvedBot, fn: () => T, label = "chatbot"): T {
  return runForOrg(resolved.organizationId, () => runForSite(resolved.site, true, fn), { label });
}

/** Chats from the admin's "test your bot" panel: kept out of Live chats and the CRM. */
export const isTestVisitor = (visitorId: string) => visitorId.startsWith("admin-test-");

export function newPublicKey(): string {
  return crypto.randomBytes(16).toString("hex");
}

const PUBLIC_KEY = /^[A-Za-z0-9_-]{6,64}$/;

/**
 * The visitor's conversation for this key, created if the widget minted a new
 * one (it does, for human chats: `${Date.now()}-${random}`). A key that exists
 * but belongs to another visitor is refused, never handed over.
 */
export async function findOrCreateConversation(
  resolved: ResolvedBot,
  visitorId: string,
  publicKey: string | null,
  extra: { email?: unknown; meta?: Record<string, unknown> } = {}
): Promise<ChatConversation | null> {
  if (!visitorId || visitorId.length > 128) return null;
  const key = publicKey && publicKey !== "NEW_CHAT" ? publicKey : newPublicKey();
  if (!PUBLIC_KEY.test(key)) return null;

  const existing = await ChatConversation.findOne({ where: { publicKey: key } });
  if (existing) {
    return existing.chatbotId === resolved.bot.id && existing.visitorId === visitorId ? existing : null;
  }
  const email = realEmail(extra.email);
  const conversation = await ChatConversation.create({
    chatbotId: resolved.bot.id,
    publicKey: key,
    visitorId,
    visitorEmail: email,
    meta: extra.meta ?? {},
  });
  if (!isTestVisitor(visitorId)) emitToOrg(resolved.organizationId, "chat:conversation", serializeConversation(conversation));
  return conversation;
}

/** The widget sends the literal "New Customer" when it has no email. */
export function realEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.slice(0, 320) : null;
}

export async function appendMessage(
  resolved: ResolvedBot,
  conversation: ChatConversation,
  line: {
    role: ChatMessageRole;
    phase: ChatMessagePhase;
    text: string;
    attachments?: ChatAttachment[];
    agent?: { id: string; name: string; image?: string | null };
  }
): Promise<ChatMessage> {
  const message = await ChatMessage.create({
    conversationId: conversation.id,
    role: line.role,
    phase: line.phase,
    text: line.text.slice(0, 20_000),
    attachments: line.attachments ?? [],
    agentUserId: line.agent?.id ?? null,
    agentName: line.agent?.name ?? null,
  });

  const preview = stripHtml(line.text).slice(0, 280);
  await conversation.update({
    lastMessageAt: new Date(),
    lastMessagePreview: preview || conversation.lastMessagePreview,
    unreadCount: line.role === "user" ? conversation.unreadCount + 1 : conversation.unreadCount,
    // Chatting again reopens a chat the visitor or an agent had closed.
    ...(conversation.status === "closed" && line.role === "user" ? { status: "open" as const, closedAt: null } : {}),
    ...(conversation.title === "New chat" && line.role === "user" && preview ? { title: preview.slice(0, 80) } : {}),
  });

  const payload = serializeMessage(message);
  if (!isTestVisitor(conversation.visitorId)) emitToOrg(resolved.organizationId, "chat:message", { conversation: serializeConversation(conversation), message: payload });
  // The widget's own shape, for whoever is in the conversation room.
  emitToConversation(conversation.id, "message", {
    role: line.role,
    text: message.text,
    timestamp: message.createdAt.toISOString(),
    chatbot_id: resolved.bot.publicId,
    chatbot_history: conversation.publicKey,
    sender_name: line.agent?.name ?? null,
    sender_image: line.agent?.image ?? null,
  });
  return message;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function serializeConversation(c: ChatConversation) {
  return {
    id: c.id,
    chatbotId: c.chatbotId,
    siteId: c.siteId,
    publicKey: c.publicKey,
    visitorId: c.visitorId,
    visitorEmail: c.visitorEmail,
    visitorName: c.visitorName,
    visitorPhone: c.visitorPhone,
    title: c.title,
    mode: c.mode,
    status: c.status,
    assignedUserId: c.assignedUserId,
    lastMessageAt: c.lastMessageAt,
    lastMessagePreview: c.lastMessagePreview,
    unreadCount: c.unreadCount,
    isPinned: c.isPinned,
    review: c.review,
    leadId: c.leadId,
    meta: c.meta,
    closedAt: c.closedAt,
    createdAt: c.createdAt,
  };
}

export function serializeMessage(m: ChatMessage) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    role: m.role,
    phase: m.phase,
    text: m.text,
    attachments: m.attachments,
    agentUserId: m.agentUserId,
    agentName: m.agentName,
    createdAt: m.createdAt,
  };
}
