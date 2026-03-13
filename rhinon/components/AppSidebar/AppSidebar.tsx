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
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Campaigns", href: "/campaigns", icon: Rocket },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Templates", href: "/templates", icon: BookTemplate },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Team & Roles", href: "/team", icon: Shield },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="card hidden h-full w-60 shrink-0 flex-col p-4 lg:flex">
      {/* Brand */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">
            Rhinon
          </p>
          <h1 className="mt-1 text-[17px] font-bold leading-tight text-foreground">
            Operations Hub
          </h1>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {nav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={[
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? [
                    // Active: strong cyan tint with visible border in both modes
                    "bg-cyan-500/12 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300",
                    // Extra depth on dark
                    "dark:bg-cyan-500/10 dark:shadow-sm",
                  ].join(" ")
                  : [
                    // Inactive: use secondary for hover so it's visible in light too
                    "border border-transparent text-muted-foreground",
                    "hover:bg-secondary hover:border-border hover:text-foreground",
                  ].join(" "),
              ].join(" ")}
            >
              <item.icon
                size={15}
                className={[
                  "shrink-0 transition-colors",
                  isActive
                    ? "text-cyan-600 dark:text-cyan-400"
                    : "text-muted-foreground/60",
                ].join(" ")}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Queue */}
      <div className="mt-4 rounded-xl border border-cyan-500/25 bg-cyan-500/8 p-3.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
          AI Queue
        </p>
        <p className="mt-0.5 text-sm font-bold text-foreground">
          248 leads pending
        </p>
      </div>
    </aside>
  );
}
