import { Portal, View, Text, Span, Pressable } from "@/components/rn";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Volume2, VolumeX } from "@/components/icons";
import { useEffect, useState } from "react";
import { pad } from "@/lib/format";
import { useNow } from "@/lib/store";
import { toneFor, TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { Display, Eyebrow } from "./ui";

/** A full-screen call. Voice and video look the same here; the camera button decides what the tiles show. */
export function CallOverlay({
  open,
  onClose,
  title,
  names,
  video = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  names: string[];
  video?: boolean;
}) {
  const [muted, setMuted] = useState(false);
  const [cam, setCam] = useState(video);
  const [speaker, setSpeaker] = useState(true);
  const [t0, setT0] = useState<number | null>(null);
  const now = useNow(open);
  useEffect(() => {
    if (open) {
      setT0(Date.now());
      setMuted(false);
      setCam(video);
      setSpeaker(true);
    }
  }, [open, video]);
  if (!open) return null;
  const secs = t0 && now ? Math.max(0, Math.floor((now - t0) / 1000)) : 0;
  const all = [...names, "You"];
  return (<Portal>
    <View className="pointer-events-auto absolute inset-0 z-[55] flex animate-fade-in flex-col bg-ink px-5 pb-9 pt-[var(--inset-top)] text-paper">
      <Eyebrow className="text-on-ink-accent">
        On a call · {pad(Math.floor(secs / 60))}:{pad(secs % 60)}
      </Eyebrow>
      <Display size="xl" className="mt-2 text-paper">
        {title}
      </Display>

      <View
        className={cn("mt-6 grid flex-1 gap-3", all.length <= 2 ? "grid-cols-1" : "grid-cols-2")}
      >
        {all.map((n, i) => {
          const mine = n === "You";
          const tone = toneFor(mine ? "Kabir Mehra" : n);
          return (
            <View
              key={n}
              className={cn(
                "relative flex min-h-[120px] flex-col justify-between overflow-hidden rounded-3xl p-3.5",
                TONES[tone].solid,
                i === 0 && "outline outline-[3px] outline-offset-2 outline-paper/80",
              )}
            >
              <Span className="self-end">
                {mine && muted ? (
                  <View className="grid size-8 place-items-center rounded-full bg-ink/70 text-paper">
                    <MicOff size={15} />
                  </View>
                ) : null}
              </Span>
              <View>
                <Text className="font-display text-[length:calc(56px*var(--ds))] font-black leading-[0.8]">
                  {n
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)}
                </Text>
                <Text className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] opacity-90">
                  {mine ? (cam ? "You · camera on" : "You") : n.split(" ")[0]}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View className="mt-6 flex items-center justify-between gap-3">
        <RoundButton
          label={muted ? "Unmute" : "Mute"}
          active={muted}
          onClick={() => setMuted((m) => !m)}
        >
          {muted ? <MicOff size={24} /> : <Mic size={24} />}
        </RoundButton>
        <RoundButton
          label={cam ? "Turn camera off" : "Turn camera on"}
          active={!cam}
          onClick={() => setCam((c) => !c)}
        >
          {cam ? <Video size={24} /> : <VideoOff size={24} />}
        </RoundButton>
        <RoundButton
          label={speaker ? "Speaker off" : "Speaker on"}
          active={!speaker}
          onClick={() => setSpeaker((s) => !s)}
        >
          {speaker ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </RoundButton>
        <Pressable
          accessibilityLabel="End call"
          onPress={onClose}
          className="press grid h-16 flex-1 place-items-center rounded-full bg-coral text-coral-foreground"
        >
          <PhoneOff size={26} />
        </Pressable>
      </View>
    </View></Portal>);
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
