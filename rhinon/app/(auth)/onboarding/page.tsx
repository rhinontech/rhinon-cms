"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";

export default function OnboardingPage() {
  const router = useRouter();
  const { setSessionUser } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      if (data.user) {
        setSessionUser(data.user);
      }

      toast.success("Password updated successfully! Welcome to Rhinon.");
      
      // Redirect to role-based dashboard
      router.replace(`/${data.roleSlug}/dashboard`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative"
    >
      <div className="flex flex-col items-center mb-10 gap-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2
          }}
          className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-rose-500/30 relative group"
        >
          <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
          <ShieldCheck className="text-white h-8 w-8 relative z-10" />
        </motion.div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            Account Setup
          </h1>
          <p className="text-sm text-foreground/60 mt-2 font-medium max-w-sm">
            Please set a permanent password to secure your newly created work account.
          </p>
        </div>
      </div>

      <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden relative border w-full">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />

        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-xl font-semibold tracking-tight text-center">Update Password</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3.5 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-foreground/90 ml-1 uppercase tracking-wider mb-2">Temporary Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/input:text-rose-500" size={18} />
                <Input
                  type="password"
                  placeholder="From your email"
                  className="pl-11 h-12 bg-white/5 border-white/10 hover:bg-white/10 focus:bg-white/10 transition-all rounded-xl focus:ring-1 focus:ring-rose-500/50"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-foreground/90 uppercase tracking-wider ml-1">New Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/input:text-rose-500" size={18} />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-11 h-12 bg-white/5 border-white/10 hover:bg-white/10 focus:bg-white/10 transition-all rounded-xl focus:ring-1 focus:ring-rose-500/50"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-[13px] font-semibold text-foreground/90 uppercase tracking-wider ml-1">Confirm New Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/input:text-rose-500" size={18} />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-11 h-12 bg-white/5 border-white/10 hover:bg-white/10 focus:bg-white/10 transition-all rounded-xl focus:ring-1 focus:ring-rose-500/50"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={8}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-4 pb-8">
            <Button
              type="submit"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Securing Account...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Complete Setup</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-8 text-center">
         <p className="text-[11px] text-muted-foreground/60 max-w-[280px] mx-auto leading-relaxed">
            By proceeding, you agree to Rhinon's terms of service and acceptable use policy for managed work accounts.
         </p>
      </div>
    </motion.div>
  );
}
