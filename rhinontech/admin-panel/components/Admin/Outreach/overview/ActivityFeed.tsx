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
  DraftGenerated: { icon: <TbSparkles size={13} />, color: "bg-violet-100 dark:bg-violet-400/15 text-violet-600 dark:text-violet-300" },
  OutreachSent: { icon: <TbMail size={13} />, color: "bg-blue-100 dark:bg-blue-400/15 text-blue-600 dark:text-blue-300" },
  ReplyReceived: { icon: <TbMessage size={13} />, color: "bg-emerald-100 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-300" },
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
    <div className="divide-y divide-border">
      {activities.map((a) => {
        const meta = TYPE_META[a.type] || { icon: <TbActivity size={13} />, color: "bg-muted text-muted-foreground" };
        return (
          <div key={a.id} className="flex items-start gap-3 py-2.5">
            <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", meta.color)}>
              {meta.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-foreground/85">
                {a.lead && <span className="font-bold">{a.lead.name}</span>}
                {a.lead && " — "}
                {a.content}
              </p>
              <p className="text-[10px] text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
