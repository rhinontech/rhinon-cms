import type { Socket } from "socket.io";
import { runForOrg } from "../tenantContext";
import { emitToUsers, presenceOf, rateLimited, teamChatNamespace, userRoom, type Member } from "./realtime";

/**
 * Team calls: 1:1 and small group calls tied to a chat. Mesh WebRTC — every
 * participant connects to every other — so there's no media server to run, at
 * the cost of a size cap. The server only relays signaling, and only between
 * participants of the same call; it never sees media.
 *
 * Flow: start → members are rung (call:incoming) → each joiner gets the current
 * participant list and sends an offer to each of them → signals are relayed
 * point-to-point (call:signal) → leave / end. The chat gets a history line when
 * the call ends ("Missed call", "Video call ended · 4:12").
 */

export const MAX_PARTICIPANTS = 8;
const RING_MS = 45_000;

interface Participant {
  userId: string;
  name: string;
  socketId: string;
  joinedAt: number;
}

interface ActiveCall {
  callId: string;
  organizationId: string;
  conversationId: string;
  kind: "direct" | "group" | "channel";
  callerId: string;
  callerName: string;
  video: boolean;
  participants: Map<string, Participant>;
  /** Members currently being rung. */
  ringing: Set<string>;
  memberIds: string[];
  createdAt: number;
  /** When a second person joined — the call's real start, for the duration line. */
  connectedAt: number | null;
  ringTimer: ReturnType<typeof setTimeout> | null;
}

const calls = new Map<string, ActiveCall>();

const service = () => import("./service");

function publicState(c: ActiveCall) {
  return {
    callId: c.callId,
    conversationId: c.conversationId,
    video: c.video,
    callerId: c.callerId,
    participantIds: Array.from(c.participants.keys()),
    participantNames: Object.fromEntries(Array.from(c.participants.values()).map((p) => [p.userId, p.name])),
    startedAt: c.connectedAt ?? c.createdAt,
  };
}

const isGuest = (userId: string) => userId.startsWith("guest:");

/** Everyone in the chat sees a "Join" banner while a call runs in it. */
function broadcastState(c: ActiveCall) {
  emitToUsers(c.memberIds, "call:active", publicState(c));
}

function callOfUser(userId: string): ActiveCall | undefined {
  for (const c of calls.values()) if (c.participants.has(userId)) return c;
  return undefined;
}

