import { View, Span, Pressable } from "@/components/rn";
import { useRouter } from "@/lib/router";
import { toIso } from "@/lib/format";
import type { Mark } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Segmented } from "./ui";

/** Attendance and Leave are one module; this switch sits at the top of both. */
export function TimeSwitch({ current }: { current: "attendance" | "leave" }) {
  const router = useRouter();
  return (
    <Segmented
      value={current}
      onChange={(v) =>
        void router.navigate({
          to: v === "leave" ? "/leave" : "/attendance",
          replace: true,
        })
      }
      options={[
        {
          value: "attendance",
          label: "Attendance",
        },
        {
          value: "leave",
          label: "Leave",
        },
      ]}
    />
  );
}
const MARK_CLASS: Record<Mark, string> = {
  present: "bg-leaf/20",
  late: "bg-sun/50",
  leave: "bg-sky/45",
  holiday: "bg-violet/15",
  absent: "bg-coral/20",
};
export const MARK_LEGEND: {
  mark: Mark;
  label: string;
  dot: string;
}[] = [
  {
    mark: "present",
    label: "Present",
    dot: "bg-leaf",
  },
  {
    mark: "late",
    label: "Late",
    dot: "bg-sun",
  },
  {
    mark: "leave",
    label: "Leave",
    dot: "bg-sky",
  },
  {
    mark: "holiday",
    label: "Holiday",
    dot: "bg-violet",
  },
  {
    mark: "absent",
    label: "Absent",
    dot: "bg-coral",
  },
];
export function MarkLegend() {
  return (
    <View className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
      {MARK_LEGEND.map((l) => (
        <View
          key={l.mark}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/60"
        >
          <View className={cn("size-2.5 rounded-[4px]", l.dot)} />
          {l.label}
        </View>
      ))}
    </View>
  );
}

/**
 * A Monday-first month. Used read-only for attendance and as a range picker when applying for leave.
 * Marks are keyed by day of month.
 */
export function MonthGrid({
  year,
  month,
  today,
  marks,
  range,
  minIso,
  onPick,
}: {
  year: number;
  month: number;
  today?: number | undefined;
  marks?: Record<number, Mark> | undefined;
  range?:
    | {
        from: string | null;
        to: string | null;
      }
    | undefined;
  minIso?: string | undefined;
  onPick?: ((iso: string) => void) | undefined;
}) {
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array.from(
      {
        length: offset,
      },
      () => null,
    ),
    ...Array.from(
      {
        length: count,
      },
      (_, i) => i + 1,
    ),
  ];
  return (
    <View>
      <View className="mb-2 grid grid-cols-7 gap-1.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <Span key={i}>{d}</Span>
        ))}
      </View>
      <View className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (d === null) return <Span key={`b${i}`} />;
          const iso = toIso(year, month, d);
          const weekend = (offset + d - 1) % 7 >= 5;
          const mark = marks?.[d];
          const isToday = today === d;
          const disabled = minIso ? iso < minIso : false;
          const isEdge = range?.from === iso || range?.to === iso;
          const between = !!range?.from && !!range.to && iso > range.from && iso < range.to;
          const cls = cn(
            "grid aspect-square place-items-center rounded-xl font-mono text-[13px] transition-colors",
            mark && MARK_CLASS[mark],
            weekend && !isEdge && "text-ink/35",
            between && "bg-sun/50",
            isEdge && "bg-ink font-semibold text-paper",
            isToday && "font-semibold outline outline-2 -outline-offset-2 outline-ink",
            disabled && "pointer-events-none opacity-30",
          );
          return onPick ? (
            <Pressable
              key={d}
              disabled={disabled}
              accessibilityLabel={iso}
              onPress={() => onPick(iso)}
              className={cn(cls, "press")}
            >
              {d}
            </Pressable>
          ) : (
            <View key={d} className={cls}>
              {d}
            </View>
          );
        })}
      </View>
    </View>
  );
}
