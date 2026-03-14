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
  User as UserIcon,
  Send,
  Linkedin
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "@/components/session-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function AppSidebar({ roleSlug }: { roleSlug?: string }) {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const [queueCount, setQueueCount] = useState<number | null>(null);

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

  const nav = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { 
      label: "Campaigns", 
      href: "/campaigns", 
      icon: Rocket,
      subItems: [
        { label: "Email Outbound", href: "/campaigns/email", icon: Send },
        { label: "Social Engine", href: "/campaigns/social", icon: Linkedin },
      ]
    },
    { label: "Leads", href: "/leads", icon: Users },
    { label: "Templates", href: "/templates", icon: BookTemplate },
    { label: "Inbox", href: "/inbox", icon: Inbox },
    { label: "Team & Roles", href: "/team", icon: Shield, perm: "perm_5" },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="card hidden h-full w-60 shrink-0 flex-col p-4 lg:flex border-border bg-card">
      {/* Brand */}
      <div className="flex items-start justify-between mb-7">
        <Link href={`/${activeRole}/dashboard`}>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">
            Rhinon
          </p>
          <h1 className="mt-1 text-[17px] font-bold leading-tight text-foreground">
            Operations Hub
          </h1>
        </Link>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {nav.map((item: any) => {
          if (item.perm === "perm_5" && activeRole !== "admin") return null;

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
