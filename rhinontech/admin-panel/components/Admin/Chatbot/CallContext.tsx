"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import { getIceServers } from "./iceConfig";
import { acquireChatSocket, releaseChatSocket } from "./chatbotApi";

export interface IncomingCall {
  from: string; // Socket ID of caller
  fromCallId: string; // Visitor ID
  fromName?: string;
}

export interface CallContextType {
  isInCall: boolean;
  isConnecting: boolean;
  isCalling: boolean;
  incomingCall: IncomingCall | null;
  callDuration: string;
  isMuted: boolean;
  isSpeakerOn: boolean;
  activeTargetName: string;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  startCall: (targetVisitorId: string, targetName?: string) => Promise<void>;
  endCall: (notifyRemote?: boolean) => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState("00:00");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [activeTargetName, setActiveTargetName] = useState("Visitor");

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteSocketIdRef = useRef<string | null>(null);

  // Global remote audio element
  useEffect(() => {
    if (!remoteAudioRef.current && typeof window !== "undefined") {
      const audio = new Audio();
      audio.autoplay = true;
      remoteAudioRef.current = audio;
      document.body.appendChild(audio);
    }
    return () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
      }
    };
  }, []);

  const cleanupMedia = useCallback(() => {
    setIsConnecting(false);
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    pendingCandidatesRef.current = [];
    remoteSocketIdRef.current = null;
  }, []);

  const flushPendingCandidates = useCallback(async () => {
    const peer = peerRef.current;
    if (!peer || !peer.remoteDescription) return;
    const queued = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];
    for (const candidate of queued) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("[Call] Failed to add queued ICE candidate:", err);
      }
    }
  }, []);

  const endCall = useCallback(
    (notifyRemote = true) => {
      if (notifyRemote && socketRef.current) {
        const to = remoteSocketIdRef.current;
        socketRef.current.emit("end_call_manual", { to });
      }
      cleanupMedia();
      setIsInCall(false);
      setIsConnecting(false);
      setIsCalling(false);
      setIncomingCall(null);
      setCallStartTime(null);
      setCallDuration("00:00");
    },
    [cleanupMedia]
  );

  const startPeerConnection = useCallback(
    async (remoteSocketId: string, isInitiator: boolean, remoteOffer?: RTCSessionDescriptionInit) => {
      const socket = socketRef.current;
      if (!socket) return;
      remoteSocketIdRef.current = remoteSocketId;

      const peer = new RTCPeerConnection({ iceServers: getIceServers() });
      peerRef.current = peer;

      // Add local audio track
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peer.addTrack(track, localStreamRef.current!);
        });
      }

      // Play remote audio
      peer.ontrack = (e) => {
        console.log("[Call] Remote audio stream received:", e.streams[0]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0];
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.autoplay = true;
        }
      };

      // Exchange ICE
      peer.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice_candidate_manual", { candidate: e.candidate, to: remoteSocketId });
        }
      };

      peer.oniceconnectionstatechange = () => {
        const state = peer.iceConnectionState;
        console.log("[Call] ICE connection state:", state);

        if (state === "connected" || state === "completed") {
          setIsConnecting(false);
          setCallStartTime((prev) => prev ?? Date.now());
        } else if (state === "failed") {
          toast.error("Call connection failed — no audio route could be established.");
          endCall();
        } else if (state === "disconnected") {
          setIsConnecting(true);
        }
      };

      if (isInitiator) {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("offer_manual", { offer, to: remoteSocketId });
      } else if (remoteOffer) {
        await peer.setRemoteDescription(new RTCSessionDescription(remoteOffer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("answer_manual", { answer, to: remoteSocketId });
        await flushPendingCandidates();
      }

      const isConnected =
        peer.iceConnectionState === "connected" || peer.iceConnectionState === "completed";
      setIsInCall(true);
      setIsConnecting(!isConnected);
      if (isConnected) setCallStartTime((prev) => prev ?? Date.now());
    },
    [endCall, flushPendingCandidates]
  );

  // Setup Socket listeners
  useEffect(() => {
    const s = acquireChatSocket();
    if (!s) return;
    socketRef.current = s;

    const onCallAccepted = async ({ from }: { from: string }) => {
      console.log("[Call] User accepted call from:", from);
      setIsCalling(false);
      await startPeerConnection(from, true);
    };

    const onCallRejected = () => {
      console.log("[Call] Call was rejected");
      setIsCalling(false);
      toast.info("Call was rejected by the visitor.");
      cleanupMedia();
    };

    const onCallRequest = ({ from, fromName, fromCallId }: IncomingCall) => {
      console.log("[Call] Incoming call from visitor:", fromCallId);
      setIncomingCall({ from, fromName, fromCallId });
      setActiveTargetName(fromName || fromCallId || "Visitor");
    };

    const onCallEnded = () => {
      console.log("[Call] Call ended by remote peer");
      toast.info("Call ended");
      endCall(false);
    };

    const onOffer = async ({ offer, from }: { offer: RTCSessionDescriptionInit; from: string }) => {
      console.log("[Call] Received SDP offer from:", from);
      await startPeerConnection(from, false, offer);
    };

    const onAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (!peerRef.current) return;
      console.log("[Call] Received SDP answer");
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      await flushPendingCandidates();
    };

    const onIceCandidate = ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (!candidate || !peerRef.current) return;
      if (!peerRef.current.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
      } else {
        peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      }
    };

    const onCallError = (data: { message?: string }) => {
      console.warn("[Call] Error:", data?.message);
      setIsCalling(false);
      toast.error(data?.message || "Call error occurred");
      cleanupMedia();
    };

    s.on("call_accepted_manual", onCallAccepted);
    s.on("call_rejected_manual", onCallRejected);
    s.on("call_request_manual", onCallRequest);
    s.on("call_ended_manual", onCallEnded);
    s.on("offer_manual", onOffer);
    s.on("answer_manual", onAnswer);
    s.on("ice_candidate_manual", onIceCandidate);
    s.on("call_error", onCallError);

    return () => {
      s.off("call_accepted_manual", onCallAccepted);
      s.off("call_rejected_manual", onCallRejected);
      s.off("call_request_manual", onCallRequest);
      s.off("call_ended_manual", onCallEnded);
      s.off("offer_manual", onOffer);
      s.off("answer_manual", onAnswer);
      s.off("ice_candidate_manual", onIceCandidate);
      s.off("call_error", onCallError);
      releaseChatSocket();
    };
  }, [cleanupMedia, endCall, flushPendingCandidates, startPeerConnection]);

  // Duration Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInCall && callStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const s = String(elapsed % 60).padStart(2, "0");
        setCallDuration(`${m}:${s}`);
      }, 1000);
    } else {
      setCallDuration("00:00");
    }
    return () => clearInterval(interval);
  }, [isInCall, callStartTime]);

  const startCall = async (targetVisitorId: string, targetName = "Visitor") => {
    if (!socketRef.current) {
      toast.error("Chat socket not connected");
      return;
    }
    if (!targetVisitorId) {
      toast.error("Invalid visitor ID");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
    } catch (err) {
      console.error("[Call] Mic access error:", err);
      toast.error("Microphone access denied. Please allow microphone permissions.");
      return;
    }

    setIsCalling(true);
    setIsInCall(false);
    setCallDuration("00:00");
    setActiveTargetName(targetName);

    console.log(`[Call] Calling visitor ${targetVisitorId}...`);
    socketRef.current.emit("call_user_manual", { targetCallId: targetVisitorId });
  };

  const acceptCall = async () => {
    if (!incomingCall || !socketRef.current) return;
    const { from } = incomingCall;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
    } catch (err) {
      console.error("[Call] Mic access error:", err);
      toast.error("Microphone access failed.");
      return;
    }

    setIncomingCall(null);
    socketRef.current.emit("call_accepted_manual", { to: from });
  };

  const rejectCall = () => {
    if (!incomingCall || !socketRef.current) return;
    socketRef.current.emit("call_rejected_manual", { to: incomingCall.from });
    setIncomingCall(null);
    cleanupMedia();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsSpeakerOn(!remoteAudioRef.current.muted);
    }
  };

  return (
    <CallContext.Provider
      value={{
        isInCall,
        isConnecting,
        isCalling,
        incomingCall,
        callDuration,
        isMuted,
        isSpeakerOn,
        activeTargetName,
        toggleMute,
        toggleSpeaker,
        startCall,
        endCall,
        acceptCall,
        rejectCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall(): CallContextType {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return ctx;
}
