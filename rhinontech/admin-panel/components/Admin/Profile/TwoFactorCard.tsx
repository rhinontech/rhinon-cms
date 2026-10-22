"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { TbAlertCircle, TbDownload, TbShieldCheck, TbShieldLock } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { CopyButton, Pill, Spinner } from "@/components/Admin/Settings/parts";

interface Status {
  enabled: boolean;
  recoveryCodesLeft: number;
}

interface Setup {
  secret: string;
  otpauthUrl: string;
  qr: string;
}

const groups = (secret: string) => secret.match(/.{1,4}/g)?.join(" ") ?? secret;

/**
 * Two-step verification for the signed-in person's own account.
 *
 * Turning it on is deliberately three steps — scan, prove it works with a code,
 * then save the recovery codes — because the failure this prevents is the one
 * where someone enables it, loses their phone, and is locked out of their own
 * company. The recovery codes are shown once, here, and nowhere else.
 */
export function TwoFactorCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);

  const [offOpen, setOffOpen] = useState(false);
  const [offPassword, setOffPassword] = useState("");
  const [offCode, setOffCode] = useState("");
  const [offRecovery, setOffRecovery] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await apiFetch<Status>("/auth/2fa/status"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load two-step verification");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const start = async () => {
    setBusy(true);
    setFormError("");
    try {
      const res = await apiFetch<{ secret: string; otpauthUrl: string }>("/auth/2fa/setup", { method: "POST" });
      const qr = await QRCode.toDataURL(res.otpauthUrl, { margin: 1, width: 224, errorCorrectionLevel: "M" });
      setSetup({ ...res, qr });
      setCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start setup");
    } finally {
      setBusy(false);
    }
  };

  const enable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const res = await apiFetch<{ recoveryCodes: string[] }>("/auth/2fa/enable", { method: "POST", body: JSON.stringify({ code: code.replace(/\s+/g, "") }) });
      setCodes(res.recoveryCodes);
      setSaved(false);
      setSetup(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "That code is not correct.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      await apiFetch("/auth/2fa/disable", {
        method: "POST",
        body: JSON.stringify({ password: offPassword, ...(offRecovery ? { recoveryCode: offCode.trim() } : { code: offCode.replace(/\s+/g, "") }) }),
      });
      toast.success("Two-step verification turned off");
      setOffOpen(false);
      setOffPassword("");
      setOffCode("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not turn it off");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!codes) return;
    const text = `Recovery codes — keep these somewhere safe.\nEach works once.\n\n${codes.join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden" data-testid="two-factor">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b">
        <div>
          <p className="font-semibold text-foreground">Two-step verification</p>
          <p className="text-xs text-muted-foreground mt-0.5">Ask for a code from your phone at sign-in, so a stolen password alone is not enough.</p>
        </div>
        {status && (status.enabled ? <Pill tone="green" testId="mfa-on"><TbShieldCheck size={13} /> On</Pill> : <Pill tone="gray" testId="mfa-off">Off</Pill>)}
      </div>

      <div className="p-6">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!status && !error && <div className="h-10 animate-pulse rounded-lg bg-muted/60" />}

        {/* Just enabled: show the recovery codes once. */}
        {codes && (
          <div data-testid="recovery-codes" className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200">
              <TbAlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>Two-step verification is on. Save these recovery codes now — they are the only way in if you lose your phone, and they are shown just this once.</span>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm sm:grid-cols-4">
              {codes.map((c) => <span key={c} data-testid="recovery-code">{c}</span>)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton text={codes.join("\n")} label="Copy all" />
              <Button type="button" size="sm" variant="outline" onClick={download}><TbDownload /> Download</Button>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="size-4 accent-primary" data-testid="codes-saved" />
              I have saved these codes somewhere safe
            </label>
            <Button size="sm" disabled={!saved} onClick={() => setCodes(null)} data-testid="codes-done">Done</Button>
          </div>
        )}

        {/* Setup in progress: scan, then confirm with a code. */}
        {!codes && setup && (
          <form onSubmit={enable} className="grid gap-6 sm:grid-cols-[auto_1fr]" data-testid="mfa-setup">
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qr} alt="Scan this QR code with your authenticator app" width={224} height={224} className="rounded-lg border border-border bg-white p-1" data-testid="mfa-qr" />
              <span className="text-[11px] text-muted-foreground">Scan with Google Authenticator, 1Password, Authy…</span>
            </div>
            <div className="grid content-start gap-4">
              <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground/85">
                <li>Open your authenticator app and scan the code. Can’t scan? Enter this key instead:</li>
              </ol>
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-sm tracking-wider" data-testid="mfa-secret">{groups(setup.secret)}</code>
                <CopyButton text={setup.secret} label="Copy key" />
              </div>
              <div className="grid gap-1.5 sm:max-w-xs">
                <Label htmlFor="mfa-code">2. Enter the 6-digit code it shows</Label>
                <Input
                  id="mfa-code"
                  data-testid="mfa-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ""))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={7}
                  placeholder="123 456"
                  className="font-mono text-lg tracking-widest"
                  autoFocus
                />
              </div>
              {formError && <p className="text-sm text-red-600" data-testid="mfa-setup-error">{formError}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={busy || code.replace(/\s+/g, "").length < 6} data-testid="mfa-enable">{busy ? <Spinner /> : <TbShieldLock />} Turn on</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setSetup(null)} disabled={busy}>Cancel</Button>
              </div>
            </div>
          </form>
        )}

        {!codes && !setup && status && !status.enabled && (
          <Button size="sm" onClick={start} disabled={busy} data-testid="mfa-start">{busy ? <Spinner /> : <TbShieldLock />} Set up two-step verification</Button>
        )}

        {!codes && !setup && status?.enabled && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" data-testid="mfa-status-line">
              {status.recoveryCodesLeft === 0
                ? "You have no recovery codes left. Turn two-step verification off and on again to get a fresh set."
                : `${status.recoveryCodesLeft} recovery code${status.recoveryCodesLeft === 1 ? "" : "s"} remaining.`}
            </p>
            <Button size="sm" variant="outline" onClick={() => { setFormError(""); setOffRecovery(false); setOffOpen(true); }} data-testid="mfa-off-open">Turn off</Button>
          </div>
        )}
      </div>

      <Dialog open={offOpen} onOpenChange={setOffOpen}>
        <DialogContent>
          <form onSubmit={disable} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Turn off two-step verification?</DialogTitle>
              <DialogDescription>Confirm it is you with your password and a current code.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="off-password">Password</Label>
              <Input id="off-password" type="password" value={offPassword} onChange={(e) => setOffPassword(e.target.value)} autoComplete="current-password" data-testid="off-password" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="off-code">{offRecovery ? "Recovery code" : "Authenticator code"}</Label>
              <Input
                id="off-code"
                value={offCode}
                onChange={(e) => setOffCode(e.target.value)}
                inputMode={offRecovery ? "text" : "numeric"}
                autoComplete="one-time-code"
                className="font-mono"
                placeholder={offRecovery ? "xxxxx-xxxxx" : "123 456"}
                data-testid="off-code"
              />
              <button type="button" className="w-fit text-xs text-muted-foreground underline underline-offset-2 hover:text-primary" onClick={() => { setOffRecovery((v) => !v); setOffCode(""); }}>
                {offRecovery ? "Use my authenticator app" : "Use a recovery code instead"}
              </button>
            </div>
            {formError && <p className="text-sm text-red-600" data-testid="mfa-off-error">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOffOpen(false)} disabled={busy}>Keep it on</Button>
              <Button type="submit" variant="destructive" disabled={busy || !offPassword || offCode.trim().length < 6} data-testid="mfa-off-confirm">{busy ? <Spinner /> : null} Turn off</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
