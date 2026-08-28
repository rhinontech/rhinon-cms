"use client";

import { useState } from "react";
import { TbBrandLinkedin, TbLink, TbLoader, TbUnlink } from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import type { LinkedInStatus } from "../shared/types";

export function LinkedInConnectCard({
  status,
  onStatusChange,
}: {
  status: LinkedInStatus | null;
  onStatusChange: (next: LinkedInStatus) => void;
}) {
  const confirm = useConfirm();
  const [connecting, setConnecting] = useState(false);

  if (status === null) return null;
  const connected = status.connected && !status.isExpired;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const data = await apiFetch<{ authUrl: string }>("/linkedin/auth");
      if (data.authUrl) window.location.href = data.authUrl;
    } catch (err: any) {
      toast.error("Failed to start LinkedIn auth: " + err.message);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const ok = await confirm({
      title: "Disconnect LinkedIn?",
      description: "Publishing will stop working until you reconnect.",
      confirmLabel: "Disconnect",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch("/linkedin/disconnect", { method: "POST" });
      onStatusChange({ connected: false });
      toast.success("LinkedIn disconnected");
    } catch (err: any) {
      toast.error("Failed to disconnect: " + err.message);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3 text-sm",
        connected ? "border-emerald-100 dark:border-emerald-400/20 bg-emerald-50 dark:bg-emerald-400/10 text-emerald-800 dark:text-emerald-200" : "border-border bg-muted/40 text-muted-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        <TbBrandLinkedin size={20} className={connected ? "text-emerald-600 dark:text-emerald-300" : "text-muted-foreground"} />
        <div>
          <p className="text-xs font-semibold">
            {connected
              ? `LinkedIn connected${status.profile?.name ? ` · ${status.profile.name}` : ""}`
              : status.isExpired
              ? "LinkedIn token expired — please reconnect"
              : "LinkedIn not connected"}
          </p>
          <p className="text-[10px] font-medium opacity-60">
            {connected ? "Ready to publish posts, videos & articles" : "Connect to publish to LinkedIn"}
          </p>
        </div>
      </div>
      {connected ? (
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-red-600 dark:hover:text-red-300"
        >
          <TbUnlink size={12} /> Disconnect
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {connecting ? <TbLoader className="animate-spin" size={12} /> : <TbLink size={12} />}
          Connect LinkedIn
        </button>
      )}
    </div>
  );
}
