import { ArrowRight, Bell, Check, Pause, Play } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text as RNText, View } from "react-native";

import { hm, pad, rupee } from "@/data/format";
import { CELEBRATIONS, ME, MEETINGS, PAYSLIPS, TODAY, nameOf, net } from "@/data/mock-data";
import { actions, useApp, useNow, usePerm, workedMs } from "@/data/store";
import { go } from "@/lib/nav";
import { useTheme } from "@/theme/ThemeProvider";
import { Avatar, Badge, Display, Eyebrow, Screen, SectionLabel, Text, tone, toneOfPerson, type Tone } from "@/ui";

type Focus = "work" | "inbox" | "time" | "pay";

function Logo({ size = 32 }: { size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size * t.c.avatarRadius, backgroundColor: t.c.ink, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <RNText style={{ fontFamily: t.f.display, fontSize: size * 0.7, color: t.c.paper, lineHeight: size * 0.9 }}>R</RNText>
      <View style={{ position: "absolute", right: 0, top: 0, width: size * 0.3, height: size * 0.3, backgroundColor: t.c.hues.coral.solid }} />
    </View>
  );
}

function IconBtn({ children, onPress, label, dot }: { children: React.ReactNode; onPress: () => void; label: string; dot?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: t.c.card, borderWidth: t.id === "brutal" ? 2 : 1, borderColor: t.id === "brutal" ? t.c.ink : t.c.line }}>
      {children}
      {dot ? <View style={{ position: "absolute", right: 10, top: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: t.c.hues.coral.solid, borderWidth: 2, borderColor: t.c.card }} /> : null}
    </Pressable>
  );
}

