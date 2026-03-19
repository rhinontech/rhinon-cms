"use client";

import { useState, useEffect } from "react";
import { User, Mail, Shield, Globe, Link, CheckCircle2, AlertCircle, Rocket, Linkedin, Sparkles, Pencil, Loader2, Link2, Plus, Lock, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/components/session-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AddIdentityModal } from "./AddIdentityModal";
import { OutreachEmail } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";

export function SettingsView() {
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  
  // LinkedIn States
  const [liStatus, setLiStatus] = useState<any>(null);
  const [liLoading, setLiLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Email Identities States
  const [identities, setIdentities] = useState<OutreachEmail[]>([]);
  const [idLoading, setIdLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLiStatus = async () => {
    try {
      const res = await fetch("/api/system/health");
      const data = await res.json();
      setLiStatus(data.linkedin);
    } catch (err) {
      console.error("Failed to fetch LinkedIn status:", err);
    } finally {
      setLiLoading(false);
    }
  };

  const fetchIdentities = async () => {
    if (user?.roleSlug !== "admin") return;
    setIdLoading(true);
    try {
      const res = await fetch("/api/admin/outreach-identities");
      const data = await res.json();
      setIdentities(data.emails || []);
    } catch (err) {
      console.error("Failed to fetch identities:", err);
    } finally {
      setIdLoading(false);
    }
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.push("/login");
    }
  }, [user, sessionLoading, router]);

  useEffect(() => {
    fetchLiStatus();
    if (user?.roleSlug === "admin") {
      fetchIdentities();
    }
    
    // Check URL params for specific tab routing
    const targetTab = searchParams.get("tab");
    if (targetTab && ["profile", "integrations", "email", "security"].includes(targetTab)) {
      setActiveTab(targetTab);
    }
  }, [user, searchParams]);

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

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect LinkedIn?")) return;
    try {
      const res = await fetch("/api/linkedin/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("LinkedIn disconnected successfully.");
        fetchLiStatus();
      } else {
        toast.error(data.error || "Failed to disconnect LinkedIn");
      }
    } catch (err) {
      toast.error("Error disconnecting LinkedIn");
    }
  };

  const isLiConnected = liStatus?.status === "healthy";
  const isLiExpired = liStatus?.status === "error";
  if (sessionLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-140px)] w-full items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500 h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-glow-sm shrink-0">
          <Shield size={28} className="text-cyan-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your profile, integrations, and preferences.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation / Active Tab */}
        <aside className="lg:col-span-1">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                activeTab === "profile" ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <User size={18} />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("integrations")}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                activeTab === "integrations" ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Globe size={18} />
              Integrations
            </button>
            <button
              onClick={() => setActiveTab("email")}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                activeTab === "email" ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Mail size={18} />
              Email & Outreach
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                activeTab === "security" ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Lock size={18} />
              Security
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details and avatar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6 pb-6 border-b border-border">
                  <div className="h-20 w-20 rounded-2xl bg-secondary border border-border flex items-center justify-center relative group">
                    <User size={32} className="text-muted-foreground" />
                    <button className="absolute -bottom-2 -right-2 h-7 w-7 bg-cyan-500 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Pencil size={14} />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge className="mt-2 bg-cyan-500/10 text-cyan-500 border-cyan-500/20">{user?.roleName}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input defaultValue={user?.name} className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input defaultValue={user?.email} className="bg-secondary border-border" disabled title="Email cannot be changed" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-6">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">Save Changes</Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-6">
              {/* LinkedIn */}
              <Card className="bg-card/50 border-border overflow-hidden ring-1 ring-cyan-500/20">
                <CardHeader className="flex flex-row items-center gap-5 pb-8 border-b border-border bg-gradient-to-br from-cyan-500/5 to-transparent">
                  <div className="h-14 w-14 rounded-2xl bg-[#0077b5] flex items-center justify-center text-white shadow-lg shadow-[#0077b5]/20 shrink-0">
                    <Linkedin size={28} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      LinkedIn Integration
                      {isLiConnected && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Connected</Badge>}
                      {isLiExpired && <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px]">Expired</Badge>}
                    </CardTitle>
                    <CardDescription>Allow Rhinon to manage your LinkedIn posts and connection requests.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 space-y-6">
                  {isLiConnected ? (
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-full bg-[#0077b5]/10 flex items-center justify-center text-[#0077b5]">
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="font-medium">Direct API Connection Active</span>
                      </div>
                      <Button onClick={handleDisconnect} variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">Disconnect</Button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 flex flex-col items-center gap-3 text-center border-dashed">
                      <Link2 size={24} className="text-violet-500 opacity-50" />
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                        Connect your LinkedIn profile to unlock AI-powered social outreach.
                      </p>
                      <Button onClick={handleConnect} disabled={isConnecting} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 font-bold h-9 shadow-glow-sm shadow-violet-500/20 px-8">
                        {isConnecting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Linkedin size={16} className="mr-2" />}
                        Connect LinkedIn
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-bold opacity-70">LinkedIn Profile URL</Label>
                    <div className="flex gap-2">
                      <Input defaultValue={user?.linkedinUrl} placeholder="https://linkedin.com/in/username" className="bg-secondary border-border flex-1" />
                      <Button variant="secondary" className="border border-border">Update</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Assistant Hook */}
              <Card className="bg-card/50 border-border overflow-hidden border-dashed">
                <CardContent className="py-8 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                    <Sparkles className="text-violet-500" size={24} />
                  </div>
                  <h3 className="font-bold text-foreground">Unlock More Integrations</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    Connecting your LinkedIn allows Gemini AI to analyze prospect profiles and craft 10x more personalized messages.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "email" && (
            <div className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Outreach Identities</CardTitle>
                  <CardDescription>
                    {user?.roleSlug === "admin" 
                      ? "Manage the pool of outreach emails used by the team." 
                      : "The outreach identities available for your campaigns."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Assigned Identity */}
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shrink-0">
                      <Shield size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-1 block">Your Identity</Label>
                        <Badge className="bg-cyan-500/20 text-cyan-500 border-cyan-500/30 text-[10px]">Assigned</Badge>
                      </div>
                      <p className="text-lg font-bold text-foreground">{user?.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {user?.email === "admin@rhinonlabs.com" || user?.email === "alex@rhinonlabs.com" 
                          ? "Main system administrative account." 
                          : "Your assigned work account for outbound communications."}
                      </p>
                    </div>
                  </div>

                  {/* Secondary Identities List */}
                  {user?.roleSlug === "admin" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <h3 className="text-sm font-bold text-foreground">Secondary Identities</h3>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10 gap-2"
                          onClick={() => setIsModalOpen(true)}
                        >
                          <Plus size={14} />
                          Add Identity
                        </Button>
                      </div>
                      
                      <div className="grid gap-3">
                        {idLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="animate-spin text-muted-foreground" size={20} />
                          </div>
                        ) : identities.filter(id => id.type === "secondary").length > 0 ? (
                          identities.filter(id => id.type === "secondary").map(id => (
                            <div key={id.id} className="p-4 rounded-xl border border-border bg-secondary/30 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
                                  <Mail size={16} className="text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{id.displayName}</p>
                                  <p className="text-[10px] text-muted-foreground">{id.email}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-500">
                                {id.status}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-4 italic">No secondary identities added yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {user?.roleSlug !== "admin" && (
                    <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl">
                      <Mail size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Only administrators can manage outreach identities.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {user?.roleSlug === "admin" && (
                <Card className="bg-card/50 border-border overflow-hidden ring-1 ring-cyan-500/10">
                  <CardHeader className="bg-cyan-500/5 pb-4">
                    <CardTitle className="text-sm">SES Configuration Status</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-border bg-card">
                        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-tighter">Domain Status</p>
                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-500">
                          <CheckCircle2 size={14} /> rhinonlabs.com Verified
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-card">
                        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-tighter">Region</p>
                        <div className="flex items-center gap-2 text-sm font-bold text-cyan-500">
                          <Globe size={14} /> ap-south-1
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account password and security preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {user?.mustChangePassword && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-left">
                      <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={18} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-rose-500">Action Required: Reset Password</p>
                        <p className="text-xs text-rose-500/80 mt-1">You are using a temporary password. Please set a permanent password to secure your account.</p>
                      </div>
                    </div>
                  )}

                  <form className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input type="password" placeholder="••••••••" className="bg-secondary border-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input type="password" placeholder="••••••••" className="bg-secondary border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <Input type="password" placeholder="••••••••" className="bg-secondary border-border" />
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="border-t border-border pt-6">
                  <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">Update Password</Button>
                </CardFooter>
              </Card>

              <Card className="bg-card/50 border-border opacity-60 pointer-events-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm">Two-Factor Authentication (Coming Soon)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground italic">Add an extra layer of security to your Rhinon account.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <AddIdentityModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSuccess={fetchIdentities} 
      />
    </div>
  );
}
