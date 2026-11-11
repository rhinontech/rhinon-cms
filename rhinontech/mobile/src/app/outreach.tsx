import { useState } from "react";
import { Switch, View } from "react-native";

import { actions, useApp, usePerm } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { Badge, Button, Card, Display, Empty, Eyebrow, Field, NoAccess, Screen, SectionLabel, Segmented, Text, TopBar } from "@/ui";

type Tab = "review" | "campaigns" | "flows";

export default function Outreach() {
  const t = useTheme();
  const allowed = usePerm("outreach");
  const brand = useApp((s) => s.brand);
  const drafts = useApp((s) => s.drafts).filter((d) => d.brand === brand);
  const campaigns = useApp((s) => s.campaigns).filter((c) => c.brand === brand);
  const flows = useApp((s) => s.flows).filter((f) => f.brand === brand);
  const [tab, setTab] = useState<Tab>("review");
  const [edit, setEdit] = useState<string | null>(null);
  const [body, setBody] = useState("");
  if (!allowed) return <Screen><TopBar fallback="/more" /><NoAccess area="Outreach" /></Screen>;
  const pending = drafts.filter((d) => d.status === "pending");

  return (
    <Screen>
      <TopBar title="Outreach" fallback="/more" />
      <Eyebrow>{pending.length} to review</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Say it\nwell."}</Display>
      <View style={{ marginTop: 22 }}><Segmented value={tab} onChange={setTab} options={[{ value: "review", label: "Review" }, { value: "campaigns", label: "Campaigns" }, { value: "flows", label: "Flows" }]} /></View>

      {tab === "review" ? (
        <View style={{ marginTop: 18, gap: 12 }}>
          {pending.length === 0 ? <Empty title="All sent" body="No drafts waiting for you." /> : null}
          {pending.map((d) => (
            <Card key={d.id} style={{ padding: 16 }}>
              <Eyebrow>{d.stage} · {d.lead}, {d.company}</Eyebrow>
              <Text bold style={{ marginTop: 6, fontSize: 16 }}>{d.subject}</Text>
              {edit === d.id ? <View style={{ marginTop: 10 }}><Field value={body} onChangeText={setBody} multiline /></View> : <Text style={{ marginTop: 8, lineHeight: 22, opacity: 0.8 }}>{d.body}</Text>}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <View style={{ flex: 1 }}><Button tone="paper" onPress={() => actions.decideDraft(d.id, "rejected")}>Reject</Button></View>
                <View style={{ flex: 1 }}>{edit === d.id ? <Button onPress={() => { actions.editDraft(d.id, body); setEdit(null); }}>Save</Button> : <Button tone="paper" onPress={() => { setEdit(d.id); setBody(d.body); }}>Edit</Button>}</View>
                <View style={{ flex: 1 }}><Button tone="leaf" onPress={() => actions.decideDraft(d.id, "approved")}>Send</Button></View>
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      {tab === "campaigns" ? (
        <View style={{ marginTop: 18, gap: 10 }}>
          {campaigns.map((c) => (
            <Card key={c.id} style={{ padding: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text bold style={{ flex: 1, fontSize: 16 }}>{c.name}</Text>
                <Switch value={c.status === "Active"} disabled={c.status === "Completed" || c.status === "Draft"} onValueChange={() => actions.toggleCampaign(c.id)} trackColor={{ true: t.c.hues.leaf.solid }} />
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}><Badge>{c.channel}</Badge><Badge name={c.status === "Active" ? "leaf" : "sun"}>{c.status}</Badge></View>
              <Eyebrow style={{ marginTop: 8 }}>{c.sent} sent · {c.opened} opened · {c.replied} replied · {c.bounced} bounced</Eyebrow>
            </Card>
          ))}
        </View>
      ) : null}

      {tab === "flows" ? (
        <View style={{ marginTop: 18, gap: 10 }}>
          <SectionLabel>Automations</SectionLabel>
          {flows.map((f) => (
            <Card key={f.id} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1 }}><Text bold>{f.name}</Text><Text style={{ fontSize: 13, opacity: 0.6 }}>{f.trigger}</Text><Eyebrow style={{ marginTop: 4 }}>{f.steps} steps · {f.enrolled} enrolled</Eyebrow></View>
              <Switch value={f.active} onValueChange={() => actions.toggleFlow(f.id)} trackColor={{ true: t.c.hues.leaf.solid }} />
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
