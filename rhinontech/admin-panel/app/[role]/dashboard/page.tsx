"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import {
  TbBuildingSkyscraper,
  TbCalendar,
  TbCalendarCheck,
  TbCalendarEvent,
  TbCalendarPlus,
  TbCake,
  TbCash,
  TbCheck,
  TbClock,
  TbCoffee,
  TbConfetti,
  TbMoonStars,
  TbStopwatch,
  TbSunHigh,
  TbSunrise,
  TbUsers,
  TbTargetArrow,
} from "react-icons/tb";
import { apiFetch } from "@/lib/api";

interface PendingTask {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
}

interface Person {
  id: string;
  fullName: string;
  day: number;
  role: string | null;
  department: string;
  isToday: boolean;
}

interface BirthdayPerson extends Person {
  age: number;
}

interface AnniversaryPerson extends Person {
  years: number;
}

interface RecentHire {
  id: string;
  fullName: string;
  department: string;
  role: string | null;
  joiningDate: string;
}

/** Indian grouping, compact past a lakh — matches the CRM's own formatting. */
function formatPipelineValue(value: number): string {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: Math.abs(value) >= 1_00_000 ? "compact" : "standard",
      maximumFractionDigits: Math.abs(value) >= 1_00_000 ? 1 : 0,
    }).format(value);
  } catch {
    return `₹${value.toLocaleString("en-IN")}`;
  }
}

interface DashboardStats {
  currentUser: { fullName: string; department: string; role: string };
  totalEmployees: number;
  newThisMonth: number;
  pendingTasks: number;
  daysPresent: number;
  totalMinutesThisMonth: number;
  todayAttendance: {
    clockIn: string | null;
    clockOut: string | null;
    breaks?: { start: string; end: string | null }[];
    status: string;
    durationMinutes: number;
  } | null;
  birthdays: BirthdayPerson[];
  anniversaries: AnniversaryPerson[];
  recentHires: RecentHire[];
  pendingTasksList: PendingTask[];
  /** Null when the viewer can't see the CRM, or when the snapshot failed. */
  crm: {
    openCount: number;
    openValue: number;
    weightedValue: number;
    myOpenCount: number;
  } | null;
}

interface InvestmentSummary {
  totalCompanyCostPaid: number;
  activeSalaryEmployeeCount: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDuration(minutes: number): string {
  if (!minutes) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatINR(value: number): string {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function ordinalDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "short" });
  const suffix = [1,21,31].includes(day) ? "st" : [2,22].includes(day) ? "nd" : [3,23].includes(day) ? "rd" : "th";
  return `${day}${suffix} ${month}`;
}

