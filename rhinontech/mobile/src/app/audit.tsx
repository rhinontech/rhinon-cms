import { View } from "react-native";

import { AUDIT } from "@/data/mock-more";
import { usePerm } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { Display, Eyebrow, NoAccess, Screen, Text, TopBar } from "@/ui";

export default function Audit() {
  const t = useTheme();
  const allowed = usePerm("audit");
  if (!allowed) return <Screen><TopBar fallback="/more" /><NoAccess area="the audit log" /></Screen>;
  return (
    <Screen>
      <TopBar title="Audit" fallback="/more" />
      <Eyebrow>Read-only</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Who did\nwhat."}</Display>
      <View style={{ marginTop: 20 }}>
        {AUDIT.map((a) => (
          <View key={a.id} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.c.line }}>
            <Text><Text bold>{a.actor}</Text> {a.action} <Text bold>{a.target}</Text></Text>
            <Eyebrow style={{ marginTop: 4 }}>{a.at} · {a.where}</Eyebrow>
          </View>
        ))}
      </View>
    </Screen>
  );
}
