"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, ArrowRight, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate signup
    setTimeout(() => {
      setComplete(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }, 1500);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center mb-8 gap-3">
        <div className="h-12 w-12 rounded-2xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Sparkles className="text-white h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Join Rhinon</h1>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Accept invitation</CardTitle>
          <CardDescription className="text-muted-foreground">
            Complete your profile to join the team.
          </CardDescription>
        </CardHeader>
        {complete ? (
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Profile Created</h3>
              <p className="text-sm text-muted-foreground mt-1">Redirecting to login...</p>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground ml-1">First Name</label>
                  <Input placeholder="Alex" className="bg-secondary border-border" required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground ml-1">Last Name</label>
                  <Input placeholder="Mercer" className="bg-secondary border-border" required disabled={loading} />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    className="pl-10 bg-secondary border-border"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-secondary border-border"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold h-11"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-violet-400 hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
      
      <p className="mt-8 text-center text-xs text-muted-foreground/60 opacity-0">
        &copy; 2024 Rhinon Tech.
      </p>
    </div>
  );
}
