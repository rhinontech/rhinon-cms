"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import { getIceServers } from "./iceConfig";
import { acquireChatSocket, releaseChatSocket } from "./chatbotApi";

/**
 * Agent side of a voice call to a website visitor. The server owns the call
 * (services/chatbot/callSignaling.ts): it rings every tab the visitor has
 * open, times out after 30 seconds and tells us how the call ended.
 *
 *   idle → ringing (we called) → connecting (they picked up) → live → idle
 */
export type CallPhase = "idle" | "ringing" | "connecting" | "live";

export interface CallContextType {
  phase: CallPhase;
  /** Kept for the call buttons: true while ringing, connecting or live. */
  isInCall: boolean;
  isCalling: boolean;
  /** Who we're calling, as the screen that started the call named them. */
  peerName: string;
  callDuration: string;
  isMuted: boolean;
  isSpeakerOn: boolean;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  startCall: (visitorId: string, name?: string) => Promise<void>;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

const ENDED_MESSAGE: Record<string, string> = {
  missed: "No answer",
  disconnected: "The call dropped",
  failed: "The call couldn't connect",
  ended: "Call ended",
};

/** A soft two-tone ring-back while the visitor's widget rings. */
function startRingback(): () => void {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return () => undefined;
  const ctx = new Ctx();
  const beep = () => {
    if (ctx.state === "closed") return;
    for (const [offset, freq] of [[0, 440], [0.4, 480]] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      const at = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.05, at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.36);
    }
  };
  beep();
  const timer = setInterval(beep, 3000);
  return () => {
    clearInterval(timer);
    void ctx.close().catch(() => undefined);
  };
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [peerName, setPeerName] = useState("Visitor");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState("00:00");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteSocketIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.autoplay = true;
    remoteAudioRef.current = audio;
    return () => {
      audio.srcObject = null;
      remoteAudioRef.current = null;
    };
  }, []);

  /** Releases the mic and the peer connection; safe to call twice. */
  const reset = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    pendingCandidatesRef.current = [];
    remoteSocketIdRef.current = null;
    setPhase("idle");
    setStartedAt(null);
    setIsMuted(false);
    setIsSpeakerOn(true);
  }, []);

  const endCall = useCallback(() => {
    socketRef.current?.emit("end_call_manual");
    reset();
  }, [reset]);

  const flushCandidates = useCallback(async () => {
    const peer = peerRef.current;
    if (!peer?.remoteDescription) return;
    const queued = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const c of queued) await peer.addIceCandidate(new RTCIceCandidate(c)).catch(() => undefined);
  }, []);

  /** The visitor picked up: we make the offer. */
  const connect = useCallback(
    async (remoteSocketId: string) => {
      const socket = socketRef.current;
      const stream = localStreamRef.current;
      if (!socket || !stream) return;
      remoteSocketIdRef.current = remoteSocketId;
      const peer = new RTCPeerConnection({ iceServers: getIceServers() });
      peerRef.current = peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ontrack = (e) => {
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = e.streams[0];
      };
      peer.onicecandidate = (e) => {
        if (e.candidate) socket.emit("ice_candidate_manual", { candidate: e.candidate, to: remoteSocketId });
      };
      peer.oniceconnectionstatechange = () => {
        const state = peer.iceConnectionState;
        if (state === "connected" || state === "completed") {
          setPhase("live");
          setStartedAt((t) => t ?? Date.now());
        } else if (state === "disconnected") {
          setPhase("connecting");
        } else if (state === "failed") {
          toast.error("The call couldn't connect — no audio route to the visitor.");
          socket.emit("end_call_manual", { reason: "failed" });
          reset();
        }
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("offer_manual", { offer, to: remoteSocketId });
    },
    [reset]
  );

  useEffect(() => {
    const s = acquireChatSocket();
    if (!s) return;
    socketRef.current = s;

    const onAccepted = ({ from }: { from: string }) => {
      setPhase("connecting");
      void connect(from);
    };
    const onRejected = () => {
      toast.info("The visitor declined the call");
      reset();
    };
    const onEnded = ({ reason }: { reason?: string }) => {
      const message = ENDED_MESSAGE[reason ?? "ended"];
      if (message) toast.info(message);
      reset();
    };
    const onAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      await flushCandidates();
    };
    const onIce = ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      const peer = peerRef.current;
      if (!candidate) return;
      if (!peer?.remoteDescription) pendingCandidatesRef.current.push(candidate);
      else void peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => undefined);
    };
    const onError = ({ message }: { message?: string }) => {
      toast.error(message || "The call couldn't start");
      reset();
    };

    s.on("call_accepted_manual", onAccepted);
    s.on("call_rejected_manual", onRejected);
    s.on("call_ended_manual", onEnded);
    s.on("answer_manual", onAnswer);
    s.on("ice_candidate_manual", onIce);
    s.on("call_error", onError);
    return () => {
      s.off("call_accepted_manual", onAccepted);
      s.off("call_rejected_manual", onRejected);
      s.off("call_ended_manual", onEnded);
      s.off("answer_manual", onAnswer);
      s.off("ice_candidate_manual", onIce);
      s.off("call_error", onError);
      releaseChatSocket();
    };
  }, [connect, flushCandidates, reset]);

  // Ring-back while the visitor's widget rings.
  useEffect(() => (phase === "ringing" ? startRingback() : undefined), [phase]);

  // Hang up if the agent closes or reloads the tab mid-call.
  useEffect(() => {
    if (phase === "idle") return;
    const onUnload = () => socketRef.current?.emit("end_call_manual");
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [phase]);

  useEffect(() => {
    if (!startedAt) return void setCallDuration("00:00");
    const tick = () => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      setCallDuration(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const startCall = async (visitorId: string, name = "Visitor") => {
    const socket = socketRef.current;
    if (!socket?.connected) return void toast.error("Live connection is down — try again in a moment.");
    if (phase !== "idle") return;
    try {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return void toast.error("Allow microphone access in your browser to call visitors.");
    }
    setPeerName(name);
    setPhase("ringing");
    socket.emit("call_user_manual", { targetCallId: visitorId });
  };

  const toggleMute = () => {
    const tracks = localStreamRef.current?.getAudioTracks() ?? [];
    const next = !isMuted;
    tracks.forEach((t) => (t.enabled = !next));
    setIsMuted(next);
  };

  const toggleSpeaker = () => {
    const audio = remoteAudioRef.current;
    if (!audio) return;
    audio.muted = isSpeakerOn;
    setIsSpeakerOn(!isSpeakerOn);
  };

  return (
    <CallContext.Provider
      value={{
        phase,
        isInCall: phase !== "idle",
        isCalling: phase === "ringing",
        peerName,
        callDuration,
        isMuted,
        isSpeakerOn,
        toggleMute,
        toggleSpeaker,
        startCall,
        endCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within a CallProvider");
  return ctx;
}
