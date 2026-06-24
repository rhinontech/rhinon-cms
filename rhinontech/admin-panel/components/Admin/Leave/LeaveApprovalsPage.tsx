"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbCheck,
  TbX,
  TbChevronRight,
  TbLayoutSidebarRightFilled,
  TbCircleCheck,
  TbLoader,
  TbCalendarEvent,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";

interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  department: string;
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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function LeaveApprovalsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [managerNote, setManagerNote] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      const data = await apiFetch<LeaveRequest[]>("/leave/requests");
      const pending = data.filter(r => r.status === "Pending");
      setRequests(pending);
      if (pending.length > 0) { setSelected(pending[0]); setIsPanelOpen(true); }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (id: string, status: "Approved" | "Rejected") => {
    setProcessing(id);
    try {
      await apiFetch(`/leave/requests/${id}/action`, {
        method: "PUT",
        body: JSON.stringify({ status, managerNote }),
      });
      setRequests(prev => prev.filter(r => r.id !== id));
      setSelected(null);
      setIsPanelOpen(false);
      setManagerNote("");
    } catch (err: any) {
      alert(err?.message || "Action failed");
    } finally {
      setProcessing(null);
    }
  };

  const handleSelect = (req: LeaveRequest) => {
    setSelected(req);
    setIsPanelOpen(true);
    setManagerNote("");
  };

  return (
    <div className="flex min-h-0 gap-2 h-full overflow-hidden">
      <main className={cn(
        "flex min-h-0 flex-col h-full w-full overflow-hidden bg-stone-50",
        isSubNavExpanded ? "rounded-r-xl" : "rounded-xl"
      )}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b bg-stone-50">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <h1 className="text-lg font-semibold tracking-tight">Leave Approvals</h1>
          </div>
          {requests.length > 0 && (
            <span className="rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-0.5">
              {requests.length} pending
            </span>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <TbLoader size={32} className="animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <TbCircleCheck size={64} className="text-green-200" />
              <div>
                <p className="text-lg font-bold text-stone-900">All caught up!</p>
                <p className="text-sm text-stone-500">No pending leave requests to approve.</p>
              </div>
            </div>
          ) : (
            requests.map(req => (
              <div
                key={req.id}
                onClick={() => handleSelect(req)}
                className={cn(
                  "p-4 rounded-2xl border border-stone-100 transition-all cursor-pointer flex items-center justify-between group",
                  selected?.id === req.id ? "bg-stone-50 border-stone-200 ring-1 ring-stone-200" : "bg-white hover:bg-stone-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    <TbCalendarEvent size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">{req.userName}</h3>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      {req.leaveTypeName} · {req.days}d · {formatDate(req.startDate)}
                    </p>
                  </div>
                </div>
                <TbChevronRight className={cn(
                  "text-stone-200 group-hover:text-stone-900 group-hover:translate-x-1 transition-all",
                  selected?.id === req.id && "text-stone-900"
                )} />
              </div>
            ))
          )}
        </div>
      </main>

      {/* Aside Panel */}
      <aside className={cn(
        "flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out",
        isPanelOpen && selected ? "w-[42%]" : "w-0"
      )}>
        {selected && (
          <div className="flex h-full flex-col">
            <div className="sticky top-0 w-full flex items-center justify-between h-16 px-5 border-b bg-white z-10">
              <div className="flex items-center gap-4 self-stretch">
                <p className="flex self-stretch items-center text-md font-medium tracking-tight border-b-2 border-blue-600 text-black -mb-px">
                  Request Details
                </p>
              </div>
              <button onClick={() => setIsPanelOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <TbLayoutSidebarRightFilled size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xl">
                  {selected.userName?.charAt(0) ?? "?"}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 leading-tight">{selected.userName}</h2>
                  <p className="text-xs text-gray-400">{selected.department}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-1">Leave Type</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: selected.leaveTypeColor || "#6B7280" }}
                    />
                    <p className="font-semibold text-gray-900">{selected.leaveTypeName}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-1">Duration</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(selected.startDate)} – {formatDate(selected.endDate)}
                    <span className="ml-2 text-gray-400 font-normal">({selected.days} day{selected.days !== 1 ? "s" : ""})</span>
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-2">Reason</p>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">"{selected.reason}"</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-2">Applied On</p>
                  <p className="font-semibold text-gray-900">{formatDate(selected.createdAt)}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Manager Note (optional)</label>
                <textarea
                  value={managerNote}
                  onChange={e => setManagerNote(e.target.value)}
                  placeholder="Add a note for the employee..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-100 bg-stone-50 focus:ring-2 focus:ring-stone-900 outline-none h-20 resize-none"
                />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  onClick={() => handleAction(selected.id, "Approved")}
                  disabled={!!processing}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {processing === selected.id ? <TbLoader size={16} className="animate-spin" /> : <TbCheck size={16} />}
                  Approve Request
                </button>
                <button
                  onClick={() => handleAction(selected.id, "Rejected")}
                  disabled={!!processing}
                  className="w-full py-3 bg-white text-red-600 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <TbX size={16} />
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
