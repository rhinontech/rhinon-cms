import { useState } from "react";
import { Alert, FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { CheckCircle2, FolderKanban, Plus, UsersRound } from "lucide-react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import type { Project, Task, Team } from "@/lib/types";
import { TaskRow } from "@/components/TaskRow";
import { Backdrop, Button, Card, EmptyState, ErrorState, GlassHeader, HeaderButton, IconTile, Input, ListSkeleton, Segmented, Tappable, Text } from "@/components/ui";

type Section = "tasks" | "projects" | "teams";

function Tasks() {
  const { colors } = useTheme();
  const { data, error, loading, refreshing, refresh } = useApi<Task[]>("/tasks?scope=my", { pollMs: 60_000 });
  const open = (data ?? []).filter((t) => t.status !== "Done");
  return (
    <FlatList
      data={open}
      keyExtractor={(t) => t.id}
      renderItem={({ item }) => <TaskRow task={item} />}
      ItemSeparatorComponent={() => <View className="h-2.5" />}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground} />}
      ListEmptyComponent={loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refresh} /> : <EmptyState icon={CheckCircle2} title="Nothing on your plate" message="Tasks assigned to you will show up here." />}
    />
  );
}

function Projects() {
  const { colors } = useTheme();
  const { data, error, loading, refreshing, refresh } = useApi<Project[]>("/work/projects");
  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(p) => p.id}
      ItemSeparatorComponent={() => <View className="h-2.5" />}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground} />}
      renderItem={({ item }) => (
        <Tappable className="mx-4" scale={0.985} onPress={() => router.push({ pathname: "/work/project/[id]", params: { id: item.id, name: item.name } })}>
          <Card className="flex-row items-center gap-3 p-3.5">
            <IconTile icon={FolderKanban} size={40} />
            <View className="flex-1">
              <Text numberOfLines={1} className="font-medium text-[15px]">
                {item.name}
              </Text>
              <Text variant="caption" className="mt-0.5 text-[13px]">
                {item.taskCount} task{item.taskCount === 1 ? "" : "s"}
              </Text>
            </View>
          </Card>
        </Tappable>
      )}
      ListEmptyComponent={loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refresh} /> : <EmptyState icon={FolderKanban} title="No projects yet" message="Projects you can access will show up here." />}
    />
  );
}

function Teams() {
  const { colors } = useTheme();
  const { data, error, loading, refreshing, refresh } = useApi<Team[]>("/teams");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      await api.post("/teams", { name: name.trim() });
      setName("");
      await refresh();
    } catch (err) {
      Alert.alert("Couldn't create team", err instanceof Error ? err.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(t) => t.id}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <View className="h-2.5" />}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground} />}
      ListHeaderComponent={
        <View className="mb-3 flex-row items-center gap-2 px-4">
          <Input className="flex-1" value={name} onChangeText={setName} placeholder="New team name" returnKeyType="done" />
          <Button title="Create" onPress={create} loading={busy} disabled={!name.trim()} />
        </View>
      }
      renderItem={({ item }) => (
        <Tappable className="mx-4" scale={0.985} onPress={() => router.push({ pathname: "/work/team/[id]", params: { id: item.id } })}>
          <Card className="flex-row items-center gap-3 p-3.5">
            <IconTile icon={UsersRound} size={40} />
            <View className="flex-1">
              <Text numberOfLines={1} className="font-medium text-[15px]">
                {item.name}
              </Text>
              <Text variant="caption" className="mt-0.5 text-[13px]">
                {item.members?.length ?? 0} member{item.members?.length === 1 ? "" : "s"} · {item.projectCount ?? 0} project{item.projectCount === 1 ? "" : "s"}
              </Text>
            </View>
          </Card>
        </Tappable>
      )}
      ListEmptyComponent={loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refresh} /> : <EmptyState icon={UsersRound} title="No teams yet" message="Create one above, or ask an owner to add you." />}
    />
  );
}

export default function WorkScreen() {
  const [section, setSection] = useState<Section>("tasks");
  return (
    <View className="flex-1 bg-background">
      <Backdrop />
      <GlassHeader
        title="Work"
        right={
          section === "teams" ? undefined : <HeaderButton icon={Plus} label={section === "tasks" ? "New task" : "New project"} onPress={() => router.push(section === "tasks" ? "/work/task/form" : "/work/project/form")} />
        }
      >
        <View className="mt-3">
          <Segmented
            value={section}
            onChange={setSection}
            options={[
              { value: "tasks", label: "My tasks" },
              { value: "projects", label: "Projects" },
              { value: "teams", label: "Teams" },
            ]}
          />
        </View>
      </GlassHeader>
      {section === "tasks" ? <Tasks /> : section === "projects" ? <Projects /> : <Teams />}
    </View>
  );
}
