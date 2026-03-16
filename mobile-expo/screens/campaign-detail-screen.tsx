import { useLocalSearchParams, router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, ScrollView, Text, View } from "react-native";
import { apiRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { formatShortDateTime } from "@/lib/format";
import { queryKeys, rhinonApi } from "@/lib/queries";

export default function CampaignDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const campaignQuery = useQuery({
    queryKey: queryKeys.campaign(params.id),
    queryFn: () => rhinonApi.campaign(params.id),
    enabled: !!params.id,
  });
  const activitiesQuery = useQuery({
    queryKey: queryKeys.campaignActivities(params.id),
    queryFn: () => rhinonApi.campaignActivities(params.id),
    enabled: !!params.id,
  });

  const processMutation = useMutation({
    mutationFn: () => apiRequest(`/api/campaigns/${params.id}/process`, { method: "POST" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns }),
        queryClient.invalidateQueries({ queryKey: queryKeys.campaign(params.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.campaignActivities(params.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.leads }),
      ]);
      Alert.alert("Campaign processed", "AI propagation completed for the selected campaign.");
    },
  });

  const launchMutation = useMutation({
    mutationFn: () => apiRequest(`/api/campaigns/${params.id}/send`, { method: "POST" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns }),
        queryClient.invalidateQueries({ queryKey: queryKeys.campaign(params.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.campaignActivities(params.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.leads }),
      ]);
      Alert.alert("Campaign launched", "Delivery/publish flow completed for this campaign.");
    },
  });

  const stageMutation = useMutation({
    mutationFn: (stage: string) =>
      apiRequest(`/api/campaigns/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ stage }),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns }),
        queryClient.invalidateQueries({ queryKey: queryKeys.campaign(params.id) }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/api/campaigns/${params.id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
      router.replace("/(tabs)/campaigns");
    },
  });

  if (campaignQuery.isLoading || activitiesQuery.isLoading) {
    return <LoadingState label="Loading campaign context..." />;
  }

  const campaign = campaignQuery.data;
  if (!campaign) {
    return <LoadingState label="Campaign not found." />;
  }

  const progress = campaign.leadsTotal ? Math.min(100, (campaign.leadsProcessed / campaign.leadsTotal) * 100) : 0;

  return (
    <ScrollView className="flex-1 bg-rhinon-bg" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <ScreenHeader
        eyebrow="Campaign Detail"
        title={campaign.name}
        subtitle={`${campaign.channel} • ${campaign.dailyLimit} daily limit`}
        right={<Badge label={campaign.stage} tone={campaign.stage === "Active" ? "emerald" : campaign.stage === "Paused" ? "amber" : "slate"} />}
      />

      <Card className="gap-4">
        <Text className="text-sm font-black uppercase tracking-[2px] text-rhinon-muted">Execution</Text>
        <Text className="text-4xl font-black text-rhinon-text">
          {campaign.leadsProcessed} / {campaign.leadsTotal}
        </Text>
        <View className="h-2 rounded-full bg-white/5">
          <View className="h-2 rounded-full bg-cyan-400" style={{ width: `${progress}%` }} />
        </View>
        <Text className="text-sm text-rhinon-muted">Daily limit {campaign.dailyLimit}</Text>
      </Card>

      <View className="flex-row flex-wrap gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          loading={stageMutation.isPending}
          onPress={() => stageMutation.mutate(campaign.stage === "Active" ? "Paused" : "Active")}
        >
          {campaign.stage === "Active" ? "Pause" : "Resume"}
        </Button>
        <Button className="flex-1" loading={processMutation.isPending} onPress={() => processMutation.mutate()}>
          Process
        </Button>
      </View>

      <View className="flex-row flex-wrap gap-3">
        <Button variant="secondary" className="flex-1" loading={launchMutation.isPending} onPress={() => launchMutation.mutate()}>
          Launch
        </Button>
        <Button variant="danger" className="flex-1" loading={deleteMutation.isPending} onPress={() => deleteMutation.mutate()}>
          Delete
        </Button>
      </View>

      <Card className="gap-4">
        <Text className="text-lg font-black text-rhinon-text">Operational Log</Text>
        {(activitiesQuery.data ?? []).map((activity) => (
          <View key={activity.id} className="rounded-2xl border border-rhinon-border bg-[#0B1320] p-4">
            <View className="mb-2 flex-row items-center justify-between gap-3">
              <Text className="text-sm font-bold text-rhinon-text">{activity.type}</Text>
              <Text className="text-xs text-rhinon-muted">{formatShortDateTime(activity.timestamp)}</Text>
            </View>
            <Text className="text-sm leading-6 text-rhinon-muted">{activity.content}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
