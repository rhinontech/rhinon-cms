import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ArrowUp, Hash, Paperclip, Users } from "lucide-react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { useChatDirectory } from "@/lib/chat";
import { useTheme } from "@/lib/theme";
import { tap } from "@/lib/haptics";
import { pickFile, uploadChatFile, type UploadedFile } from "@/lib/files";
import type { ChatMessage } from "@/lib/types";
import { Avatar, BackButton, Backdrop, ComposerTray, ErrorState, FileChip, GlassHeader, IconTile, Spinner, Text } from "@/components/ui";

const GROUP_GAP_MS = 5 * 60 * 1000;
const REACTIONS = ["👍", "❤️", "😂", "🎉", "🙏", "👀"];

function dayLabel(d: Date) {
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

export default function ConversationScreen() {
  const { id, title, kind, presence, avatar } = useLocalSearchParams<{ id: string; title?: string; kind?: string; presence?: string; avatar?: string }>();
  const { colors } = useTheme();
  const { me, can } = useAuth();
  const people = useChatDirectory();
  const { data, setData, error, loading, refresh, reload } = useApi<{ messages: ChatMessage[]; hasMore: boolean }>(
    `/team-chat/conversations/${id}/messages`,
    { pollMs: 4000 }
  );
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reacting, setReacting] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // Opening a conversation reads it (and again whenever new messages land).
  const lastId = data?.messages.at(-1)?.id;
  useEffect(() => {
    if (lastId) api.post(`/team-chat/conversations/${id}/read`).catch(() => {});
  }, [id, lastId]);

  // Inverted list → newest first.
  const messages = useMemo(() => [...(data?.messages ?? [])].reverse(), [data]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if ((!body && !files.length) || !me) return;
    const attachments = files;
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
      attachments: attachments.map((a) => ({ ...a, url: null })),
      createdAt: new Date().toISOString(),
    };
    setDraft("");
    setFiles([]);
    setData((prev) => ({ messages: [...(prev?.messages ?? []), optimistic], hasMore: prev?.hasMore ?? false }));
    try {
      const saved = await api.post<ChatMessage>(`/team-chat/conversations/${id}/messages`, { body, clientId, attachments });
      setData((prev) => prev && { ...prev, messages: prev.messages.map((m) => (m.id === clientId ? saved : m)) });
    } catch (err) {
      setData((prev) => prev && { ...prev, messages: prev.messages.filter((m) => m.id !== clientId) });
      setDraft(body);
      setFiles(attachments);
      Alert.alert("Message not sent", err instanceof Error ? err.message : "Try again");
    }
  }, [draft, files, id, me, setData]);

  const attach = async () => {
    const file = await pickFile();
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadChatFile(file);
      setFiles((f) => [...f, uploaded]);
    } catch (err) {
      Alert.alert("Couldn't attach file", err instanceof Error ? err.message : "Try again");
    } finally {
      setUploading(false);
    }
  };

  const react = async (messageId: string, emoji: string) => {
    tap();
    setReacting(null);
    try {
      await api.post(`/team-chat/messages/${messageId}/reactions`, { emoji });
      await reload();
    } catch (err) {
      Alert.alert("Couldn't react", err instanceof Error ? err.message : "Try again");
    }
  };

  const canWrite = can("chat:write");
  const name = title?.replace(/^# /, "") ?? "Chat";
  const status = kind === "channel" ? "Channel" : kind === "direct" ? (presence ? presence[0].toUpperCase() + presence.slice(1) : "Direct message") : "Group";
  const header = (
    <GlassHeader>
      <View className="flex-row items-center gap-3">
        <BackButton />
        {kind === "channel" ? (
          <IconTile icon={Hash} size={38} />
        ) : kind === "direct" || !kind ? (
          <Avatar name={name} uri={avatar || undefined} size={38} online={presence ? presence === "online" : undefined} />
        ) : (
          <IconTile icon={Users} size={38} />
        )}
        <View className="flex-1">
          <Text numberOfLines={1} variant="heading" className="leading-[22px]">
            {name}
          </Text>
          <Text numberOfLines={1} variant="caption">
            {status}
          </Text>
        </View>
      </View>
    </GlassHeader>
  );

  if (loading && !data) {
    return (
      <View className="flex-1 bg-background">
        <Backdrop />
        {header}
        <Spinner />
      </View>
    );
  }
  if (error && !data) {
    return (
      <View className="flex-1 bg-background">
        <Backdrop />
        {header}
        <ErrorState message={error} onRetry={refresh} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <Backdrop />
      {header}
      <FlatList
        ref={listRef}
        inverted
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12 }}
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
                  <View className="rounded-full bg-muted px-3.5 py-1">
                    <Text className="font-semibold text-[12px] leading-4 text-muted-foreground">{dayLabel(at)}</Text>
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
                  <Pressable
                    disabled={!canWrite || pending || item.deleted}
                    onLongPress={() => setReacting(item.id)}
                    delayLongPress={250}
                    className={`px-3.5 py-2 ${mine ? "bg-primary" : ""} ${pending ? "opacity-60" : ""}`}
                    style={[
                      {
                        borderRadius: 20,
                        borderBottomRightRadius: mine && endsGroup ? 6 : 20,
                        borderBottomLeftRadius: !mine && endsGroup ? 6 : 20,
                      },
                      !mine && { backgroundColor: colors.glassCard, borderWidth: 1, borderColor: colors.glassCardBorder },
                    ]}
                  >
                    <Text selectable className={`text-[15px] leading-[21px] ${mine ? "text-primary-foreground" : "text-foreground"} ${item.deleted ? "italic opacity-60" : ""}`}>
                      {item.deleted ? "Message deleted" : item.body}
                    </Text>
                    {!item.deleted &&
                      item.attachments.map((a, i) => (
                        <Pressable key={i} disabled={!a.url} onPress={() => a.url && Linking.openURL(a.url)} className="mt-1 flex-row items-center gap-1.5 active:opacity-60">
                          <Paperclip size={13} color={mine ? colors.primaryForeground : colors.mutedForeground} />
                          <Text numberOfLines={1} className={`shrink text-[13px] underline ${mine ? "text-primary-foreground" : "text-foreground"}`}>
                            {a.name}
                          </Text>
                        </Pressable>
                      ))}
                  </Pressable>
                  {(endsGroup || item.reactions.length > 0) && (
                    <View className="mt-1 flex-row items-center gap-1.5 px-1">
                      {item.reactions.map((r) => (
                        <Pressable key={r.emoji} disabled={!canWrite} onPress={() => react(item.id, r.emoji)} className={`flex-row items-center gap-0.5 rounded-full border px-1.5 py-0.5 ${me && r.userIds.includes(me.id) ? "border-brand bg-brand/10" : "border-border bg-card"}`}>
                          <Text className="text-[12px]">{r.emoji}</Text>
                          <Text className="text-[11px] text-muted-foreground">{r.userIds.length}</Text>
                        </Pressable>
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

      <Modal visible={!!reacting} transparent animationType="fade" onRequestClose={() => setReacting(null)}>
        <Pressable className="flex-1 items-center justify-center bg-black/30" onPress={() => setReacting(null)}>
          <View className="flex-row gap-1 rounded-full p-2" style={{ backgroundColor: colors.card }}>
            {REACTIONS.map((emoji) => (
              <Pressable key={emoji} accessibilityRole="button" accessibilityLabel={`React with ${emoji}`} onPress={() => reacting && react(reacting, emoji)} className="h-11 w-11 items-center justify-center rounded-full active:bg-muted">
                <Text className="text-[24px] leading-[30px]">{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {canWrite && (
        <ComposerTray>
          {!!files.length && (
            <View className="mb-2 flex-row flex-wrap gap-2 px-1">
              {files.map((f, i) => (
                <FileChip key={f.key} name={f.name} onRemove={() => setFiles((all) => all.filter((_, x) => x !== i))} />
              ))}
            </View>
          )}
          <View className="flex-row items-end gap-2 rounded-3xl border border-border bg-card py-1.5 pl-2 pr-1.5">
            <Pressable accessibilityRole="button" accessibilityLabel="Attach a file" disabled={uploading} onPress={attach} className="h-[38px] w-[34px] items-center justify-center active:opacity-60">
              {uploading ? <ActivityIndicator color={colors.mutedForeground} /> : <Paperclip size={19} color={colors.mutedForeground} />}
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Message ${title?.replace(/^# /, "#") ?? ""}`}
              placeholderTextColor={colors.mutedForeground}
              multiline
              className="max-h-32 flex-1 py-2 font-sans text-[15px] text-foreground"
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={(!draft.trim() && !files.length) || uploading} onPress={send} className="active:opacity-80">
              <View className={`h-[38px] w-[38px] items-center justify-center rounded-full ${draft.trim() || files.length ? "bg-primary" : "bg-muted"}`}>
                <ArrowUp size={19} color={draft.trim() || files.length ? colors.primaryForeground : colors.mutedForeground} />
              </View>
            </Pressable>
          </View>
        </ComposerTray>
      )}
    </KeyboardAvoidingView>
  );
}
