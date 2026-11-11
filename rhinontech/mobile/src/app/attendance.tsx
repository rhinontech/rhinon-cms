import { useState } from "react";
import { View } from "react-native";

import { actions, breakMsNow, useApp, useNow, workedMs } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Card, Display, Eyebrow, Field, Screen, SectionLabel, Sheet, Text, TopBar, Badge, tone } from "@/ui";

const hms = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
};

export default function Attendance() {
  const t = useTheme();
  const clock = useApp((s) => s.clock);
  const regs = useApp((s) => s.regularizations);
  const now = useNow(clock.status === "in" || clock.status === "break");
  const [sheet, setSheet] = useState(false);
  const [date, setDate] = useState("");
  const [times, setTimes] = useState("");
  const [reason, setReason] = useState("");
  const leaf = tone(t, "leaf");
  const worked = workedMs(clock, now);

  return (
    <Screen>
      <TopBar title="Attendance" fallback="/more" />
      <Eyebrow color={leaf.text}>{clock.status === "out" ? "Not in yet" : clock.status === "break" ? "On a break" : clock.status === "done" ? "Day logged" : "On the clock"}</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Time\nlogged."}</Display>
      <View style={{ marginTop: 22, padding: 22, borderRadius: t.c.radius + 14, backgroundColor: leaf.bg }}>
        <Display size="xl" color={leaf.fg}>{hms(worked)}</Display>
        <Eyebrow color={leaf.fg} style={{ marginTop: 8 }}>Break {hms(breakMsNow(clock, now))}</Eyebrow>
        <View style={{ marginTop: 18, gap: 10 }}>
          {clock.status === "out" ? <Button onPress={actions.clockIn}>Clock in</Button> : null}
          {clock.status === "in" ? <><Button tone="paper" onPress={actions.startBreak}>Start break</Button><Button onPress={actions.clockOut}>Clock out</Button></> : null}
          {clock.status === "break" ? <><Button tone="paper" onPress={actions.endBreak}>End break</Button><Button onPress={actions.clockOut}>Clock out</Button></> : null}
          {clock.status === "done" ? <Button tone="paper" onPress={actions.resetClock}>Start a new day</Button> : null}
        </View>
      </View>

      <SectionLabel>Missed a punch?</SectionLabel>
      <Button tone="paper" onPress={() => setSheet(true)}>Request a correction</Button>
      <View style={{ marginTop: 14, gap: 10 }}>
        {regs.map((r) => (
          <Card key={r.id} style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text bold>{r.date}</Text>
              <Badge name={r.status === "Approved" ? "leaf" : r.status === "Rejected" ? "coral" : "sun"}>{r.status}</Badge>
            </View>
            <Eyebrow style={{ marginTop: 4 }}>{r.times}</Eyebrow>
            <Text style={{ marginTop: 6, opacity: 0.7 }}>{r.reason}</Text>
          </Card>
        ))}
      </View>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Correction">
        <Field label="Date" value={date} onChangeText={setDate} placeholder="Fri 30 Oct" />
        <Field label="Correct times" value={times} onChangeText={setTimes} placeholder="9:30 – 18:10" />
        <Field label="Reason" value={reason} onChangeText={setReason} multiline />
        <Button disabled={!date.trim() || !reason.trim()} onPress={() => { actions.requestRegularization(date.trim(), times.trim() || "—", reason.trim()); setSheet(false); setDate(""); setTimes(""); setReason(""); }}>Send to manager</Button>
      </Sheet>
    </Screen>
  );
}
