import { create } from "zustand";
import { toast } from "sonner";
import { teamChatApi, teamChatSocket } from "./teamChatApi";
import { createBlurredTrack, type BlurPipeline } from "./backgroundBlur";
import { downloadRecording, startRecording, type CallRecording } from "./callRecorder";

/**
 * Team calls over WebRTC, 1:1 or small groups. Mesh topology: one
 * RTCPeerConnection per other participant. The server (services/teamChat/calls.ts)
 * relays signaling between participants only.
 *
 * Negotiation rule: whoever joins later sends the offer to each person already
 * in the call. Every connection carries exactly one audio and one video
 * transceiver; switching camera / blur / screen share swaps the outgoing video
 * track with replaceTrack, so nothing is ever renegotiated mid-call.
 */

export const MAX_PARTICIPANTS = 8;

export type CallPhase = "idle" | "incoming" | "joining" | "lobby" | "active" | "ended";

export interface PeerState {
  userId: string;
  name: string;
  stream: MediaStream | null;
  connection: RTCPeerConnectionState | "new";
  mic: boolean;
  cam: boolean;
  sharing: boolean;
  hand: boolean;
  recording: boolean;
}

export interface ActiveCallInfo {
  callId: string;
  conversationId: string;
  video: boolean;
  callerId: string;
  participantIds: string[];
  participantNames?: Record<string, string>;
  startedAt: number;
}

export interface LobbyGuest {
  userId: string;
  name: string;
  since: number;
}

interface IncomingCall {
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
  /** What everyone else currently sees from me (camera, blurred camera, or screen). */
  outgoingVideo: MediaStreamTrack | null;
  micOn: boolean;
  camOn: boolean;
  sharing: boolean;
  hand: boolean;
  blur: boolean;
  blurLoading: boolean;
  recording: boolean;
  startedAt: number | null;
  devices: { audioIn: string | null; videoIn: string | null; audioOut: string | null };
  /** Calls running in my chats (for the Join banner), keyed by conversation. */
  active: Record<string, ActiveCallInfo>;
  /** Guests waiting to be let in, keyed by conversation. */
  lobby: Record<string, LobbyGuest[]>;
  /** Guests only: why they're waiting, and why the call ended. */
  waitingReason: "approval" | "no_call" | null;
  endedReason: string | null;
}

const idle = {
  phase: "idle" as CallPhase,
  callId: null,
  conversationId: null,
  title: "",
  incoming: null,
  peers: {},
  localStream: null,
  outgoingVideo: null,
  micOn: true,
  camOn: false,
  sharing: false,
  hand: false,
  blur: false,
  blurLoading: false,
  recording: false,
  startedAt: null,
  waitingReason: null as CallState["waitingReason"],
};

const savedDevices = (): CallState["devices"] => {
  try {
    return JSON.parse(localStorage.getItem("team-chat:devices") ?? "null") ?? { audioIn: null, videoIn: null, audioOut: null };
  } catch {
    return { audioIn: null, videoIn: null, audioOut: null };
  }
};

export const useCall = create<CallState>(() => ({
  ...idle,
  devices: { audioIn: null, videoIn: null, audioOut: null },
  active: {},
  lobby: {},
  endedReason: null,
}));

const pcs = new Map<string, RTCPeerConnection>();
const pendingIce = new Map<string, RTCIceCandidateInit[]>();
let iceServers: RTCIceServer[] | null = null;
let cameraTrack: MediaStreamTrack | null = null;
let screenTrack: MediaStreamTrack | null = null;
let blurPipeline: BlurPipeline | null = null;
let recording: CallRecording | null = null;

const set = useCall.setState;
const get = useCall.getState;
const emit = (event: string, data: unknown) => teamChatSocket()?.emit(event, data);

export const screenShareSupported = () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;

// --- ringtone ----------------------------------------------------------------

const ringtone = (() => {
  let ctx: AudioContext | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  const beep = () => {
    if (!ctx) return;
    for (const [f, t] of [[660, 0], [880, 0.18]] as const) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.07, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.4);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.4);
    }
  };
  return {
    start() {
      try {
        ctx ??= new AudioContext();
        void ctx.resume();
        beep();
        timer = setInterval(beep, 2000);
      } catch {
        /* autoplay blocked — the visual ring still shows */
      }
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
})();

