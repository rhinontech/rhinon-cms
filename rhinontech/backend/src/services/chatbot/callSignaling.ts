import type { Server, Socket } from "socket.io";

/**
 * WebRTC voice calls from an agent (admin panel) to a visitor (chat widget).
 *
 * Event names follow the Saleszium contract the widget and admin already speak:
 *   agent   → call_user_manual { targetCallId }        ring a visitor
 *   visitor ← call_request_manual { from, fromName }    the ring (to every socket of that visitor)
 *   visitor → call_accepted_manual / call_rejected_manual { to }
 *   both    ↔ offer_manual / answer_manual / ice_candidate_manual { to }
 *   either  → end_call_manual                           hang up, or cancel while ringing
 *   both    ← call_ended_manual { reason }              the call is over for this socket
 *   agent   ← call_error { message }
 *
 * Identity comes from the server, never the client: agents are the signed-in
 * user of an authenticated socket, visitors are the visitorId their widget
 * connected with, tied to that bot's workspace. An agent can only ring visitors
 * of their own workspace, and offers/answers/ICE are relayed only between the
 * two sockets of one call — never to an arbitrary socket id.
 *
 * Every call lives in `calls` from the first ring until it ends, so a cancel,
 * a timeout or a dropped socket always reaches the other side (before, an
 * agent hanging up while it rang left the visitor's widget ringing forever).
 */

/** How long a visitor's widget rings before the call counts as missed. */
const RING_TIMEOUT_MS = 30_000;

type EndReason = "cancelled" | "missed" | "declined" | "ended" | "answered_elsewhere" | "disconnected" | "failed";

interface AgentIdentity {
  userId: string;
  name: string;
  organizationId: string;
}

interface VisitorIdentity {
  visitorId: string;
  organizationId: string;
}

interface Call {
  id: string;
  organizationId: string;
  agentSocketId: string;
  agentName: string;
  visitorId: string;
  /** Every socket the visitor had open when the call started; all of them ring. */
  ringingSocketIds: Set<string>;
  /** The visitor socket that picked up, once answered. */
  visitorSocketId: string | null;
  state: "ringing" | "active";
  timeout: NodeJS.Timeout | null;
}

const agents = new Map<string, AgentIdentity>(); // socket id → agent
const visitors = new Map<string, VisitorIdentity>(); // socket id → visitor
const calls = new Map<string, Call>(); // call id → call
const callBySocket = new Map<string, string>(); // socket id → call id

let ioRef: Server | null = null;
let nextId = 0;

/** Called once the agent's socket has authenticated (realtime.ts → handleAgent). */
export function registerAgentSocket(socketId: string, agent: AgentIdentity) {
  agents.set(socketId, agent);
}

/** Called once the visitor's bot is resolved, so we know the workspace (realtime.ts → handleVisitor). */
export function registerVisitorSocket(socketId: string, visitor: VisitorIdentity) {
  visitors.set(socketId, visitor);
}

function visitorSocketsFor(organizationId: string, visitorId: string): string[] {
  const out: string[] = [];
  for (const [socketId, v] of visitors) {
    if (v.visitorId === visitorId && v.organizationId === organizationId) out.push(socketId);
  }
  return out;
}

/**
 * Whether this visitor has a call ringing or in progress with an agent of this
 * workspace — the only time the widget is handed TURN credentials.
 */
export function visitorHasCall(organizationId: string, visitorId: string): boolean {
  for (const call of calls.values()) if (call.organizationId === organizationId && call.visitorId === visitorId) return true;
  return false;
}

const emit = (socketId: string, event: string, data: unknown) => ioRef?.to(socketId).emit(event, data);

/** Tears the call down and tells everyone still involved why. */
function finish(call: Call, reason: EndReason, by: string | null) {
  if (!calls.has(call.id)) return;
  calls.delete(call.id);
  if (call.timeout) clearTimeout(call.timeout);

  const involved = new Set<string>([call.agentSocketId, ...call.ringingSocketIds]);
  if (call.visitorSocketId) involved.add(call.visitorSocketId);
  for (const socketId of involved) {
    callBySocket.delete(socketId);
    if (socketId !== by) emit(socketId, "call_ended_manual", { reason, callId: call.id });
  }
  console.log(`[Call] ${call.id} ${reason}`);
}

/** The call this socket is in, if the `to` it names is really its peer. */
function peerOf(socketId: string, to: unknown): string | null {
  const call = calls.get(callBySocket.get(socketId) ?? "");
  if (!call || call.state !== "active" || typeof to !== "string") return null;
  const peer = socketId === call.agentSocketId ? call.visitorSocketId : call.agentSocketId;
  return peer && peer === to ? peer : null;
}

