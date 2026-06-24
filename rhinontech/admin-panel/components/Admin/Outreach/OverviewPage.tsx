"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbUsers,
  TbTarget,
  TbMailOpened,
  TbActivity,
  TbTrendingUp,
  TbArrowUpRight,
  TbArrowDownRight,
  TbLoader
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";

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
  lead?: { name: string; company: string };
}

export function OverviewPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, acts] = await Promise.all([
        apiFetch<Stats>("/outreach/stats"),
        apiFetch<Activity[]>("/outreach/activities?limit=10"),
      ]);
      setStats(statsData);
      setActivities(acts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <TbLoader className="animate-spin text-stone-300" size={48} />
    </div>
  );

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="flex h-16 items-center justify-between border-b px-4 bg-white">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900">Outreach Overview</h1>
              <p className="text-xs text-gray-500">Real-time performance metrics and outreach activity.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 space-y-8 bg-white">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Leads" value={stats?.totalLeads} icon={<TbUsers />} trend="+12% from last month" trendUp />
            <StatCard label="Active Campaigns" value={stats?.activeCampaigns} icon={<TbTarget />} />
            <StatCard label="Emails Sent" value={stats?.emailsSent} icon={<TbMailOpened />} trend="+5.2%" trendUp />
            <StatCard label="Replies" value={stats?.repliesReceived} icon={<TbActivity />} trend="-2%" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <TbActivity className="text-stone-400" /> Recent Activity
                </h3>
              </div>
              <div className="flex-1 overflow-auto divide-y divide-stone-50">
                {activities.length === 0 ? (
                  <div className="p-10 text-center text-stone-400 text-sm italic">No recent activity</div>
                ) : activities.map(activity => (
                  <div key={activity.id} className="p-4 flex gap-4 hover:bg-stone-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                      <TbMailOpened className="text-stone-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-stone-800 font-medium leading-tight">
                        {activity.content}
                      </p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion Analytics */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <TbTrendingUp className="text-stone-400" size={18} />
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Conversion Analytics</h3>
              </div>
              {stats && (
                <div className="space-y-5 flex-1">
                  {[
                    {
                      label: "Emails Sent",
                      value: stats.emailsSent,
                      total: stats.totalLeads,
                      color: "bg-stone-900",
                    },
                    {
                      label: "Reply Rate",
                      value: stats.repliesReceived,
                      total: stats.emailsSent || 1,
                      color: "bg-emerald-500",
                    },
                    {
                      label: "Leads Contacted",
                      value: stats.emailsSent,
                      total: stats.totalLeads || 1,
                      color: "bg-blue-500",
                    },
                  ].map((item) => {
                    const pct = Math.min(100, Math.round((item.value / item.total) * 100));
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-stone-600">{item.label}</span>
                          <span className="text-xs font-bold text-stone-900">
                            {item.value.toLocaleString()} <span className="text-stone-400 font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full w-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, trend, trendUp }: { label: string; value?: number; icon: React.ReactNode; trend?: string; trendUp?: boolean }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-stone-50 text-stone-900 rounded-xl text-xl">
          {icon}
        </div>
        {trend && (
          <span className={cn("text-[10px] font-bold flex items-center gap-0.5", trendUp ? "text-green-600" : "text-red-600")}>
            {trendUp ? <TbArrowUpRight /> : <TbArrowDownRight />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-bold text-stone-900 mt-1">{value?.toLocaleString()}</p>
    </div>
  );
}
