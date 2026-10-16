"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TbPlus, TbBriefcase, TbCalendarEvent, TbUsers } from "react-icons/tb";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { hiringApi, INR, type Opening } from "./shared";
import { OpeningDialog } from "./OpeningDialog";

const STATUS_STYLE: Record<Opening["status"], string> = {
  open: "bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300",
  on_hold: "bg-yellow-100 dark:bg-yellow-400/15 text-yellow-700 dark:text-yellow-300",
  closed: "bg-muted text-muted-foreground",
};

export function HiringOpenings() {
  const roleSlug = usePathname().split("/")[1];
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<"active" | "closed">("active");

  const load = useCallback(() => {
    hiringApi("/openings")
      .then((r) => r.json())
      .then((d) => setOpenings(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = openings.filter((o) => (filter === "closed" ? o.status === "closed" : o.status !== "closed"));

  return (
    <div className="flex min-h-0 gap-2 w-full h-full overflow-hidden">
      <main className="flex min-h-0 flex-col glass-panel w-full h-full overflow-hidden rounded-r-xl max-sm:rounded-xl">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b border-border glass-header shrink-0">
        <SubNavToggle />
        <div className="flex-1">
          <h1 className="text-base font-semibold tracking-tight">Hiring</h1>
          <p className="text-xs text-muted-foreground">Openings, candidates and interview rounds</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
          <TbPlus size={14} /> New opening
        </button>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-4">
        <div className="flex gap-2">
          {(["active", "closed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border ${filter === f ? "bg-foreground text-background border-foreground" : "border-border text-foreground/75 hover:bg-muted/40"}`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : shown.length === 0 ? (
          <div className="glass-card-solid rounded-xl p-12 text-center text-muted-foreground text-sm">
            {filter === "active" ? "No open roles. Create one with “New opening”." : "No closed openings."}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {shown.map((o) => {
              const c = o.counts ?? {};
              const inPipeline = (c.applied ?? 0) + (c.shortlisted ?? 0) + (c.interview ?? 0) + (c.offer ?? 0);
              return (
                <Link key={o.id} href={`/${roleSlug}/employees/hiring/${o.id}`}
                  className="glass-card-solid rounded-xl p-5 hover:ring-2 hover:ring-blue-500/30 transition-shadow block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-blue-50 dark:bg-blue-400/10 rounded-lg text-blue-600 dark:text-blue-300 shrink-0"><TbBriefcase size={20} /></div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{o.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[o.department, o.location, o.employmentType].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_STYLE[o.status]}`}>{o.status.replace("_", " ")}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    {[
                      ["In pipeline", inPipeline],
                      ["Interviewing", c.interview ?? 0],
                      ["Offer", c.offer ?? 0],
                      ["Hired", `${c.hired ?? 0}/${o.positions}`],
                    ].map(([label, value]) => (
                      <div key={label as string} className="rounded-lg bg-muted/40 py-2">
                        <p className="text-base font-bold text-foreground">{value}</p>
                        <p className="text-[11px] text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><TbUsers size={13} /> {o.totalCandidates ?? 0} candidates</span>
                    {(o.upcomingInterviews ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-300"><TbCalendarEvent size={13} /> {o.upcomingInterviews} upcoming interview{o.upcomingInterviews === 1 ? "" : "s"}</span>
                    )}
                    <span>{o.rounds.length} rounds</span>
                    {(o.salaryMin || o.salaryMax) && <span>{INR(o.salaryMin)} – {INR(o.salaryMax)}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      </main>

      {showNew && <OpeningDialog onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load(); }} />}
    </div>
  );
}
