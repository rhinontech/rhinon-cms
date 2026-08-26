"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbNote, TbPhone, TbCalendarEvent, TbMail, TbArrowsExchange,
  TbUserShare, TbSparkles, TbSend, TbEye, TbRobot, TbChecks,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import type { TimelineEntry } from "./types";
import { Avatar, TBtn, relativeTime } from "./ui";

/** Human-loggable kinds. Everything else on the feed is generated. */
const LOG_TYPES = [
  { value: "Note", label: "Note", icon: <TbNote size={14} /> },
  { value: "Call", label: "Call", icon: <TbPhone size={14} /> },
  { value: "Meeting", label: "Meeting", icon: <TbCalendarEvent size={14} /> },
  { value: "Email", label: "Email", icon: <TbMail size={14} /> },
] as const;

function entryIcon(entry: TimelineEntry) {
  if (entry.kind === "campaign") {
    if (entry.type === "Enrichment") return <TbSparkles size={13} />;
    if (entry.type === "EmailOpened") return <TbEye size={13} />;
    if (entry.type === "OutreachSent") return <TbSend size={13} />;
    return <TbRobot size={13} />;
  }
  if (entry.kind === "email") return <TbMail size={13} />;
  switch (entry.type) {
    case "Call": return <TbPhone size={13} />;
    case "Meeting": return <TbCalendarEvent size={13} />;
    case "Email": return <TbMail size={13} />;
    case "StageChange": return <TbArrowsExchange size={13} />;
    case "LifecycleChange": return <TbChecks size={13} />;
    case "OwnerChange": return <TbUserShare size={13} />;
    default: return <TbNote size={13} />;
  }
}

/** Machine events stay visually quieter than things a person did. */
function entryTint(entry: TimelineEntry) {
  if (entry.kind === "campaign") return "bg-stone-100 text-stone-400";
  if (entry.kind === "email") return "bg-blue-50 text-blue-500";
  switch (entry.type) {
    case "Call": return "bg-emerald-50 text-emerald-600";
    case "Meeting": return "bg-violet-50 text-violet-600";
    case "StageChange":
    case "LifecycleChange": return "bg-amber-50 text-amber-600";
    case "OwnerChange": return "bg-cyan-50 text-cyan-600";
    default: return "bg-stone-100 text-stone-500";
  }
}

export function Timeline({
  leadId,
  dealId,
  accountId,
  onLogged,
}: {
  leadId?: string;
  dealId?: string;
  accountId?: string;
  onLogged?: () => void;
}) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logType, setLogType] = useState<string>("Note");
  const [body, setBody] = useState("");
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = leadId ? `leadId=${leadId}` : dealId ? `dealId=${dealId}` : `accountId=${accountId}`;
  const target = leadId || dealId || accountId;

  const load = useCallback(async () => {
    if (!target) return;
    setLoading(true);
    try {
      setEntries(await apiFetch<TimelineEntry[]>(`/activities/timeline?${query}`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }, [query, target]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/activities", {
        method: "POST",
        body: JSON.stringify({
          leadId, dealId, accountId,
          type: logType,
          body: body.trim(),
          durationMinutes: logType === "Call" && duration ? Number(duration) : undefined,
          direction: logType === "Call" || logType === "Email" ? "Outbound" : undefined,
        }),
      });
      setBody("");
      setDuration("");
      await load();
      onLogged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log activity");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Composer */}
      <div className="rounded-lg border border-stone-200 bg-white/70 p-2">
        <div className="mb-2 flex items-center gap-1">
          {LOG_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setLogType(t.value)}
              className={cn(
                "inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
                logType === t.value ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100"
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            // ⌘/Ctrl+Enter submits — the composer is used dozens of times a day.
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
          placeholder={
            logType === "Call" ? "What was discussed on the call?"
            : logType === "Meeting" ? "Meeting notes and next steps…"
            : logType === "Email" ? "Summary of the email…"
            : "Add a note…"
          }
          className="h-16 w-full resize-none rounded border border-stone-200 bg-white px-2 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <div className="mt-1.5 flex items-center justify-between gap-2">
          {logType === "Call" ? (
            <input
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Duration (min)"
              className="w-32 rounded border border-stone-200 bg-white px-2 py-1 text-[11px] tabular-nums outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          ) : <span className="text-[10px] text-stone-400">⌘↵ to save</span>}
          <TBtn variant="solid" onClick={submit} disabled={saving || !body.trim()}>
            {saving ? "Saving…" : `Log ${logType.toLowerCase()}`}
          </TBtn>
        </div>
      </div>

      {error && <p className="rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700">{error}</p>}

      {/* Feed */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-stone-100" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="py-6 text-center text-xs text-stone-400">No activity yet.</p>
      ) : (
        <ol className="relative space-y-0.5">
          {entries.map((entry, i) => (
            <li key={`${entry.kind}-${entry.id}`} className="relative flex gap-2.5 pb-2">
              {/* Connector: skipped on the last row so the line doesn't dangle. */}
              {i < entries.length - 1 && (
                <span className="absolute left-[11px] top-6 h-full w-px bg-stone-200" aria-hidden />
              )}
              <span className={cn("z-10 mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full", entryTint(entry))}>
                {entryIcon(entry)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={cn("truncate text-[13px]", entry.kind === "activity" ? "text-stone-800" : "text-stone-500")}>
                    {entry.subject || entry.type}
                    {entry.durationMinutes ? (
                      <span className="ml-1.5 text-[11px] tabular-nums text-stone-400">{entry.durationMinutes}m</span>
                    ) : null}
                  </p>
                  <span className="shrink-0 text-[10px] tabular-nums text-stone-400">{relativeTime(entry.occurredAt)}</span>
                </div>
                {entry.body && (
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-stone-500 line-clamp-4">
                    {entry.body}
                  </p>
                )}
                {entry.user && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <Avatar name={entry.user.fullName} size={14} />
                    <span className="text-[10px] text-stone-400">{entry.user.fullName}</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
