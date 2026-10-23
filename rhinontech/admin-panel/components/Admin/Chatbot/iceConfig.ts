/**
 * ICE (STUN/TURN) servers for the agent's side of a voice call.
 *
 * TURN credentials are never built into the admin bundle: the backend mints
 * short-lived ones for signed-in agents (services/turnCredentials.ts). If that
 * fails the call still tries with public STUN.
 */
import { apiFetch } from "@/lib/api";

const STUN_ONLY: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302"] }];

export async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const { iceServers } = await apiFetch<{ iceServers: RTCIceServer[] }>("/chatbots/ice-servers");
    return iceServers?.length ? iceServers : STUN_ONLY;
  } catch {
    return STUN_ONLY;
  }
}