// --- media -------------------------------------------------------------------

function persistDevices(devices: CallState["devices"]) {
  set({ devices });
  try {
    localStorage.setItem("team-chat:devices", JSON.stringify(devices));
  } catch {
    /* storage unavailable */
  }
}

async function getMic(deviceId: string | null): Promise<MediaStreamTrack> {
  const constraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: deviceId ? { ...constraints, deviceId: { exact: deviceId } } : constraints });
    return s.getAudioTracks()[0];
  } catch (err) {
    // A saved device that's been unplugged: fall back to the default.
    if (!deviceId) throw err;
    return getMic(null);
  }
}

async function getCamera(deviceId: string | null): Promise<MediaStreamTrack> {
  const video = { width: { ideal: 1280 }, height: { ideal: 720 } };
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: deviceId ? { ...video, deviceId: { exact: deviceId } } : video });
    return s.getVideoTracks()[0];
  } catch (err) {
    if (!deviceId) throw err;
    return getCamera(null);
  }
}

/** The track everyone else should see right now. */
function currentOutgoingVideo(): MediaStreamTrack | null {
  const s = get();
  if (s.sharing && screenTrack) return screenTrack;
  if (!s.camOn || !cameraTrack) return null;
  return blurPipeline?.track ?? cameraTrack;
}

async function applyOutgoingVideo() {
  const track = currentOutgoingVideo();
  set({ outgoingVideo: track });
  await Promise.all(Array.from(pcs.values()).map((pc) => senderOf(pc, "video")?.replaceTrack(track).catch(() => {})));
  broadcastMedia();
}

function senderOf(pc: RTCPeerConnection, kind: "audio" | "video"): RTCRtpSender | undefined {
  return pc.getTransceivers().find((t) => t.receiver.track.kind === kind)?.sender;
}

function broadcastMedia() {
  const s = get();
  if (!s.callId) return;
  emit("call:media", { callId: s.callId, mic: s.micOn, cam: !!currentOutgoingVideo() && !s.sharing, sharing: s.sharing, hand: s.hand, recording: s.recording });
}

// --- peers -------------------------------------------------------------------

function patchPeer(userId: string, patch: Partial<PeerState>) {
  const peers = get().peers;
  const prev = peers[userId] ?? { userId, name: "", stream: null, connection: "new" as const, mic: true, cam: false, sharing: false, hand: false, recording: false };
  set({ peers: { ...peers, [userId]: { ...prev, ...patch } } });
}

function dropPeer(userId: string) {
  pcs.get(userId)?.close();
  pcs.delete(userId);
  pendingIce.delete(userId);
  const peers = { ...get().peers };
  delete peers[userId];
  set({ peers });
}

/** Guests get ICE servers with their join token instead of from the signed-in API. */
export function setIceServers(servers: RTCIceServer[]) {
  iceServers = servers;
}

async function ensureIceServers(): Promise<RTCIceServer[]> {
  if (iceServers) return iceServers;
  try {
    iceServers = (await teamChatApi.iceServers()).iceServers;
  } catch {
    iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
  }
  return iceServers;
}

async function createPeer(userId: string, name: string, initiator: boolean): Promise<RTCPeerConnection> {
  pcs.get(userId)?.close();
  const pc = new RTCPeerConnection({ iceServers: await ensureIceServers() });
  pcs.set(userId, pc);
  patchPeer(userId, { name, connection: "new" });
  const { localStream, callId } = get();

  if (initiator) {
    const audio = localStream?.getAudioTracks()[0];
    pc.addTransceiver(audio ?? "audio", { direction: "sendrecv", streams: localStream ? [localStream] : [] });
    pc.addTransceiver(currentOutgoingVideo() ?? "video", { direction: "sendrecv", streams: localStream ? [localStream] : [] });
  }

  const remote = new MediaStream();
  pc.ontrack = (e) => {
    if (!remote.getTracks().includes(e.track)) remote.addTrack(e.track);
    patchPeer(userId, { stream: new MediaStream(remote.getTracks()) });
    recording?.addAudio(remote);
  };
  pc.onicecandidate = (e) => {
    if (e.candidate) emit("call:signal", { callId, toUserId: userId, signal: { candidate: e.candidate.toJSON() } });
  };
  pc.onconnectionstatechange = () => {
    patchPeer(userId, { connection: pc.connectionState });
    if (pc.connectionState === "connected" && !get().startedAt) set({ startedAt: Date.now() });
    // Wi-Fi blips: ask ICE to find a new path before giving up on this peer.
    if (pc.connectionState === "failed" && initiator) void restartIce(userId, pc);
  };
  if (initiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    emit("call:signal", { callId, toUserId: userId, signal: { description: pc.localDescription } });
  }
  return pc;
}

