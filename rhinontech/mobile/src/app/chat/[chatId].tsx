import { loadChatMessages, useLoad } from "@/lib/live";
import { useRev } from "@/lib/store";
import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { useLocalSearchParams } from "expo-router";
import { Phone, Plus, Send, Video } from "@/components/icons";
import { Fragment, useEffect, useRef, useState } from "react";
import { CallOverlay } from "@/components/rhinon/call";
import { AttachmentRow, AttachSheet, PreviewSheet } from "@/components/rhinon/attach";
import { ChatAvatar } from "@/components/rhinon/chat";
import type { Attachment } from "@/lib/mock-more";
import {
  Avatar,
  Display,
  Empty,
  Eyebrow,
  IconButton,
  Screen,
  TopBar,
} from "@/components/rhinon/ui";
import { nameOf, personOf } from "@/lib/mock-data";
import { actions, useApp } from "@/lib/store";
import { TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
const REPLIES = [
  "Got it 👍",
  "On it — give me ten minutes.",
  "Love that. Let's do it.",
  "Thanks! Sending it over now.",
];
export default function ChatThread() {
  useRev();
  const { chatId } = useLocalSearchParams<{
    chatId: string;
  }>();
  useLoad(loadChatMessages, chatId);
  const chat = useApp((s) => s.chats.find((c) => c.id === chatId));
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [call, setCall] = useState<"voice" | "video" | null>(null);
  const [picking, setPicking] = useState(false);
  const [preview, setPreview] = useState<Attachment | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const count = chat?.messages.length ?? 0;
  useEffect(() => {
    actions.markChatRead(chatId);
  }, [chatId]);
  useEffect(() => {
    bottom.current?.scrollIntoView({
      block: "end",
    });
  }, [count, typing, chatId]);
  if (!chat) {
    return (
      <Screen>
        <TopBar title="Chat" fallback="/chat" />
        <Empty title="Conversation not found" body="It may have been archived." tone="sky" />
      </Screen>
    );
  }
  const isDm = chat.kind === "dm";
  const peer = isDm ? personOf(chat.members[0] ?? "") : null;
  const callNames = chat.members.map(nameOf);
  const send = () => {
    const t = text.trim();
    if (!t) return;
    actions.sendChat(chat.id, t);
    setText("");
    if (isDm && peer) {
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        actions.receive(
          chat.id,
          peer.id,
          REPLIES[Math.floor(Math.random() * REPLIES.length)] ?? "👍",
        );
      }, 1700);
    }
  };
  return (
    <Screen>
      <TopBar
        fallback="/chat"
        center={
          <View className="flex min-w-0 items-center gap-2.5">
            <ChatAvatar chat={chat} size={38} />
            <View className="min-w-0">
              <Text className="truncate text-[15.5px] font-semibold leading-tight">
                {chat.kind === "channel" ? `# ${chat.name}` : chat.name}
              </Text>
              <Text className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                {isDm ? (peer?.online ? "online" : "away") : `${chat.members.length + 1} members`}
              </Text>
            </View>
          </View>
        }
        right={
          <>
            <IconButton icon={Phone} label="Voice call" onClick={() => setCall("voice")} />
            <IconButton icon={Video} label="Video call" onClick={() => setCall("video")} />
          </>
        }
      />

      {chat.messages.length === 0 ? (
        <View className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
          <ChatAvatar chat={chat} size={88} />
          <Display as="h2" size="lg" className="mt-5">
            Say hi to {chat.name.split(" ")[0]}
          </Display>
          <Text className="mt-2 text-[14px] text-ink/55">
            This is the start of your conversation.
          </Text>
        </View>
      ) : (
        <View className="space-y-1.5">
          <Eyebrow tone="muted" className="mb-3 text-center">
            Today
          </Eyebrow>
          {chat.messages.map((m, i) => {
            const mine = m.from === "me";
            const prev = chat.messages[i - 1];
            const head = !prev || prev.from !== m.from;
            return (
              <Fragment key={m.id}>
                <View
                  className={cn(
                    "flex gap-2.5",
                    mine ? "justify-end" : "justify-start",
                    head && i > 0 && "pt-2.5",
                  )}
                >
                  {!mine && !isDm ? (
                    head ? (
                      <Avatar name={nameOf(m.from)} size={32} />
                    ) : (
                      <View className="w-8 shrink-0" />
                    )
                  ) : null}
                  <View
                    className={cn("flex max-w-[80%] flex-col", mine ? "items-end" : "items-start")}
                  >
                    {!mine && !isDm && head ? (
                      <Text className="mb-1 pl-1 text-[12px] font-semibold text-ink/60">
                        {nameOf(m.from)}
                      </Text>
                    ) : null}
                    {m.text ? (
                      <View
                        className={cn(
                          "rounded-[calc(var(--radius)+6px)] px-4 py-2.5 text-[15.5px] leading-snug",
                          mine
                            ? "rounded-br-md bg-ink text-paper"
                            : "rounded-bl-md border border-line/70 bg-card",
                        )}
                      >
                        {m.text.split(/(@\w+)/g).map((part, k) =>
                          part.startsWith("@") ? (
                            <Span
                              key={k}
                              className={cn(
                                "font-semibold",
                                mine ? "text-on-ink-accent" : "text-cobalt-deep",
                              )}
                            >
                              {part}
                            </Span>
                          ) : (
                            part
                          ),
                        )}
                      </View>
                    ) : null}
                    {m.attachment ? (
                      <AttachmentRow
                        file={m.attachment}
                        onOpen={setPreview}
                        className={m.text ? "mt-1.5" : ""}
                      />
                    ) : null}
                    {i === chat.messages.length - 1 ? (
                      <Text className="mt-1 px-1 font-mono text-[10px] text-ink/40">{m.at}</Text>
                    ) : null}
                  </View>
                </View>
              </Fragment>
            );
          })}
          {typing ? (
            <View className="flex justify-start pt-2.5">
              <View className="flex items-center gap-1 rounded-[calc(var(--radius)+6px)] rounded-bl-md border border-line/70 bg-card px-4 py-3.5">
                {[0, 1, 2].map((d) => (
                  <View
                    key={d}
                    className="size-2 animate-shimmer rounded-full bg-ink/40"
                    style={{
                      animationDelay: `${d * 180}ms`,
                    }}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      )}

      <View ref={bottom} className="scroll-mb-[120px]" />

      <View className="sticky bottom-0 z-20 -mx-5 mt-auto flex items-center gap-2 bg-gradient-to-t from-paper from-70% to-transparent px-5 pb-1 pt-8">
        <Pressable
          accessibilityLabel="Attach"
          onPress={() => setPicking(true)}
          className="press grid size-[52px] shrink-0 place-items-center rounded-full border border-ink/15 bg-card"
        >
          <Plus size={22} />
        </Pressable>
        <TextInput
          className="h-[52px] w-full rounded-full border border-line bg-card px-5 text-[15px] outline-none transition-colors placeholder:text-ink/35 focus:border-ink"
          placeholder="Message"
          value={text}
          onChangeText={(text) => setText(text)}
          onSubmitEditing={() => send()}
        />
        <Pressable
          accessibilityLabel="Send"
          onPress={send}
          disabled={!text.trim()}
          className={cn(
            "press grid size-[52px] shrink-0 place-items-center rounded-full disabled:opacity-30",
            TONES.sky.solid,
          )}
        >
          <Send size={20} strokeWidth={2.2} />
        </Pressable>
      </View>

      <AttachSheet
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(picked) => picked.forEach((f) => actions.sendChat(chat.id, "", f))}
      />
      <PreviewSheet file={preview} onClose={() => setPreview(null)} />
      <CallOverlay
        open={call !== null}
        onClose={() => setCall(null)}
        title={chat.kind === "channel" ? `# ${chat.name}` : chat.name}
        names={callNames.length ? callNames : [chat.name]}
        video={call === "video"}
      />
    </Screen>
  );
}
