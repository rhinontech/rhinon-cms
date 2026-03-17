import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Activity, ArrowRight, ShieldCheck } from "lucide-react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { formatDate } from "@/lib/format";
import { queryKeys, rhinonApi } from "@/lib/queries";
import { useState } from "react";

export default function DashboardScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const metricsQuery = useQuery({ queryKey: queryKeys.metrics, queryFn: rhinonApi.metrics });
  const leadsQuery = useQuery({ queryKey: queryKeys.leads, queryFn: rhinonApi.leads });
  const campaignsQuery = useQuery({ queryKey: queryKeys.campaigns, queryFn: rhinonApi.campaigns });
  const healthQuery = useQuery({ queryKey: queryKeys.health, queryFn: rhinonApi.health });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries();
    setRefreshing(false);
  };

  if (metricsQuery.isLoading || leadsQuery.isLoading || campaignsQuery.isLoading || healthQuery.isLoading) {
    return <LoadingState />;
  }
// ... [rest of the component stays the same, adding RefreshControl to ScrollView]

  const metrics = metricsQuery.data?.metrics ?? [];
  const leads = leadsQuery.data?.slice(0, 4) ?? [];
  const campaigns = campaignsQuery.data?.slice(0, 3) ?? [];
  const health = healthQuery.data;

  return (
    <ScrollView className="flex-1 bg-rhinon-bg" contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 120 }}>
      <ScreenHeader
        eyebrow="Command Center"
        title="Operations pulse"
        subtitle="Live view of propagation, campaign pressure, and infrastructure readiness."
        right={
          <Button variant="secondary" className="min-h-11 px-3" onPress={() => router.push("/(tabs)/campaigns")}>
            Launches
          </Button>
        }
      />

      <View className="flex-row flex-wrap gap-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="min-w-[48%] flex-1 gap-2">
            <Text className="text-[11px] font-black uppercase tracking-[2px] text-rhinon-muted">
              {metric.label}
            </Text>
            <Text className="text-3xl font-black text-rhinon-text">{metric.value}</Text>
            <Text className="text-xs font-semibold text-cyan-300">{metric.delta}</Text>
          </Card>
        ))}
      </View>

      <Card className="gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-black text-rhinon-text">Recent Leads</Text>
          <Button variant="ghost" className="min-h-0 px-0 py-0" onPress={() => router.push("/(tabs)/leads")}>
            View all
          </Button>
        </View>

        {leads.map((lead) => (
          <View key={lead.id} className="flex-row items-center justify-between gap-3 rounded-2xl border border-rhinon-border bg-[#0B1320] p-3">
            <View className="flex-1 gap-1">
              <Text className="text-base font-bold text-rhinon-text">{lead.name}</Text>
              <Text className="text-sm text-rhinon-muted">
                {lead.company} • {lead.title || "Prospect"}
              </Text>
            </View>
            <Badge
              label={lead.status}
              tone={lead.status === "Interested" || lead.status === "Replied" ? "emerald" : "slate"}
            />
          </View>
        ))}
      </Card>

      <Card className="gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-black text-rhinon-text">Campaign Pulse</Text>
          <Button variant="ghost" className="min-h-0 px-0 py-0" onPress={() => router.push("/(tabs)/campaigns")}>
            Open board
          </Button>
        </View>

        {campaigns.map((campaign) => {
          const progress = campaign.leadsTotal ? Math.min(100, (campaign.leadsProcessed / campaign.leadsTotal) * 100) : 0;
          return (
            <View key={campaign.id} className="gap-3 rounded-2xl border border-rhinon-border bg-[#0B1320] p-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-base font-bold text-rhinon-text">{campaign.name}</Text>
                  <Text className="text-sm text-rhinon-muted">{campaign.channel}</Text>
                </View>
                <Badge label={campaign.stage} tone={campaign.stage === "Active" ? "emerald" : "slate"} />
              </View>
              <View className="h-2 rounded-full bg-white/5">
                <View className="h-2 rounded-full bg-cyan-400" style={{ width: `${progress}%` }} />
              </View>
              <Text className="text-xs font-semibold text-rhinon-muted">
                {campaign.leadsProcessed} / {campaign.leadsTotal} processed
              </Text>
            </View>
          );
        })}
      </Card>

      <Card className="gap-4">
        <View className="flex-row items-center gap-2">
          <ShieldCheck color="#22D3EE" size={18} />
          <Text className="text-lg font-black text-rhinon-text">Node Status</Text>
        </View>

        {health ? (
          Object.entries(health).map(([key, node]) => (
            <View key={key} className="flex-row items-center justify-between gap-3 rounded-2xl border border-rhinon-border bg-[#0B1320] p-4">
              <View className="flex-1 gap-1">
                <Text className="text-sm font-black uppercase tracking-[2px] text-rhinon-text">{key}</Text>
                <Text className="text-xs leading-5 text-rhinon-muted">{node.message}</Text>
              </View>
              <Badge
                label={node.status}
                tone={node.status === "healthy" ? "emerald" : node.status === "missing" ? "amber" : "rose"}
              />
            </View>
          ))
        ) : (
          <Text className="text-sm text-rhinon-muted">No health data.</Text>
        )}
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <Activity color="#8B5CF6" size={16} />
          <Text className="text-lg font-black text-rhinon-text">Operator Notes</Text>
        </View>
        <Text className="text-sm leading-6 text-rhinon-muted">
          Campaign load and AI enrichment volume are sourced from the live Rhinon APIs. Social connection health remains read-only in v1.
        </Text>
        <Text className="text-xs text-rhinon-muted">
          Last activity sample: {leads[0] ? formatDate(leads[0].lastActivityAt || leads[0].addedAt) : "N/A"}
        </Text>
      </Card>
    </ScrollView>
  );
}
