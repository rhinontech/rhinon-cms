import { ScrollView, Text, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScreenHeader } from "@/components/ui/screen-header";
import { dummyRoles, dummyUsers } from "@/lib/demo-team";
import { initials } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";

export default function TeamScreen() {
  const { user } = useAuth();

  return (
    <ScrollView className="flex-1 bg-rhinon-bg" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <ScreenHeader
        eyebrow="RBAC"
        title="Team & Access"
        subtitle="Mobile mirror of the current demo-backed team and role model."
      />

      {user?.roleSlug !== "admin" ? (
        <Card>
          <Text className="text-base font-bold text-rhinon-text">Restricted</Text>
          <Text className="mt-2 text-sm leading-6 text-rhinon-muted">
            Team management is only surfaced for admin operators in this mobile v1.
          </Text>
        </Card>
      ) : (
        <>
          <Card className="gap-4">
            <Text className="text-lg font-black text-rhinon-text">Users</Text>
            {dummyUsers.map((member) => (
              <View key={member.id} className="flex-row items-center gap-3 rounded-2xl border border-rhinon-border bg-[#0B1320] p-4">
                <View className="h-12 w-12 items-center justify-center rounded-2xl border border-rhinon-border bg-white/5">
                  <Text className="text-sm font-black text-cyan-300">{initials(member.name)}</Text>
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-base font-bold text-rhinon-text">{member.name}</Text>
                  <Text className="text-sm text-rhinon-muted">{member.email}</Text>
                </View>
                <Badge label={member.status} tone={member.status === "Active" ? "emerald" : "amber"} />
              </View>
            ))}
          </Card>

          <Card className="gap-4">
            <Text className="text-lg font-black text-rhinon-text">Roles</Text>
            {dummyRoles.map((role) => (
              <View key={role.id} className="gap-2 rounded-2xl border border-rhinon-border bg-[#0B1320] p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-bold text-rhinon-text">{role.name}</Text>
                  <Badge label={`${role.permissions.length} perms`} tone="violet" />
                </View>
                <Text className="text-sm leading-6 text-rhinon-muted">{role.permissions.join(" • ")}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}
