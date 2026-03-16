import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Plus, Search } from "lucide-react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { queryKeys, rhinonApi } from "@/lib/queries";
import type { CampaignStage } from "@/lib/types";

const STAGES: Array<"All" | CampaignStage> = ["All", "Draft", "Active", "Paused", "Completed"];

export default function CampaignsScreen() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.campaigns, queryFn: rhinonApi.campaigns });
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<Array<"All" | CampaignStage>[number]>("All");

  const campaigns = useMemo(() => {
    return (data ?? []).filter((campaign) => {
      const matchesSearch =
        campaign.name.toLowerCase().includes(search.toLowerCase()) ||
        campaign.channel.toLowerCase().includes(search.toLowerCase());
      const matchesStage = stage === "All" || campaign.stage === stage;
      return matchesSearch && matchesStage;
    });
  }, [data, search, stage]);

  if (isLoading) {
    return <LoadingState label="Loading campaign engines..." />;
  }

  return (
    <View className="flex-1 bg-rhinon-bg px-5 pb-4 pt-4">
      <FlashList
        data={campaigns}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <View className="gap-4 pb-5">
            <ScreenHeader
              eyebrow="Campaign Engine"
              title="Execution board"
              subtitle="Create, process, and launch email or social propagation runs."
              right={
                <Button className="min-h-11 px-3" onPress={() => router.push("/campaigns/new")} icon={<Plus color="#020617" size={16} />}>
                  New
                </Button>
              }
            />

            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search campaigns"
              inputClassName="pl-11"
            />
            <View className="absolute left-4 top-[106px]">
              <Search color="#8FA3C7" size={18} />
            </View>

            <View className="flex-row flex-wrap gap-2">
              {STAGES.map((item) => (
                <Button
                  key={item}
                  variant={stage === item ? "primary" : "secondary"}
                  className="min-h-11 px-3"
                  textClassName={stage === item ? "" : "text-rhinon-text"}
                  onPress={() => setStage(item)}
                >
                  {item}
                </Button>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const progress = item.leadsTotal ? Math.min(100, (item.leadsProcessed / item.leadsTotal) * 100) : 0;
          return (
            <Pressable onPress={() => router.push({ pathname: "/campaigns/[id]", params: { id: item.id } })}>
              <Card className="gap-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-lg font-bold text-rhinon-text">{item.name}</Text>
                    <Text className="text-sm text-rhinon-muted">{item.channel}</Text>
                  </View>
                  <Badge
                    label={item.stage}
                    tone={item.stage === "Active" ? "emerald" : item.stage === "Paused" ? "amber" : "slate"}
                  />
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-rhinon-muted">
                    {item.leadsProcessed} / {item.leadsTotal} processed
                  </Text>
                  <Text className="text-xs font-semibold text-rhinon-muted">Daily limit {item.dailyLimit}</Text>
                </View>
                <View className="h-2 rounded-full bg-white/5">
                  <View className="h-2 rounded-full bg-cyan-400" style={{ width: `${progress}%` }} />
                </View>
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Card>
            <Text className="text-base font-bold text-rhinon-text">No campaigns found</Text>
            <Text className="mt-2 text-sm leading-6 text-rhinon-muted">
              Create a new campaign or broaden the current stage and search filters.
            </Text>
          </Card>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}
