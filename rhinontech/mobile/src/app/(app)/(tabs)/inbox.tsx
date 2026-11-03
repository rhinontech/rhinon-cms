import { useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { Inbox as InboxIcon, Paperclip, Star } from "lucide-react-native";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { shortTime } from "@/lib/format";
import { tap } from "@/lib/haptics";
import type { InboxEmail, InboxFolder } from "@/lib/types";
import { useDebounced } from "@/hooks/useDebounced";
import { Avatar, Chips, EmptyState, ErrorState, LargeHeader, ListSkeleton, SearchBar, Text } from "@/components/ui";

const FOLDERS: { value: InboxFolder; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "starred", label: "Starred" },
  { value: "sent", label: "Sent" },
  { value: "archive", label: "Archive" },
];

function EmailRow({ email, sent }: { email: InboxEmail; sent: boolean }) {
  const { colors } = useTheme();
  const who = sent ? `To: ${email.toEmails?.[0] ?? ""}` : email.fromName || email.fromEmail;
  return (
    <Pressable
      onPress={() => {
        tap();
        router.push({ pathname: "/inbox/[id]", params: { id: email.id } });
      }}
      className="flex-row gap-3 px-5 py-3.5 active:bg-muted"
    >
      <View className="w-2 items-center pt-4">{!email.isRead && <View className="h-2 w-2 rounded-full bg-brand" />}</View>
      <Avatar name={sent ? email.toEmails?.[0] : email.fromName || email.fromEmail} size={42} />
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className={`flex-1 text-[15px] ${email.isRead ? "font-medium" : "font-semibold"}`}>
            {who}
          </Text>
          <Text variant="caption">{shortTime(email.sentAt)}</Text>
        </View>
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <Text numberOfLines={1} className={`flex-1 text-[14px] ${email.isRead ? "text-muted-foreground" : "font-medium text-foreground"}`}>
            {email.subject || "(no subject)"}
          </Text>
          {email.hasAttachment && <Paperclip size={13} color={colors.mutedForeground} />}
          {email.isStarred && <Star size={13} color={colors.warning} fill={colors.warning} />}
        </View>
        <Text numberOfLines={2} variant="caption" className="mt-1 text-[13px] leading-[18px]">
          {email.snippet}
        </Text>
        {email.campaign && (
          <View className="mt-1.5 self-start rounded-md bg-brand/10 px-1.5 py-0.5">
            <Text className="font-medium text-[10.5px] text-brand">{email.campaign.name}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function InboxScreen() {
  const { colors } = useTheme();
  const [folder, setFolder] = useState<InboxFolder>("inbox");
  const [search, setSearch] = useState("");
  const q = useDebounced(search.trim());

  const params = new URLSearchParams({ limit: "50" });
  if (folder === "starred") params.set("starred", "true");
  else params.set("folder", folder);
  if (q) params.set("search", q);

  const { data, error, loading, refreshing, refresh } = useApi<InboxEmail[]>(`/inbox?${params}`, { pollMs: 45_000 });
  const unread = data?.filter((e) => !e.isRead).length ?? 0;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={data ?? []}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EmailRow email={item} sent={folder === "sent"} />}
        ItemSeparatorComponent={() => <View className="ml-[78px] h-px bg-border" />}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground} />}
        ListHeaderComponent={
          <>
            <LargeHeader title="Inbox" subtitle={folder === "inbox" && unread ? `${unread} unread` : undefined} />
            <View className="gap-3 px-5 pb-3">
              <SearchBar value={search} onChangeText={setSearch} placeholder="Search mail" />
              <Chips options={FOLDERS} value={folder} onChange={setFolder} />
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ListSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={refresh} />
          ) : (
            <EmptyState
              icon={<InboxIcon size={24} color={colors.mutedForeground} />}
              title={q ? "No matches" : "All caught up"}
              message={q ? `Nothing in ${folder} matches “${q}”.` : "New mail will show up here."}
            />
          )
        }
      />
    </View>
  );
}
