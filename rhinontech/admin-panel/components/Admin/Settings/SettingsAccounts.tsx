"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import { TbBrandWindows, TbLink, TbUnlink } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { LinkedInConnectCard } from "@/components/Admin/Outreach/publishing/LinkedInConnectCard";
import type { LinkedInStatus } from "@/components/Admin/Outreach/shared/types";
import { apiFetch } from "@/lib/api";
import { LoadingRows, Notice, Pill, SettingsCard, SettingsFrame, Spinner } from "./parts";

type Provider = "GOOGLE" | "MICROSOFT";

interface AccountsState {
  providers: { provider: Provider; configured: boolean; redirectUri: string }[];
  accounts: { provider: Provider; email: string; name: string | null; connectedAt: string }[];
}

const META: Record<Provider, { name: string; icon: React.ReactNode; what: string }> = {
  GOOGLE: { name: "Google", icon: <FcGoogle size={22} />, what: "Send ticket replies from your Gmail or Google Workspace address." },
  MICROSOFT: { name: "Microsoft", icon: <TbBrandWindows size={22} className="text-[#0078d4]" />, what: "Send ticket replies from your Outlook or Microsoft 365 address." },
};

const ERRORS: Record<string, string> = {
  access_denied: "You cancelled the connection.",
  auth_failed: "The connection didn't go through. Try again.",
  missing_code: "The provider didn't send us back a code. Try again.",
};

/**
 * Settings → Accounts: your own mailboxes, connected so replies can go out
 * from them. Each person connects their own; nobody sees anyone else's.
 */
export function SettingsAccounts() {
  const router = useRouter();
  const params = useSearchParams();
  const confirm = useConfirm();
  const [state, setState] = useState<AccountsState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Provider | null>(null);
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
    const ok = await confirm({ title: `Disconnect ${email}?`, description: "Replies will go out from your brand's address instead.", confirmLabel: "Disconnect", destructive: true });
    if (!ok) return;
    try {
      await apiFetch(`/integrations/accounts/${provider.toLowerCase()}`, { method: "DELETE" });
      setState((s) => (s ? { ...s, accounts: s.accounts.filter((a) => a.provider !== provider) } : s));
      toast.success("Disconnected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not disconnect");
    }
  };

  return (
    <SettingsFrame title="Accounts" description="Connect your own mailboxes and social accounts">
      {error && <Notice tone="danger">{error}</Notice>}
      {!state && !error && <LoadingRows rows={2} />}
      {state?.providers.map(({ provider, configured }) => {
        const account = state.accounts.find((a) => a.provider === provider);
        const meta = META[provider];
        return (
          <SettingsCard key={provider} testId={`account-${provider.toLowerCase()}`}>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background">{meta.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{meta.name}</h3>
                  {account ? <Pill tone="green">Connected</Pill> : !configured ? <Pill tone="amber">Not set up</Pill> : null}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {account ? `${account.name ? `${account.name} · ` : ""}${account.email}` : configured ? meta.what : "The server has no OAuth app for this provider yet."}
                </p>
              </div>
              {account ? (
                <Button variant="outline" size="sm" onClick={() => void disconnect(provider, account.email)}>
                  <TbUnlink size={14} /> Disconnect
                </Button>
              ) : (
                <Button size="sm" onClick={() => void connect(provider)} disabled={!configured || busy !== null} data-testid={`connect-${provider.toLowerCase()}`}>
                  {busy === provider ? <Spinner /> : <TbLink size={14} />} Connect
                </Button>
              )}
            </div>
          </SettingsCard>
        );
      })}
      {state && <LinkedInConnectCard status={linkedin} onStatusChange={setLinkedin} />}
      {state && (
        <p className="px-1 text-xs leading-relaxed text-muted-foreground">
          Only you can use your connected mailboxes. When replying to a chatbot ticket, pick one under “Send from”. Rhinon only asks for permission to send mail, never to read it.
        </p>
      )}
    </SettingsFrame>
  );
}
