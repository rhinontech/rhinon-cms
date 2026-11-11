import { View, Text, Pressable, TextInput } from "@/components/rn";
import { useLocalSearchParams } from "expo-router";
import { Bot, Info, Phone, Send } from "@/components/icons";
import { useEffect, useRef, useState } from "react";
import { CallOverlay } from "@/components/rhinon/call";
import {
  Avatar,
  Badge,
  Button,
  Display,
  Empty,
  IconButton,
  Screen,
  Sheet,
  TopBar,
} from "@/components/rhinon/ui";
import { actions, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
const QUICK = [
  "Let me check that for you.",
  "Could I get your work email?",
  "I'll book that demo now.",
];
export default function BotChatPage() {
  const { chatId } = useLocalSearchParams<{
    chatId: string;
  }>();
  const chat = useApp((s) => s.botChats.find((c) => c.id === chatId));
  const [text, setText] = useState("");
  const [info, setInfo] = useState(false);
  const [calling, setCalling] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const count = chat?.messages.length ?? 0;
  useEffect(() => {
    bottom.current?.scrollIntoView({
      block: "end",
    });
  }, [count, chat?.status]);
  if (!chat) {
    return (
      <Screen>
        <TopBar title="Live chat" fallback="/chatbot" />
        <Empty title="Chat not found" body="It may have been closed and archived." tone="sky" />
      </Screen>
    );
  }
  const mine = chat.status === "agent";
  const send = (t: string) => {
    const v = t.trim();
    if (!v) return;
    actions.sendBot(chat.id, v);
    setText("");
  };
  return (
    <Screen>
      <TopBar
        fallback="/chatbot"
        center={
          <View className="min-w-0 text-center">
            <Text className="truncate text-[15.5px] font-semibold leading-tight">
              {chat.visitor}
            </Text>
            <Text className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
              {chat.place}
            </Text>
          </View>
        }
        right={
          <>
            <IconButton icon={Phone} label="Call the visitor" onClick={() => setCalling(true)} />
            <IconButton icon={Info} label="Visitor details" onClick={() => setInfo(true)} />
          </>
        }
      />

      {chat.status === "waiting" || chat.status === "bot" ? (
        <View className="mb-4 flex items-center gap-3 rounded-3xl bg-sky p-3.5 text-sky-foreground">
          <View className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink text-paper">
            <Bot size={22} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[15px] font-semibold leading-tight">
              {chat.status === "waiting"
                ? "The visitor asked for a person"
                : "The bot is handling this"}
            </Text>
            <Text className="text-[13px] opacity-80">Take over to reply yourself.</Text>
          </View>
          <Pressable
            onPress={() => actions.takeOver(chat.id)}
            className="press shrink-0 rounded-full bg-ink px-4 py-2.5 text-[14px] font-semibold text-paper"
          >
            Take over
          </Pressable>
        </View>
      ) : null}
      {chat.status === "closed" ? (
        <Text className="mb-4 rounded-2xl bg-paper-deep px-4 py-3 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60">
          This chat is closed
        </Text>
      ) : null}

      <View className="space-y-2">
        {chat.messages.map((m) => {
          const right = m.who === "agent";
          return (
            <View key={m.id} className={cn("flex", right ? "justify-end" : "justify-start")}>
              <View
                className={cn("flex max-w-[82%] flex-col", right ? "items-end" : "items-start")}
              >
                {m.who === "bot" ? (
                  <View className="mb-1 inline-flex items-center gap-1 pl-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                    <Bot size={12} /> Bot
                  </View>
                ) : null}
                <View
                  className={cn(
                    "rounded-[calc(var(--radius)+6px)] px-4 py-2.5 text-[15.5px] leading-snug",
                    right
                      ? "rounded-br-md bg-ink text-paper"
                      : m.who === "bot"
                        ? "rounded-bl-md border border-dashed border-ink/25 bg-paper-deep"
                        : "rounded-bl-md border border-line/70 bg-card",
                  )}
                >
                  {m.text}
                </View>
                <View className="mt-1 px-1 font-mono text-[10px] text-ink/40">{m.at}</View>
              </View>
            </View>
          );
        })}
      </View>
      <View ref={bottom} className="scroll-mb-[150px]" />

      {mine ? (
        <View className="sticky bottom-0 z-20 -mx-5 mt-auto bg-gradient-to-t from-paper from-70% to-transparent px-5 pb-1 pt-8">
          <View className="no-scrollbar -mx-5 mb-2 flex gap-2 overflow-x-auto px-5">
            {QUICK.map((q) => (
              <Pressable
                key={q}
                onPress={() => send(q)}
                className="press shrink-0 rounded-full border border-ink/20 bg-card px-3.5 py-2 text-[13px]"
              >
                {q}
              </Pressable>
            ))}
          </View>
          <View className="flex items-center gap-2">
            <TextInput
              className="h-[52px] w-full rounded-full border border-line bg-card px-5 text-[15px] outline-none transition-colors placeholder:text-ink/35 focus:border-ink"
              placeholder="Reply as Rhinon support"
              value={text}
              onChangeText={(text) => setText(text)}
              onSubmitEditing={() => send(text)}
            />
            <Pressable
              accessibilityLabel="Send"
              onPress={() => send(text)}
              disabled={!text.trim()}
              className="press grid size-[52px] shrink-0 place-items-center rounded-full bg-sky text-sky-foreground disabled:opacity-30"
            >
              <Send size={20} strokeWidth={2.2} />
            </Pressable>
          </View>
          <Pressable
            onPress={() => actions.closeBot(chat.id)}
            className="press mt-2 w-full py-2 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink/55 underline underline-offset-4"
          >
            Close this chat
          </Pressable>
        </View>
      ) : null}

      <Sheet open={info} onClose={() => setInfo(false)} eyebrow="Visitor">
        <View className="flex items-center gap-4">
          <Avatar name={chat.visitor} size={64} />
          <View className="min-w-0">
            <Display as="h2" size="md">
              {chat.visitor}
            </Display>
            <Badge tone="sky" className="mt-1.5">
              {chat.place}
            </Badge>
          </View>
        </View>
        <View className="mt-5 divide-y divide-line/70 rounded-3xl border border-line/70 bg-card px-4">
          {[
            ["Viewing", chat.page],
            ["Came from", chat.source],
            ["Device", chat.device],
          ].map(([k, v]) => (
            <View key={k} className="flex items-center justify-between gap-4 py-3.5">
              <View className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink/50">
                {k}
              </View>
              <View className="truncate text-[14.5px] font-medium">{v}</View>
            </View>
          ))}
        </View>
        <Button
          tone="ink"
          className="mt-4"
          onClick={() => {
            actions.saved("Lead created from this chat", "sky");
            setInfo(false);
          }}
        >
          Create a lead
        </Button>
      </Sheet>
      <CallOverlay
        open={calling}
        onClose={() => setCalling(false)}
        title={chat.visitor}
        names={[chat.visitor]}
      />
    </Screen>
  );
}
