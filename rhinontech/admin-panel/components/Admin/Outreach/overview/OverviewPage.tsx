"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TbBrandLinkedin, TbMailOpened, TbMessageCircle, TbPlus, TbTarget, TbUsers, TbSpeakerphone } from "react-icons/tb";
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
  totalCampaigns: number;
  activeCampaigns: number;
  emailsSent: number;
  repliesReceived: number;
}

interface ChartPoint {
  date: string;
  drafted: number;
  sent: number;
  replied: number;
}

interface Activity {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  lead?: { name: string; company: string } | null;
}

export function OverviewPage() {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];

  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Stats>("/outreach/stats"),
      // Feeds the "Recent Activity" list only — it is a capped feed, never a
      // data source for the chart (see /outreach/timeseries).
      apiFetch<Activity[]>("/outreach/activities?limit=20"),
      apiFetch<ChartPoint[]>("/outreach/timeseries?days=14"),
      apiFetch<Campaign[]>("/campaigns"),
    ])
      .then(([s, a, t, c]) => {
        setStats(s);
        setActivities(a);
        setChartData(t);
        setCampaigns(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: "Total Leads", value: stats.totalLeads, icon: <TbUsers size={16} /> },
        { label: "Total Campaigns", value: stats.totalCampaigns, icon: <TbSpeakerphone size={16} /> },
        { label: "Active Campaigns", value: stats.activeCampaigns, icon: <TbTarget size={16} /> },
        { label: "Emails Sent", value: stats.emailsSent, icon: <TbMailOpened size={16} /> },
        { label: "Replies", value: stats.repliesReceived, icon: <TbMessageCircle size={16} /> },
      ]
    : [];

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden lg:rounded-r-xl rounded-xl glass-panel">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b px-3 sm:px-4 py-2.5 sm:py-0 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <SubNavToggle />
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight text-gray-900 truncate">Outreach Overview</h1>
            <p className="hidden text-xs text-gray-500 sm:block truncate">Cold email, AI-drafted outreach, and LinkedIn publishing at a glance.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button size="sm" variant="outline" className="px-2.5 sm:px-3 text-xs" asChild>
            <Link href={`/${roleSlug}/outreach/publishing`}>
              <TbBrandLinkedin size={15} />
              <span className="hidden xs:inline sm:inline">Publish</span>
            </Link>
          </Button>
          <Button size="sm" className="px-2.5 sm:px-3 text-xs" asChild>
            <Link href={`/${roleSlug}/outreach/campaigns`}>
              <TbPlus size={15} />
              <span><span className="hidden xs:inline sm:inline">New </span>Campaign</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-3 sm:space-y-4 overflow-auto p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {(loading && !stats ? Array.from({ length: 5 }) : cards).map((c: any, i) => (
            <StatCard key={i} label={c?.label} value={c?.value} icon={c?.icon} loading={loading && !stats} />
          ))}
        </div>

        <div className="rounded-xl glass-panel p-3 sm:p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-stone-900">Activity, last 14 days</h2>
            <p className="text-xs text-stone-400">Drafts, sends, and replies across every campaign.</p>
          </div>
          <OutreachChart data={chartData} loading={loading} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          <div className="rounded-xl glass-panel p-3 sm:p-4">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">Needs Attention</h2>
            <NeedsAttention campaigns={campaigns} loading={loading} />
          </div>
          <div className="rounded-xl glass-panel p-3 sm:p-4">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">Recent Activity</h2>
            <ActivityFeed activities={activities.slice(0, 12)} loading={loading} />
          </div>
        </div>
      </div>
    </main>
  );
}
