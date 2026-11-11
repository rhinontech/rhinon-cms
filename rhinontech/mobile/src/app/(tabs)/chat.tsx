import { useState } from "react";
import { Pressable, View } from "react-native";
import { Video } from "lucide-react-native";

import { go } from "@/lib/nav";
import { useApp } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { Avatar, Card, Chip, Display, Empty, Eyebrow, Screen, Text, tone } from "@/ui";

type Filter = "all" | "unread" | "dm" | "channel";

export default function Chat() {
  const t = useTheme();
  const chats = useApp((s) => s.chats);
  const [filter, setFilter] = useState<Filter>("all");
  const sky = tone(t, "sky");
  const unread = chats.reduce((n, c) => n + c.unread, 0);
  const rows = chats
    .filter((c) => (filter === "unread" ? c.unread > 0 : filter === "dm" ? c.kind === "dm" : filter === "channel" ? c.kind !== "dm" : true))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <Screen>
      <Eyebrow color={sky.text}>Chat · {unread} unread</Eyebrow>
      <Display style={{ marginTop: 12 }}>{"Talk it\nthrough."}</Display>

      <View style={{ marginTop: 24, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: t.c.radius + 14, backgroundColor: sky.bg }}>
        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: t.c.ink, alignItems: "center", justifyContent: "center" }}>
          <Video size={22} color={t.c.paper} />
        </View>
        <View style={{ flex: 1 }}>
          <Display size="md" color={sky.fg}>Design crit</Display>
          <Eyebrow color={sky.fg}>3 in the call · 4 min ago</Eyebrow>
        </View>
        <Pressable style={{ paddingHorizontal: 16, height: 40, borderRadius: 99, backgroundColor: t.c.ink, justifyContent: "center" }}>
          <Text bold style={{ color: t.c.paper }}>Join</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
        {([["all", "All"], ["unread", "Unread"], ["dm", "People"], ["channel", "Channels"]] as [Filter, string][]).map(([v, l]) => (
          <Chip key={v} active={filter === v} onPress={() => setFilter(v)} count={v === "unread" ? unread : undefined}>{l}</Chip>
        ))}
      </View>

      <View style={{ marginTop: 16, gap: 10 }}>
        {rows.length === 0 ? <Empty title="Nothing here" body="No conversations match this filter." /> : null}
        {rows.map((c) => {
          const last = c.messages[c.messages.length - 1];
          return (
            <Card key={c.id} onPress={() => go(`/chat/${c.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }}>
              <Avatar name={c.kind === "dm" ? c.name : `# ${c.name}`} size={48} hue={c.tone === "ink" || c.tone === "paper" ? "violet" : c.tone} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text bold style={{ fontSize: 16 }}>{c.kind === "dm" ? c.name : `# ${c.name}`}</Text>
                  <Eyebrow>{c.time}</Eyebrow>
                </View>
                <Text numberOfLines={1} style={{ marginTop: 3, fontSize: 14, opacity: c.unread ? 0.9 : 0.55 }}>{last?.text ?? ""}</Text>
              </View>
              {c.unread ? (
                <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: t.c.hues.coral.solid, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 11, color: t.c.hues.coral.on }}>{c.unread}</Text>
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
