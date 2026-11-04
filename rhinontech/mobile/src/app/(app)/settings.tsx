import { useEffect, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import Constants from "expo-constants";
import { Building2, ChevronRight, LogOut, Mail, Moon, Server, ShieldCheck, Smartphone, Sun, UserRound, type LucideIcon } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { loadSchemePreference, saveSchemePreference, type SchemePreference } from "@/lib/colorScheme";
import { tap } from "@/lib/haptics";
import { Avatar, Badge, Card, LargeHeader, ScrollScreen, SectionTitle, Segmented, Text } from "@/components/ui";

function Row({
  icon: Icon,
  label,
  value,
  tint,
  first,
  onPress,
  right,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  tint: string;
  first?: boolean;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const content = (
    <View className={`flex-row items-center gap-3 py-3 pl-4 pr-3 ${first ? "" : "border-t border-border"}`}>
      <View className="h-8 w-8 items-center justify-center rounded-[9px]" style={{ backgroundColor: tint }}>
        <Icon size={16} color="#FFFFFF" />
      </View>
      <Text className="flex-1 text-[15px]">{label}</Text>
      {right ?? (
        <Text numberOfLines={1} className="max-w-[55%] text-[14px] text-muted-foreground">
          {value}
        </Text>
      )}
      {onPress && <ChevronRight size={16} color={colors.mutedForeground} />}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} className="active:bg-muted">
      {content}
    </Pressable>
  ) : (
    content
  );
}

const PLAN_LABEL: Record<string, string> = { free: "Free", starter: "Starter", enterprise: "Enterprise" };

export default function SettingsScreen() {
  const { me, signOut, refreshMe } = useAuth();
  const { colors } = useTheme();
  const [scheme, setScheme] = useState<SchemePreference>("system");
  const twoFactor = useApi<{ enabled: boolean; recoveryCodesLeft: number }>("/auth/2fa/status");

  useEffect(() => {
    void loadSchemePreference().then(setScheme);
  }, []);

  const org = me?.organization;
  const roleName = me?.role?.name ?? me?.roleSlug;

  const confirmSignOut = () => {
    tap();
    Alert.alert("Sign out?", "You'll need your password to sign back in.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void signOut() },
    ]);
  };

  return (
    <ScrollScreen
      onRefresh={() => {
        void refreshMe();
        void twoFactor.refresh();
      }}
      refreshing={twoFactor.refreshing}
      header={<LargeHeader title="Settings" />}
    >
      {/* Profile */}
      <Card className="mx-5 mt-2 flex-row items-center gap-4 p-4">
        <Avatar name={me?.fullName} size={60} />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-semibold text-[18px]">
            {me?.fullName ?? "—"}
          </Text>
          <Text numberOfLines={1} variant="caption" className="mt-0.5 text-[13px]">
            {me?.companyEmail}
          </Text>
          <View className="mt-2 flex-row gap-1.5">
            {roleName && <Badge label={roleName} tone="brand" />}
            {me?.department && <Badge label={me.department} />}
          </View>
        </View>
      </Card>

      <SectionTitle title="Appearance" />
      <View className="px-5">
        <Segmented<SchemePreference>
          value={scheme}
          onChange={(v) => {
            setScheme(v);
            void saveSchemePreference(v);
          }}
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </View>

      <SectionTitle title="Workspace" />
      <Card className="mx-5 overflow-hidden">
        <Row first icon={Building2} tint="#6366F1" label="Organization" value={org?.name ?? "—"} />
        <Row
          icon={Sun}
          tint="#F59E0B"
          label="Plan"
          right={
            <View className="flex-row gap-1.5">
              <Badge label={PLAN_LABEL[org?.plan ?? ""] ?? "—"} />
              {org?.status === "trial" && <Badge label="Trial" tone="warning" />}
              {org?.status === "suspended" && <Badge label="Suspended" tone="danger" />}
            </View>
          }
        />
        <Row icon={Mail} tint="#0EA5E9" label="Email domain" value={org?.emailDomain ?? "—"} />
        <Row icon={UserRound} tint="#10B981" label="Role" value={roleName ?? "—"} />
      </Card>

      <SectionTitle title="Security" />
      <Card className="mx-5 overflow-hidden">
        <Row
          first
          icon={ShieldCheck}
          tint={twoFactor.data?.enabled ? colors.success : "#64748B"}
          label="Two-step verification"
          right={
            twoFactor.data ? (
              <Badge label={twoFactor.data.enabled ? "On" : "Off"} tone={twoFactor.data.enabled ? "success" : "neutral"} />
            ) : undefined
          }
        />
      </Card>
      <Text variant="caption" className="mx-6 mt-2 leading-[17px]">
        {twoFactor.data?.enabled
          ? `${twoFactor.data.recoveryCodesLeft} recovery codes left.`
          : "Turn it on from Profile → Security in the web admin panel."}
      </Text>

      <SectionTitle title="About" />
      <Card className="mx-5 overflow-hidden">
        <Row first icon={Smartphone} tint="#8B5CF6" label="Version" value={Constants.expoConfig?.version ?? "1.0.0"} />
        <Row icon={Server} tint="#475569" label="Server" value={API_URL.replace(/^https?:\/\//, "")} />
        <Row icon={Moon} tint="#1E293B" label="Theme" value={scheme === "system" ? "Follows device" : scheme === "dark" ? "Dark" : "Light"} />
      </Card>

      <Pressable onPress={confirmSignOut} className="mx-5 mt-8 flex-row items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-3.5 active:opacity-70">
        <LogOut size={18} color={colors.destructive} />
        <Text className="font-semibold text-[15px] text-destructive">Sign out</Text>
      </Pressable>
    </ScrollScreen>
  );
}
