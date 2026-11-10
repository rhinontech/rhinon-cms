import { useCallback } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { Bell, CheckCheck } from "lucide-react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { shortTime } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { Backdrop, BackButton, Card, EmptyState, ErrorState, GlassHeader, HeaderButton, ListSkeleton, Tappable, Text } from "@/components/ui";

/**
 * Notification links are the web panel's paths. Task links open here; the
 * sections the app has open by name; anything else stays on the web.
 */
function open(link: string | null) {
  if (!link) return;
  const task = link.match(/\/work\/projects\/([^/?]+)\?task=([^&]+)/);
  if (task) return router.push({ pathname: "/work/task/[id]", params: { id: task[2], projectId: task[1] } });
  if (/\/leave/.test(link)) return router.push("/leave");
  if (/\/attendance/.test(link)) return router.push("/attendance");
  if (/\/crm/.test(link)) return router.push("/crm");
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { data, setData, error, loading, refreshing, refresh } = useApi<{ items: AppNotification[]; unread: number }>("/notifications?limit=50", { pollMs: 30_000 });

  const markAll = useCallback(async () => {
    setData((prev) => prev && { unread: 0, items: prev.items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) });
    await api.post("/notifications/read-all").catch(() => refresh());
  }, [setData, refresh]);

  const press = (n: AppNotification) => {
    if (!n.readAt) {
      setData((prev) => prev && { unread: Math.max(0, prev.unread - 1), items: prev.items.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)) });
      api.post(`/notifications/${n.id}/read`).catch(() => {});
    }
    open(n.link);
  };

  return (
    <View className="flex-1 bg-background">
      <Backdrop />
      <GlassHeader left={<BackButton />} title="Notifications" subtitle={data?.unread ? `${data.unread} unread` : undefined} right={data?.unread ? <HeaderButton icon={CheckCheck} label="Mark all as read" onPress={markAll} /> : undefined} />
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(n) => n.id}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground} />}
        renderItem={({ item }) => (
          <Tappable className="mx-4" scale={0.985} onPress={() => press(item)}>
            <Card className="flex-row gap-3 overflow-hidden p-3.5" style={item.readAt ? undefined : { backgroundColor: colors.selected }}>
              <View className={`mt-1.5 h-2 w-2 rounded-full ${item.readAt ? "bg-transparent" : "bg-brand"}`} />
              <View className="flex-1">
                <View className="flex-row items-start gap-2">
                  <Text numberOfLines={2} className={`flex-1 text-[14.5px] leading-5 ${item.readAt ? "font-medium" : "font-semibold"}`}>
                    {item.title}
                  </Text>
                  <Text variant="caption">{shortTime(item.updatedAt)}</Text>
                </View>
                {!!item.body && (
                  <Text numberOfLines={2} variant="caption" className="mt-0.5 text-[13px] leading-[18px]">
                    {item.body}
                  </Text>
                )}
              </View>
            </Card>
          </Tappable>
        )}
        ListEmptyComponent={loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refresh} /> : <EmptyState icon={Bell} title="You're all caught up" message="New notifications will show up here." />}
      />
    </View>
  );
}