export function attachCallSignaling(io: Server, socket: Socket) {
  ioRef = io;

  // Kept for older widgets/admins. Identity is assigned by the server, so the
  // callId a client claims is ignored.
  socket.on("register_manual", () => {
    const callId = agents.get(socket.id)?.userId ?? visitors.get(socket.id)?.visitorId;
    if (callId) socket.emit("registered_manual", { callId });
  });

  socket.on("call_user_manual", (data: { targetCallId?: unknown }) => {
    const agent = agents.get(socket.id);
    if (!agent) return void socket.emit("call_error", { message: "Only signed-in agents can start calls." });
    if (callBySocket.has(socket.id)) return void socket.emit("call_error", { message: "You're already on a call." });

    const visitorId = typeof data?.targetCallId === "string" ? data.targetCallId.trim().slice(0, 128) : "";
    const targets = visitorId ? visitorSocketsFor(agent.organizationId, visitorId) : [];
    if (!targets.length) return void socket.emit("call_error", { message: "This visitor has left the site." });
    if (targets.some((id) => callBySocket.has(id))) return void socket.emit("call_error", { message: "This visitor is already on a call." });

    const call: Call = {
      id: `call_${Date.now().toString(36)}_${(nextId++).toString(36)}`,
      organizationId: agent.organizationId,
      agentSocketId: socket.id,
      agentName: agent.name,
      visitorId,
      ringingSocketIds: new Set(targets),
      visitorSocketId: null,
      state: "ringing",
      timeout: null,
    };
    calls.set(call.id, call);
    callBySocket.set(socket.id, call.id);
    for (const id of targets) {
      callBySocket.set(id, call.id);
      // Only the agent's name: their email or user id is nothing a visitor needs.
      emit(id, "call_request_manual", { from: socket.id, fromName: agent.name, fromCallId: call.id, callId: call.id });
    }
    call.timeout = setTimeout(() => finish(call, "missed", null), RING_TIMEOUT_MS);
    socket.emit("call_ringing_manual", { callId: call.id });
    console.log(`[Call] ${call.id} ${agent.name} → visitor ${visitorId} (${targets.length} socket(s))`);
  });

  socket.on("call_accepted_manual", () => {
    const call = calls.get(callBySocket.get(socket.id) ?? "");
    if (!call || call.state !== "ringing" || !call.ringingSocketIds.has(socket.id)) return;
    if (call.timeout) clearTimeout(call.timeout);
    call.timeout = null;
    call.state = "active";
    call.visitorSocketId = socket.id;
    // Stop the ring on the visitor's other tabs and connections.
    for (const id of call.ringingSocketIds) {
      if (id === socket.id) continue;
      callBySocket.delete(id);
      emit(id, "call_ended_manual", { reason: "answered_elsewhere", callId: call.id });
    }
    call.ringingSocketIds = new Set([socket.id]);
    emit(call.agentSocketId, "call_accepted_manual", { from: socket.id, callId: call.id });
  });

  socket.on("call_rejected_manual", () => {
    const call = calls.get(callBySocket.get(socket.id) ?? "");
    if (!call || call.state !== "ringing" || !call.ringingSocketIds.has(socket.id)) return;
    emit(call.agentSocketId, "call_rejected_manual", { from: socket.id, callId: call.id });
    finish(call, "declined", call.agentSocketId);
  });

  for (const [event, field] of [
    ["offer_manual", "offer"],
    ["answer_manual", "answer"],
    ["ice_candidate_manual", "candidate"],
  ] as const) {
    socket.on(event, (data: Record<string, unknown>) => {
      const peer = peerOf(socket.id, data?.to);
      if (peer && data?.[field]) emit(peer, event, { [field]: data[field], from: socket.id });
    });
  }

  socket.on("end_call_manual", (data?: { reason?: unknown }) => {
    const call = calls.get(callBySocket.get(socket.id) ?? "");
    if (!call) return;
    const failed = data?.reason === "failed";
    // An agent hanging up while it still rings is a cancel.
    finish(call, failed ? "failed" : call.state === "ringing" ? "cancelled" : "ended", socket.id);
  });

  socket.on("disconnect", () => {
    const call = calls.get(callBySocket.get(socket.id) ?? "");
    if (call) {
      if (socket.id === call.agentSocketId || socket.id === call.visitorSocketId) {
        finish(call, "disconnected", socket.id);
      } else {
        // One of several ringing visitor sockets went away; the rest keep ringing.
        call.ringingSocketIds.delete(socket.id);
        callBySocket.delete(socket.id);
        if (call.state === "ringing" && call.ringingSocketIds.size === 0) finish(call, "disconnected", socket.id);
      }
    }
    agents.delete(socket.id);
    visitors.delete(socket.id);
  });
}
