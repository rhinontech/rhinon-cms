import { View, Text, Span, TextInput } from "@/components/rn";
import { Coffee, Play, RotateCcw, Square } from "@/components/icons";
import { useState } from "react";
import { MarkLegend, MonthGrid, TimeSwitch } from "@/components/rhinon/time";
import { Badge, Button, Chip, Display, Eyebrow, Field, Meta, ProgressBar, Screen, SectionLabel, Sheet, TopBar, inputClass } from "@/components/rhinon/ui";
import { clockTime, hm, hms } from "@/lib/format";
import { ATTENDANCE_NOV, TODAY } from "@/lib/mock-data";
import { actions, breakMsNow, useApp, useNow, workedMs } from "@/lib/store";
import { cn } from "@/lib/utils";
const SHIFT_MS = 8 * 3600_000;
const HEADLINE = {
  out: ["Ready when", "you are."],
  in: ["You're on", "the clock."],
  break: ["Taking", "five."],
  done: ["Day", "logged."]
} as const;
const STATUS_LABEL = {
  out: "Not clocked in",
  in: "Working",
  break: "On break",
  done: "Day logged"
} as const;
export default function AttendancePage() {
  const clock = useApp(s => s.clock);
  const regs = useApp(s => s.regularizations);
  const running = clock.status === "in" || clock.status === "break";
  const now = useNow(running);
  const worked = workedMs(clock, now);
  const breaks = breakMsNow(clock, now);
  const [asking, setAsking] = useState(false);
  const headline = HEADLINE[clock.status];
  return <Screen>
      <TopBar title="Time" fallback="/more" />
      <TimeSwitch current="attendance" />

      <View className="mt-7 animate-rise">
        <Eyebrow tone="leaf">{TODAY.label} · IST</Eyebrow>
        <Display size="hero" className="mt-3">
          {headline[0]}
          {"\n"}
          {headline[1]}
        </Display>
      </View>

      <View className="mt-6 animate-rise overflow-hidden rounded-4xl bg-leaf p-5 text-leaf-foreground">
        <View className="flex items-center justify-between">
          <View className="inline-flex items-center gap-2 rounded-full bg-paper/15 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em]">
            <View className="relative flex size-2">
              <View className={cn("absolute inset-0 rounded-full bg-paper", running && "animate-ping-soft")} />
              <View className="relative size-2 rounded-full bg-paper" />
            </View>
            {STATUS_LABEL[clock.status]}
          </View>
          <Span className="font-mono text-[11px] tracking-[0.12em] opacity-85">
            SHIFT 09:30 – 18:30
          </Span>
        </View>

        <View className="mt-7 flex items-baseline gap-2 font-display font-black leading-[0.8]" accessibilityLabel={hms(worked)}>
          <Span className="text-[length:calc(96px*var(--ds))]">{hms(worked).slice(0, 5)}</Span>
          <Span className="font-mono text-[26px] font-medium opacity-80">
            {hms(worked).slice(5)}
          </Span>
        </View>

        <View className="mt-6">
          <ProgressBar value={worked / SHIFT_MS} tone="paper" track="bg-paper/20" className="h-2.5" />
          <View className="mt-2.5 flex justify-between font-mono text-[11px] uppercase tracking-[0.12em] opacity-90">
            <Span>{hm(worked)} worked</Span>
            <Span>{worked >= SHIFT_MS ? "Target met" : `${hm(SHIFT_MS - worked)} to go`}</Span>
          </View>
        </View>

        <View className="mt-6">
          {clock.status === "out" ? <Button tone="paper" icon={Play} onClick={actions.clockIn}>
              Clock in
            </Button> : null}
          {running ? <View className="grid grid-cols-2 gap-3">
              <Button tone="outline" className="border-paper/40 text-leaf-foreground" icon={clock.status === "in" ? Coffee : Play} onClick={clock.status === "in" ? actions.startBreak : actions.endBreak}>
                {clock.status === "in" ? "Break" : "Resume"}
              </Button>
              <Button tone="paper" icon={Square} onClick={actions.clockOut}>
                Clock out
              </Button>
            </View> : null}
          {clock.status === "done" ? <Button tone="outline" className="border-paper/40 text-leaf-foreground" icon={RotateCcw} onClick={actions.resetClock}>
              Reset demo
            </Button> : null}
        </View>
      </View>

      <View className="mt-3 grid grid-cols-3 gap-2.5">
        <Meta label="Clocked in">
          <Span className="font-display text-[length:calc(28px*var(--ds))] font-black leading-none">
            {clock.inAt ? clockTime(clock.inAt) : "—"}
          </Span>
        </Meta>
        <Meta label="Breaks">
          <Span className="font-display text-[length:calc(28px*var(--ds))] font-black leading-none">
            {hm(breaks)}
          </Span>
        </Meta>
        <Meta label="Remaining">
          <Span className="font-display text-[length:calc(28px*var(--ds))] font-black leading-none">
            {hm(Math.max(0, SHIFT_MS - worked))}
          </Span>
        </Meta>
      </View>

      <SectionLabel className="mt-10">November</SectionLabel>
      <View className="mt-4 grid grid-cols-3 gap-2.5">
        {[["Present", "5"], ["Avg day", "8h24"], ["Late", "1"]].map(([label, value]) => <View key={label} className="rounded-2xl bg-leaf/12 p-3.5">
            <Text className="whitespace-nowrap font-display text-[length:calc(36px*var(--ds))] font-black leading-none">
              {value}
            </Text>
            <Text className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">
              {label}
            </Text>
          </View>)}
      </View>
      <View className="mt-3 rounded-3xl border border-line/70 bg-card p-4">
        <MonthGrid year={TODAY.year} month={TODAY.month} today={TODAY.day} marks={ATTENDANCE_NOV} />
        <MarkLegend />
      </View>

      <View className="mt-3 rounded-3xl bg-paper-deep p-5">
        <Display as="h3" size="md">
          Missed a punch?
        </Display>
        <Text className="mt-2 text-[14.5px] leading-relaxed text-ink/65">
          Ask your manager to correct a day. They will see it under Approvals.
        </Text>
        <Button tone="ink" size="md" className="mt-4" onClick={() => setAsking(true)}>
          Request a correction
        </Button>
      </View>

      <SectionLabel className="mt-10">Corrections</SectionLabel>
      <View className="mt-4 space-y-2.5">
        {regs.map(r => <View key={r.id} className="rounded-2xl border border-line/70 bg-card p-4">
            <View className="flex items-center justify-between gap-3">
              <Text className="font-display text-[length:calc(24px*var(--ds))] font-black leading-none">
                {r.date}
              </Text>
              <Badge tone={r.status === "Approved" ? "leaf" : r.status === "Rejected" ? "coral" : "sun"}>
                {r.status}
              </Badge>
            </View>
            <Text className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/55">
              {r.times}
            </Text>
            <Text className="mt-2 text-[14.5px] text-ink/75">{r.reason}</Text>
          </View>)}
      </View>

      <RegularizeSheet open={asking} onClose={() => setAsking(false)} />
    </Screen>;
}
const DATES = ["Tue 10 Nov", "Mon 9 Nov", "Fri 6 Nov", "Thu 5 Nov"];
function RegularizeSheet({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [date, setDate] = useState(DATES[0] ?? "");
  const [inAt, setInAt] = useState("09:30");
  const [outAt, setOutAt] = useState("18:30");
  const [reason, setReason] = useState("");
  const submit = () => {
    actions.requestRegularization(date, `${inAt} – ${outAt}`, reason.trim() || "Missed punch");
    setReason("");
    onClose();
  };
  return <Sheet open={open} onClose={onClose} eyebrow="Correction" title="Which day needs fixing?">
      <View className="space-y-5">
        <Field label="Date">
          <View className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {DATES.map(d => <Chip key={d} tone="leaf" active={date === d} onClick={() => setDate(d)}>
                {d}
              </Chip>)}
          </View>
        </Field>
        <View className="grid grid-cols-2 gap-3">
          <Field label="Clock in">
            <TextInput className={inputClass} value={inAt} onChangeText={text => setInAt(text)} />
          </Field>
          <Field label="Clock out">
            <TextInput className={inputClass} value={outAt} onChangeText={text => setOutAt(text)} />
          </Field>
        </View>
        <Field label="Reason">
          <TextInput className={cn(inputClass, "min-h-24 resize-none")} placeholder="What happened?" value={reason} onChangeText={text => setReason(text)} multiline />
        </Field>
        <Button tone="ink" onClick={submit}>
          Send to manager
        </Button>
      </View>
    </Sheet>;
}