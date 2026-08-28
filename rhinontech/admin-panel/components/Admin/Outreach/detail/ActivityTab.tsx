"use client";

import { useEffect, useState } from "react";
import { TbActivity, TbMail, TbMessage, TbSparkles, TbX, TbChevronDown } from "react-icons/tb";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../shared/EmptyState";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: string;
  content: string;
  generatedContent?: string | null;
  timestamp: string;
  lead?: { name: string; company: string } | null;
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string }> = {
  DraftGenerated: { icon: <TbSparkles size={14} />, color: "bg-violet-100 dark:bg-violet-400/15 text-violet-600 dark:text-violet-300" },
  OutreachSent: { icon: <TbMail size={14} />, color: "bg-blue-100 dark:bg-blue-400/15 text-blue-600 dark:text-blue-300" },
  ReplyReceived: { icon: <TbMessage size={14} />, color: "bg-emerald-100 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-300" },
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {activities.map((a) => {
            const meta = TYPE_META[a.type] || { icon: <TbActivity size={14} />, color: "bg-muted text-muted-foreground" };
            const isReply = a.type === "ReplyReceived" && !!a.generatedContent;
            const expanded = expandedId === a.id;
            return (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", meta.color)}>
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      {a.lead && <span className="font-bold">{a.lead.name}</span>}
                      {a.lead?.company && <span className="text-muted-foreground"> ({a.lead.company})</span>}
                      {a.lead && " — "}
                      {a.content}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="text-[11px] text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</p>
                      {isReply && (
                        <button
                          onClick={() => setExpandedId(expanded ? null : a.id)}
                          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300 hover:underline"
                        >
                          {expanded ? "Hide reply" : "View reply"}
                          <TbChevronDown size={12} className={cn("transition-transform", expanded && "rotate-180")} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {isReply && expanded && (
                  <div
                    className="prose prose-sm mt-3 ml-10 max-w-none rounded-lg border border-emerald-100 dark:border-emerald-400/20 bg-emerald-50/30 dark:bg-emerald-400/10 p-3 text-sm text-foreground [&_*]:!my-1"
                    dangerouslySetInnerHTML={{ __html: a.generatedContent! }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
