import { useState } from "react";
import { Switch, View } from "react-native";

import { PERM_RESOURCES, ROLE_META, type RoleId } from "@/data/mock-more";
import { actions, useApp, usePerm } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { Card, Display, Eyebrow, NoAccess, Screen, SectionLabel, Text, TopBar, Avatar } from "@/ui";

export default function Settings() {
  const t = useTheme();
  const allowed = usePerm("settings");
  const perms = useApp((s) => s.perms);
  const [open, setOpen] = useState<RoleId | null>(null);
  if (!allowed) return <Screen><TopBar fallback="/more" /><NoAccess area="Settings" /></Screen>;
  return (
    <Screen>
      <TopBar title="Settings" fallback="/more" />
      <Eyebrow>Rhinon Tech workspace</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Set the\nrules."}</Display>
      <SectionLabel>Roles and permissions</SectionLabel>
      <View style={{ gap: 10 }}>
        {ROLE_META.map((r) => (
          <Card key={r.id} onPress={() => setOpen(open === r.id ? null : r.id)} style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar name={r.name} size={44} />
              <View style={{ flex: 1 }}><Text bold style={{ fontSize: 16 }}>{r.name}{r.locked ? "  🔒" : ""}</Text><Text style={{ fontSize: 13, opacity: 0.6 }}>{r.users} people · {Object.values(perms[r.id]).filter((p) => p.read).length} of {PERM_RESOURCES.length} areas</Text></View>
            </View>
            {open === r.id ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ opacity: 0.65, marginBottom: 8 }}>{r.blurb}</Text>
                {PERM_RESOURCES.map((res) => (
                  <View key={res.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 10 }}>
                    <Text style={{ flex: 1 }}>{res.label}</Text>
                    <Eyebrow>Read</Eyebrow><Switch disabled={r.locked} value={perms[r.id][res.id]?.read ?? false} onValueChange={(v) => actions.setPerm(r.id, res.id, "read", v)} trackColor={{ true: t.c.hues.leaf.solid }} />
                    <Eyebrow>Write</Eyebrow><Switch disabled={r.locked} value={perms[r.id][res.id]?.write ?? false} onValueChange={(v) => actions.setPerm(r.id, res.id, "write", v)} trackColor={{ true: t.c.hues.leaf.solid }} />
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        ))}
      </View>
      <Text style={{ marginTop: 14, opacity: 0.6, fontSize: 13 }}>Changes apply live. The server still checks every request.</Text>
    </Screen>
  );
}
