import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { Mail, Phone } from "lucide-react-native";

import { PEOPLE } from "@/data/mock-data";
import { useTheme } from "@/theme/ThemeProvider";
import { Avatar, Card, Display, Eyebrow, Field, Screen, Text, TopBar, toneOfPerson } from "@/ui";

export default function People() {
  const t = useTheme();
  const [q, setQ] = useState("");
  const rows = PEOPLE.filter((p) => `${p.name} ${p.role} ${p.dept}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Screen>
      <TopBar title="People" fallback="/more" />
      <Eyebrow>{PEOPLE.length} teammates</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"The\nteam."}</Display>
      <View style={{ marginTop: 20 }}><Field value={q} onChangeText={setQ} placeholder="Search people" /></View>
      <View style={{ gap: 10 }}>
        {rows.map((p) => (
          <Card key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }}>
            <Avatar name={p.name} size={50} hue={toneOfPerson(p.name)} />
            <View style={{ flex: 1 }}>
              <Text bold style={{ fontSize: 16 }}>{p.name}</Text>
              <Text style={{ fontSize: 13, opacity: 0.6 }}>{p.role} · {p.location}</Text>
            </View>
            <Pressable onPress={() => Linking.openURL(`tel:${p.phone}`)} accessibilityLabel="Call"><Phone size={20} color={t.c.ink} /></Pressable>
            <Pressable onPress={() => Linking.openURL(`mailto:${p.email}`)} accessibilityLabel="Email"><Mail size={20} color={t.c.ink} /></Pressable>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
