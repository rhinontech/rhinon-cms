"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import { TbAlertTriangle, TbBrandWindows, TbCalendarOff, TbLink, TbMail, TbRefresh, TbUnlink } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { LinkedInConnectCard } from "@/components/Admin/Outreach/publishing/LinkedInConnectCard";
import type { LinkedInStatus } from "@/components/Admin/Outreach/shared/types";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LoadingRows, Notice, Pill, SettingsCard, SettingsFrame, Spinner } from "./parts";

type Provider = "GOOGLE" | "MICROSOFT";
type Choice = "platform" | Provider;
type Module = "inbox" | "campaigns" | "tickets" | "meetings";

interface ConnectedAccount {
  provider: Provider;
  email: string;
  name: string | null;
  connectedAt: string;
  calendarAccess: boolean;
  sentToday: number;
  dailyLimit: number;
}

interface AccountsState {
  providers: { provider: Provider; configured: boolean; redirectUri: string }[];
  accounts: ConnectedAccount[];
  platformEmail: string | null;
  preferences: Partial<Record<Module, Choice>>;
}

const META: Record<Provider, { name: string; icon: React.ReactNode; what: string }> = {
  GOOGLE: { name: "Google", icon: <FcGoogle size={22} />, what: "Gmail or Google Workspace — send mail and use your Google Calendar." },
  MICROSOFT: { name: "Microsoft", icon: <TbBrandWindows size={22} className="text-[#0078d4]" />, what: "Outlook or Microsoft 365 — send mail and use your Outlook calendar." },
};

const MODULES: { key: Module; label: string; hint: string }[] = [
  { key: "inbox", label: "Inbox", hint: "New mail and replies you send from your own address" },
  { key: "campaigns", label: "Campaigns", hint: "Outreach emails when you're the sender" },
  { key: "tickets", label: "Tickets", hint: "Replies to chatbot tickets" },
  { key: "meetings", label: "Meetings", hint: "Your calendar, and who sends the invites" },
];

const ERRORS: Record<string, string> = {
  access_denied: "You cancelled the connection.",
  auth_failed: "The connection didn't go through. Try again.",
  missing_code: "The provider didn't send us back a code. Try again.",
};

const fmt = (n: number) => n.toLocaleString("en-IN");

/**
 * Settings → Accounts: each person's own mailboxes, and which address every
 * module sends from. The platform address is always there; a connected Gmail or
 * Outlook can stand in for it per module. Replies always come back to the
 * platform address, so threads stay in the Inbox.
 */
