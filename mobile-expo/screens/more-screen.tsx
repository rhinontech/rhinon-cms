import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { ChevronRight, LogOut, Settings, Shield } from "lucide-react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScreenHeader } from "@/components/ui/screen-header";
import { initials } from "@/lib/format";
import { queryKeys, rhinonApi } from "@/lib/queries";
import { useAuth } from "@/providers/auth-provider";

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: queryKeys.health, queryFn: rhinonApi.health });

  if (!user) return null;

  return (
    <View className="flex-1 bg-rhinon-bg px-5 pb-6 pt-4">
      <View className="gap-4">
        <ScreenHeader
          eyebrow="Profile"
          title="Operator center"
          subtitle="Manage session state, view infrastructure health, and access team or settings modules."
        />

        <Card className="gap-4">
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10">
              <Text className="text-lg font-black text-cyan-300">{initials(user.name)}</Text>
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-xl font-black text-rhinon-text">{user.name}</Text>
              <Text className="text-sm text-rhinon-muted">{user.email}</Text>
              <Text className="text-xs text-rhinon-muted">{user.roleName}</Text>
            </View>
            <Badge label={user.roleSlug} tone="violet" />
          </View>
        </Card>

        <Card className="gap-3">
          <Text className="text-lg font-black text-rhinon-text">LinkedIn & Infrastructure</Text>
          {isLoading ? (
            <Text className="text-sm text-rhinon-muted">Checking node health...</Text>
          ) : (
            Object.entries(data ?? {}).map(([key, node]) => (
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
          )}
        </Card>

        <Card className="gap-3">
          <Pressable
            onPress={() => router.push("/more/settings")}
            className="flex-row items-center justify-between rounded-2xl border border-rhinon-border bg-[#0B1320] px-4 py-4"
          >
            <View className="flex-row items-center gap-3">
              <Settings color="#22D3EE" size={18} />
              <Text className="text-base font-bold text-rhinon-text">Settings</Text>
            </View>
            <ChevronRight color="#8FA3C7" size={18} />
          </Pressable>

          {user.roleSlug === "admin" ? (
            <Pressable
              onPress={() => router.push("/more/team")}
              className="flex-row items-center justify-between rounded-2xl border border-rhinon-border bg-[#0B1320] px-4 py-4"
            >
              <View className="flex-row items-center gap-3">
                <Shield color="#8B5CF6" size={18} />
                <Text className="text-base font-bold text-rhinon-text">Team & Access</Text>
              </View>
              <ChevronRight color="#8FA3C7" size={18} />
            </Pressable>
          ) : null}
        </Card>

        <Button variant="danger" onPress={() => void logout()} icon={<LogOut color="#FCA5A5" size={16} />}>
          Log Out
        </Button>
      </View>
    </View>
  );
}
