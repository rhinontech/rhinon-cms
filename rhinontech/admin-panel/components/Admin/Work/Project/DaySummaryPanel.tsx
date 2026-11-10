"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api";
import { TbLoader, TbSparkles, TbX } from "react-icons/tb";

interface DayEvent { kind: "commit" | "task" | "comment" | "time" | "request"; text: string; at: string | null; who: string | null }
interface DaySummary { points: string[]; aiAvailable: boolean; events: DayEvent[] }

const KIND_LABEL: Record<DayEvent["kind"], string> = {
  commit: "Commits", task: "Task updates", comment: "Comments", time: "Time logged", request: "Client requests",
};

/** Calendar → click a date: AI pointers of the day's work, with the raw events underneath. */
export function DaySummaryPanel({ projectId, date, onClose }: { projectId: string; date: Date; onClose: () => void }) {
  const day = format(date, "yyyy-MM-dd");
  const [data, setData] = useState<DaySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    apiFetch<DaySummary>(`/work/projects/${projectId}/day-summary?date=${day}`)
      .then((d) => { if (active) setData(d); })
      .catch((err) => { if (active) setError(err.message || "Could not load this day"); });
    return () => { active = false; };
  }, [projectId, day]);

  const kinds = (Object.keys(KIND_LABEL) as DayEvent["kind"][])
    .map((k) => ({ k, items: data?.events.filter((e) => e.kind === k) ?? [] }))
    .filter((g) => g.items.length);

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l bg-card shadow-xl">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <h2 className="flex-1 text-base font-semibold text-foreground">{format(date, "EEEE, d MMM yyyy")}</h2>
        <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Close"><TbX size={16} /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-auto px-5 py-4">
        {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
        {!data && !error && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><TbLoader className="animate-spin" size={15} /> Summarising the day…</p>
        )}
        {data && !data.events.length && <p className="py-8 text-center text-sm text-muted-foreground">No work recorded on this day.</p>}
        {data && !data.aiAvailable && <p className="text-xs text-amber-700 dark:text-amber-300">The AI summary isn't available right now. Here's everything recorded.</p>}
        {!!data?.points.length && (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><TbSparkles size={13} /> What we did</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground/90">
              {data.points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </section>
        )}
        {kinds.map(({ k, items }) => (
          <section key={k}>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{KIND_LABEL[k]} ({items.length})</h3>
            <ul className="space-y-1 text-xs text-foreground/75">
              {items.map((e, i) => <li key={i} className="break-words">{e.text}{e.who ? ` — ${e.who}` : ""}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
