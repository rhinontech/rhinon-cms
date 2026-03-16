"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Command, Filter, Search, LayoutDashboard, ShieldCheck, Zap, Globe, Linkedin } from "lucide-react";
import { LinkedInWidget } from "./LinkedInWidget";
import { cn } from "@/lib/utils";

const chartBars = [52, 64, 58, 80, 73, 92, 84];
const days = ["M", "T", "W", "T", "F", "S", "S"];

export function Dashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [sourceStats, setSourceStats] = useState<any>({});
  const [queueCount, setQueueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, leadsRes, campaignsRes, healthRes] = await Promise.all([
          fetch("/api/metrics"),
          fetch("/api/leads"),
          fetch("/api/campaigns"),
          fetch("/api/system/health"),
        ]);

        const [metricsData, leadsData, campaignsData, healthData] = await Promise.all([
          metricsRes.json(),
          leadsRes.json(),
          campaignsRes.json(),
          healthRes.json(),
        ]);

        setMetrics(metricsData.metrics || []);
        setQueueCount(metricsData.queueCount || 0);
        setLeads(leadsData.slice(0, 5));
        setCampaigns(campaignsData.slice(0, 3));
        setHealth(healthData);

        // Calculate source stats
        const stats = leadsData.reduce((acc: any, lead: any) => {
          const source = lead.source || "Manual";
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {});
        setSourceStats(stats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-glow-sm">
          <LayoutDashboard size={28} className="text-cyan-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of your operations and key metrics.</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 border border-background shadow-glow shadow-rose-500/50" />
          </button>
        </div>
      </header>

      <div className="space-y-6">
        {/* ── Sub-Header ────────────────────────────── */}
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground min-w-[260px]">
            <Search size={14} className="shrink-0" />
            <span className="flex-1">Search campaigns, leads, settings...</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-secondary transition-colors">
              Organization: Core Ops
            </button>
            <button className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600 transition-colors shadow-sm">
              New Campaign
            </button>
          </div>
        </div>

        {/* ── Metric Cards ─────────────────────── */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, idx) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="card p-5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {metric.label}
              </p>
              <div className="mt-2.5 flex items-baseline justify-between">
                <h3 className="text-2xl font-bold text-foreground tabular-nums">
                  {metric.value}
                </h3>
                <span className="text-[10px] font-bold text-emerald-500">
                  {metric.delta}
                </span>
              </div>
            </motion.div>
          ))}
        </section>

        {/* ── Activity & Chart ─────────────────── */}
        <section className="grid gap-6 xl:grid-cols-2">
          {/* Performance chart */}
          <div className="card flex flex-col p-6">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Operational Velocity</h2>
                <p className="text-xs text-muted-foreground">Lead propagation across all active nodes</p>
              </div>
              <div className="flex gap-1.5">
                {["D", "W", "M"].map((p) => (
                  <button key={p} className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground hover:bg-card hover:text-foreground">
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-1 items-end justify-between gap-3 px-2">
              {chartBars.map((h, i) => (
                <div key={i} className="group relative flex flex-1 flex-col items-center gap-3">
                  <div className="absolute -top-6 hidden rounded bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background group-hover:block">
                    {h}%
                  </div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className="w-full rounded-t-lg bg-cyan-500/20 group-hover:bg-cyan-500 transition-colors"
                  />
                  <span className="text-[10px] font-bold text-muted-foreground">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-bold text-foreground">Lead Source Composition</h2>
            <div className="mt-6 space-y-4">
              {Object.entries(sourceStats).length > 0 ? (
                Object.entries(sourceStats).map(([source, count]: [string, any], idx) => (
                  <div key={source} className="group cursor-default">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">{source}</span>
                      <span className="text-foreground">{count} leads</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary border border-border/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / 100) * 100}%` }} // Simplified for demo
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          source === "LinkedIn Lead Gen" ? "bg-blue-500" :
                          source === "Apollo" ? "bg-violet-500" :
                          source === "Website" ? "bg-emerald-500" :
                          "bg-slate-400"
                        )}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">No leads found to analyze.</p>
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Suggested Actions</h3>
              <ul className="space-y-3">
                {[
                  "Verify AI draft for Campaign #203",
                  "Increase daily limit for Series A sweep",
                  "Review 4 bounced leads from TechFlow",
                  "Update template 'Outreach V2'"
                ].map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-border bg-secondary/60 px-3 py-2.5 text-xs font-medium text-muted-foreground leading-snug hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Engines Section ─────────────────── */}
        <section className="grid gap-6 xl:grid-cols-2">
          <LinkedInWidget />

          <div className="card p-6 h-full">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck size={16} className="text-cyan-500" /> Infrastructure Node Status
            </h2>
            <div className="mt-5 space-y-4">
              {[
                { label: "Apollo API (Sourcing)", status: health?.apollo?.status, icon: Globe, msg: health?.apollo?.message },
                { label: "Gemini 2.0 (Intelligence)", status: health?.gemini?.status, icon: Zap, msg: health?.gemini?.message },
                { label: "SMTP Server (Delivery)", status: health?.smtp?.status, icon: Bell, msg: health?.smtp?.message },
                { label: "LinkedIn Engine (Social)", status: health?.linkedin?.status, icon: Linkedin, msg: health?.linkedin?.message },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border ${
                    item.status === "healthy" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : 
                    item.status === "missing" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                    "bg-rose-500/10 border-rose-500/20 text-rose-500"
                  }`}>
                    <item.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground flex items-center gap-2">
                      {item.label}
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        item.status === "healthy" ? "bg-emerald-500" : "bg-rose-500"
                      }`} />
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.msg || "Checking connection..."}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Leads Table + Right Panel ─────────── */}
        <section className="grid gap-4 xl:grid-cols-[3fr_2fr]">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-bold text-foreground">Recent Activity</h2>
              <div className="flex items-center gap-1.5">
                <button className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                  <Filter size={13} />
                </button>
                <button className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                  <Command size={13} />
                </button>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[620px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-left">
                    {["Lead", "Company", "Email", "Status"].map((h) => (
                      <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads.map((lead) => (
                    <tr key={lead.email} className="text-sm hover:bg-secondary/40 transition-colors">
                      <td className="px-5 py-3 font-semibold text-foreground">{lead.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{lead.company}</td>
                      <td className="px-5 py-3 text-muted-foreground">{lead.email}</td>
                      <td className="px-5 py-3">
                        <span className="badge">{lead.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="card p-5 flex-1">
              <h2 className="text-sm font-bold text-foreground">Top Campaigns</h2>
              <ul className="mt-4 space-y-4">
                {campaigns.map((c) => (
                  <li key={c.name}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{c.name}</span>
                      <span className="text-muted-foreground">{c.stage}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary border border-border/50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-bold text-foreground">Template Preview</h2>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Instruction for AI
              </p>
              <p className="mt-1.5 rounded-lg border border-border bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
                Keep it under 3 sentences, mention recent funding, and offer discovery call.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
