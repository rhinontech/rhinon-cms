"use client";

import { useCallback, useEffect, useState } from "react";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import {
  TbChevronLeft,
  TbChevronRight,
  TbDownload,
  TbStopwatch,
  TbX,
  TbUsers,
  TbUserCheck,
  TbUserX,
  TbActivity,
  TbCoffee,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { useSideNav } from "@/context/SideNavContext";
import { apiFetch } from "@/lib/api";
import { usePermissions } from "@/context/PermissionsContext";

// ─── Shared helpers ────────────────────────────────────────────────────────────

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDuration(minutes: number): string {
  if (!minutes) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function toHourFraction(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

interface TimelineSegment { startFrac: number; endFrac: number; type: "work" | "break"; startIso: string; endIso: string; }

function timelineSegments(
  clockIn: string | null,
  clockOut: string | null,
  breaks: { start: string; end: string | null }[] | undefined,
  now: Date
): TimelineSegment[] {
  if (!clockIn) return [];
  const endIso = clockOut ?? now.toISOString();
  const sortedBreaks = [...(breaks || [])]
    .filter((b) => b.start)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const segments: TimelineSegment[] = [];
  let cursor = clockIn;
  for (const b of sortedBreaks) {
    if (new Date(b.start).getTime() >= new Date(endIso).getTime()) break;
    segments.push({ startFrac: toHourFraction(cursor)!, endFrac: toHourFraction(b.start)!, type: "work", startIso: cursor, endIso: b.start });
    const breakEnd = b.end ?? endIso;
    segments.push({ startFrac: toHourFraction(b.start)!, endFrac: toHourFraction(breakEnd)!, type: "break", startIso: b.start, endIso: breakEnd });
    cursor = breakEnd;
  }
  segments.push({ startFrac: toHourFraction(cursor)!, endFrac: toHourFraction(endIso)!, type: "work", startIso: cursor, endIso });
  return segments.filter((s) => s.endFrac > s.startFrac);
}

function segmentTooltip(seg: TimelineSegment): string {
  const label = seg.type === "break" ? "Break" : "Present";
  return `${label}: ${formatTime(seg.startIso)} – ${formatTime(seg.endIso)}`;
}

function ordinalLabel(iso: string, isToday: boolean): string {
  if (isToday) return "Today";
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "long" });
  const year = d.getFullYear();
  const suffix =
    day === 1 || day === 21 || day === 31 ? "st" :
    day === 2 || day === 22 ? "nd" :
    day === 3 || day === 23 ? "rd" : "th";
  return `${day}${suffix} ${month} ${year}`;
}

function AttendanceStatus({ value }: { value: string }) {
  const color =
    value === "P" ? "border-green-600 bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300" :
    "border-red-500 bg-red-50 dark:bg-red-400/10 text-red-600 dark:text-red-300";
  return (
    <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold", color)}>
      {value}
    </span>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttendanceDay {
  id: string | null;
  userId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breaks?: { start: string; end: string | null }[];
  status: "present" | "absent" | "weekend" | "holiday" | "leave";
  note: string | null;
  durationMinutes: number;
}

interface TodayStats {
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breaks?: { start: string; end: string | null }[];
  status: string;
  durationMinutes: number;
}

interface TeamEmployee {
  userId: string;
  fullName: string;
  department: string;
  attendance: {
    status: string;
    clockIn: string | null;
    clockOut: string | null;
    durationMinutes: number;
    onBreak?: boolean;
  };
}

interface TeamToday {
  date: string;
  summary: { total: number; present: number; absent: number; active: number; onBreak: number };
  employees: TeamEmployee[];
}

interface TeamMonthEmployee {
  userId: string;
  fullName: string;
  department: string;
  presentDays: number;
  totalMinutes: number;
  attendance: AttendanceDay[];
}

interface TeamMonth {
  month: number;
  year: number;
  days: string[];
  employees: TeamMonthEmployee[];
}

// ─── SuperAdmin team view ──────────────────────────────────────────────────────

function TeamAttendancePage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [teamToday, setTeamToday] = useState<TeamToday | null>(null);
  const [teamMonth, setTeamMonth] = useState<TeamMonth | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const hourColumns = Array.from({ length: 24 }, (_, i) => i);
  const todayKey = now.toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayData, monthData] = await Promise.all([
        apiFetch<TeamToday>("/attendance/team/today"),
        apiFetch<TeamMonth>(`/attendance/team?month=${month}&year=${year}`),
      ]);
      setTeamToday(todayData);
      setTeamMonth(monthData);
      if (monthData.employees.length > 0 && !selectedEmployee) {
        setSelectedEmployee(monthData.employees[0].userId);
      }
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

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
  const selected = teamMonth?.employees.find(e => e.userId === selectedEmployee);

  return (
    <div className={cn("flex flex-col h-full glass-panel overflow-hidden", isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl")}>
      <div className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border glass-header px-4 sm:px-5">
        <SubNavToggle />
        <span className="text-base sm:text-lg font-semibold tracking-tight truncate">Team Attendance</span>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1400px] p-3 sm:p-6 space-y-4 sm:space-y-6">

          {/* Today's summary cards */}
          {teamToday && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
              {[
                { label: "Total Employees", value: teamToday.summary.total, icon: <TbUsers size={20} />, color: "text-foreground/70 bg-muted" },
                { label: "Present Today", value: teamToday.summary.present, icon: <TbUserCheck size={20} />, color: "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-400/15" },
                { label: "Absent Today", value: teamToday.summary.absent, icon: <TbUserX size={20} />, color: "text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-400/15" },
                { label: "Currently Active", value: teamToday.summary.active, icon: <TbActivity size={20} />, color: "text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-400/15" },
                { label: "On Break", value: teamToday.summary.onBreak, icon: <TbCoffee size={20} />, color: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-400/15" },
              ].map(card => (
                <div key={card.label} className="rounded-xl glass-card p-3 sm:p-5 flex items-center gap-2.5 sm:gap-4 min-w-0">
                  <div className={cn("p-2 sm:p-3 rounded-xl shrink-0", card.color)}>{card.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg sm:text-2xl font-bold text-foreground truncate">{card.value}</p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Monthly timesheet by employee */}
          <div className="rounded-xl glass-card p-3 sm:p-4">
            <div className="flex items-center justify-between px-1 sm:px-2 pb-3 sm:pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={prevMonth} className="p-1 rounded hover:bg-muted">
                  <TbChevronLeft size={20} className="text-muted-foreground" />
                </button>
                <h2 className="text-sm font-semibold text-foreground">{monthLabel}</h2>
                <button onClick={nextMonth} className="p-1 rounded hover:bg-muted">
                  <TbChevronRight size={20} className="text-muted-foreground" />
                </button>
              </div>
              <button className="rounded-lg border border-border p-1.5 sm:p-2 text-foreground/70 hover:bg-muted/40">
                <TbDownload size={18} />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : !teamMonth || teamMonth.employees.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No employee records found.</div>
            ) : (
              <div className="space-y-4">
                {/* Employee tabs — horizontal */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {teamMonth.employees.map(emp => (
                    <button
                      key={emp.userId}
                      onClick={() => setSelectedEmployee(emp.userId)}
                      className={cn(
                        "shrink-0 rounded-xl px-4 py-2.5 text-left transition-all border",
                        selectedEmployee === emp.userId
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card hover:bg-muted/40 text-foreground/85 border-border"
                      )}
                    >
                      <p className="text-sm font-bold whitespace-nowrap">{emp.fullName}</p>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        selectedEmployee === emp.userId ? "text-muted-foreground/70" : "text-muted-foreground"
                      )}>
                        {emp.presentDays}d · {formatDuration(emp.totalMinutes)}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Timesheet grid for selected employee */}
                {selected && (
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{selected.department}</span>
                      <span className="ml-auto text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {selected.presentDays} days present · {formatDuration(selected.totalMinutes)} total
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="grid rounded-lg border border-border min-w-[900px]"
                        style={{ gridTemplateColumns: "150px repeat(24, minmax(38px, 1fr)) 64px 80px" }}>
                        <div className="bg-muted/40 p-3 text-sm text-muted-foreground">Date</div>
                        {hourColumns.map(h => (
                          <div key={h} className="border-l bg-muted/40 p-2 text-center text-[10px] text-muted-foreground">
                            {h === 0 ? "12A" : h < 12 ? `${h}A` : h === 12 ? "12P" : `${h - 12}P`}
                          </div>
                        ))}
                        <div className="border-l bg-muted/40 p-3 text-center text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Status</div>
                        <div className="border-l bg-muted/40 p-3 text-center text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Time</div>

                        {[...selected.attendance].reverse().map(day => {
                          const isToday = day.date === todayKey;
                          const label = ordinalLabel(day.date, isToday);
                          const statusChar = day.status === "present" ? "P" : "A";
                          const note = day.status === "weekend" ? "Weekend" : day.status === "holiday" ? "Holiday" : day.note ?? undefined;
                          const segments = timelineSegments(day.clockIn, day.clockOut, day.breaks, now);

                          return (
                            <div key={day.date} className="contents">
                              <div className="border-t p-3 text-sm font-medium bg-muted/40 text-foreground whitespace-nowrap">{label}</div>
                              <div className="relative border-l border-t bg-card" style={{ gridColumn: "span 24" }}>
                                <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                                  {hourColumns.map(h => <div key={h} className="border-l border-border" />)}
                                </div>
                                {note && (
                                  <div className="absolute left-0 right-0 top-1/2 z-10 mx-auto h-7 -translate-y-1/2 rounded-full border bg-muted text-center text-sm leading-7 text-foreground/70">
                                    {note}
                                  </div>
                                )}
                                {segments.map((seg, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "absolute top-1/2 z-10 h-7 -translate-y-1/2 border",
                                      i === 0 && "rounded-l-full",
                                      i === segments.length - 1 && "rounded-r-full",
                                      seg.type === "break"
                                        ? "border-amber-400 bg-amber-100 dark:bg-amber-400/15"
                                        : isToday ? "border-blue-500 bg-blue-100 dark:bg-blue-400/15" : "border-green-400 bg-green-100 dark:bg-green-400/15"
                                    )}
                                    style={{
                                      left: `${(seg.startFrac / 24) * 100}%`,
                                      width: `${((seg.endFrac - seg.startFrac) / 24) * 100}%`,
                                    }}
                                    title={segmentTooltip(seg)}
                                  />
                                ))}
                              </div>
                              <div className="border-l border-t p-3 text-center"><AttendanceStatus value={statusChar} /></div>
                              <div className="border-l border-t p-3 text-center text-sm text-muted-foreground">{formatDuration(day.durationMinutes)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Personal timesheet (non-superadmin) ──────────────────────────────────────

function PersonalTimesheetPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [days, setDays] = useState<AttendanceDay[]>([]);
  const [today, setToday] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockingOut, setClockingOut] = useState(false);
  const [breakLoading, setBreakLoading] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regDate, setRegDate] = useState(now.toISOString().split("T")[0]);
  const [regTime, setRegTime] = useState("");
  const [regReason, setRegReason] = useState("");

  const hourColumns = Array.from({ length: 24 }, (_, i) => i);
  const todayKey = now.toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [monthDays, todayRecord] = await Promise.all([
        apiFetch<AttendanceDay[]>(`/attendance?month=${month}&year=${year}`),
        apiFetch<TodayStats>("/attendance/today"),
      ]);
      const todayStr = new Date().toISOString().split("T")[0];
      const todayEntry = monthDays.filter(d => d.date === todayStr);
      const past = monthDays.filter(d => d.date < todayStr).reverse();
      setDays([...todayEntry, ...past]);
      setToday(todayRecord);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleClockIn = async () => {
    try {
      await apiFetch("/attendance/clock-in", { method: "POST" });
      fetchData();
    } catch { }
  };

  const handleClockOut = async () => {
    setClockingOut(true);
    try {
      await apiFetch("/attendance/clock-out", { method: "POST" });
      fetchData();
    } catch { } finally {
      setClockingOut(false);
    }
  };

  const onBreak = !!today?.breaks?.length && !today.breaks[today.breaks.length - 1].end;

  const handleToggleBreak = async () => {
    setBreakLoading(true);
    try {
      await apiFetch(onBreak ? "/attendance/break-end" : "/attendance/break-start", { method: "POST" });
      fetchData();
    } catch { } finally {
      setBreakLoading(false);
    }
  };

  const handleRegularize = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/attendance/requests", {
        method: "POST",
        body: JSON.stringify({ type: "Regularization", date: regDate, requestedTime: regTime, reason: regReason }),
      });
      setShowRegModal(false);
      setRegTime("");
      setRegReason("");
      alert("Request submitted successfully.");
    } catch {
      alert("Failed to submit request.");
    }
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className={cn("flex flex-col h-full glass-panel overflow-hidden", isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl")}>
      <div className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border glass-header px-4 sm:px-5">
        <SubNavToggle />
        <span className="text-base sm:text-lg font-semibold tracking-tight truncate">My Timesheet</span>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1220px] p-3 sm:p-6 space-y-4 sm:space-y-6">
          <section className="rounded-xl glass-card p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                {today?.clockIn ? (
                  <>
                    <p className="mt-3 sm:mt-6 text-base sm:text-lg text-muted-foreground">You clocked in at {formatTime(today.clockIn)}</p>
                    <div className="mt-3 flex items-center gap-2.5 flex-wrap">
                      <span className="rounded-md bg-blue-100 dark:bg-blue-400/15 px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-300">DEFAULT SHIFT</span>
                      <span className="text-sm text-foreground/70">11:00 AM – 8:00 PM</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground/70">
                      Duration: {formatDuration(today.durationMinutes)}
                      {onBreak && <span className="ml-2 text-xs font-medium text-amber-600 dark:text-amber-300">On break since {formatTime(today.breaks![today.breaks!.length - 1].start)}</span>}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 sm:mt-6 text-base sm:text-lg text-muted-foreground">You haven't clocked in yet today.</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setShowRegModal(true)}
                  className="rounded-lg border border-border px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-muted/40"
                >
                  Add regularisation
                </button>
                {today?.clockIn && !today?.clockOut ? (
                  <>
                    <button
                      onClick={handleToggleBreak}
                      disabled={breakLoading}
                      className={cn(
                        "inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium disabled:opacity-60",
                        onBreak ? "border-amber-300 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-400/15" : "border-border hover:bg-muted/40"
                      )}
                    >
                      <TbCoffee size={16} />
                      {breakLoading ? "…" : onBreak ? "Resume" : "Take a break"}
                    </button>
                    <button
                      onClick={handleClockOut}
                      disabled={clockingOut}
                      className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-border px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-muted/40 disabled:opacity-60"
                    >
                      <TbStopwatch size={16} />
                      {clockingOut ? "Clocking out…" : "Clock out"}
                    </button>
                  </>
                ) : !today?.clockIn ? (
                  <button
                    onClick={handleClockIn}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary text-primary-foreground px-4 py-2 text-xs sm:text-sm font-medium hover:bg-primary/90"
                  >
                    Clock in
                  </button>
                ) : (
                  <span className="text-xs sm:text-sm text-muted-foreground">Clocked out at {formatTime(today.clockOut)}</span>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl glass-card p-3 sm:p-4">
            <div className="flex items-center justify-between px-1 sm:px-2 pb-3 sm:pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={prevMonth} className="p-1 rounded hover:bg-muted">
                  <TbChevronLeft size={20} className="text-muted-foreground" />
                </button>
                <h2 className="text-sm font-semibold text-foreground">{monthLabel}</h2>
                <button onClick={nextMonth} className="p-1 rounded hover:bg-muted">
                  <TbChevronRight size={20} className="text-muted-foreground" />
                </button>
              </div>
              <button className="rounded-lg border border-border p-1.5 sm:p-2 text-foreground/70 hover:bg-muted/40">
                <TbDownload size={18} />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="grid rounded-lg border border-border min-w-[900px]"
                  style={{ gridTemplateColumns: "150px repeat(24, minmax(38px, 1fr)) 72px 86px" }}>
                <div className="bg-muted/40 p-3 text-sm text-muted-foreground">Date</div>
                {hourColumns.map(h => (
                  <div key={h} className="border-l bg-muted/40 p-3 text-center text-sm text-muted-foreground">
                    {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                  </div>
                ))}
                <div className="border-l bg-muted/40 p-3 text-center text-sm text-muted-foreground">Status</div>
                <div className="border-l bg-muted/40 p-3 text-center text-sm text-muted-foreground">Time</div>

                {days.map(day => {
                  const isToday = day.date === todayKey;
                  const label = ordinalLabel(day.date, isToday);
                  const statusChar = day.status === "present" ? "P" : "A";
                  const note = day.status === "weekend" ? "Weekend" : day.status === "holiday" ? "Holiday" : day.note ?? undefined;
                  const segments = timelineSegments(day.clockIn, day.clockOut, day.breaks, now);

                  return (
                    <div key={day.date} className="contents">
                      <div className="border-t p-3 text-sm font-medium bg-muted/40 text-foreground">{label}</div>
                      <div className="relative border-l border-t bg-card" style={{ gridColumn: "span 24" }}>
                        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                          {hourColumns.map(h => <div key={h} className="border-l border-border" />)}
                        </div>
                        {note && (
                          <div className="absolute left-0 right-0 top-1/2 z-10 mx-auto h-7 -translate-y-1/2 rounded-full border bg-muted text-center text-sm leading-7 text-foreground/70">
                            {note}
                          </div>
                        )}
                        {segments.map((seg, i) => (
                          <div
                            key={i}
                            className={cn(
                              "absolute top-1/2 z-10 h-7 -translate-y-1/2 border",
                              i === 0 && "rounded-l-full",
                              i === segments.length - 1 && "rounded-r-full",
                              seg.type === "break"
                                ? "border-amber-400 bg-amber-100 dark:bg-amber-400/15"
                                : isToday ? "border-blue-500 bg-blue-100 dark:bg-blue-400/15" : "border-green-400 bg-green-100 dark:bg-green-400/15"
                            )}
                            style={{
                              left: `${(seg.startFrac / 24) * 100}%`,
                              width: `${((seg.endFrac - seg.startFrac) / 24) * 100}%`,
                            }}
                            title={segmentTooltip(seg)}
                          />
                        ))}
                      </div>
                      <div className="border-l border-t p-3 text-center"><AttendanceStatus value={statusChar} /></div>
                      <div className="border-l border-t p-3 text-center text-sm text-muted-foreground">{formatDuration(day.durationMinutes)}</div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {showRegModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center glass-overlay p-4">
          <div className="glass-modal rounded-3xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Request Regularization</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Attendance Fix</p>
              </div>
              <button onClick={() => setShowRegModal(false)} className="p-2 rounded-xl hover:bg-muted/40 text-muted-foreground hover:text-foreground">
                <TbX size={20} />
              </button>
            </div>
            <form onSubmit={handleRegularize} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</label>
                <input type="date" value={regDate} onChange={e => setRegDate(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-border bg-muted/40 focus:ring-2 focus:ring-ring outline-none" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Corrected Time / Type</label>
                <input type="text" placeholder="e.g. 09:30 AM or Full Day" value={regTime} onChange={e => setRegTime(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-border bg-muted/40 focus:ring-2 focus:ring-ring outline-none" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reason</label>
                <textarea placeholder="Why is this fix needed?" value={regReason} onChange={e => setRegReason(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-border bg-muted/40 focus:ring-2 focus:ring-ring outline-none h-24 resize-none" required />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg active:scale-95">
                  Submit Request
                </button>
                <button type="button" onClick={() => setShowRegModal(false)} className="px-6 py-3 bg-muted/40 text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted transition-all">
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

// ─── Root export — routes by role ─────────────────────────────────────────────

export function AttendancePage() {
  const { has } = usePermissions();

  if (has("attendance:write", "employees:read")) return <TeamAttendancePage />;
  return <PersonalTimesheetPage />;
}
