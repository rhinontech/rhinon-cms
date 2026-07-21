"use client";

import { useEffect, useState } from "react";
import { TbActivity, TbMail, TbMessage, TbSparkles, TbX } from "react-icons/tb";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../shared/EmptyState";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  lead?: { name: string; company: string } | null;
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string }> = {
  DraftGenerated: { icon: <TbSparkles size={14} />, color: "bg-violet-100 text-violet-600" },
  OutreachSent: { icon: <TbMail size={14} />, color: "bg-blue-100 text-blue-600" },
  ReplyReceived: { icon: <TbMessage size={14} />, color: "bg-emerald-100 text-emerald-600" },
};

export function ActivityTab({
  campaignId,
  runLogs,
  onClearRunLogs,
}: {
  campaignId: string;
  runLogs: string[] | null;
  onClearRunLogs: () => void;
}) {
  const [activities, setActivities] = useState<Activity[] | null>(null);

  useEffect(() => {
    apiFetch<Activity[]>(`/outreach/activities?campaignId=${campaignId}&limit=50`)
      .then(setActivities)
      .catch(() => setActivities([]));
  }, [campaignId]);

  return (
    <div className="space-y-4">
      {runLogs && (
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-5 font-mono text-xs leading-relaxed text-stone-300 shadow-inner">
          <div className="mb-3 flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="text-stone-500">Engine run — {new Date().toLocaleTimeString()}</span>
            <button onClick={onClearRunLogs} className="hover:text-white">
              <TbX size={14} />
            </button>
          </div>
          {runLogs.map((log, i) => (
            <div key={i} className="mb-1 whitespace-pre-wrap">{log}</div>
          ))}
        </div>
      )}

      {activities === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<TbActivity size={40} />}
          title="No activity yet"
          description="Drafts and sends for this campaign show up here as they happen."
        />
      ) : (
        <div className="divide-y divide-stone-50 rounded-lg border border-stone-100 bg-white">
          {activities.map((a) => {
            const meta = TYPE_META[a.type] || { icon: <TbActivity size={14} />, color: "bg-stone-100 text-stone-500" };
            return (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", meta.color)}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-stone-800">
                    {a.lead && <span className="font-bold">{a.lead.name}</span>}
                    {a.lead?.company && <span className="text-stone-400"> ({a.lead.company})</span>}
                    {a.lead && " — "}
                    {a.content}
                  </p>
                  <p className="mt-0.5 text-[11px] text-stone-400">
                    {new Date(a.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