function FocusTile({ name, label, stat, index, selected, onPress }: { name: Tone; label: string[]; stat: string; index: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  const c = tone(t, name);
  return (
    <View style={{ flexBasis: "48%", flexGrow: 1, margin: -3, padding: 3, borderRadius: t.c.radius + 17, borderWidth: 2, borderColor: selected ? t.c.ink : "transparent" }}>
    <Pressable onPress={onPress} style={{ minHeight: 130, padding: 18, justifyContent: "space-between", gap: 12, borderRadius: t.c.radius + 14, backgroundColor: c.bg }}>
      <Eyebrow color={c.fg}>{stat}</Eyebrow>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <Display size="md" color={c.fg} style={{ flexShrink: 1 }}>{label.join("\n")}</Display>
        <Eyebrow color={c.fg}>{index}</Eyebrow>
      </View>
    </Pressable>
    </View>
  );
}

function ClockCard() {
  const t = useTheme();
  const clock = useApp((s) => s.clock);
  const now = useNow(clock.status === "in" || clock.status === "break");
  const total = Math.floor(workedMs(clock, now) / 1000);
  const c = tone(t, "leaf");
  const label = { out: "Not clocked in", in: "Working", break: "On break", done: "Day logged" }[clock.status];
  const act = clock.status === "out" ? { fn: actions.clockIn, Icon: Play } : clock.status === "in" ? { fn: actions.startBreak, Icon: Pause } : clock.status === "break" ? { fn: actions.endBreak, Icon: Play } : { fn: () => undefined, Icon: Check };
  return (
    <Pressable onPress={() => go("/attendance")} style={{ flexBasis: "48%", flexGrow: 1, height: 188, padding: 16, justifyContent: "space-between", borderRadius: t.c.radius + 14, backgroundColor: c.bg }}>
      <Eyebrow color={c.fg}>Attendance</Eyebrow>
      <Pressable onPress={act.fn} disabled={clock.status === "done"} accessibilityLabel="Clock action" style={{ position: "absolute", right: 12, top: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: t.c.paper, alignItems: "center", justifyContent: "center" }}>
        <act.Icon size={18} color={t.c.ink} fill={clock.status === "done" ? "transparent" : t.c.ink} strokeWidth={2.4} />
      </Pressable>
      <View>
        <Display size="xl" color={c.fg}>{pad(Math.floor(total / 3600))}:{pad(Math.floor((total % 3600) / 60))}</Display>
        <Eyebrow color={c.fg} style={{ marginTop: 10 }}>{label}</Eyebrow>
      </View>
    </Pressable>
  );
}

function BigNumberCard({ name, label, value, to, extra }: { name: Tone; label: string; value: number; to: string; extra: string; }) {
  const t = useTheme();
  const c = tone(t, name);
  return (
    <Pressable onPress={() => go(to)} style={{ flexBasis: "48%", flexGrow: 1, height: 188, padding: 16, justifyContent: "space-between", borderRadius: t.c.radius + 14, backgroundColor: c.bg }}>
      <Eyebrow color={c.fg}>{label}</Eyebrow>
      <View>
        <Display size="hero" color={c.fg}>{value}</Display>
        <Eyebrow color={c.fg} style={{ marginTop: 10 }}>{extra}</Eyebrow>
      </View>
    </Pressable>
  );
}

export default function Home() {
  const t = useTheme();
  const allTasks = useApp((s) => s.tasks);
  const tasks = allTasks.filter((x) => x.assignee === "me");
  const threads = useApp((s) => s.threads);
  const brand = useApp((s) => s.brand);
  const clock = useApp((s) => s.clock);
  const notifs = useApp((s) => s.notifs);
  const approvals = useApp((s) => s.approvals);
  const canApprove = usePerm("approvals");
  const [focus, setFocus] = useState<Focus>("work");
  const now = useNow(clock.status === "in" || clock.status === "break");

  const open = tasks.filter((x) => x.status !== "Done" && (x.group === "overdue" || x.group === "today"));
  const unread = threads.filter((x) => x.unread && x.folder === "inbox" && x.brand === brand);
  const topTask = open.find((x) => x.group === "overdue") ?? open[0];
  const topThread = unread[0];
  const latest = PAYSLIPS[0];

  const clockStat = clock.status === "out" ? "Not clocked in" : clock.status === "done" ? "Day logged" : clock.status === "break" ? "On break" : `${hm(workedMs(clock, now))} worked`;
  const tiles: { id: Focus; tone: Tone; label: string[]; stat: string }[] = [
    { id: "work", tone: "cobalt", label: ["Plan", "my day"], stat: `${open.length} due today` },
    { id: "inbox", tone: "coral", label: ["Clear", "inbox"], stat: `${unread.length} unread` },
    { id: "time", tone: "leaf", label: ["Log", "my time"], stat: clockStat },
    { id: "pay", tone: "sun", label: ["Check", "pay"], stat: "October paid" },
  ];
  const lastFrom = topThread?.messages[topThread.messages.length - 1]?.from ?? "";
  const cards: Record<Focus, { title: string; caption: string; cta: string; to: string }> = {
    work: { title: topTask?.title ?? "You're all caught up", caption: topTask ? `${topTask.due} · ${topTask.project}` : "Nothing is due today. Enjoy it.", cta: topTask ? "Open task" : "See all work", to: topTask ? `/work/${topTask.id}` : "/work" },
    inbox: { title: topThread?.subject ?? "Inbox zero", caption: topThread ? `${lastFrom} · ${topThread.time} · AI draft ready` : "Every thread is handled.", cta: topThread ? "Open thread" : "Open inbox", to: topThread ? `/inbox/${topThread.id}` : "/inbox" },
    time: {
      title: clock.status === "out" ? "Clock in for the day" : clock.status === "done" ? "Day logged. Nice work." : clock.status === "break" ? "Enjoy the break" : "You're on the clock",
      caption: clock.status === "out" ? "Your usual start is 9:30 AM · 8-hour day" : clock.status === "done" ? `${hm(workedMs(clock, now))} worked today` : `${hm(workedMs(clock, now))} so far · day ends around 6:30 PM`,
      cta: "Open attendance", to: "/attendance",
    },
    pay: { title: "October payslip is ready", caption: latest ? `${rupee(net(latest))} net · paid ${latest.paidOn.slice(0, 6)}` : "", cta: "View payslip", to: "/pay/oct-2026" },
  };
  const active = tiles.find((x) => x.id === focus) ?? tiles[0]!;
  const card = cards[focus];
  const meetings = MEETINGS.filter((m) => m.day === "Today").slice(0, 2);
  const accent = tone(t, active.tone).bg;

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Logo />
          <Eyebrow color={`${t.c.ink}B3`} style={t.id === "admin" ? undefined : { letterSpacing: 3 }}>Rhinon</Eyebrow>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <IconBtn label="Notifications" onPress={() => go("/notifications")} dot={notifs.some((n) => n.unread)}><Bell size={20} color={t.c.ink} /></IconBtn>
          <Pressable onPress={() => go("/profile")} accessibilityLabel="Profile"><Avatar name={ME.name} size={44} hue="violet" /></Pressable>
        </View>
      </View>

      <View style={{ marginTop: 36 }}>
        <Eyebrow color={t.c.hues.coral.deep}>{TODAY.label} · Good morning</Eyebrow>
        <Display style={{ marginTop: 12 }}>{"What are\nyou doing\ntoday?"}</Display>
        <Text style={{ marginTop: 16, fontSize: 17, lineHeight: 26, opacity: 0.65, maxWidth: 330 }}>One home for your work, inbox and people. Start with what matters now.</Text>
      </View>

      <SectionLabel>Start here</SectionLabel>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {tiles.map((x, i) => <FocusTile key={x.id} name={x.tone} label={x.label} stat={x.stat} index={pad(i + 1)} selected={focus === x.id} onPress={() => setFocus(x.id)} />)}
      </View>

      <View style={{ marginTop: 28, padding: 20, borderRadius: t.c.radius + 14, backgroundColor: t.c.ink }}>
        <View style={{ width: 68, height: 68, borderRadius: t.c.radius + 6, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: `${t.c.paper}1A`, backgroundColor: `${t.c.paper}0D` }}>
          <RNText style={{ fontSize: 30, color: t.c.onInkAccent }}>✦</RNText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 36 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
          <Eyebrow color={t.c.onInkAccent} style={{ letterSpacing: 2.2 }}>Matched for “{active.label.join(" ")}”</Eyebrow>
        </View>
        <Display size="lg" color={t.c.paper} style={{ marginTop: 10 }}>{card.title}</Display>
        <Text style={{ marginTop: 10, lineHeight: 22, color: `${t.c.paper}99` }}>{card.caption}</Text>
        <Pressable onPress={() => go(card.to)} style={{ marginTop: 24, height: 56, borderRadius: 28, backgroundColor: t.c.paper, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <RNText style={{ fontFamily: t.f.sansBold, fontSize: 16, color: t.c.ink }}>{card.cta}</RNText>
          <ArrowRight size={19} color={t.c.ink} strokeWidth={2.4} />
        </Pressable>
      </View>

      <SectionLabel>Today</SectionLabel>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <ClockCard />
        {canApprove ? <BigNumberCard name="violet" label="Approvals" value={approvals.length} to="/approvals" extra={approvals.length === 0 ? "all clear" : "waiting on you"} /> : <BigNumberCard name="sky" label="Leave" value={5} to="/leave" extra="casual days left" />}
      </View>

      <View style={{ marginTop: 12, padding: 16, borderRadius: 24, backgroundColor: t.c.card, borderWidth: t.id === "brutal" ? 2 : 1, borderColor: t.id === "brutal" ? t.c.ink : t.c.line }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <Eyebrow>Next up</Eyebrow>
          <Pressable onPress={() => go("/meetings")}><Eyebrow>Calendar →</Eyebrow></Pressable>
        </View>
        {meetings.map((m, i) => (
          <View key={m.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: t.c.line }}>
            <Display size="md" style={{ width: 64 }}>{m.start}</Display>
            <View style={{ flex: 1 }}>
              <Text bold numberOfLines={1}>{m.title}</Text>
              <Text numberOfLines={1} style={{ fontSize: 13, opacity: 0.55 }}>{m.where} · {m.kind === "client" ? "Client" : "Team"}</Text>
            </View>
            {i === 0 ? <Badge name="coral">in 19 min</Badge> : <Eyebrow>{m.end}</Eyebrow>}
          </View>
        ))}
      </View>

      <SectionLabel>Around the team</SectionLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
        {CELEBRATIONS.map((c) => (
          <View key={c.who} style={{ minWidth: 224, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, backgroundColor: `${tone(t, c.tone).bg}26` }}>
            <Avatar name={nameOf(c.who)} size={46} hue={toneOfPerson(nameOf(c.who))} />
            <View style={{ flexShrink: 1 }}>
              <Text bold numberOfLines={1}>{nameOf(c.who)}</Text>
              <Text style={{ fontSize: 13, opacity: 0.6 }}>{c.what}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