function formatDuration(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

async function endCall(c: ActiveCall, reason: string) {
  if (!calls.has(c.callId)) return;
  calls.delete(c.callId);
  if (c.ringTimer) clearTimeout(c.ringTimer);
  emitToUsers(c.memberIds, "call:ended", { callId: c.callId, conversationId: c.conversationId, reason });
  for (const p of c.participants.values()) {
    if (isGuest(p.userId)) teamChatNamespace()?.to(p.socketId).emit("call:ended", { callId: c.callId, reason });
  }

  const label = c.video ? "Video call" : "Call";
  const body = c.connectedAt
    ? `📞 ${label} ended · ${formatDuration(Date.now() - c.connectedAt)}`
    : `📞 Missed ${c.video ? "video call" : "call"} from ${c.callerName}`;
  await runForOrg(c.organizationId, async () => (await service()).postCallEvent(c.conversationId, c.callerId, body), {
    label: "teamChat:call-history",
  }).catch((err) => console.error("[TeamChat] call history:", err.message));
}

function leave(c: ActiveCall, userId: string, reason = "left") {
  if (!c.participants.delete(userId)) return;
  for (const p of c.participants.values()) {
    teamChatNamespace()?.to(p.socketId).emit("call:peer-left", { callId: c.callId, userId });
  }
  // A call ends when it's down to one person and nobody else is still being rung —
  // or, for a 1:1, as soon as either side leaves.
  const membersLeft = Array.from(c.participants.keys()).filter((id) => !isGuest(id)).length;
  if (
    membersLeft === 0 ||
    c.participants.size === 0 ||
    (c.participants.size === 1 && (c.kind === "direct" || (c.connectedAt && c.ringing.size === 0)))
  ) {
    void endCall(c, reason);
    return;
  }
  broadcastState(c);
}

async function loadMembership(me: Member, conversationId: string) {
  return runForOrg(
    me.organizationId,
    async () => {
      const svc = await service();
      if (!(await svc.isMember(conversationId, me.userId))) return null;
      const [memberIds, label] = await Promise.all([svc.conversationMemberIds(conversationId), svc.conversationLabel(conversationId)]);
      return label ? { memberIds, kind: label.kind } : null;
    },
    { userId: me.userId, label: "teamChat:call" }
  ).catch(() => null);
}

/** On connect: any calls running in my chats, so the Join banner shows after a reload. */
export async function sendActiveCalls(socket: Socket, me: Member) {
  for (const c of calls.values()) {
    if (c.organizationId === me.organizationId && c.memberIds.includes(me.userId)) socket.emit("call:active", publicState(c));
  }
}

/** What a joiner gets: everyone already in the call except themselves — they'll offer to each. */
function joinPayload(c: ActiveCall, joinerId: string) {
  return {
    ...publicState(c),
    participants: Array.from(c.participants.values())
      .filter((p) => p.userId !== joinerId)
      .map(({ userId, name }) => ({ userId, name })),
  };
}

export function registerCallSignaling(socket: Socket, me: Member) {
  const own = (callId: unknown) => (typeof callId === "string" ? calls.get(callId) : undefined);

  socket.on("call:start", async (data: { callId?: string; conversationId?: string; video?: boolean } = {}) => {
    if (rateLimited(socket) || typeof data.callId !== "string" || typeof data.conversationId !== "string") return;
    if (calls.has(data.callId)) return;
    const fail = (reason: string) => socket.emit("call:ended", { callId: data.callId, reason });
    if (callOfUser(me.userId)) return fail("already_in_call");

    const membership = await loadMembership(me, data.conversationId);
    if (!membership) return fail("unavailable");

    // One call per chat: starting where one is already running just joins it.
    const running = Array.from(calls.values()).find((c) => c.conversationId === data.conversationId);
    if (running) return joinCall(running);

    const others = membership.memberIds.filter((id) => id !== me.userId);
    if (membership.kind === "direct" && others.length === 1) {
      if (presenceOf(others[0]) === "offline") return fail("offline");
      if (callOfUser(others[0])) return fail("busy");
    }

    const c: ActiveCall = {
      callId: data.callId,
      organizationId: me.organizationId,
      conversationId: data.conversationId,
      kind: membership.kind,
      callerId: me.userId,
      callerName: me.fullName,
      video: data.video === true,
      participants: new Map([[me.userId, { userId: me.userId, name: me.fullName, socketId: socket.id, joinedAt: Date.now() }]]),
      // Big channels aren't rung: people join from the banner instead.
      ringing: new Set(membership.memberIds.length <= MAX_PARTICIPANTS ? others.filter((id) => presenceOf(id) !== "offline") : []),
      memberIds: membership.memberIds,
      createdAt: Date.now(),
      connectedAt: null,
      ringTimer: null,
    };
    calls.set(c.callId, c);
    socket.emit("call:joined", joinPayload(c, me.userId));
    admitWaiting(c);

    const label = await runForOrg(me.organizationId, async () => (await service()).conversationLabel(c.conversationId), { label: "teamChat:call" }).catch(() => null);
    emitToUsers(Array.from(c.ringing), "call:incoming", {
      callId: c.callId,
      conversationId: c.conversationId,
      fromUserId: me.userId,
      fromName: me.fullName,
      video: c.video,
      title: c.kind === "direct" ? null : label?.name ?? "Group call",
    });
    broadcastState(c);

    c.ringTimer = setTimeout(() => {
      c.ringTimer = null;
      const unanswered = Array.from(c.ringing);
      c.ringing.clear();
      if (unanswered.length) emitToUsers(unanswered, "call:dismiss", { callId: c.callId });
      if (!c.connectedAt) void endCall(c, "no_answer");
    }, RING_MS);
  });

  const joinCall = (c: ActiveCall) => {
    if (c.participants.has(me.userId)) {
      // Same person from another tab: move the call to this one.
      const prev = c.participants.get(me.userId)!;
      if (prev.socketId !== socket.id) teamChatNamespace()?.to(prev.socketId).emit("call:ended", { callId: c.callId, reason: "moved" });
      leave(c, me.userId);
      if (!calls.has(c.callId)) return;
    }
    if (c.participants.size >= MAX_PARTICIPANTS) return socket.emit("call:ended", { callId: c.callId, reason: "full" });
    c.ringing.delete(me.userId);
    // Other tabs of mine stop ringing.
    socket.to(userRoom(me.userId)).emit("call:dismiss", { callId: c.callId });
    const existing = Array.from(c.participants.values());
    c.participants.set(me.userId, { userId: me.userId, name: me.fullName, socketId: socket.id, joinedAt: Date.now() });
    if (!c.connectedAt && c.participants.size >= 2) c.connectedAt = Date.now();
    socket.emit("call:joined", joinPayload(c, me.userId));
    for (const p of existing) {
      teamChatNamespace()?.to(p.socketId).emit("call:peer-joined", { callId: c.callId, userId: me.userId, name: me.fullName });
    }
    broadcastState(c);
    admitWaiting(c);
  };

  socket.on("call:join", async (data: { callId?: string } = {}) => {
    const c = own(data.callId);
    if (!c) return socket.emit("call:ended", { callId: data.callId, reason: "gone" });
    if (c.organizationId !== me.organizationId || !c.memberIds.includes(me.userId)) return;
    const elsewhere = callOfUser(me.userId);
    if (elsewhere && elsewhere !== c) return socket.emit("call:ended", { callId: c.callId, reason: "already_in_call" });
    joinCall(c);
  });

  socket.on("call:decline", (data: { callId?: string } = {}) => {
    const c = own(data.callId);
    if (!c || !c.ringing.delete(me.userId)) return;
    socket.to(userRoom(me.userId)).emit("call:dismiss", { callId: c.callId });
    for (const p of c.participants.values()) {
      teamChatNamespace()?.to(p.socketId).emit("call:declined", { callId: c.callId, userId: me.userId, name: me.fullName });
    }
    // Declining a 1:1, or the last person ringing declining with nobody connected, ends it.
    if (c.kind === "direct" || (!c.connectedAt && c.ringing.size === 0)) void endCall(c, "declined");
  });

  socket.on("call:leave", (data: { callId?: string } = {}) => {
    const c = own(data.callId);
    if (!c || c.participants.get(me.userId)?.socketId !== socket.id) return;
    leave(c, me.userId, "hangup");
  });

  // Ring members of the chat who aren't in the call (Teams' "Ask to join").
  socket.on("call:ring", (data: { callId?: string; userIds?: unknown } = {}) => {
    if (rateLimited(socket)) return;
    const c = own(data.callId);
    if (!c || !c.participants.has(me.userId) || !Array.isArray(data.userIds)) return;
    const targets = data.userIds.filter(
      (id): id is string => typeof id === "string" && c.memberIds.includes(id) && !c.participants.has(id) && !c.ringing.has(id)
    );
    if (!targets.length) return;
    targets.forEach((id) => c.ringing.add(id));
    emitToUsers(targets, "call:incoming", {
      callId: c.callId,
      conversationId: c.conversationId,
      fromUserId: me.userId,
      fromName: me.fullName,
      video: c.video,
      title: c.kind === "direct" ? null : "Group call",
    });
    setTimeout(() => {
      const still = targets.filter((id) => c.ringing.delete(id));
      if (still.length) emitToUsers(still, "call:dismiss", { callId: c.callId });
    }, RING_MS);
  });

  // Lobby: anyone already in the call can let a waiting guest in, or turn them away.
  socket.on("call:admit", (data: { conversationId?: string; guestId?: string } = {}) => {
    if (me.guest || typeof data.conversationId !== "string" || typeof data.guestId !== "string") return;
    const c = runningCallFor(data.conversationId);
    const guest = lobby.get(data.conversationId)?.get(data.guestId);
    if (!c || !guest || c.participants.get(me.userId)?.socketId !== socket.id) return;
    admitGuest(c, guest);
  });

  socket.on("call:deny", (data: { conversationId?: string; guestId?: string } = {}) => {
    if (me.guest || typeof data.conversationId !== "string" || typeof data.guestId !== "string") return;
    const c = runningCallFor(data.conversationId);
    const waiting = lobby.get(data.conversationId);
    const guest = waiting?.get(data.guestId);
    if (!c || !guest || c.participants.get(me.userId)?.socketId !== socket.id) return;
    waiting!.delete(guest.userId);
    teamChatNamespace()?.to(guest.socketId).emit("call:ended", { callId: null, reason: "denied" });
    void announceLobby(c.organizationId, c.conversationId);
  });

  // SDP / ICE, point to point between two participants of the same call.
  socket.on("call:signal", (data: { callId?: string; toUserId?: string; signal?: unknown } = {}) => {
    if (rateLimited(socket, 2000)) return;
    const c = own(data.callId);
    if (!c || c.participants.get(me.userId)?.socketId !== socket.id || typeof data.toUserId !== "string") return;
    const target = c.participants.get(data.toUserId);
    if (target) teamChatNamespace()?.to(target.socketId).emit("call:signal", { callId: c.callId, fromUserId: me.userId, signal: data.signal });
  });

  // Mic / camera / screen / hand / recording state, shown on everyone's tiles.
  socket.on("call:media", (data: Record<string, unknown> = {}) => {
    if (rateLimited(socket, 600)) return;
    const c = own(data.callId);
    if (!c || c.participants.get(me.userId)?.socketId !== socket.id) return;
    const state = {
      callId: c.callId,
      userId: me.userId,
      mic: data.mic === true,
      cam: data.cam === true,
      sharing: data.sharing === true,
      hand: data.hand === true,
      recording: data.recording === true,
    };
    for (const p of c.participants.values()) if (p.userId !== me.userId) teamChatNamespace()?.to(p.socketId).emit("call:peer-media", state);
  });
}

export function leaveCallsFor(socket: Socket) {
  for (const c of calls.values()) {
    for (const p of c.participants.values()) {
      if (p.socketId === socket.id) leave(c, p.userId, "disconnected");
    }
  }
}

// --- guest lobby -------------------------------------------------------------

interface LobbyGuest {
  userId: string;
  name: string;
  socketId: string;
  requireApproval: boolean;
  since: number;
}

/** Guests waiting to get in, per chat. */
const lobby = new Map<string, Map<string, LobbyGuest>>();

function runningCallFor(conversationId: string): ActiveCall | undefined {
  for (const c of calls.values()) if (c.conversationId === conversationId) return c;
  return undefined;
}

/** Tell the chat's members who is waiting (they see it as a banner / toast). */
async function announceLobby(organizationId: string, conversationId: string) {
  const guests = Array.from(lobby.get(conversationId)?.values() ?? []).map(({ userId, name, since }) => ({ userId, name, since }));
  const running = runningCallFor(conversationId);
  const memberIds =
    running?.memberIds ??
    (await runForOrg(organizationId, async () => (await service()).conversationMemberIds(conversationId), { label: "teamChat:lobby" }).catch(() => []));
  emitToUsers(memberIds, "call:lobby", { conversationId, callId: running?.callId ?? null, guests });
}

function admitGuest(c: ActiveCall, guest: LobbyGuest) {
  lobby.get(c.conversationId)?.delete(guest.userId);
  if (c.participants.size >= MAX_PARTICIPANTS) {
    teamChatNamespace()?.to(guest.socketId).emit("call:ended", { callId: c.callId, reason: "full" });
    void announceLobby(c.organizationId, c.conversationId);
    return;
  }
  const existing = Array.from(c.participants.values());
  c.participants.set(guest.userId, { userId: guest.userId, name: guest.name, socketId: guest.socketId, joinedAt: Date.now() });
  if (!c.connectedAt && c.participants.size >= 2) c.connectedAt = Date.now();
  teamChatNamespace()?.to(guest.socketId).emit("call:joined", joinPayload(c, guest.userId));
  for (const p of existing) {
    teamChatNamespace()?.to(p.socketId).emit("call:peer-joined", { callId: c.callId, userId: guest.userId, name: guest.name });
  }
  broadcastState(c);
  void announceLobby(c.organizationId, c.conversationId);
}

/** Links without a lobby let guests straight in once a call is running. */
function admitWaiting(c: ActiveCall) {
  const waiting = lobby.get(c.conversationId);
  if (!waiting?.size) return;
  for (const g of Array.from(waiting.values())) if (!g.requireApproval) admitGuest(c, g);
  void announceLobby(c.organizationId, c.conversationId);
}

export function registerGuestLobby(socket: Socket, me: Member) {
  const guest = me.guest!;
  socket.on("call:knock", () => {
    if (rateLimited(socket, 20)) return;
    const waiting = lobby.get(guest.conversationId) ?? new Map<string, LobbyGuest>();
    lobby.set(guest.conversationId, waiting);
    const entry: LobbyGuest = { userId: me.userId, name: me.fullName, socketId: socket.id, requireApproval: guest.requireApproval, since: Date.now() };
    waiting.set(me.userId, entry);
    const running = runningCallFor(guest.conversationId);
    if (running && !guest.requireApproval) return admitGuest(running, entry);
    socket.emit("call:waiting", { reason: running ? "approval" : "no_call" });
    void announceLobby(me.organizationId, guest.conversationId);
  });
  socket.on("disconnect", () => {
    if (lobby.get(guest.conversationId)?.delete(me.userId)) void announceLobby(me.organizationId, guest.conversationId);
  });
}
