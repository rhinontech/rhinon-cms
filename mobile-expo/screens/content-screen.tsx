import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { Plus } from "lucide-react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { formatDate } from "@/lib/format";
import { queryKeys, rhinonApi } from "@/lib/queries";

type Mode = "templates" | "library";

export default function ContentScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const templatesQuery = useQuery({ queryKey: queryKeys.templates, queryFn: rhinonApi.templates });
  const postsQuery = useQuery({ queryKey: queryKeys.posts, queryFn: rhinonApi.posts });
  const [mode, setMode] = useState<Mode>("templates");
  const [search, setSearch] = useState("");

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.templates }),
      queryClient.invalidateQueries({ queryKey: queryKeys.posts }),
    ]);
    setRefreshing(false);
  };

  if (templatesQuery.isLoading || postsQuery.isLoading) {
    return <LoadingState label="Loading content systems..." />;
  }

  const items = useMemo<any[]>(() => {
    if (mode === "templates") {
      return (templatesQuery.data ?? []).filter((template) =>
        template.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return (postsQuery.data ?? []).filter((post) =>
      (post.title || post.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [mode, postsQuery.data, search, templatesQuery.data]);

  return (
    <View className="flex-1 bg-rhinon-bg px-5 pb-4 pt-4">
      <FlashList
        data={items}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <View className="gap-4 pb-5">
            <ScreenHeader
              eyebrow="Content Ops"
              title="Template + library"
              subtitle="Manage reusable cold-email templates and social publishing assets from one queue."
            />

            <View className="flex-row gap-2">
              <Button
                variant={mode === "templates" ? "primary" : "secondary"}
                className="min-h-11 px-3"
                textClassName={mode === "templates" ? "" : "text-rhinon-text"}
                onPress={() => setMode("templates")}
              >
                Templates
              </Button>
              <Button
                variant={mode === "library" ? "primary" : "secondary"}
                className="min-h-11 px-3"
                textClassName={mode === "library" ? "" : "text-rhinon-text"}
                onPress={() => setMode("library")}
              >
                Library
              </Button>
              <Button
                className="ml-auto min-h-11 px-3"
                onPress={() => router.push(mode === "templates" ? "/content/templates/new" : "/content/library/new")}
                icon={<Plus color="#020617" size={16} />}
              >
                New
              </Button>
            </View>

            <Input
              value={search}
              onChangeText={setSearch}
              placeholder={mode === "templates" ? "Search templates" : "Search library assets"}
            />
          </View>
        }
        renderItem={({ item }) =>
          mode === "templates" ? (
            <Pressable onPress={() => router.push({ pathname: "/content/templates/[id]", params: { id: item.id } })}>
              <Card className="gap-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-lg font-bold text-rhinon-text">{item.name}</Text>
                    <Text className="text-sm text-rhinon-muted">{item.channel}</Text>
                  </View>
                  <Badge label="Template" tone="cyan" />
                </View>
                {item.subject ? <Text className="text-sm font-semibold text-rhinon-text">{item.subject}</Text> : null}
                <Text className="text-sm leading-6 text-rhinon-muted" numberOfLines={3}>
                  {item.body}
                </Text>
              </Card>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push({ pathname: "/content/library/[id]", params: { id: item.id } })}>
              <Card className="gap-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-lg font-bold text-rhinon-text">{item.title || item.name}</Text>
                    <Text className="text-sm text-rhinon-muted">{item.channel}</Text>
                  </View>
                  <Badge label={item.status} tone={item.status === "Published" ? "emerald" : "slate"} />
                </View>
                <Text className="text-sm leading-6 text-rhinon-muted" numberOfLines={3}>
                  {item.content}
                </Text>
                <Text className="text-xs text-rhinon-muted">Updated {formatDate(item.updatedAt)}</Text>
              </Card>
            </Pressable>
          )
        }
        ListEmptyComponent={
          <Card>
            <Text className="text-base font-bold text-rhinon-text">No content found</Text>
            <Text className="mt-2 text-sm leading-6 text-rhinon-muted">
              Create a new asset or adjust the search term to browse a different content slice.
            </Text>
          </Card>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22D3EE" />
        }
      />
    </View>
  );
}
