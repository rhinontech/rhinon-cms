import { useState } from "react";
import { View } from "react-native";
import { Paperclip, Star } from "lucide-react-native";

import { useApp } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { Avatar, Badge, Chip, Display, Empty, Eyebrow, Screen, Text, tone, toneOfPerson } from "@/ui";

type Folder = "inbox" | "sent" | "archive";

export default function Inbox() {
  const t = useTheme();
  const brand = useApp((s) => s.brand);
  const threads = useApp((s) => s.threads);
  const [folder, setFolder] = useState<Folder>("inbox");
  const coral = tone(t, "coral");
  const mine = threads.filter((x) => x.brand === brand);
  const unread = mine.filter((x) => x.folder === "inbox" && x.unread).length;
  const rows = mine.filter((x) => x.folder === folder);

  return (
    <Screen>
      <Eyebrow color={coral.text}>Inbox · {unread} unread</Eyebrow>
      <Display style={{ marginTop: 12 }}>{"Mail,\nsorted."}</Display>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 24 }}>
        {(["inbox", "sent", "archive"] as Folder[]).map((f) => (
          <Chip key={f} name="coral" active={folder === f} onPress={() => setFolder(f)} count={f === "inbox" ? unread : undefined}>{f}</Chip>
        ))}
      </View>
      <View style={{ marginTop: 8 }}>
        {rows.length === 0 ? <Empty title="Empty" body="Nothing in this folder." /> : null}
        {rows.map((th) => {
          const last = th.messages[th.messages.length - 1];
          const from = last?.from ?? "";
          return (
            <View key={th.id} style={{ flexDirection: "row", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: t.c.line }}>
              <Avatar name={from} size={46} hue={toneOfPerson(from)} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontFamily: th.unread ? t.f.sansHeavy : t.f.sansBold }}>{from}</Text>
                  <Eyebrow>{th.time}</Eyebrow>
                </View>
                <Text numberOfLines={1} style={{ marginTop: 2, opacity: th.unread ? 1 : 0.65 }}>{th.subject}</Text>
                <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 13, opacity: 0.5 }}>{last?.body}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                  {th.labels.map((l) => <Badge key={l.text} name={l.tone}>{l.text}</Badge>)}
                  {th.attachment ? <Paperclip size={14} color={t.c.ink} /> : null}
                  {th.starred ? <Star size={14} color={t.c.hues.sun.deep} fill={t.c.hues.sun.solid} /> : null}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
