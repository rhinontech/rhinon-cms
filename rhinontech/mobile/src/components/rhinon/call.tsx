import { Portal, View, Text, Span, Pressable } from "@/components/rn";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff, Volume2, VolumeX } from "@/components/icons";
import React, { useEffect } from "react";
import { pad } from "@/lib/format";
import { useNow } from "@/lib/store";
import { toneFor, TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { Display, Eyebrow } from "./ui";
import {
  acceptCall,
  declineCall,
  hangUp,
  toggleMic,
  toggleCamera,
  useCall,
  bindCallEvents,
} from "@/lib/live-calls";
// Lazy-require: react-native-webrtc blows up at import time in Expo Go
function getRTCView(): React.ComponentType<{ streamURL: string; style?: object; objectFit?: string; mirror?: boolean }> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("react-native-webrtc") as typeof import("react-native-webrtc")).RTCView as any;
  } catch {
    return null;
  }
}

/** Binds socket call events for the lifetime of this component (mount = after login). */
export function CallEventBinder() {
  useEffect(() => bindCallEvents(), []);
  return null;
}

/** Full-screen overlay shown while a call is active. */
export function CallOverlay({
  open,
  title,
  names,
  // Legacy props accepted but ignored — call state is managed by live-calls.ts
  onClose: _onClose,
  video: _video,
}: {
  open: boolean;
  title: string;
  names: string[];
  onClose?: () => void;
  video?: boolean;
}) {
  const { micOn, camOn, peers, localStream, phase } = useCall();
  const now = useNow(open);
  // startedAt not tracked precisely on mobile; approximate from mount
  const isActive = phase === "active";

  if (!open) return null;

  type Tile = { userId: string; name: string; stream: import("react-native-webrtc").MediaStream | null; cam: boolean };
  const peerList = Object.values(peers) as Tile[];
  const all: Tile[] = [...peerList, { userId: "me", name: "You", stream: localStream, cam: camOn }];

  return (
    <Portal>
      <View className="pointer-events-auto absolute inset-0 z-[55] flex animate-fade-in flex-col bg-ink px-5 pb-9 pt-[var(--inset-top)] text-paper">
        <Eyebrow className="text-on-ink-accent">
          {isActive ? "On a call" : "Connecting…"}
        </Eyebrow>
        <Display size="xl" className="mt-2 text-paper">
          {title}
        </Display>

        <View className={cn("mt-6 grid flex-1 gap-3", all.length <= 2 ? "grid-cols-1" : "grid-cols-2")}>
          {all.map((p, i) => {
            const mine = p.userId === "me";
            const tone = toneFor(mine ? "You" : p.name);
            const stream = p.stream;
            const camActive = p.cam;
            return (
              <View
                key={p.userId}
                className={cn(
                  "relative flex min-h-[120px] flex-col justify-between overflow-hidden rounded-3xl",
                  TONES[tone].solid,
                  i === 0 && "outline outline-[3px] outline-offset-2 outline-paper/80",
                )}
              >
                {stream && camActive ? (() => {
                  const RV = getRTCView();
                  return RV ? <RV streamURL={stream.toURL()} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} objectFit="cover" mirror={mine} /> : null;
                })() : null}
                <View className="relative p-3.5">
                  {mine && !micOn ? (
                    <View className="self-end ml-auto grid size-8 place-items-center rounded-full bg-ink/70 text-paper">
                      <MicOff size={15} />
                    </View>
                  ) : null}
                </View>
                <View className="relative p-3.5">
                  <Text className="font-display text-[length:calc(56px*var(--ds))] font-black leading-[0.8]">
                    {p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                  </Text>
                  <Text className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] opacity-90">
                    {mine ? (camOn ? "You · camera on" : "You") : p.name.split(" ")[0]}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View className="mt-6 flex items-center justify-between gap-3">
          <RoundButton label={micOn ? "Mute" : "Unmute"} active={!micOn} onClick={toggleMic}>
            {micOn ? <Mic size={24} /> : <MicOff size={24} />}
          </RoundButton>
          <RoundButton label={camOn ? "Camera off" : "Camera on"} active={!camOn} onClick={toggleCamera}>
            {camOn ? <Video size={24} /> : <VideoOff size={24} />}
          </RoundButton>
          <Pressable
            accessibilityLabel="End call"
            onPress={hangUp}
            className="press grid h-16 flex-1 place-items-center rounded-full bg-coral text-coral-foreground"
          >
            <PhoneOff size={26} />
          </Pressable>
        </View>
      </View>
    </Portal>
  );
}

/** Incoming call banner shown over the current screen. */
export function IncomingCallSheet() {
  const { incoming } = useCall();
  if (!incoming) return null;
  return (
    <Portal>
      <View className="pointer-events-auto absolute inset-x-4 top-[var(--inset-top)] z-[60] animate-pop rounded-3xl bg-ink p-5 shadow-2xl">
        <Eyebrow className="text-on-ink-accent">{incoming.video ? "Incoming video call" : "Incoming call"}</Eyebrow>
        <Display size="lg" className="mt-2 text-paper">
          {incoming.fromName}
        </Display>
        {incoming.title ? (
          <Text className="mt-1 text-[14px] text-paper/60">{incoming.title}</Text>
        ) : null}
        <View className="mt-5 flex gap-3">
          <Pressable
            onPress={declineCall}
            className="press flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-coral text-coral-foreground"
          >
            <PhoneOff size={20} />
            <Text className="font-semibold">Decline</Text>
          </Pressable>
          <Pressable
            onPress={() => acceptCall(incoming.video)}
            className="press flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-leaf text-leaf-foreground"
          >
            <Phone size={20} />
            <Text className="font-semibold">Accept</Text>
          </Pressable>
        </View>
      </View>
    </Portal>
  );
}

function RoundButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onClick}
      className={cn(
        "press grid size-16 shrink-0 place-items-center rounded-full transition-colors",
        active ? "bg-paper text-ink" : "bg-paper/10 text-paper",
      )}
    >
      {children}
    </Pressable>
  );
}
