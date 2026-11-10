import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Archive, ArrowUp, Paperclip, Star, Trash2 } from "lucide-react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { fullDateTime, htmlToText, textToHtml } from "@/lib/format";
import { pickFile, uploadMailFile, type UploadedFile } from "@/lib/files";
import { success, tap } from "@/lib/haptics";
import type { InboxEmailDetail, InboxThreadItem } from "@/lib/types";
import { Avatar, BackButton, Backdrop, Card, ComposerTray, ErrorState, FileChip, GlassHeader, HeaderButton, Spinner, Text } from "@/components/ui";

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
                <Pressable key={i} disabled={!a.url} onPress={() => a.url && Linking.openURL(a.url)} className="flex-row items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 active:opacity-60">
                  <Paperclip size={13} color={colors.mutedForeground} />
                  <Text className="text-[12px]">{a.name || "Attachment"}</Text>
                </Pressable>
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
  const { colors } = useTheme();
  const { can } = useAuth();
  const { data, setData, error, loading, refresh } = useApi<InboxEmailDetail>(`/inbox/${id}`);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
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

  const attach = async () => {
    const file = await pickFile();
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMailFile(file);
      setFiles((f) => [...f, uploaded]);
    } catch (err) {
      Alert.alert("Couldn't attach file", err instanceof Error ? err.message : "Try again");
    } finally {
      setUploading(false);
    }
  };

  const send = async () => {
    if (!reply.trim() && !files.length) return;
    setSending(true);
    try {
      await api.post(`/inbox/${id}/reply`, { body: reply.trim() ? textToHtml(reply.trim()) : "", attachments: files });
      setReply("");
      setFiles([]);
      success();
      await refresh();
    } catch (err) {
      Alert.alert("Reply not sent", err instanceof Error ? err.message : "Try again");
    } finally {
      setSending(false);
    }
  };

  const thread = data?.thread?.length ? data.thread : data ? [{ ...data, fromMe: false, senderAvatarUrl: null } as InboxThreadItem] : [];
  const header = (
    <GlassHeader>
      <View className="flex-row items-center justify-between">
        <BackButton />
        {data && canWrite && (
          <View className="flex-row items-center gap-2">
            <HeaderButton
              icon={Star}
              label={data.isStarred ? "Remove star" : "Star"}
              color={data.isStarred ? colors.warning : undefined}
              fill={data.isStarred ? colors.warning : undefined}
              onPress={() => update({ isStarred: !data.isStarred })}
            />
            <HeaderButton icon={Archive} label="Archive" onPress={() => update({ folder: "archive" })} />
            <HeaderButton icon={Trash2} label="Move to trash" onPress={() => update({ folder: "trash" })} />
          </View>
        )}
      </View>
      {data && (
        <>
          <Text numberOfLines={3} variant="title" className="mt-3">
            {data.subject || "(no subject)"}
          </Text>
          <Text numberOfLines={1} variant="caption" className="mt-1">
            {thread.length} message{thread.length === 1 ? "" : "s"}
            {data.campaign ? ` · ${data.campaign.name}` : ""}
          </Text>
        </>
      )}
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
  if (!data) return null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <Backdrop />
      {header}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardDismissMode="interactive">
        {thread.map((item, i) => (
          <Message key={item.id} item={item} defaultOpen={i === thread.length - 1} />
        ))}
      </ScrollView>

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
              value={reply}
              onChangeText={setReply}
              placeholder="Write a reply…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              className="max-h-32 flex-1 py-2 font-sans text-[15px] text-foreground"
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Send reply" disabled={(!reply.trim() && !files.length) || sending || uploading} onPress={send} className="active:opacity-80">
              <View className={`h-[38px] w-[38px] items-center justify-center rounded-full ${reply.trim() || files.length ? "bg-primary" : "bg-muted"}`}>
                <ArrowUp size={19} color={reply.trim() || files.length ? colors.primaryForeground : colors.mutedForeground} />
              </View>
            </Pressable>
          </View>
        </ComposerTray>
      )}
    </KeyboardAvoidingView>
  );
}
