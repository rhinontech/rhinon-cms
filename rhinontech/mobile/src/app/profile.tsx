import { Switch, View } from "react-native";

import { ME } from "@/data/mock-data";
import { ROLE_LABEL, actions, useApp, type Role } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { Avatar, Card, Chip, Display, Eyebrow, Screen, SectionLabel, Text, TopBar } from "@/ui";

const PREFS: [string, string][] = [["push", "Push notifications"], ["tasks", "Task updates"], ["inbox", "New mail"], ["chat", "Chat messages"], ["approvals", "Approvals"], ["digest", "Daily digest"], ["biometric", "Face ID for pay"], ["twofa", "Two-step sign-in"]];

export default function Profile() {
  const t = useTheme();
  const prefs = useApp((s) => s.prefs);
  const role = useApp((s) => s.role);
  return (
    <Screen>
      <TopBar title="Profile" fallback="/more" />
      <Avatar name={ME.name} size={84} />
      <Display size="lg" style={{ marginTop: 14 }}>{ME.name}</Display>
      <Text style={{ opacity: 0.65, marginTop: 4 }}>{ME.role} · {ME.dept}</Text>
      <Card style={{ marginTop: 18, gap: 8 }}>
        {([["Email", ME.email], ["Phone", ME.phone], ["Joined", ME.joined], ["Manager", ME.manager], ["Location", ME.location]] as [string, string][]).map(([k, v]) => (
          <View key={k} style={{ flexDirection: "row", justifyContent: "space-between" }}><Eyebrow>{k}</Eyebrow><Text bold>{v}</Text></View>
        ))}
      </Card>
      <SectionLabel>Preview as role</SectionLabel>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <Chip key={r} active={role === r} onPress={() => actions.setRole(r)}>{ROLE_LABEL[r]}</Chip>)}
      </View>
      <SectionLabel>Notifications and security</SectionLabel>
      <View style={{ gap: 6 }}>
        {PREFS.map(([k, l]) => (
          <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
            <Text>{l}</Text>
            <Switch value={!!prefs[k]} onValueChange={() => actions.togglePref(k)} trackColor={{ true: t.c.hues.leaf.solid }} />
          </View>
        ))}
      </View>
    </Screen>
  );
}
