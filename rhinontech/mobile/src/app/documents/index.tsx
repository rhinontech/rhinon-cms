import { View } from "react-native";

import { actions, useApp } from "@/data/store";
import { go } from "@/lib/nav";
import { Badge, Button, Card, Display, Eyebrow, Screen, SectionLabel, Text, TopBar } from "@/ui";

export default function Documents() {
  const docs = useApp((s) => s.docs);
  const reqs = useApp((s) => s.docRequests);
  const toSign = docs.filter((d) => d.state === "to-sign");
  return (
    <Screen>
      <TopBar title="Documents" fallback="/more" />
      <Eyebrow>{toSign.length} to sign</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Your\nvault."}</Display>
      {reqs.some((r) => !r.done) ? <SectionLabel>HR is asking for</SectionLabel> : null}
      <View style={{ gap: 10 }}>
        {reqs.filter((r) => !r.done).map((r) => (
          <Card key={r.id} style={{ padding: 14 }}>
            <Text bold>{r.title}</Text>
            <Text style={{ opacity: 0.65, marginTop: 2 }}>{r.note}</Text>
            <Eyebrow style={{ marginTop: 6 }}>Due {r.due}</Eyebrow>
            <View style={{ marginTop: 10 }}><Button tone="paper" onPress={() => actions.submitRequest(r.id)}>Upload</Button></View>
          </Card>
        ))}
      </View>
      <SectionLabel>Files</SectionLabel>
      <View style={{ gap: 10 }}>
        {docs.map((d) => (
          <Card key={d.id} onPress={d.state === "to-sign" ? () => go(`/documents/sign/${d.id}`) : undefined as never} style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <Text bold style={{ flex: 1 }}>{d.name}</Text>
              <Badge name={d.state === "to-sign" ? "sun" : d.state === "signed" ? "leaf" : "ink"}>{d.state === "to-sign" ? "Sign" : d.state === "signed" ? "Signed" : d.kind}</Badge>
            </View>
            <Eyebrow style={{ marginTop: 4 }}>{d.date} · {d.size}</Eyebrow>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
