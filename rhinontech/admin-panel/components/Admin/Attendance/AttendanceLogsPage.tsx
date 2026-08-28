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
        <div className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between border-b border-border glass-header px-4 sm:px-5 py-2 sm:py-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <SubNavToggle />
            <span className="text-base sm:text-lg font-semibold tracking-tight truncate">Attendance Logs</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-border px-2.5 sm:px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground/70 hover:bg-muted transition-all">
              <TbDownload size={15} /> <span className="hidden sm:inline">Export</span>
            </button>
            {!isPreviewExpanded && (
              <button
                onClick={() => { setIsPreviewExpanded(true); setMobileDetail(true); }}
                className="rounded-lg p-1.5 sm:p-2 text-foreground/70 hover:bg-muted transition-all"
                title="Open details"
              >
                <TbLayoutSidebarFilled size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 bg-card">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search employee or department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-ring bg-muted/40"
              />
            </div>
            <button className="p-2 sm:p-2.5 rounded-xl border border-border bg-muted/40 text-foreground/70 hover:bg-muted shrink-0">
              <TbFilter size={17} />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border shadow-xs">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_40px] bg-muted/40 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b">
                <span>Employee</span>
                <span>In/Out</span>
                <span>Duration</span>
                <span>Overtime</span>
                <span></span>
              </div>
              {loading ? (
                <div className="p-20 text-center"><TbCalendarStats size={48} className="mx-auto mb-4 text-muted-foreground/50 animate-pulse" /></div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-20 text-center text-sm text-muted-foreground italic">No logs found matching your search.</div>
              ) : filteredLogs.map(log => (
                <div
                  key={log.id}
                  onClick={() => { setSelectedLog(log); setIsPreviewExpanded(true); setMobileDetail(true); }}
                  className={cn(
                    "grid grid-cols-[1.5fr_1fr_1fr_1fr_40px] items-center px-4 py-3 text-sm cursor-pointer border-b last:border-0 hover:bg-muted/40 transition-colors group",
                    selectedLog?.id === log.id && "bg-muted/40 border-l-4 border-l-stone-900"
                  )}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-foreground truncate">{log.userName}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">{log.department}</p>
                  </div>
                  <div className="flex flex-col text-xs font-medium text-foreground/70">
                    <span>{log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</span>
                    <span>{log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-foreground">{Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m</span>
                  </div>
                  <div>
                    {log.overtimeMinutes > 0 ? (
                      <span className="text-green-600 dark:text-green-300 font-bold">+{log.overtimeMinutes}m</span>
                    ) : (
                      <span className="text-muted-foreground/70">—</span>
                    )}
                  </div>
                  <div className="text-right">
                    <TbChevronRight className={cn("text-muted-foreground/50 transition-all", selectedLog?.id === log.id && "text-foreground translate-x-1")} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Aside Panel */}
      <aside className={cn(
        "min-h-0 flex-col bg-card overflow-hidden transition-all duration-200 ease-in-out",
        mobileDetail ? "fixed inset-0 z-50 flex w-full max-w-full" : "hidden",
        "lg:static lg:z-auto lg:flex lg:h-full lg:rounded-xl",
        isPreviewExpanded && selectedLog ? "lg:w-[42%] lg:ml-1.5" : "lg:w-0"
      )}>
        {selectedLog && (
          <div className="flex h-full flex-col">
            <div className="sticky top-0 w-full flex items-center justify-between min-h-16 px-4 sm:px-5 py-2 sm:py-0 border-b bg-card z-10 shrink-0">
              <div className="flex items-center gap-4 self-stretch">
                <p className="flex self-stretch items-center text-sm sm:text-md font-medium tracking-tight border-b-2 border-blue-600 text-foreground -mb-px">Shift Details</p>
              </div>
              <button
                onClick={() => { setIsPreviewExpanded(false); setMobileDetail(false); }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Close"
              >
                <TbX size={18} className="lg:hidden" />
                <TbLayoutSidebarRightFilled size={18} className="hidden lg:block" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-5 space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg sm:text-xl shrink-0">
                  {selectedLog.userName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground leading-tight truncate">{selectedLog.userName}</h2>
                  <p className="text-xs text-muted-foreground truncate">{selectedLog.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="rounded-lg border border-border p-2.5 sm:p-3">
                  <p className="text-xs text-muted-foreground mb-1">Clock In</p>
                  <p className="font-semibold text-sm sm:text-base text-foreground">{selectedLog.clockIn ? new Date(selectedLog.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</p>
                </div>
                <div className="rounded-lg border border-border p-2.5 sm:p-3">
                  <p className="text-xs text-muted-foreground mb-1">Clock Out</p>
                  <p className="font-semibold text-sm sm:text-base text-foreground">{selectedLog.clockOut ? new Date(selectedLog.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</p>
                </div>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-2.5 sm:p-3">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300 rounded-lg shrink-0"><TbClock size={18} /></div>
                    <span className="text-xs sm:text-sm font-medium text-foreground">Total Duration</span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{Math.floor(selectedLog.durationMinutes / 60)}h {selectedLog.durationMinutes % 60}m</span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-2.5 sm:p-3">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-green-50 dark:bg-green-400/10 text-green-600 dark:text-green-300 rounded-lg shrink-0"><TbPlus size={18} /></div>
                    <span className="text-xs sm:text-sm font-medium text-foreground">Overtime</span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-300">{selectedLog.overtimeMinutes > 0 ? `+${selectedLog.overtimeMinutes}m` : "None"}</span>
                </div>

                <div className="p-3 bg-red-50 dark:bg-red-400/10 border border-red-100 dark:border-red-400/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3 text-red-600 dark:text-red-300">
                    <TbAlertCircle size={16} />
                    <span className="text-xs text-muted-foreground">Penalties & Deductions</span>
                  </div>
                  {selectedLog.penalties.length > 0 ? (
                    <div className="space-y-1.5 sm:space-y-2">
                      {selectedLog.penalties.map((p, i) => (
                        <div key={i} className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="font-medium text-red-800 dark:text-red-200">{p.reason}</span>
                          <span className="font-semibold text-red-900 dark:text-red-200">-${p.amount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-red-400 font-medium italic">No penalties for this shift.</p>
                  )}
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t">
                <button className="w-full py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-xs sm:text-sm hover:bg-primary/90 transition-colors shadow-lg active:scale-95">
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
