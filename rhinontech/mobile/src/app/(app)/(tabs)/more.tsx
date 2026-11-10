import { Pressable, View } from "react-native";
import { router, type Href } from "expo-router";
import { Bell, Briefcase, CalendarCheck, CalendarDays, ChevronRight, ClipboardCheck, Settings, ShieldCheck, type LucideIcon } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { tap } from "@/lib/haptics";
import { Avatar, Card, GlassHeader, IconTile, ScrollScreen, SectionTitle, Text } from "@/components/ui";

function Row({ icon, label, hint, href, first }: { icon: LucideIcon; label: string; hint: string; href: Href; first?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        router.push(href);
      }}
      className={`flex-row items-center gap-3 px-4 py-3 active:opacity-60 ${first ? "" : "border-t border-border"}`}
    >
      <IconTile icon={icon} size={36} />
      <View className="flex-1">
        <Text className="font-medium text-[15px]">{label}</Text>
        <Text variant="caption" className="mt-0.5">
          {hint}
        </Text>
      </View>
      <ChevronRight size={17} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function MoreScreen() {
  const { me, can } = useAuth();
  const approvals = can("leave:write", "attendance:write", "employees:read", "payroll:write");
  const people: { icon: LucideIcon; label: string; hint: string; href: Href }[] = [
    ...(can("attendance:read") ? [{ icon: CalendarCheck, label: "Attendance", hint: "Clock in, breaks and history", href: "/attendance" as Href }] : []),
    ...(can("leave:read") ? [{ icon: CalendarDays, label: "Leave", hint: "Balance and requests", href: "/leave" as Href }] : []),
    ...(approvals ? [{ icon: ClipboardCheck, label: "Approvals", hint: "Requests waiting on you", href: "/approvals" as Href }] : []),
    ...(can("crm:read", "outreach:read") ? [{ icon: Briefcase, label: "CRM", hint: "Pipeline and leads", href: "/crm" as Href }] : []),
  ];

  return (
    <ScrollScreen header={<GlassHeader title="More" />}>
      <Card className="mx-5 mt-4 flex-row items-center gap-3 p-4">
        <Avatar name={me?.fullName} size={46} />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-semibold text-[16px]">
            {me?.fullName}
          </Text>
          <Text numberOfLines={1} variant="caption" className="mt-0.5 text-[13px]">
            {me?.role?.name ?? me?.roleSlug}
          </Text>
        </View>
      </Card>

      {!!people.length && (
        <>
          <SectionTitle title="Workspace" />
          <Card className="mx-5 overflow-hidden">
            {people.map((row, i) => (
              <Row key={row.label} {...row} first={i === 0} />
            ))}
          </Card>
        </>
      )}

      <SectionTitle title="Account" />
      <Card className="mx-5 overflow-hidden">
        <Row first icon={Bell} label="Notifications" hint="Everything that needs you" href="/notifications" />
        {can("settings:write") && <Row icon={ShieldCheck} label="Roles & permissions" hint="Who can do what" href="/roles" />}
        <Row icon={Settings} label="Settings" hint="Profile, theme and security" href="/settings" />
      </Card>
    </ScrollScreen>
  );
}
