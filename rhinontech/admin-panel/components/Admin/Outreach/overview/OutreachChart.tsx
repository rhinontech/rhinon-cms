"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../shared/EmptyState";
import { TbActivity } from "react-icons/tb";

interface Point { date: string; drafted: number; sent: number; replied: number }

const CHART_CONFIG: ChartConfig = {
  sent: { label: "Sent", color: "var(--chart-1)" },
  drafted: { label: "Drafted", color: "var(--chart-2)" },
  replied: { label: "Replied", color: "var(--chart-4)" },
};

export function OutreachChart({ data, loading }: { data: Point[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  if (data.length === 0) {
    return <EmptyState icon={<TbActivity size={36} />} title="No activity in the last 14 days" className="py-12" />;
  }

  return (
    <ChartContainer config={CHART_CONFIG} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-sent)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-sent)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillDrafted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-drafted)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-drafted)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={32}
          tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={28} allowDecimals={false} />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            />
          }
        />
        <Area dataKey="drafted" type="monotone" fill="url(#fillDrafted)" stroke="var(--color-drafted)" strokeWidth={2} />
        <Area dataKey="sent" type="monotone" fill="url(#fillSent)" stroke="var(--color-sent)" strokeWidth={2} />
        <Area dataKey="replied" type="monotone" fill="none" stroke="var(--color-replied)" strokeWidth={2} />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
