import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import { env } from "../../config/env";
import { User } from "../../models/User";
import { Role } from "../../models/Role";
import { Permission } from "../../models/Permission";
import { Organization } from "../../models/Organization";
import { ChatConversation } from "../../models/ChatConversation";
import { runAsSystem } from "../tenantContext";

/**
 * Live chat over Socket.IO, for two kinds of client:
 *
 *   Agents (admin panel) — must present a session JWT in `auth.token`. They join
 *   `org:<id>` and receive that workspace's events only. Saleszium let anyone
 *   who knew a bot's public id join its dashboard room and read every chat;
 *   nothing here is reachable without a session.
 *
 *   Visitors (the widget) — anonymous by nature. A visitor socket is pinned to
 *   one bot and one visitor id at connect time, and may only join a
 *   conversation whose visitorId is its own.
 */

let io: Server | null = null;

const orgRoom = (organizationId: string) => `org:${organizationId}`;
const convRoom = (conversationId: string) => `conv:${conversationId}`;
const visitorRoom = (chatbotId: string, visitorId: string) => `visitor:${chatbotId}:${visitorId}`;

export function emitToOrg(organizationId: string, event: string, data: unknown) {
  io?.to(orgRoom(organizationId)).emit(event, data);
}

export function emitToConversation(conversationId: string, event: string, data: unknown) {
  io?.to(convRoom(conversationId)).emit(event, data);
}

export function emitToVisitor(chatbotId: string, visitorId: string, event: string, data: unknown) {
  io?.to(visitorRoom(chatbotId, visitorId)).emit(event, data);
}

/**
 * Live visitors, per bot: who is on the site now, where from (IP → city), which
 * page, how long. Kept in memory — a t2.micro should not write a row every time
 * a tab opens — and visitors who left in the last 30 minutes stay listed, marked
 * offline, so the team can still follow up.
 */
export interface LiveVisitor {
  visitorId: string;
  email: string | null;
  online: boolean;
  since: string;
  lastSeenAt: string;
  pageUrl: string | null;
  pageTitle: string | null;
  referrer: string | null;
  pageViews: number;
  ip: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  userAgent: string | null;
  sockets: number;
}

const RECENT_MS = 30 * 60_000;
const presence = new Map<string, Map<string, LiveVisitor>>();

function prune(chatbotId: string) {
  const list = presence.get(chatbotId);
  if (!list) return;
  const cutoff = Date.now() - RECENT_MS;
  for (const [id, v] of list) if (!v.online && Date.parse(v.lastSeenAt) < cutoff) list.delete(id);
}

/** Online first, then most recently seen. */
export function liveVisitors(chatbotId: string): LiveVisitor[] {
  prune(chatbotId);
  return Array.from(presence.get(chatbotId)?.values() ?? []).sort(
    (a, b) => Number(b.online) - Number(a.online) || Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt)
  );
}

export function onlineVisitors(chatbotId: string) {
  return liveVisitors(chatbotId).filter((v) => v.online);
}

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

function clientIp(socket: Socket): string | null {
  const forwarded = socket.handshake.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  return (first || socket.handshake.address || "").replace(/^::ffff:/, "") || null;
}

interface AgentIdentity {
  userId: string;
  organizationId: string;
  fullName: string;
}

async function authenticateAgent(token: string): Promise<AgentIdentity | null> {
  let payload: { userId: string; purpose?: string };
  try {
    payload = jwt.verify(token, env.jwtSecret) as { userId: string; purpose?: string };
  } catch {
    return null;
  }
  if (payload.purpose) return null; // single-step tokens (pending 2FA) are not sessions

  const account = await runAsSystem("chatbot:socket-auth", () =>
    User.unscoped().findByPk(payload.userId, {
      attributes: ["id", "status", "fullName", "organizationId"],
      include: [
        { model: Role, as: "role", include: [{ model: Permission }] },
        { model: Organization, as: "tenant" },
      ],
    })
  );
  if (!account || account.status !== "active") return null;
  const org = (account as any).tenant as Organization | null;
  if (!org || org.status === "suspended") return null;
  const role = (account as any).role as Role & { Permissions: Permission[] };
  const perms = (role?.Permissions || []).map((p: any) => `${p.resource}:${p.action}`);
  if (role?.slug !== "superadmin" && !perms.includes("chatbot:read")) return null;
  return { userId: account.id, organizationId: org.id, fullName: account.fullName };
}

