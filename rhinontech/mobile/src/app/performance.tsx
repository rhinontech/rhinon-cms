import { useState } from "react";
import { View } from "react-native";

import { nameOf } from "@/data/mock-data";
import { actions, useApp, usePerm } from "@/data/store";
import { Badge, Button, Card, Chip, Display, Eyebrow, Field, NoAccess, ProgressBar, Screen, SectionLabel, Segmented, Sheet, Text, TopBar, tone } from "@/ui";
import { useTheme } from "@/theme/ThemeProvider";

type Tab = "goals" | "review" | "team";

export default function Performance() {
  const t = useTheme();
  const allowed = usePerm("performance");
  const goals = useApp((s) => s.goals);
  const self = useApp((s) => s.selfReview);
  const team = useApp((s) => s.teamReviews);
  const role = useApp((s) => s.role);
  const [tab, setTab] = useState<Tab>("goals");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [kr, setKr] = useState("");
  const [rating, setRating] = useState(0);
  const [str, setStr] = useState("");
  const [grow, setGrow] = useState("");
  const violet = tone(t, "violet");
  if (!allowed) return <Screen><TopBar fallback="/more" /><NoAccess area="Performance" /></Screen>;
  const manager = role === "admin" || role === "manager" || role === "hr";

  return (
    <Screen>
      <TopBar title="Goals" fallback="/more" />
      <Eyebrow color={violet.text}>H2 2026 review</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Aim\nhigher."}</Display>
      <View style={{ marginTop: 22 }}><Segmented value={tab} onChange={setTab} options={[{ value: "goals", label: "Goals" }, { value: "review", label: "My review" }, ...(manager ? [{ value: "team" as Tab, label: "Team" }] : [])]} /></View>

      {tab === "goals" ? (
        <View style={{ marginTop: 18, gap: 10 }}>
          {goals.map((g) => (
            <Card key={g.id} style={{ padding: 14 }}>
              <Text bold style={{ fontSize: 16 }}>{g.title}</Text>
              <Text style={{ opacity: 0.65, marginTop: 2 }}>{g.keyResult}</Text>
              <View style={{ marginTop: 10 }}><ProgressBar value={g.progress} color={violet.bg} track={t.c.paperDeep} /></View>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {[0, 0.25, 0.5, 0.75, 1].map((p) => <Chip key={p} name="violet" active={Math.abs(g.progress - p) < 0.01} onPress={() => actions.setGoalProgress(g.id, p)}>{Math.round(p * 100)}%</Chip>)}
              </View>
            </Card>
          ))}
          <Button tone="paper" onPress={() => setAdding(true)}>Add a goal</Button>
        </View>
      ) : null}

      {tab === "review" ? (
        <View style={{ marginTop: 18 }}>
          {self.submitted ? (
            <Card><Badge name="leaf">Submitted</Badge><Text bold style={{ marginTop: 8 }}>Rating {self.rating}/5</Text><Text style={{ marginTop: 6, opacity: 0.7 }}>{self.strengths}</Text><Text style={{ marginTop: 6, opacity: 0.7 }}>{self.growth}</Text></Card>
          ) : (
            <View>
              <Eyebrow style={{ marginBottom: 8 }}>Your rating</Eyebrow>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>{[1, 2, 3, 4, 5].map((n) => <Chip key={n} name="violet" active={rating === n} onPress={() => setRating(n)}>{String(n)}</Chip>)}</View>
              <Field label="Strengths" value={str} onChangeText={setStr} multiline />
              <Field label="Where to grow" value={grow} onChangeText={setGrow} multiline />
              <Button disabled={!rating || !str.trim()} onPress={() => actions.submitSelfReview(rating, str.trim(), grow.trim())}>Submit self-review</Button>
            </View>
          )}
        </View>
      ) : null}

      {tab === "team" ? (
        <View style={{ marginTop: 18, gap: 10 }}>
          <SectionLabel>Reviews</SectionLabel>
          {team.map((r) => (
            <Card key={r.id} style={{ padding: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text bold>{nameOf(r.who)}</Text><Badge name={r.status === "Completed" ? "leaf" : r.status === "Your review due" ? "coral" : "sun"}>{r.status}</Badge></View>
              {r.selfNotes ? <Text style={{ marginTop: 6, opacity: 0.7 }}>Self: {r.selfRating}/5 — {r.selfNotes}</Text> : null}
              {r.status === "Your review due" ? <View style={{ marginTop: 10, flexDirection: "row", gap: 6 }}>{[3, 4, 5].map((n) => <Chip key={n} name="violet" onPress={() => actions.submitTeamReview(r.id, n, "Reviewed in app")}>{`Rate ${n}`}</Chip>)}</View> : null}
            </Card>
          ))}
        </View>
      ) : null}

      <Sheet open={adding} onClose={() => setAdding(false)} title="New goal">
        <Field label="Goal" value={title} onChangeText={setTitle} />
        <Field label="Key result" value={kr} onChangeText={setKr} />
        <Button disabled={!title.trim()} onPress={() => { actions.addGoal(title.trim(), kr.trim() || "—", "31 Dec"); setAdding(false); setTitle(""); setKr(""); }}>Add goal</Button>
      </Sheet>
    </Screen>
  );
}
