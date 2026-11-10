import { useState } from "react";
import { Alert, FlatList, Modal, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Trash2, UserPlus, X } from "lucide-react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { useChatDirectory } from "@/lib/chat";
import { useTheme } from "@/lib/theme";
import { tap } from "@/lib/haptics";
import type { Team, TeamMember } from "@/lib/types";
import { Avatar, BackButton, Badge, Card, ErrorState, GlassHeader, HeaderButton, ScrollScreen, SectionTitle, Spinner, Backdrop, Text } from "@/components/ui";

function AddMembers({ team, onClose, onAdded }: { team: Team; onClose: () => void; onAdded: () => void }) {
  const { colors } = useTheme();
  const directory = useChatDirectory();
  const taken = new Set(team.members?.map((m) => m.userId));
  const people = [...directory.values()].filter((p) => !taken.has(p.id));

  const add = async (userId: string) => {
    tap();
    try {
      await api.post(`/teams/${team.id}/members`, { userIds: [userId] });
      onAdded();
    } catch (err) {
      Alert.alert("Couldn't add member", err instanceof Error ? err.message : "Try again");
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-5 py-4">
          <Text variant="heading">Add to {team.name}</Text>
          <HeaderButton icon={X} label="Close" onPress={onClose} />
        </View>
        <FlatList
          data={people}
          keyExtractor={(p) => p.id}
          ListEmptyComponent={
            <Text variant="caption" className="px-5 text-[13px]">
              Everyone in your directory is already on this team.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => add(item.id)} className="flex-row items-center gap-3 px-5 py-2.5 active:opacity-60">
              <Avatar name={item.name} uri={item.avatarUrl} size={38} />
              <View className="flex-1">
                <Text numberOfLines={1} className="font-medium text-[15px]">
                  {item.name}
                </Text>
                {!!item.department && <Text variant="caption">{item.department}</Text>}
              </View>
              <UserPlus size={18} color={colors.brand} />
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

export default function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me, can } = useAuth();
  const { colors } = useTheme();
  const { data: team, error, loading, refreshing, refresh, reload } = useApi<Team>(`/teams/${id}`);
  const [adding, setAdding] = useState(false);

  const mine = team?.members?.find((m) => m.userId === me?.id);
  const manage = me?.roleSlug === "superadmin" || mine?.role === "owner";

  const run = async (title: string, action: () => Promise<unknown>) => {
    try {
      await action();
      await reload();
    } catch (err) {
      Alert.alert(title, err instanceof Error ? err.message : "Try again");
    }
  };

  const memberActions = (m: TeamMember) => {
    const name = m.user?.fullName ?? "this person";
    const next = m.role === "owner" ? "member" : "owner";
    Alert.alert(name, undefined, [
      { text: next === "owner" ? "Make owner" : "Make member", onPress: () => void run("Couldn't change role", () => api.put(`/teams/${id}/members/${m.userId}`, { role: next })) },
      { text: "Remove from team", style: "destructive", onPress: () => void run("Couldn't remove", () => api.delete(`/teams/${id}/members/${m.userId}`)) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const removeTeam = () =>
    Alert.alert(`Delete ${team?.name}?`, "Its members lose this team. This can't be undone from the app.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          void api.delete(`/teams/${id}`).then(
            () => router.back(),
            (err) => Alert.alert("Couldn't delete", err instanceof Error ? err.message : "Try again")
          ),
      },
    ]);

  if (!team) {
    return (
      <View className="flex-1 bg-background">
        <Backdrop />
        <GlassHeader left={<BackButton />} title="Team" />
        {loading ? <Spinner /> : <ErrorState message={error ?? "Team not found"} onRetry={refresh} />}
      </View>
    );
  }

  return (
    <ScrollScreen
      detail
      refreshing={refreshing}
      onRefresh={refresh}
      header={
        <GlassHeader
          left={<BackButton />}
          title={team.name}
          right={
            manage ? (
              <View className="flex-row gap-2">
                {can("chat:read") && <HeaderButton icon={UserPlus} label="Add member" onPress={() => setAdding(true)} />}
                <HeaderButton icon={Trash2} label="Delete team" color={colors.destructive} onPress={removeTeam} />
              </View>
            ) : undefined
          }
        />
      }
    >
      {!!team.description && <Text className="px-5 pt-4 text-muted-foreground">{team.description}</Text>}
      <SectionTitle title={`Members (${team.members?.length ?? 0})`} />
      <Card className="mx-5 overflow-hidden">
        {team.members?.map((m, i) => (
          <Pressable key={m.id} disabled={!manage} onPress={() => memberActions(m)} className={`flex-row items-center gap-3 px-4 py-3 active:opacity-60 ${i ? "border-t border-border" : ""}`}>
            <Avatar name={m.user?.fullName} size={38} />
            <View className="flex-1">
              <Text numberOfLines={1} className="font-medium text-[15px]">
                {m.user?.fullName ?? "Unknown"}
              </Text>
              {!!m.user?.department && <Text variant="caption">{m.user.department}</Text>}
            </View>
            <Badge label={m.role === "owner" ? "Owner" : "Member"} tone={m.role === "owner" ? "brand" : "neutral"} />
          </Pressable>
        ))}
      </Card>
      {adding && (
        <AddMembers
          team={team}
          onClose={() => setAdding(false)}
          onAdded={() => void reload()}
        />
      )}
    </ScrollScreen>
  );
}
