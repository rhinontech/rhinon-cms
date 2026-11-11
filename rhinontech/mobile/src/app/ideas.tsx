import { useState } from "react";
import { View } from "react-native";

import { IDEA_STATUSES, type IdeaStatus } from "@/data/mock-more";
import { actions, useApp, usePerm } from "@/data/store";
import { Badge, Button, Card, Chip, Display, Empty, Eyebrow, NoAccess, Screen, Text, TopBar } from "@/ui";

export default function Ideas() {
  const allowed = usePerm("ideas");
  const ideas = useApp((s) => s.ideas);
  const [filter, setFilter] = useState<"All" | IdeaStatus>("All");
  const [open, setOpen] = useState<string | null>(null);
  if (!allowed) return <Screen><TopBar fallback="/more" /><NoAccess area="Startup ideas" /></Screen>;
  const rows = ideas.filter((i) => filter === "All" || i.status === filter);
  return (
    <Screen>
      <TopBar title="Startup ideas" fallback="/more" />
      <Eyebrow>{ideas.filter((i) => i.unread).length} unread · {ideas.length} total</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Ideas\nin."}</Display>
      <Text style={{ marginTop: 12, opacity: 0.6 }}>Ideas stay out of the CRM until you convert one.</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 18 }}>{(["All", ...IDEA_STATUSES] as const).map((f) => <Chip key={f} name="sun" active={filter === f} onPress={() => setFilter(f)}>{f}</Chip>)}</View>
      <View style={{ marginTop: 14, gap: 10 }}>
        {rows.length === 0 ? <Empty title="Nothing here" body="No ideas match this filter." /> : null}
        {rows.map((i) => (
          <Card key={i.id} onPress={() => { setOpen(open === i.id ? null : i.id); actions.readIdea(i.id); }} style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}><Text style={{ flex: 1, fontSize: 17 }} bold>{i.title}</Text><Badge name="sun">{i.status}</Badge></View>
            <Text style={{ marginTop: 4, opacity: 0.7 }}>{i.oneLiner}</Text>
            <Eyebrow style={{ marginTop: 6 }}>{i.stage} · {i.founder} · {i.at}</Eyebrow>
            {open === i.id ? (
              <View style={{ marginTop: 12, gap: 10 }}>
                <Text style={{ lineHeight: 22 }}>{i.problem}</Text>
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>{IDEA_STATUSES.filter((s) => s !== "Converted").map((s) => <Chip key={s} name="sun" active={i.status === s} onPress={() => actions.setIdeaStatus(i.id, s)}>{s}</Chip>)}</View>
                <Button disabled={i.status === "Converted"} onPress={() => actions.convertIdea(i.id)}>{i.status === "Converted" ? "Already in the CRM" : "Convert to a CRM lead"}</Button>
              </View>
            ) : null}
          </Card>
        ))}
      </View>
    </Screen>
  );
}
