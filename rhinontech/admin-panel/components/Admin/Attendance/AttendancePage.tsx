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
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { useSideNav } from "@/context/SideNavContext";
import { apiFetch } from "@/lib/api";
import { usePathname } from "next/navigation";

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
    value === "P" ? "border-green-600 bg-green-100 text-green-700" :
    "border-red-500 bg-red-50 text-red-600";
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
  status: "present" | "absent" | "weekend" | "holiday" | "leave";
  note: string | null;
  durationMinutes: number;
}

interface TodayStats {
  date: string;
  clockIn: string | null;
  clockOut: string | null;
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
  };
}

interface TeamToday {
  date: string;
  summary: { total: number; present: number; absent: number; active: number };
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
    <div className={cn("flex flex-col h-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
      <div className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b px-5 bg-stone-50">
        <SubNavToggle />
        <span className="text-lg font-semibold tracking-tight">Team Attendance</span>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1400px] p-6 space-y-6">

          {/* Today's summary cards */}
          {teamToday && (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Employees", value: teamToday.summary.total, icon: <TbUsers size={20} />, color: "text-stone-600 bg-stone-100" },
                { label: "Present Today", value: teamToday.summary.present, icon: <TbUserCheck size={20} />, color: "text-green-700 bg-green-100" },
                { label: "Absent Today", value: teamToday.summary.absent, icon: <TbUserX size={20} />, color: "text-red-600 bg-red-100" },
                { label: "Currently Active", value: teamToday.summary.active, icon: <TbActivity size={20} />, color: "text-blue-600 bg-blue-100" },
              ].map(card => (
                <div key={card.label} className="rounded-xl border border-gray-100 bg-white p-5 flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl", card.color)}>{card.icon}</div>
                  <div>
                    <p className="text-2xl font-bold text-stone-900">{card.value}</p>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Monthly timesheet by employee */}
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between px-2 pb-4">
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100">
                  <TbChevronLeft size={20} className="text-gray-500" />
                </button>
                <h2 className="text-sm font-semibold text-gray-900">{monthLabel}</h2>
                <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">
                  <TbChevronRight size={20} className="text-gray-500" />
                </button>
              </div>
              <button className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50">
                <TbDownload size={18} />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
            ) : !teamMonth || teamMonth.employees.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No employee records found.</div>
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
                          ? "bg-stone-900 text-white border-stone-900"
                          : "bg-white hover:bg-stone-50 text-stone-700 border-stone-100"
                      )}
                    >
                      <p className="text-sm font-bold whitespace-nowrap">{emp.fullName}</p>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        selectedEmployee === emp.userId ? "text-stone-300" : "text-stone-400"
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
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{selected.department}</span>
                      <span className="ml-auto text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                        {selected.presentDays} days present · {formatDuration(selected.totalMinutes)} total
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="grid rounded-lg border border-gray-100 min-w-[900px]"
                        style={{ gridTemplateColumns: "150px repeat(24, minmax(38px, 1fr)) 64px 80px" }}>
                        <div className="bg-gray-50 p-3 text-sm text-gray-500">Date</div>
                        {hourColumns.map(h => (
                          <div key={h} className="border-l bg-gray-50 p-2 text-center text-[10px] text-gray-400">
                            {h === 0 ? "12A" : h < 12 ? `${h}A` : h === 12 ? "12P" : `${h - 12}P`}
                          </div>
                        ))}
                        <div className="border-l bg-gray-50 p-3 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">Status</div>
                        <div className="border-l bg-gray-50 p-3 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">Time</div>

                        {[...selected.attendance].reverse().map(day => {
                          const isToday = day.date === todayKey;
                          const label = ordinalLabel(day.date, isToday);
                          const statusChar = day.status === "present" ? "P" : "A";
                          const note = day.status === "weekend" ? "Weekend" : day.status === "holiday" ? "Holiday" : day.note ?? undefined;
                          const clockInFrac = toHourFraction(day.clockIn);
                          const clockOutFrac = toHourFraction(day.clockOut) ?? (day.clockIn ? (now.getHours() + now.getMinutes() / 60) : null);

                          return (
                            <div key={day.date} className="contents">
                              <div className="border-t p-3 text-sm font-medium bg-gray-50 text-gray-800 whitespace-nowrap">{label}</div>
                              <div className="relative border-l border-t bg-white" style={{ gridColumn: "span 24" }}>
                                <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                                  {hourColumns.map(h => <div key={h} className="border-l border-gray-100" />)}
                                </div>
                                {note && (
                                  <div className="absolute left-0 right-0 top-1/2 z-10 mx-auto h-7 -translate-y-1/2 rounded-full border bg-gray-100 text-center text-sm leading-7 text-gray-600">
                                    {note}
                                  </div>
                                )}
                                {clockInFrac !== null && clockOutFrac !== null && (
                                  <div
                                    className={cn(
                                      "absolute top-1/2 z-10 h-7 -translate-y-1/2 rounded-full border",
                                      isToday ? "border-blue-500 bg-blue-100" : "border-green-400 bg-green-100"
                                    )}
                                    style={{
                                      left: `${(clockInFrac / 24) * 100}%`,
                                      width: `${((clockOutFrac - clockInFrac) / 24) * 100}%`,
                                    }}
                                  />
                                )}
                              </div>
                              <div className="border-l border-t p-3 text-center"><AttendanceStatus value={statusChar} /></div>
                              <div className="border-l border-t p-3 text-center text-sm text-gray-500">{formatDuration(day.durationMinutes)}</div>
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
    <div className={cn("flex flex-col h-full bg-stone-50 overflow-hidden", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
      <div className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b px-5 bg-stone-50">
        <SubNavToggle />
        <span className="text-lg font-semibold tracking-tight">My Timesheet</span>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1220px] p-6 space-y-6">
          <section className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                {today?.clockIn ? (
                  <>
                    <p className="mt-8 text-lg text-gray-500">You clocked in at {formatTime(today.clockIn)}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600">DEFAULT SHIFT</span>
                      <span className="text-gray-600">11:00 AM – 8:00 PM</span>
                    </div>
                    <p className="mt-3 text-gray-600">Duration: {formatDuration(today.durationMinutes)}</p>
                  </>
                ) : (
                  <p className="mt-8 text-lg text-gray-500">You haven't clocked in yet today.</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRegModal(true)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Add regularisation
                </button>
                {today?.clockIn && !today?.clockOut ? (
                  <button
                    onClick={handleClockOut}
                    disabled={clockingOut}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
                  >
                    <TbStopwatch size={16} />
                    {clockingOut ? "Clocking out…" : "Clock out"}
                  </button>
                ) : !today?.clockIn ? (
                  <button
                    onClick={handleClockIn}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Clock in
                  </button>
                ) : (
                  <span className="text-sm text-gray-400">Clocked out at {formatTime(today.clockOut)}</span>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between px-2 pb-4">
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100">
                  <TbChevronLeft size={20} className="text-gray-500" />
                </button>
                <h2 className="text-sm font-semibold text-gray-900">{monthLabel}</h2>
                <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">
                  <TbChevronRight size={20} className="text-gray-500" />
                </button>
              </div>
              <button className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50">
                <TbDownload size={18} />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
            ) : (
              <div className="grid overflow-hidden rounded-lg border border-gray-100"
                style={{ gridTemplateColumns: "150px repeat(24, minmax(38px, 1fr)) 72px 86px" }}>
                <div className="bg-gray-50 p-3 text-sm text-gray-500">Date</div>
                {hourColumns.map(h => (
                  <div key={h} className="border-l bg-gray-50 p-3 text-center text-sm text-gray-500">
                    {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                  </div>
                ))}
                <div className="border-l bg-gray-50 p-3 text-center text-sm text-gray-500">Status</div>
                <div className="border-l bg-gray-50 p-3 text-center text-sm text-gray-500">Time</div>

                {days.map(day => {
                  const isToday = day.date === todayKey;
                  const label = ordinalLabel(day.date, isToday);
                  const statusChar = day.status === "present" ? "P" : "A";
                  const note = day.status === "weekend" ? "Weekend" : day.status === "holiday" ? "Holiday" : day.note ?? undefined;
                  const clockInFrac = toHourFraction(day.clockIn);
                  const clockOutFrac = toHourFraction(day.clockOut) ?? (day.clockIn ? (now.getHours() + now.getMinutes() / 60) : null);

                  return (
                    <div key={day.date} className="contents">
                      <div className="border-t p-3 text-sm font-medium bg-gray-50 text-gray-800">{label}</div>
                      <div className="relative border-l border-t bg-white" style={{ gridColumn: "span 24" }}>
                        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                          {hourColumns.map(h => <div key={h} className="border-l border-gray-100" />)}
                        </div>
                        {note && (
                          <div className="absolute left-0 right-0 top-1/2 z-10 mx-auto h-7 -translate-y-1/2 rounded-full border bg-gray-100 text-center text-sm leading-7 text-gray-600">
                            {note}
                          </div>
                        )}
                        {clockInFrac !== null && clockOutFrac !== null && (
                          <div
                            className={cn(
                              "absolute top-1/2 z-10 h-7 -translate-y-1/2 rounded-full border",
                              isToday ? "border-blue-500 bg-blue-100" : "border-green-400 bg-green-100"
                            )}
                            style={{
                              left: `${(clockInFrac / 24) * 100}%`,
                              width: `${((clockOutFrac - clockInFrac) / 24) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                      <div className="border-l border-t p-3 text-center"><AttendanceStatus value={statusChar} /></div>
                      <div className="border-l border-t p-3 text-center text-sm text-gray-500">{formatDuration(day.durationMinutes)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {showRegModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Request Regularization</h3>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Attendance Fix</p>
              </div>
              <button onClick={() => setShowRegModal(false)} className="p-2 rounded-xl hover:bg-stone-50 text-stone-400 hover:text-stone-900">
                <TbX size={20} />
              </button>
            </div>
            <form onSubmit={handleRegularize} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Date</label>
                <input type="date" value={regDate} onChange={e => setRegDate(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-stone-100 bg-stone-50 focus:ring-2 focus:ring-stone-900 outline-none" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Corrected Time / Type</label>
                <input type="text" placeholder="e.g. 09:30 AM or Full Day" value={regTime} onChange={e => setRegTime(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-stone-100 bg-stone-50 focus:ring-2 focus:ring-stone-900 outline-none" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Reason</label>
                <textarea placeholder="Why is this fix needed?" value={regReason} onChange={e => setRegReason(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-stone-100 bg-stone-50 focus:ring-2 focus:ring-stone-900 outline-none h-24 resize-none" required />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all shadow-lg active:scale-95">
                  Submit Request
                </button>
                <button type="button" onClick={() => setShowRegModal(false)} className="px-6 py-3 bg-stone-50 text-stone-400 rounded-xl font-bold text-sm hover:bg-stone-100 transition-all">
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
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];

  if (roleSlug === "superadmin") return <TeamAttendancePage />;
  return <PersonalTimesheetPage />;
}
