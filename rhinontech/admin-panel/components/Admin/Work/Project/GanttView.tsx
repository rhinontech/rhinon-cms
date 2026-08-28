"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { addDays, differenceInCalendarDays, eachDayOfInterval, format, isSameDay, startOfDay, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { TbChevronDown, TbChevronRight, TbLink, TbUnlink } from "react-icons/tb";
import { STATUS_CHIP, STATUS_DOT } from "./constants";
import type { ProjectTask, TaskRow, WorkflowStatus } from "./types";

const DAY_W = 34;
const ROW_H = 34;
const LEFT_W = 460;

interface Placed {
  row: TaskRow;
  index: number;
  /** Day offsets from the timeline origin; null when the task has no dates. */
  startOffset: number | null;
  span: number;
  /** Summary bars are derived from children rather than the task's own dates. */
  isSummary: boolean;
}

function intervalOf(t: ProjectTask): { start: Date; end: Date } | null {
  const s = t.startDate ? startOfDay(new Date(t.startDate)) : null;
  const e = t.dueDate ? startOfDay(new Date(t.dueDate)) : null;
  if (!s && !e) return null;
  const start = s ?? e!;
  const end = e ?? s!;
  return end < start ? { start: end, end: start } : { start, end };
}

export function GanttView({
  rows, statuses, collapsed, onToggleCollapsed, onPatch, onOpenTask, onAddDependency, onRemoveDependency,
}: {
  rows: TaskRow[];
  statuses: WorkflowStatus[];
  collapsed: Set<string>;
  onToggleCollapsed: (id: string) => void;
  onPatch: (id: string, patch: Record<string, unknown>) => void;
  onOpenTask: (task: ProjectTask) => void;
  onAddDependency: (successorId: string, predecessorId: string) => void;
  onRemoveDependency: (taskId: string, depId: string) => void;
}) {
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; mode: "move" | "resize"; dx: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Timeline window: the span of all dated work, padded a week each side so
  // bars never touch the edge and there is room to drag.
  const { origin, days } = useMemo(() => {
    const ivs = rows.map((r) => intervalOf(r.task)).filter(Boolean) as { start: Date; end: Date }[];
    const today = startOfDay(new Date());
    const min = ivs.length ? new Date(Math.min(...ivs.map((i) => i.start.getTime()))) : today;
    const max = ivs.length ? new Date(Math.max(...ivs.map((i) => i.end.getTime()))) : addDays(today, 21);
    const start = startOfWeek(addDays(min, -7));
    const end = addDays(max, 7);
    return { origin: start, days: eachDayOfInterval({ start, end }) };
  }, [rows]);

  const dayIndex = useCallback((d: Date) => differenceInCalendarDays(d, origin), [origin]);

  /** Children roll up into a summary bar on their parent, as Gantt convention expects. */
  const placed = useMemo<Placed[]>(() => {
    const childrenOf = new Map<string, ProjectTask[]>();
    for (const { task } of rows) {
      if (!task.parentTaskId) continue;
      if (!childrenOf.has(task.parentTaskId)) childrenOf.set(task.parentTaskId, []);
      childrenOf.get(task.parentTaskId)!.push(task);
    }

    return rows.map((row, index) => {
      const own = intervalOf(row.task);
      const kids = childrenOf.get(row.task.id) ?? [];
      const kidIvs = kids.map(intervalOf).filter(Boolean) as { start: Date; end: Date }[];

      let iv = own;
      let isSummary = false;
      if (!own && kidIvs.length) {
        iv = {
          start: new Date(Math.min(...kidIvs.map((i) => i.start.getTime()))),
          end: new Date(Math.max(...kidIvs.map((i) => i.end.getTime()))),
        };
        isSummary = true;
      }

      if (!iv) return { row, index, startOffset: null, span: 0, isSummary: false };
      return {
        row,
        index,
        startOffset: dayIndex(iv.start),
        span: Math.max(1, dayIndex(iv.end) - dayIndex(iv.start) + 1),
        isSummary,
      };
    });
  }, [rows, dayIndex]);

  const byId = useMemo(() => new Map(placed.map((p) => [p.row.task.id, p])), [placed]);

  /**
   * Dependency arrows: predecessor's right edge to successor's left edge, drawn
   * as an orthogonal path so crossings stay readable.
   */
  const arrows = useMemo(() => {
    const out: { d: string; key: string }[] = [];
    for (const p of placed) {
      for (const dep of p.row.task.dependsOn ?? []) {
        const from = byId.get(dep.predecessorId);
        if (!from || from.startOffset === null || p.startOffset === null) continue;
        const x1 = (from.startOffset + from.span) * DAY_W;
        const y1 = from.index * ROW_H + ROW_H / 2;
        const x2 = p.startOffset * DAY_W;
        const y2 = p.index * ROW_H + ROW_H / 2;
        const midX = x2 - 10 > x1 + 8 ? x2 - 10 : x1 + 8;
        out.push({
          key: dep.id,
          d: `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`,
        });
      }
    }
    return out;
  }, [placed, byId]);

  const todayX = dayIndex(startOfDay(new Date())) * DAY_W;

  /** Drag a bar to reschedule; the right edge resizes the duration. */
  const onBarPointerDown = (e: React.PointerEvent, p: Placed, mode: "move" | "resize") => {
    if (p.startOffset === null || p.isSummary) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const task = p.row.task;
    const origStart = p.startOffset;
    const origSpan = p.span;
    setDrag({ id: task.id, mode, dx: 0 });

    const onMove = (ev: PointerEvent) => {
      setDrag({ id: task.id, mode, dx: Math.round((ev.clientX - startX) / DAY_W) });
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDrag(null);
      const shift = Math.round((ev.clientX - startX) / DAY_W);
      if (!shift) return;
      const iso = (d: Date) => format(d, "yyyy-MM-dd");
      if (mode === "move") {
        onPatch(task.id, {
          startDate: iso(addDays(origin, origStart + shift)),
          dueDate: iso(addDays(origin, origStart + shift + origSpan - 1)),
        });
      } else {
        const nextSpan = Math.max(1, origSpan + shift);
        onPatch(task.id, {
          // A resize needs an explicit start, or the bar has no anchor to grow from.
          startDate: iso(addDays(origin, origStart)),
          dueDate: iso(addDays(origin, origStart + nextSpan - 1)),
        });
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleLinkClick = (taskId: string) => {
    if (!linkFrom) { setLinkFrom(taskId); return; }
    if (linkFrom === taskId) { setLinkFrom(null); return; }
    onAddDependency(taskId, linkFrom);
    setLinkFrom(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {linkFrom && (
        <div className="flex shrink-0 items-center gap-2 border-b bg-blue-50 dark:bg-blue-400/10 px-4 py-1.5 text-[11px] text-blue-800 dark:text-blue-200">
          <TbLink size={13} />
          Now click the task that should wait for this one.
          <button onClick={() => setLinkFrom(null)} className="ml-auto font-medium underline">Cancel</button>
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        <div className="relative" style={{ width: LEFT_W + days.length * DAY_W }}>
          {/* header */}
          <div className="sticky top-0 z-30 flex bg-card">
            <div
              className="sticky left-0 z-10 grid shrink-0 items-center border-b border-r bg-muted/40 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              style={{ width: LEFT_W, height: 44, gridTemplateColumns: "1fr 110px 90px 90px" }}
            >
              <span className="px-1">Name</span>
              <span>Status</span>
              <span>Start</span>
              <span>Due</span>
            </div>
            <div className="border-b bg-muted/40" style={{ width: days.length * DAY_W, height: 44 }}>
              <div className="flex h-5 items-center">
                {days.map((d, i) =>
                  d.getDay() === 0 ? (
                    <span
                      key={i}
                      className="shrink-0 border-l px-1 text-[10px] font-semibold text-muted-foreground"
                      style={{ width: DAY_W * 7 }}
                    >
                      {format(d, "'W'w  d MMM")}
                    </span>
                  ) : null
                )}
              </div>
              <div className="flex h-6">
                {days.map((d, i) => (
                  <span
                    key={i}
                    className={cn(
                      "shrink-0 border-l text-center text-[10px] leading-6",
                      [0, 6].includes(d.getDay()) ? "bg-muted text-muted-foreground" : "text-muted-foreground"
                    )}
                    style={{ width: DAY_W }}
                  >
                    {format(d, "d")}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* body */}
          <div className="relative flex">
            <div className="sticky left-0 z-20 shrink-0 border-r bg-card" style={{ width: LEFT_W }}>
              {placed.map(({ row, index }) => (
                <div
                  key={row.task.id}
                  className="grid items-center border-b px-2 text-sm hover:bg-muted/40"
                  style={{ height: ROW_H, gridTemplateColumns: "1fr 110px 90px 90px" }}
                >
                  <span className="flex min-w-0 items-center gap-1" style={{ paddingLeft: row.depth * 16 }}>
                    {row.hasChildren ? (
                      <button onClick={() => onToggleCollapsed(row.task.id)} className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted">
                        {collapsed.has(row.task.id) ? <TbChevronRight size={13} /> : <TbChevronDown size={13} />}
                      </button>
                    ) : <span className="w-[18px] shrink-0" />}
                    <button data-task-opener onClick={() => onOpenTask(row.task)} className="truncate text-left hover:underline">
                      {row.task.title}
                    </button>
                  </span>
                  <span>
                    {row.task.workflowStatus && (
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", STATUS_CHIP[row.task.workflowStatus.color] ?? STATUS_CHIP.stone)}>
                        {row.task.workflowStatus.name}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {row.task.startDate ? format(new Date(row.task.startDate), "dd/MM/yy") : "—"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {row.task.dueDate ? format(new Date(row.task.dueDate), "dd/MM/yy") : "—"}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative" style={{ width: days.length * DAY_W, height: placed.length * ROW_H }}>
              {/* day grid */}
              <div className="absolute inset-0 flex">
                {days.map((d, i) => (
                  <div
                    key={i}
                    className={cn("h-full shrink-0 border-l", [0, 6].includes(d.getDay()) && "bg-muted/40")}
                    style={{ width: DAY_W }}
                  />
                ))}
              </div>
              {/* row separators */}
              <div className="absolute inset-0">
                {placed.map((p) => (
                  <div key={p.row.task.id} className="border-b" style={{ height: ROW_H }} />
                ))}
              </div>

              {todayX >= 0 && (
                <div className="absolute top-0 z-10 w-px bg-red-500" style={{ left: todayX, height: placed.length * ROW_H }} />
              )}

              <svg className="pointer-events-none absolute inset-0 z-20 overflow-visible" width={days.length * DAY_W} height={placed.length * ROW_H}>
                <defs>
                  <marker id="gantt-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#78716c" />
                  </marker>
                </defs>
                {arrows.map((a) => (
                  <path key={a.key} d={a.d} fill="none" stroke="#78716c" strokeWidth="1.2" strokeDasharray="3 2" markerEnd="url(#gantt-arrow)" />
                ))}
              </svg>

              {placed.map((p) => {
                if (p.startOffset === null) return null;
                const shift = drag?.id === p.row.task.id ? drag.dx : 0;
                const left = (p.startOffset + (drag?.mode === "move" ? shift : 0)) * DAY_W;
                const width = Math.max(1, p.span + (drag?.mode === "resize" && drag.id === p.row.task.id ? shift : 0)) * DAY_W;
                const color = p.row.task.workflowStatus?.color ?? "stone";
                return (
                  <div
                    key={p.row.task.id}
                    className="absolute z-10 flex items-center"
                    style={{ top: p.index * ROW_H + 6, left, width, height: ROW_H - 12 }}
                  >
                    <div
                      onPointerDown={(e) => onBarPointerDown(e, p, "move")}
                      onClick={() => linkFrom !== null && handleLinkClick(p.row.task.id)}
                      title={p.isSummary ? "Rolled up from subitems" : "Drag to reschedule"}
                      className={cn(
                        "group relative flex h-full w-full items-center overflow-hidden px-1.5",
                        p.isSummary
                          ? "rounded-sm bg-muted-foreground/40"
                          : cn("cursor-grab rounded", STATUS_CHIP[color] ?? STATUS_CHIP.stone),
                        linkFrom === p.row.task.id && "ring-2 ring-blue-500"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[color] ?? STATUS_DOT.stone)} />
                      <span className="ml-1 truncate text-[10px] font-medium">{p.row.task.title}</span>
                      {!p.isSummary && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleLinkClick(p.row.task.id); }}
                            title="Link to another task"
                            className="absolute right-3 hidden rounded bg-card/70 p-0.5 group-hover:block"
                          >
                            <TbLink size={10} />
                          </button>
                          <span
                            onPointerDown={(e) => onBarPointerDown(e, p, "resize")}
                            title="Drag to change duration"
                            className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize bg-foreground/10 opacity-0 group-hover:opacity-100"
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {!rows.length && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nothing to schedule yet.</p>
      )}
    </div>
  );
}
