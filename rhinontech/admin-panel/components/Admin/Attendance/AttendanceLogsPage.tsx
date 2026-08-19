"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbCalendarStats,
  TbSearch,
  TbFilter,
  TbClock,
  TbAlertCircle,
  TbPlus,
  TbChevronRight,
  TbLayoutSidebarFilled,
  TbLayoutSidebarRightFilled,
  TbDownload,
  TbUser,
  TbX,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";

interface AttendanceLog {
  id: string;
  userId: string;
  userName: string;
  date: string;
  status: string;
  clockIn: string | null;
  clockOut: string | null;
  durationMinutes: number;
  overtimeMinutes: number;
  penalties: { reason: string; amount: number }[];
  department: string;
}

export function AttendanceLogsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [mobileDetail, setMobileDetail] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await apiFetch<AttendanceLog[]>("/attendance/logs");
      setLogs(data);
      if (data.length > 0) setSelectedLog(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter(l =>
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden shadow-sm border-r", isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl")}>
        <div className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between border-b border-black/5 glass-header px-4 sm:px-5 py-2 sm:py-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <SubNavToggle />
            <span className="text-base sm:text-lg font-semibold tracking-tight truncate">Attendance Logs</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-gray-300 px-2.5 sm:px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-100 transition-all">
              <TbDownload size={15} /> <span className="hidden sm:inline">Export</span>
            </button>
            {!isPreviewExpanded && (
              <button
                onClick={() => { setIsPreviewExpanded(true); setMobileDetail(true); }}
                className="rounded-lg p-1.5 sm:p-2 text-gray-600 hover:bg-stone-100 transition-all"
                title="Open details"
              >
                <TbLayoutSidebarFilled size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 bg-white">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                placeholder="Search employee or department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl border border-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
              />
            </div>
            <button className="p-2 sm:p-2.5 rounded-xl border border-stone-100 bg-stone-50/50 text-stone-600 hover:bg-stone-100 shrink-0">
              <TbFilter size={17} />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-200 shadow-xs">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_40px] bg-stone-50/50 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b">
                <span>Employee</span>
                <span>In/Out</span>
                <span>Duration</span>
                <span>Overtime</span>
                <span></span>
              </div>
              {loading ? (
                <div className="p-20 text-center"><TbCalendarStats size={48} className="mx-auto mb-4 text-stone-200 animate-pulse" /></div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-20 text-center text-sm text-stone-400 italic">No logs found matching your search.</div>
              ) : filteredLogs.map(log => (
                <div
                  key={log.id}
                  onClick={() => { setSelectedLog(log); setIsPreviewExpanded(true); setMobileDetail(true); }}
                  className={cn(
                    "grid grid-cols-[1.5fr_1fr_1fr_1fr_40px] items-center px-4 py-3 text-sm cursor-pointer border-b last:border-0 hover:bg-stone-50 transition-colors group",
                    selectedLog?.id === log.id && "bg-stone-50 border-l-4 border-l-stone-900"
                  )}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-stone-900 truncate">{log.userName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{log.department}</p>
                  </div>
                  <div className="flex flex-col text-xs font-medium text-stone-600">
                    <span>{log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</span>
                    <span>{log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">{Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m</span>
                  </div>
                  <div>
                    {log.overtimeMinutes > 0 ? (
                      <span className="text-green-600 font-bold">+{log.overtimeMinutes}m</span>
                    ) : (
                      <span className="text-stone-300">—</span>
                    )}
                  </div>
                  <div className="text-right">
                    <TbChevronRight className={cn("text-stone-200 transition-all", selectedLog?.id === log.id && "text-stone-900 translate-x-1")} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Aside Panel */}
      <aside className={cn(
        "min-h-0 flex-col bg-white overflow-hidden transition-all duration-200 ease-in-out",
        mobileDetail ? "fixed inset-0 z-50 flex w-full max-w-full" : "hidden",
        "lg:static lg:z-auto lg:flex lg:h-full lg:rounded-xl",
        isPreviewExpanded && selectedLog ? "lg:w-[42%] lg:ml-1.5" : "lg:w-0"
      )}>
        {selectedLog && (
          <div className="flex h-full flex-col">
            <div className="sticky top-0 w-full flex items-center justify-between min-h-16 px-4 sm:px-5 py-2 sm:py-0 border-b bg-white z-10 shrink-0">
              <div className="flex items-center gap-4 self-stretch">
                <p className="flex self-stretch items-center text-sm sm:text-md font-medium tracking-tight border-b-2 border-blue-600 text-black -mb-px">Shift Details</p>
              </div>
              <button
                onClick={() => { setIsPreviewExpanded(false); setMobileDetail(false); }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-stone-100 transition-colors"
                title="Close"
              >
                <TbX size={18} className="lg:hidden" />
                <TbLayoutSidebarRightFilled size={18} className="hidden lg:block" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-5 space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-lg sm:text-xl shrink-0">
                  {selectedLog.userName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight truncate">{selectedLog.userName}</h2>
                  <p className="text-xs text-gray-400 truncate">{selectedLog.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="rounded-lg border border-gray-100 p-2.5 sm:p-3">
                  <p className="text-xs text-gray-400 mb-1">Clock In</p>
                  <p className="font-semibold text-sm sm:text-base text-gray-900">{selectedLog.clockIn ? new Date(selectedLog.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-2.5 sm:p-3">
                  <p className="text-xs text-gray-400 mb-1">Clock Out</p>
                  <p className="font-semibold text-sm sm:text-base text-gray-900">{selectedLog.clockOut ? new Date(selectedLog.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</p>
                </div>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-gray-100 p-2.5 sm:p-3">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><TbClock size={18} /></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-900">Total Duration</span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">{Math.floor(selectedLog.durationMinutes / 60)}h {selectedLog.durationMinutes % 60}m</span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-100 p-2.5 sm:p-3">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-green-50 text-green-600 rounded-lg shrink-0"><TbPlus size={18} /></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-900">Overtime</span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-green-600">{selectedLog.overtimeMinutes > 0 ? `+${selectedLog.overtimeMinutes}m` : "None"}</span>
                </div>

                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3 text-red-600">
                    <TbAlertCircle size={16} />
                    <span className="text-xs text-gray-400">Penalties & Deductions</span>
                  </div>
                  {selectedLog.penalties.length > 0 ? (
                    <div className="space-y-1.5 sm:space-y-2">
                      {selectedLog.penalties.map((p, i) => (
                        <div key={i} className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="font-medium text-red-800">{p.reason}</span>
                          <span className="font-semibold text-red-900">-${p.amount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-red-400 font-medium italic">No penalties for this shift.</p>
                  )}
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t">
                <button className="w-full py-2.5 sm:py-3 bg-gray-900 text-white rounded-xl font-semibold text-xs sm:text-sm hover:bg-gray-800 transition-colors shadow-lg active:scale-95">
                  Regularize Record
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
