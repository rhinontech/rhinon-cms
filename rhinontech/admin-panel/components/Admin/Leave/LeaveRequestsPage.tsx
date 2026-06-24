"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbCalendarEvent,
  TbLayoutSidebarRightFilled,
  TbLoader,
  TbTrash,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";

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

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Approved"
      ? "bg-green-100 text-green-700"
      : status === "Rejected"
      ? "bg-red-100 text-red-600"
      : "bg-yellow-100 text-yellow-700";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", cls)}>
      {status}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function LeaveRequestsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await apiFetch<LeaveRequest[]>("/leave/requests");
      setRequests(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleSelect = (req: LeaveRequest) => {
    setSelected(req);
    setIsPanelOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this leave request?")) return;
    setDeleting(id);
    try {
      await apiFetch(`/leave/requests/${id}`, { method: "DELETE" });
      setRequests(prev => prev.filter(r => r.id !== id));
      if (selected?.id === id) { setSelected(null); setIsPanelOpen(false); }
    } catch (err: any) {
      alert(err?.message || "Failed to delete request");
    } finally {
      setDeleting(null);
    }
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
            <h1 className="text-lg font-semibold tracking-tight">My Leave Requests</h1>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <TbLoader size={32} className="animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <TbCalendarEvent size={56} className="text-gray-200" />
              <div>
                <p className="font-semibold text-gray-700">No leave requests yet</p>
                <p className="text-sm text-gray-400 mt-1">Apply for leave from the Overview page.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Days</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Applied On</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map(req => (
                    <tr
                      key={req.id}
                      onClick={() => handleSelect(req)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-stone-50",
                        selected?.id === req.id && "bg-stone-50"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: req.leaveTypeColor || "#6B7280" }}
                          />
                          <span className="font-semibold text-gray-900">{req.leaveTypeName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(req.startDate)} – {formatDate(req.endDate)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{req.days}d</td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(req.createdAt)}</td>
                      <td className="px-4 py-3">
                        {req.status === "Pending" && (
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(req.id); }}
                            disabled={deleting === req.id}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            {deleting === req.id ? <TbLoader size={16} className="animate-spin" /> : <TbTrash size={16} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  Leave Details
                </p>
              </div>
              <button onClick={() => setIsPanelOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <TbLayoutSidebarRightFilled size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selected.leaveTypeColor || "#6B7280" }}
                />
                <h2 className="text-lg font-semibold text-gray-900">{selected.leaveTypeName}</h2>
                <StatusBadge status={selected.status} />
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-1">Start Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selected.startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-1">End Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selected.endDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-1">Duration</p>
                  <p className="font-semibold text-gray-900">{selected.days} working day{selected.days !== 1 ? "s" : ""}</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-2">Reason</p>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">"{selected.reason}"</p>
                </div>
                {selected.managerNote && (
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-xs text-gray-400 mb-2">Manager Note</p>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">"{selected.managerNote}"</p>
                  </div>
                )}
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-1">Applied On</p>
                  <p className="font-semibold text-gray-900">{formatDate(selected.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
