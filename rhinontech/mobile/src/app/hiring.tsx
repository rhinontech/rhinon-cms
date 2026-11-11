import { useState } from "react";
import { View } from "react-native";

import { HIRING_STAGES } from "@/data/mock-more";
import { actions, useApp, usePerm } from "@/data/store";
import { Badge, Button, Card, Chip, Display, Eyebrow, Field, NoAccess, Screen, SectionLabel, Segmented, Text, TopBar } from "@/ui";

type Tab = "pipeline" | "interviews";

export default function Hiring() {
  const allowed = usePerm("hiring");
  const cands = useApp((s) => s.candidates);
  const ints = useApp((s) => s.interviews);
  const [tab, setTab] = useState<Tab>("pipeline");
  const [rating, setRating] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  if (!allowed) return <Screen><TopBar fallback="/more" /><NoAccess area="Hiring" /></Screen>;

  return (
    <Screen>
      <TopBar title="Hiring" fallback="/more" />
      <Eyebrow>{cands.length} candidates</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Find the\nright one."}</Display>
      <View style={{ marginTop: 22 }}><Segmented value={tab} onChange={setTab} options={[{ value: "pipeline", label: "Pipeline" }, { value: "interviews", label: "Interviews" }]} /></View>

      {tab === "pipeline" ? HIRING_STAGES.map((st) => {
        const rows = cands.filter((c) => c.stage === st);
        if (!rows.length) return null;
        return (
          <View key={st}>
            <SectionLabel>{st} · {rows.length}</SectionLabel>
            <View style={{ gap: 10 }}>
              {rows.map((c) => (
                <Card key={c.id} style={{ padding: 14 }}>
                  <Text bold style={{ fontSize: 16 }}>{c.name}</Text>
                  <Eyebrow style={{ marginTop: 4 }}>{c.role} · {c.exp} · {c.source}</Eyebrow>
                  <Text style={{ marginTop: 6, opacity: 0.7 }}>{c.summary}</Text>
                </Card>
              ))}
            </View>
          </View>
        );
      }) : null}

      {tab === "interviews" ? (
        <View style={{ marginTop: 18, gap: 10 }}>
          {ints.map((i) => {
            const c = cands.find((x) => x.id === i.candidateId);
            return (
              <Card key={i.id} style={{ padding: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text bold>{c?.name ?? "Candidate"} · {i.round}</Text><Badge name={i.rating ? "leaf" : "sun"}>{i.rating ? `${i.rating}/5` : i.day}</Badge></View>
                <Eyebrow style={{ marginTop: 4 }}>{i.day} {i.time} · {i.where}</Eyebrow>
                {i.rating === null ? (
                  <View style={{ marginTop: 10 }}>
                    <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>{[1, 2, 3, 4, 5].map((n) => <Chip key={n} name="leaf" active={rating[i.id] === n} onPress={() => setRating((r) => ({ ...r, [i.id]: n }))}>{String(n)}</Chip>)}</View>
                    <Field placeholder="Feedback notes" value={notes[i.id] ?? ""} onChangeText={(v) => setNotes((n) => ({ ...n, [i.id]: v }))} multiline />
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {(["Hire", "Maybe", "No hire"] as const).map((r) => <View key={r} style={{ flex: 1 }}><Button tone={r === "Hire" ? "leaf" : "paper"} disabled={!rating[i.id]} onPress={() => actions.submitFeedback(i.id, rating[i.id]!, r, notes[i.id] ?? "")}>{r}</Button></View>)}
                    </View>
                  </View>
                ) : <Text style={{ marginTop: 6, opacity: 0.7 }}>{i.rec} — {i.notes}</Text>}
              </Card>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}
