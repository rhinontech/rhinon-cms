import { useState } from "react";
import { View } from "react-native";

import { STAGES } from "@/data/mock-data";
import { LIFECYCLES } from "@/data/mock-more";
import { inr, lakh } from "@/data/format";
import { actions, useApp, usePerm } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { Badge, Button, Card, Chip, Display, Eyebrow, NoAccess, Screen, SectionLabel, Segmented, Text, TopBar, tone } from "@/ui";

type Tab = "pipeline" | "leads" | "accounts";

export default function Crm() {
  const t = useTheme();
  const allowed = usePerm("crm");
  const canWrite = usePerm("crm", "write");
  const deals = useApp((s) => s.deals);
  const leads = useApp((s) => s.leads);
  const accounts = useApp((s) => s.accounts);
  const [tab, setTab] = useState<Tab>("pipeline");
  const rose = tone(t, "rose");
  if (!allowed) return <Screen><TopBar fallback="/more" /><NoAccess area="CRM" /></Screen>;
  const open = deals.filter((d) => d.stage !== "won").reduce((n, d) => n + d.value, 0);

  return (
    <Screen>
      <TopBar title="CRM" fallback="/more" />
      <Eyebrow color={rose.text}>{lakh(open)} open</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Close\nthem."}</Display>
      <View style={{ marginTop: 22 }}><Segmented value={tab} onChange={setTab} options={[{ value: "pipeline", label: "Pipeline" }, { value: "leads", label: "Leads" }, { value: "accounts", label: "Accounts" }]} /></View>

      {tab === "pipeline" ? STAGES.map((st, si) => {
        const rows = deals.filter((d) => d.stage === st.id);
        const next = STAGES[si + 1];
        return (
          <View key={st.id}>
            <SectionLabel>{st.name} · {rows.length} · {lakh(rows.reduce((n, d) => n + d.value, 0))}</SectionLabel>
            <View style={{ gap: 10 }}>
              {rows.map((d) => (
                <Card key={d.id} style={{ padding: 14 }}>
                  <Text bold style={{ fontSize: 16 }}>{d.title}</Text>
                  <Eyebrow style={{ marginTop: 4 }}>{d.company} · close {d.close}</Eyebrow>
                  <Text bold style={{ marginTop: 8 }}>{inr(d.value)}</Text>
                  {canWrite && next ? <View style={{ marginTop: 10 }}><Button tone="paper" onPress={() => actions.moveDeal(d.id, next.id)}>Move to {next.name}</Button></View> : null}
                </Card>
              ))}
            </View>
          </View>
        );
      }) : null}

      {tab === "leads" ? (
        <View style={{ marginTop: 18, gap: 10 }}>
          {leads.map((l) => (
            <Card key={l.id} style={{ padding: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text bold style={{ fontSize: 16 }}>{l.name}</Text><Badge name="rose">{l.lifecycle}</Badge></View>
              <Text style={{ opacity: 0.65, marginTop: 2 }}>{l.title} · {l.company}</Text>
              <Eyebrow style={{ marginTop: 6 }}>{l.status} · {l.source} · {l.last}</Eyebrow>
              {canWrite ? (
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  {LIFECYCLES.map((lc) => <Chip key={lc} name="rose" active={l.lifecycle === lc} onPress={() => actions.setLifecycle(l.id, lc)}>{lc}</Chip>)}
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}

      {tab === "accounts" ? (
        <View style={{ marginTop: 18, gap: 10 }}>
          {accounts.map((a) => (
            <Card key={a.id} style={{ padding: 14 }}>
              <Text bold style={{ fontSize: 16 }}>{a.name}</Text>
              <Eyebrow style={{ marginTop: 4 }}>{a.industry} · {a.city} · {a.size} · since {a.since}</Eyebrow>
              <Text style={{ marginTop: 6, opacity: 0.7 }}>{a.note}</Text>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
