"use client";

import { useEffect, useState } from "react";
import { TbWorld } from "react-icons/tb";
import { apiFetch } from "@/lib/api";
import { relativeTime } from "./ui";

interface Visit { id: string; path: string | null; city: string | null; country: string | null; visitedAt: string }

/**
 * Pages this lead viewed on our websites after clicking a personalised link in
 * a campaign email. Grouped into sessions (a gap of 30 minutes starts a new one).
 */
export function LeadVisits({ leadId }: { leadId: string }) {
  const [visits, setVisits] = useState<Visit[] | null>(null);

  useEffect(() => {
    setVisits(null);
    apiFetch<Visit[]>(`/lead-visits/${leadId}`).then(setVisits).catch(() => setVisits([]));
  }, [leadId]);

  if (!visits) return null;

  const sessions: Visit[][] = [];
  for (const v of visits) {
    const current = sessions[sessions.length - 1];
    const last = current?.[current.length - 1];
    if (last && new Date(last.visitedAt).getTime() - new Date(v.visitedAt).getTime() < 30 * 60_000) current.push(v);
    else sessions.push([v]);
  }

  return (
    <div>
      <p className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Website visits</span>
        {visits.length > 0 && <span className="normal-case tracking-normal">{`${sessions.length} ${sessions.length === 1 ? "visit" : "visits"} · ${visits.length} pages`}</span>}
      </p>
      {visits.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-2.5 text-[12px] text-muted-foreground">
          {"No visits yet. They show up here when this lead clicks a link to our site in a campaign email."}
        </p>
      ) : (
        <ol className="space-y-2">
          {sessions.slice(0, 8).map((s) => {
            const first = s[s.length - 1];
            const where = [first.city, first.country].filter(Boolean).join(", ");
            const pages = [...new Set(s.map((v) => v.path || "/"))].reverse();
            return (
              <li key={first.id} className="rounded-lg border bg-card/60 px-3 py-2">
                <div className="flex items-center gap-2 text-[12px]">
                  <TbWorld size={13} className="shrink-0 text-sky-600 dark:text-sky-400" />
                  <span className="font-medium text-foreground">{relativeTime(first.visitedAt)}</span>
                  {where && <span className="truncate text-muted-foreground">{`· ${where}`}</span>}
                </div>
                <p className="mt-1 truncate text-[11.5px] text-muted-foreground" title={pages.join("  →  ")}>{pages.join("  →  ")}</p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
