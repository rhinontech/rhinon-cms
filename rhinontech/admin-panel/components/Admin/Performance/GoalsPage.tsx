"use client";

import { useCallback, useEffect, useState } from "react";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { cn } from "@/lib/utils";
import { useSideNav } from "@/context/SideNavContext";
import { apiFetch } from "@/lib/api";
import { usePermissions } from "@/context/PermissionsContext";
import { TbPlus, TbX, TbTarget, TbLoader2, TbTrash } from "react-icons/tb";

interface ReviewCycle {
  id: string;
  name: string;
  type: string;
}

interface ReviewGoal {
  id: string;
  title: string;
  description: string | null;
  status: "not_started" | "in_progress" | "completed";
  progress: number;
  targetDate: string | null;
  cycleId: string | null;
  cycle?: ReviewCycle | null;
  user?: { id: string; fullName: string; department: string };
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    not_started: "bg-muted text-foreground/70",
    in_progress: "bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300",
    completed: "bg-green-50 dark:bg-green-400/10 text-green-700 dark:text-green-300",
  };
  const labels: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    completed: "Completed",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", styles[status] ?? "bg-muted text-foreground/70")}>
      {labels[status] ?? status}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-blue-500 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function GoalsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const { has } = usePermissions();
  const isAdmin = has("performance:write");

  const [goals, setGoals] = useState<ReviewGoal[]>([]);
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReviewGoal | null>(null);
  const [asideMode, setAsideMode] = useState<"view" | "create">("view");
  const [mobileDetail, setMobileDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userFilter, setUserFilter] = useState("");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "not_started" as ReviewGoal["status"],
    progress: 0,
    targetDate: "",
    cycleId: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsData] = await Promise.all([
        apiFetch<ReviewGoal[]>("/performance/goals" + (userFilter ? `?userId=${userFilter}` : "")),
      ]);
      setGoals(goalsData);
      if (isAdmin) {
        const cyclesData = await apiFetch<ReviewCycle[]>("/performance/cycles");
        setCycles(cyclesData);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [isAdmin, userFilter]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ title: "", description: "", status: "not_started", progress: 0, targetDate: "", cycleId: "" });
    setSelected(null);
    setAsideMode("create");
    setMobileDetail(true);
  }

  function openGoal(goal: ReviewGoal) {
    setSelected(goal);
    setForm({
      title: goal.title,
      description: goal.description ?? "",
      status: goal.status,
      progress: goal.progress,
      targetDate: goal.targetDate ?? "",
      cycleId: goal.cycleId ?? "",
    });
    setAsideMode("view");
    setMobileDetail(true);
  }

  function closeAside() {
    setSelected(null);
    setAsideMode("view");
    setMobileDetail(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (asideMode === "create") {
        await apiFetch("/performance/goals", {
          method: "POST",
          body: JSON.stringify({
            title: form.title,
            description: form.description || null,
            cycleId: form.cycleId || null,
            targetDate: form.targetDate || null,
          }),
        });
      } else if (selected) {
        await apiFetch(`/performance/goals/${selected.id}`, {
          method: "PUT",
          body: JSON.stringify({
            title: form.title,
            description: form.description || null,
            status: form.status,
            progress: form.progress,
            targetDate: form.targetDate || null,
            cycleId: form.cycleId || null,
          }),
        });
      }
      closeAside();
      await load();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(goal: ReviewGoal) {
    if (!confirm("Delete this goal?")) return;
    try {
      await apiFetch(`/performance/goals/${goal.id}`, { method: "DELETE" });
      closeAside();
      await load();
    } catch {
      // silent
    }
  }

  const asideOpen = asideMode === "create" || selected !== null;

  return (
    <div className="flex min-h-0 gap-2 h-full overflow-hidden">
      <main className={cn("flex min-h-0 flex-col h-full w-full glass-panel overflow-hidden", isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl")}>
        <div className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2 sm:py-0 border-b border-border glass-header">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <SubNavToggle />
            <span className="text-base sm:text-lg font-semibold tracking-tight truncate">My Goals</span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0"
          >
            <TbPlus size={15} />
            <span>Add Goal</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-5">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <TbLoader2 className="animate-spin text-muted-foreground" size={28} />
            </div>
          ) : goals.length === 0 ? (
            <div className="rounded-xl glass-card p-8 sm:p-10 text-center">
              <TbTarget size={36} className="mx-auto text-muted-foreground/70 mb-3" />
              <p className="text-xs sm:text-sm text-muted-foreground">No goals yet. Click "Add Goal" to create your first one.</p>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => openGoal(goal)}
                  className="w-full text-left rounded-xl glass-card p-3.5 sm:p-4 hover:border-blue-200 dark:hover:border-blue-400/25 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground text-xs sm:text-sm truncate">{goal.title}</p>
                        {goal.cycle && (
                          <span className="text-[10px] sm:text-xs rounded-md px-1.5 sm:px-2 py-0.5 bg-purple-50 dark:bg-purple-400/10 text-purple-700 dark:text-purple-300 font-medium">{goal.cycle.name}</span>
                        )}
                      </div>
                      {isAdmin && goal.user && (
                        <p className="text-xs text-muted-foreground mt-0.5">{goal.user.fullName} · {goal.user.department}</p>
                      )}
                      <div className="mt-2 space-y-1">
                        <ProgressBar value={goal.progress} />
                        <p className="text-[11px] sm:text-xs text-muted-foreground">{goal.progress}% complete{goal.targetDate ? ` · Due ${goal.targetDate}` : ""}</p>
                      </div>
                    </div>
                    <StatusChip status={goal.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <aside className={cn(
        "min-h-0 flex-col bg-card overflow-hidden transition-all duration-200 ease-in-out",
        mobileDetail && asideOpen ? "fixed inset-0 z-50 flex w-full max-w-full" : "hidden",
        "lg:static lg:z-auto lg:flex lg:h-full lg:rounded-xl",
        asideOpen ? "lg:w-[42%]" : "lg:w-0"
      )}>
        {asideOpen && (
          <div className="flex h-full flex-col">
            <div className="sticky top-0 w-full flex items-center justify-between min-h-16 px-4 sm:px-5 py-2 sm:py-0 border-b bg-card z-10 shrink-0">
              <div className="flex gap-4 border-b border-transparent -mb-px">
                <p className="flex self-stretch items-center text-sm sm:text-md font-medium tracking-tight border-b-2 border-blue-600 text-foreground -mb-px">
                  {asideMode === "create" ? "New Goal" : "Goal Details"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {selected && (
                  <button onClick={() => handleDelete(selected)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-400/10 text-red-500 dark:text-red-400 transition-colors">
                    <TbTrash size={16} />
                  </button>
                )}
                <button onClick={closeAside} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                  <TbX size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 sm:space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Title *</label>
                <input
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Goal title"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Description</label>
                <textarea
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>

              {asideMode === "view" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Status</label>
                    <select
                      className="w-full rounded-lg border border-border px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ReviewGoal["status"] }))}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Progress: {form.progress}%</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      className="w-full accent-blue-600"
                      value={form.progress}
                      onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
                    />
                    <ProgressBar value={form.progress} />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Target Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.targetDate}
                  onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                />
              </div>

              {isAdmin && cycles.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Review Cycle</label>
                  <select
                    className="w-full rounded-lg border border-border px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.cycleId}
                    onChange={(e) => setForm((f) => ({ ...f, cycleId: e.target.value }))}
                  >
                    <option value="">No cycle</option>
                    {cycles.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !form.title}
                className="w-full rounded-lg bg-primary py-2.5 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : asideMode === "create" ? "Create Goal" : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
