"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2, Sparkles, Fingerprint, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");

  const handleDemoLogin = () => {
    setEmail("alex@rhinonlabs.com");
    setPassword("password");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials. Please try again.");
      }

      // Handle mandatory password change
      if (data.mustChangePassword) {
        toast.info("Please complete your account setup.");
        router.push("/onboarding"); 
        return;
      }

      // Redirect to role-based dashboard
      router.push(`/${data.roleSlug}/dashboard`);
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
          className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30 relative group"
        >
          <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
          <ShieldCheck className="text-white h-8 w-8 relative z-10" />
        </motion.div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            Rhinon CMS
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium italic">Enterprise Intelligence Engine</p>
        </div>
      </div>

      <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden relative border">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl font-semibold tracking-tight">Authentication</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Enter your credentials to access the secure portal
          </CardDescription>
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
              <label className="text-[13px] font-semibold text-foreground/90 ml-1 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative group/input">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/input:text-cyan-500" size={18} />
                <Input
                  type="email"
                  placeholder="name@rhinon.tech"
                  className="pl-11 h-12 bg-white/5 border-white/10 hover:bg-white/10 focus:bg-white/10 transition-all rounded-xl focus:ring-1 focus:ring-cyan-500/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[13px] font-semibold text-foreground/90 uppercase tracking-wider">Password</label>
                <button type="button" className="text-xs text-cyan-500 hover:text-cyan-400 font-bold transition-colors">
                  Reset Access
                </button>
              </div>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/input:text-cyan-500" size={18} />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-11 h-12 bg-white/5 border-white/10 hover:bg-white/10 focus:bg-white/10 transition-all rounded-xl focus:ring-1 focus:ring-cyan-500/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-4 pb-8">
            <Button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Authorize Session</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-muted-foreground font-semibold tracking-widest backdrop-blur-sm">OR</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleDemoLogin}
              className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-foreground font-semibold h-11 rounded-xl transition-all"
              disabled={loading}
            >
              <Fingerprint className="mr-2 h-4 w-4 text-cyan-500" />
              Quick Demo Access
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-2">
              New to Rhinon?{" "}
              <Link href="/signup" className="text-cyan-500 hover:text-cyan-400 font-bold transition-colors">
                Register Hardware
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      <div className="mt-10 flex flex-col items-center gap-2 opacity-60">
        <p className="text-center text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
          &copy; 2026 Rhinon Technical Group
        </p>
        <div className="flex gap-4 items-center">
          <div className="h-[1px] w-8 bg-muted-foreground/30" />
          <ShieldCheck className="h-3 w-3 text-cyan-500" />
          <div className="h-[1px] w-8 bg-muted-foreground/30" />
        </div>
      </div>
    </motion.div>
  );
}

