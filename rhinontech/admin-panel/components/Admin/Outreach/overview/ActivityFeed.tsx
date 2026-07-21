"use client";

import { TbActivity, TbMail, TbMessage, TbSparkles } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../shared/EmptyState";

interface Activity {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  campaignId?: string | null;
  lead?: { name: string; company: string } | null;
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string }> = {
  DraftGenerated: { icon: <TbSparkles size={13} />, color: "bg-violet-100 text-violet-600" },
  OutreachSent: { icon: <TbMail size={13} />, color: "bg-blue-100 text-blue-600" },
  ReplyReceived: { icon: <TbMessage size={13} />, color: "bg-emerald-100 text-emerald-600" },
};

export function ActivityFeed({ activities, loading }: { activities: Activity[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return <EmptyState icon={<TbActivity size={36} />} title="No activity yet" className="py-10" />;
  }

  return (
    <div className="divide-y divide-stone-50">
      {activities.map((a) => {
        const meta = TYPE_META[a.type] || { icon: <TbActivity size={13} />, color: "bg-stone-100 text-stone-500" };
        return (
          <div key={a.id} className="flex items-start gap-3 py-2.5">
            <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", meta.color)}>
              {meta.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-stone-700">
                {a.lead && <span className="font-bold">{a.lead.name}</span>}
                {a.lead && " — "}
                {a.content}
              </p>
              <p className="text-[10px] text-stone-400">{new Date(a.timestamp).toLocaleString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
