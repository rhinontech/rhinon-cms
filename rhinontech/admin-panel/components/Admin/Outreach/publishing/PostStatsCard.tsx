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
    { icon: <TbHeart size={20} />, label: "Likes", value: stats?.likes ?? 0, color: "text-red-500" },
    { icon: <TbMessageCircle size={20} />, label: "Comments", value: stats?.comments ?? 0, color: "text-blue-500" },
    { icon: <TbShare size={20} />, label: "Shares", value: stats?.shares ?? 0, color: "text-green-500" },
    { icon: <TbEye size={20} />, label: "Impressions", value: stats?.impressions ?? 0, color: "text-violet-500" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Live Engagement</p>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          {loading ? <TbLoader className="animate-spin" size={12} /> : <TbRefresh size={12} />}
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="rounded-xl glass-panel p-4 text-center">
            <div className={cn("mx-auto mb-1 w-fit", s.color)}>{s.icon}</div>
            <p className="text-xl font-bold text-stone-900 tabular-nums">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{s.label}</p>
          </div>
        ))}
      </div>
      {stats?.lastUpdated && (
        <p className="text-[10px] text-stone-400">Last updated {new Date(stats.lastUpdated).toLocaleString()}</p>
      )}
    </div>
  );
}
