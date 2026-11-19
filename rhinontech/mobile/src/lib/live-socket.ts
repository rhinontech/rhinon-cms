/**
 * Shared Socket.IO client for the /team-chat namespace.
 * Connect on login, disconnect on logout — called from api.ts setSession.
 * The same socket is used by both chat and call signaling.
 */
import { io, type Socket } from "socket.io-client";
import { API_BASE, getSession } from "./api";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): void {
  const session = getSession();
  if (!session?.token || socket?.connected) return;
  socket?.disconnect();
  socket = io(`${API_BASE}/team-chat`, {
    auth: { token: session.token },
    transports: ["websocket"],
    reconnectionDelayMax: 10_000,
  });
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
