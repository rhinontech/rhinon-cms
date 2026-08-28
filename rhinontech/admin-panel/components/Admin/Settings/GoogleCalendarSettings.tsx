"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TbCalendarEvent, TbLink, TbLoader, TbUnlink } from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";

interface CalendarStatus {
  configured: boolean;
  connected: boolean;
  connectedEmail: string | null;
  calendarId: string | null;
  connectedAt: string | null;
}

const ERROR_COPY: Record<string, string> = {
  access_denied: "Consent was declined on the Google screen.",
  missing_code: "Google didn't return an authorization code. Please try again.",
  not_configured: "Server is missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.",
  no_refresh_token: "Google didn't return a refresh token. Remove this app at myaccount.google.com/permissions, then connect again.",
  auth_failed: "Could not complete the Google handshake. Check the server logs.",
};

export function GoogleCalendarSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useConfirm();
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setStatus(await apiFetch<CalendarStatus>("/google-calendar/status"));
    } catch (err: any) {
      toast.error("Couldn't load calendar status: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Surface the outcome of the OAuth round-trip, then strip the query params so a
  // refresh doesn't re-fire the toast.
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (!connected && !error) return;
    if (connected) toast.success("Google Calendar connected");
    if (error) toast.error(ERROR_COPY[error] || `Connection failed: ${error}`);
    router.replace(window.location.pathname);
  }, [searchParams, router]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { authUrl } = await apiFetch<{ authUrl: string }>("/google-calendar/auth");
      window.location.href = authUrl;
    } catch (err: any) {
      toast.error("Couldn't start Google sign-in: " + err.message);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const ok = await confirm({
      title: "Disconnect Google Calendar?",
      description: "The Meetings tab will stop showing events until it's reconnected.",
      confirmLabel: "Disconnect",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch("/google-calendar/disconnect", { method: "POST" });
      toast.success("Google Calendar disconnected");
      fetchStatus();
    } catch (err: any) {
      toast.error("Couldn't disconnect: " + err.message);
    }
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const connected = Boolean(status?.connected);

  return (
    <div className="mx-auto max-w-[720px] space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Google Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Connect the shared <span className="font-medium">support@rhinon.tech</span> calendar once. Everyone with calendar
          access then sees the same events in the Meetings tab.
        </p>
      </div>

      {!status?.configured && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-400/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <span className="font-semibold">Server not configured.</span> Set <code>GOOGLE_CLIENT_ID</code> and{" "}
          <code>GOOGLE_CLIENT_SECRET</code> in the backend environment, then reload this page.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
          <CardDescription>Sign in as support@rhinon.tech when Google asks — that account owns the calendar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
              connected ? "border-emerald-100 dark:border-emerald-400/20 bg-emerald-50 dark:bg-emerald-400/10 text-emerald-800 dark:text-emerald-200" : "border-border bg-muted/40 text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <TbCalendarEvent size={20} className={connected ? "text-emerald-600 dark:text-emerald-300" : "text-muted-foreground"} />
              <div>
                <p className="text-xs font-semibold">
                  {connected ? `Connected${status?.connectedEmail ? ` · ${status.connectedEmail}` : ""}` : "Not connected"}
                </p>
                <p className="text-[10px] font-medium opacity-60">
                  {connected
                    ? "Meetings tab is live"
                    : status?.configured
                      ? "One-time sign-in — stays connected afterwards"
                      : "Server credentials missing"}
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
                disabled={connecting || !status?.configured}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {connecting ? <TbLoader className="animate-spin" size={12} /> : <TbLink size={12} />}
                Connect Google Calendar
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
