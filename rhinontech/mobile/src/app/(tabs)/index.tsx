import { View, Text, Span, Pressable, Link } from "@/components/rn";
import { Path, Svg } from "react-native-svg";
import { ArrowRight, Bell, Check, Pause, Play } from "@/components/icons";
import { useState } from "react";
import { AppLink, Avatar, AvatarStack, Badge, Display, Eyebrow, Logo, Screen, SectionLabel, Tile, iconBtn, stagger } from "@/components/rhinon/ui";
import { hm, pad, rupee } from "@/lib/format";
import { CELEBRATIONS, ME, MEETINGS, PAYSLIPS, TODAY, nameOf, net } from "@/lib/mock-data";
import { actions, useApp, useNow, usePerm, workedMs } from "@/lib/store";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
type Focus = "work" | "inbox" | "time" | "pay";
export default function Home() {
  const allTasks = useApp(s => s.tasks);
  const tasks = allTasks.filter(x => x.assignee === "me");
  const threads = useApp(s => s.threads);
  const brand = useApp(s => s.brand);
  const clock = useApp(s => s.clock);
  const notifs = useApp(s => s.notifs);
  const canApprove = usePerm("approvals");
  const [focus, setFocus] = useState<Focus>("work");
  const now = useNow(clock.status === "in" || clock.status === "break");
  const open = tasks.filter(t => t.status !== "Done" && (t.group === "overdue" || t.group === "today"));
  const unread = threads.filter(t => t.unread && t.folder === "inbox" && t.brand === brand);
  const topTask = open.find(t => t.group === "overdue") ?? open[0];
  const topThread = unread[0];
  const latest = PAYSLIPS[0];
  const clockStat = clock.status === "out" ? "Not clocked in" : clock.status === "done" ? "Day logged" : clock.status === "break" ? "On break" : `${hm(workedMs(clock, now))} worked`;
  const tiles: {
    id: Focus;
    tone: Tone;
    label: string[];
    stat: string;
  }[] = [{
    id: "work",
    tone: "cobalt",
    label: ["Plan", "my day"],
    stat: `${open.length} due today`
  }, {
    id: "inbox",
    tone: "coral",
    label: ["Clear", "inbox"],
    stat: `${unread.length} unread`
  }, {
    id: "time",
    tone: "leaf",
    label: ["Log", "my time"],
    stat: clockStat
  }, {
    id: "pay",
    tone: "sun",
    label: ["Check", "pay"],
    stat: "October paid"
  }];
  const lastFrom = topThread?.messages.at(-1)?.from ?? "";
  const cards: Record<Focus, {
    title: string;
    caption: string;
    cta: string;
    to: string;
  }> = {
    work: {
      title: topTask?.title ?? "You're all caught up",
      caption: topTask ? `${topTask.due} · ${topTask.project}` : "Nothing is due today. Enjoy it.",
      cta: topTask ? "Open task" : "See all work",
      to: topTask ? `/work/${topTask.id}` : "/work"
    },
    inbox: {
      title: topThread?.subject ?? "Inbox zero",
      caption: topThread ? `${lastFrom} · ${topThread.time} · AI draft ready` : "Every thread is handled.",
      cta: topThread ? "Open thread" : "Open inbox",
      to: topThread ? `/inbox/${topThread.id}` : "/inbox"
    },
    time: {
      title: clock.status === "out" ? "Clock in for the day" : clock.status === "done" ? "Day logged. Nice work." : clock.status === "break" ? "Enjoy the break" : "You're on the clock",
      caption: clock.status === "out" ? "Your usual start is 9:30 AM · 8-hour day" : clock.status === "done" ? `${hm(workedMs(clock, now))} worked today` : `${hm(workedMs(clock, now))} so far · day ends around 6:30 PM`,
      cta: "Open attendance",
      to: "/attendance"
    },
    pay: {
      title: "October payslip is ready",
      caption: latest ? `${rupee(net(latest))} net · paid ${latest.paidOn.slice(0, 6)}` : "",
      cta: "View payslip",
      to: "/pay/oct-2026"
    }
  };
  const active = tiles.find(t => t.id === focus) ?? tiles[0]!;
  const card = cards[focus];
  const meetings = MEETINGS.filter(m => m.day === "Today").slice(0, 2);
  return <Screen>
      <View className="flex animate-rise items-center justify-between">
        <View className="flex items-center gap-2.5">
          <Logo size={32} />
          <Span className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-ink/70">
            Rhinon
          </Span>
        </View>
        <View className="flex items-center gap-2">
          <Link to="/notifications" aria-label="Notifications" className={cn(iconBtn, "relative")}>
            <Bell size={20} strokeWidth={2} />
            {notifs.some(n => n.unread) ? <View className="absolute right-2.5 top-2.5 size-2.5 rounded-full border-2 border-card bg-coral" /> : null}
          </Link>
          <Link to="/profile" aria-label="Profile">
            <Avatar name={ME.name} size={44} tone="violet" />
          </Link>
        </View>
      </View>

      <View className="mt-9 animate-rise" style={stagger(1)}>
        <Eyebrow tone="coral">{TODAY.label} · Good morning</Eyebrow>
        <Display size="hero" className="mt-3">
          What are
          {"\n"}
          you doing
          {"\n"}
          today?
        </Display>
        <Text className="mt-4 max-w-[330px] text-[17px] leading-relaxed text-ink/65">
          One home for your work, inbox and people. Start with what matters now.
        </Text>
      </View>

      <SectionLabel className="mt-9">Start here</SectionLabel>
      <View className="mt-4 grid grid-cols-2 gap-3">
        {tiles.map((t, i) => <Tile key={t.id} tone={t.tone} label={t.label} stat={t.stat} index={pad(i + 1)} selected={focus === t.id} onClick={() => setFocus(t.id)} className="animate-rise" style={stagger(i + 2)} />)}
      </View>

      <View key={focus} className="mt-7 animate-rise rounded-[calc(var(--radius)+14px)] bg-ink p-5 text-paper">
        <View className="grid size-[68px] place-items-center rounded-[calc(var(--radius)+6px)] border border-paper/10 bg-paper/5">
          <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-on-ink-accent">
            <Path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.600-2.400-6.400-7-7 4.600-.6 6.400-2.400 7-7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <Path d="M19 15.500v4M17 17.500h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </Svg>
        </View>
        <View className="mt-9 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-on-ink-accent">
          <View className={cn("size-1.5 rounded-full", TONES[active.tone].dot)} />
          Matched for “{active.label.join(" ")}”
        </View>
        <Display as="h2" size="lg" className="mt-2.5 line-clamp-3 text-paper">
          {card.title}
        </Display>
        <Text className="mt-2.5 text-[15px] leading-snug text-paper/60">{card.caption}</Text>
        <AppLink to={card.to} className="press mt-6 flex h-14 items-center justify-center gap-2 rounded-full bg-paper text-[16px] font-semibold text-ink">
          {card.cta}
          <ArrowRight size={19} strokeWidth={2.4} />
        </AppLink>
      </View>

      <SectionLabel className="mt-10">Today</SectionLabel>
      <View className="mt-4 grid grid-cols-2 gap-3">
        <ClockCard />
        {canApprove ? <ApprovalsCard /> : <LeaveCard />}
      </View>

      <View className="mt-3 rounded-3xl border border-line/80 bg-card p-4">
        <View className="mb-1 flex items-center justify-between">
          <Eyebrow>Next up</Eyebrow>
          <Link to="/meetings" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60">
            Calendar →
          </Link>
        </View>
        {meetings.map((m, i) => <View key={m.id} className="flex items-center gap-3 border-t border-line/80 py-3 first:border-0">
            <View className="w-[60px] font-display text-[length:calc(28px*var(--ds))] font-black leading-none">
              {m.start}
            </View>
            <View className="min-w-0 flex-1">
              <Text className="truncate font-semibold leading-tight">{m.title}</Text>
              <Text className="truncate text-[13px] text-ink/55">
                {m.where} · {m.kind === "client" ? "Client" : "Team"}
              </Text>
            </View>
            {i === 0 ? <Badge tone="coral">in 19 min</Badge> : <Span className="font-mono text-[11px] text-ink/45">{m.end}</Span>}
          </View>)}
      </View>

      <SectionLabel className="mt-10">Around the team</SectionLabel>
      <View className="no-scrollbar -mx-5 mt-4 flex gap-3 overflow-x-auto px-5">
        {CELEBRATIONS.map(c => <View key={c.who} className={cn("flex min-w-[224px] items-center gap-3 rounded-2xl p-3", TONES[c.tone].soft)}>
            <Avatar name={nameOf(c.who)} size={46} />
            <View className="min-w-0">
              <Text className="truncate font-semibold leading-tight">{nameOf(c.who)}</Text>
              <Text className="text-[13px] text-ink/60">{c.what}</Text>
            </View>
          </View>)}
      </View>
    </Screen>;
}
function ClockCard() {
  const clock = useApp(s => s.clock);
  const now = useNow(clock.status === "in" || clock.status === "break");
  const total = Math.floor(workedMs(clock, now) / 1000);
  const label = {
    out: "Not clocked in",
    in: "Working",
    break: "On break",
    done: "Day logged"
  }[clock.status];
  const act = clock.status === "out" ? {
    fn: actions.clockIn,
    icon: Play,
    name: "Clock in"
  } : clock.status === "in" ? {
    fn: actions.startBreak,
    icon: Pause,
    name: "Start break"
  } : clock.status === "break" ? {
    fn: actions.endBreak,
    icon: Play,
    name: "End break"
  } : {
    fn: () => undefined,
    icon: Check,
    name: "Day logged"
  };
  const Icon = act.icon;
  return <View className="press relative flex h-[188px] flex-col justify-between overflow-hidden rounded-3xl bg-leaf p-4 text-leaf-foreground">
      <Link to="/attendance" aria-label="Open attendance" className="absolute inset-0 z-0" />
      <Eyebrow className="pointer-events-none relative z-10 text-leaf-foreground/85">
        Attendance
      </Eyebrow>
      <Pressable accessibilityLabel={act.name} onPress={act.fn} disabled={clock.status === "done"} className="press absolute right-3 top-3 z-20 grid size-11 place-items-center rounded-full bg-paper text-ink">
        <Icon size={18} strokeWidth={2.4} fill={clock.status === "done" ? "none" : "currentColor"} />
      </Pressable>
      <View className="pointer-events-none relative z-10">
        <View className="block font-display text-[length:calc(66px*var(--ds))] font-black leading-[0.8]">
          {pad(Math.floor(total / 3600))}:{pad(Math.floor(total % 3600 / 60))}
        </View>
        <Text className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.14em] opacity-90">
          {label}
        </Text>
      </View>
    </View>;
}

