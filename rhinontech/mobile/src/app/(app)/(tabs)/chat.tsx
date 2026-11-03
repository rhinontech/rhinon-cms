import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { BellOff, Hash, MessagesSquare, Pin } from "lucide-react-native";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { useConversationTitle } from "@/lib/chat";
import { shortTime } from "@/lib/format";
import { tap } from "@/lib/haptics";
import type { Conversation } from "@/lib/types";
import { Avatar, CountDot, EmptyState, ErrorState, LargeHeader, ListSkeleton, SearchBar, Segmented, Text } from "@/components/ui";

type Filter = "all" | "unread" | "channels";

export default function ChatScreen() {
  const { colors } = useTheme();
  const { titleOf, people } = useConversationTitle();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const { data, error, loading, refreshing, refresh } = useApi<Conversation[]>("/team-chat/conversations", { pollMs: 10_000 });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? [])
      .map((c) => ({ c, ...titleOf(c) }))
      .filter(({ c, title }) => {
        if (filter === "unread" && !c.unread) return false;
        if (filter === "channels" && c.kind !== "channel") return false;
        return !term || title.toLowerCase().includes(term);
      })
      .sort((a, b) => Number(b.c.pinned) - Number(a.c.pinned));
    // titleOf changes identity each render; people is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filter, search, people]);

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={rows}
        keyExtractor={(r) => r.c.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground} />}
        ListHeaderComponent={
          <>
            <LargeHeader title="Chat" />
            <View className="gap-3 px-5 pb-2">
              <SearchBar value={search} onChangeText={setSearch} placeholder="Search conversations" />
              <Segmented
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "All" },
                  { value: "unread", label: "Unread" },
                  { value: "channels", label: "Channels" },
                ]}
              />
            </View>
          </>
        }
        renderItem={({ item: { c, title, person } }) => {
          const author = c.lastMessage ? people.get(c.lastMessage.authorId) : null;
          const preview = c.lastMessage
            ? c.lastMessage.deleted
              ? "Message deleted"
              : `${c.kind !== "direct" && author ? `${author.name.split(" ")[0]}: ` : ""}${c.lastMessage.body || (c.lastMessage.attachments.length ? "📎 Attachment" : "")}`
            : c.description || "No messages yet";
          return (
            <Pressable
              onPress={() => {
                tap();
                router.push({ pathname: "/chat/[id]", params: { id: c.id, title } });
              }}
              className="flex-row items-center gap-3 px-5 py-3 active:bg-muted"
            >
              {c.kind === "channel" ? (
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  <Hash size={20} color={colors.foreground} />
                </View>
              ) : (
                <Avatar name={title} uri={person?.avatarUrl} size={48} online={person ? person.presence === "online" : undefined} />
              )}
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text numberOfLines={1} className={`flex-1 text-[15px] ${c.unread ? "font-semibold" : "font-medium"}`}>
                    {title.replace(/^# /, "")}
                  </Text>
                  {c.pinned && <Pin size={12} color={colors.mutedForeground} />}
                  {c.muted && <BellOff size={12} color={colors.mutedForeground} />}
                  <Text variant="caption" className={c.unread ? "text-brand" : undefined}>
                    {shortTime(c.lastMessageAt)}
                  </Text>
                </View>
                <View className="mt-0.5 flex-row items-center gap-2">
                  <Text numberOfLines={1} className={`flex-1 text-[14px] ${c.unread ? "text-foreground" : "text-muted-foreground"}`}>
                    {preview}
                  </Text>
                  <CountDot count={c.unread} />
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ListSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={refresh} />
          ) : (
            <EmptyState
              icon={<MessagesSquare size={24} color={colors.mutedForeground} />}
              title={filter === "unread" ? "No unread messages" : "No conversations"}
              message="Start a conversation from the web app and it will show up here."
            />
          )
        }
      />
    </View>
  );
}
