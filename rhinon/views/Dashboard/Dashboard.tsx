"use client";

import { motion } from "framer-motion";
import {
  activity,
  campaigns,
  leads,
  metrics,
} from "@/lib/data";
import {
  Bell,
  Command,
  Filter,
  Search,
} from "lucide-react";

const chartBars = [52, 64, 58, 80, 73, 92, 84];

export function Dashboard() {
  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300">
          <Search size={15} />
          <span>Search campaigns, leads, settings...</span>
          <kbd className="rounded bg-slate-800 px-2 py-0.5 text-xs">⌘K</kbd>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-xl border border-slate-700 px-3 py-2 hover:bg-slate-800">
            Organization: Core Ops
          </button>
          <button className="rounded-xl bg-cyan-500 px-3 py-2 font-medium text-slate-950">
            New Campaign
          </button>
          <button className="rounded-xl border border-slate-700 p-2 hover:bg-slate-800">
            <Bell size={16} />
          </button>
        </div>
      </header>

      {/* Metric Cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="card p-4"
          >
            <p className="text-slate-400">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
            <p className="mt-2 text-xs text-emerald-300">{metric.delta}</p>
          </motion.div>
        ))}
      </section>

      {/* Chart + Activity */}
      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Outreach vs Engagement</h2>
            <span className="badge text-cyan-200">Last 7 days</span>
          </div>
          <div className="flex h-52 items-end gap-2 rounded-xl border border-slate-800 p-3">
            {chartBars.map((bar, i) => (
              <div key={i} className="flex-1">
                <div
                  className="rounded-t-lg bg-gradient-to-b from-cyan-300 to-cyan-600"
                  style={{ height: `${bar}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-base font-semibold">Recent Activity</h2>
          <ul className="mt-4 space-y-3">
            {activity.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-slate-300"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Leads + Campaign + Template */}
      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <h2 className="font-semibold">Lead Management</h2>
            <div className="flex items-center gap-2">
              <button className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800">
                <Filter size={14} />
              </button>
              <button className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800">
                <Command size={14} />
              </button>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[680px]">
              <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.email} className="border-t border-slate-800 text-slate-300">
                    <td className="px-4 py-3">{lead.name}</td>
                    <td className="px-4 py-3">{lead.company}</td>
                    <td className="px-4 py-3">{lead.email}</td>
                    <td className="px-4 py-3">{lead.campaign}</td>
                    <td className="px-4 py-3">
                      <span className="badge border-slate-700/80 bg-slate-800/70">{lead.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="font-semibold">Campaign Orchestration</h2>
            <ul className="mt-3 space-y-3">
              {campaigns.map((campaign) => (
                <li key={campaign.name}>
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>{campaign.name}</span>
                    <span>{campaign.stage}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                      style={{ width: `${campaign.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-4">
            <h2 className="font-semibold">Template Builder Preview</h2>
            <p className="mt-3 text-xs text-slate-400">Instruction for AI</p>
            <p className="mt-1 rounded-xl border border-slate-800 bg-slate-900 p-3 text-slate-300">
              Keep it under 3 sentences, mention recent funding, and offer 15 minutes for a discovery call.
            </p>
            <p className="mt-3 text-xs text-slate-400">Variables</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["{{lead.name}}", "{{lead.company}}", "{{campaign.goal}}"].map((v) => (
                <span key={v} className="badge">{v}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
