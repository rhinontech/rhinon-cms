import type { Server, Socket } from "socket.io";

/**
 * WebRTC voice call signaling between agents and visitors.
 *
 * Implements the Saleszium signaling contract:
 *   - register_manual: bind socket to a callId (visitorId or agent email/id)
 *   - call_user_manual: initiate call to targetCallId
 *   - call_request_manual: dispatched to target with caller info
 *   - call_accepted_manual / call_rejected_manual: callee acceptance response
 *   - offer_manual / answer_manual: SDP offer/answer exchange
 *   - ice_candidate_manual: ICE candidate routing
 *   - end_call_manual / call_ended_manual: tear down active call
 */

interface ManualUser {
  callId: string;
  username: string;
  organizationId?: string;
}

const manualUsers = new Map<string, ManualUser>();
const callIdToSockets = new Map<string, Set<string>>();
const activeCalls = new Map<string, string>(); // socket.id -> peerSocket.id

export function registerManualUser(
  socketId: string,
  callId: string,
  username: string,
  organizationId?: string
) {
  if (!callId || !username) return;

  manualUsers.set(socketId, { callId, username, organizationId });
  let set = callIdToSockets.get(callId);
  if (!set) {
    set = new Set<string>();
    callIdToSockets.set(callId, set);
  }
  set.add(socketId);
}

export function unregisterManualUser(socketId: string) {
  const user = manualUsers.get(socketId);
  if (user) {
    const set = callIdToSockets.get(user.callId);
    if (set) {
      set.delete(socketId);
      if (set.size === 0) {
        callIdToSockets.delete(user.callId);
      }
    }
    manualUsers.delete(socketId);
  }
}

export function attachCallSignaling(io: Server, socket: Socket) {
  socket.on("register_manual", (data: { callId?: string; username?: string }) => {
    const callId = typeof data?.callId === "string" ? data.callId.trim() : "";
    const username = typeof data?.username === "string" ? data.username.trim() : "User";
    if (!callId) return;

    registerManualUser(socket.id, callId, username);
    socket.emit("registered_manual", { callId });
    console.log(`[Call] Registered manual user: ${username} (${callId}) on socket ${socket.id}`);
  });

  socket.on("call_user_manual", (data: { targetCallId?: string }) => {
    const targetCallId = typeof data?.targetCallId === "string" ? data.targetCallId.trim() : "";
    const caller = manualUsers.get(socket.id);

    if (!caller) {
      console.warn(`[Call] Caller on socket ${socket.id} not registered`);
      socket.emit("call_error", { message: "Caller not registered. Please refresh." });
      socket.emit("error", "Caller not registered.");
      return;
    }

    if (!targetCallId) {
      socket.emit("call_error", { message: "Invalid target user." });
      return;
    }

    const targetSockets = callIdToSockets.get(targetCallId);
    if (!targetSockets || targetSockets.size === 0) {
      console.log(`[Call] User ${targetCallId} not found or offline`);
      socket.emit("call_error", { message: "User not found or offline." });
      socket.emit("error", "User not found or offline.");
      return;
    }

    // Forward incoming call request to all active sockets for this user/visitor
    for (const targetSocketId of targetSockets) {
      io.to(targetSocketId).emit("call_request_manual", {
        from: socket.id,
        fromName: caller.username,
        fromCallId: caller.callId,
      });
    }

    console.log(`[Call] Call initiated: ${caller.username} (${caller.callId}) → ${targetCallId} (${targetSockets.size} socket(s))`);
  });

  socket.on("call_accepted_manual", (data: { to?: string }) => {
    const targetSocketId = data?.to;
    if (!targetSocketId) return;

    // Track active peer connection pair
    activeCalls.set(socket.id, targetSocketId);
    activeCalls.set(targetSocketId, socket.id);

    console.log(`[Call] Call accepted by ${socket.id}, forwarding to ${targetSocketId}`);
    io.to(targetSocketId).emit("call_accepted_manual", { from: socket.id });
  });

  socket.on("call_rejected_manual", (data: { to?: string }) => {
    const targetSocketId = data?.to;
    if (targetSocketId) {
      activeCalls.delete(socket.id);
      activeCalls.delete(targetSocketId);
      console.log(`[Call] Call rejected by ${socket.id}, notifying ${targetSocketId}`);
      io.to(targetSocketId).emit("call_rejected_manual", { from: socket.id });
    }
  });

  socket.on("offer_manual", (data: { offer?: unknown; to?: string }) => {
    if (data?.to && data?.offer) {
      io.to(data.to).emit("offer_manual", { offer: data.offer, from: socket.id });
    }
  });

  socket.on("answer_manual", (data: { answer?: unknown; to?: string }) => {
    if (data?.to && data?.answer) {
      io.to(data.to).emit("answer_manual", { answer: data.answer, from: socket.id });
    }
  });

  socket.on("ice_candidate_manual", (data: { candidate?: unknown; to?: string }) => {
    if (data?.to && data?.candidate) {
      io.to(data.to).emit("ice_candidate_manual", { candidate: data.candidate, from: socket.id });
    }
  });

  socket.on("end_call_manual", (data?: { to?: string }) => {
    const caller = manualUsers.get(socket.id);
    const peerSocketId = data?.to || activeCalls.get(socket.id);

    if (peerSocketId) {
      io.to(peerSocketId).emit("call_ended_manual", {
        from: socket.id,
        fromCallId: caller?.callId ?? "",
      });
      activeCalls.delete(peerSocketId);
    }
    activeCalls.delete(socket.id);
    console.log(`[Call] Call ended by ${caller?.callId ?? socket.id}`);
  });

  socket.on("disconnect", () => {
    // If socket was in active call, notify remote peer
    const peerSocketId = activeCalls.get(socket.id);
    if (peerSocketId) {
      const caller = manualUsers.get(socket.id);
      io.to(peerSocketId).emit("call_ended_manual", {
        from: socket.id,
        fromCallId: caller?.callId ?? "",
      });
      activeCalls.delete(peerSocketId);
    }
    activeCalls.delete(socket.id);
    unregisterManualUser(socket.id);
  });
}
