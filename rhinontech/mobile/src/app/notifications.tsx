import { Pressable, View } from "react-native";

import { actions, useApp } from "@/data/store";
import { go } from "@/lib/nav";
import { useTheme } from "@/theme/ThemeProvider";
import { Display, Eyebrow, Screen, SectionLabel, Text, TopBar } from "@/ui";

export default function Notifications() {
  const t = useTheme();
  const notifs = useApp((s) => s.notifs);
  const fresh = notifs.filter((n) => n.unread).length;
  return (
    <Screen>
      <TopBar title="Alerts" fallback="/more" right={fresh ? <Pressable onPress={actions.readAllNotifs}><Text bold style={{ fontSize: 13 }}>Read all</Text></Pressable> : null} />
      <Eyebrow>{fresh} new</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"What's\nnew."}</Display>
      {(["Today", "Earlier"] as const).map((g) => {
        const rows = notifs.filter((n) => n.group === g);
        if (!rows.length) return null;
        return (
          <View key={g}>
            <SectionLabel>{g}</SectionLabel>
            {rows.map((n) => (
              <Pressable key={n.id} onPress={() => { actions.readNotif(n.id); if (n.to) go(n.to); }} style={{ flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.c.line }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 8, backgroundColor: n.unread ? t.c.hues.coral.solid : "transparent" }} />
                <View style={{ flex: 1 }}>
                  <Text bold>{n.title}</Text>
                  <Text style={{ opacity: 0.65, marginTop: 2 }}>{n.body}</Text>
                  <Eyebrow style={{ marginTop: 4 }}>{n.time}</Eyebrow>
                </View>
              </Pressable>
            ))}
          </View>
        );
      })}
    </Screen>
  );
}
