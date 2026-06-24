"use client";

import { useCallback, useEffect, useState } from "react";
import { TbChevronLeft, TbChevronRight, TbCalendarStats, TbLoader } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";

interface CalendarLeave {
  id: string;
  userId: string;
  userName: string;
  department: string;
  leaveTypeName: string;
  leaveTypeColor: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function LeaveCalendarPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [leaves, setLeaves] = useState<CalendarLeave[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<CalendarLeave[]>(`/leave/calendar?month=${month}&year=${year}`);
      setLeaves(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  // Build grid cells: leading blanks + day numbers
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function leavesOnDay(day: number): CalendarLeave[] {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return leaves.filter(l => l.startDate <= dateStr && l.endDate >= dateStr);
  }

  const todayStr = now.toISOString().split("T")[0];

  return (
    <div className={cn("flex flex-col h-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b bg-stone-50">
        <div className="flex items-center gap-3">
          <SubNavToggle />
          <h1 className="text-lg font-semibold tracking-tight">Team Leave Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            <TbChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-900 min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            <TbChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <TbLoader size={32} className="animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
              {DAYS_OF_WEEK.map(d => (
                <div key={d} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={`blank-${idx}`} className="border-b border-r border-gray-50 min-h-[120px] bg-gray-50/50" />;
                }

                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const dayLeaves = leavesOnDay(day);
                const colIndex = (firstDay + day - 1) % 7;
                const isLastCol = colIndex === 6;
                const rowEnd = Math.floor((firstDay + day - 1) / 7) === Math.floor((cells.length - 1) / 7);

                return (
                  <div
                    key={day}
                    className={cn(
                      "min-h-[120px] p-2 border-b border-r border-gray-100 flex flex-col gap-1",
                      isLastCol && "border-r-0",
                      !rowEnd && "border-b",
                    )}
                  >
                    <div className={cn(
                      "self-start h-7 w-7 flex items-center justify-center rounded-full text-sm font-semibold",
                      isToday ? "bg-gray-900 text-white" : "text-gray-700"
                    )}>
                      {day}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {dayLeaves.slice(0, 3).map(leave => (
                        <div
                          key={leave.id}
                          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white truncate"
                          style={{ backgroundColor: leave.leaveTypeColor || "#6B7280" }}
                          title={`${leave.userName} - ${leave.leaveTypeName}`}
                        >
                          <span className="truncate">{leave.userName}</span>
                        </div>
                      ))}
                      {dayLeaves.length > 3 && (
                        <p className="text-[10px] text-gray-400 font-semibold pl-1">+{dayLeaves.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        {leaves.length === 0 && !loading && (
          <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
            <TbCalendarStats size={48} className="text-gray-200" />
            <p className="text-sm text-gray-400">No approved leaves for {monthLabel}.</p>
          </div>
        )}

        {leaves.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {Array.from(new Map(leaves.map(l => [l.leaveTypeName, l.leaveTypeColor])).entries()).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-500">{name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
