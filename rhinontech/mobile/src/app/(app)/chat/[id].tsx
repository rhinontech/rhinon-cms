import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUp } from "lucide-react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { useChatDirectory } from "@/lib/chat";
import { useTheme } from "@/lib/theme";
import { tap } from "@/lib/haptics";
import type { ChatMessage } from "@/lib/types";
import { Avatar, ErrorState, Spinner, Text } from "@/components/ui";

const GROUP_GAP_MS = 5 * 60 * 1000;

function dayLabel(d: Date) {
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

export default function ConversationScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { me, can } = useAuth();
  const people = useChatDirectory();
  const { data, setData, error, loading, refresh } = useApi<{ messages: ChatMessage[]; hasMore: boolean }>(
    `/team-chat/conversations/${id}/messages`,
    { pollMs: 4000 }
  );
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: title ?? "Chat" });
  }, [navigation, title]);

  // Opening a conversation reads it (and again whenever new messages land).
  const lastId = data?.messages.at(-1)?.id;
  useEffect(() => {
    if (lastId) api.post(`/team-chat/conversations/${id}/read`).catch(() => {});
  }, [id, lastId]);

  // Inverted list → newest first.
  const messages = useMemo(() => [...(data?.messages ?? [])].reverse(), [data]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body || !me) return;
    tap();
    const clientId = `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: ChatMessage = {
      id: clientId,
      conversationId: id,
      authorId: me.id,
      parentId: null,
      body,
      isSystem: false,
      replyCount: 0,
      editedAt: null,
      deleted: false,
      reactions: [],
      attachments: [],
      createdAt: new Date().toISOString(),
    };
    setDraft("");
    setData((prev) => ({ messages: [...(prev?.messages ?? []), optimistic], hasMore: prev?.hasMore ?? false }));
    try {
      const saved = await api.post<ChatMessage>(`/team-chat/conversations/${id}/messages`, { body, clientId });
      setData((prev) => prev && { ...prev, messages: prev.messages.map((m) => (m.id === clientId ? saved : m)) });
    } catch (err) {
      setData((prev) => prev && { ...prev, messages: prev.messages.filter((m) => m.id !== clientId) });
      setDraft(body);
      Alert.alert("Message not sent", err instanceof Error ? err.message : "Try again");
    }
  }, [draft, id, me, setData]);

  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 44}
      className="flex-1 bg-background"
    >
      <FlatList
        ref={listRef}
        inverted
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        keyboardDismissMode="interactive"
        renderItem={({ item, index }) => {
          // `index + 1` is the OLDER neighbour in an inverted list.
          const older = messages[index + 1];
          const newer = messages[index - 1];
          const at = new Date(item.createdAt);
          const newDay = !older || new Date(older.createdAt).toDateString() !== at.toDateString();
          const startsGroup =
            newDay || !older || older.authorId !== item.authorId || at.getTime() - new Date(older.createdAt).getTime() > GROUP_GAP_MS;
          const endsGroup =
            !newer || newer.authorId !== item.authorId || new Date(newer.createdAt).getTime() - at.getTime() > GROUP_GAP_MS;
          const mine = item.authorId === me?.id;
          const author = people.get(item.authorId);
          const pending = item.id.startsWith("m-");

          if (item.isSystem) {
            return (
              <View className="my-2 items-center">
                <Text variant="caption">{item.body}</Text>
              </View>
            );
          }

          return (
            <View>
              {newDay && (
                <View className="my-4 items-center">
                  <View className="rounded-full bg-muted px-3 py-1">
                    <Text className="font-medium text-[11px] text-muted-foreground">{dayLabel(at)}</Text>
                  </View>
                </View>
              )}
              <View className={`flex-row items-end gap-2 ${mine ? "justify-end" : ""} ${startsGroup ? "mt-3" : "mt-0.5"}`}>
                {!mine && <View className="w-8">{endsGroup && <Avatar name={author?.name} uri={author?.avatarUrl} size={30} />}</View>}
                <View className={`max-w-[78%] ${mine ? "items-end" : "items-start"}`}>
                  {startsGroup && !mine && (
                    <Text variant="caption" className="mb-1 ml-1 font-medium">
                      {author?.name ?? "Someone"}
                    </Text>
                  )}
                  <View
                    className={`px-3.5 py-2 ${mine ? "bg-primary" : "bg-muted"} ${pending ? "opacity-60" : ""}`}
                    style={{
                      borderRadius: 20,
                      borderBottomRightRadius: mine && endsGroup ? 6 : 20,
                      borderBottomLeftRadius: !mine && endsGroup ? 6 : 20,
                    }}
                  >
                    <Text selectable className={`text-[15px] leading-[21px] ${mine ? "text-primary-foreground" : "text-foreground"} ${item.deleted ? "italic opacity-60" : ""}`}>
                      {item.deleted ? "Message deleted" : item.body || (item.attachments.length ? `📎 ${item.attachments.map((a) => a.name).join(", ")}` : "")}
                    </Text>
                  </View>
                  {(endsGroup || item.reactions.length > 0) && (
                    <View className="mt-1 flex-row items-center gap-1.5 px-1">
                      {item.reactions.map((r) => (
                        <View key={r.emoji} className="flex-row items-center gap-0.5 rounded-full border border-border bg-card px-1.5 py-0.5">
                          <Text className="text-[12px]">{r.emoji}</Text>
                          <Text className="text-[11px] text-muted-foreground">{r.userIds.length}</Text>
                        </View>
                      ))}
                      {endsGroup && (
                        <Text variant="caption" className="text-[11px]">
                          {pending ? "Sending…" : at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          {item.editedAt ? " · edited" : ""}
                          {item.replyCount ? ` · ${item.replyCount} repl${item.replyCount === 1 ? "y" : "ies"}` : ""}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16" style={{ transform: [{ scaleY: -1 }] }}>
            <Text variant="caption">No messages yet — say hello 👋</Text>
          </View>
        }
      />

      {can("chat:write") && (
        <View className="border-t border-border bg-background px-3 pt-2.5" style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
          <View className="flex-row items-end gap-2 rounded-3xl border border-border bg-card py-1.5 pl-4 pr-1.5">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Message ${title?.replace(/^# /, "#") ?? ""}`}
              placeholderTextColor={colors.mutedForeground}
              multiline
              className="max-h-32 flex-1 py-2 font-sans text-[15px] text-foreground"
            />
            <Pressable
              disabled={!draft.trim()}
              onPress={send}
              className={`h-9 w-9 items-center justify-center rounded-full ${draft.trim() ? "bg-primary" : "bg-muted"}`}
            >
              <ArrowUp size={18} color={draft.trim() ? colors.primaryForeground : colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