async function restartIce(userId: string, pc: RTCPeerConnection) {
  try {
    const offer = await pc.createOffer({ iceRestart: true });
    await pc.setLocalDescription(offer);
    emit("call:signal", { callId: get().callId, toUserId: userId, signal: { description: pc.localDescription } });
  } catch {
    /* peer is gone */
  }
}

async function onSignal(fromUserId: string, signal: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) {
  let pc = pcs.get(fromUserId);
  if (signal.description?.type === "offer") {
    if (!pc) pc = await createPeer(fromUserId, get().peers[fromUserId]?.name ?? "", false);
    await pc.setRemoteDescription(signal.description);
    // Answerer: attach my tracks to the transceivers the offer created.
    const { localStream } = get();
    for (const t of pc.getTransceivers()) {
      t.direction = "sendrecv";
      const kind = t.receiver.track.kind;
      const track = kind === "audio" ? localStream?.getAudioTracks()[0] ?? null : currentOutgoingVideo();
      if (t.sender.track !== track) await t.sender.replaceTrack(track);
      if (localStream) t.sender.setStreams?.(localStream);
    }
    await pc.setLocalDescription(await pc.createAnswer());
    emit("call:signal", { callId: get().callId, toUserId: fromUserId, signal: { description: pc.localDescription } });
    await flushIce(fromUserId, pc);
    return;
  }
  if (!pc) return;
  if (signal.description) {
    await pc.setRemoteDescription(signal.description);
    await flushIce(fromUserId, pc);
  } else if (signal.candidate) {
    if (pc.remoteDescription) await pc.addIceCandidate(signal.candidate).catch(() => {});
    else pendingIce.set(fromUserId, [...(pendingIce.get(fromUserId) ?? []), signal.candidate]);
  }
}

async function flushIce(userId: string, pc: RTCPeerConnection) {
  for (const c of pendingIce.get(userId) ?? []) await pc.addIceCandidate(c).catch(() => {});
  pendingIce.delete(userId);
}

// --- lifecycle ---------------------------------------------------------------

function cleanup() {
  ringtone.stop();
  if (recording) void stopRecording();
  for (const pc of pcs.values()) pc.close();
  pcs.clear();
  pendingIce.clear();
  get().localStream?.getTracks().forEach((t) => t.stop());
  cameraTrack?.stop();
  cameraTrack = null;
  screenTrack?.stop();
  screenTrack = null;
  blurPipeline?.stop();
  blurPipeline = null;
  set({ ...idle });
}

async function prepareMedia(video: boolean): Promise<boolean> {
  const devices = savedDevices();
  set({ devices });
  let mic: MediaStreamTrack;
  try {
    mic = await getMic(devices.audioIn);
  } catch {
    toast.error("Allow microphone access to join calls");
    return false;
  }
  if (video) {
    try {
      cameraTrack = await getCamera(devices.videoIn);
    } catch {
      toast("Camera unavailable — joining with audio only");
    }
  }
  set({ localStream: new MediaStream([mic]), micOn: true, camOn: !!cameraTrack });
  set({ outgoingVideo: currentOutgoingVideo() });
  return true;
}

