import { useState } from "react";
import { Alert, FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import type { Role } from "@/lib/types";
import { Backdrop, BackButton, Button, Card, EmptyState, ErrorState, GlassHeader, IconTile, Input, ListSkeleton, Tappable, Text } from "@/components/ui";

export default function RolesScreen() {
  const { colors } = useTheme();
  const { data, error, loading, refreshing, refresh } = useApi<Role[]>("/roles");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const clean = name.trim();
      await api.post("/roles", { name: clean, slug: clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") });
      setName("");
      await refresh();
    } catch (err) {
      Alert.alert("Couldn't create role", err instanceof Error ? err.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Backdrop />
      <GlassHeader left={<BackButton />} title="Roles & permissions" />
      <FlatList
        data={data ?? []}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.mutedForeground} />}
        ListHeaderComponent={
          <View className="mb-3 flex-row items-center gap-2 px-4">
            <Input className="flex-1" value={name} onChangeText={setName} placeholder="New role name" />
            <Button title="Create" onPress={create} loading={busy} disabled={!name.trim()} />
          </View>
        }
        renderItem={({ item }) => (
          <Tappable className="mx-4" scale={0.985} onPress={() => router.push({ pathname: "/roles/[id]", params: { id: item.id } })}>
            <Card className="flex-row items-center gap-3 p-3.5">
              <IconTile icon={ShieldCheck} size={40} />
              <View className="flex-1">
                <Text numberOfLines={1} className="font-medium text-[15px]">
                  {item.name}
                </Text>
                <Text variant="caption" className="mt-0.5 text-[13px]">
                  {item.usersCount ?? 0} {item.usersCount === 1 ? "person" : "people"} · {item.slug === "superadmin" ? "All permissions" : `${item.Permissions?.length ?? 0} permissions`}
                </Text>
              </View>
            </Card>
          </Tappable>
        )}
        ListEmptyComponent={loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={refresh} /> : <EmptyState icon={ShieldCheck} title="No roles yet" />}
      />
    </View>
  );
}
