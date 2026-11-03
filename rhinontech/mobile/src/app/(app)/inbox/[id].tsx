import { useLayoutEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Archive, ArrowUp, Paperclip, Star, Trash2 } from "lucide-react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { fullDateTime, htmlToText, textToHtml } from "@/lib/format";
import { success, tap } from "@/lib/haptics";
import type { InboxEmailDetail, InboxThreadItem } from "@/lib/types";
import { Avatar, Card, ErrorState, Spinner, Text } from "@/components/ui";

function Message({ item, defaultOpen }: { item: InboxThreadItem; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const { colors } = useTheme();
  const text = htmlToText(item.body);
  return (
    <Card className="mb-3 overflow-hidden">
      <Pressable onPress={() => setOpen((o) => !o)} className="flex-row items-center gap-3 p-4">
        <Avatar name={item.fromName || item.fromEmail} uri={item.senderAvatarUrl} size={38} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text numberOfLines={1} className="flex-1 font-semibold text-[15px]">
              {item.fromMe ? "You" : item.fromName || item.fromEmail}
            </Text>
            <Text variant="caption">{fullDateTime(item.sentAt)}</Text>
          </View>
          <Text numberOfLines={1} variant="caption" className="mt-0.5 text-[13px]">
            {open ? `to ${item.toEmails.join(", ")}` : text.slice(0, 120)}
          </Text>
        </View>
      </Pressable>
      {open && (
        <View className="px-4 pb-4">
          {/* Plain text on purpose: sender HTML never runs in the app. */}
          <Text selectable className="text-[15px] leading-[23px]">
            {text || "(empty message)"}
          </Text>
          {!!item.attachments?.length && (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {item.attachments.map((a, i) => (
                <View key={i} className="flex-row items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5">
                  <Paperclip size={12} color={colors.mutedForeground} />
                  <Text className="text-[12px]">{a.name || "Attachment"}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

export default function EmailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { can } = useAuth();
  const { data, setData, error, loading, refresh } = useApi<InboxEmailDetail>(`/inbox/${id}`);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const canWrite = can("inbox:write");

  const update = async (patch: { isStarred?: boolean; folder?: string }) => {
    tap();
    try {
      await api.patch(`/inbox/${id}`, patch);
      if (patch.folder) router.back();
      else if (data) setData({ ...data, ...patch });
    } catch (err) {
      Alert.alert("Couldn't update", err instanceof Error ? err.message : "Try again");
    }
  };

  useLayoutEffect(() => {
    if (!data || !canWrite) return;
    navigation.setOptions({
      headerRight: () => (
        <View className="flex-row items-center gap-5">
          <Pressable hitSlop={8} onPress={() => update({ isStarred: !data.isStarred })}>
            <Star size={20} color={data.isStarred ? colors.warning : colors.foreground} fill={data.isStarred ? colors.warning : "transparent"} />
          </Pressable>
          <Pressable hitSlop={8} onPress={() => update({ folder: "archive" })}>
            <Archive size={20} color={colors.foreground} />
          </Pressable>
          <Pressable hitSlop={8} onPress={() => update({ folder: "trash" })}>
            <Trash2 size={20} color={colors.foreground} />
          </Pressable>
        </View>
      ),
    });
  });

  const send = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/inbox/${id}/reply`, { body: textToHtml(reply.trim()) });
      setReply("");
      success();
      await refresh();
    } catch (err) {
      Alert.alert("Reply not sent", err instanceof Error ? err.message : "Try again");
    } finally {
      setSending(false);
    }
  };

  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />;
  if (!data) return null;

  const thread = data.thread?.length ? data.thread : [{ ...data, fromMe: false, senderAvatarUrl: null } as InboxThreadItem];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={insets.top + 44} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }} keyboardDismissMode="interactive">
        <Text variant="title" className="mb-1">
          {data.subject || "(no subject)"}
        </Text>
        <Text variant="caption" className="mb-5">
          {thread.length} message{thread.length === 1 ? "" : "s"}
          {data.campaign ? ` · ${data.campaign.name}` : ""}
        </Text>
        {thread.map((item, i) => (
          <Message key={item.id} item={item} defaultOpen={i === thread.length - 1} />
        ))}
      </ScrollView>

      {canWrite && (
        <View className="border-t border-border bg-background px-4 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <View className="flex-row items-end gap-2 rounded-2xl border border-border bg-card py-1.5 pl-4 pr-1.5">
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="Write a reply…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              className="max-h-32 flex-1 py-2 font-sans text-[15px] text-foreground"
            />
            <Pressable
              disabled={!reply.trim() || sending}
              onPress={send}
              className={`h-9 w-9 items-center justify-center rounded-full ${reply.trim() ? "bg-primary" : "bg-muted"}`}
            >
              <ArrowUp size={18} color={reply.trim() ? colors.primaryForeground : colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
