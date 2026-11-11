import { useState } from "react";
import { View } from "react-native";

import { actions, useApp, usePerm } from "@/data/store";
import { go } from "@/lib/nav";
import { Button, Card, Display, Eyebrow, Field, NoAccess, Screen, Sheet, Text, TopBar } from "@/ui";

export default function Pages() {
  const allowed = usePerm("pages");
  const pages = useApp((s) => s.pages);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  if (!allowed) return <Screen><TopBar fallback="/more" /><NoAccess area="Pages" /></Screen>;
  return (
    <Screen>
      <TopBar title="Pages" fallback="/more" />
      <Eyebrow>{pages.length} pages</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Write it\ndown."}</Display>
      <View style={{ marginTop: 20 }}><Button tone="paper" onPress={() => setOpen(true)}>New page</Button></View>
      <View style={{ marginTop: 14, gap: 10 }}>
        {pages.map((p) => (
          <Card key={p.id} onPress={() => go(`/pages/${p.id}`)} style={{ padding: 14 }}>
            <Text bold style={{ fontSize: 16 }}>{p.title}</Text>
            <Eyebrow style={{ marginTop: 4 }}>{p.parent ? "Sub-page · " : ""}updated {p.updated}</Eyebrow>
          </Card>
        ))}
      </View>
      <Sheet open={open} onClose={() => setOpen(false)} title="New page">
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Button disabled={!title.trim()} onPress={() => { const id = actions.createPage(title.trim(), null); setOpen(false); setTitle(""); go(`/pages/${id}`); }}>Create</Button>
      </Sheet>
    </Screen>
  );
}
