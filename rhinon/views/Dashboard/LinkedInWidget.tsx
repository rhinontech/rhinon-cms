"use client";

import { useState, useEffect } from "react";
import { Linkedin, Link2, LogOut, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function LinkedInWidget() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/system/health");
      const data = await res.json();
      setStatus(data.linkedin);
    } catch (err) {
      console.error("Failed to fetch LinkedIn status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch("/api/linkedin/auth");
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error("Failed to generate LinkedIn Auth URL");
      }
    } catch (err) {
      toast.error("Error connecting to LinkedIn");
    } finally {
      setIsConnecting(false);
    }
  };

  if (loading) return null;

  const isConnected = status?.status === "healthy";
  const isExpired = status?.status === "error";

  return (
    <div className="card p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
              isConnected ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" : "bg-secondary border-border text-muted-foreground"
            }`}>
              <Linkedin size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">LinkedIn Engine</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Autopilot Mode</p>
            </div>
          </div>
          <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse shadow-glow shadow-emerald-500/50" : "bg-border"}`} />
        </div>

        {isConnected ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{status.message}</p>
                <p className="text-[10px] text-muted-foreground">Ready for automated campaigns</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-secondary/50 border border-border text-center">
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Posts Sent</p>
                <p className="text-xs font-bold text-foreground">12</p>
              </div>
              <div className="p-2 rounded-lg bg-secondary/50 border border-border text-center">
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Growth %</p>
                <p className="text-xs font-bold text-emerald-500">+4.2%</p>
              </div>
            </div>
          </div>
        ) : isExpired ? (
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 flex flex-col items-center gap-3 text-center">
            <AlertCircle size={24} className="text-rose-500" />
            <div>
              <p className="text-xs font-bold text-foreground">Token Expired</p>
              <p className="text-[10px] text-muted-foreground">Please reconnect to resume campaigns.</p>
            </div>
            <Button onClick={handleConnect} size="sm" className="w-full bg-rose-500 hover:bg-rose-600 font-bold h-8">
              Reconnect Now
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 flex flex-col items-center gap-3 text-center">
            <Link2 size={24} className="text-violet-500 opacity-50" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect your LinkedIn profile to unlock AI-powered social outreach.
            </p>
            <Button onClick={handleConnect} disabled={isConnecting} className="w-full bg-violet-600 hover:bg-violet-700 font-bold h-9 shadow-glow-sm shadow-violet-500/20">
              {isConnecting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Linkedin size={16} className="mr-2" />}
              Connect LinkedIn
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground italic">Social Intelligence Node</p>
        <button className="text-[10px] font-bold text-muted-foreground hover:text-rose-500 transition-colors uppercase tracking-widest">
          {isConnected ? "Disconnect" : "Manual Post"}
        </button>
      </div>
    </div>
  );
}
