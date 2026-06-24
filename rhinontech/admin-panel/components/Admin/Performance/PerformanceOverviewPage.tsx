"use client";

import { useCallback, useEffect, useState } from "react";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { cn } from "@/lib/utils";
import { useSideNav } from "@/context/SideNavContext";
import { apiFetch } from "@/lib/api";
import { usePathname } from "next/navigation";
import { TbChartBar, TbTarget, TbStar, TbLoader2 } from "react-icons/tb";

interface ReviewCycle {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface ReviewGoal {
  id: string;
  title: string;
  status: "not_started" | "in_progress" | "completed";
  progress: number;
  targetDate: string | null;
  cycle?: { name: string; type: string } | null;
}

interface ReviewSubmission {
  id: string;
  type: "self" | "manager";
  status: "pending" | "submitted";
  selfRating: number | null;
  managerRating: number | null;
  cycle?: ReviewCycle | null;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full bg-blue-500 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    not_started: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-50 text-blue-700",
    completed: "bg-green-50 text-green-700",
  };
  const labels: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    completed: "Completed",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", styles[status] ?? "bg-gray-100 text-gray-600")}>
      {labels[status] ?? status}
    </span>
  );
}

export function PerformanceOverviewPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const isAdmin = roleSlug === "superadmin" || roleSlug === "hr";

  const [goals, setGoals] = useState<ReviewGoal[]>([]);
  const [selfReviews, setSelfReviews] = useState<ReviewSubmission[]>([]);
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [teamData, setTeamData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsData, reviewsData] = await Promise.all([
        apiFetch<ReviewGoal[]>("/performance/goals"),
        apiFetch<{ selfReviews: ReviewSubmission[]; managerReviews: ReviewSubmission[] }>("/performance/reviews"),
      ]);
      setGoals(goalsData);
      setSelfReviews(reviewsData.selfReviews);

      if (isAdmin) {
        const [cyclesData, team] = await Promise.all([
          apiFetch<ReviewCycle[]>("/performance/cycles"),
          apiFetch<any[]>("/performance/team"),
        ]);
        setCycles(cyclesData);
        setTeamData(team);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const pendingReviews = selfReviews.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <div className={cn("flex flex-col h-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b bg-stone-50">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <span className="text-lg font-semibold tracking-tight">Overview</span>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <TbLoader2 className="animate-spin text-gray-400" size={28} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b bg-stone-50">
        <div className="flex items-center gap-3">
          <SubNavToggle />
          <span className="text-lg font-semibold tracking-tight">Overview</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {isAdmin ? (
          <>
            {/* Admin stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Active Cycles", value: cycles.filter((c) => c.status === "active").length, icon: TbChartBar },
                {
                  label: "Pending Self-Reviews",
                  value: teamData.reduce((acc, r) => acc + r.submissions.filter((s: any) => s.type === "self" && s.status === "pending").length, 0),
                  icon: TbStar,
                },
                {
                  label: "Pending Manager Reviews",
                  value: teamData.reduce((acc, r) => acc + r.submissions.filter((s: any) => s.type === "manager" && s.status === "pending").length, 0),
                  icon: TbStar,
                },
                {
                  label: "Avg Manager Rating",
                  value: (() => {
                    const ratings = teamData.filter((r) => r.avgManagerRating !== null).map((r) => r.avgManagerRating);
                    return ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) + " / 5" : "—";
                  })(),
                  icon: TbStar,
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-4">
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Active cycles list */}
            {cycles.filter((c) => c.status === "active").length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white">
                <div className="px-5 py-3 border-b">
                  <p className="font-medium text-sm">Active Review Cycles</p>
                </div>
                <div className="divide-y">
                  {cycles.filter((c) => c.status === "active").map((cycle) => (
                    <div key={cycle.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{cycle.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{cycle.startDate} — {cycle.endDate}</p>
                      </div>
                      <span className="text-xs rounded-md px-2 py-0.5 bg-green-50 text-green-700 font-medium capitalize">{cycle.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Employee stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <p className="text-xs text-gray-400 flex items-center gap-1"><TbTarget size={14} /> Goals Completed</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{completedGoals} / {goals.length}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <p className="text-xs text-gray-400 flex items-center gap-1"><TbStar size={14} /> Pending Reviews</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{pendingReviews}</p>
              </div>
            </div>

            {/* Pending self-assessment callout */}
            {pendingReviews > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">Your self-assessment is due</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  You have {pendingReviews} pending self-assessment{pendingReviews > 1 ? "s" : ""}. Complete them under My Reviews.
                </p>
              </div>
            )}

            {/* Recent goals */}
            {goals.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white">
                <div className="px-5 py-3 border-b">
                  <p className="font-medium text-sm">Recent Goals</p>
                </div>
                <div className="divide-y">
                  {goals.slice(0, 5).map((goal) => (
                    <div key={goal.id} className="px-5 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{goal.title}</p>
                        <StatusChip status={goal.status} />
                      </div>
                      <ProgressBar value={goal.progress} />
                      <p className="text-xs text-gray-400">{goal.progress}% complete{goal.targetDate ? ` · Due ${goal.targetDate}` : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {goals.length === 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
                <TbTarget size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No goals yet. Add your first goal under My Goals.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