/** Start a call in a chat — or join the one already running there. */
export async function startCall(conversationId: string, video: boolean, title: string) {
  if (get().phase !== "idle") return toast.error("You're already in a call");
  const socket = teamChatSocket();
  if (!socket?.connected) return toast.error("Chat is offline — try again in a moment");
  set({ phase: "joining", conversationId, title });
  if (!(await prepareMedia(video))) return cleanup();
  const running = get().active[conversationId];
  const callId = running?.callId ?? crypto.randomUUID();
  set({ callId });
  if (running) emit("call:join", { callId });
  else emit("call:start", { callId, conversationId, video });
}

export async function acceptCall(withVideo?: boolean) {
  const { incoming, phase } = get();
  if (phase !== "incoming" || !incoming) return;
  ringtone.stop();
  set({ phase: "joining", callId: incoming.callId, conversationId: incoming.conversationId, title: incoming.title ?? incoming.fromName, incoming: null });
  if (!(await prepareMedia(withVideo ?? incoming.video))) {
    emit("call:decline", { callId: incoming.callId });
    return cleanup();
  }
  emit("call:join", { callId: incoming.callId });
}

export function declineCall() {
  const { incoming } = get();
  if (incoming) emit("call:decline", { callId: incoming.callId });
  ringtone.stop();
  set({ phase: "idle", incoming: null });
}

export function hangUp() {
  const { callId } = get();
  if (callId && callId !== "pending") emit("call:leave", { callId });
  cleanup();
  if (guestMode) set({ phase: "ended", endedReason: "left" });
}

/** Guests (meeting link): get media, then knock. The server admits or holds them in the lobby. */
export async function joinAsGuest(title: string, opts: { video: boolean; mic: boolean }) {
  if (get().phase !== "idle" && get().phase !== "ended") return;
  set({ phase: "joining", title, endedReason: null });
  if (!(await prepareMedia(opts.video))) return cleanup();
  if (!opts.mic) toggleMic();
  set({ callId: "pending", phase: "lobby" });
  emit("call:knock", {});
}

export function admitGuest(conversationId: string, guestId: string) {
  emit("call:admit", { conversationId, guestId });
}

export function denyGuest(conversationId: string, guestId: string) {
  emit("call:deny", { conversationId, guestId });
}

/** Ring chat members who aren't in the call yet. */
export function ringMembers(userIds: string[]) {
  const { callId } = get();
  if (callId && userIds.length) emit("call:ring", { callId, userIds });
}

// --- controls ----------------------------------------------------------------

export function toggleMic() {
  const { localStream, micOn } = get();
  localStream?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
  set({ micOn: !micOn });
  broadcastMedia();
}

export async function toggleCamera() {
  const { camOn, devices, blur } = get();
  if (camOn) {
    set({ camOn: false });
    // Release the camera (light off) rather than just sending black.
    blurPipeline?.stop();
    blurPipeline = null;
    cameraTrack?.stop();
    cameraTrack = null;
  } else {
    try {
      cameraTrack = await getCamera(devices.videoIn);
    } catch {
      return toast.error("Couldn't turn on the camera");
    }
    set({ camOn: true });
    if (blur) await enableBlur(true);
  }
  await applyOutgoingVideo();
}

export async function toggleScreenShare() {
  if (get().sharing) {
    screenTrack?.stop();
    screenTrack = null;
    set({ sharing: false });
    return applyOutgoingVideo();
  }
  if (!screenShareSupported()) return toast.error("This browser can't share its screen");
  try {
    const display = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: false });
    screenTrack = display.getVideoTracks()[0];
    screenTrack.contentHint = "detail";
    // The browser's own "Stop sharing" bar ends it too.
    screenTrack.onended = () => {
      if (get().sharing) void toggleScreenShare();
    };
    set({ sharing: true });
    await applyOutgoingVideo();
  } catch {
    /* picker cancelled */
  }
}

export function toggleHand() {
  set({ hand: !get().hand });
  broadcastMedia();
}

async function enableBlur(on: boolean) {
  blurPipeline?.stop();
  blurPipeline = null;
  if (on && cameraTrack) {
    set({ blurLoading: true });
    try {
      blurPipeline = await createBlurredTrack(cameraTrack);
    } catch {
      toast.error("Background blur couldn't load");
      set({ blur: false });
    } finally {
      set({ blurLoading: false });
    }
  }
}

