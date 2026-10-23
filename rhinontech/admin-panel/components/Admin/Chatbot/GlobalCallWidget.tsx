"use client";

import { TbMicrophone, TbMicrophoneOff, TbPhoneOff, TbVolume, TbVolumeOff } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { useCall } from "./CallContext";
import { Avatar } from "./ui";

/**
 * The call in progress, pinned to the bottom-right of every Chatbot screen so
 * an agent can keep working (reading the chat, the visitor's page) while
 * they talk.
 */
export function GlobalCallWidget() {
  const { phase, peerName, callDuration, isMuted, isSpeakerOn, toggleMute, toggleSpeaker, endCall } = useCall();
  if (phase === "idle") return null;

  const live = phase === "live";
  const status = phase === "ringing" ? "Ringing…" : phase === "connecting" ? "Connecting…" : callDuration;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 w-[300px] overflow-hidden rounded-2xl border border-border bg-background/95 shadow-[0_24px_60px_-16px_rgba(15,23,42,0.45)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300"
      role="dialog"
      aria-label={`Voice call with ${peerName}`}
      data-testid="call-widget"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="relative">
          {!live && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" aria-hidden />}
          <Avatar name={peerName} seed={peerName} size="lg" className="relative" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {phase === "ringing" ? "Calling" : "Voice call"}
          </p>
          <p className="truncate text-[15px] font-semibold text-foreground">{peerName}</p>
          <p className={cn("mt-0.5 flex items-center gap-1.5 text-xs tabular-nums", live ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            <span className={cn("size-1.5 rounded-full", live ? "bg-emerald-500" : "animate-pulse bg-amber-500")} />
            {status}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border/70 bg-muted/30 px-4 py-3">
        {phase !== "ringing" && (
          <>
            <ControlButton active={isMuted} onClick={toggleMute} label={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <TbMicrophoneOff size={18} /> : <TbMicrophone size={18} />}
            </ControlButton>
            <ControlButton active={!isSpeakerOn} onClick={toggleSpeaker} label={isSpeakerOn ? "Mute sound" : "Unmute sound"}>
              {isSpeakerOn ? <TbVolume size={18} /> : <TbVolumeOff size={18} />}
            </ControlButton>
          </>
        )}
        <button
          type="button"
          onClick={endCall}
          className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-red-500 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 active:scale-95"
          data-testid="end-call"
        >
          <TbPhoneOff size={17} /> {phase === "ringing" ? "Cancel" : "End"}
        </button>
      </div>
    </div>
  );
}

function ControlButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-10 items-center justify-center rounded-full border transition active:scale-95",
        active ? "border-transparent bg-foreground text-background" : "border-border bg-background text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
