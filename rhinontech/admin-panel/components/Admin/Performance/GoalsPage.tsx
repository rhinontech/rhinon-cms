"use client";

import { useCallback, useEffect, useState } from "react";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { cn } from "@/lib/utils";
import { useSideNav } from "@/context/SideNavContext";
import { apiFetch } from "@/lib/api";
import { usePathname } from "next/navigation";
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

export function GoalsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const isAdmin = roleSlug === "superadmin" || roleSlug === "hr";

  const [goals, setGoals] = useState<ReviewGoal[]>([]);
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReviewGoal | null>(null);
  const [asideMode, setAsideMode] = useState<"view" | "create">("view");
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
  }

  function closeAside() {
    setSelected(null);
    setAsideMode("view");
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
      <main className={cn("flex min-h-0 flex-col h-full w-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b bg-stone-50">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <span className="text-lg font-semibold tracking-tight">My Goals</span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 transition-colors"
          >
            <TbPlus size={16} />
            Add Goal
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <TbLoader2 className="animate-spin text-gray-400" size={28} />
            </div>
          ) : goals.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-10 text-center">
              <TbTarget size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No goals yet. Click "Add Goal" to create your first one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => openGoal(goal)}
                  className="w-full text-left rounded-xl border border-gray-100 bg-white p-4 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm truncate">{goal.title}</p>
                        {goal.cycle && (
                          <span className="text-xs rounded-md px-2 py-0.5 bg-purple-50 text-purple-700 font-medium">{goal.cycle.name}</span>
                        )}
                      </div>
                      {isAdmin && goal.user && (
                        <p className="text-xs text-gray-400 mt-0.5">{goal.user.fullName} · {goal.user.department}</p>
                      )}
                      <div className="mt-2 space-y-1">
                        <ProgressBar value={goal.progress} />
                        <p className="text-xs text-gray-400">{goal.progress}% complete{goal.targetDate ? ` · Due ${goal.targetDate}` : ""}</p>
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
        "flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out",
        asideOpen ? "w-[42%]" : "w-0"
      )}>
          {asideOpen && (
            <>
              <div className="sticky top-0 w-full flex items-center justify-between h-16 px-5 border-b bg-white z-10">
                <div className="flex gap-4 border-b border-transparent -mb-px">
                  <p className="flex self-stretch items-center text-md font-medium tracking-tight border-b-2 border-blue-600 text-black -mb-px">
                    {asideMode === "create" ? "New Goal" : "Goal Details"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selected && (
                    <button onClick={() => handleDelete(selected)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                      <TbTrash size={16} />
                    </button>
                  )}
                  <button onClick={closeAside} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <TbX size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Title *</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Goal title"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Description</label>
                  <textarea
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>

                {asideMode === "view" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">Status</label>
                      <select
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ReviewGoal["status"] }))}
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Progress: {form.progress}%</label>
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
                  <label className="text-xs text-gray-400">Target Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.targetDate}
                    onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                  />
                </div>

                {isAdmin && cycles.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Review Cycle</label>
                    <select
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full rounded-lg bg-stone-900 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving…" : asideMode === "create" ? "Create Goal" : "Save Changes"}
                </button>
              </div>
            </>
          )}
      </aside>
    </div>
  );
}
