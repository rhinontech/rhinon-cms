import { useState } from "react";
import { View } from "react-native";

import { actions, useApp } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { Badge, Button, Card, Chip, Display, Eyebrow, Field, ProgressBar, Screen, SectionLabel, Sheet, Text, TopBar, tone } from "@/ui";

export default function Leave() {
  const t = useTheme();
  const balances = useApp((s) => s.balances);
  const reqs = useApp((s) => s.leave);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(balances[0]?.name ?? "Casual");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const sky = tone(t, "sky");

  return (
    <Screen>
      <TopBar title="Leave" fallback="/more" />
      <Eyebrow color={sky.text}>{balances.reduce((n, b) => n + (b.total - b.used - b.pending), 0)} days left</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Time\noff."}</Display>
      <View style={{ marginTop: 22, gap: 10 }}>
        {balances.map((b) => {
          const c = tone(t, b.tone);
          return (
            <Card key={b.id} style={{ padding: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text bold>{b.name}</Text>
                <Eyebrow>{b.total - b.used - b.pending} of {b.total} left</Eyebrow>
              </View>
              <View style={{ marginTop: 10 }}><ProgressBar value={(b.used + b.pending) / b.total} color={c.bg} track={t.c.paperDeep} /></View>
            </Card>
          );
        })}
      </View>
      <View style={{ marginTop: 18 }}><Button tone="sky" onPress={() => setOpen(true)}>Apply for leave</Button></View>

      <SectionLabel>Requests</SectionLabel>
      <View style={{ gap: 10 }}>
        {reqs.map((r) => (
          <Card key={r.id} style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text bold>{r.type} · {r.days} day{r.days > 1 ? "s" : ""}</Text>
              <Badge name={r.status === "Approved" ? "leaf" : r.status === "Rejected" ? "coral" : "sun"}>{r.status}</Badge>
            </View>
            <Eyebrow style={{ marginTop: 4 }}>{r.from} → {r.to}</Eyebrow>
            <Text style={{ marginTop: 6, opacity: 0.7 }}>{r.reason}</Text>
          </Card>
        ))}
      </View>

      <Sheet open={open} onClose={() => setOpen(false)} title="Apply for leave">
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {balances.map((b) => <Chip key={b.id} name={b.tone} active={type === b.name} onPress={() => setType(b.name)}>{b.name}</Chip>)}
        </View>
        <Field label="From (YYYY-MM-DD)" value={from} onChangeText={setFrom} placeholder="2026-11-12" />
        <Field label="To (YYYY-MM-DD)" value={to} onChangeText={setTo} placeholder="2026-11-13" />
        <Field label="Reason" value={reason} onChangeText={setReason} multiline />
        <Button disabled={!from || !to} onPress={() => { actions.applyLeave(type, from, to, reason.trim()); setOpen(false); setFrom(""); setTo(""); setReason(""); }}>Send request</Button>
      </Sheet>
    </Screen>
  );
}
