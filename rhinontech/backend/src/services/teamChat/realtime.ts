import jwt from "jsonwebtoken";
import type { Namespace, Server, Socket } from "socket.io";
import { env } from "../../config/env";
import { User } from "../../models/User";
import { Role } from "../../models/Role";
import { Permission } from "../../models/Permission";
import { Organization } from "../../models/Organization";
import { runAsSystem, runForOrg } from "../tenantContext";
import { leaveCallsFor, registerCallSignaling, registerGuestLobby, sendActiveCalls } from "./calls";

/**
 * Team chat over Socket.IO, on its own namespace (`/team-chat`) of the server the
 * chatbot already runs. Every socket is a signed-in, active, internal user; it
 * joins `user:<id>` and receives only what the service addresses to that user.
 * Conversation rooms are deliberately not used: membership changes would have to
 * be mirrored into socket rooms, and a missed leave would leak messages.
 *
 * Call signaling lives in ./calls.ts and rides the same sockets.
 */

let nsp: Namespace | null = null;

export function teamChatNamespace(): Namespace | null {
  return nsp;
}

export const userRoom = (userId: string) => `user:${userId}`;

export function emitToUsers(userIds: string[], event: string, data: unknown) {
  if (!nsp || !userIds.length) return;
  nsp.to(userIds.map(userRoom)).emit(event, data);
}

// --- presence ----------------------------------------------------------------

export type ManualStatus = "available" | "busy" | "dnd" | "away";
interface PresenceEntry {
  organizationId: string;
  sockets: number;
  status: ManualStatus;
  lastSeenAt: string;
}
const presence = new Map<string, PresenceEntry>();

/** online | busy | dnd | away | offline */
export function presenceOf(userId: string): string {
  const p = presence.get(userId);
  if (!p || p.sockets <= 0) return "offline";
  return p.status === "available" ? "online" : p.status;
}

function announcePresence(userId: string) {
  const p = presence.get(userId);
  if (!p || !nsp) return;
  nsp.to(`org:${p.organizationId}`).emit("presence", { userId, presence: presenceOf(userId), lastSeenAt: p.lastSeenAt });
}

// --- auth --------------------------------------------------------------------

export interface Member {
  userId: string;
  organizationId: string;
  fullName: string;
  /** Set for people who joined through a meeting link: call access to one chat only. */
  guest?: { conversationId: string; linkToken: string; requireApproval: boolean };
}

async function authenticateGuest(token: string): Promise<Member | null> {
  let payload: { purpose?: string; linkToken?: string; guestId?: string; name?: string };
  try {
    payload = jwt.verify(token, env.jwtSecret) as typeof payload;
  } catch {
    return null;
  }
  if (payload.purpose !== "call-guest" || !payload.linkToken || !payload.guestId || !payload.name) return null;
  const { findUsableLink } = await import("./service");
  // Re-checked on every connect: revoking or expiring the link locks out new connections.
  const link = await runAsSystem("teamChat:guest-auth", () => findUsableLink(payload.linkToken!));
  if (!link) return null;
  return {
    userId: `guest:${payload.guestId}`,
    organizationId: link.get("organizationId") as string,
    fullName: `${payload.name} (Guest)`,
    guest: { conversationId: link.conversationId, linkToken: payload.linkToken, requireApproval: link.requireApproval },
  };
}

async function authenticate(token: string): Promise<Member | null> {
  let payload: { userId: string; purpose?: string };
  try {
    payload = jwt.verify(token, env.jwtSecret) as { userId: string; purpose?: string };
  } catch {
    return null;
  }
  if (payload.purpose) return null; // pending-2FA tokens are not sessions

  const account = await runAsSystem("teamChat:socket-auth", () =>
    User.unscoped().findByPk(payload.userId, {
      attributes: ["id", "status", "userType", "fullName", "organizationId"],
      include: [
        { model: Role, as: "role", include: [{ model: Permission }] },
        { model: Organization, as: "tenant" },
      ],
    })
  );
  if (!account || account.status !== "active" || account.userType !== "internal") return null;
  const org = (account as any).tenant as Organization | null;
  if (!org || org.status === "suspended") return null;
  const role = (account as any).role as Role & { Permissions: Permission[] };
  const perms = (role?.Permissions || []).map((p: any) => `${p.resource}:${p.action}`);
  if (role?.slug !== "superadmin" && !perms.includes("chat:read")) return null;
  return { userId: account.id, organizationId: org.id, fullName: account.fullName };
}

