"use client";

import { useCallback, useEffect, useState } from "react";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { cn } from "@/lib/utils";
import { useSideNav } from "@/context/SideNavContext";
import { apiFetch } from "@/lib/api";
import { TbUsers, TbX, TbLoader2, TbStarFilled, TbStar } from "react-icons/tb";

interface TeamMember {
  reviewee: { id: string; fullName: string; department: string; companyEmail: string };
  cycleCount: number;
  avgSelfRating: number | null;
  avgManagerRating: number | null;
  latestStatus: "pending" | "submitted";
  submissions: Array<{
    id: string;
    type: "self" | "manager";
    status: "pending" | "submitted";
    selfRating: number | null;
    managerRating: number | null;
    cycle?: { id: string; name: string; type: string };
  }>;
}

function StarRating({ value }: { value: number | null }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        (value ?? 0) >= n
          ? <TbStarFilled key={n} className="text-amber-400" size={14} />
          : <TbStar key={n} className="text-muted-foreground/70" size={14} />
      ))}
      {value && <span className="ml-1 text-xs text-muted-foreground">{value}</span>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
      status === "submitted" ? "bg-green-50 dark:bg-green-400/10 text-green-700 dark:text-green-300" : "bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300"
    )}>
      {status === "submitted" ? "Submitted" : "Pending"}
    </span>
  );
}

export function TeamReviewsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TeamMember | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<TeamMember[]>("/performance/team");
      setTeam(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex min-h-0 gap-2 h-full overflow-hidden">
      <main className={cn("flex min-h-0 flex-col h-full w-full glass-panel overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b border-border glass-header">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <span className="text-lg font-semibold tracking-tight">Team Reviews</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <TbLoader2 className="animate-spin text-muted-foreground" size={28} />
            </div>
          ) : team.length === 0 ? (
            <div className="rounded-xl glass-card p-10 text-center">
              <TbUsers size={36} className="mx-auto text-muted-foreground/70 mb-3" />
              <p className="text-sm text-muted-foreground">No team review data yet. Create a review cycle to get started.</p>
            </div>
          ) : (
            <div className="rounded-xl glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Employee</th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Department</th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Cycles</th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Avg Self</th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Avg Manager</th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Latest Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {team.map((member) => (
                    <tr
                      key={member.reviewee.id}
                      onClick={() => setSelected(member)}
                      className="hover:bg-blue-50 dark:hover:bg-blue-400/10 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{member.reviewee.fullName}</p>
                        <p className="text-xs text-muted-foreground">{member.reviewee.companyEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground/70">{member.reviewee.department}</td>
                      <td className="px-4 py-3 text-foreground/70">{member.cycleCount}</td>
                      <td className="px-4 py-3">
                        {member.avgSelfRating ? <StarRating value={member.avgSelfRating} /> : <span className="text-muted-foreground/70">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {member.avgManagerRating ? <StarRating value={member.avgManagerRating} /> : <span className="text-muted-foreground/70">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={member.latestStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <aside className={cn(
        "flex min-h-0 h-full flex-col bg-card rounded-xl overflow-hidden transition-all duration-200 ease-in-out",
        selected ? "w-[42%]" : "w-0"
      )}>
          {selected && (
            <>
              <div className="sticky top-0 w-full flex items-center justify-between h-16 px-5 border-b bg-card z-10">
                <div className="flex gap-4 border-b border-transparent -mb-px">
                  <p className="flex self-stretch items-center text-md font-medium tracking-tight border-b-2 border-blue-600 text-foreground -mb-px">
                    {selected.reviewee.fullName}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                  <TbX size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-semibold text-foreground">{selected.reviewee.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-semibold text-foreground text-sm">{selected.reviewee.companyEmail}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Avg Self Rating</p>
                    {selected.avgSelfRating ? (
                      <StarRating value={selected.avgSelfRating} />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">No data</p>
                    )}
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Avg Manager Rating</p>
                    {selected.avgManagerRating ? (
                      <StarRating value={selected.avgManagerRating} />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">No data</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground/85 mb-2">Submissions</p>
                  <div className="space-y-2">
                    {selected.submissions.map((sub) => (
                      <div key={sub.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">{sub.cycle?.name ?? "—"} · <span className="capitalize">{sub.type}</span></p>
                            {sub.type === "self" && sub.selfRating && <StarRating value={sub.selfRating} />}
                            {sub.type === "manager" && sub.managerRating && <StarRating value={sub.managerRating} />}
                          </div>
                          <StatusBadge status={sub.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
      </aside>
    </div>
  );
}
