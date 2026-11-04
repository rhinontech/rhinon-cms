import { useState } from "react";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Plus, Sparkles, Building2, CalendarDays, CircleDollarSign, Handshake, KanbanSquare, Users } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { money, shortTime } from "@/lib/format";
import { LEAD_STATUS_TONE } from "@/lib/crm";
import type { Lead, LeadStatus, PipelineStage } from "@/lib/types";
import { useDebounced } from "@/hooks/useDebounced";
import { Avatar, BackButton, Backdrop, Badge, Card, Chips, EmptyState, ErrorState, GlassHeader, HeaderButton, ListSkeleton, SearchBar, Segmented, StatTile, Tappable, Text } from "@/components/ui";

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
  const { can } = useAuth();
  const canEdit = can("crm:write", "outreach:write");
  const { colors } = useTheme();
    const { data, error, loading, refreshing, refresh } = useApi<{ stages: PipelineStage[] }>("/deals/board");
  const stages = (data?.stages ?? []).filter((s) => s.type === "Open" || s.dealCount > 0);
  const total = stages.filter((s) => s.type === "Open").reduce((sum, s) => sum + Number(s.totalValue), 0);
  const count = stages.filter((s) => s.type === "Open").reduce((sum, s) => sum + s.dealCount, 0);

  if (loading && !data) {
    return (
              <ListSkeleton rows={4} />
          );
  }
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />;
  if (!stages.length) {
    return <EmptyState icon={KanbanSquare} title="No pipeline yet" message="Deals created on the web will appear here." />;
  }

  return (
        <ScrollView
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground}  />}
    >
      <View className="mx-5 flex-row gap-3">
        <StatTile icon={CircleDollarSign} label="Pipeline value" value={money(total)} />
        <StatTile icon={Handshake} label="Open deals" value={String(count)} />
      </View>

      {stages.map((stage) => {
        const share = total ? Math.min(1, Number(stage.totalValue) / total) : 0;
        const stageColor = stage.color || colors.brand;
        return (
          <View key={stage.id} className="mt-7">
            <View className="mb-2 flex-row items-center gap-2 px-5">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stageColor }} />
              <Text numberOfLines={1} className="flex-1 font-semibold text-[15px]">
                {stage.name}
              </Text>
              <Text className="font-semibold text-[13.5px] text-muted-foreground">
                {stage.dealCount} {stage.dealCount === 1 ? "deal" : "deals"} · {money(stage.totalValue)}
              </Text>
            </View>
            <View className="mx-5 mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <View className="h-1.5 rounded-full" style={{ width: `${share * 100}%`, backgroundColor: stageColor }} />
            </View>
            {stage.deals.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8, gap: 12 }}>
                {stage.deals.map((deal) => (
                  <Tappable key={deal.id} disabled={!canEdit} accessibilityLabel={`Edit ${deal.title}`} onPress={() => router.push({ pathname: "/crm/deal-form", params: { id: deal.id } })}>
                  <Card className="w-60 overflow-hidden p-4">
                                        <Text numberOfLines={2} className="min-h-[40px] font-semibold text-[15px] leading-5">
                      {deal.title}
                    </Text>
                    {deal.account && (
                      <View className="mt-1.5 flex-row items-center gap-1.5">
                        <Building2 size={13} color={colors.mutedForeground} />
                        <Text numberOfLines={1} variant="caption" className="flex-1 text-[13px]">
                          {deal.account.name}
                        </Text>
                      </View>
                    )}
                    <View className="mt-4 flex-row items-center justify-between">
                      <Text className="font-bold text-[18px] tracking-tight">{money(deal.value, deal.currency || "INR")}</Text>
                      {deal.expectedCloseDate && (
                        <View className="flex-row items-center gap-1">
                          <CalendarDays size={13} color={colors.mutedForeground} />
                          <Text variant="caption">{new Date(deal.expectedCloseDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</Text>
                        </View>
                      )}
                    </View>
                  </Card>
                  </Tappable>
                ))}
              </ScrollView>
            ) : (
              <Text variant="caption" className="px-5 text-[13px]">
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
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground}  />}
      ItemSeparatorComponent={() => <View className="h-2.5" />}
      ListHeaderComponent={
        <View className="gap-3 px-5 pb-3">
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, company, email" />
          <Chips options={STATUS_FILTERS} value={status} onChange={setStatus} />
          {data && (
            <Text className="font-medium text-[13px] text-muted-foreground">
              {data.count.toLocaleString()} lead{data.count === 1 ? "" : "s"}
            </Text>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <Tappable className="mx-4" scale={0.985} onPress={() => router.push({ pathname: "/crm/lead/[id]", params: { id: item.id } })}>
          <Card className="flex-row items-center gap-3 p-3.5">
            <Avatar name={item.name} size={46} />
            <View className="flex-1">
              <Text numberOfLines={1} className="font-semibold text-[15.5px]">
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
          </Card>
        </Tappable>
      )}
      ListEmptyComponent={
        loading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : (
          <EmptyState icon={Users} title="No leads found" message={q ? `Nothing matches “${q}”.` : undefined} />
        )
      }
    />
      );
}

export default function CrmScreen() {
  const { can, me } = useAuth();
  const canWrite = can("crm:write", "outreach:write");
  const [view, setView] = useState<View_>("pipeline");
  return (
    <View className="flex-1 bg-background">
      <Backdrop />
      <GlassHeader left={<BackButton />} title="CRM"
        subtitle="Your deals and leads"
        right={
          canWrite ? (
            <View className="flex-row gap-2">
              {/* Lead sourcing is platform-only; the API refuses everyone else too. */}
              {view === "leads" && me?.organization?.isPlatform && <HeaderButton icon={Sparkles} label="Lead finder" onPress={() => router.push("/crm/finder")} />}
              <HeaderButton icon={Plus} label={view === "pipeline" ? "New deal" : "New lead"} onPress={() => router.push(view === "pipeline" ? "/crm/deal-form" : "/crm/lead-form")} />
            </View>
          ) : undefined
        }
      >
        <View className="mt-3">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "pipeline", label: "Pipeline", icon: KanbanSquare },
              { value: "leads", label: "Leads", icon: Users },
            ]}
          />
        </View>
      </GlassHeader>
      {view === "pipeline" ? <Pipeline /> : <Leads />}
    </View>
  );
}
