import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Search } from "lucide-react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { formatRelativeTime } from "@/lib/format";
import { queryKeys, rhinonApi } from "@/lib/queries";

export default function InboxScreen() {
  const leadsQuery = useQuery({ queryKey: queryKeys.leads, queryFn: rhinonApi.leads });
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    return (leadsQuery.data ?? [])
      .filter((lead) => ["Replied", "Interested", "Bounced"].includes(lead.status))
      .filter((lead) => {
        return (
          lead.name.toLowerCase().includes(search.toLowerCase()) ||
          lead.company.toLowerCase().includes(search.toLowerCase())
        );
      });
  }, [leadsQuery.data, search]);

  if (leadsQuery.isLoading) {
    return <LoadingState label="Loading conversation queue..." />;
  }

  return (
    <View className="flex-1 bg-rhinon-bg px-5 pb-4 pt-4">
      <FlashList
        data={items}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <View className="gap-4 pb-5">
            <ScreenHeader
              eyebrow="Inbox"
              title="Reply queue"
              subtitle="A mobile-first conversation list built from replied, interested, and bounced lead threads."
            />

            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search conversations"
              inputClassName="pl-11"
            />
            <View className="absolute left-4 top-[106px]">
              <Search color="#8FA3C7" size={18} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: "/inbox/[id]", params: { id: item.id } })}>
            <Card className="gap-3">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-lg font-bold text-rhinon-text">{item.name}</Text>
                  <Text className="text-sm text-rhinon-muted">{item.company}</Text>
                </View>
                <Text className="text-xs font-semibold text-rhinon-muted">
                  {formatRelativeTime(item.lastActivityAt || item.addedAt)}
                </Text>
              </View>
              <Text className="text-sm text-rhinon-text">Re: Scaling operations</Text>
              <Text className="text-sm leading-6 text-rhinon-muted" numberOfLines={2}>
                {item.status === "Interested"
                  ? "Thanks for reaching out. We’re evaluating vendors right now."
                  : item.status === "Bounced"
                    ? "Delivery issue detected. Review and reroute the contact."
                    : "I’ll pass this along to our engineering director."}
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-rhinon-muted">{item.email}</Text>
                <Badge label={item.status} tone={item.status === "Interested" ? "emerald" : item.status === "Bounced" ? "rose" : "slate"} />
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Card>
            <Text className="text-base font-bold text-rhinon-text">Inbox is quiet</Text>
            <Text className="mt-2 text-sm leading-6 text-rhinon-muted">
              Once leads reply or bounce, their threads will appear here for follow-up.
            </Text>
          </Card>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}
