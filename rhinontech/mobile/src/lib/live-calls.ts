/**
 * WebRTC voice/video calls for the mobile app.
 *
 * Mirrors the admin panel's calls.ts signaling contract exactly so the two
 * clients interoperate with the same backend (teamChat/calls.ts).
 *
 * Requires react-native-webrtc and a development build (not Expo Go).
 * APNs / TURN credentials are still needed to work over cellular or between
 * different networks, but LAN calls work without TURN.
 */
// react-native-webrtc touches a native event emitter at import time, which
// crashes in Expo Go. Load it lazily (only when a call actually starts) so
// all other screens remain usable in Expo Go.
import type { MediaStream } from "react-native-webrtc"; // type-only: safe everywhere

type RNWebRTC = typeof import("react-native-webrtc");
let _rnw: RNWebRTC | null = null;
function getRNW(): RNWebRTC | null {
  if (_rnw) return _rnw;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _rnw = require("react-native-webrtc") as RNWebRTC;
  } catch {
    return null;
  }
  return _rnw;
}

import { create } from "zustand";
import { api } from "./api";
import { getSocket } from "./live-socket";

// ── Types ────────────────────────────────────────────────────────────────────

export type CallPhase = "idle" | "incoming" | "joining" | "active" | "ended";

export interface PeerState {
  userId: string;
  name: string;
  stream: MediaStream | null;
  mic: boolean;
  cam: boolean;
}

export interface IncomingCall {
  callId: string;
  conversationId: string;
  fromUserId: string;
  fromName: string;
  video: boolean;
  title: string | null;
}

interface CallState {
  phase: CallPhase;
  callId: string | null;
  conversationId: string | null;
  title: string;
  incoming: IncomingCall | null;
  peers: Record<string, PeerState>;
  localStream: MediaStream | null;
  micOn: boolean;
  camOn: boolean;
  endedReason: string | null;
}

// ── Store ────────────────────────────────────────────────────────────────────

const IDLE: CallState = {
  phase: "idle", callId: null, conversationId: null, title: "",
  incoming: null, peers: {}, localStream: null,
  micOn: true, camOn: false, endedReason: null,
};

export const useCall = create<CallState>(() => ({ ...IDLE }));
const set = useCall.setState;
const get = useCall.getState;

// ── Peer connections ─────────────────────────────────────────────────────────

type IceServer = { urls: string | string[]; username?: string; credential?: string };
const pcs = new Map<string, RTCPeerConnection>();
const pendingIce = new Map<string, RTCIceCandidateInit[]>();
let iceServersCache: IceServer[] | null = null;

async function ensureIceServers(): Promise<IceServer[]> {
  if (iceServersCache) return iceServersCache;
  try {
    const r = await api<{ iceServers: IceServer[] }>("/team-chat/ice-servers");
    iceServersCache = r.iceServers;
  } catch {
    iceServersCache = [{ urls: "stun:stun.l.google.com:19302" }];
  }
  return iceServersCache!;
}

function emit(event: string, data: unknown): void {
  getSocket()?.emit(event, data);
}

function patchPeer(userId: string, patch: Partial<PeerState>): void {
  const prev: PeerState = get().peers[userId] ?? { userId, name: "", stream: null, mic: true, cam: false };
  set({ peers: { ...get().peers, [userId]: { ...prev, ...patch } } });
}

function dropPeer(userId: string): void {
  pcs.get(userId)?.close();
  pcs.delete(userId);
  pendingIce.delete(userId);
  const peers = { ...get().peers };
  delete peers[userId];
  set({ peers });
}

