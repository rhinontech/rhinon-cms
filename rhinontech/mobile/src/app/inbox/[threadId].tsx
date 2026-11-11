import { View, Text, Pressable, TextInput } from "@/components/rn";
import { Path, Svg } from "react-native-svg";
import { useLocalSearchParams } from "expo-router";
import { Archive, Paperclip, RefreshCw, Send, Star } from "@/components/icons";
import { useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Display,
  Empty,
  Eyebrow,
  IconButton,
  Screen,
  TopBar,
  inputClass,
} from "@/components/rhinon/ui";
import { AttachmentRow, AttachSheet, PreviewSheet } from "@/components/rhinon/attach";
import { BRANDS } from "@/lib/mock-data";
import type { Attachment } from "@/lib/mock-more";
import { actions, useApp } from "@/lib/store";
import { TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
export default function ThreadPage() {
  const { threadId } = useLocalSearchParams<{
    threadId: string;
  }>();
  const thread = useApp((s) => s.threads.find((t) => t.id === threadId));
  const [reply, setReply] = useState("");
  const [drafted, setDrafted] = useState(false);
  const [replyFiles, setReplyFiles] = useState<Attachment[]>([]);
  const [picking, setPicking] = useState(false);
  const [preview, setPreview] = useState<Attachment | null>(null);
  useEffect(() => {
    actions.markRead(threadId);
  }, [threadId]);
  if (!thread) {
    return (
      <Screen>
        <TopBar title="Thread" fallback="/inbox" />
        <Empty title="Thread not found" body="It may have been moved or deleted." tone="coral" />
      </Screen>
    );
  }
  const brand = BRANDS.find((b) => b.id === thread.brand);
  const files: Attachment[] =
    thread.files ??
    (thread.attachment
      ? [
          {
            id: `${thread.id}-f`,
            name: thread.id === "th1" ? "Atlas-pricing-40-seats.pdf" : "attachment.pdf",
            kind: "pdf",
            size: "248 KB",
          },
        ]
      : []);
  const firstOther = thread.messages.find((m) => !m.mine);
  const replyTo = firstOther?.from.split(" ")[0] ?? "everyone";
  const send = () => {
    if (!reply.trim()) return;
    actions.reply(thread.id, reply.trim(), replyFiles);
    setReplyFiles([]);
    setReply("");
    setDrafted(false);
  };
  return (
    <Screen>
      <TopBar
        title="Thread"
        fallback="/inbox"
        right={
          <>
            <IconButton
              icon={Star}
              label={thread.starred ? "Remove star" : "Star"}
              onClick={() => actions.toggleStar(thread.id)}
              className={cn(thread.starred && "[&>svg]:fill-sun [&>svg]:text-sun-deep")}
            />
            <IconButton icon={Archive} label="Archive" onClick={() => actions.archive(thread.id)} />
          </>
        }
      />

      <View className="flex flex-wrap items-center gap-2">
        {brand ? <Badge tone={brand.tone}>{brand.name}</Badge> : null}
        {thread.labels.map((l) => (
          <Badge key={l.text} tone={l.tone}>
            {l.text}
          </Badge>
        ))}
      </View>

      <Display size="xl" className="mt-4">
        {thread.subject}
      </Display>

      <View className="mt-6 space-y-3">
        {thread.messages.map((m, i) => (
          <View
            key={m.id}
            className={cn(
              "animate-rise rounded-3xl p-4",
              m.mine ? "bg-paper-deep" : "border border-line/70 bg-card",
            )}
            style={{
              animationDelay: `${i * 70}ms`,
            }}
          >
            <View className="flex items-center gap-3">
              <Avatar name={m.from} size={40} />
              <View className="min-w-0 flex-1">
                <Text className="truncate text-[15px] font-semibold leading-tight">
                  {m.mine ? "You" : m.from}
                </Text>
                <Text className="truncate font-mono text-[11px] text-ink/50">{m.email}</Text>
              </View>
              <View className="shrink-0 font-mono text-[10.5px] text-ink/50">{m.at}</View>
            </View>
            <Text className="mt-3.5 whitespace-pre-line text-[15.5px] leading-relaxed text-ink/85">
              {m.body}
            </Text>
          </View>
        ))}
      </View>

      {files.length > 0 ? (
        <View className="mt-3 space-y-2">
          {files.map((f) => (
            <AttachmentRow key={f.id} file={f} onOpen={setPreview} />
          ))}
        </View>
      ) : null}

      {thread.copilot ? (
        <View className="mt-5 rounded-3xl bg-ink p-5 text-paper">
          <View className="flex items-center gap-3">
            <View className="grid size-11 place-items-center rounded-2xl border border-paper/10 bg-paper/5">
              <Svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                className="text-on-ink-accent"
              >
                <Path
                  d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-on-ink-accent">
              Copilot · suggested reply
            </Text>
          </View>
          <Text className="mt-4 text-[15.5px] leading-relaxed text-paper/85">{thread.copilot}</Text>
          <View className="mt-5 grid grid-cols-[1fr_auto] gap-2.5">
            <Button
              tone="paper"
              size="md"
              onClick={() => {
                setReply(thread.copilot ?? "");
                setDrafted(true);
              }}
            >
              Use this draft
            </Button>
            <Pressable
              accessibilityLabel="Regenerate draft"
              onPress={() => actions.toast("Drafting another version…", "sun")}
              className="press grid size-12 place-items-center rounded-full border border-paper/20 text-paper"
            >
              <RefreshCw size={18} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <Text className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
        Shown as plain text · images and scripts are never loaded
      </Text>

      <View className="sticky bottom-0 z-20 -mx-5 mt-auto bg-gradient-to-t from-paper from-70% to-transparent px-5 pb-1 pt-8">
        {drafted ? (
          <Eyebrow tone="coral" className="mb-2 pl-1">
            Draft from Copilot · edit before sending
          </Eyebrow>
        ) : null}
        {replyFiles.length > 0 ? (
          <View className="mb-2 space-y-2">
            {replyFiles.map((f) => (
              <AttachmentRow
                key={f.id}
                file={f}
                onRemove={(x) => setReplyFiles((cur) => cur.filter((y) => y.id !== x.id))}
              />
            ))}
          </View>
        ) : null}
        <View className="flex items-end gap-2">
          <Pressable
            accessibilityLabel="Attach a file"
            onPress={() => setPicking(true)}
            className="press grid size-[52px] shrink-0 place-items-center rounded-full border border-ink/15 bg-card"
          >
            <Paperclip size={20} />
          </Pressable>
          <TextInput
            rows={drafted ? 4 : 1}
            className={cn(inputClass, "resize-none rounded-3xl py-3.5 pl-5")}
            placeholder={`Reply to ${replyTo}…`}
            value={reply}
            onChangeText={(text) => setReply(text)}
          />
          <Pressable
            accessibilityLabel="Send reply"
            onPress={send}
            disabled={!reply.trim()}
            className={cn(
              "press grid size-[52px] shrink-0 place-items-center rounded-full disabled:opacity-30",
              TONES.coral.solid,
            )}
          >
            <Send size={20} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
      <AttachSheet
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(picked) => setReplyFiles((cur) => [...cur, ...picked])}
      />
      <PreviewSheet file={preview} onClose={() => setPreview(null)} />
    </Screen>
  );
}
