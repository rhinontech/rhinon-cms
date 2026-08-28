"use client";

import { useMemo, useState } from "react";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth,
  isWithinInterval, startOfDay, startOfMonth, startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import { TbCalendarPlus, TbChevronLeft, TbChevronRight } from "react-icons/tb";
import { STATUS_CHIP } from "./constants";
import type { ProjectTask, TaskRow } from "./types";

interface Bar {
  task: ProjectTask;
  /** 0-6 within the week row. */
  startCol: number;
  span: number;
  continuesLeft: boolean;
  continuesRight: boolean;
  lane: number;
}

/** A task's occupied interval. Due-only tasks are a single day. */
function intervalOf(task: ProjectTask): { start: Date; end: Date } | null {
  const s = task.startDate ? startOfDay(new Date(task.startDate)) : null;
  const e = task.dueDate ? startOfDay(new Date(task.dueDate)) : null;
  if (!s && !e) return null;
  const start = s ?? e!;
  const end = e ?? s!;
  // Tolerate a start after the due date rather than rendering a negative bar.
  return end < start ? { start: end, end: start } : { start, end };
}

/**
 * Lays a week's tasks out into non-overlapping lanes.
 *
 * Bars are placed greedily into the first lane that is free for their whole
 * span, which is what stops two tasks in the same week from drawing on top of
 * one another.
 */
function layoutWeek(days: Date[], tasks: ProjectTask[]): Bar[] {
  const weekStart = days[0];
  const weekEnd = days[6];
  const bars: Omit<Bar, "lane">[] = [];

  for (const task of tasks) {
    const iv = intervalOf(task);
    if (!iv) continue;
    if (iv.end < weekStart || iv.start > weekEnd) continue;

    const startCol = Math.max(0, days.findIndex((d) => isSameDay(d, iv.start) || d > iv.start));
    let endCol = days.findIndex((d) => isSameDay(d, iv.end));
    if (endCol === -1) endCol = iv.end > weekEnd ? 6 : startCol;

    bars.push({
      task,
      startCol,
      span: Math.max(1, endCol - startCol + 1),
      continuesLeft: iv.start < weekStart,
      continuesRight: iv.end > weekEnd,
    });
  }

  bars.sort((a, b) => a.startCol - b.startCol || b.span - a.span);

  // lanes[i] holds the column indices already occupied in that lane.
  const lanes: Set<number>[] = [];
  return bars.map((bar) => {
    const cols = Array.from({ length: bar.span }, (_, k) => bar.startCol + k);
    let lane = lanes.findIndex((occupied) => cols.every((c) => !occupied.has(c)));
    if (lane === -1) { lanes.push(new Set()); lane = lanes.length - 1; }
    cols.forEach((c) => lanes[lane].add(c));
    return { ...bar, lane };
  });
}

export function CalendarView({
  rows, onOpenTask, onCreateOnDate,
}: {
  rows: TaskRow[];
  onOpenTask: (task: ProjectTask) => void;
  onCreateOnDate: (date: Date) => void;
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const today = startOfDay(new Date());

  const tasks = useMemo(() => rows.map((r) => r.task), [rows]);

  const weeks = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor));
    const gridEnd = endOfWeek(endOfMonth(cursor));
    const all = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const out: Date[][] = [];
    for (let i = 0; i < all.length; i += 7) out.push(all.slice(i, i + 7));
    return out;
  }, [cursor]);

  const undated = useMemo(
    () => tasks.filter((t) => !t.startDate && !t.dueDate).length,
    [tasks]
  );

  /**
   * Bars are laid out up front so the grid's row template can be built from the
   * real lane counts before anything renders.
   */
  const weekLayouts = useMemo(
    () => weeks.map((days) => {
      const bars = layoutWeek(days, tasks);
      return { days, bars, laneCount: bars.reduce((m, b) => Math.max(m, b.lane + 1), 0) };
    }),
    [weeks, tasks]
  );

  /**
   * `auto` for the weekday header, then one minmax() per week.
   *
   * minmax(min, 1fr) is what makes this behave: on a definite-height grid the
   * rows divide the space exactly — no overflow from flex-basis rounding — while
   * a week stacked with bars can still claim its minimum and push the grid into
   * scrolling. `min-h-full` + `flex-1` could do neither reliably.
   */
  const rowTemplate = `auto ${weekLayouts
    .map((w) => `minmax(${64 + w.laneCount * 24}px, 1fr)`)
    .join(" ")}`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b glass-header px-4 py-2">
        <button
          onClick={() => setCursor(startOfMonth(new Date()))}
          className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
        >
          Today
        </button>
        <button onClick={() => setCursor((c) => addMonths(c, -1))} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100">
          <TbChevronLeft size={16} />
        </button>
        <button onClick={() => setCursor((c) => addMonths(c, 1))} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100">
          <TbChevronRight size={16} />
        </button>
        <span className="ml-1 text-sm font-semibold text-stone-900">{format(cursor, "MMMM yyyy")}</span>
        {undated > 0 && (
          <span className="ml-auto text-[11px] text-stone-400">
            {undated} task{undated === 1 ? "" : "s"} with no dates aren&apos;t shown
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid h-full min-w-[720px]" style={{ gridTemplateRows: rowTemplate }}>
          <div className="grid grid-cols-7 border-b glass-thead">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
              <div key={d} className="px-2 py-1.5 text-[11px] font-semibold text-stone-500">{d}</div>
            ))}
          </div>

          {weekLayouts.map(({ days, bars }, wi) => {
            return (
              <div key={wi} className="relative min-h-0 border-b">
                <div className="grid h-full grid-cols-7">
                  {days.map((d) => {
                    const isToday = isSameDay(d, today);
                    const inMonth = isSameMonth(d, cursor);
                    return (
                      <button
                        key={d.toISOString()}
                        onDoubleClick={() => onCreateOnDate(d)}
                        title="Double-click to add a task on this day"
                        className={cn(
                          "group h-full border-r px-2 pt-1.5 text-left align-top last:border-r-0",
                          !inMonth && "bg-stone-50/60"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs",
                            isToday ? "bg-blue-600 font-semibold text-white" : inMonth ? "text-stone-700" : "text-stone-400"
                          )}
                        >
                          {format(d, d.getDate() === 1 ? "d MMM" : "d")}
                        </span>
                        <TbCalendarPlus
                          size={12}
                          className="ml-1 inline text-stone-300 opacity-0 transition group-hover:opacity-100"
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Bars overlay the day cells so one can span several columns. */}
                <div className="pointer-events-none absolute inset-x-0 top-8 grid grid-cols-7 gap-y-0.5 px-1">
                  {bars.map((bar) => (
                    <button
                      key={bar.task.id}
                      data-task-opener
                      onClick={() => onOpenTask(bar.task)}
                      style={{
                        gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
                        gridRow: bar.lane + 1,
                      }}
                      className={cn(
                        "pointer-events-auto mx-0.5 truncate px-2 py-0.5 text-left text-[11px] font-medium",
                        STATUS_CHIP[bar.task.workflowStatus?.color ?? "stone"] ?? STATUS_CHIP.stone,
                        bar.continuesLeft ? "rounded-l-none" : "rounded-l",
                        bar.continuesRight ? "rounded-r-none" : "rounded-r"
                      )}
                      title={bar.task.title}
                    >
                      {bar.continuesLeft && "◀ "}{bar.task.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
