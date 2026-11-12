import { fyLabel } from "@/lib/format";
import { useRev } from "@/lib/store";
import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { ChevronLeft, ChevronRight, Plus } from "@/components/icons";
import { useState } from "react";
import { MonthGrid, TimeSwitch } from "@/components/rhinon/time";
import { Avatar, Badge, Button, Chip, Display, Eyebrow, Field, Screen, SectionLabel, Sheet, TopBar, inputClass, stagger } from "@/components/rhinon/ui";
import { MONTH_LONG, plural, rangeLabel, workingDays } from "@/lib/format";
import { TODAY, WHOS_OFF, nameOf } from "@/lib/mock-data";
import { actions, useApp } from "@/lib/store";
import { TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
export default function LeavePage() {
  useRev();
  const balances = useApp(s => s.balances);
  const leave = useApp(s => s.leave);
  const [applying, setApplying] = useState(false);
  return <Screen>
      <TopBar title="Time" fallback="/more" />
      <TimeSwitch current="leave" />

      <View className="mt-7 animate-rise">
        <Eyebrow tone="sky">Leave · {fyLabel()}</Eyebrow>
        <Display size="hero" className="mt-3">
          Time off,
          {"\n"}
          sorted.
        </Display>
      </View>

      <View className="no-scrollbar -mx-5 mt-6 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5">
        {balances.map((b, i) => <View key={b.id} className={cn("flex h-[188px] min-w-[158px] animate-rise snap-start flex-col justify-between rounded-3xl p-4", TONES[b.tone].solid)} style={stagger(i)}>
            <View className="flex items-center justify-between font-mono text-[11px] font-medium uppercase tracking-[0.16em]">
              <Span>{b.name}</Span>
              <Span className="opacity-70">{b.short}</Span>
            </View>
            <View>
              <Text className="font-display text-[length:calc(92px*var(--ds))] font-black leading-[0.76]">
                {b.total - b.used - b.pending}
              </Text>
              <View className="mt-2.5 font-mono text-[11px] uppercase leading-snug tracking-[0.12em]">
                <Span className="opacity-90">left of {b.total}</Span>
                <View className="block min-h-[1.4em] opacity-90">
                  {b.pending > 0 ? `${b.pending} pending` : ""}
                </View>
              </View>
            </View>
          </View>)}
      </View>

      <Button tone="ink" className="mt-5" icon={Plus} onClick={() => setApplying(true)}>
        Apply for leave
      </Button>

      <SectionLabel className="mt-10">Who's off</SectionLabel>
      <View className="mt-4 divide-y divide-line/70 rounded-3xl border border-line/70 bg-card px-4">
        {WHOS_OFF.map(w => <View key={w.who} className="flex items-center gap-3 py-3.5">
            <Avatar name={nameOf(w.who)} size={40} />
            <View className="min-w-0 flex-1">
              <Text className="font-semibold leading-tight">{nameOf(w.who)}</Text>
              <Text className="text-[13px] text-ink/55">{w.when}</Text>
            </View>
            <Badge tone="sky">{w.kind}</Badge>
          </View>)}
      </View>

      <SectionLabel className="mt-10">My requests</SectionLabel>
      <View className="mt-4 space-y-2.5">
        {leave.map((r, i) => <View key={r.id} className="animate-rise rounded-2xl border border-line/70 bg-card p-4" style={stagger(Math.min(i, 5))}>
            <View className="flex items-center justify-between gap-3">
              <Badge tone="ink" dot={false}>
                {r.type}
              </Badge>
              <Badge tone={r.status === "Approved" ? "leaf" : r.status === "Rejected" ? "coral" : "sun"}>
                {r.status}
              </Badge>
            </View>
            <Text className="mt-3 font-display text-[length:calc(30px*var(--ds))] font-black leading-none">
              {rangeLabel(r.from, r.to)}
            </Text>
            <Text className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/55">
              {plural(r.days, "working day")}
            </Text>
            <Text className="mt-2.5 text-[14.5px] text-ink/75">{r.reason}</Text>
            {r.note ? <Text className="mt-2.5 rounded-xl bg-paper-deep px-3 py-2 text-[13.5px] italic text-ink/70">
                “{r.note}” — Manager
              </Text> : null}
          </View>)}
      </View>

      <ApplySheet open={applying} onClose={() => setApplying(false)} />
    </Screen>;
}
function ApplySheet({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const balances = useApp(s => s.balances);
  const [type, setType] = useState("Casual");
  const [month, setMonth] = useState<number>(TODAY.month);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [phase, setPhase] = useState<"start" | "end">("start");
  const [reason, setReason] = useState("");
  const bal = balances.find(b => b.name === type);
  const left = bal ? bal.total - bal.used - bal.pending : 0;
  const days = from && to ? workingDays(from, to) : 0;
  const pick = (iso: string) => {
    if (phase === "start" || !from || iso < from) {
      setFrom(iso);
      setTo(iso);
      setPhase("end");
    } else {
      setTo(iso);
      setPhase("start");
    }
  };
  const submit = () => {
    if (!from || !to) return;
    actions.applyLeave(type, from, to, reason.trim());
    setFrom(null);
    setTo(null);
    setReason("");
    setPhase("start");
    onClose();
  };
  return <Sheet open={open} onClose={onClose} eyebrow="Leave request" title="When are you off?">
      <View className="space-y-5">
        <Field label="Type">
          <View className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {balances.map(b => <Chip key={b.id} tone={b.tone} active={type === b.name} count={undefined} onClick={() => setType(b.name)}>
                {b.name} · {b.total - b.used - b.pending}
              </Chip>)}
          </View>
        </Field>

        <View className="rounded-3xl border border-line/70 bg-card p-4">
          <View className="mb-3 flex items-center justify-between">
            <Display as="h3" size="md">
              {MONTH_LONG[month]} {TODAY.year}
            </Display>
            <View className="flex gap-1.5">
              <Pressable accessibilityLabel="Previous month" disabled={month <= TODAY.month} onPress={() => setMonth(m => m - 1)} className="press grid size-9 place-items-center rounded-full border border-ink/15 disabled:opacity-30">
                <ChevronLeft size={18} />
              </Pressable>
              <Pressable accessibilityLabel="Next month" disabled={month >= TODAY.month + 1} onPress={() => setMonth(m => m + 1)} className="press grid size-9 place-items-center rounded-full border border-ink/15 disabled:opacity-30">
                <ChevronRight size={18} />
              </Pressable>
            </View>
          </View>
          <MonthGrid year={TODAY.year} month={month} range={{
          from,
          to
        }} minIso={TODAY.iso} onPick={pick} />
          <Text className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/55">
            {phase === "start" ? "Tap a start date" : "Tap an end date, or keep one day"}
          </Text>
        </View>

        {from && to ? <View className="flex flex-wrap items-center gap-2">
            <Badge tone="sky">{rangeLabel(from, to)}</Badge>
            <Badge tone="ink" dot={false}>
              {plural(days, "working day")}
            </Badge>
            <Span className={cn("text-[13px]", days > left ? "font-semibold text-coral-deep" : "text-ink/60")}>
              {days > left ? "Over your balance" : `${left - days} left after`}
            </Span>
          </View> : null}

        <Field label="Reason" hint="optional">
          <TextInput className={inputClass} value={reason} onChangeText={text => setReason(text)} placeholder="e.g. Family function" />
        </Field>
        <Button tone="ink" disabled={!from} onClick={submit}>
          Request leave
        </Button>
      </View>
    </Sheet>;
}