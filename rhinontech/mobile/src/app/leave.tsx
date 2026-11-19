import { fyLabel } from "@/lib/format";
import { useRev, usePerm } from "@/lib/store";
import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { ChevronLeft, ChevronRight, Check, Plus, X } from "@/components/icons";
import { useState, useEffect } from "react";
import { MonthGrid, TimeSwitch } from "@/components/rhinon/time";
import { Avatar, Badge, Button, Chip, Display, Empty, Eyebrow, Field, Screen, SectionLabel, Sheet, TopBar, inputClass, stagger } from "@/components/rhinon/ui";
import { MONTH_LONG, plural, rangeLabel, workingDays } from "@/lib/format";
import { TODAY, WHOS_OFF, nameOf } from "@/lib/mock-data";
import { actions, useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";

type AdminLeaveRequest = { id: string; userId: string; userName: string; leaveTypeName: string; startDate: string; endDate: string; days: number; reason: string; status: "Pending" | "Approved" | "Rejected" };

function AdminLeavePage() {
  useRev();
  const [requests, setRequests] = useState<AdminLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    api<AdminLeaveRequest[]>("/leave/requests")
      .then((r) => setRequests(Array.isArray(r) ? r : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const act = async (id: string, action: "approve" | "reject") => {
    setActing(id);
    try {
      await api(`/leave/requests/${id}/action`, { method: "PUT", body: { status: action === "approve" ? "Approved" : "Rejected" } });
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: action === "approve" ? "Approved" : "Rejected" } : r));
    } catch (e) {
      actions.toast(e instanceof Error ? e.message : "Failed", "coral");
    }
    setActing(null);
  };

  const pending = requests.filter((r) => r.status === "Pending");
  const past = requests.filter((r) => r.status !== "Pending");

  return (
    <Screen>
      <TopBar title="Time" fallback="/more" />
      <TimeSwitch current="leave" />
      <View className="mt-7 animate-rise">
        <Eyebrow tone="sky">Leave · {fyLabel()}</Eyebrow>
        <Display size="hero" className="mt-3">Team{"\n"}leave.</Display>
      </View>

      <View className="mt-6 grid grid-cols-2 gap-2.5 animate-rise" style={stagger(1)}>
        <View className="rounded-2xl bg-sun/35 p-4">
          <Text className="font-display text-[length:calc(36px*var(--ds))] font-black leading-none">{pending.length}</Text>
          <Text className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">Pending approval</Text>
        </View>
        <View className="rounded-2xl bg-leaf/15 p-4">
          <Text className="font-display text-[length:calc(36px*var(--ds))] font-black leading-none">{requests.filter((r) => r.status === "Approved").length}</Text>
          <Text className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">Approved</Text>
        </View>
      </View>

      {loading ? (
        <Empty title="Loading…" body="Fetching leave requests." tone="sky" />
      ) : requests.length === 0 ? (
        <Empty title="No requests" body="Leave requests will appear here." tone="sky" />
      ) : (
        <>
          {pending.length > 0 ? (
            <>
              <SectionLabel className="mt-8">Needs your approval</SectionLabel>
              <View className="mt-2 space-y-2.5">
                {pending.map((r, i) => (
                  <View key={r.id} className="animate-rise rounded-2xl border border-line/70 bg-card p-4" style={stagger(Math.min(i, 5))}>
                    <View className="flex items-start justify-between gap-3">
                      <View className="min-w-0">
                        <Text className="text-[16px] font-semibold">{r.userName}</Text>
                        <Text className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink/55">{r.leaveTypeName} · {rangeLabel(r.startDate, r.endDate)} · {plural(r.days, "day")}</Text>
                      </View>
                      <Badge tone="sun">Pending</Badge>
                    </View>
                    {r.reason ? <Text className="mt-2 text-[14px] text-ink/70">"{r.reason}"</Text> : null}
                    <View className="mt-3 flex gap-2">
                      <Pressable
                        onPress={() => act(r.id, "reject")}
                        disabled={acting === r.id}
                        className="press flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-card text-[14px] font-semibold text-coral-deep disabled:opacity-50"
                      >
                        <X size={16} /><Text>Decline</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => act(r.id, "approve")}
                        disabled={acting === r.id}
                        className="press flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-leaf text-[14px] font-semibold text-leaf-foreground disabled:opacity-50"
                      >
                        <Check size={16} /><Text>Approve</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}
          {past.length > 0 ? (
            <>
              <SectionLabel className="mt-8">Recent</SectionLabel>
              <View className="mt-2 space-y-2.5">
                {past.slice(0, 10).map((r, i) => (
                  <View key={r.id} className="animate-rise flex items-center gap-3 border-b border-line/70 py-3.5 last:border-0" style={stagger(Math.min(i, 5))}>
                    <View className="min-w-0 flex-1">
                      <Text className="text-[15px] font-semibold">{r.userName}</Text>
                      <Text className="mt-0.5 text-[13px] text-ink/55">{r.leaveTypeName} · {rangeLabel(r.startDate, r.endDate)}</Text>
                    </View>
                    <Badge tone={r.status === "Approved" ? "leaf" : "coral"}>{r.status}</Badge>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

export default function LeavePage() {
  useRev();
  const isAdmin = usePerm("leave", "write");
  if (isAdmin) return <AdminLeavePage />;
  return <EmployeeLeavePage />;
}

function EmployeeLeavePage() {
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