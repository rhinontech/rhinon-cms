"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("alex@rhinon.tech"); // Default for demo
  const [password, setPassword] = useState("password");

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
        throw new Error(data.error || "Login failed");
      }

      // Redirect to role-based dashboard
      router.push(`/${data.roleSlug}/dashboard`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center mb-8 gap-3">
        <div className="h-12 w-12 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Sparkles className="text-white h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Rhinon Engine</h1>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to access your operations dashboard.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-medium bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 bg-secondary border-border"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-foreground">Password</label>
                <button type="button" className="text-xs text-cyan-500 hover:text-cyan-400 font-medium">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-secondary border-border"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold h-11"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-cyan-500 hover:text-cyan-400 font-medium whitespace-nowrap">
                Join your team
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
      
      <p className="mt-8 text-center text-xs text-muted-foreground/60">
        &copy; 2024 Rhinon Tech. All rights reserved.
      </p>
    </div>
  );
}