export function SettingsAccounts() {
  const router = useRouter();
  const params = useSearchParams();
  const confirm = useConfirm();
  const [state, setState] = useState<AccountsState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Provider | null>(null);
  const [saving, setSaving] = useState<Module | null>(null);
  const [linkedin, setLinkedin] = useState<LinkedInStatus | null>(null);

  const load = useCallback(async () => {
    try {
      setState(await apiFetch<AccountsState>("/integrations/accounts"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your accounts");
    }
  }, []);

  useEffect(() => {
    void load();
    apiFetch<LinkedInStatus>("/linkedin/status").then(setLinkedin).catch(() => undefined);
  }, [load]);

  // Back from the provider: say how it went, then tidy the URL.
  useEffect(() => {
    const connected = params.get("connected");
    const failed = params.get("error");
    if (!connected && !failed) return;
    if (connected) toast.success(`${connected === "google" ? "Google" : "Microsoft"} account connected`);
    else toast.error(ERRORS[failed!] ?? "The connection didn't go through.");
    router.replace(window.location.pathname);
  }, [params, router]);

  const connect = async (provider: Provider) => {
    setBusy(provider);
    try {
      const { authUrl } = await apiFetch<{ authUrl: string }>(`/integrations/accounts/${provider.toLowerCase()}/auth`);
      window.location.href = authUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the connection");
      setBusy(null);
    }
  };

  const disconnect = async (provider: Provider, email: string) => {
    const ok = await confirm({
      title: `Disconnect ${email}?`,
      description: "Anything set to use it goes back to your platform address, and your meetings move off its calendar.",
      confirmLabel: "Disconnect",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/integrations/accounts/${provider.toLowerCase()}`, { method: "DELETE" });
      await load();
      toast.success("Disconnected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not disconnect");
    }
  };

  const choose = async (module: Module, choice: Choice) => {
    if (!state) return;
    const previous = state.preferences;
    setState({ ...state, preferences: { ...previous, [module]: choice } });
    setSaving(module);
    try {
      const res = await apiFetch<{ preferences: AccountsState["preferences"] }>("/integrations/accounts/preferences", {
        method: "PUT",
        body: JSON.stringify({ preferences: { [module]: choice } }),
      });
      setState((s) => (s ? { ...s, preferences: res.preferences } : s));
    } catch (err) {
      setState((s) => (s ? { ...s, preferences: previous } : s));
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(null);
    }
  };

  const account = (p: Provider) => state?.accounts.find((a) => a.provider === p);
  const usesAccountForSending = (p: Provider) =>
    (["inbox", "campaigns", "tickets"] as Module[]).some((m) => state?.preferences[m] === p);

  return (
    <SettingsFrame title="Accounts" description="Your mailboxes and calendars, and which address each part of the platform uses">
      {error && <Notice tone="danger">{error}</Notice>}
      {!state && !error && <LoadingRows rows={3} />}

      {state && (
        <>
          {/* Platform address — always available */}
          <SettingsCard testId="account-platform">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                <TbMail size={20} className="text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Platform address</h3>
                  <Pill tone="green">Always on</Pill>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {state.platformEmail ?? "No address yet"} · Replies always arrive here, in your Inbox.
                </p>
              </div>
            </div>
          </SettingsCard>

          {state.providers.map(({ provider, configured }) => {
            const acc = account(provider);
            const meta = META[provider];
            const pct = acc ? Math.min(100, Math.round((acc.sentToday / acc.dailyLimit) * 100)) : 0;
            return (
              <SettingsCard key={provider} testId={`account-${provider.toLowerCase()}`}>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background">{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{meta.name}</h3>
                      {acc ? <Pill tone="green">Connected</Pill> : !configured ? <Pill tone="amber">Not set up</Pill> : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {acc ? `${acc.name ? `${acc.name} · ` : ""}${acc.email}` : configured ? meta.what : "The server has no OAuth app for this provider yet."}
                    </p>
                  </div>
                  {acc ? (
                    <Button variant="outline" size="sm" onClick={() => void disconnect(provider, acc.email)}>
                      <TbUnlink size={14} /> Disconnect
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => void connect(provider)} disabled={!configured || busy !== null} data-testid={`connect-${provider.toLowerCase()}`}>
                      {busy === provider ? <Spinner /> : <TbLink size={14} />} Connect
                    </Button>
                  )}
                </div>

                {acc && (
                  <div className="mt-4 space-y-3 border-t border-border/70 pt-4">
                    <div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-muted-foreground">Sent today</span>
                        <span className="font-medium tabular-nums" data-testid={`sent-${provider.toLowerCase()}`}>
                          {fmt(acc.sentToday)} <span className="text-muted-foreground">of ~{fmt(acc.dailyLimit)} a day</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    {!acc.calendarAccess && (
                      <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
                        <TbCalendarOff size={15} className="mt-px shrink-0" />
                        <span className="flex-1">This connection has no calendar access yet. Reconnect to use your {meta.name} calendar for Meetings.</span>
                        <button type="button" onClick={() => void connect(provider)} className="inline-flex shrink-0 items-center gap-1 font-medium underline-offset-2 hover:underline">
                          <TbRefresh size={13} /> Reconnect
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </SettingsCard>
            );
          })}

          {/* Which address each module uses */}
          <SettingsCard title="Use for" description="Pick which address each part of the platform sends from. Replies always come back to your platform address." testId="email-preferences">
            <div className="divide-y divide-border/70">
              {MODULES.map((m) => {
                const value = state.preferences[m.key] ?? "platform";
                const options: { value: Choice; label: string; disabled?: boolean }[] = [
                  { value: "platform", label: state.platformEmail ?? "Platform address" },
                  ...(["GOOGLE", "MICROSOFT"] as Provider[])
                    .map((p) => account(p))
                    .filter((a): a is ConnectedAccount => Boolean(a))
                    .map((a) => ({
                      value: a.provider as Choice,
                      label: `${a.email} (${META[a.provider].name})`,
                      disabled: m.key === "meetings" && !a.calendarAccess,
                    })),
                ];
                return (
                  <div key={m.key} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.hint}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {saving === m.key && <Spinner />}
                      <select
                        value={value}
                        onChange={(e) => void choose(m.key, e.target.value as Choice)}
                        disabled={saving !== null || options.length === 1}
                        className="h-9 w-[19rem] max-w-full truncate rounded-lg border border-input bg-background px-3 text-sm disabled:opacity-60"
                        data-testid={`use-${m.key}`}
                      >
                        {options.map((o) => (
                          <option key={o.value} value={o.value} disabled={o.disabled}>
                            {o.label}
                            {o.disabled ? " — reconnect for calendar" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {(["GOOGLE", "MICROSOFT"] as Provider[]).some(usesAccountForSending) && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100" data-testid="limits-disclaimer">
                <TbAlertTriangle size={15} className="mt-px shrink-0" />
                <span>
                  Mail sent through Gmail or Outlook counts against that provider&apos;s daily limit — about 500 recipients a day for personal Gmail, 2,000 for Google
                  Workspace, 300 for Outlook.com and 10,000 for Microsoft 365. Past it, the provider refuses mail until the next day. Large campaigns are safer from your
                  platform address, which has no such cap.
                </span>
              </div>
            )}
            {state.accounts.length === 0 && (
              <p className="mt-3 text-xs text-muted-foreground">Connect Google or Microsoft above to choose them here.</p>
            )}
          </SettingsCard>

          <LinkedInConnectCard status={linkedin} onStatusChange={setLinkedin} />
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Only you can use your connected accounts. Rhinon asks for permission to send mail and manage calendar events — never to read your mail.
          </p>
        </>
      )}
    </SettingsFrame>
  );
}

