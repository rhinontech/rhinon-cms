import { useMemo, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { BellOff, Hash, MessagesSquare, Pin, Plus, Users } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { useConversationTitle } from "@/lib/chat";
import { shortTime } from "@/lib/format";
import type { Conversation } from "@/lib/types";
import { Avatar, Backdrop, Card, CountDot, EmptyState, ErrorState, GlassHeader, HeaderButton, IconTile, ListSkeleton, SearchBar, Segmented, Tappable, Text } from "@/components/ui";

type Filter = "all" | "unread" | "channels";

export default function ChatScreen() {
  const { colors } = useTheme();
    const { can } = useAuth();
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

  const unreadTotal = (data ?? []).reduce((sum, c) => sum + c.unread, 0);

  return (
    <View className="flex-1 bg-background">
      <Backdrop />
      <GlassHeader title="Chat" subtitle={unreadTotal ? `${unreadTotal} unread` : "Your team"} right={can("chat:write") ? <HeaderButton icon={Plus} label="New chat" onPress={() => router.push("/chat/new")} /> : undefined}>
        <View className="mt-3 gap-3">
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
      </GlassHeader>
            <FlatList
        data={rows}
        keyExtractor={(r) => r.c.id}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground}  />}
        renderItem={({ item: { c, title, person } }) => {
          const author = c.lastMessage ? people.get(c.lastMessage.authorId) : null;
          const preview = c.lastMessage
            ? c.lastMessage.deleted
              ? "Message deleted"
              : `${c.kind !== "direct" && author ? `${author.name.split(" ")[0]}: ` : ""}${c.lastMessage.body || (c.lastMessage.attachments.length ? "📎 Attachment" : "")}`
            : c.description || "No messages yet";
          return (
            <Tappable
              className="mx-4"
              scale={0.985}
              onPress={() => router.push({ pathname: "/chat/[id]", params: { id: c.id, title, kind: c.kind, presence: person?.presence ?? "", avatar: person?.avatarUrl ?? "" } })}
            >
              <Card className="flex-row items-center gap-3 p-3.5">
                {c.kind === "channel" ? (
                  <IconTile icon={Hash} size={48} />
                ) : c.kind === "direct" ? (
                  <Avatar name={title} uri={person?.avatarUrl} size={48} online={person ? person.presence === "online" : undefined} />
                ) : (
                  <IconTile icon={Users} size={48} />
                )}
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text numberOfLines={1} className={`flex-1 text-[15.5px] ${c.unread ? "font-semibold" : "font-medium"}`}>
                      {title.replace(/^# /, "")}
                    </Text>
                    {c.pinned && <Pin size={13} color={colors.brand} />}
                    {c.muted && <BellOff size={13} color={colors.mutedForeground} />}
                    <Text variant="caption" className={c.unread ? "font-medium text-brand" : undefined}>
                      {shortTime(c.lastMessageAt)}
                    </Text>
                  </View>
                  <View className="mt-1 flex-row items-center gap-2">
                    <Text numberOfLines={1} className={`flex-1 text-[14px] ${c.unread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {preview}
                    </Text>
                    <CountDot count={c.unread} />
                  </View>
                </View>
              </Card>
            </Tappable>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ListSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={refresh} />
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title={filter === "unread" ? "No unread messages" : "No conversations"}
              message="Start a conversation from the web app and it will show up here."
            />
          )
        }
      />
          </View>
  );
}