async function createPeer(userId: string, name: string, initiator: boolean): Promise<RTCPeerConnection | null> {
  const rnw = getRNW();
  if (!rnw) return null;
  (pcs.get(userId) as any)?.close();
  const iceServers = await ensureIceServers();
  const pc = new rnw.RTCPeerConnection({ iceServers } as any) as unknown as RTCPeerConnection;
  pcs.set(userId, pc);
  patchPeer(userId, { name });

  const { localStream, callId } = get();
  if (initiator && localStream) {
    localStream.getTracks().forEach((t) => (pc as any).addTrack(t, localStream));
  }

  const remote = new rnw.MediaStream(undefined as any) as unknown as MediaStream;
  (pc as any).ontrack = (e: { streams?: MediaStream[]; track: MediaStreamTrack }) => {
    const src = e.streams?.[0];
    if (src) {
      src.getTracks().forEach((t) => {
        if (!remote.getTracks().includes(t as any)) remote.addTrack(t as any);
      });
    }
    patchPeer(userId, { stream: new rnw.MediaStream(remote.getTracks() as any) as unknown as MediaStream });
  };

  (pc as any).onicecandidate = (e: { candidate: RTCIceCandidateInit | null }) => {
    if (e.candidate) emit("call:signal", { callId, toUserId: userId, signal: { candidate: (e.candidate as any).toJSON?.() ?? e.candidate } });
  };

  if (initiator) {
    const offer = await (pc as any).createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    emit("call:signal", { callId, toUserId: userId, signal: { description: { type: offer.type, sdp: offer.sdp } } });
  }
  return pc as unknown as RTCPeerConnection;
}

type SignalPayload = { description?: { type: string; sdp: string }; candidate?: RTCIceCandidateInit };

async function onSignal(fromUserId: string, signal: SignalPayload): Promise<void> {
  const rnw = getRNW();
  if (!rnw) return;
  let pc = pcs.get(fromUserId);
  if (signal.description?.type === "offer") {
    if (!pc) pc = (await createPeer(fromUserId, get().peers[fromUserId]?.name ?? "", false)) ?? undefined;
    if (!pc) return;
    await (pc as any).setRemoteDescription(new rnw.RTCSessionDescription(signal.description as any));
    const { localStream } = get();
    if (localStream && !(pc as any).getSenders?.()?.length) {
      localStream.getTracks().forEach((t) => (pc as any).addTrack(t, localStream));
    }
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    emit("call:signal", { callId: get().callId, toUserId: fromUserId, signal: { description: { type: answer.type, sdp: answer.sdp } } });
    for (const c of pendingIce.get(fromUserId) ?? []) await pc.addIceCandidate(new rnw.RTCIceCandidate(c) as any).catch(() => {});
    pendingIce.delete(fromUserId);
    return;
  }
  if (!pc) return;
  if (signal.description) {
    await (pc as any).setRemoteDescription(new rnw.RTCSessionDescription(signal.description as any));
    for (const c of pendingIce.get(fromUserId) ?? []) await pc.addIceCandidate(new rnw.RTCIceCandidate(c) as any).catch(() => {});
    pendingIce.delete(fromUserId);
  } else if (signal.candidate) {
    if (pc.remoteDescription) await pc.addIceCandidate(new rnw.RTCIceCandidate(signal.candidate) as any).catch(() => {});
    else pendingIce.set(fromUserId, [...(pendingIce.get(fromUserId) ?? []), signal.candidate]);
  }
}

// ── Media ────────────────────────────────────────────────────────────────────

async function prepareMedia(video: boolean): Promise<boolean> {
  const rnw = getRNW();
  if (!rnw) return false;
  try {
    const stream = await rnw.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    });
    set({ localStream: stream as unknown as MediaStream, micOn: true, camOn: video });
    return true;
  } catch {
    return false;
  }
}

function broadcastMedia(): void {
  const { callId, micOn, camOn } = get();
  if (!callId) return;
  emit("call:media", { callId, mic: micOn, cam: camOn, sharing: false, hand: false, recording: false });
}

function cleanup(): void {
  for (const pc of pcs.values()) pc.close();
  pcs.clear();
  pendingIce.clear();
  get().localStream?.getTracks().forEach((t) => (t as any).stop?.());
  iceServersCache = null;
  set({ ...IDLE });
}

// ── Public actions ────────────────────────────────────────────────────────────

export async function startCall(conversationId: string, video: boolean, title: string): Promise<void> {
  if (get().phase !== "idle") return;
  const socket = getSocket();
  if (!socket?.connected) return;
  set({ phase: "joining", conversationId, title });
  if (!(await prepareMedia(video))) { set({ ...IDLE }); return; }
  const callId = Math.random().toString(36).slice(2);
  set({ callId });
  emit("call:start", { callId, conversationId, video });
}

