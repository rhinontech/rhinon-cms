"use client";

import { motion } from "framer-motion";
import { activity, campaigns, leads, metrics } from "@/lib/data";
import { Bell, Command, Filter, Search } from "lucide-react";

const chartBars = [52, 64, 58, 80, 73, 92, 84];
const days = ["M", "T", "W", "T", "F", "S", "S"];

export function Dashboard() {
  return (
    <section className="space-y-5">

      {/* ── Header ────────────────────────────── */}
      <header className="card flex flex-wrap items-center justify-between gap-3 p-4">
        {/* Search bar */}
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground min-w-[260px]">
          <Search size={14} className="shrink-0" />
          <span className="flex-1">Search campaigns, leads, settings...</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-secondary transition-colors">
            Organization: Core Ops
          </button>
          <button className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600 transition-colors shadow-sm">
            New Campaign
          </button>
          <button className="rounded-xl border border-border bg-card p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <Bell size={16} />
          </button>
        </div>
      </header>

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
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {metric.value}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {metric.delta}
            </p>
          </motion.div>
        ))}
      </section>

      {/* ── Chart + Activity ─────────────────── */}
      <section className="grid gap-4 xl:grid-cols-[3fr_2fr]">

        {/* Chart */}
        <div className="card p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Outreach vs Engagement</h2>
            <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-300">
              Last 7 days
            </span>
          </div>

          {/* Bar chart area */}
          <div className="flex h-44 items-end gap-2 rounded-xl border border-border bg-secondary/50 px-4 pt-4 pb-3">
            {chartBars.map((bar, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-b from-cyan-400 to-cyan-600 dark:from-cyan-300 dark:to-cyan-600 opacity-75 transition-all hover:opacity-100"
                  style={{ height: `${bar}%` }}
                />
                <span className="text-[10px] font-bold text-muted-foreground">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-foreground">Recent Activity</h2>
          <ul className="mt-4 space-y-2">
            {activity.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-border bg-secondary/60 px-3 py-2.5 text-xs font-medium text-muted-foreground leading-snug"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Leads Table + Right Panel ─────────── */}
      <section className="grid gap-4 xl:grid-cols-[3fr_2fr]">

        {/* Leads table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-bold text-foreground">Lead Management</h2>
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
                  {["Lead", "Company", "Email", "Campaign", "Status"].map((h) => (
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
                    <td className="px-5 py-3 text-muted-foreground">{lead.campaign}</td>
                    <td className="px-5 py-3">
                      <span className="badge">{lead.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Campaign orchestration */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-foreground">Campaign Orchestration</h2>
            <ul className="mt-4 space-y-4">
              {campaigns.map((c) => (
                <li key={c.name}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{c.name}</span>
                    <span className="text-muted-foreground">{c.stage}</span>
                  </div>
                  {/* Progress track */}
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

          {/* Template preview */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-foreground">Template Preview</h2>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Instruction for AI
            </p>
            <p className="mt-1.5 rounded-lg border border-border bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
              Keep it under 3 sentences, mention recent funding, and offer 15 minutes for a discovery call.
            </p>
            <p className="mt-3.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Variables
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["{{lead.name}}", "{{lead.company}}", "{{campaign.goal}}"].map((v) => (
                <span key={v} className="badge text-[10px]">{v}</span>
              ))}
            </div>
          </div>

        </div>
      </section>

    </section>
  );
}