export async function toggleBlur() {
  const next = !get().blur;
  set({ blur: next });
  if (get().camOn) {
    await enableBlur(next);
    await applyOutgoingVideo();
  }
}

export async function startRecordingCall() {
  if (recording) return;
  const { localStream, peers } = get();
  recording = startRecording([localStream, ...Object.values(peers).map((p) => p.stream)].filter(Boolean) as MediaStream[]);
  set({ recording: true });
  broadcastMedia();
  toast("Recording started — everyone in the call can see this");
}

export async function stopRecording() {
  const r = recording;
  if (!r) return;
  recording = null;
  const title = get().title;
  set({ recording: false });
  broadcastMedia();
  const blob = await r.stop();
  if (blob.size) {
    downloadRecording(blob, title);
    toast.success("Recording saved to your downloads");
  }
}

export async function listDevices() {
  const all = await navigator.mediaDevices.enumerateDevices();
  return {
    audioIn: all.filter((d) => d.kind === "audioinput"),
    videoIn: all.filter((d) => d.kind === "videoinput"),
    audioOut: all.filter((d) => d.kind === "audiooutput"),
  };
}

export async function selectDevice(kind: "audioIn" | "videoIn" | "audioOut", deviceId: string) {
  const devices = { ...get().devices, [kind]: deviceId };
  persistDevices(devices);
  if (get().phase !== "active" && get().phase !== "joining") return;

  if (kind === "audioIn") {
    const { localStream, micOn } = get();
    const track = await getMic(deviceId);
    track.enabled = micOn;
    localStream?.getAudioTracks().forEach((t) => {
      localStream.removeTrack(t);
      t.stop();
    });
    localStream?.addTrack(track);
    await Promise.all(Array.from(pcs.values()).map((pc) => senderOf(pc, "audio")?.replaceTrack(track)));
    set({ localStream: localStream ? new MediaStream(localStream.getTracks()) : null });
  }
  if (kind === "videoIn" && get().camOn) {
    blurPipeline?.stop();
    blurPipeline = null;
    cameraTrack?.stop();
    cameraTrack = await getCamera(deviceId);
    if (get().blur) await enableBlur(true);
    await applyOutgoingVideo();
  }
  // audioOut is applied by the call window to every <video> element (setSinkId).
}

// --- socket events -----------------------------------------------------------

let guestMode = false;

