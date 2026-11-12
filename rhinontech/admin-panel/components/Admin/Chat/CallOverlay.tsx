"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  TbBlur,
  TbDots,
  TbHandStop,
  TbMaximize,
  TbMicrophone,
  TbMicrophoneOff,
  TbMinimize,
  TbPhone,
  TbPhoneOff,
  TbPlayerRecordFilled,
  TbPlayerStopFilled,
  TbScreenShare,
  TbScreenShareOff,
  TbSettings,
  TbUsers,
  TbVideo,
  TbVideoOff,
  TbLoader2,
  TbX,
  TbLink,
  TbCheck,
} from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  acceptCall,
  admitGuest,
  denyGuest,
  declineCall,
  hangUp,
  listDevices,
  ringMembers,
  screenShareSupported,
  selectDevice,
  startRecordingCall,
  stopRecording,
  toggleBlur,
  toggleCamera,
  toggleHand,
  toggleMic,
  toggleScreenShare,
  useCall,
  type LobbyGuest,
  type PeerState,
} from "./calls";
import { blurSupported } from "./backgroundBlur";
import { recordingSupported } from "./callRecorder";
import { useTeamChat } from "./store";
import { meetUrl, teamChatApi } from "./teamChatApi";
import { UserAvatar } from "./shared";

// Stable empty value: a fresh [] from a Zustand selector re-renders forever.
const NO_GUESTS: LobbyGuest[] = [];

type SinkVideo = HTMLVideoElement & { setSinkId?: (id: string) => Promise<void> };

