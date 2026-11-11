import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Archive, Star } from "lucide-react-native";

import { actions, useApp } from "@/data/store";
import { back } from "@/lib/nav";
import { useTheme } from "@/theme/ThemeProvider";
import { Avatar, Button, Card, Display, Empty, Eyebrow, Field, Screen, Text, TopBar, toneOfPerson } from "@/ui";
import { Pressable } from "react-native";

export default function ThreadDetail() {
  const t = useTheme();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const th = useApp((s) => s.threads.find((x) => x.id === threadId));
  const [text, setText] = useState("");
  useEffect(() => { if (th?.unread) actions.markRead(th.id); }, [th?.id, th?.unread]);
  if (!th) return <Screen><TopBar fallback="/inbox" /><Empty title="Not found" body="This conversation moved." /></Screen>;

  return (
    <Screen>
      <TopBar title="Thread" fallback="/inbox" right={
        <View style={{ flexDirection: "row", gap: 14 }}>
          <Pressable onPress={() => actions.toggleStar(th.id)} accessibilityLabel="Star"><Star size={22} color={t.c.ink} fill={th.starred ? t.c.hues.sun.solid : "transparent"} /></Pressable>
          <Pressable onPress={() => { actions.archive(th.id); back("/inbox"); }} accessibilityLabel="Archive"><Archive size={22} color={t.c.ink} /></Pressable>
        </View>
      } />
      <Display size="lg">{th.subject}</Display>
      <View style={{ marginTop: 18, gap: 12 }}>
        {th.messages.map((m) => (
          <Card key={m.id} style={{ padding: 14, ...(m.mine ? { backgroundColor: t.c.paperDeep } : null) }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Avatar name={m.from} size={36} hue={toneOfPerson(m.from)} />
              <View style={{ flex: 1 }}><Text bold>{m.from}</Text><Eyebrow>{m.at}</Eyebrow></View>
            </View>
            <Text style={{ marginTop: 10, lineHeight: 22 }}>{m.body}</Text>
          </Card>
        ))}
      </View>
      <View style={{ marginTop: 18 }}>
        <Field value={text} onChangeText={setText} placeholder="Write a reply" multiline />
        <Button disabled={!text.trim()} onPress={() => { actions.reply(th.id, text.trim()); setText(""); }}>Send reply</Button>
      </View>
    </Screen>
  );
}
