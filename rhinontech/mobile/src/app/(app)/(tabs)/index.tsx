import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Cake,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Inbox as InboxIcon,
  MessagesSquare,
  PartyPopper,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { greeting, money } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";
import { tap } from "@/lib/haptics";
import { Avatar, Card, CountDot, ErrorState, LargeHeader, ScrollScreen, SectionTitle, Skeleton, Text } from "@/components/ui";

function Stat({ icon: Icon, label, value, hint, tint }: { icon: LucideIcon; label: string; value: string; hint?: string; tint: string }) {
  return (
    <Card className="flex-1 p-4">
      <View className="mb-4 h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${tint}1A` }}>
        <Icon size={18} color={tint} />
      </View>
      <Text className="font-bold text-[24px] leading-7 tracking-tight">{value}</Text>
      <Text variant="caption" className="mt-1">
        {label}
      </Text>
      {hint && <Text className="mt-1 font-medium text-[11px] text-success">{hint}</Text>}
    </Card>
  );
}

function QuickAction({ icon: Icon, label, count, onPress }: { icon: LucideIcon; label: string; count?: number; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      className="flex-1 items-center gap-2 rounded-2xl border border-border bg-card py-4 active:opacity-80"
    >
      <View>
        <Icon size={22} color={colors.foreground} strokeWidth={1.8} />
        {!!count && (
          <View className="absolute -right-3 -top-2">
            <CountDot count={count} />
          </View>
        )}
      </View>
      <Text variant="label">{label}</Text>
    </Pressable>
  );
}

function hoursLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default function DashboardScreen() {
  const { me, can } = useAuth();
  const { colors, isDark } = useTheme();
  const { data, error, loading, refreshing, refresh } = useApi<DashboardStats>("/dashboard/stats");
  const inboxCounts = useApi<{ unread: number }>("/inbox/counts", { enabled: can("inbox:read"), pollMs: 60_000 });
  const chatUnread = useApi<{ total: number }>("/team-chat/unread", { enabled: can("chat:read"), pollMs: 30_000 });

  const firstName = (data?.currentUser.fullName || me?.fullName || "").split(" ")[0];
  const today = data?.todayAttendance;
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
      }}
      header={
        <LargeHeader
          subtitle={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          title={firstName ? `${greeting()}, ${firstName}` : greeting()}
        />
      }
    >
      {error && !data ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <>
          {/* Hero: today's attendance */}
          <View className="px-5 pt-2">
            <LinearGradient
              colors={isDark ? ["#312E81", "#1E1B4B"] : ["#1C1E26", "#3730A3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 20 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-medium text-[13px] text-white/70">Today</Text>
                <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1">
                  <View className={`h-1.5 w-1.5 rounded-full ${today?.clockIn && !today.clockOut ? "bg-emerald-400" : "bg-white/50"}`} />
                  <Text className="font-medium text-[11px] text-white">
                    {today?.clockIn ? (today.clockOut ? "Clocked out" : "On the clock") : "Not clocked in"}
                  </Text>
                </View>
              </View>
              {loading && !data ? (
                <Skeleton className="mt-4 h-9 w-32 bg-white/15" />
              ) : (
                <Text className="mt-3 font-bold text-[34px] leading-10 tracking-tight text-white">
                  {hoursLabel(today?.durationMinutes ?? 0)}
                </Text>
              )}
              <View className="mt-5 flex-row gap-6">
                <View>
                  <Text className="text-[11px] text-white/60">This month</Text>
                  <Text className="mt-0.5 font-semibold text-[15px] text-white">{hoursLabel(data?.totalMinutesThisMonth ?? 0)}</Text>
                </View>
                <View>
                  <Text className="text-[11px] text-white/60">Days present</Text>
                  <Text className="mt-0.5 font-semibold text-[15px] text-white">{data?.daysPresent ?? 0}</Text>
                </View>
                {data?.currentUser.role ? (
                  <View className="flex-1">
                    <Text className="text-[11px] text-white/60">Role</Text>
                    <Text numberOfLines={1} className="mt-0.5 font-semibold text-[15px] text-white">
                      {data.currentUser.role}
                    </Text>
                  </View>
                ) : null}
              </View>
            </LinearGradient>
          </View>

          {/* Quick actions */}
          <View className="mt-5 flex-row gap-3 px-5">
            {can("inbox:read") && (
              <QuickAction icon={InboxIcon} label="Inbox" count={inboxCounts.data?.unread} onPress={() => router.navigate("/inbox")} />
            )}
            {can("chat:read") && (
              <QuickAction icon={MessagesSquare} label="Chat" count={chatUnread.data?.total} onPress={() => router.navigate("/chat")} />
            )}
            {can("crm:read", "outreach:read") && (
              <QuickAction icon={TrendingUp} label="Pipeline" onPress={() => router.navigate("/crm")} />
            )}
          </View>

          <SectionTitle title="Overview" />
          <View className="gap-3 px-5">
            <View className="flex-row gap-3">
              <Stat icon={Users} label="Team members" value={String(data?.totalEmployees ?? "–")} hint={data?.newThisMonth ? `+${data.newThisMonth} this month` : undefined} tint="#6366F1" />
              <Stat icon={CheckCircle2} label="Open tasks" value={String(data?.pendingTasks ?? "–")} tint="#F59E0B" />
            </View>
            {data?.crm && (
              <View className="flex-row gap-3">
                <Stat icon={TrendingUp} label="Open pipeline" value={money(data.crm.openValue)} tint="#10B981" />
                <Stat icon={CalendarCheck} label="Weighted forecast" value={money(data.crm.weightedValue)} hint={`${data.crm.openCount} open deals`} tint="#0EA5E9" />
              </View>
            )}
          </View>

          {!!data?.pendingTasksList.length && (
            <>
              <SectionTitle title="Up next" />
              <Card className="mx-5">
                {data.pendingTasksList.map((t, i) => (
                  <View key={t.id} className={`flex-row items-center gap-3 px-4 py-3.5 ${i ? "border-t border-border" : ""}`}>
                    <View className="h-5 w-5 rounded-full border-2 border-border" />
                    <View className="flex-1">
                      <Text numberOfLines={1} className="font-medium text-[15px]">
                        {t.title}
                      </Text>
                      {(t.team || t.dueDate) && (
                        <Text variant="caption" className="mt-0.5">
                          {[t.team, t.dueDate && `Due ${new Date(t.dueDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </Text>
                      )}
                    </View>
                    <Clock size={14} color={colors.mutedForeground} />
                  </View>
                ))}
              </Card>
            </>
          )}

          {!!celebrations.length && (
            <>
              <SectionTitle title="Celebrations" />
              <Card className="mx-5">
                {celebrations.slice(0, 6).map((c, i) => (
                  <View key={`${c.kind}-${c.id}`} className={`flex-row items-center gap-3 px-4 py-3 ${i ? "border-t border-border" : ""}`}>
                    <Avatar name={c.fullName} size={36} />
                    <View className="flex-1">
                      <Text className="font-medium text-[15px]">{c.fullName}</Text>
                      <Text variant="caption" className="mt-0.5">
                        {c.kind === "birthday" ? "Birthday" : "Work anniversary"} · {c.isToday ? "Today" : `${c.day}th`}
                      </Text>
                    </View>
                    {c.kind === "birthday" ? <Cake size={18} color="#EC4899" /> : <PartyPopper size={18} color="#F59E0B" />}
                  </View>
                ))}
              </Card>
            </>
          )}

          {!!data?.recentHires.length && (
            <>
              <SectionTitle title="New joiners" />
              <View className="flex-row flex-wrap gap-3 px-5">
                {data.recentHires.slice(0, 4).map((h) => (
                  <Card key={h.id} className="w-[47.5%] items-center p-4">
                    <Avatar name={h.fullName} size={48} />
                    <Text numberOfLines={1} className="mt-3 font-semibold text-[14px]">
                      {h.fullName}
                    </Text>
                    <Text numberOfLines={1} variant="caption" className="mt-0.5">
                      {h.role || h.department || "Team"}
                    </Text>
                  </Card>
                ))}
              </View>
            </>
          )}
        </>
      )}
    </ScrollScreen>
  );
}
