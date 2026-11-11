import { DEMO } from "@/lib/demo";
import { useRev } from "@/lib/store";
import { View, Text, Pressable, Link } from "@/components/rn";
import { useRouter } from "@/lib/router";
import { PenLine, Video } from "@/components/icons";
import { useState } from "react";
import { CallOverlay } from "@/components/rhinon/call";
import { ChatAvatar } from "@/components/rhinon/chat";
import {
  Avatar,
  Chip,
  Display,
  Empty,
  Eyebrow,
  IconButton,
  Screen,
  Sheet,
  stagger,
} from "@/components/rhinon/ui";
import { PEOPLE, nameOf } from "@/lib/mock-data";
import { actions, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
type Filter = "all" | "unread" | "dm" | "channel";
export default function ChatPage() {
  useRev();
  const chats = useApp((s) => s.chats);
  const [filter, setFilter] = useState<Filter>("all");
  const [call, setCall] = useState(false);
  const [picking, setPicking] = useState(false);
  const router = useRouter();
  const unread = chats.reduce((n, c) => n + c.unread, 0);
  const rows = chats
    .filter((c) =>
      filter === "unread"
        ? c.unread > 0
        : filter === "dm"
          ? c.kind === "dm"
          : filter === "channel"
            ? c.kind !== "dm"
            : true,
    )
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  return (
    <Screen>
      <View className="animate-rise">
        <View className="flex items-center justify-between">
          <Eyebrow tone="sky">Chat · {unread} unread</Eyebrow>
          <IconButton icon={PenLine} label="New message" onClick={() => setPicking(true)} />
        </View>
        <Display size="hero" className="mt-3">
          Talk it
          {"\n"}
          through.
        </Display>
      </View>

      {DEMO ? (
      <View
        className="mt-6 flex animate-rise items-center gap-3 rounded-3xl bg-sky p-3.5 text-sky-foreground"
        style={stagger(1)}
      >
        <View className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-ink text-paper">
          <Video size={22} />
          <View className="absolute -right-1 -top-1 size-3 rounded-full bg-coral" />
          <View className="absolute -right-1 -top-1 size-3 animate-ping-soft rounded-full bg-coral" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-display text-[length:calc(28px*var(--ds))] font-black leading-none">
            Design crit
          </Text>
          <Text className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.12em]">
            3 in the call · 4 min ago
          </Text>
        </View>
        <Pressable
          onPress={() => setCall(true)}
          className="press rounded-full bg-ink px-4 py-2.5 text-[14px] font-semibold text-paper"
        >
          Join
        </Pressable>
      </View>
      ) : null}

      <View className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {(
          [
            ["all", "All"],
            ["unread", "Unread"],
            ["dm", "People"],
            ["channel", "Channels"],
          ] as [Filter, string][]
        ).map(([v, l]) => (
          <Chip
            key={v}
            active={filter === v}
            onClick={() => setFilter(v)}
            count={v === "unread" ? unread : undefined}
          >
            {l}
          </Chip>
        ))}
      </View>

      {rows.length === 0 ? (
        <Empty
          tone="sky"
          title="All caught up"
          body="No unread conversations. Start a new one with the pen above."
        />
      ) : (
        <View className="mt-3">
          {rows.map((c, i) => {
            const last = c.messages.at(-1);
            const who = !last
              ? ""
              : last.from === "me"
                ? "You: "
                : c.kind === "dm"
                  ? ""
                  : `${nameOf(last.from).split(" ")[0]}: `;
            return (
              <View
                key={c.id}
                className="press relative animate-rise border-b border-line/70 last:border-0"
                style={stagger(Math.min(i + 2, 7))}
              >
                <Link
                  to="/chat/$chatId"
                  params={{
                    chatId: c.id,
                  }}
                  aria-label={c.name}
                  className="absolute inset-0 z-0"
                />
                <View className="pointer-events-none relative z-10 flex items-center gap-3.5 py-3.5">
                  <ChatAvatar chat={c} />
                  <View className="min-w-0 flex-1">
                    <View className="flex items-baseline justify-between gap-2">
                      <Text
                        className={cn(
                          "truncate text-[16px]",
                          c.unread ? "font-bold" : "font-semibold",
                        )}
                      >
                        {c.kind === "channel" ? `# ${c.name}` : c.name}
                      </Text>
                      <View
                        className={cn(
                          "shrink-0 font-mono text-[10.5px]",
                          c.unread ? "text-coral-deep" : "text-ink/45",
                        )}
                      >
                        {c.time}
                      </View>
                    </View>
                    <Text
                      className={cn(
                        "mt-0.5 truncate text-[14px]",
                        c.unread ? "text-ink/80" : "text-ink/50",
                      )}
                    >
                      {last ? `${who}${last.text}` : "Say hello 👋"}
                    </Text>
                  </View>
                  {c.unread > 0 ? (
                    <View className="grid min-w-6 shrink-0 place-items-center rounded-full bg-coral px-1.5 py-0.5 font-mono text-[11px] font-medium text-coral-foreground">
                      {c.unread}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <CallOverlay
        open={call}
        onClose={() => setCall(false)}
        title="Design crit"
        names={["Aanya Rao", "Zoya Khan", "Neha Joshi"]}
        video
      />

      <Sheet open={picking} onClose={() => setPicking(false)} eyebrow="New message" title="Who to?">
        <View className="-mt-1">
          {PEOPLE.map((p) => (
            <View key={p.id}>
              <Pressable
                onPress={() => {
                  const id = actions.startDm(p.id);
                  setPicking(false);
                  void router.navigate({
                    to: "/chat/$chatId",
                    params: {
                      chatId: id,
                    },
                  });
                }}
                className="press flex w-full items-center gap-3.5 border-b border-line/70 py-3 text-left last:border-0"
              >
                <Avatar name={p.name} size={44} online={p.online} />
                <View className="min-w-0 flex-1">
                  <View className="block font-semibold leading-tight">{p.name}</View>
                  <View className="block text-[13px] text-ink/55">{p.role}</View>
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}
