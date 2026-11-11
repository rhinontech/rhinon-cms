import { useState } from "react";
import { View } from "react-native";

import { actions, useApp, usePerm } from "@/data/store";
import { Badge, Button, Card, Chip, Display, Empty, Eyebrow, Field, NoAccess, Screen, Segmented, Text, TopBar } from "@/ui";

type Tab = "chats" | "tickets";

export default function Chatbot() {
  const allowed = usePerm("chatbot");
  const chats = useApp((s) => s.botChats);
  const tickets = useApp((s) => s.tickets);
  const [tab, setTab] = useState<Tab>("chats");
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");
  if (!allowed) return <Screen><TopBar fallback="/more" /><NoAccess area="the chatbot" /></Screen>;
  const waiting = chats.filter((c) => c.status === "waiting").length;

  return (
    <Screen>
      <TopBar title="Chatbot" fallback="/more" />
      <Eyebrow>{waiting} waiting</Eyebrow>
      <Display style={{ marginTop: 10 }}>{"Visitors,\nlive."}</Display>
      <View style={{ marginTop: 22 }}><Segmented value={tab} onChange={setTab} options={[{ value: "chats", label: "Live chats" }, { value: "tickets", label: "Tickets" }]} /></View>

      {tab === "chats" ? (
        <View style={{ marginTop: 18, gap: 10 }}>
          {chats.length === 0 ? <Empty title="Quiet" body="No visitors chatting right now." /> : null}
          {chats.map((c) => (
            <Card key={c.id} onPress={() => setOpen(open === c.id ? null : c.id)} style={{ padding: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text bold style={{ fontSize: 16 }}>{c.visitor}</Text>
                <Badge name={c.status === "waiting" ? "coral" : c.status === "agent" ? "leaf" : "ink"}>{c.status}</Badge>
              </View>
              <Eyebrow style={{ marginTop: 4 }}>{c.place} · {c.page} · {c.time}</Eyebrow>
              {open === c.id ? (
                <View style={{ marginTop: 12, gap: 8 }}>
                  {c.messages.map((m) => <Text key={m.id} style={{ opacity: m.who === "visitor" ? 1 : 0.65 }}><Text bold>{m.who}: </Text>{m.text}</Text>)}
                  {c.status === "waiting" || c.status === "bot" ? <Button tone="coral" onPress={() => actions.takeOver(c.id)}>Take over</Button> : null}
                  {c.status === "agent" ? (
                    <>
                      <Field value={text} onChangeText={setText} placeholder="Reply to visitor" />
                      <Button disabled={!text.trim()} onPress={() => { actions.sendBot(c.id, text.trim()); setText(""); }}>Send</Button>
                      <Button tone="paper" onPress={() => actions.closeBot(c.id)}>Close chat</Button>
                    </>
                  ) : null}
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}

      {tab === "tickets" ? (
        <View style={{ marginTop: 18, gap: 10 }}>
          {tickets.map((k) => (
            <Card key={k.id} onPress={() => setOpen(open === k.id ? null : k.id)} style={{ padding: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Text bold style={{ flex: 1 }}>{k.subject}</Text>
                <Badge name={k.status === "Resolved" ? "leaf" : k.status === "Open" ? "coral" : "sun"}>{k.status}</Badge>
              </View>
              <Eyebrow style={{ marginTop: 4 }}>{k.from} · {k.priority} · {k.updated}</Eyebrow>
              {open === k.id ? (
                <View style={{ marginTop: 12, gap: 8 }}>
                  {k.messages.map((m) => <Text key={m.id} style={{ opacity: m.who === "customer" ? 1 : 0.65 }}><Text bold>{m.who}: </Text>{m.text}</Text>)}
                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>{(["Open", "Pending", "Resolved"] as const).map((s) => <Chip key={s} active={k.status === s} onPress={() => actions.setTicketStatus(k.id, s)}>{s}</Chip>)}</View>
                  <Field value={text} onChangeText={setText} placeholder="Reply" />
                  <Button disabled={!text.trim()} onPress={() => { actions.replyTicket(k.id, text.trim()); setText(""); }}>Send reply</Button>
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
