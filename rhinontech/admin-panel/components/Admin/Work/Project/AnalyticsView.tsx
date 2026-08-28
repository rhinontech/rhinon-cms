"use client";

import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { CHART_HEX, CHART_INK, CHART_SEQUENTIAL } from "./constants";
import type { ProjectTask, TaskRow, WorkflowStatus } from "./types";

type BreakBy = "status" | "assignee" | "priority";

interface Datum {
  key: string;
  label: string;
  value: number;
  color: string;
}

function isOverdue(t: ProjectTask) {
  if (!t.dueDate || t.status === "Done") return false;
  return new Date(t.dueDate) < new Date(new Date().toDateString());
}

/** Headline numbers are stat tiles, never a one-bar chart. */
/**
 * Tile tints are decorative surfaces, not data encoding — the number carries the
 * value. They stay out of the chart palette so nothing reads as a series colour.
 */
const TILE_TINT = {
  neutral: "glass-card",
  blue: "border-blue-200 dark:border-blue-400/25 bg-gradient-to-br from-blue-50/80 to-white/60",
  amber: "border-amber-200 dark:border-amber-400/25 bg-gradient-to-br from-amber-50/80 to-white/60",
  rose: "border-rose-200 dark:border-rose-400/25 bg-gradient-to-br from-rose-50/80 to-white/60",
  emerald: "border-emerald-200 dark:border-emerald-400/25 bg-gradient-to-br from-emerald-50/80 to-white/60",
} as const;

function StatTile({
  label, value, sub, tint = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tint?: keyof typeof TILE_TINT;
}) {
  return (
    <div className={cn("rounded-xl border p-4", TILE_TINT[tint])}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Datum;
  return (
    <div className="rounded-lg border glass-card-solid px-3 py-2 shadow-sm">
      <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
        {d.label}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {d.value} task{d.value === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function AnalyticsView({
  rows, statuses,
}: {
  rows: TaskRow[];
  statuses: WorkflowStatus[];
}) {
  const [breakBy, setBreakBy] = useState<BreakBy>("status");
  const tasks = useMemo(() => rows.map((r) => r.task), [rows]);

  const stats = useMemo(() => {
    const all = tasks.length;
    const done = tasks.filter((t) => t.status === "Done").length;
    const active = all - done;
    const overdue = tasks.filter(isOverdue).length;
    return {
      all,
      done,
      active,
      overdue,
      progress: all ? Math.round((done / all) * 100) : 0,
    };
  }, [tasks]);

  const data = useMemo<Datum[]>(() => {
    if (breakBy === "status") {
      // Colour follows the entity: each bar wears its own status colour.
      return statuses.map((s) => ({
        key: s.id,
        label: s.name,
        value: tasks.filter((t) => t.statusId === s.id).length,
        color: CHART_HEX[s.color] ?? CHART_HEX.stone,
      }));
    }
    if (breakBy === "priority") {
      return (["High", "Medium", "Low"] as const).map((p) => ({
        key: p,
        label: p,
        value: tasks.filter((t) => t.priority === p).length,
        // Ranked magnitude — one hue; the bar length carries the value.
        color: CHART_SEQUENTIAL,
      }));
    }
    const counts = new Map<string, { label: string; value: number }>();
    for (const t of tasks) {
      const id = t.assigneeId ?? "__none";
      const label = t.assignee?.fullName ?? "Unassigned";
      const cur = counts.get(id) ?? { label, value: 0 };
      counts.set(id, { label, value: cur.value + 1 });
    }
    return [...counts.entries()]
      .map(([key, v]) => ({ key, ...v, color: CHART_SEQUENTIAL }))
      .sort((a, b) => b.value - a.value);
  }, [breakBy, tasks, statuses]);

  const chartHeight = Math.max(200, data.length * 40 + 40);

  return (
    <div className="h-full overflow-auto p-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Tasks: All" value={String(stats.all)} tint="blue" />
        <StatTile
          label="Tasks: Active"
          tint="amber"
          value={String(stats.active)}
          sub={stats.all ? `${Math.round((stats.active / stats.all) * 100)}%` : undefined}
        />
        <StatTile
          label="Tasks: Overdue"
          tint="rose"
          value={String(stats.overdue)}
          sub={stats.all ? `${Math.round((stats.overdue / stats.all) * 100)}%` : undefined}
        />
        <StatTile label="Tasks: Progress" tint="emerald" value={`${stats.progress}%`} sub={`${stats.done} / ${stats.all}`} />
      </div>

      <div className="mt-4 rounded-xl glass-card">
        {/* Controls sit in one row above the chart. */}
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
          <h2 className="text-sm font-semibold text-foreground">
            Tasks by {breakBy === "status" ? "status" : breakBy === "assignee" ? "assignee" : "priority"}
          </h2>
          <div className="ml-auto flex items-center gap-1 rounded-lg bg-muted p-0.5">
            {(["status", "assignee", "priority"] as BreakBy[]).map((b) => (
              <button
                key={b}
                onClick={() => setBreakBy(b)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition",
                  breakBy === b ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3">
          {data.length ? (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, bottom: 4, left: 8 }} barCategoryGap={6}>
                <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: CHART_INK.muted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={120}
                  tick={{ fill: CHART_INK.secondary, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false}>
                  {data.map((d) => <Cell key={d.key} fill={d.color} />)}
                  {/* Direct labels are load-bearing: two palette slots sit under
                      3:1 on this surface, and the relief rule requires them. */}
                  <LabelList
                    dataKey="value"
                    position="right"
                    style={{ fill: CHART_INK.secondary, fontSize: 11, fontWeight: 500 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">Nothing to chart yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
