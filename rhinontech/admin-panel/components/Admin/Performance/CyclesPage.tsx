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
  quarterly: "bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300",
  annual: "bg-purple-50 dark:bg-purple-400/10 text-purple-700 dark:text-purple-300",
  probation: "bg-orange-50 dark:bg-orange-400/10 text-orange-700 dark:text-orange-300",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-foreground/70",
  active: "bg-green-50 dark:bg-green-400/10 text-green-700 dark:text-green-300",
  closed: "bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300",
};

export function CyclesPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReviewCycle | null>(null);
  const [teamProgress, setTeamProgress] = useState<TeamProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [asideMode, setAsideMode] = useState<"view" | "create">("view");
  const [mobileDetail, setMobileDetail] = useState(false);
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
    setMobileDetail(true);
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
    setMobileDetail(true);
  }

  function closeAside() {
    setSelected(null);
    setAsideMode("view");
    setTeamProgress(null);
    setMobileDetail(false);
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
      <main className={cn("flex min-h-0 flex-col h-full w-full glass-panel overflow-hidden", isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl")}>
        <div className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2 sm:py-0 border-b border-border glass-header">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <SubNavToggle />
            <span className="text-base sm:text-lg font-semibold tracking-tight truncate">Review Cycles</span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0"
          >
            <TbPlus size={15} />
            <span>New Cycle</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-5">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <TbLoader2 className="animate-spin text-muted-foreground" size={28} />
            </div>
          ) : cycles.length === 0 ? (
            <div className="rounded-xl glass-card p-8 sm:p-10 text-center">
              <TbRefresh size={36} className="mx-auto text-muted-foreground/70 mb-3" />
              <p className="text-xs sm:text-sm text-muted-foreground">No review cycles yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {cycles.map((cycle) => (
                <button
                  key={cycle.id}
                  onClick={() => openCycle(cycle)}
                  className="w-full text-left rounded-xl glass-card p-3.5 sm:p-4 hover:border-blue-200 dark:hover:border-blue-400/25 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-xs sm:text-sm text-foreground truncate">{cycle.name}</p>
                        <span className={cn("text-[10px] sm:text-xs rounded-md px-1.5 sm:px-2 py-0.5 font-medium capitalize", TYPE_COLORS[cycle.type])}>
                          {cycle.type}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{cycle.startDate} — {cycle.endDate}</p>
                    </div>
                    <span className={cn("text-[10px] sm:text-xs rounded-md px-1.5 sm:px-2 py-0.5 font-medium capitalize shrink-0", STATUS_COLORS[cycle.status])}>
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
                  {asideMode === "create" ? "New Cycle" : "Cycle Details"}
                </p>
              </div>
              <button onClick={closeAside} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <TbX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 sm:space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Cycle Name *</label>
                <input
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Q1 2026 Review"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Type</label>
                <select
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ReviewCycle["type"] }))}
                >
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="probation">Probation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-border px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-border px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.startDate || !form.endDate}
                className="w-full rounded-lg bg-primary py-2.5 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : asideMode === "create" ? "Create Cycle" : "Save Changes"}
              </button>

              {/* Team progress for existing cycles */}
              {asideMode === "view" && selected && (
                <>
                  <div className="border-t pt-3 sm:pt-4 space-y-2.5 sm:space-y-3">
                    <p className="text-xs sm:text-sm font-semibold text-foreground/85">Team Progress</p>
                    {progressLoading ? (
                      <div className="flex items-center justify-center h-16">
                        <TbLoader2 className="animate-spin text-muted-foreground" size={20} />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border p-2.5 sm:p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">Self-Assessments</p>
                          <p className="text-xs sm:text-sm font-semibold text-foreground">{submittedSelf} / {selfSubmissions.length}</p>
                        </div>
                        {selfSubmissions.length > 0 && (
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
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
                      className="w-full rounded-lg border border-green-500 py-2 text-xs sm:text-sm font-medium text-green-600 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-400/10 transition-colors"
                    >
                      Activate Cycle
                    </button>
                  )}
                  {selected.status === "active" && (
                    <button
                      onClick={() => handleStatusChange(selected, "closed")}
                      className="w-full rounded-lg border border-border py-2 text-xs sm:text-sm font-medium text-foreground/70 hover:bg-muted/40 transition-colors"
                    >
                      Close Cycle
                    </button>
                  )}
                  {selected.status === "closed" && (
                    <div className="rounded-lg border border-blue-100 dark:border-blue-400/20 bg-blue-50 dark:bg-blue-400/10 p-2.5 sm:p-3 text-xs sm:text-sm text-blue-700 dark:text-blue-300 text-center font-medium">
                      This cycle is closed
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