function greeting(name: string): string {
  const h = new Date().getHours();
  const prefix = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${prefix}, ${name.split(" ")[0]}`;
}

function greetingIcon() {
  const h = new Date().getHours();
  if (h < 6) return <TbMoonStars size={22} className="text-indigo-400" />;
  if (h < 12) return <TbSunrise size={22} className="text-amber-400" />;
  if (h < 17) return <TbSunHigh size={22} className="text-yellow-400" />;
  return <TbMoonStars size={22} className="text-indigo-400" />;
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-rose-500", "bg-blue-500",
  "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-pink-500",
];

function avatar(name: string, idx: number, size = "h-9 w-9") {
  return (
    <span className={`${size} ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white`}>
      {initials(name)}
    </span>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center gap-3.5 sm:gap-4 rounded-xl glass-card p-4 sm:p-5 min-w-0">
      <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/70">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground truncate" title={label}>{label}</p>
        <p className="mt-0.5 text-lg sm:text-xl font-bold text-foreground leading-none">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground truncate" title={sub}>{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-5 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-5 py-6 text-sm text-muted-foreground">{message}</p>;
}

function DayBadge({ day, highlight }: { day: number; highlight?: boolean }) {
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${highlight ? "bg-blue-600 text-white" : "bg-muted text-foreground/85"}`}>
      {day}
    </span>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1] || "";
  const isSuperadmin = roleSlug === "superadmin";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [investment, setInvestment] = useState<InvestmentSummary | null>(null);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [breakLoading, setBreakLoading] = useState(false);
  const [todayLabel, setTodayLabel] = useState("");

  const fetchStats = useCallback(() => {
    apiFetch<DashboardStats>("/dashboard/stats").then(setStats).catch(() => {});
  }, []);

  const fetchInvestment = useCallback(() => {
    if (!isSuperadmin) return;
    apiFetch<InvestmentSummary>("/payroll/admin/investment").then(setInvestment).catch(() => {});
  }, [isSuperadmin]);

  useEffect(() => {
    fetchStats();
    fetchInvestment();
    setTodayLabel(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, [fetchStats, fetchInvestment]);

  const handleClockIn = async () => {
    setClockingIn(true);
    try { await apiFetch("/attendance/clock-in", { method: "POST" }); fetchStats(); }
    catch { /* already clocked in */ }
    finally { setClockingIn(false); }
  };

  const handleClockOut = async () => {
    setClockingOut(true);
    try { await apiFetch("/attendance/clock-out", { method: "POST" }); fetchStats(); }
    catch { /* error */ }
    finally { setClockingOut(false); }
  };

  const handleToggleBreak = async () => {
    setBreakLoading(true);
    try { await apiFetch(onBreak ? "/attendance/break-end" : "/attendance/break-start", { method: "POST" }); fetchStats(); }
    catch { /* error */ }
    finally { setBreakLoading(false); }
  };

  const att = stats?.todayAttendance;
  const clocked = !!att?.clockIn;
  const clockedOut = !!att?.clockOut;
  const onBreak = !!att?.breaks?.length && !att.breaks[att.breaks.length - 1].end;

  return (
    <AdminDashboardShell>
      <div className="glass-panel rounded-xl w-full h-full overflow-auto">
        <div className="mx-auto max-w-[1400px] p-4 sm:p-6 space-y-4 sm:space-y-5">

          {/* ── Header ── */}
          <div className="flex items-center gap-3">
            {greetingIcon()}
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {stats ? greeting(stats.currentUser.fullName) : "Loading…"}
              </h1>
              <p className="text-sm text-muted-foreground">{todayLabel}</p>
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ${isSuperadmin ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
            <StatCard
              icon={<TbUsers size={20} />}
              label="Total employees"
              value={stats?.totalEmployees ?? "—"}
              sub={stats ? `${stats.newThisMonth} joined this month` : undefined}
            />
            {isSuperadmin && (
              <StatCard
                icon={<TbCash size={20} />}
                label="Total invested"
                value={investment ? formatINR(investment.totalCompanyCostPaid) : "—"}
                sub={investment ? `${investment.activeSalaryEmployeeCount} salaried employees` : "Payroll paid"}
              />
            )}
            {!isSuperadmin && (
              <StatCard
                icon={<TbCalendarCheck size={20} />}
                label="Days present"
                value={stats ? `${stats.daysPresent} days` : "—"}
                sub={stats ? `${formatDuration(stats.totalMinutesThisMonth)} this month` : undefined}
              />
            )}
            {!isSuperadmin && (
              <StatCard
                icon={<TbCheck size={20} />}
                label="My pending tasks"
                value={stats?.pendingTasks ?? "—"}
                sub={stats?.pendingTasks ? "Need attention" : "All caught up!"}
              />
            )}
            <StatCard
              icon={<TbBuildingSkyscraper size={20} />}
              label="New hires this month"
              value={stats?.newThisMonth ?? "—"}
              sub="Joined recently"
            />
            {/* Only rendered for people who can see the CRM — the API returns
                null otherwise, so no permission check is needed here. */}
            {stats?.crm && (
              <StatCard
                icon={<TbTargetArrow size={20} />}
                label="Open pipeline"
                value={formatPipelineValue(stats.crm.openValue)}
                sub={`${stats.crm.openCount} deals · ${formatPipelineValue(stats.crm.weightedValue)} weighted`}
              />
            )}
          </div>

          {/* ── Row 2: Attendance + Upcoming ── */}
          <div className="grid grid-cols-12 gap-4">

            {/* Today's Attendance */}
            <div className="col-span-12 rounded-xl glass-card overflow-hidden">
              <SectionTitle icon={<TbClock size={16} />} title={isSuperadmin ? "Team Attendance" : "Today's Attendance"} />
              <div className="p-5">
                {isSuperadmin ? (
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Super admins manage team attendance instead of clocking in.</p>
                      <p className="mt-2 text-xs text-muted-foreground">Use Attendance to review who is present, absent, or active today.</p>
                    </div>
                    <a
                      href={`/${roleSlug}/attendance`}
                      className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80"
                    >
                      View team attendance
                    </a>
                  </div>
                ) : (
                <>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="space-y-4">
                    {clocked ? (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Clocked in</p>
                          <p className="mt-1 text-3xl font-bold text-foreground">{formatTime(att?.clockIn)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="mt-0.5 font-semibold text-foreground">{formatDuration(att?.durationMinutes ?? 0)}</p>
                          </div>
                          {clockedOut && (
                            <div>
                              <p className="text-xs text-muted-foreground">Clocked out</p>
                              <p className="mt-0.5 font-semibold text-foreground">{formatTime(att?.clockOut)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground">Shift</p>
                            <p className="mt-0.5 font-semibold text-foreground">9:00 AM – 6:00 PM</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-blue-50 dark:bg-blue-400/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300">DEFAULT SHIFT</span>
                          {!clockedOut && !onBreak && (
                            <span className="rounded-md bg-green-50 dark:bg-green-400/10 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-300">Active</span>
                          )}
                          {onBreak && (
                            <span className="rounded-md bg-amber-50 dark:bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                              On break since {formatTime(att!.breaks![att!.breaks!.length - 1].start)}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">You haven't clocked in yet.</p>
                        <p className="text-xs text-muted-foreground/70">Shift: 9:00 AM – 6:00 PM</p>
                      </div>
                    )}
                  </div>

                  {/* Clock visualization */}
                  <div className="shrink-0 flex flex-col items-start gap-3 sm:items-end">
                    {!clocked && (
                      <button
                        onClick={handleClockIn}
                        disabled={clockingIn}
                        className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-60"
                      >
                        {clockingIn ? "Clocking in…" : "Clock in"}
                      </button>
                    )}
                    {clocked && !clockedOut && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleToggleBreak}
                          disabled={breakLoading}
                          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60 ${
                            onBreak ? "border-amber-300 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-400/15" : "border-border text-foreground hover:bg-muted/40"
                          }`}
                        >
                          <TbCoffee size={16} />
                          {breakLoading ? "…" : onBreak ? "Resume" : "Take a break"}
                        </button>
                        <button
                          onClick={handleClockOut}
                          disabled={clockingOut}
                          className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted/40 disabled:opacity-60"
                        >
                          <TbStopwatch size={16} />
                          {clockingOut ? "Clocking out…" : "Clock out"}
                        </button>
                      </div>
                    )}
                    {clocked && clockedOut && (
                      <span className="rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">Done for today</span>
                    )}
                    <button className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground hover:bg-muted/40">
                      Add regularisation
                    </button>
                  </div>
                </div>

                {/* Timeline bar */}
                <div className="mt-5">
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                    {clocked && (
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-blue-500"
                        style={{
                          left: `${(9 / 24) * 100}%`,
                          width: (() => {
                            if (!att?.clockIn) return "0%";
                            const start = new Date(att.clockIn);
                            const end = att.clockOut ? new Date(att.clockOut) : new Date();
                            const startFrac = (start.getHours() + start.getMinutes() / 60) / 24;
                            const endFrac = (end.getHours() + end.getMinutes() / 60) / 24;
                            return `${Math.max(0, (endFrac - startFrac)) * 100}%`;
                          })(),
                        }}
                      />
                    )}
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground/70">
                    <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
                  </div>
                </div>
                </>
                )}
              </div>
            </div>

          </div>

          {/* ── Row 3: Birthdays, Anniversaries, Recent Hires ── */}
          <div className="grid grid-cols-12 gap-4">

            {/* Birthdays */}
            <div className="col-span-12 md:col-span-4 rounded-xl glass-card overflow-hidden">
              <SectionTitle icon={<TbCake size={16} />} title="Birthdays this month" />
              {stats?.birthdays.length ? (
                <div className="divide-y divide-border">
                  {stats.birthdays.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                      <DayBadge day={p.day} highlight={p.isToday} />
                      {avatar(p.fullName, i)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{p.fullName}</p>
                          {p.isToday && <span className="shrink-0 rounded-full bg-pink-100 dark:bg-pink-400/15 px-2 py-0.5 text-[10px] font-semibold text-pink-600 dark:text-pink-300">Today 🎂</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{p.department} · Turns {p.age}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No birthdays this month." />
              )}
            </div>

            {/* Anniversaries */}
            <div className="col-span-12 md:col-span-4 rounded-xl glass-card overflow-hidden">
              <SectionTitle icon={<TbConfetti size={16} />} title="Work anniversaries" />
              {stats?.anniversaries.length ? (
                <div className="divide-y divide-border">
                  {stats.anniversaries.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                      <DayBadge day={p.day} highlight={p.isToday} />
                      {avatar(p.fullName, i + 2)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{p.fullName}</p>
                          {p.isToday && <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-300">Today 🎉</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{p.department} · {p.years} {p.years === 1 ? "year" : "years"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No anniversaries this month." />
              )}
            </div>

            {/* Recent Hires */}
            <div className="col-span-12 md:col-span-4 rounded-xl glass-card overflow-hidden">
              <SectionTitle icon={<TbCalendarPlus size={16} />} title="Recent hires" />
              {stats?.recentHires.length ? (
                <div className="divide-y divide-border">
                  {stats.recentHires.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                      {avatar(p.fullName, i + 4)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{p.fullName}</p>
                        <p className="text-xs text-muted-foreground">{p.department} · {p.role}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{ordinalDate(p.joiningDate as unknown as string)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No new hires in the last 60 days." />
              )}
            </div>
          </div>

          {/* ── Row 4: My Pending Tasks ── */}
          <div className="rounded-xl glass-card overflow-hidden">
            <SectionTitle icon={<TbCalendar size={16} />} title={`My pending tasks${stats?.pendingTasks ? ` (${stats.pendingTasks})` : ""}`} />
            {stats?.pendingTasksList.length ? (
              <div className="divide-y divide-border">
                {stats.pendingTasksList.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="h-4 w-4 shrink-0 rounded border border-border" />
                    <p className="flex-1 text-sm font-medium text-foreground">{task.title}</p>
                    {task.dueDate && (
                      <span className="shrink-0 text-xs text-muted-foreground">Due {ordinalDate(task.dueDate)}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No pending tasks. You're all caught up!" />
            )}
          </div>

        </div>
      </div>
    </AdminDashboardShell>
  );
}
