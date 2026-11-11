import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Check } from "lucide-react-native";

import { ME } from "@/data/mock-data";
import { DOC_BODY } from "@/data/mock-more";
import { actions, useApp } from "@/data/store";
import { back } from "@/lib/nav";
import { useTheme } from "@/theme/ThemeProvider";
import { Button, Card, Display, Empty, Eyebrow, Field, Screen, SectionLabel, Text, TopBar } from "@/ui";

export default function Sign() {
  const t = useTheme();
  const { docId } = useLocalSearchParams<{ docId: string }>();
  const doc = useApp((s) => s.docs.find((d) => d.id === docId));
  const [name, setName] = useState<string>(ME.name);
  const [agree, setAgree] = useState(false);
  if (!doc) return <Screen><TopBar fallback="/documents" /><Empty title="Not found" body="HR may have withdrawn it." /></Screen>;
  if (doc.state === "signed") return <Screen><TopBar fallback="/documents" /><Display size="xl">Signed.</Display><Text style={{ marginTop: 12 }}>“{doc.name}” is signed and filed in your vault.</Text><View style={{ marginTop: 20 }}><Button onPress={() => back("/documents")}>Back to documents</Button></View></Screen>;
  const body = DOC_BODY[doc.id] ?? ["Read this document, then sign below."];
  const ready = agree && name.trim().length > 2;
  return (
    <Screen>
      <TopBar title="Sign" fallback="/documents" />
      <Eyebrow>{doc.date}</Eyebrow>
      <Display size="xl" style={{ marginTop: 8 }}>{doc.name}</Display>
      <Card style={{ marginTop: 18, gap: 12, padding: 18 }}>{body.map((p, i) => <Text key={i} style={{ lineHeight: 22 }}>{p}</Text>)}</Card>
      <SectionLabel>Your signature</SectionLabel>
      <Field value={name} onChangeText={setName} placeholder="Your full name" />
      <Card style={{ height: 96, alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 40, fontStyle: "italic" }}>{name || "Your name"}</Text></Card>
      <Pressable onPress={() => setAgree((a) => !a)} style={{ flexDirection: "row", gap: 12, marginVertical: 18, alignItems: "flex-start" }}>
        <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: t.c.ink, backgroundColor: agree ? t.c.ink : "transparent", alignItems: "center", justifyContent: "center" }}>{agree ? <Check size={16} color={t.c.paper} strokeWidth={3.4} /> : null}</View>
        <Text style={{ flex: 1, fontSize: 14 }}>I have read this document and agree that my typed signature is legally binding.</Text>
      </Pressable>
      <Button disabled={!ready} onPress={() => actions.signDoc(doc.id)}>Sign and submit</Button>
    </Screen>
  );
}
