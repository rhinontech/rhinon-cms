import { View } from "react-native";
import { Video } from "lucide-react-native";

import { MEETINGS, nameOf } from "@/data/mock-data";
import { useTheme } from "@/theme/ThemeProvider";
import { AvatarStack, Badge, Card, Display, Eyebrow, Screen, SectionLabel, Text, TopBar } from "@/ui";

export default function Meetings() {
  const t = useTheme();
  return (
    <Screen>
      <TopBar title="Meetings" fallback="/more" />
      <Eyebrow>{MEETINGS.length} scheduled</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Your\ncalendar."}</Display>
      {(["Today", "Tomorrow"] as const).map((d) => (
        <View key={d}>
          <SectionLabel>{d}</SectionLabel>
          <View style={{ gap: 10 }}>
            {MEETINGS.filter((m) => m.day === d).map((m) => (
              <Card key={m.id} style={{ padding: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Eyebrow>{m.start} – {m.end}</Eyebrow>
                  <Badge name={m.kind === "client" ? "rose" : "cobalt"}>{m.kind}</Badge>
                </View>
                <Text bold style={{ fontSize: 18, marginTop: 6 }}>{m.title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}><Video size={14} color={t.c.ink} /><Text style={{ fontSize: 13, opacity: 0.6 }}>{m.where}</Text></View>
                <View style={{ marginTop: 10 }}><AvatarStack names={m.people.map(nameOf)} size={26} /></View>
              </Card>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}
