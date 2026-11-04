import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import {
  Bell,
  Briefcase,
  Cake,
  CalendarCheck,
  CheckCircle2,
  Inbox as InboxIcon,
  MessagesSquare,
  PartyPopper,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { lift, useTheme } from "@/lib/theme";
import { dueLabel, greeting, hoursLabel, money, ordinal } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";
import { Avatar, Badge, Card, CountDot, ErrorState, GlassHeader, HeaderButton, IconTile, ScrollScreen, SectionTitle, Skeleton, StatTile, Tappable, Text } from "@/components/ui";

function QuickAction({ icon, label, count, onPress }: { icon: LucideIcon; label: string; count?: number; onPress: () => void }) {
  return (
    <Tappable accessibilityRole="button" className="flex-1" onPress={onPress}>
      <Card className="items-center gap-2 py-4">
        <View>
          <IconTile icon={icon} size={42} />
          {!!count && (
            <View className="absolute -right-2.5 -top-2">
              <CountDot count={count} />
            </View>
          )}
        </View>
        <Text variant="label">{label}</Text>
      </Card>
    </Tappable>
  );
}

function HeroFigure({ label, value, flex }: { label: string; value: string; flex?: boolean }) {
  return (
    <View className={flex ? "flex-1" : undefined}>
      <Text variant="caption">{label}</Text>
      <Text numberOfLines={1} className="mt-0.5 font-semibold text-[15px]">
        {value}
      </Text>
    </View>
  );
}

const URGENCY_TONE = { overdue: "danger", today: "warning", later: "neutral" } as const;
const URGENCY_DOT = { overdue: "bg-destructive", today: "bg-warning", later: "bg-brand" } as const;

export default function DashboardScreen() {
  const { me, can } = useAuth();
  const { colors } = useTheme();
  const { data, error, loading, refreshing, refresh } = useApi<DashboardStats>("/dashboard/stats");
  const inboxCounts = useApi<{ unread: number }>("/inbox/counts", { enabled: can("inbox:read"), pollMs: 60_000 });
  const chatUnread = useApi<{ total: number }>("/team-chat/unread", { enabled: can("chat:read"), pollMs: 30_000 });

  const notifications = useApi<{ unread: number }>("/notifications?limit=1", { pollMs: 60_000 });

  const fullName = data?.currentUser.fullName || me?.fullName || "";
  const firstName = fullName.split(" ")[0];
  const today = data?.todayAttendance;
  const onClock = !!today?.clockIn && !today.clockOut;
  const celebrations = [
    ...(data?.birthdays ?? []).map((c) => ({ ...c, kind: "birthday" as const })),
    ...(data?.anniversaries ?? []).map((c) => ({ ...c, kind: "anniversary" as const })),
  ].sort((a, b) => Number(b.isToday) - Number(a.isToday) || a.day - b.day);

  return (
    <ScrollScreen
      refreshing={refreshing}
      onRefresh={() => {
        void refresh();
        void inboxCounts.refresh();
        void chatUnread.refresh();
        void notifications.refresh();
      }}
      header={
        <GlassHeader
          subtitle={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          title={firstName ? `${greeting()}, ${firstName}` : greeting()}
          right={
            <View>
              <HeaderButton icon={Bell} label="Notifications" onPress={() => router.push("/notifications")} />
              {!!notifications.data?.unread && (
                <View pointerEvents="none" className="absolute -right-1.5 -top-1.5">
                  <CountDot count={notifications.data.unread} />
                </View>
              )}
            </View>
          }
        />
      }
    >
      {error && !data ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <>
          {/* Today's attendance, on the panel's `glass-panel`. */}
          <>
            <View className="mx-5 mt-4 rounded-3xl p-5" style={[{ backgroundColor: colors.glassPanel, borderWidth: 1, borderColor: colors.glassEdge }, lift(colors.shadow, "panel")]}>
              <View className="flex-row items-center justify-between">
                <Text variant="label" className="text-muted-foreground">
                  Time worked today
                </Text>
                <Badge label={today?.clockIn ? (today.clockOut ? "Clocked out" : "Clocked in") : "Not clocked in"} tone={onClock ? "success" : "neutral"} />
              </View>
              {loading && !data ? (
                <Skeleton className="mt-3 h-10 w-32" />
              ) : (
                <Text className="mt-2 font-bold text-[38px] leading-[44px] tracking-tight">{hoursLabel(today?.durationMinutes ?? 0)}</Text>
              )}
              <View className="mt-4 flex-row gap-6 border-t border-border pt-3.5">
                <HeroFigure label="This month" value={hoursLabel(data?.totalMinutesThisMonth ?? 0)} />
                <HeroFigure label="Days present" value={String(data?.daysPresent ?? 0)} />
                {data?.currentUser.role ? <HeroFigure label="Role" value={data.currentUser.role} flex /> : null}
              </View>
            </View>
          </>

          <>
            <View className="mt-5 flex-row gap-3 px-5">
              {can("inbox:read") && (
                <QuickAction icon={InboxIcon} label="Inbox" count={inboxCounts.data?.unread} onPress={() => router.navigate("/inbox")} />
              )}
              {can("chat:read") && (
                <QuickAction icon={MessagesSquare} label="Chat" count={chatUnread.data?.total} onPress={() => router.navigate("/chat")} />
              )}
              {can("crm:read", "outreach:read") && <QuickAction icon={Briefcase} label="Pipeline" onPress={() => router.navigate("/crm")} />}
            </View>
          </>

          <>
            <SectionTitle title="Overview" />
            <View className="gap-3 px-5">
              <View className="flex-row gap-3">
                <StatTile icon={Users} label="Team members" value={String(data?.totalEmployees ?? "–")} hint={data?.newThisMonth ? `+${data.newThisMonth} this month` : undefined} />
                <StatTile icon={CheckCircle2} label="Open tasks" value={String(data?.pendingTasks ?? "–")} />
              </View>
              {data?.crm && (
                <View className="flex-row gap-3">
                  <StatTile icon={TrendingUp} label="Pipeline value" value={money(data.crm.openValue)} hint={`${data.crm.openCount} open deals`} />
                  <StatTile icon={CalendarCheck} label="Likely revenue" value={money(data.crm.weightedValue)} hint="Weighted by deal stage" />
                </View>
              )}
            </View>
          </>

          {!!data?.pendingTasksList.length && (
            <>
              <SectionTitle title="Up next" />
              <Card className="mx-5">
                {data.pendingTasksList.map((t, i) => {
                  const due = t.dueDate ? dueLabel(t.dueDate) : null;
                  return (
                    <View key={t.id} className={`flex-row items-center gap-3 px-4 py-3.5 ${i ? "border-t border-border" : ""}`}>
                      <View className={`h-2.5 w-2.5 rounded-full ${due ? URGENCY_DOT[due.urgency] : "bg-brand"}`} />
                      <View className="flex-1">
                        <Text numberOfLines={1} className="font-medium text-[15px]">
                          {t.title}
                        </Text>
                        {t.team && (
                          <Text numberOfLines={1} variant="caption" className="mt-0.5 text-[13px]">
                            {t.team}
                          </Text>
                        )}
                      </View>
                      {due && <Badge label={due.label} tone={URGENCY_TONE[due.urgency]} />}
                    </View>
                  );
                })}
              </Card>
            </>
          )}

          {!!celebrations.length && (
            <>
              <SectionTitle title="Celebrations" />
              <Card className="mx-5">
                {celebrations.slice(0, 6).map((c, i) => (
                  <View key={`${c.kind}-${c.id}`} className={`flex-row items-center gap-3 px-4 py-3 ${i ? "border-t border-border" : ""}`}>
                    <Avatar name={c.fullName} size={40} />
                    <View className="flex-1">
                      <Text numberOfLines={1} className="font-medium text-[15px]">
                        {c.fullName}
                      </Text>
                      <Text variant="caption" className="mt-0.5 text-[13px]">
                        {c.kind === "birthday" ? "Birthday" : "Work anniversary"} · {c.isToday ? "Today" : `the ${ordinal(c.day)}`}
                      </Text>
                    </View>
                    <IconTile icon={c.kind === "birthday" ? Cake : PartyPopper} size={32} />
                  </View>
                ))}
              </Card>
            </>
          )}

          {!!data?.recentHires.length && (
            <>
              <SectionTitle title="New joiners" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 6, gap: 12 }}>
                {data.recentHires.map((h) => (
                  <Card key={h.id} className="w-40 items-center p-4">
                    <Avatar name={h.fullName} size={56} />
                    <Text numberOfLines={1} className="mt-3 font-medium text-[14px]">
                      {h.fullName}
                    </Text>
                    <Text numberOfLines={1} variant="caption" className="mt-0.5">
                      {h.role || h.department || "Team"}
                    </Text>
                  </Card>
                ))}
              </ScrollView>
            </>
          )}
        </>
      )}
    </ScrollScreen>
  );
}
