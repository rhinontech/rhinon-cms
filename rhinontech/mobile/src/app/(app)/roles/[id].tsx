import { useEffect, useMemo, useState } from "react";
import { Alert, Switch, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { success } from "@/lib/haptics";
import type { Permission, Role } from "@/lib/types";
import { Backdrop, BackButton, Button, Card, ComposerTray, ErrorState, GlassHeader, HeaderButton, ScrollScreen, SectionTitle, Spinner, Text } from "@/components/ui";

// Same rule as the web panel: the built-in roles can be edited but not deleted.
const PROTECTED_SLUGS = ["superadmin", "hr", "employee"];

const words = (s: string) => s === "crm" ? "CRM" : s.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

export default function RoleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refreshMe } = useAuth();
  const { colors } = useTheme();
  const roles = useApi<Role[]>("/roles");
  const catalog = useApi<Permission[]>("/permissions");
  const role = roles.data?.find((r) => r.id === id);
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [saving, setSaving] = useState(false);
  const locked = role?.slug === "superadmin";

  useEffect(() => {
    if (role && !selected) setSelected(new Set(role.Permissions?.map((p) => p.id)));
  }, [role, selected]);

  const groups = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of catalog.data ?? []) map.set(p.resource, [...(map.get(p.resource) ?? []), p]);
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [catalog.data]);

  const dirty = !!role && !!selected && (selected.size !== (role.Permissions?.length ?? 0) || role.Permissions?.some((p) => !selected.has(p.id)));

  const toggle = (permissionId: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(permissionId);
      else next.delete(permissionId);
      return next;
    });

  const save = () =>
    Alert.alert(`Update ${role?.name}?`, `This changes access right away for ${role?.usersCount ?? 0} ${role?.usersCount === 1 ? "person" : "people"}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Save",
        onPress: async () => {
          setSaving(true);
          try {
            await api.put(`/roles/${id}/permissions`, { permissionIds: [...(selected ?? [])] });
            success();
            await roles.reload();
            setSelected(null);
            await refreshMe();
          } catch (err) {
            Alert.alert("Couldn't save", err instanceof Error ? err.message : "Try again");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);

  const remove = () =>
    Alert.alert(`Delete ${role?.name}?`, "Only roles with nobody assigned can be deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          void api.delete(`/roles/${id}`).then(
            () => router.back(),
            (err) => Alert.alert("Couldn't delete", err instanceof Error ? err.message : "Try again")
          ),
      },
    ]);

  if (!role || !selected) {
    return (
      <View className="flex-1 bg-background">
        <Backdrop />
        <GlassHeader left={<BackButton />} title="Role" />
        {roles.loading ? <Spinner /> : <ErrorState message={roles.error ?? "Role not found"} onRetry={roles.refresh} />}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollScreen
        detail
        refreshing={catalog.refreshing}
        onRefresh={catalog.refresh}
        header={<GlassHeader left={<BackButton />} title={role.name} subtitle={locked ? "Always has every permission" : `${selected.size} permissions`} right={!PROTECTED_SLUGS.includes(role.slug) ? <HeaderButton icon={Trash2} label="Delete role" color={colors.destructive} onPress={remove} /> : undefined} />}
      >
        {catalog.error && !catalog.data && <ErrorState message={catalog.error} onRetry={catalog.refresh} />}
        {groups.map(([resource, permissions]) => (
          <View key={resource}>
            <SectionTitle title={words(resource)} />
            <Card className="mx-5 overflow-hidden">
              {permissions.map((p, i) => (
                <View key={p.id} className={`flex-row items-center justify-between px-4 py-2.5 ${i ? "border-t border-border" : ""}`}>
                  <Text className="text-[15px]">{words(p.action)}</Text>
                  <Switch
                    accessibilityLabel={p.name}
                    disabled={locked}
                    value={locked || selected.has(p.id)}
                    onValueChange={(on) => toggle(p.id, on)}
                    trackColor={{ true: colors.brand, false: colors.muted }}
                  />
                </View>
              ))}
            </Card>
          </View>
        ))}
      </ScrollScreen>
      {dirty && !locked && (
        <ComposerTray>
          <Button title="Save changes" onPress={save} loading={saving} />
        </ComposerTray>
      )}
    </View>
  );
}
