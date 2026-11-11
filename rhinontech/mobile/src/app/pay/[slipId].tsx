import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { PAYSLIPS } from "@/data/mock-data";
import { inr } from "@/data/format";
import { useApp } from "@/data/store";
import { Card, Display, Empty, Eyebrow, Screen, SectionLabel, Text, TopBar } from "@/ui";

export default function Slip() {
  const { slipId } = useLocalSearchParams<{ slipId: string }>();
  const locked = useApp((s) => s.payLocked);
  const s = PAYSLIPS.find((x) => x.id === slipId);
  if (!s) return <Screen><TopBar fallback="/pay" /><Empty title="Not found" body="That payslip doesn't exist." /></Screen>;
  const sum = (l: { amount: number }[]) => l.reduce((n, x) => n + x.amount, 0);
  const money = (n: number) => (locked ? "••••" : inr(n));
  const Lines = ({ rows }: { rows: { label: string; amount: number }[] }) => (
    <Card style={{ gap: 10 }}>
      {rows.map((l) => (
        <View key={l.label} style={{ flexDirection: "row", justifyContent: "space-between" }}><Text>{l.label}</Text><Text bold>{money(l.amount)}</Text></View>
      ))}
    </Card>
  );
  return (
    <Screen>
      <TopBar title="Payslip" fallback="/pay" />
      <Eyebrow>Paid {s.paidOn}</Eyebrow>
      <Display size="xl" style={{ marginTop: 10 }}>{s.month}</Display>
      <Display size="lg" style={{ marginTop: 14 }}>{money(sum(s.earnings) - sum(s.deductions))}</Display>
      <SectionLabel>Earnings</SectionLabel>
      <Lines rows={s.earnings} />
      <SectionLabel>Deductions</SectionLabel>
      <Lines rows={s.deductions} />
    </Screen>
  );
}
