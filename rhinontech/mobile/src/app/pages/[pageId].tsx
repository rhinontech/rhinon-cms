import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Switch, View } from "react-native";

import { actions, useApp } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Display, Empty, Eyebrow, Field, Screen, Text, TopBar } from "@/ui";

export default function Page() {
  const t = useTheme();
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const page = useApp((s) => s.pages.find((p) => p.id === pageId));
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  if (!page) return <Screen><TopBar fallback="/pages" /><Empty title="Not found" body="This page was deleted." /></Screen>;
  return (
    <Screen>
      <TopBar title="Page" fallback="/pages" right={<Text bold onPress={() => { if (editing) { actions.savePage(page.id, title.trim() || page.title, body); } else { setTitle(page.title); setBody(page.body); } setEditing(!editing); }}>{editing ? "Save" : "Edit"}</Text>} />
      <Eyebrow>Updated {page.updated}</Eyebrow>
      {editing ? <View style={{ marginTop: 12 }}><Field value={title} onChangeText={setTitle} /><Field value={body} onChangeText={setBody} multiline style={{ minHeight: 280 }} /></View> : (<><Display size="lg" style={{ marginTop: 10 }}>{page.title}</Display><Text style={{ marginTop: 16, lineHeight: 24 }}>{page.body}</Text></>)}
      <View style={{ marginTop: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text>Anyone with the link can view</Text>
        <Switch value={page.linkShare} onValueChange={(v) => actions.sharePage(page.id, page.sharedWith, v)} trackColor={{ true: t.c.hues.leaf.solid }} />
      </View>
      <View style={{ marginTop: 16 }}><Button tone="paper" onPress={() => actions.toast("Link copied", "sky")}>Copy link</Button></View>
    </Screen>
  );
}
