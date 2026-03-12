"use client";

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
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Campaigns", icon: Rocket },
  { label: "Leads", icon: Users },
  { label: "Templates", icon: BookTemplate },
  { label: "Inbox", icon: Inbox },
  { label: "Team", icon: Shield },
  { label: "Settings", icon: Settings },
];

export function AppSidebar({ active = 0 }: { active?: number }) {
  return (
    <aside className="card hidden h-[calc(100vh-4rem)] flex-col p-4 lg:flex">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Rhinon</p>
        <h1 className="mt-2 text-xl font-semibold">Operations Hub</h1>
      </div>
      <nav className="mt-8 space-y-2">
        {nav.map((item, i) => (
          <button
            key={item.label}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
              i === active
                ? "bg-cyan-500/15 text-cyan-100 shadow-glow"
                : "text-slate-300 hover:bg-slate-800/70"
            }`}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-100">
        AI Queue: 248 leads pending review
      </div>
    </aside>
  );
}
