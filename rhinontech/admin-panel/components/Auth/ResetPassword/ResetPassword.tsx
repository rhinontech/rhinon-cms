"use client";
import { Card, CardContent } from "@/components/ui/card";
import adminImages from "@/constants/admin/images";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const validate = (): string | null => {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword: password }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Could not reset your password.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="glass-modal border-0">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-7">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-14 w-full items-center justify-center">
                <Image src={adminImages.Logo_Rhinon_Tech_Dark} alt="Rhinon Tech" priority className="h-12 w-auto object-contain" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">Set a new password</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Choose a strong password for your account
              </p>
            </div>

            {!token ? (
              <div className="flex flex-col gap-4">
                <p className="rounded-md border border-red-200 dark:border-red-400/25 bg-red-50 dark:bg-red-400/10 px-3 py-3 text-sm text-red-600 dark:text-red-300">
                  This reset link is missing or invalid. Please request a new one.
                </p>
                <Link href="/auth/forgot-password" className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                  Request a new link
                </Link>
              </div>
            ) : done ? (
              <p className="rounded-md border border-emerald-200 dark:border-emerald-400/25 bg-emerald-50 dark:bg-emerald-400/10 px-3 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                Your password has been reset. Redirecting you to sign in…
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  At least 8 characters, with one uppercase letter and one number.
                </p>
                {error && (
                  <p className="rounded-md border border-red-200 dark:border-red-400/25 bg-red-50 dark:bg-red-400/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{error}</p>
                )}
                <Button type="submit" className="mt-1 w-full" disabled={loading}>
                  {loading ? "Resetting..." : "Reset password"}
                </Button>
                <Link href="/auth/login" className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                  Back to sign in
                </Link>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
