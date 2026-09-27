"use client";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import adminImages from "@/constants/admin/images";
import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Mirrors validateSlug() on the backend so the field can react as you type. */
function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 32);
}

type SlugState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available"; emailDomain: string }
  | { kind: "taken"; reason: string };

export function Signup({ className, ...props }: React.ComponentProps<"div">) {
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [personalEmail, setPersonalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugState, setSlugState] = useState<SlugState>({ kind: "idle" });

  // The workspace name writes the slug until the user takes it over, so the
  // common path is one field, not two.
  useEffect(() => {
    if (!slugEdited) setSlug(toSlug(organizationName));
  }, [organizationName, slugEdited]);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSlug = useCallback((value: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (value.length < 3) {
      setSlugState({ kind: "idle" });
      return;
    }
    setSlugState({ kind: "checking" });
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/auth/signup/slug/${encodeURIComponent(value)}`);
        const data = await res.json();
        setSlugState(
          data.available
            ? { kind: "available", emailDomain: data.emailDomain }
            : { kind: "taken", reason: data.reason || "That workspace name is unavailable." }
        );
      } catch {
        setSlugState({ kind: "idle" });
      }
    }, 350);
  }, []);

  useEffect(() => {
    checkSlug(slug);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [slug, checkSlug]);

  const firstName = fullName.trim().split(/\s+/)[0]?.toLowerCase() || "you";
  const previewDomain =
    slugState.kind === "available" ? slugState.emailDomain : slug ? `${slug}.rhinontech.in` : "";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          personalEmail,
          password,
          organizationName,
          organizationSlug: slug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not create your workspace.");
        return;
      }

      Cookies.set("authToken", data.token, { expires: 7 });
      Cookies.set("permissions", JSON.stringify(data.permissions ?? []), { expires: 7 });
      // The API key is shown once. Hand it to the Developers screen rather than
      // dropping it on the floor between here and the dashboard.
      if (data.apiKey) sessionStorage.setItem("rhinon.newApiKey", data.apiKey);
      window.location.href = `/${data.roleSlug}/dashboard`;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-2xl font-semibold text-foreground">Create your workspace</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Your team gets real email addresses on its own domain — no DNS setup.
              </p>
            </div>

            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="organizationName">Company name</Label>
                <Input
                  id="organizationName"
                  placeholder="Swiggy"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                  autoComplete="organization"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="slug">Workspace address</Label>
                <div className="flex items-stretch">
                  <Input
                    id="slug"
                    className="rounded-r-none"
                    placeholder="swiggy"
                    value={slug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setSlug(toSlug(e.target.value));
                    }}
                    required
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <span className="select-none whitespace-nowrap border border-l-0 border-input rounded-r-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    .rhinontech.in
                  </span>
                </div>
                {slugState.kind === "checking" && (
                  <p className="text-xs text-muted-foreground">Checking availability…</p>
                )}
                {slugState.kind === "taken" && (
                  <p className="text-xs text-red-600 dark:text-red-300">{slugState.reason}</p>
                )}
                {slugState.kind === "available" && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {slugState.emailDomain} is available
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">Your name</Label>
                <Input
                  id="fullName"
                  placeholder="Aman Gupta"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="personalEmail">Your email</Label>
                <Input
                  id="personalEmail"
                  type="email"
                  placeholder="aman@gmail.com"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <p className="text-xs text-muted-foreground">
                  Used to sign in and to recover your account.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  At least 8 characters, with one uppercase letter and one number.
                </p>
              </div>

              {previewDomain && fullName && (
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Your company email will be</p>
                  <p className="mt-0.5 font-mono text-sm text-foreground break-all">
                    {firstName}@{previewDomain}
                  </p>
                </div>
              )}

              {error && (
                <p className="rounded-md border border-red-200 dark:border-red-400/25 bg-red-50 dark:bg-red-400/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="mt-1 w-full"
                disabled={loading || slugState.kind === "taken" || slugState.kind === "checking"}
              >
                {loading ? "Creating workspace..." : "Create workspace"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary">
        By creating a workspace, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