/** A small per-socket budget so one tab cannot flood a chat or the database. */
function rateLimited(socket: Socket, max = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = (socket.data.bucket ??= { start: now, count: 0 });
  if (now - bucket.start > windowMs) {
    bucket.start = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  return bucket.count > max;
}

export function attachChatSocket(server: HttpServer) {
  io = new Server(server, {
    // The widget runs on customers' own sites, so any origin may connect; what a
    // connection can see is decided per socket below, not by CORS.
    cors: { origin: true, credentials: false },
    maxHttpBufferSize: 64 * 1024,
  });

  io.on("connection", (socket) => {
    const token = typeof socket.handshake.auth?.token === "string" ? socket.handshake.auth.token : null;
    if (token) {
      void handleAgent(socket, token);
      return;
    }
    void handleVisitor(socket);
  });

  console.log("[Chat] Socket server attached");
}

async function handleAgent(socket: Socket, token: string) {
  const agent = await authenticateAgent(token);
  if (!agent) {
    socket.emit("auth_error", { message: "Sign in again to use live chat." });
    socket.disconnect(true);
    return;
  }
  socket.data.agent = agent;
  socket.join(orgRoom(agent.organizationId));

  // Proactive "open chat" on a visitor's widget — only for this workspace's bots.
  socket.on("open_chat", async ({ chatbotId, visitorId, conversationId }: Record<string, string>) => {
    if (!chatbotId || !visitorId) return;
    const { Chatbot } = await import("../../models/Chatbot");
    const bot = await runAsSystem("chatbot:open-chat", () => Chatbot.unscoped().findByPk(chatbotId));
    if (!bot || (bot as any).organizationId !== agent.organizationId) return;
    emitToVisitor(bot.id, visitorId, "open_chat", { conversationId: conversationId ?? null });
  });
}

async function handleVisitor(socket: Socket) {
  const q = socket.handshake.query as Record<string, string | undefined>;
  const visitorId = String(q.visitor_id || q.user_id || "").slice(0, 128);

  // The widget emits its first message the moment it connects, while the bot
  // lookup below is still in flight. Listeners are registered synchronously
  // and wait on this, so that first message is handled instead of dropped.
  // (chatStore is imported lazily: it imports this module for its emit helpers.)
  const ready = (async () => {
    const store = await import("./chatStore");
    const resolved = visitorId ? await store.resolveBot(q.chatbot_id) : null;
    return resolved ? { store, resolved } : null;
  })();
  const on = (event: string, handler: (ctx: NonNullable<Awaited<typeof ready>>, data: any) => Promise<void>) =>
    socket.on(event, async (data: unknown) => {
      const ctx = await ready;
      if (ctx) await handler(ctx, (data ?? {}) as Record<string, unknown>).catch((err) => console.error(`[Chat] ${event}:`, err.message));
    });

  registerVisitorHandlers(socket, visitorId, on);

  const ctx = await ready;
  if (!ctx) {
    socket.disconnect(true);
    return;
  }
  const { store, resolved } = ctx;
  const botId = resolved.bot.id;

  // Presence socket (the widget's tracker connection). Skipped if the tab
  // already went away during the lookup, or it would stay "online" forever.
  if (q.is_visitor === "true" && socket.connected) {
    socket.join(visitorRoom(botId, visitorId));
    const list = presence.get(botId) ?? new Map<string, LiveVisitor>();
    presence.set(botId, list);
    const now = new Date().toISOString();
    const ip = clientIp(socket);
    const previous = list.get(visitorId);
    const entry: LiveVisitor = previous ?? {
      visitorId,
      email: null,
      online: true,
      since: now,
      lastSeenAt: now,
      pageUrl: null,
      pageTitle: null,
      referrer: str(q.referrer, 500),
      pageViews: 0,
      ip,
      city: null,
      region: null,
      country: null,
      latitude: null,
      longitude: null,
      userAgent: str(socket.handshake.headers["user-agent"], 300),
      sockets: 0,
    };
    // A visitor back within 30 minutes continues the same visit.
    if (!entry.online) entry.since = now;
    entry.online = true;
    entry.sockets += 1;
    entry.lastSeenAt = now;
    entry.email = store.realEmail(q.user_email) ?? entry.email;
    const page = str(q.page_url, 1000);
    if (page && page !== entry.pageUrl) {
      entry.pageUrl = page;
      entry.pageTitle = str(q.page_title, 300);
      entry.pageViews += 1;
    }
    list.set(visitorId, entry);
    const announce = (type: "online" | "offline" | "update") =>
      emitToOrg(resolved.organizationId, "chat:visitor", { chatbotId: botId, type, visitor: entry });
    announce("online");

    // City/country from the IP, server-side (Saleszium asked a third party from
    // the visitor's browser). Cached, and never blocks the connection.
    if (ip && !entry.country) {
      void import("../geolocation").then(async ({ lookupIpLocationCached, isPrivateOrLocalIp }) => {
        if (isPrivateOrLocalIp(ip)) return;
        const geo = await lookupIpLocationCached(ip);
        if (!geo) return;
        Object.assign(entry, {
          city: geo.city ?? null,
          region: geo.region ?? null,
          country: geo.country ?? null,
          latitude: geo.latitude ?? null,
          longitude: geo.longitude ?? null,
        });
        announce("update");
      });
    }

    // Single-page sites change URL without reloading; the widget reports it.
    socket.on("visitor:page", (data: Record<string, unknown> = {}) => {
      if (rateLimited(socket, 60)) return;
      const url = str(data.url, 1000);
      if (!url || url === entry.pageUrl) return;
      entry.pageUrl = url;
      entry.pageTitle = str(data.title, 300);
      entry.pageViews += 1;
      entry.lastSeenAt = new Date().toISOString();
      announce("update");
    });

    socket.on("disconnect", () => {
      entry.sockets -= 1;
      entry.lastSeenAt = new Date().toISOString();
      if (entry.sockets <= 0) {
        entry.sockets = 0;
        entry.online = false;
        announce("offline");
      }
    });
  }
}

type VisitorCtx = { store: typeof import("./chatStore"); resolved: import("./chatStore").ResolvedBot };
type VisitorOn = (event: string, handler: (ctx: VisitorCtx, data: any) => Promise<void>) => void;

function registerVisitorHandlers(socket: Socket, visitorId: string, on: VisitorOn) {
  const ownConversation = async ({ store, resolved }: VisitorCtx, publicKey: unknown) => {
    if (typeof publicKey !== "string") return null;
    const botId = resolved.bot.id;
    return store.withBot(resolved, async () => {
      const conv = await ChatConversation.findOne({ where: { publicKey } });
      return conv && conv.chatbotId === botId && conv.visitorId === visitorId ? conv : null;
    });
  };

  on("join_conversation", async (ctx, { chatbot_history }) => {
    const conv = await ownConversation(ctx, chatbot_history);
    if (conv) socket.join(convRoom(conv.id));
  });

  on("message", async ({ store, resolved }, data) => {
    if (rateLimited(socket)) return;
    const role = data.role === "trigger" ? "trigger" : "user";
    const text = typeof data.text === "string" ? data.text : "";
    if (role === "user" && !text.trim()) return;

    await store.withBot(resolved, async () => {
      const conv = await store.findOrCreateConversation(
        resolved,
        visitorId,
        typeof data.chatbot_history === "string" ? data.chatbot_history : null,
        { email: data.user_email, meta: { userAgent: socket.handshake.headers["user-agent"] ?? null } }
      );
      if (!conv) return;
      socket.join(convRoom(conv.id));

      const email = store.realEmail(data.user_email);
      const updates: Partial<{ mode: "human"; visitorEmail: string }> = {};
      if (conv.mode !== "human") updates.mode = "human";
      if (email && !conv.visitorEmail) updates.visitorEmail = email;
      if (Object.keys(updates).length) {
        await conv.update(updates);
        emitToOrg(resolved.organizationId, "chat:conversation", store.serializeConversation(conv));
      }
      // "trigger" only opens the human chat; it is not something the visitor said.
      if (role === "trigger") return;
      await store.appendMessage(resolved, conv, { role: "user", phase: "human", text });
    }, "chatbot:socket");
  });

  on("conversation:closed", async (ctx, { chatbot_history }) => {
    const { store, resolved } = ctx;
    await store.withBot(resolved, async () => {
      const conv = await ownConversation(ctx, chatbot_history);
      if (!conv || conv.status === "closed") return;
      await conv.update({ status: "closed", closedAt: new Date() });
      emitToOrg(resolved.organizationId, "chat:conversation", store.serializeConversation(conv));
      emitToConversation(conv.id, "conversation:closed", { chatbot_history: conv.publicKey });
    }, "chatbot:socket");
  });
}
