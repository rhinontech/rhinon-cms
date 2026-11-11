import { useState } from "react";
import { View } from "react-native";

import { PAYSLIPS } from "@/data/mock-data";
import { inr } from "@/data/format";
import { actions, useApp } from "@/data/store";
import { go } from "@/lib/nav";
import { useTheme } from "@/theme/ThemeProvider";
import { Badge, Button, Card, Chip, Display, Eyebrow, Field, Screen, SectionLabel, Sheet, Text, TopBar, tone } from "@/ui";

const CATS = ["Travel", "Food", "Software", "Equipment", "Other"];
const net = (s: (typeof PAYSLIPS)[number]) => s.earnings.reduce((n, l) => n + l.amount, 0) - s.deductions.reduce((n, l) => n + l.amount, 0);

export default function Pay() {
  const t = useTheme();
  const locked = useApp((s) => s.payLocked);
  const claims = useApp((s) => s.claims);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState(CATS[0]!);
  const sun = tone(t, "sun");
  const latest = PAYSLIPS[0]!;

  return (
    <Screen>
      <TopBar title="Pay" fallback="/more" />
      <Eyebrow color={sun.text}>{latest.month} · paid {latest.paidOn}</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Your\npay."}</Display>
      <View style={{ marginTop: 22, padding: 22, borderRadius: t.c.radius + 14, backgroundColor: sun.bg }}>
        <Eyebrow color={sun.fg}>Take-home</Eyebrow>
        <Display size="xl" color={sun.fg} style={{ marginTop: 6 }}>{locked ? "₹ ••••••" : inr(net(latest))}</Display>
        <View style={{ marginTop: 14 }}><Button onPress={locked ? actions.unlockPay : actions.lockPay}>{locked ? "Show amounts" : "Hide amounts"}</Button></View>
      </View>

      <SectionLabel>Payslips</SectionLabel>
      <View style={{ gap: 10 }}>
        {PAYSLIPS.map((s) => (
          <Card key={s.id} onPress={() => go(`/pay/${s.id}`)} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 }}>
            <View><Text bold>{s.month}</Text><Eyebrow>Paid {s.paidOn}</Eyebrow></View>
            <Text bold>{locked ? "••••" : inr(net(s))}</Text>
          </Card>
        ))}
      </View>

      <SectionLabel>Reimbursements</SectionLabel>
      <Button tone="paper" onPress={() => setOpen(true)}>New claim</Button>
      <View style={{ gap: 10, marginTop: 14 }}>
        {claims.map((c) => (
          <Card key={c.id} style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text bold>{c.title}</Text>
              <Badge name={c.status === "Approved" || c.status === "Paid" ? "leaf" : c.status === "Rejected" ? "coral" : "sun"}>{c.status}</Badge>
            </View>
            <Eyebrow style={{ marginTop: 4 }}>{c.category} · {c.month} · {c.payout}</Eyebrow>
            <Text bold style={{ marginTop: 6 }}>{inr(c.amount)}</Text>
          </Card>
        ))}
      </View>

      <Sheet open={open} onClose={() => setOpen(false)} title="New claim">
        <Field label="What for" value={title} onChangeText={setTitle} />
        <Field label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {CATS.map((c) => <Chip key={c} name="sun" active={cat === c} onPress={() => setCat(c)}>{c}</Chip>)}
        </View>
        <Button disabled={!title.trim() || !Number(amount)} onPress={() => { actions.addClaim({ title: title.trim(), category: cat, amount: Number(amount), payout: "With payslip" }); setOpen(false); setTitle(""); setAmount(""); }}>Submit claim</Button>
      </Sheet>
    </Screen>
  );
}
