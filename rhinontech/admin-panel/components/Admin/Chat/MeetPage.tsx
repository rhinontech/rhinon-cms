"use client";

import { useEffect, useRef, useState } from "react";
import { TbLoader2, TbMicrophone, TbMicrophoneOff, TbVideo, TbVideoOff, TbAlertTriangle } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { connectGuestSocket, meetApi } from "./teamChatApi";
import { bindCallEvents, joinAsGuest, setIceServers, useCall } from "./calls";
import { CallOverlay } from "./CallOverlay";

/**
 * The page behind a meeting link (/meet/<token>): no account. A guest enters a
 * name, checks camera and mic, and joins. With a lobby they wait until someone
 * in the call lets them in. They only ever see the call, never the chat.
 */
export function MeetPage({ token }: { token: string }) {
  const [info, setInfo] = useState<{ title: string; orgName: string; requireApproval: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [preview, setPreview] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [self, setSelf] = useState<{ id: string; name: string } | null>(null);
  const phase = useCall((s) => s.phase);
  const endedReason = useCall((s) => s.endedReason);
  const videoRef = useRef<HTMLVideoElement>(null);
  const unbind = useRef<(() => void) | null>(null);

  useEffect(() => {
    meetApi.info(token).then(setInfo).catch((e) => setError(e.message));
    try {
      setName(localStorage.getItem("meet:name") ?? "");
    } catch {
      /* storage unavailable */
    }
    return () => unbind.current?.();
  }, [token]);

  // Camera preview on the pre-join screen.
  useEffect(() => {
    if (self || !camOn) {
      setPreview(null);
      return;
    }
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        setPreview(s);
        setMediaError(null);
      })
      .catch(() => {
        setMediaError("Camera not available — you can still join with audio.");
        setCamOn(false);
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [camOn, self]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = preview;
  }, [preview]);

  const join = async () => {
    if (name.trim().length < 2) return;
    setJoining(true);
    try {
      localStorage.setItem("meet:name", name.trim());
    } catch {
      /* storage unavailable */
    }
    try {
      const res = await meetApi.join(token, name.trim());
      preview?.getTracks().forEach((t) => t.stop());
      setIceServers(res.iceServers);
      const socket = connectGuestSocket(res.guestToken);
      await new Promise<void>((resolve, reject) => {
        socket.once("connect", () => resolve());
        socket.once("connect_error", () => reject(new Error("This meeting link is no longer valid.")));
      });
      unbind.current?.();
      unbind.current = bindCallEvents({ guest: true });
      setSelf({ id: res.guestId, name: `${name.trim()} (Guest)` });
      await joinAsGuest(res.title, { video: camOn, mic: micOn });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setJoining(false);
    }
  };

  if (error) {
    return (
      <Shell>
        <TbAlertTriangle className="size-10 text-amber-500" />
        <h1 className="text-xl font-semibold">Can&apos;t join this meeting</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
      </Shell>
    );
  }

  if (!info) {
    return (
      <Shell>
        <TbLoader2 className="size-6 animate-spin text-muted-foreground" />
      </Shell>
    );
  }

  // "idle" after joining = media was refused or the attempt was abandoned.
  if (self && (phase === "ended" || phase === "idle")) {
    const denied = endedReason === "denied";
    return (
      <Shell>
        <h1 className="text-xl font-semibold">{denied ? "You weren't let in" : endedReason === "left" ? "You left the meeting" : endedReason ? "The meeting has ended" : "You're not in the meeting"}</h1>
        <p className="text-sm text-muted-foreground">{info.title}</p>
        {!denied && (
          <Button onClick={() => void joinAsGuest(info.title, { video: camOn, mic: micOn })}>Rejoin</Button>
        )}
      </Shell>
    );
  }

  if (self) return <CallOverlay selfId={self.id} selfName={self.name} guest />;

  return (
    <Shell>
      <p className="text-sm text-muted-foreground">{info.orgName}</p>
      <h1 className="-mt-2 text-2xl font-semibold">{info.title}</h1>
      <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-2xl bg-zinc-900">
        {camOn && preview ? (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full -scale-x-100 object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/60">Camera is off</div>
        )}
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-3">
          <button
            onClick={() => setMicOn((v) => !v)}
            title={micOn ? "Mute" : "Unmute"}
            className={cn("flex size-11 items-center justify-center rounded-full", micOn ? "bg-white/20 text-white" : "bg-white text-zinc-900")}
          >
            {micOn ? <TbMicrophone className="size-5" /> : <TbMicrophoneOff className="size-5" />}
          </button>
          <button
            onClick={() => setCamOn((v) => !v)}
            title={camOn ? "Turn camera off" : "Turn camera on"}
            className={cn("flex size-11 items-center justify-center rounded-full", camOn ? "bg-white/20 text-white" : "bg-white text-zinc-900")}
          >
            {camOn ? <TbVideo className="size-5" /> : <TbVideoOff className="size-5" />}
          </button>
        </div>
      </div>
      {mediaError && <p className="text-xs text-muted-foreground">{mediaError}</p>}
      <form
        className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void join();
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={60} autoFocus aria-label="Your name" />
        <Button type="submit" disabled={joining || name.trim().length < 2} className="sm:w-32">
          {joining && <TbLoader2 className="animate-spin" />} Join now
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        {info.requireApproval ? "Someone in the meeting will let you in." : "You'll join as soon as the meeting starts."}
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-4 py-10 text-center">{children}</main>
  );
}
