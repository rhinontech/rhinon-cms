"use client";

import { track } from "@/lib/track";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  TbArrowRight, TbCake, TbCalendarEvent, TbChecklist, TbChevronDown, TbChevronUp, TbCircleCheck, TbClock, TbCoffee,
  TbConfetti, TbExternalLink, TbStopwatch, TbUsers,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import type { DashboardStats, HomeSummary } from "./types";

/* ------------------------------------------------------------------ */

function Card({ title, icon, action, children, testId, className }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; testId?: string; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-xl glass-card", className)} data-testid={testId}>
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/10 text-brand">{icon}</span>
        <h2 className="flex-1 text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
          <span className="h-3.5 flex-1 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

const time = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) : "—";

const duration = (minutes: number) => {
  if (!minutes) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/* ------------------------------------------------------------------ *
 * Needs your attention — the "direct path"
 * ------------------------------------------------------------------ */

export interface AttentionRow {
  key: string;
  count: number;
  label: string;
  action: string;
  href: string;
  icon: IconType;
  tone: string;
}

/**
 * Everything waiting on this person, across modules, in one list. Each row
 * says how many, what they are, and opens the exact screen to deal with them.
 */
export function AttentionList({ rows, loading, error, onRetry }: { rows: AttentionRow[]; loading: boolean; error: string; onRetry: () => void }) {
  return (
    <Card title="Needs your attention" icon={<TbChecklist size={15} />} testId="attention">
      {loading ? (
        <SkeletonRows rows={3} />
      ) : error ? (
        <div className="flex items-center justify-between gap-3 px-5 py-5 text-sm">
          <span className="text-red-600 dark:text-red-300">{error}</span>
          <button onClick={onRetry} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Try again</button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-6" data-testid="all-caught-up">
          <TbCircleCheck size={22} className="shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-medium text-foreground">You are all caught up.</p>
            <p className="text-xs text-muted-foreground">No approvals, replies, chats or overdue tasks are waiting for you.</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <li key={row.key}>
                <Link href={row.href} prefetch={false} onClick={() => track("home_attention_clicked", { row: row.key })} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-foreground/[0.03]" data-testid={`attention-${row.key}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${row.tone}1f`, color: row.tone }}>
                    <Icon size={17} />
                  </span>
                  <span className="w-9 shrink-0 text-lg font-semibold tabular-nums text-foreground">{row.count > 99 ? "99+" : row.count}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground/90">{row.label}</span>
                  <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground sm:inline-flex">
                    {row.action} <TbArrowRight size={13} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Today
 * ------------------------------------------------------------------ */

export interface ClockControls {
  attendance: DashboardStats["todayAttendance"];
  busy: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
  onToggleBreak: () => void;
}

export function TodayPanel({
  loading, clock, schedule, meetings, tasks, taskHref, leaveBalance, leaveHref,
}: {
  loading: boolean;
  /** Null when the person doesn't clock in here (owners, or no attendance access). */
  clock: ClockControls | null;
  schedule: string | null;
  meetings: HomeSummary["today"]["meetings"];
  tasks: HomeSummary["today"]["tasks"];
  taskHref: (task: HomeSummary["today"]["tasks"][number]) => string;
  leaveBalance: number | null;
  leaveHref: string | null;
}) {
  const att = clock?.attendance;
  const clockedIn = !!att?.clockIn;
  const clockedOut = !!att?.clockOut;
  const onBreak = !!att?.breaks?.length && !att.breaks[att.breaks.length - 1].end;
  const nothing = !clock && meetings.length === 0 && tasks.length === 0 && leaveBalance === null;

  return (
    <Card title="Today" icon={<TbClock size={15} />} testId="today">
      {loading ? (
        <SkeletonRows rows={3} />
      ) : (
        <div className="divide-y divide-border">
          {clock && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                {clockedIn ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      {clockedOut ? `Clocked out at ${time(att?.clockOut)}` : onBreak ? "On a break" : `Clocked in at ${time(att?.clockIn)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{`${duration(att?.durationMinutes ?? 0)} worked today`}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">You have not clocked in yet</p>
                    <p className="text-xs text-muted-foreground">{schedule ? `Your hours: ${schedule}` : "Clock in when you start work."}</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!clockedIn && (
                  <button onClick={clock.onClockIn} disabled={clock.busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                    {clock.busy ? "Clocking in…" : "Clock in"}
                  </button>
                )}
                {clockedIn && !clockedOut && (
                  <>
                    <button onClick={clock.onToggleBreak} disabled={clock.busy} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-60", onBreak ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300" : "border-border hover:bg-muted")}>
                      <TbCoffee size={15} /> {onBreak ? "Resume" : "Break"}
                    </button>
                    <button onClick={clock.onClockOut} disabled={clock.busy} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-60">
                      <TbStopwatch size={15} /> Clock out
                    </button>
                  </>
                )}
                {clockedOut && <span className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Done for today</span>}
              </div>
            </div>
          )}

          {meetings.length > 0 && (
            <div className="px-5 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meetings</p>
              <ul className="space-y-2">
                {meetings.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 text-sm">
                    <span className="w-16 shrink-0 tabular-nums text-muted-foreground">{time(m.startTime)}</span>
                    <span className="min-w-0 flex-1 truncate text-foreground">{m.summary}</span>
                    {m.meetLink && (
                      <a href={m.meetLink} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline">
                        Join <TbExternalLink size={12} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="px-5 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due now</p>
              <ul className="space-y-1.5">
                {tasks.map((t) => (
                  <li key={t.id}>
                    <Link href={taskHref(t)} prefetch={false} className="flex items-center gap-3 rounded-md text-sm hover:text-primary">
                      <span className="h-3.5 w-3.5 shrink-0 rounded border border-border" />
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      {t.dueDate && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(`${t.dueDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {leaveBalance !== null && (
            <div className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span className="text-muted-foreground">{`${leaveBalance} ${leaveBalance === 1 ? "day" : "days"} of leave left this year`}</span>
              {leaveHref && (
                <Link href={leaveHref} prefetch={false} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  Request leave <TbArrowRight size={12} />
                </Link>
              )}
            </div>
          )}

          {nothing && <p className="px-5 py-6 text-sm text-muted-foreground">Nothing scheduled for you today.</p>}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Your workspace — what is where, on one screen
 * ------------------------------------------------------------------ */

export interface LauncherTile {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: IconType;
  tone: string;
  metric?: string;
}

/**
 * Every module this person can use, grouped the way the sidebar and the
 * website group them, with what each is for and one live number. A newcomer
 * sees the whole product here; someone settled in can fold it away.
 */
export function WorkspaceLauncher({ sections, collapsed, onToggle }: { sections: Array<{ key: string; label: string; tiles: LauncherTile[] }>; collapsed: boolean; onToggle: () => void }) {
  return (
    <Card
      title="Your workspace"
      icon={<TbUsers size={15} />}
      testId="launcher"
      action={
        <button onClick={onToggle} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground" aria-expanded={!collapsed}>
          {collapsed ? <>Show all <TbChevronDown size={13} /></> : <>Fold away <TbChevronUp size={13} /></>}
        </button>
      }
    >
      {collapsed ? (
        <div className="flex flex-wrap gap-2 px-5 py-3">
          {sections.flatMap((s) => s.tiles).map((tile) => {
            const Icon = tile.icon;
            return (
              <Link key={tile.key} href={tile.href} prefetch={false} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-xs font-medium text-foreground/85 hover:bg-muted">
                <Icon size={13} style={{ color: tile.tone }} /> {tile.label}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4 p-5">
          {sections.map((section) => (
            <div key={section.key}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{section.label}</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {section.tiles.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <Link
                      key={tile.key}
                      href={tile.href}
                      prefetch={false}
                      className="group flex items-start gap-3 rounded-lg border border-border/70 bg-card/50 p-3 transition-colors hover:border-foreground/15 hover:bg-card"
                      data-testid={`tile-${tile.key}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${tile.tone}1f`, color: tile.tone }}>
                        <Icon size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{tile.label}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{tile.description}</span>
                        {/* Its own line, so a long count never squeezes the module's name. */}
                        {tile.metric && (
                          <span className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums" style={{ background: `${tile.tone}14`, color: tile.tone }}>
                            {tile.metric}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Team pulse — owners and HR
 * ------------------------------------------------------------------ */

export function TeamPulse({ pulse, birthdays, anniversaries, attendanceHref }: { pulse: NonNullable<HomeSummary["pulse"]>; birthdays: DashboardStats["birthdays"]; anniversaries: DashboardStats["anniversaries"]; attendanceHref: string }) {
  const celebrations = [
    ...birthdays.map((b) => ({ id: `b-${b.id}`, name: b.fullName, day: b.day, today: b.isToday, icon: <TbCake size={14} className="text-pink-500" />, what: "Birthday" })),
    ...anniversaries.map((a) => ({ id: `a-${a.id}`, name: a.fullName, day: a.day, today: a.isToday, icon: <TbConfetti size={14} className="text-amber-500" />, what: `${a.years} ${a.years === 1 ? "year" : "years"}` })),
  ].sort((x, y) => x.day - y.day).slice(0, 6);

  return (
    <Card title="Team pulse" icon={<TbCalendarEvent size={15} />} testId="pulse">
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          { label: "In today", value: pulse.inToday, href: attendanceHref },
          { label: "On leave", value: pulse.onLeaveToday, href: attendanceHref },
          { label: "People", value: pulse.people, href: null },
        ].map((s) => {
          const body = (
            <>
              <p className="text-xl font-semibold tabular-nums text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} prefetch={false} className="px-5 py-3 hover:bg-foreground/[0.03]">{body}</Link>
          ) : (
            <div key={s.label} className="px-5 py-3">{body}</div>
          );
        })}
      </div>
      {celebrations.length > 0 ? (
        <ul className="divide-y divide-border">
          {celebrations.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold", c.today ? "bg-blue-600 text-white" : "bg-muted text-foreground/80")}>{c.day}</span>
              {c.icon}
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{c.today ? `${c.what} · today` : c.what}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-xs text-muted-foreground">No birthdays or work anniversaries this month.</p>
      )}
    </Card>
  );
}