export function rateLimited(socket: Socket, max = 120, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = (socket.data.bucket ??= { start: now, count: 0 });
  if (now - bucket.start > windowMs) {
    bucket.start = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  return bucket.count > max;
}

// --- namespace ---------------------------------------------------------------

export function attachTeamChatSocket(io: Server) {
  nsp = io.of("/team-chat");

  nsp.use(async (socket, next) => {
    const token = typeof socket.handshake.auth?.token === "string" ? socket.handshake.auth.token : null;
    const guestToken = typeof socket.handshake.auth?.guestToken === "string" ? socket.handshake.auth.guestToken : null;
    const member = token ? await authenticate(token) : guestToken ? await authenticateGuest(guestToken) : null;
    if (!member) return next(new Error("unauthorized"));
    socket.data.member = member;
    next();
  });

  nsp.on("connection", (socket) => {
    const me = socket.data.member as Member;
    socket.join(userRoom(me.userId));

    // Guests: call signaling for their one chat and nothing else — no org room,
    // no presence, no typing, so they learn nothing about the workspace.
    if (me.guest) {
      registerCallSignaling(socket, me);
      registerGuestLobby(socket, me);
      socket.on("disconnect", () => leaveCallsFor(socket));
      return;
    }
    socket.join(`org:${me.organizationId}`);

    const entry = presence.get(me.userId) ?? { organizationId: me.organizationId, sockets: 0, status: "available" as ManualStatus, lastSeenAt: "" };
    entry.sockets += 1;
    entry.lastSeenAt = new Date().toISOString();
    presence.set(me.userId, entry);
    announcePresence(me.userId);

    // Everyone's presence in this org, so a fresh tab can paint dots immediately.
    const snapshot: Record<string, string> = {};
    for (const [id, p] of presence) if (p.organizationId === me.organizationId) snapshot[id] = presenceOf(id);
    socket.emit("presence:snapshot", snapshot);

    socket.on("status", (data: { status?: string } = {}) => {
      if (rateLimited(socket)) return;
      const allowed: ManualStatus[] = ["available", "busy", "dnd", "away"];
      if (!allowed.includes(data.status as ManualStatus)) return;
      entry.status = data.status as ManualStatus;
      announcePresence(me.userId);
    });

    // Typing is relayed to the chat's other members after a membership check.
    socket.on("typing", async (data: { conversationId?: string; parentId?: string | null } = {}) => {
      if (rateLimited(socket) || typeof data.conversationId !== "string") return;
      const conversationId = data.conversationId;
      const service = await import("./service");
      const allowed = await runForOrg(me.organizationId, () => service.isMember(conversationId, me.userId), { userId: me.userId, label: "teamChat:typing" }).catch(() => false);
      if (!allowed) return;
      const { TeamChatMember } = await import("../../models/TeamChat");
      const rows = await runForOrg(me.organizationId, () => TeamChatMember.findAll({ where: { conversationId }, attributes: ["userId"] }), { label: "teamChat:typing" });
      emitToUsers(
        rows.map((r) => r.userId).filter((id) => id !== me.userId),
        "typing",
        { conversationId, parentId: data.parentId ?? null, userId: me.userId, name: me.fullName }
      );
    });

    registerCallSignaling(socket, me);
    void sendActiveCalls(socket, me);

    socket.on("disconnect", () => {
      entry.sockets -= 1;
      entry.lastSeenAt = new Date().toISOString();
      if (entry.sockets <= 0) entry.sockets = 0;
      announcePresence(me.userId);
      leaveCallsFor(socket);
    });
  });

  console.log("[TeamChat] Socket namespace attached");
}