/** What an employee sees where a manager sees Approvals. */
function LeaveCard() {
  return <Link to="/leave" className="press relative flex h-[188px] flex-col justify-between overflow-hidden rounded-3xl bg-sky p-4 text-sky-foreground">
      <Eyebrow className="text-sky-foreground/85">Leave</Eyebrow>
      <View>
        <Span className="font-display text-[length:calc(92px*var(--ds))] font-black leading-[0.76]">
          5
        </Span>
        <Text className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.14em] opacity-90">
          casual days left
        </Text>
      </View>
    </Link>;
}
function ApprovalsCard() {
  const approvals = useApp(s => s.approvals);
  return <Link to="/approvals" className="press relative flex h-[188px] flex-col justify-between overflow-hidden rounded-3xl bg-violet p-4 text-violet-foreground">
      <Eyebrow className="text-violet-foreground/85">Approvals</Eyebrow>
      <View>
        <View className="flex items-end justify-between">
          <Span className="font-display text-[length:calc(92px*var(--ds))] font-black leading-[0.76]">
            {approvals.length}
          </Span>
          <View className="pb-1">
            <AvatarStack names={approvals.map(a => nameOf(a.who))} size={24} max={2} ring="border-violet" />
          </View>
        </View>
        <Text className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.14em] opacity-90">
          {approvals.length === 0 ? "all clear" : "waiting on you"}
        </Text>
      </View>
    </Link>;
}