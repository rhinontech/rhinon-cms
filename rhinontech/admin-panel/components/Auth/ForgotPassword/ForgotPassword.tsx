"use client";
import { Card, CardContent } from "@/components/ui/card";
import adminImages from "@/constants/admin/images";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
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
              <h1 className="text-2xl font-semibold text-slate-950">Forgot password?</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            {sent ? (
              <div className="flex flex-col gap-4">
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                  If an account exists for <span className="font-semibold">{email}</span>, a password reset link has been sent to the personal email on file. The link expires in 1 hour.
                </p>
                <Link href="/auth/login" className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@rhinontech.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                {error && (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}
                <Button type="submit" className="mt-1 w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send reset link"}
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
