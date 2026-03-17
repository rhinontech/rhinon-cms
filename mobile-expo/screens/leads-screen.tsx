import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { ArrowRight, Search, Sparkles } from "lucide-react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { queryKeys, rhinonApi } from "@/lib/queries";
import type { LeadStatus } from "@/lib/types";

const FILTERS: Array<"All" | LeadStatus> = ["All", "New", "Interested", "Replied", "Emailed"];

export default function LeadsScreen() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.leads, queryFn: rhinonApi.leads });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Array<"All" | LeadStatus>[number]>("All");

  const leads = useMemo(() => {
    return (data ?? []).filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.company.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "All" || lead.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [data, filter, search]);

  if (isLoading) {
    return <LoadingState label="Indexing lead records..." />;
  }

  return (
    <View className="flex-1 bg-rhinon-bg px-5 pb-4 pt-4">
      <FlashList
        data={leads}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <View className="gap-4 pb-5">
            <ScreenHeader
              eyebrow="Lead Engine"
              title="Prospect graph"
              subtitle="Search, qualify, enrich, and trigger outreach from the mobile operator flow."
            />

            <View className="relative">
              <Input
                value={search}
                onChangeText={setSearch}
                placeholder="Search leads, companies, or email"
                inputClassName="pl-11"
              />
              <View className="absolute left-4 top-1/2 -mt-[9px]">
                <Search color="#8FA3C7" size={18} />
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {FILTERS.map((item) => (
                <Button
                  key={item}
                  variant={filter === item ? "primary" : "secondary"}
                  className="min-h-11 px-3"
                  textClassName={filter === item ? "" : "text-rhinon-text"}
                  onPress={() => setFilter(item)}
                >
                  {item}
                </Button>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: "/leads/[id]", params: { id: item.id } })}>
            <Card className="gap-3">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-lg font-bold text-rhinon-text">{item.name}</Text>
                  <Text className="text-sm text-rhinon-muted">{item.company}</Text>
                  <Text className="text-sm text-rhinon-muted">{item.title || "Role not set"}</Text>
                </View>
                <Badge
                  label={item.status}
                  tone={item.status === "Interested" || item.status === "Replied" ? "emerald" : "slate"}
                />
              </View>

              <Text className="text-sm text-rhinon-text">{item.email}</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-rhinon-muted">{item.source || "Manual"}</Text>
                <View className="flex-row items-center gap-2">
                  <Sparkles color="#8B5CF6" size={14} />
                  <ArrowRight color="#8FA3C7" size={16} />
                </View>
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Card>
            <Text className="text-base font-bold text-rhinon-text">No leads found</Text>
            <Text className="mt-2 text-sm leading-6 text-rhinon-muted">
              Adjust your search or status filter to surface a different slice of the lead pool.
            </Text>
          </Card>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}
