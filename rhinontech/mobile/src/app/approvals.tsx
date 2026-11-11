import { View } from "react-native";

import { actions, useApp } from "@/data/store";
import { inr } from "@/data/format";
import { Avatar, Badge, Button, Card, Display, Empty, Eyebrow, Screen, Text, TopBar, toneOfPerson } from "@/ui";

export default function Approvals() {
  const items = useApp((s) => s.approvals);
  return (
    <Screen>
      <TopBar title="Approvals" fallback="/more" />
      <Eyebrow>{items.length} waiting on you</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Your\ncall."}</Display>
      <View style={{ marginTop: 22, gap: 12 }}>
        {items.length === 0 ? <Empty title="All clear" body="Nothing needs your decision." /> : null}
        {items.map((a) => (
          <Card key={a.id} style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar name={a.who} size={44} hue={toneOfPerson(a.who)} />
              <View style={{ flex: 1 }}><Text bold style={{ fontSize: 16 }}>{a.who}</Text><Eyebrow>{a.when}</Eyebrow></View>
              <Badge name={a.kind === "leave" ? "sky" : a.kind === "attendance" ? "leaf" : "sun"}>{a.kind}</Badge>
            </View>
            <Text bold style={{ marginTop: 12, fontSize: 18 }}>{a.title}</Text>
            {a.amount ? <Display size="lg" style={{ marginTop: 4 }}>{inr(a.amount)}</Display> : null}
            <Text style={{ marginTop: 6, opacity: 0.65 }}>{a.detail}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <View style={{ flex: 1 }}><Button tone="paper" onPress={() => actions.decide(a.id, "rejected")}>Reject</Button></View>
              <View style={{ flex: 1 }}><Button tone="leaf" onPress={() => actions.decide(a.id, "approved")}>Approve</Button></View>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
