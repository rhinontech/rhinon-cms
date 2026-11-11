import { useState } from "react";
import { View } from "react-native";

import { EVENTS } from "@/data/mock-more";
import { actions, useApp, usePerm } from "@/data/store";
import { Badge, Button, Card, Display, Eyebrow, NoAccess, Screen, SectionLabel, Segmented, Text, TopBar } from "@/ui";

type Tab = "posts" | "events";

export default function Content() {
  const allowed = usePerm("content");
  const posts = useApp((s) => s.posts);
  const guests = useApp((s) => s.guests);
  const [tab, setTab] = useState<Tab>("posts");
  const [open, setOpen] = useState<string | null>(null);
  if (!allowed) return <Screen><TopBar fallback="/more" /><NoAccess area="Content" /></Screen>;
  return (
    <Screen>
      <TopBar title="Content" fallback="/more" />
      <Eyebrow>{posts.filter((p) => p.status === "Review").length} to approve</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Publish\nwell."}</Display>
      <View style={{ marginTop: 22 }}><Segmented value={tab} onChange={setTab} options={[{ value: "posts", label: "Posts" }, { value: "events", label: "Events" }]} /></View>

      {tab === "posts" ? (
        <View style={{ marginTop: 18, gap: 10 }}>
          {posts.map((p) => (
            <Card key={p.id} onPress={() => setOpen(open === p.id ? null : p.id)} style={{ padding: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}><Text bold style={{ flex: 1, fontSize: 16 }}>{p.title}</Text><Badge name={p.status === "Approved" ? "leaf" : p.status === "Review" ? "sun" : "coral"}>{p.status}</Badge></View>
              <Eyebrow style={{ marginTop: 4 }}>{p.kind} · {p.author} · {p.words} words</Eyebrow>
              <Text style={{ marginTop: 6, opacity: 0.7 }}>{p.excerpt}</Text>
              {open === p.id ? (
                <View style={{ marginTop: 12, gap: 10 }}>
                  {p.paragraphs.map((x, i) => <Text key={i} style={{ lineHeight: 22 }}>{x}</Text>)}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={{ flex: 1 }}><Button tone="paper" onPress={() => actions.decidePost(p.id, "Changes requested")}>Request changes</Button></View>
                    <View style={{ flex: 1 }}><Button tone="leaf" onPress={() => actions.decidePost(p.id, "Approved")}>Approve</Button></View>
                  </View>
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}

      {tab === "events" ? EVENTS.map((e) => {
        const g = guests[e.id] ?? [];
        return (
          <View key={e.id}>
            <SectionLabel>{e.title}</SectionLabel>
            <Eyebrow>{e.when} · {e.where} · {g.filter((x) => x.checkedIn).length}/{g.length} in</Eyebrow>
            <View style={{ marginTop: 10, gap: 8 }}>
              {g.map((x) => (
                <Card key={x.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12 }}>
                  <View style={{ flex: 1 }}><Text bold>{x.name}</Text><Eyebrow>{x.ticket} · {x.company}</Eyebrow></View>
                  <Button tone={x.checkedIn ? "leaf" : "paper"} onPress={() => actions.checkIn(e.id, x.id, !x.checkedIn)}>{x.checkedIn ? "In" : "Check in"}</Button>
                </Card>
              ))}
            </View>
          </View>
        );
      }) : null}
    </Screen>
  );
}
