"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookTemplate,
  Inbox,
  LayoutDashboard,
  Rocket,
  Settings,
  Shield,
  Users,
} from "lucide-react";

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
    <aside className="card hidden h-full flex-col p-4 lg:flex w-64 mr-6 shrink-0">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Rhinon</p>
        <h1 className="mt-2 text-xl font-semibold">Operations Hub</h1>
      </div>
      <nav className="mt-8 space-y-2">
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${isActive
                ? "bg-cyan-500/15 text-cyan-100 shadow-glow border border-cyan-500/20"
                : "text-slate-300 hover:bg-slate-800/70"
                }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-100">
        AI Queue: 248 leads pending review
      </div>
    </aside>
  );
}
