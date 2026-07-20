"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TbBrandLinkedin, TbMailOpened, TbMessageCircle, TbPlus, TbTarget, TbUsers } from "react-icons/tb";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { Button } from "@/components/ui/button";
import { StatCard } from "../shared/StatCard";
import { OutreachChart } from "./OutreachChart";
import { NeedsAttention } from "./NeedsAttention";
import { ActivityFeed } from "./ActivityFeed";
import type { Campaign } from "../shared/types";

interface Stats {
  totalLeads: number;
  activeCampaigns: number;
  emailsSent: number;
  repliesReceived: number;
}

interface Activity {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  lead?: { name: string; company: string } | null;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function OverviewPage() {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];

  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Stats>("/outreach/stats"),
      apiFetch<Activity[]>("/outreach/activities?limit=200"),
      apiFetch<Campaign[]>("/campaigns"),
    ])
      .then(([s, a, c]) => {
        setStats(s);
        setActivities(a);
        setCampaigns(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Bucket the last 14 days of activity for the trend chart.
  const chartData = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const byDay = new Map<string, { date: string; drafted: number; sent: number; replied: number }>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      byDay.set(ymd(d), { date: ymd(d), drafted: 0, sent: 0, replied: 0 });
    }
    for (const a of activities) {
      const key = ymd(new Date(a.timestamp));
      const row = byDay.get(key);
      if (!row) continue;
      if (a.type === "DraftGenerated") row.drafted++;
      else if (a.type === "OutreachSent") row.sent++;
      else if (a.type === "ReplyReceived") row.replied++;
    }
    return Array.from(byDay.values());
  }, [activities]);

  const cards = stats
    ? [
        { label: "Total Leads", value: stats.totalLeads, icon: <TbUsers size={16} /> },
        { label: "Active Campaigns", value: stats.activeCampaigns, icon: <TbTarget size={16} /> },
        { label: "Emails Sent", value: stats.emailsSent, icon: <TbMailOpened size={16} /> },
        { label: "Replies", value: stats.repliesReceived, icon: <TbMessageCircle size={16} /> },
      ]
    : [];

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl glass-panel">
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <SubNavToggle />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-gray-900">Outreach Overview</h1>
            <p className="text-xs text-gray-500">Cold email, AI-drafted outreach, and LinkedIn publishing at a glance.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/${roleSlug}/outreach/publishing`}>
              <TbBrandLinkedin size={15} /> Publish
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/${roleSlug}/outreach/campaigns`}>
              <TbPlus size={15} /> New Campaign
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(loading && !stats ? Array.from({ length: 4 }) : cards).map((c: any, i) => (
            <StatCard key={i} label={c?.label} value={c?.value} icon={c?.icon} loading={loading && !stats} />
          ))}
        </div>

        <div className="rounded-xl glass-panel p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-stone-900">Activity, last 14 days</h2>
            <p className="text-xs text-stone-400">Drafts, sends, and replies across every campaign.</p>
          </div>
          <OutreachChart data={chartData} loading={loading} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl glass-panel p-4">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">Needs Attention</h2>
            <NeedsAttention campaigns={campaigns} loading={loading} />
          </div>
          <div className="rounded-xl glass-panel p-4">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">Recent Activity</h2>
            <ActivityFeed activities={activities.slice(0, 12)} loading={loading} />
          </div>
        </div>
      </div>
    </main>
  );
}
