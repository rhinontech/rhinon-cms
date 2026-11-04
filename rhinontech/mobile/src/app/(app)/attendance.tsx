import { useState } from "react";
import { Alert, View } from "react-native";
import { CalendarCheck, Coffee, LogIn, LogOut } from "lucide-react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { lift, useTheme } from "@/lib/theme";
import { clockTime, hoursLabel, shortDate } from "@/lib/format";
import { success } from "@/lib/haptics";
import type { AttendanceDay, TeamToday } from "@/lib/types";
import { Avatar, BackButton, Badge, Button, Card, EmptyState, ErrorState, GlassHeader, ListSkeleton, ScrollScreen, SectionTitle, StatTile, Text, type Tone } from "@/components/ui";

const DAY_TONE: Record<string, Tone> = { present: "success", absent: "danger", leave: "brand", holiday: "brand", weekend: "neutral" };
const label = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Super admins don't clock in (the API refuses them), so they get the team's day. */
function TeamView() {
  const { data, error, loading, refreshing, refresh } = useApi<TeamToday>("/attendance/team/today", { pollMs: 60_000 });
  return (
    <ScrollScreen detail refreshing={refreshing} onRefresh={refresh} header={<GlassHeader left={<BackButton />} title="Attendance" subtitle="Team today" />}>
      {loading && !data ? (
        <ListSkeleton />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <>
          <View className="mx-5 mt-4 flex-row gap-3">
            <StatTile icon={LogIn} label="Present" value={String(data?.summary.present ?? 0)} />
            <StatTile icon={CalendarCheck} label="Absent" value={String(data?.summary.absent ?? 0)} />
            <StatTile icon={Coffee} label="On break" value={String(data?.summary.onBreak ?? 0)} />
          </View>
          <SectionTitle title="Everyone" />
          <Card className="mx-5 overflow-hidden">
            {data?.employees.map((e, i) => (
              <View key={e.userId} className={`flex-row items-center gap-3 px-4 py-3 ${i ? "border-t border-border" : ""}`}>
                <Avatar name={e.fullName} size={38} />
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-medium text-[15px]">
                    {e.fullName}
                  </Text>
                  <Text variant="caption">{e.attendance.clockIn ? `${clockTime(e.attendance.clockIn)} – ${e.attendance.clockOut ? clockTime(e.attendance.clockOut) : "now"} · ${hoursLabel(e.attendance.durationMinutes)}` : e.department ?? "Not clocked in"}</Text>
                </View>
                <Badge label={e.attendance.onBreak ? "On break" : label(e.attendance.status)} tone={e.attendance.onBreak ? "warning" : DAY_TONE[e.attendance.status] ?? "neutral"} />
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollScreen>
  );
}

function MyView() {
  const { colors } = useTheme();
  const today = useApi<AttendanceDay>("/attendance/today", { pollMs: 60_000 });
  const month = useApi<AttendanceDay[]>("/attendance");
  const [busy, setBusy] = useState(false);
  const t = today.data;
  const onBreak = !!t?.breaks?.length && !t.breaks[t.breaks.length - 1].end;
  const working = !!t?.clockIn && !t.clockOut;

  const act = async (path: string) => {
    setBusy(true);
    try {
      await api.post(`/attendance/${path}`);
      success();
      await Promise.all([today.reload(), month.reload()]);
    } catch (err) {
      Alert.alert("Couldn't update attendance", err instanceof Error ? err.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  const clockOut = () =>
    Alert.alert("Clock out for today?", "You can only clock in once a day.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clock out", style: "destructive", onPress: () => void act("clock-out") },
    ]);

  return (
    <ScrollScreen
      detail
      refreshing={today.refreshing}
      onRefresh={() => {
        void today.refresh();
        void month.refresh();
      }}
      header={<GlassHeader left={<BackButton />} title="Attendance" />}
    >
      {today.error && !t ? (
        <ErrorState message={today.error} onRetry={today.refresh} />
      ) : (
        <>
          <View className="mx-5 mt-4 rounded-3xl p-5" style={[{ backgroundColor: colors.glassPanel, borderWidth: 1, borderColor: colors.glassEdge }, lift(colors.shadow, "panel")]}>
            <View className="flex-row items-center justify-between">
              <Text variant="label" className="text-muted-foreground">
                Time worked today
              </Text>
              <Badge label={onBreak ? "On break" : working ? "Clocked in" : t?.clockOut ? "Clocked out" : "Not clocked in"} tone={onBreak ? "warning" : working ? "success" : "neutral"} />
            </View>
            <Text className="mt-2 font-bold text-[38px] leading-[44px] tracking-tight">{hoursLabel(t?.durationMinutes ?? 0)}</Text>
            <Text variant="caption" className="mt-1 text-[13px]">
              {t?.clockIn ? `In at ${clockTime(t.clockIn)}${t.clockOut ? ` · Out at ${clockTime(t.clockOut)}` : ""}` : "You haven't clocked in yet."}
            </Text>
            {!today.loading && !t?.clockOut && (
              <View className="mt-4 flex-row gap-3">
                {!t?.clockIn ? (
                  <Button className="flex-1" title="Clock in" icon={<LogIn size={17} color={colors.primaryForeground} />} loading={busy} onPress={() => act("clock-in")} />
                ) : (
                  <>
                    <Button className="flex-1" variant="secondary" title={onBreak ? "End break" : "Break"} icon={<Coffee size={17} color={colors.foreground} />} disabled={busy} onPress={() => act(onBreak ? "break-end" : "break-start")} />
                    <Button className="flex-1" title="Clock out" icon={<LogOut size={17} color={colors.primaryForeground} />} disabled={busy} onPress={clockOut} />
                  </>
                )}
              </View>
            )}
          </View>

          <SectionTitle title="This month" />
          {month.loading && !month.data ? (
            <ListSkeleton rows={4} />
          ) : !month.data?.length ? (
            <EmptyState icon={CalendarCheck} title={month.error ? "Couldn't load history" : "No days yet"} message={month.error ?? undefined} />
          ) : (
            <Card className="mx-5 overflow-hidden">
              {[...month.data].reverse().map((d, i) => (
                <View key={d.date} className={`flex-row items-center gap-3 px-4 py-3 ${i ? "border-t border-border" : ""}`}>
                  <View className="flex-1">
                    <Text className="font-medium text-[15px]">{shortDate(String(d.date).slice(0, 10))}</Text>
                    {!!d.clockIn && <Text variant="caption">{`${clockTime(d.clockIn)} – ${d.clockOut ? clockTime(d.clockOut) : "now"} · ${hoursLabel(d.durationMinutes)}`}</Text>}
                  </View>
                  <Badge label={label(d.status)} tone={DAY_TONE[d.status] ?? "neutral"} />
                </View>
              ))}
            </Card>
          )}
        </>
      )}
    </ScrollScreen>
  );
}

export default function AttendanceScreen() {
  const { me } = useAuth();
  return me?.roleSlug === "superadmin" ? <TeamView /> : <MyView />;
}
