import { useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { Inbox as InboxIcon, Paperclip, PenSquare, Star } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { shortTime } from "@/lib/format";
import type { InboxEmail, InboxFolder } from "@/lib/types";
import { useDebounced } from "@/hooks/useDebounced";
import { Avatar, Backdrop, Card, Chips, EmptyState, ErrorState, GlassHeader, HeaderButton, ListSkeleton, SearchBar, Tappable, Text } from "@/components/ui";

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
    <Tappable className="mx-4" scale={0.985} onPress={() => router.push({ pathname: "/inbox/[id]", params: { id: email.id } })}>
      <Card className="flex-row gap-3 overflow-hidden p-3.5">
        {!email.isRead && <View className="absolute bottom-0 left-0 top-0 w-1" style={{ backgroundColor: colors.brand }} />}
        <Avatar name={sent ? email.toEmails?.[0] : email.fromName || email.fromEmail} size={44} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text numberOfLines={1} className={`flex-1 text-[15px] ${email.isRead ? "font-medium" : "font-semibold"}`}>
              {who}
            </Text>
            <Text variant="caption" className={email.isRead ? undefined : "font-medium text-brand"} >
              {shortTime(email.sentAt)}
            </Text>
          </View>
          <View className="mt-0.5 flex-row items-center gap-1.5">
            <Text numberOfLines={1} className={`flex-1 text-[14px] ${email.isRead ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
              {email.subject || "(no subject)"}
            </Text>
            {email.hasAttachment && <Paperclip size={13} color={colors.mutedForeground} />}
            {email.isStarred && <Star size={14} color={colors.warning} fill={colors.warning} />}
          </View>
          <Text numberOfLines={2} variant="caption" className="mt-1 text-[13px] leading-[18px]">
            {email.snippet}
          </Text>
          {email.campaign && (
            <View className="mt-2 self-start rounded-md bg-brand/10 px-1.5 py-0.5">
              <Text className="font-medium text-[11px] leading-4 text-brand">{email.campaign.name}</Text>
            </View>
          )}
        </View>
      </Card>
    </Tappable>
  );
}

export default function InboxScreen() {
  const { can } = useAuth();
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
      <Backdrop />
      <GlassHeader title="Inbox" subtitle={folder === "inbox" && unread ? `${unread} unread` : "Your email"} right={can("inbox:write") ? <HeaderButton icon={PenSquare} label="New email" onPress={() => router.push("/inbox/compose")} /> : undefined}>
        <View className="mt-3 gap-3">
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search mail" />
          <Chips options={FOLDERS} value={folder} onChange={setFolder} />
        </View>
      </GlassHeader>
            <FlatList
        data={data ?? []}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EmailRow email={item} sent={folder === "sent"} />}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground}  />}
        ListEmptyComponent={
          loading ? (
            <ListSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={refresh} />
          ) : (
            <EmptyState
              icon={InboxIcon}
              title={q ? "No matches" : "All caught up"}
              message={q ? `Nothing in ${folder} matches “${q}”.` : "New mail will show up here."}
            />
          )
        }
      />
          </View>
  );
}
