"use client";

import React from "react";
import { useCall } from "./CallContext";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

export function GlobalCallWidget() {
  const {
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
    acceptCall,
    rejectCall,
    endCall,
  } = useCall();

  if (!isInCall && !isCalling && !incomingCall) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* INCOMING CALL */}
      {incomingCall && !isInCall && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl p-6 w-[320px] flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] uppercase tracking-widest font-bold text-neutral-500 animate-pulse">
              Incoming Call
            </span>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 text-center leading-tight">
              {incomingCall.fromName || "Visitor"}
            </h3>
            <span className="text-xs text-neutral-500 font-mono truncate max-w-[240px]">
              {incomingCall.fromCallId}
            </span>
          </div>

          <div className="flex gap-6 mt-2">
            <button
              onClick={rejectCall}
              title="Decline"
              className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95"
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={acceptCall}
              title="Accept"
              className="w-14 h-14 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 animate-pulse"
            >
              <Phone size={24} />
            </button>
          </div>
        </div>
      )}

      {/* OUTGOING RINGING */}
      {isCalling && (
        <div className="bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900/60 shadow-2xl rounded-2xl p-6 w-[300px] flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mb-2 animate-bounce">
              <Phone size={32} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Calling visitor...</h3>
            <p className="text-sm text-neutral-500 truncate max-w-[240px]">{activeTargetName}</p>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium animate-pulse mt-1">
              Ringing...
            </span>
          </div>

          <button
            onClick={() => endCall(true)}
            className="w-full py-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm active:scale-95"
          >
            <PhoneOff size={16} /> Cancel Call
          </button>
        </div>
      )}

      {/* ACTIVE CALL */}
      {isInCall && (
        <div className="bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-900/60 shadow-2xl rounded-2xl p-6 w-[320px] flex flex-col items-center gap-4">
          <div className="w-full flex flex-col items-center">
            {isConnecting ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-950/40 rounded-full mb-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 tracking-wider">
                  CONNECTING
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 rounded-full mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                  LIVE CALL
                </span>
              </div>
            )}

            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[240px] mb-1">
              {activeTargetName}
            </p>
            <h3 className="text-3xl font-light text-neutral-900 dark:text-neutral-100 tabular-nums tracking-tighter">
              {isConnecting ? "--:--" : callDuration}
            </h3>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={toggleMute}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isMuted
                  ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 shadow-sm"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button
              onClick={toggleSpeaker}
              title={isSpeakerOn ? "Mute Speaker" : "Unmute Speaker"}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isSpeakerOn
                  ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500"
              }`}
            >
              {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            <button
              onClick={() => endCall(true)}
              title="Hang Up"
              className="w-12 h-12 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <PhoneOff size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
