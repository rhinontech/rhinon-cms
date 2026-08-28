"use client";

import { TbEye, TbHeart, TbLoader, TbMessageCircle, TbRefresh, TbShare } from "react-icons/tb";
import { cn } from "@/lib/utils";
import type { Campaign } from "../shared/types";

export function PostStatsCard({
  stats,
  loading,
  onRefresh,
}: {
  stats: NonNullable<Campaign["socialStats"]> | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const items = [
    { icon: <TbHeart size={20} />, label: "Likes", value: stats?.likes ?? 0, color: "text-red-500 dark:text-red-400" },
    { icon: <TbMessageCircle size={20} />, label: "Comments", value: stats?.comments ?? 0, color: "text-blue-500 dark:text-blue-400" },
    { icon: <TbShare size={20} />, label: "Shares", value: stats?.shares ?? 0, color: "text-green-500 dark:text-green-400" },
    { icon: <TbEye size={20} />, label: "Impressions", value: stats?.impressions ?? 0, color: "text-violet-500 dark:text-violet-400" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Engagement</p>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
        >
          {loading ? <TbLoader className="animate-spin" size={12} /> : <TbRefresh size={12} />}
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="rounded-xl glass-panel p-4 text-center">
            <div className={cn("mx-auto mb-1 w-fit", s.color)}>{s.icon}</div>
            <p className="text-xl font-bold text-foreground tabular-nums">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      {stats?.lastUpdated && (
        <p className="text-[10px] text-muted-foreground">Last updated {new Date(stats.lastUpdated).toLocaleString()}</p>
      )}
    </div>
  );
}
