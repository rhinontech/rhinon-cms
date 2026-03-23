"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookTemplate,
  Inbox,
  LayoutDashboard,
  Rocket,
  Settings,
  Shield,
  Users,
  Sparkles,
  LogOut,
  Send,
  FileText
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "@/components/session-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type IdentityOption = {
  email: string;
  type: string;
  displayName?: string;
};

export function AppSidebar({ roleSlug }: { roleSlug?: string }) {
  const pathname = usePathname();
  const { user, logout, refresh } = useSession();
  const [queueCount, setQueueCount] = useState<number | null>(null);
  const [identities, setIdentities] = useState<IdentityOption[]>([]);

  // If roleSlug is missing, try to infer it from user session
  const activeRole = roleSlug || user?.roleSlug || "admin";

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch("/api/metrics");
        const data = await res.json();
        setQueueCount(data.queueCount);
      } catch (err) {
        console.error("Error fetching queue count:", err);
      }
    };
    fetchQueue();
    // Refresh every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchIdentities = async () => {
      if (!user?.capabilities.includes("manage_mailboxes")) return;
      try {
        const res = await fetch("/api/admin/outreach-identities");
        const data = await res.json();
        const fetched = Array.isArray(data.emails) ? data.emails : [];
        const merged = new Map<string, IdentityOption>();

        for (const identity of fetched) {
          if (identity?.email) {
            merged.set(identity.email, {
              email: identity.email,
              type: identity.type || "secondary",
              displayName: identity.displayName || undefined,
            });
          }
        }

        if (user.primaryIdentityEmail && !merged.has(user.primaryIdentityEmail)) {
          merged.set(user.primaryIdentityEmail, {
            email: user.primaryIdentityEmail,
            type: "primary",
            displayName: user.name,
          });
        }

        if (user.activeIdentityEmail && !merged.has(user.activeIdentityEmail)) {
          merged.set(user.activeIdentityEmail, {
            email: user.activeIdentityEmail,
            type: user.activeIdentityEmail === user.primaryIdentityEmail ? "primary" : "secondary",
            displayName: user.name,
          });
        }

        setIdentities(Array.from(merged.values()));
      } catch (error) {
        console.error("Failed to fetch identities:", error);
      }
    };

    fetchIdentities();
  }, [user]);

  const switchIdentity = async (email: string) => {
    if (email === user?.activeIdentityEmail) return;

    try {
      const res = await fetch("/api/auth/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to switch identity");
      }

      await refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to switch identity");
    }
  };

  const getIdentityMeta = (identity: IdentityOption) => {
    const tags = [];

    if (identity.displayName) {
      tags.push(identity.displayName);
    }

    tags.push(identity.type === "primary" ? "Primary" : "Secondary");
    return tags.join(" • ");
  };

  const nav = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      label: "Campaigns",
      href: "/campaigns",
      icon: Rocket,
      subItems: [
        { label: "Email Outbound", href: "/campaigns/email", icon: Send },
      ]
    },
    { label: "Leads", href: "/leads", icon: Users },
    {
      label: "Library",
      href: "/library",
      icon: Sparkles
    },
    { 
      label: "Templates", 
      href: "/templates", 
      icon: BookTemplate
    },
    { label: "Inbox", href: "/inbox", icon: Inbox },
    { label: "Blogs", href: "/blogs", icon: FileText },

    { label: "Team & Roles", href: "/team", icon: Shield, capability: "manage_users" },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="card h-full w-60 shrink-0 flex-col p-4 border-border bg-card hidden lg:flex">
      {/* Brand */}
      <div className="mb-7 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/${activeRole}/dashboard`} className="block">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">
              Rhinon Labs
            </p>
            <h1 className="mt-1 text-[17px] font-bold leading-tight text-foreground">
              Operations Hub
            </h1>
          </Link>
          {user && (
            <div className="mt-2 min-w-0 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {user.roleName}
              </p>
              {user.capabilities.includes("manage_mailboxes") && identities.length > 0 ? (
                <Select value={user.activeIdentityEmail} onValueChange={(value) => value && switchIdentity(value)}>
                  <SelectTrigger
                    className="h-8 w-full min-w-0 border-border bg-secondary/70 text-xs font-semibold"
                    title={user.activeIdentityEmail}
                  >
                    <SelectValue placeholder="Select identity" className="min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent align="start" className="w-80 max-w-[calc(100vw-2rem)] border-border bg-card">
                    {identities.map((identity) => (
                      <SelectItem key={identity.email} value={identity.email} className="py-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{identity.email}</p>
                          <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                            {getIdentityMeta(identity)}
                          </p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="truncate text-xs font-semibold text-foreground" title={user.activeIdentityEmail}>
                  {user.activeIdentityEmail}
                </p>
              )}
              <p className="truncate text-[10px] text-muted-foreground" title={user.primaryIdentityEmail}>
                Primary: {user.primaryIdentityEmail}
              </p>
            </div>
          )}
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {nav.map((item: any) => {
          if (item.capability && !user?.capabilities?.includes(item.capability)) return null;

          const fullHref = `/${activeRole}${item.href}`;
          const isAtCampaigns = item.label === "Campaigns" && pathname?.includes("/campaigns");
          const isActive = pathname === fullHref || (item.href !== "/dashboard" && pathname?.startsWith(fullHref)) || isAtCampaigns;

          return (
            <div key={item.label} className="space-y-1">
              <Link
                href={item.subItems ? `/${activeRole}${item.subItems[0].href}` : fullHref}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-cyan-500/12 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 dark:shadow-sm"
                    : "border border-transparent text-muted-foreground hover:bg-secondary hover:border-border hover:text-foreground"
                )}
              >
                <item.icon
                  size={15}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground/60"
                  )}
                />
                <span>{item.label}</span>
              </Link>

              {item.subItems && isActive && (
                <div className="ml-9 space-y-1">
                  {item.subItems.map((sub: any) => {
                    const subHref = `/${activeRole}${sub.href}`;
                    const isSubActive = pathname === subHref;
                    return (
                      <Link
                        key={sub.label}
                        href={subHref}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all",
                          isSubActive
                            ? "text-cyan-500"
                            : "text-muted-foreground/50 hover:text-foreground"
                        )}
                      >
                        {sub.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Info & Logout */}
      <div className="mt-auto space-y-4">
        {/* AI Queue Widget */}
        <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/8 p-3.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
            AI Queue
          </p>
          <p className="mt-0.5 text-sm font-bold text-foreground">
            {queueCount !== null ? `${queueCount} leads pending` : "Calculating..."}
          </p>
        </div>

        {/* User Profile & Logout */}
        {user && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-3 mb-3 px-1">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-secondary text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                  {user.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter font-medium">
                  {user.roleName}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 group"
              onClick={logout}
            >
              <LogOut size={15} className="group-hover:text-rose-500" />
              <span className="text-sm font-medium">Log Out</span>
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
