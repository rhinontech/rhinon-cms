"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbCalendarEvent,
  TbLayoutSidebarRightFilled,
  TbLoader,
  TbTrash,
  TbX,
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
      ? "bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300"
      : status === "Rejected"
      ? "bg-red-100 dark:bg-red-400/15 text-red-600 dark:text-red-300"
      : "bg-yellow-100 dark:bg-yellow-400/15 text-yellow-700 dark:text-yellow-300";
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
  const [mobileDetail, setMobileDetail] = useState(false);
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
    setMobileDetail(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this leave request?")) return;
    setDeleting(id);
    try {
      await apiFetch(`/leave/requests/${id}`, { method: "DELETE" });
      setRequests(prev => prev.filter(r => r.id !== id));
      if (selected?.id === id) { setSelected(null); setIsPanelOpen(false); setMobileDetail(false); }
    } catch (err: any) {
      alert(err?.message || "Failed to delete request");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex min-h-0 gap-2 h-full overflow-hidden">
      <main className={cn(
        "flex min-h-0 flex-col h-full w-full overflow-hidden glass-panel",
        isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl"
      )}>
        <div className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2 sm:py-0 border-b border-border glass-header">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <SubNavToggle />
            <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">My Leave Requests</h1>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <TbLoader size={32} className="animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <TbCalendarEvent size={56} className="text-muted-foreground/50" />
              <div>
                <p className="font-semibold text-foreground/85">No leave requests yet</p>
                <p className="text-sm text-muted-foreground mt-1">Apply for leave from the Overview page.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl glass-card overflow-x-auto shadow-xs">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Days</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Applied On</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map(req => (
                    <tr
                      key={req.id}
                      onClick={() => handleSelect(req)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/40",
                        selected?.id === req.id && "bg-muted/40"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: req.leaveTypeColor || "#6B7280" }}
                          />
                          <span className="font-semibold text-foreground">{req.leaveTypeName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground/70">
                        {formatDate(req.startDate)} – {formatDate(req.endDate)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{req.days}d</td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(req.createdAt)}</td>
                      <td className="px-4 py-3">
                        {req.status === "Pending" && (
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(req.id); }}
                            disabled={deleting === req.id}
                            className="p-1.5 rounded-lg text-muted-foreground/70 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors"
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
        "min-h-0 flex-col bg-card overflow-hidden transition-all duration-200 ease-in-out",
        mobileDetail ? "fixed inset-0 z-50 flex w-full max-w-full" : "hidden",
        "lg:static lg:z-auto lg:flex lg:h-full lg:rounded-xl",
        isPanelOpen && selected ? "lg:w-[42%]" : "lg:w-0"
      )}>
        {selected && (
          <div className="flex h-full flex-col">
            <div className="sticky top-0 w-full flex items-center justify-between min-h-16 px-4 sm:px-5 py-2 sm:py-0 border-b bg-card z-10 shrink-0">
              <div className="flex items-center gap-4 self-stretch">
                <p className="flex self-stretch items-center text-sm sm:text-md font-medium tracking-tight border-b-2 border-blue-600 text-foreground -mb-px">
                  Leave Details
                </p>
              </div>
              <button
                onClick={() => { setIsPanelOpen(false); setMobileDetail(false); }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Close"
              >
                <TbX size={18} className="lg:hidden" />
                <TbLayoutSidebarRightFilled size={18} className="hidden lg:block" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-5 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selected.leaveTypeColor || "#6B7280" }}
                />
                <h2 className="text-base sm:text-lg font-semibold text-foreground">{selected.leaveTypeName}</h2>
                <StatusBadge status={selected.status} />
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                <div className="rounded-lg border border-border p-2.5 sm:p-3">
                  <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                  <p className="font-semibold text-sm sm:text-base text-foreground">
                    {new Date(selected.startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-2.5 sm:p-3">
                  <p className="text-xs text-muted-foreground mb-1">End Date</p>
                  <p className="font-semibold text-sm sm:text-base text-foreground">
                    {new Date(selected.endDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-2.5 sm:p-3">
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="font-semibold text-sm sm:text-base text-foreground">{selected.days} working day{selected.days !== 1 ? "s" : ""}</p>
                </div>
                <div className="rounded-lg border border-border p-2.5 sm:p-3">
                  <p className="text-xs text-muted-foreground mb-1 sm:mb-2">Reason</p>
                  <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed font-medium">"{selected.reason}"</p>
                </div>
                {selected.managerNote && (
                  <div className="rounded-lg border border-border p-2.5 sm:p-3">
                    <p className="text-xs text-muted-foreground mb-1 sm:mb-2">Manager Note</p>
                    <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed font-medium">"{selected.managerNote}"</p>
                  </div>
                )}
                <div className="rounded-lg border border-border p-2.5 sm:p-3">
                  <p className="text-xs text-muted-foreground mb-1">Applied On</p>
                  <p className="font-semibold text-sm sm:text-base text-foreground">{formatDate(selected.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
