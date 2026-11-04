import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import Constants from "expo-constants";
import { Building2, Crown, LogOut, Mail, Moon, Server, ShieldCheck, Smartphone, Sun, UserRound, type LucideIcon } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { loadSchemePreference, saveSchemePreference, type SchemePreference } from "@/lib/colorScheme";
import { Avatar, BackButton, Badge, Card, GlassHeader, IconTile, ScrollScreen, SectionTitle, Segmented, Tappable, Text } from "@/components/ui";

function Row({ icon, label, value, tone, first, right }: { icon: LucideIcon; label: string; value?: string; tone?: "brand" | "success" | "neutral"; first?: boolean; right?: React.ReactNode }) {
  return (
    <View className={`flex-row items-center gap-3 py-3 pl-4 pr-4 ${first ? "" : "border-t border-border"}`}>
      <IconTile icon={icon} tone={tone} size={32} />
      <Text className="flex-1 text-[15px]">{label}</Text>
      {right ?? (
        <Text numberOfLines={1} className="max-w-[55%] text-[14px] text-muted-foreground">
          {value}
        </Text>
      )}
    </View>
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
      detail
      refreshing={twoFactor.refreshing}
      header={<GlassHeader left={<BackButton />} title="Settings" />}
    >
      <Card className="mx-5 mt-4 flex-row items-center gap-4 p-4">
        <Avatar name={me?.fullName} size={56} />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-semibold text-[18px] leading-6">
            {me?.fullName ?? "—"}
          </Text>
          <Text numberOfLines={1} variant="caption" className="mt-0.5 text-[13px] leading-[18px]">
            {me?.companyEmail}
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-1.5">
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
            { value: "system", label: "Auto", icon: Smartphone },
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
          ]}
        />
      </View>

      <SectionTitle title="Workspace" />
      <Card className="mx-5 overflow-hidden">
        <Row first icon={Building2} label="Organization" value={org?.name ?? "—"} />
        <Row
          icon={Crown}
          label="Plan"
          right={
            <View className="flex-row gap-1.5">
              <Badge label={PLAN_LABEL[org?.plan ?? ""] ?? "—"} tone="brand" />
              {org?.status === "trial" && <Badge label="Trial" tone="warning" />}
              {org?.status === "suspended" && <Badge label="Suspended" tone="danger" />}
            </View>
          }
        />
        <Row icon={Mail} label="Email domain" value={org?.emailDomain ?? "—"} />
        <Row icon={UserRound} label="Role" value={roleName ?? "—"} />
      </Card>

      <SectionTitle title="Security" />
      <Card className="mx-5 overflow-hidden">
        <Row
          first
          icon={ShieldCheck}
          tone={twoFactor.data?.enabled ? "success" : "neutral"}
          label="Two-step verification"
          right={twoFactor.data ? <Badge label={twoFactor.data.enabled ? "On" : "Off"} tone={twoFactor.data.enabled ? "success" : "neutral"} /> : undefined}
        />
      </Card>
      <Text variant="caption" className="mx-6 mt-2 text-[13px] leading-[18px]">
        {twoFactor.data?.enabled ? `${twoFactor.data.recoveryCodesLeft} recovery codes left.` : "Turn it on from Profile → Security in the web admin panel."}
      </Text>

      <SectionTitle title="About" />
      <Card className="mx-5 overflow-hidden">
        <Row first icon={Smartphone} label="Version" value={Constants.expoConfig?.version ?? "1.0.0"} />
        <Row icon={Server} label="Server" value={API_URL.replace(/^https?:\/\//, "")} />
      </Card>

      <Tappable accessibilityRole="button" className="mx-5 mt-8" onPress={confirmSignOut}>
        <View className="flex-row items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-3.5">
          <LogOut size={18} color={colors.destructive} />
          <Text className="font-semibold text-[15px] text-destructive">Sign out</Text>
        </View>
      </Tappable>
    </ScrollScreen>
  );
}
