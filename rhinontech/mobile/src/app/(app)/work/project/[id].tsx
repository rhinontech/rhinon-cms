import { useMemo, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ListChecks, Pencil, Plus } from "lucide-react-native";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import type { Task, WorkflowStatus } from "@/lib/types";
import { BackButton, Backdrop, Chips, EmptyState, ErrorState, GlassHeader, HeaderButton, ListSkeleton } from "@/components/ui";
import { TaskRow } from "@/components/TaskRow";

/** A project's board on a phone: one column at a time, picked from the chips. */
export default function ProjectScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { colors } = useTheme();
  const { data, error, loading, refreshing, refresh } = useApi<Task[]>(`/tasks?scope=all&projectId=${id}`, { pollMs: 60_000 });
  const statuses = useApi<WorkflowStatus[]>(`/workflow/statuses?projectId=${id}`);
  const [column, setColumn] = useState("all");

  const options = useMemo(() => {
    const tasks = data ?? [];
    return [
      { value: "all", label: `All ${tasks.length}` },
      ...(statuses.data ?? []).map((s) => ({ value: s.id, label: `${s.name} ${tasks.filter((t) => t.statusId === s.id).length}` })),
    ];
  }, [data, statuses.data]);
  const rows = (data ?? []).filter((t) => column === "all" || t.statusId === column);

  return (
    <View className="flex-1 bg-background">
      <Backdrop />
      <GlassHeader
        left={<BackButton />}
        title={name ?? "Project"}
        right={
          <View className="flex-row gap-2">
            <HeaderButton icon={Pencil} label="Edit project" onPress={() => router.push({ pathname: "/work/project/form", params: { id } })} />
            <HeaderButton icon={Plus} label="New task" onPress={() => router.push({ pathname: "/work/task/form", params: { projectId: id } })} />
          </View>
        }
      >
        <View className="mt-3">
          <Chips options={options} value={column} onChange={setColumn} />
        </View>
      </GlassHeader>
      <FlatList
        data={rows}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TaskRow task={item} />}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground} />}
        ListEmptyComponent={loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refresh} /> : <EmptyState icon={ListChecks} title="No tasks here" />}
      />
    </View>
  );
}