/** Guests keep the window after the call ends ("You left" / "Rejoin") instead of closing it. */
export function bindCallEvents(opts: { guest?: boolean } = {}): () => void {
  guestMode = !!opts.guest;
  const socket = teamChatSocket();
  if (!socket) return () => {};

  const onIncoming = (d: IncomingCall) => {
    const s = get();
    if (s.phase !== "idle" || s.incoming) return;
    set({ phase: "incoming", incoming: d });
    ringtone.start();
    if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
      const note = new Notification(d.title ? `${d.fromName} is calling · ${d.title}` : `${d.fromName} is calling`, {
        body: d.video ? "Video call" : "Audio call",
        tag: d.callId,
      });
      note.onclick = () => {
        window.focus();
        note.close();
      };
    }
  };

  const onDismiss = (d: { callId: string }) => {
    if (get().incoming?.callId === d.callId) {
      ringtone.stop();
      set({ phase: "idle", incoming: null });
    }
  };

  const onJoined = async (d: ActiveCallInfo & { participants: { userId: string; name: string }[] }) => {
    // A guest's call id is only known once they're admitted.
    if (get().callId === "pending") set({ callId: d.callId });
    if (get().callId !== d.callId) return;
    set({ phase: "active", conversationId: d.conversationId, startedAt: d.participantIds.length > 1 ? d.startedAt : null });
    broadcastMedia();
    // I'm the newcomer: offer to everyone already here.
    for (const p of d.participants) await createPeer(p.userId, p.name, true);
  };

  const onPeerJoined = (d: { callId: string; userId: string; name: string }) => {
    if (get().callId !== d.callId) return;
    patchPeer(d.userId, { name: d.name });
    broadcastMedia(); // so the newcomer sees my mic/cam state
  };

  const onPeerLeft = (d: { callId: string; userId: string }) => {
    if (get().callId === d.callId) dropPeer(d.userId);
  };

  const onDeclined = (d: { callId: string; name: string }) => {
    if (get().callId === d.callId) toast(`${d.name} declined`);
  };

  const onPeerMedia = (d: { callId: string; userId: string; mic: boolean; cam: boolean; sharing: boolean; hand: boolean; recording: boolean }) => {
    if (get().callId !== d.callId) return;
    const prev = get().peers[d.userId];
    if (d.hand && !prev?.hand) toast(`✋ ${prev?.name || "Someone"} raised their hand`);
    if (d.recording && !prev?.recording) toast(`🔴 ${prev?.name || "Someone"} started recording this call`);
    patchPeer(d.userId, { mic: d.mic, cam: d.cam, sharing: d.sharing, hand: d.hand, recording: d.recording });
  };

  const onSignalEvent = (d: { callId: string; fromUserId: string; signal: Parameters<typeof onSignal>[1] }) => {
    if (get().callId === d.callId) void onSignal(d.fromUserId, d.signal ?? {});
  };

  const REASONS: Record<string, string> = {
    declined: "Call declined",
    busy: "They're on another call",
    offline: "They're offline",
    no_answer: "No answer",
    unavailable: "You can't call in this chat",
    full: `This call is full (${MAX_PARTICIPANTS} people max)`,
    already_in_call: "You're already in another call",
    gone: "That call has ended",
    moved: "You joined this call from another tab",
    denied: "You weren't let into the call",
  };
  const onEnded = (d: { callId: string; conversationId?: string; reason: string }) => {
    if (d.conversationId) {
      const active = { ...get().active };
      delete active[d.conversationId];
      set({ active });
    }
    const s = get();
    if (s.incoming?.callId === d.callId) {
      ringtone.stop();
      set({ phase: "idle", incoming: null });
    }
    // Guests: a denial arrives while still in the lobby (no call id yet).
    const mine = s.callId === d.callId || (s.callId === "pending" && d.reason === "denied");
    if (!mine) return;
    if (REASONS[d.reason] && d.reason !== "hangup") toast(REASONS[d.reason]);
    cleanup();
    if (guestMode) set({ phase: "ended", endedReason: d.reason });
  };

  const onActive = (d: ActiveCallInfo) => set({ active: { ...get().active, [d.conversationId]: d } });
  const onLobby = (d: { conversationId: string; guests: LobbyGuest[] }) => {
    const prev = get().lobby[d.conversationId] ?? [];
    set({ lobby: { ...get().lobby, [d.conversationId]: d.guests } });
    const fresh = d.guests.filter((g) => !prev.some((p) => p.userId === g.userId));
    if (fresh.length) window.dispatchEvent(new CustomEvent("team-chat:lobby", { detail: { conversationId: d.conversationId, guests: fresh } }));
  };
  const onWaiting = (d: { reason: "approval" | "no_call" }) => set({ waitingReason: d.reason });

  socket.on("call:incoming", onIncoming);
  socket.on("call:dismiss", onDismiss);
  socket.on("call:joined", onJoined);
  socket.on("call:peer-joined", onPeerJoined);
  socket.on("call:peer-left", onPeerLeft);
  socket.on("call:declined", onDeclined);
  socket.on("call:peer-media", onPeerMedia);
  socket.on("call:signal", onSignalEvent);
  socket.on("call:ended", onEnded);
  socket.on("call:active", onActive);
  socket.on("call:lobby", onLobby);
  socket.on("call:waiting", onWaiting);
  return () => {
    socket.off("call:lobby", onLobby);
    socket.off("call:waiting", onWaiting);
    socket.off("call:incoming", onIncoming);
    socket.off("call:dismiss", onDismiss);
    socket.off("call:joined", onJoined);
    socket.off("call:peer-joined", onPeerJoined);
    socket.off("call:peer-left", onPeerLeft);
    socket.off("call:declined", onDeclined);
    socket.off("call:peer-media", onPeerMedia);
    socket.off("call:signal", onSignalEvent);
    socket.off("call:ended", onEnded);
    socket.off("call:active", onActive);
  };
}