function Video({ stream, track, muted, mirror, className }: { stream?: MediaStream | null; track?: MediaStreamTrack | null; muted?: boolean; mirror?: boolean; className?: string }) {
  const ref = useRef<SinkVideo>(null);
  const sink = useCall((s) => s.devices.audioOut);
  const src = useMemo(() => stream ?? (track ? new MediaStream([track]) : null), [stream, track]);
  useEffect(() => {
    const el = ref.current;
    if (el && el.srcObject !== src) {
      el.srcObject = src;
      el.play().catch(() => {});
    }
  }, [src]);
  useEffect(() => {
    if (!muted && sink && ref.current?.setSinkId) ref.current.setSinkId(sink).catch(() => {});
  }, [sink, muted]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={cn(className, mirror && "-scale-x-100")} />;
}

function Elapsed({ since }: { since: number | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!since) return null;
  const s = Math.max(0, Math.floor((now - since) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return <span>{`${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(s % 60).padStart(2, "0")}`}</span>;
}

/** Speaking indicator from the audio level of a stream. */
function useSpeaking(stream: MediaStream | null, enabled: boolean): boolean {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (!stream || !enabled || !stream.getAudioTracks().length) return;
    let ctx: AudioContext | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    try {
      ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      timer = setInterval(() => {
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        setSpeaking(avg > 18);
      }, 200);
    } catch {
      /* no audio context */
    }
    return () => {
      if (timer) clearInterval(timer);
      void ctx?.close();
    };
  }, [stream, enabled]);
  return speaking;
}

function Tile({
  userId,
  name,
  stream,
  track,
  hasVideo,
  mic,
  hand,
  self,
  sharing,
  connecting,
  spotlight,
  compact,
}: {
  userId: string;
  name: string;
  stream?: MediaStream | null;
  track?: MediaStreamTrack | null;
  hasVideo: boolean;
  mic: boolean;
  hand: boolean;
  self?: boolean;
  sharing?: boolean;
  connecting?: boolean;
  spotlight?: boolean;
  compact?: boolean;
}) {
  const audioStream = useCall((s) => (self ? s.localStream : null));
  const speaking = useSpeaking(self ? audioStream : stream ?? null, mic);
  return (
    <div
      data-call-tile
      data-name={self ? `${name} (you)` : name}
      data-has-video={hasVideo ? "true" : "false"}
      data-spotlight={spotlight ? "true" : "false"}
      className={cn(
        "relative flex min-h-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-800 ring-2 transition",
        speaking && mic ? "ring-emerald-400" : "ring-transparent",
        compact ? "aspect-video w-40 shrink-0 sm:w-48" : "h-full w-full",
      )}
    >
      {/* Remote audio plays from this element even with the camera off. */}
      <Video
        stream={stream}
        track={track}
        muted={self}
        mirror={self && !sharing}
        className={cn("h-full w-full", sharing || spotlight ? "object-contain" : "object-cover", !hasVideo && "invisible absolute")}
      />
      {!hasVideo && (
        <div className="flex flex-col items-center gap-2">
          <UserAvatar userId={userId} size={compact ? "md" : "lg"} showPresence={false} fallbackName={name} />
          {connecting && <p className="text-xs text-white/60">Connecting…</p>}
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex max-w-[85%] items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
        {!mic && <TbMicrophoneOff className="size-3.5 shrink-0 text-rose-400" />}
        <span className="truncate">{self ? `${name} (you)` : name}</span>
        {sharing && <TbScreenShare className="size-3.5 shrink-0" />}
      </div>
      {hand && (
        <div className="absolute right-2 top-2 rounded-full bg-amber-400 p-1.5 text-zinc-900" title="Hand raised">
          <TbHandStop className="size-4" />
        </div>
      )}
    </div>
  );
}

function RoundButton({ onClick, title, active = true, danger, highlight, disabled, children }: { onClick: () => void; title: string; active?: boolean; danger?: boolean; highlight?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full transition disabled:opacity-40 sm:size-12",
        danger
          ? "bg-rose-600 text-white hover:bg-rose-700"
          : highlight
            ? "bg-amber-400 text-zinc-900 hover:bg-amber-300"
            : active
              ? "bg-white/15 text-white hover:bg-white/25"
              : "bg-white text-zinc-900 hover:bg-white/90",
      )}
    >
      {children}
    </button>
  );
}

function DeviceSettings({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const devices = useCall((s) => s.devices);
  const [list, setList] = useState<Awaited<ReturnType<typeof listDevices>> | null>(null);
  useEffect(() => {
    if (!open) return;
    void listDevices().then(setList);
    const onChange = () => void listDevices().then(setList);
    navigator.mediaDevices.addEventListener("devicechange", onChange);
    return () => navigator.mediaDevices.removeEventListener("devicechange", onChange);
  }, [open]);
  const canPickSpeaker = typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;
  const row = (label: string, kind: "audioIn" | "videoIn" | "audioOut", items: MediaDeviceInfo[] = []) => (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <select
        value={devices[kind] ?? ""}
        onChange={(e) => void selectDevice(kind, e.target.value)}
        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
      >
        <option value="">System default</option>
        {items.map((d, i) => (
          <option key={d.deviceId || i} value={d.deviceId}>{d.label || `${label} ${i + 1}`}</option>
        ))}
      </select>
    </label>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[110] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Devices</DialogTitle>
        </DialogHeader>
        {!list ? (
          <div className="flex justify-center py-6"><TbLoader2 className="size-5 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {row("Microphone", "audioIn", list.audioIn)}
            {row("Camera", "videoIn", list.videoIn)}
            {canPickSpeaker ? row("Speaker", "audioOut", list.audioOut) : <p className="text-xs text-muted-foreground">This browser plays call audio through the system speaker.</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PeoplePanel({ onClose, meId, guest }: { onClose: () => void; meId: string | null; guest?: boolean }) {
  const lobby = useCall((s) => (s.conversationId ? s.lobby[s.conversationId] ?? NO_GUESTS : NO_GUESTS));
  const [copying, setCopying] = useState(false);
  const copyInvite = async () => {
    if (!conversationId) return;
    setCopying(true);
    try {
      // Reuse a live link if there is one; otherwise a 24-hour link with a lobby.
      const links = await teamChatApi.callLinks(conversationId);
      const link = links[0] ?? (await teamChatApi.createCallLink(conversationId, { expiresInHours: 24, requireApproval: true }));
      await navigator.clipboard.writeText(meetUrl(link.token));
      toast.success("Invite link copied — guests wait in the lobby until you let them in");
    } catch (e) {
      toast.error((e as Error).message || "Couldn't create a link");
    } finally {
      setCopying(false);
    }
  };
  const conversationId = useCall((s) => s.conversationId);
  const peers = useCall((s) => s.peers);
  const conversation = useTeamChat((s) => (conversationId ? s.conversations[conversationId] : undefined));
  const users = useTeamChat((s) => s.users);
  const [rung, setRung] = useState<string[]>([]);
  const inCall = new Set([meId ?? "", ...Object.keys(peers)]);
  const others = (conversation?.memberIds ?? []).filter((id) => !inCall.has(id));
  return (
    <aside className="absolute inset-y-0 right-0 z-10 flex w-full flex-col bg-zinc-900 sm:w-72">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-sm font-semibold">{`In this call · ${inCall.size}`}</p>
        <button onClick={onClose} className="rounded p-1 hover:bg-white/10"><TbX className="size-4" /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {!guest && (
          <button onClick={copyInvite} disabled={copying} className="mb-2 flex w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/15">
            {copying ? <TbLoader2 className="size-4 animate-spin" /> : <TbLink className="size-4" />} Copy invite link for guests
          </button>
        )}
        {!guest && lobby.length > 0 && (
          <>
            <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-amber-300">{`Waiting in lobby · ${lobby.length}`}</p>
            {lobby.map((g) => (
              <div key={g.userId} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                <UserAvatar userId={g.userId} size="sm" showPresence={false} fallbackName={g.name} />
                <span className="flex-1 truncate text-sm">{g.name}</span>
                <button onClick={() => conversationId && denyGuest(conversationId, g.userId)} title="Deny" className="rounded p-1 text-rose-300 hover:bg-white/10"><TbX className="size-4" /></button>
                <button onClick={() => conversationId && admitGuest(conversationId, g.userId)} title="Admit" className="rounded bg-emerald-600 p-1 hover:bg-emerald-700"><TbCheck className="size-4" /></button>
              </div>
            ))}
          </>
        )}
        {Array.from(inCall).map((id) => (
          <div key={id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <UserAvatar userId={id} size="sm" showPresence={false} fallbackName={peers[id]?.name} />
            <span className="flex-1 truncate text-sm">{id === meId ? `${users[id]?.name ?? "You"} (you)` : peers[id]?.name || users[id]?.name}</span>
            {peers[id]?.hand && <TbHandStop className="size-4 text-amber-400" />}
            {peers[id] && !peers[id].mic && <TbMicrophoneOff className="size-4 text-rose-400" />}
          </div>
        ))}
        {!guest && others.length > 0 && <p className="px-2 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-white/50">Not in the call</p>}
        {!guest && others.map((id) => (
          <div key={id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <UserAvatar userId={id} size="sm" />
            <span className="flex-1 truncate text-sm text-white/80">{users[id]?.name ?? "Unknown"}</span>
            <Button
              size="sm"
              variant="secondary"
              disabled={rung.includes(id) || Object.keys(peers).length + 1 >= 8}
              onClick={() => {
                ringMembers([id]);
                setRung((r) => [...r, id]);
              }}
            >
              {rung.includes(id) ? "Ringing…" : "Ring"}
            </Button>
          </div>
        ))}
      </div>
    </aside>
  );
}

/** Ringing toast for incoming calls and the call window. Mounted once, in the shell. */
export function CallOverlay({ selfId, selfName, guest }: { selfId: string | null; selfName: string | null; guest?: boolean }) {
  const call = useCall();
  const meId = selfId;
  const fullName = selfName;
  const lobby = useCall((s) => (s.conversationId ? s.lobby[s.conversationId] ?? NO_GUESTS : NO_GUESTS));
  const [minimized, setMinimized] = useState(false);
  const [settings, setSettings] = useState(false);
  const [people, setPeople] = useState(false);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (call.phase === "idle") {
      setMinimized(false);
      setPeople(false);
    }
  }, [call.phase]);

  // Leaving the page mid-call: hang up cleanly rather than leaving a ghost participant.
  useEffect(() => {
    if (call.phase !== "active") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    window.addEventListener("pagehide", hangUp);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("pagehide", hangUp);
    };
  }, [call.phase]);

  if (call.phase === "idle" || call.phase === "ended") return null;

  if (call.phase === "lobby") {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-zinc-950 p-6 text-center text-white">
        <div className="aspect-video w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-800">
          {call.outgoingVideo ? (
            <Video track={call.outgoingVideo} muted mirror className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><UserAvatar userId={meId ?? ""} size="xl" showPresence={false} fallbackName={fullName ?? ""} /></div>
          )}
        </div>
        <div>
          <p className="text-lg font-semibold">{call.title}</p>
          <p className="mt-1 flex items-center justify-center gap-2 text-sm text-white/70">
            <TbLoader2 className="size-4 animate-spin" />
            {call.waitingReason === "no_call" ? "Waiting for the meeting to start…" : "Someone in the meeting will let you in soon."}
          </p>
        </div>
        <div className="flex gap-3">
          <RoundButton onClick={toggleMic} title={call.micOn ? "Mute" : "Unmute"} active={call.micOn}>
            {call.micOn ? <TbMicrophone className="size-5" /> : <TbMicrophoneOff className="size-5" />}
          </RoundButton>
          <RoundButton onClick={() => void toggleCamera()} title={call.camOn ? "Turn camera off" : "Turn camera on"} active={call.camOn}>
            {call.camOn ? <TbVideo className="size-5" /> : <TbVideoOff className="size-5" />}
          </RoundButton>
          <RoundButton onClick={hangUp} title="Leave" danger><TbPhoneOff className="size-5" /></RoundButton>
        </div>
      </div>
    );
  }

  if (call.phase === "incoming" && call.incoming) {
    const inc = call.incoming;
    return (
      <div className="fixed inset-x-4 top-4 z-[100] animate-in slide-in-from-top-4 rounded-2xl border bg-background p-4 shadow-2xl sm:left-auto sm:right-4 sm:w-80">
        <div className="flex items-center gap-3">
          <UserAvatar userId={inc.fromUserId} size="md" showPresence={false} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{inc.fromName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {`${inc.video ? "Video call" : "Audio call"}${inc.title ? ` · ${inc.title}` : ""}`}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={declineCall} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-sm font-medium text-white hover:bg-rose-700">
            <TbPhoneOff className="size-4" /> Decline
          </button>
          {inc.video && (
            <button onClick={() => void acceptCall(false)} title="Answer with audio only" className="flex items-center justify-center rounded-lg bg-emerald-600/80 px-3 py-2 text-white hover:bg-emerald-700">
              <TbPhone className="size-4" />
            </button>
          )}
          <button onClick={() => void acceptCall()} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            {inc.video ? <TbVideo className="size-4" /> : <TbPhone className="size-4" />} Accept
          </button>
        </div>
      </div>
    );
  }

  const peers = Object.values(call.peers);
  const alone = peers.length === 0;
  const status = call.phase === "joining" ? "Joining…" : alone ? "Ringing…" : null;
  const sharer: PeerState | "me" | undefined = call.sharing ? "me" : peers.find((p) => p.sharing);
  const anyoneRecording = call.recording || peers.some((p) => p.recording);
  const myName = fullName || "You";

  const selfTile = (props: { spotlight?: boolean; compact?: boolean } = {}) => (
    <Tile
      key="me"
      userId={meId ?? ""}
      name={myName}
      track={call.outgoingVideo}
      hasVideo={!!call.outgoingVideo}
      mic={call.micOn}
      hand={call.hand}
      sharing={call.sharing}
      self
      {...props}
    />
  );
  const peerTile = (p: PeerState, props: { spotlight?: boolean; compact?: boolean } = {}) => (
    <Tile
      key={p.userId}
      userId={p.userId}
      name={p.name}
      stream={p.stream}
      hasVideo={(p.cam || p.sharing) && !!p.stream?.getVideoTracks().length}
      mic={p.mic}
      hand={p.hand}
      sharing={p.sharing}
      connecting={p.connection !== "connected"}
      {...props}
    />
  );

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[100] flex items-center gap-3 rounded-2xl bg-zinc-900 p-3 pr-4 text-white shadow-2xl">
        <TbPhone className="size-5 text-emerald-400" />
        <div className="text-sm">
          <p className="max-w-40 truncate font-medium">{call.title}</p>
          <p className="text-xs text-white/60">{status ?? <Elapsed since={call.startedAt} />}{anyoneRecording && " · REC"}</p>
        </div>
        {/* Keep everyone's audio playing while minimized. */}
        <div className="hidden">{peers.map((p) => <Video key={p.userId} stream={p.stream} />)}</div>
        <button onClick={toggleMic} title={call.micOn ? "Mute" : "Unmute"} className="rounded-full p-2 hover:bg-white/10">
          {call.micOn ? <TbMicrophone className="size-4" /> : <TbMicrophoneOff className="size-4 text-rose-400" />}
        </button>
        <button onClick={() => setMinimized(false)} title="Expand" className="rounded-full p-2 hover:bg-white/10"><TbMaximize className="size-4" /></button>
        <button onClick={hangUp} title="Leave" className="rounded-full bg-rose-600 p-2 hover:bg-rose-700"><TbPhoneOff className="size-4" /></button>
      </div>
    );
  }

  const count = peers.length + 1;
  // Phones stack people vertically; wider screens use a grid.
  const cols = narrow ? (count <= 3 ? 1 : 2) : count <= 1 ? 1 : count <= 4 ? 2 : 3;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950 text-white">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate font-semibold">{call.title}</p>
          <p className="text-sm text-white/60">{status ?? <Elapsed since={call.startedAt} />}</p>
        </div>
        {anyoneRecording && (
          <span className="flex items-center gap-1.5 rounded-full bg-rose-600/90 px-2.5 py-1 text-xs font-medium">
            <span className="size-2 animate-pulse rounded-full bg-white" /> Recording
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setPeople((v) => !v)} title="People" className={cn("flex items-center gap-1.5 rounded-full px-3 py-2 text-sm hover:bg-white/10", people && "bg-white/15")}>
            <TbUsers className="size-5" /> {count}
          </button>
          <button onClick={() => setMinimized(true)} title="Minimize" className="rounded-full p-2 hover:bg-white/10"><TbMinimize className="size-5" /></button>
        </div>
      </div>

      {!guest && lobby.length > 0 && (
        <div className="mx-3 mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-amber-400/15 px-4 py-2 text-sm text-amber-100 sm:mx-6">
          <span className="min-w-0 flex-1 truncate">
            {lobby.length === 1 ? `${lobby[0].name} is waiting in the lobby` : `${lobby.length} people are waiting in the lobby`}
          </span>
          {lobby.length === 1 ? (
            <>
              <Button size="sm" variant="ghost" className="text-amber-100 hover:bg-white/10" onClick={() => call.conversationId && denyGuest(call.conversationId, lobby[0].userId)}>Deny</Button>
              <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => call.conversationId && admitGuest(call.conversationId, lobby[0].userId)}>Admit</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" className="text-amber-100 hover:bg-white/10" onClick={() => setPeople(true)}>View</Button>
              <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => lobby.forEach((g) => call.conversationId && admitGuest(call.conversationId, g.userId))}>Admit all</Button>
            </>
          )}
        </div>
      )}

      <div className="relative min-h-0 flex-1 px-3 sm:px-6">
        {sharer ? (
          <div className="flex h-full flex-col gap-3">
            <div className="min-h-0 flex-1">{sharer === "me" ? selfTile({ spotlight: true }) : peerTile(sharer, { spotlight: true })}</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sharer !== "me" && selfTile({ compact: true })}
              {peers.filter((p) => p !== sharer).map((p) => peerTile(p, { compact: true }))}
            </div>
          </div>
        ) : alone ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            {call.outgoingVideo ? (
              <div className="aspect-video w-full max-w-2xl">{selfTile()}</div>
            ) : (
              <>
                <UserAvatar userId={meId ?? ""} size="xl" showPresence={false} />
                <p className="text-lg">{call.title}</p>
              </>
            )}
            {status && <p className="animate-pulse text-sm text-white/60">{status}</p>}
          </div>
        ) : (
          <div
            className="grid h-full gap-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: "minmax(0, 1fr)" }}
          >
            {peers.map((p) => peerTile(p))}
            {selfTile()}
          </div>
        )}
        {people && <PeoplePanel onClose={() => setPeople(false)} meId={meId} guest={guest} />}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-4 sm:gap-3 sm:py-6">
        <RoundButton onClick={toggleMic} title={call.micOn ? "Mute" : "Unmute"} active={call.micOn}>
          {call.micOn ? <TbMicrophone className="size-5" /> : <TbMicrophoneOff className="size-5" />}
        </RoundButton>
        <RoundButton onClick={() => void toggleCamera()} title={call.camOn ? "Turn camera off" : "Turn camera on"} active={call.camOn}>
          {call.camOn ? <TbVideo className="size-5" /> : <TbVideoOff className="size-5" />}
        </RoundButton>
        {screenShareSupported() && (
          <RoundButton onClick={() => void toggleScreenShare()} title={call.sharing ? "Stop sharing" : "Share screen"} active={!call.sharing} disabled={alone && call.phase !== "active"}>
            {call.sharing ? <TbScreenShareOff className="size-5" /> : <TbScreenShare className="size-5" />}
          </RoundButton>
        )}
        <RoundButton onClick={toggleHand} title={call.hand ? "Lower hand" : "Raise hand"} highlight={call.hand}>
          <TbHandStop className="size-5" />
        </RoundButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button title="More" aria-label="More" className="flex size-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 sm:size-12">
              <TbDots className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="z-[110]">
            {blurSupported() && (
              <DropdownMenuItem onClick={() => void toggleBlur()} disabled={call.blurLoading}>
                {call.blurLoading ? <TbLoader2 className="animate-spin" /> : <TbBlur />}
                {call.blur ? "Turn off background blur" : "Blur my background"}
              </DropdownMenuItem>
            )}
            {!guest && recordingSupported() && (
              <DropdownMenuItem onClick={() => void (call.recording ? stopRecording() : startRecordingCall())}>
                {call.recording ? <TbPlayerStopFilled /> : <TbPlayerRecordFilled className="text-rose-500" />}
                {call.recording ? "Stop recording" : "Start recording"}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSettings(true)}><TbSettings /> Device settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <RoundButton onClick={hangUp} title="Leave" danger>
          <TbPhoneOff className="size-5" />
        </RoundButton>
      </div>
      <DeviceSettings open={settings} onOpenChange={setSettings} />
    </div>
  );
}
