"use client";

import { useCallback, useEffect, useState } from "react";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { cn } from "@/lib/utils";
import { useSideNav } from "@/context/SideNavContext";
import { apiFetch } from "@/lib/api";
import { TbPlus, TbX, TbRefresh, TbLoader2 } from "react-icons/tb";

interface ReviewCycle {
  id: string;
  name: string;
  type: "quarterly" | "annual" | "probation";
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "closed";
  creator?: { id: string; fullName: string };
}

interface TeamProgress {
  cycle: ReviewCycle;
  submissions: Array<{
    id: string;
    type: "self" | "manager";
    status: "pending" | "submitted";
    reviewee?: { id: string; fullName: string; department: string };
  }>;
}

const TYPE_COLORS: Record<string, string> = {
  quarterly: "bg-blue-50 text-blue-700",
  annual: "bg-purple-50 text-purple-700",
  probation: "bg-orange-50 text-orange-700",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-green-50 text-green-700",
  closed: "bg-blue-50 text-blue-700",
};

export function CyclesPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReviewCycle | null>(null);
  const [teamProgress, setTeamProgress] = useState<TeamProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [asideMode, setAsideMode] = useState<"view" | "create">("view");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    type: "quarterly" as ReviewCycle["type"],
    startDate: "",
    endDate: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ReviewCycle[]>("/performance/cycles");
      setCycles(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openCycle(cycle: ReviewCycle) {
    setSelected(cycle);
    setForm({ name: cycle.name, type: cycle.type, startDate: cycle.startDate, endDate: cycle.endDate });
    setAsideMode("view");
    setProgressLoading(true);
    try {
      const data = await apiFetch<TeamProgress>(`/performance/cycles/${cycle.id}/team`);
      setTeamProgress(data);
    } catch {
      setTeamProgress(null);
    } finally {
      setProgressLoading(false);
    }
  }

  function openCreate() {
    setSelected(null);
    setTeamProgress(null);
    setForm({ name: "", type: "quarterly", startDate: "", endDate: "" });
    setAsideMode("create");
  }

  function closeAside() {
    setSelected(null);
    setAsideMode("view");
    setTeamProgress(null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (asideMode === "create") {
        await apiFetch("/performance/cycles", {
          method: "POST",
          body: JSON.stringify(form),
        });
      } else if (selected) {
        await apiFetch(`/performance/cycles/${selected.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
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

  async function handleStatusChange(cycle: ReviewCycle, newStatus: "active" | "closed") {
    try {
      await apiFetch(`/performance/cycles/${cycle.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      await load();
      if (selected?.id === cycle.id) {
        setSelected({ ...cycle, status: newStatus });
      }
    } catch {
      // silent
    }
  }

  const selfSubmissions = teamProgress?.submissions.filter((s) => s.type === "self") ?? [];
  const submittedSelf = selfSubmissions.filter((s) => s.status === "submitted").length;

  const asideOpen = asideMode === "create" || selected !== null;

  return (
    <div className="flex min-h-0 gap-2 h-full overflow-hidden">
      <main className={cn("flex min-h-0 flex-col h-full w-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b bg-stone-50">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <span className="text-lg font-semibold tracking-tight">Review Cycles</span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 transition-colors"
          >
            <TbPlus size={16} />
            New Cycle
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <TbLoader2 className="animate-spin text-gray-400" size={28} />
            </div>
          ) : cycles.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-10 text-center">
              <TbRefresh size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No review cycles yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cycles.map((cycle) => (
                <button
                  key={cycle.id}
                  onClick={() => openCycle(cycle)}
                  className="w-full text-left rounded-xl border border-gray-100 bg-white p-4 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-900">{cycle.name}</p>
                        <span className={cn("text-xs rounded-md px-2 py-0.5 font-medium capitalize", TYPE_COLORS[cycle.type])}>
                          {cycle.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{cycle.startDate} — {cycle.endDate}</p>
                    </div>
                    <span className={cn("text-xs rounded-md px-2 py-0.5 font-medium capitalize", STATUS_COLORS[cycle.status])}>
                      {cycle.status}
                    </span>
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
                    {asideMode === "create" ? "New Cycle" : "Cycle Details"}
                  </p>
                </div>
                <button onClick={closeAside} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <TbX size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Cycle Name *</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Q1 2026 Review"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Type</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ReviewCycle["type"] }))}
                  >
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                    <option value="probation">Probation</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Start Date</label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">End Date</label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.endDate}
                      onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || !form.name || !form.startDate || !form.endDate}
                  className="w-full rounded-lg bg-stone-900 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving…" : asideMode === "create" ? "Create Cycle" : "Save Changes"}
                </button>

                {/* Team progress for existing cycles */}
                {asideMode === "view" && selected && (
                  <>
                    <div className="border-t pt-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Team Progress</p>
                      {progressLoading ? (
                        <div className="flex items-center justify-center h-16">
                          <TbLoader2 className="animate-spin text-gray-400" size={20} />
                        </div>
                      ) : (
                        <div className="rounded-lg border border-gray-100 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">Self-Assessments</p>
                            <p className="text-sm font-semibold text-gray-900">{submittedSelf} / {selfSubmissions.length}</p>
                          </div>
                          {selfSubmissions.length > 0 && (
                            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${(submittedSelf / selfSubmissions.length) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status actions */}
                    {selected.status === "draft" && (
                      <button
                        onClick={() => handleStatusChange(selected, "active")}
                        className="w-full rounded-lg border border-green-500 py-2 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
                      >
                        Activate Cycle
                      </button>
                    )}
                    {selected.status === "active" && (
                      <button
                        onClick={() => handleStatusChange(selected, "closed")}
                        className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Close Cycle
                      </button>
                    )}
                    {selected.status === "closed" && (
                      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700 text-center font-medium">
                        This cycle is closed
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
      </aside>
    </div>
  );
}
