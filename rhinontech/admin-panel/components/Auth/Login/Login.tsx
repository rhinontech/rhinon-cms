"use client";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import adminImages from "@/constants/admin/images";
import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TbBuilding, TbCheck, TbChevronRight, TbShieldLock } from "react-icons/tb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";
import { useLegal } from "@/lib/legal";

const API = API_URL;

interface WorkspaceChoice {
  slug: string;
  name: string;
  emailDomain: string;
}

interface Session {
  token: string;
  permissions: string[];
  userType?: string;
  roleSlug: string;
}

type Step =
  | { kind: "credentials" }
  // The email belongs to more than one workspace and the password fits several.
  | { kind: "workspace"; choices: WorkspaceChoice[] }
  // Password was right and the account has two-factor on: one more proof needed.
  | { kind: "mfa"; mfaToken: string };

const Notice = ({ tone, children, testId }: { tone: "error" | "success" | "info"; children: React.ReactNode; testId?: string }) => (
  <p
    data-testid={testId}
    className={cn(
      "rounded-md border px-3 py-2 text-sm",
      tone === "error" && "border-red-200 bg-red-50 text-red-600 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300",
      tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300",
      tone === "info" && "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300"
    )}
  >
    {children}
  </p>
);

export function Login({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const legal = useLegal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<Step>({ kind: "credentials" });
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);

  useEffect(() => {
    const prefill = searchParams.get("email");
    if (prefill) setEmail(prefill);
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Where the emailed "confirm your email" link sends someone who is not signed in.
  const verified = searchParams.get("verified");

  const finishLogin = (data: Session) => {
    Cookies.set("authToken", data.token, { expires: 7 });
    Cookies.set("permissions", JSON.stringify(data.permissions), { expires: 7 });
    const isCollaborator = data.userType === "guest" || data.roleSlug === "collaborator";
    window.location.href = isCollaborator ? "/portal" : `/${data.roleSlug}/dashboard`;
  };

  /** One place for the password request, so picking a workspace repeats it exactly. */
  const submitCredentials = async (organizationSlug?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, ...(organizationSlug ? { organizationSlug } : {}) }),
      });
      const data = await res.json();

      // 300: this address has accounts in several workspaces and the password fits more than one.
      if (res.status === 300 && data.needsOrganization) {
        setStep({ kind: "workspace", choices: data.organizations });
        return;
      }
      if (!res.ok) {
        setError(data.message || "Invalid email or password");
        return;
      }
      if (data.mfaRequired) {
        setCode("");
        setUseRecovery(false);
        setStep({ kind: "mfa", mfaToken: data.mfaToken });
        return;
      }
      finishLogin(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    void submitCredentials();
  };

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step.kind !== "mfa") return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/login/mfa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaToken: step.mfaToken, ...(useRecovery ? { recoveryCode: code.trim() } : { code: code.replace(/\s+/g, "") }) }),
      });
      const data = await res.json();
      if (!res.ok) {
        // The pending sign-in lasts five minutes; once it is gone the password has to be re-entered.
        if (res.status === 401 && /expired/i.test(data.message || "")) {
          setStep({ kind: "credentials" });
          setPassword("");
        }
        setError(data.message || "That code is not correct.");
        return;
      }
      finishLogin(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const backToCredentials = () => {
    setStep({ kind: "credentials" });
    setError("");
    setPassword("");
    setCode("");
  };

  const heading =
    step.kind === "mfa"
      ? { title: "Two-step verification", sub: useRecovery ? "Enter one of your recovery codes" : "Enter the 6-digit code from your authenticator app" }
      : step.kind === "workspace"
        ? { title: "Choose a workspace", sub: "This email has an account in more than one workspace" }
        : { title: "Welcome back", sub: "Sign in to your admin workspace" };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="glass-modal border-0">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-7">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-14 w-full items-center justify-center">
                <Image
                  src={adminImages.Logo_Rhinon_Tech_Dark}
                  alt="Rhinon Tech"
                  priority
                  className="h-12 w-auto object-contain"
                />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">{heading.title}</h1>
              <p className="text-muted-foreground mt-1 text-sm">{heading.sub}</p>
            </div>

            {step.kind === "credentials" && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                {verified === "1" && (
                  <Notice tone="success" testId="verified-ok">
                    <TbCheck className="mr-1.5 inline -mt-0.5" size={15} />
                    Email confirmed. Sign in to start sending.
                  </Notice>
                )}
                {(verified === "invalid" || verified === "error") && (
                  <Notice tone="error" testId="verified-bad">
                    That confirmation link is invalid or has expired. Sign in and choose “Resend email”.
                  </Notice>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                {error && <Notice tone="error" testId="login-error">{error}</Notice>}
                <Button type="submit" className="mt-1 w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  New here?{" "}
                  <Link
                    href="/auth/signup"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Create a workspace
                  </Link>
                </p>
              </form>
            )}

            {step.kind === "workspace" && (
              <div className="flex flex-col gap-3" data-testid="workspace-picker">
                {step.choices.map((choice) => (
                  <button
                    key={choice.slug}
                    type="button"
                    disabled={loading}
                    onClick={() => void submitCredentials(choice.slug)}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-card/60 px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-card disabled:opacity-50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <TbBuilding size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{choice.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{choice.emailDomain}</span>
                    </span>
                    <TbChevronRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
                {error && <Notice tone="error">{error}</Notice>}
                <button type="button" onClick={backToCredentials} className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                  Use a different account
                </button>
              </div>
            )}

            {step.kind === "mfa" && (
              <form onSubmit={handleMfa} className="flex flex-col gap-4" data-testid="mfa-form">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <TbShieldLock size={24} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="code">{useRecovery ? "Recovery code" : "Authentication code"}</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(useRecovery ? e.target.value : e.target.value.replace(/[^\d\s]/g, ""))}
                    placeholder={useRecovery ? "xxxxx-xxxxx" : "123 456"}
                    inputMode={useRecovery ? "text" : "numeric"}
                    autoComplete="one-time-code"
                    maxLength={useRecovery ? 16 : 7}
                    className="text-center font-mono text-lg tracking-widest"
                    autoFocus
                    required
                  />
                </div>
                {error && <Notice tone="error" testId="mfa-error">{error}</Notice>}
                <Button type="submit" className="w-full" disabled={loading || code.trim().length < (useRecovery ? 8 : 6)}>
                  {loading ? "Verifying..." : "Verify and sign in"}
                </Button>
                <div className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
                  <button
                    type="button"
                    data-testid="mfa-toggle"
                    onClick={() => {
                      setUseRecovery((v) => !v);
                      setCode("");
                      setError("");
                    }}
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {useRecovery ? "Use my authenticator app instead" : "Lost your device? Use a recovery code"}
                  </button>
                  <button type="button" onClick={backToCredentials} className="underline underline-offset-4 hover:text-primary">
                    Back to sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary">
        {legal?.termsUrl || legal?.privacyUrl ? (
          <>
            By signing in, you agree to our{" "}
            {legal.termsUrl ? <a href={legal.termsUrl} target="_blank" rel="noreferrer">Terms of Service</a> : "Terms of Service"}{" "}
            and{" "}
            {legal.privacyUrl ? <a href={legal.privacyUrl} target="_blank" rel="noreferrer">Privacy Policy</a> : "Privacy Policy"}.
          </>
        ) : (
          "By signing in, you agree to our Terms of Service and Privacy Policy."
        )}
      </div>
    </div>
  );
}
