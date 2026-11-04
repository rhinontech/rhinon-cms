import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Building2, KanbanSquare, Users } from "lucide-react-native";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { money, shortTime } from "@/lib/format";
import { tap } from "@/lib/haptics";
import { LEAD_STATUS_TONE } from "@/lib/crm";
import type { Lead, LeadStatus, PipelineStage } from "@/lib/types";
import { useDebounced } from "@/hooks/useDebounced";
import { Avatar, Badge, Card, Chips, EmptyState, ErrorState, LargeHeader, ListSkeleton, SearchBar, Segmented, Text } from "@/components/ui";

type View_ = "pipeline" | "leads";
type StatusFilter = "all" | LeadStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "New", label: "New" },
  { value: "Emailed", label: "Emailed" },
  { value: "Replied", label: "Replied" },
  { value: "Interested", label: "Interested" },
];

function Pipeline() {
  const { colors } = useTheme();
  const { data, error, loading, refreshing, refresh } = useApi<{ stages: PipelineStage[] }>("/deals/board");
  const stages = (data?.stages ?? []).filter((s) => s.type === "Open" || s.dealCount > 0);
  const total = stages.filter((s) => s.type === "Open").reduce((sum, s) => sum + Number(s.totalValue), 0);
  const count = stages.filter((s) => s.type === "Open").reduce((sum, s) => sum + s.dealCount, 0);

  if (loading && !data) return <ListSkeleton rows={4} />;
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />;
  if (!stages.length) {
    return <EmptyState icon={<KanbanSquare size={24} color={colors.mutedForeground} />} title="No pipeline yet" message="Deals created on the web will appear here." />;
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground} />}
    >
      <View className="mx-5 mb-2 mt-2 flex-row gap-3">
        <Card className="flex-1 p-4">
          <Text variant="caption">Open pipeline</Text>
          <Text className="mt-1 font-bold text-[22px] tracking-tight">{money(total)}</Text>
        </Card>
        <Card className="flex-1 p-4">
          <Text variant="caption">Open deals</Text>
          <Text className="mt-1 font-bold text-[22px] tracking-tight">{count}</Text>
        </Card>
      </View>

      {stages.map((stage) => {
        const share = total ? Math.min(1, Number(stage.totalValue) / total) : 0;
        const tint = stage.color || colors.brand;
        return (
          <View key={stage.id} className="mt-6">
            <View className="mb-2.5 flex-row items-center gap-2 px-5">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tint }} />
              <Text className="flex-1 font-semibold text-[15px]">{stage.name}</Text>
              <Text variant="caption">
                {stage.dealCount} · {money(stage.totalValue)}
              </Text>
            </View>
            <View className="mx-5 mb-3 h-1 overflow-hidden rounded-full bg-muted">
              <View className="h-1 rounded-full" style={{ width: `${share * 100}%`, backgroundColor: tint }} />
            </View>
            {stage.deals.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
                {stage.deals.map((deal) => (
                  <Card key={deal.id} className="w-60 p-4">
                    <Text numberOfLines={2} className="font-semibold text-[15px] leading-5">
                      {deal.title}
                    </Text>
                    {deal.account && (
                      <View className="mt-1.5 flex-row items-center gap-1.5">
                        <Building2 size={12} color={colors.mutedForeground} />
                        <Text numberOfLines={1} variant="caption">
                          {deal.account.name}
                        </Text>
                      </View>
                    )}
                    <View className="mt-4 flex-row items-center justify-between">
                      <Text className="font-bold text-[17px]">{money(deal.value, deal.currency || "INR")}</Text>
                      {deal.expectedCloseDate && (
                        <Text variant="caption">
                          {new Date(deal.expectedCloseDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                        </Text>
                      )}
                    </View>
                  </Card>
                ))}
              </ScrollView>
            ) : (
              <Text variant="caption" className="px-5">
                No deals in this stage
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function Leads() {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const q = useDebounced(search.trim());
  const params = new URLSearchParams({ limit: "50" });
  if (q) params.set("search", q);
  if (status !== "all") params.set("status", status);
  const { data, error, loading, refreshing, refresh } = useApi<{ rows: Lead[]; count: number }>(`/leads?${params}`);

  return (
    <FlatList
      data={data?.rows ?? []}
      keyExtractor={(l) => l.id}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground} />}
      ItemSeparatorComponent={() => <View className="ml-[76px] h-px bg-border" />}
      ListHeaderComponent={
        <View className="gap-3 px-5 pb-2 pt-1">
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, company, email" />
          <Chips options={STATUS_FILTERS} value={status} onChange={setStatus} />
          {data && (
            <Text variant="caption">
              {data.count.toLocaleString()} lead{data.count === 1 ? "" : "s"}
            </Text>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => {
            tap();
            router.push({ pathname: "/crm/lead/[id]", params: { id: item.id } });
          }}
          className="flex-row items-center gap-3 px-5 py-3 active:bg-muted"
        >
          <Avatar name={item.name} size={44} />
          <View className="flex-1">
            <Text numberOfLines={1} className="font-semibold text-[15px]">
              {item.name}
            </Text>
            <Text numberOfLines={1} variant="caption" className="mt-0.5 text-[13px]">
              {[item.title, item.company].filter(Boolean).join(" · ")}
            </Text>
          </View>
          <View className="items-end gap-1.5">
            <Badge label={item.status} tone={LEAD_STATUS_TONE[item.status] ?? "neutral"} />
            <Text variant="caption" className="text-[11px]">
              {shortTime(item.lastActivityAt || item.addedAt)}
            </Text>
          </View>
        </Pressable>
      )}
      ListEmptyComponent={
        loading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : (
          <EmptyState icon={<Users size={24} color={colors.mutedForeground} />} title="No leads found" message={q ? `Nothing matches “${q}”.` : undefined} />
        )
      }
    />
  );
}

export default function CrmScreen() {
  const [view, setView] = useState<View_>("pipeline");
  return (
    <View className="flex-1 bg-background">
      <LargeHeader title="CRM" />
      <View className="px-5 pb-3">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "pipeline", label: "Pipeline" },
            { value: "leads", label: "Leads" },
          ]}
        />
      </View>
      {view === "pipeline" ? <Pipeline /> : <Leads />}
    </View>
  );
}
