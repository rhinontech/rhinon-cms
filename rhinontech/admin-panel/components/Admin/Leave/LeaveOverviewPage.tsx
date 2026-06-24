"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  TbCalendarOff, TbPlus, TbX, TbLoader, TbUsers, TbClock, TbCheck, TbCalendarEvent
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";

/* ────────── shared types ────────── */
interface LeaveType {
  id: string;
  name: string;
  color: string;
  daysPerYear: number;
  isPaid: boolean;
}

interface LeaveBalance {
  leaveTypeId: string;
  name: string;
  color: string;
  isPaid: boolean;
  daysPerYear: number;
  allocated: number;
  used: number;
  remaining: number;
}

interface LeaveRequest {
  id: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeColor: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  managerNote?: string;
  createdAt: string;
}

/* Team balance shape returned by /leave/team/balance */
interface TeamLeaveBalance {
  leaveTypeId: string;
  name: string;
  color: string;
  totalAllocated: number;
  totalUsed: number;
  employeeCount: number;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Approved" ? "bg-green-100 text-green-700"
    : status === "Rejected" ? "bg-red-100 text-red-600"
    : "bg-yellow-100 text-yellow-700";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", cls)}>
      {status}
    </span>
  );
}

/* ══════════════════════════════════════
   ADMIN OVERVIEW
══════════════════════════════════════ */
function AdminLeaveOverview({ isSubNavExpanded }: { isSubNavExpanded: boolean }) {
  const [teamBalances, setTeamBalances] = useState<TeamLeaveBalance[]>([]);
  const [recentRequests, setRecentRequests] = useState<(LeaveRequest & { userName?: string })[]>([]);
  const [stats, setStats] = useState({ onLeaveToday: 0, pendingApprovals: 0, totalEmployees: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [teamBal, allReqs] = await Promise.all([
        apiFetch<TeamLeaveBalance[]>("/leave/team/balance"),
        apiFetch<(LeaveRequest & { userName?: string })[]>("/leave/requests?all=true"),
      ]);
      setTeamBalances(teamBal);
      const today = new Date().toISOString().split("T")[0];
      const onLeaveToday = allReqs.filter(r =>
        r.status === "Approved" && r.startDate <= today && r.endDate >= today
      ).length;
      const pendingApprovals = allReqs.filter(r => r.status === "Pending").length;
      setStats({ onLeaveToday, pendingApprovals, totalEmployees: 0 });
      setRecentRequests([...allReqs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statCards = [
    { label: "On Leave Today",    value: stats.onLeaveToday,    icon: <TbCalendarOff size={22} />, color: "bg-orange-50 text-orange-500" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: <TbClock       size={22} />, color: "bg-yellow-50 text-yellow-500" },
  ];

  return (
    <div className={cn("flex flex-col h-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
      <div className="sticky top-0 z-10 flex items-center gap-3 h-16 px-5 border-b bg-stone-50">
        <SubNavToggle />
        <h1 className="text-lg font-semibold tracking-tight">Leave Overview</h1>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center p-20 text-gray-400">
            <TbLoader size={32} className="animate-spin" />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4">
              {statCards.map(c => (
                <div key={c.label} className="rounded-xl border border-gray-100 bg-white p-5 flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl", c.color)}>{c.icon}</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                    <p className="text-xs text-gray-400">{c.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Leave type breakdown */}
            <div className="rounded-xl border border-gray-100 bg-white">
              <div className="px-5 py-4 border-b">
                <h2 className="text-sm font-semibold text-gray-900">Leave Usage by Type</h2>
                <p className="text-xs text-gray-400">Across all employees this year</p>
              </div>
              {teamBalances.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">No leave data yet.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {teamBalances.map(tb => {
                    const pct = tb.totalAllocated > 0 ? Math.round((tb.totalUsed / tb.totalAllocated) * 100) : 0;
                    return (
                      <div key={tb.leaveTypeId} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tb.color }} />
                            <p className="text-sm font-semibold text-gray-900">{tb.name}</p>
                          </div>
                          <p className="text-xs text-gray-400">{tb.totalUsed} / {tb.totalAllocated} days used</p>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: tb.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent leave requests */}
            <div className="rounded-xl border border-gray-100 bg-white">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Recent Leave Requests</h2>
                <TbCalendarEvent size={16} className="text-gray-300" />
              </div>
              {recentRequests.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">No leave requests yet.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentRequests.map(req => (
                    <div key={req.id} className="flex items-center px-5 py-3 gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {(req.userName ?? req.leaveTypeName).charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{req.userName ?? "—"}</p>
                        <p className="text-xs text-gray-400">
                          {req.leaveTypeName} ·{" "}
                          {new Date(req.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          {" – "}
                          {new Date(req.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{req.days}d</p>
                      <StatusBadge status={req.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   EMPLOYEE OVERVIEW
══════════════════════════════════════ */
function EmployeeLeaveOverview({ isSubNavExpanded }: { isSubNavExpanded: boolean }) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
  const [calculatedDays, setCalculatedDays] = useState(0);

  function calculateDays(start: string, end: string): number {
    if (!start || !end) return 0;
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    if (e < s) return 0;
    let days = 0;
    const cur = new Date(s);
    while (cur <= e) {
      if (cur.getDay() !== 0) days++;
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }

  const fetchData = useCallback(async () => {
    try {
      const [balData, reqData, typesData] = await Promise.all([
        apiFetch<LeaveBalance[]>("/leave/balance"),
        apiFetch<LeaveRequest[]>("/leave/requests"),
        apiFetch<LeaveType[]>("/leave/types"),
      ]);
      setBalances(balData);
      setRequests(reqData.slice(0, 5));
      setLeaveTypes(typesData);
      if (typesData.length > 0) setForm(f => ({ ...f, leaveTypeId: typesData[0].id }));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setCalculatedDays(calculateDays(form.startDate, form.endDate)); }, [form.startDate, form.endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/leave/requests", { method: "POST", body: JSON.stringify(form) });
      setShowModal(false);
      setForm(f => ({ ...f, startDate: "", endDate: "", reason: "" }));
      fetchData();
    } catch (err: any) {
      alert(err?.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b bg-stone-50">
        <div className="flex items-center gap-3">
          <SubNavToggle />
          <h1 className="text-lg font-semibold tracking-tight">Leave Overview</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <TbPlus size={16} />
          Apply for Leave
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center p-20 text-gray-400">
            <TbLoader size={32} className="animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {balances.length === 0 ? (
                <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
                  <TbCalendarOff size={48} className="text-gray-200" />
                  <p className="text-sm text-gray-400">No leave types configured yet.</p>
                </div>
              ) : (
                balances.map(bal => (
                  <div key={bal.leaveTypeId} className="rounded-xl border border-gray-100 bg-white p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: bal.color }} />
                      <p className="font-semibold text-gray-900 text-sm truncate">{bal.name}</p>
                      <span className={cn(
                        "ml-auto text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                        bal.isPaid ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                      )}>
                        {bal.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div><p className="text-xs text-gray-400">Allocated</p><p className="font-semibold text-gray-900">{bal.allocated}</p></div>
                      <div><p className="text-xs text-gray-400">Used</p><p className="font-semibold text-gray-900">{bal.used}</p></div>
                      <div><p className="text-xs text-gray-400">Remaining</p><p className="font-semibold text-gray-900">{bal.remaining}</p></div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${bal.allocated > 0 ? Math.min(100, (bal.used / bal.allocated) * 100) : 0}%`,
                          backgroundColor: bal.color,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[10px] text-gray-400">
                      {bal.allocated > 0 ? Math.round((bal.used / bal.allocated) * 100) : 0}% used
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-xl border border-gray-100 bg-white">
              <div className="px-5 py-4 border-b">
                <h2 className="text-sm font-semibold text-gray-900">Recent Requests</h2>
              </div>
              {requests.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">No leave requests yet.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {requests.map(req => (
                    <div key={req.id} className="flex items-center px-5 py-3 gap-4">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: req.leaveTypeColor || "#6B7280" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{req.leaveTypeName}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(req.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          {" – "}
                          {new Date(req.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{req.days}d</p>
                      <StatusBadge status={req.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Apply for Leave</h3>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Leave Request</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-stone-50 text-stone-400 hover:text-stone-900">
                <TbX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Leave Type</label>
                <select
                  value={form.leaveTypeId}
                  onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-stone-100 bg-stone-50 focus:ring-2 focus:ring-stone-900 outline-none"
                  required
                >
                  {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-4 py-2 text-sm rounded-xl border border-stone-100 bg-stone-50 focus:ring-2 focus:ring-stone-900 outline-none" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} min={form.startDate} className="w-full px-4 py-2 text-sm rounded-xl border border-stone-100 bg-stone-50 focus:ring-2 focus:ring-stone-900 outline-none" required />
                </div>
              </div>
              {calculatedDays > 0 && (
                <p className="text-xs text-stone-600 font-semibold">
                  {calculatedDays} working day{calculatedDays !== 1 ? "s" : ""} (Sundays excluded)
                </p>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Reason</label>
                <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Brief reason for your leave..." className="w-full px-4 py-2 text-sm rounded-xl border border-stone-100 bg-stone-50 focus:ring-2 focus:ring-stone-900 outline-none h-24 resize-none" required />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={submitting || calculatedDays === 0} className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all shadow-lg active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting && <TbLoader size={16} className="animate-spin" />}
                  Submit Request
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-stone-50 text-stone-400 rounded-xl font-bold text-sm hover:bg-stone-100 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   ROOT EXPORT — role-aware dispatcher
══════════════════════════════════════ */
export function LeaveOverviewPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const isAdmin = roleSlug === "superadmin" || roleSlug === "hr";

  return isAdmin
    ? <AdminLeaveOverview isSubNavExpanded={isSubNavExpanded} />
    : <EmployeeLeaveOverview isSubNavExpanded={isSubNavExpanded} />;
}