export async function acceptCall(withVideo?: boolean): Promise<void> {
  const { incoming, phase } = get();
  if (phase !== "incoming" || !incoming) return;
  set({ phase: "joining", callId: incoming.callId, conversationId: incoming.conversationId, title: incoming.title ?? incoming.fromName, incoming: null });
  if (!(await prepareMedia(withVideo ?? incoming.video))) {
    emit("call:decline", { callId: incoming.callId });
    set({ ...IDLE });
    return;
  }
  emit("call:join", { callId: incoming.callId });
}

export function declineCall(): void {
  const { incoming } = get();
  if (incoming) emit("call:decline", { callId: incoming.callId });
  set({ phase: "idle", incoming: null });
}

export function hangUp(): void {
  const { callId } = get();
  if (callId) emit("call:leave", { callId });
  cleanup();
}

export function toggleMic(): void {
  const { localStream, micOn } = get();
  localStream?.getAudioTracks().forEach((t) => { (t as any).enabled = !micOn; });
  set({ micOn: !micOn });
  broadcastMedia();
}

export function toggleCamera(): void {
  const { localStream, camOn } = get();
  localStream?.getVideoTracks().forEach((t) => { (t as any).enabled = !camOn; });
  set({ camOn: !camOn });
  broadcastMedia();
}

// ── Socket event bindings ─────────────────────────────────────────────────────

export function bindCallEvents(): () => void {
  const socket = getSocket();
  if (!socket) return () => {};

  const onIncoming = (d: IncomingCall) => {
    if (get().phase !== "idle") return;
    set({ phase: "incoming", incoming: d });
  };

  const onDismiss = (d: { callId: string }) => {
    if (get().incoming?.callId === d.callId) set({ phase: "idle", incoming: null });
  };

  const onJoined = async (d: { callId: string; conversationId: string; participants: { userId: string; name: string }[] }) => {
    if (get().callId !== d.callId) return;
    set({ phase: "active", conversationId: d.conversationId });
    broadcastMedia();
    for (const p of d.participants) await createPeer(p.userId, p.name, true);
  };

  const onPeerJoined = (d: { callId: string; userId: string; name: string }) => {
    if (get().callId !== d.callId) return;
    patchPeer(d.userId, { name: d.name });
    broadcastMedia();
  };

  const onPeerLeft = (d: { callId: string; userId: string }) => {
    if (get().callId === d.callId) dropPeer(d.userId);
  };

  const onPeerMedia = (d: { callId: string; userId: string; mic: boolean; cam: boolean }) => {
    if (get().callId !== d.callId) return;
    patchPeer(d.userId, { mic: d.mic, cam: d.cam });
  };

  const onSignalEvent = (d: { callId: string; fromUserId: string; signal: SignalPayload }) => {
    if (get().callId === d.callId) void onSignal(d.fromUserId, d.signal ?? {});
  };

  const onEnded = (d: { callId: string; reason: string }) => {
    if (get().incoming?.callId === d.callId) set({ phase: "idle", incoming: null });
    if (get().callId !== d.callId) return;
    cleanup();
  };

  socket.on("call:incoming", onIncoming);
  socket.on("call:dismiss", onDismiss);
  socket.on("call:joined", onJoined);
  socket.on("call:peer-joined", onPeerJoined);
  socket.on("call:peer-left", onPeerLeft);
  socket.on("call:peer-media", onPeerMedia);
  socket.on("call:signal", onSignalEvent);
  socket.on("call:ended", onEnded);

  return () => {
    socket.off("call:incoming", onIncoming);
    socket.off("call:dismiss", onDismiss);
    socket.off("call:joined", onJoined);
    socket.off("call:peer-joined", onPeerJoined);
    socket.off("call:peer-left", onPeerLeft);
    socket.off("call:peer-media", onPeerMedia);
    socket.off("call:signal", onSignalEvent);
    socket.off("call:ended", onEnded);
  };
}
