import { useState } from "react";
import { Alert, View } from "react-native";
import { ClipboardCheck } from "lucide-react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { money, shortDate } from "@/lib/format";
import { success } from "@/lib/haptics";
import type { AttendanceRequest, LeaveRequest, ReimbursementClaim, RequestStatus } from "@/lib/types";
import { Avatar, BackButton, Badge, Button, Card, EmptyState, ErrorState, GlassHeader, ListSkeleton, ScrollScreen, Text } from "@/components/ui";

interface Item {
  key: string;
  kind: string;
  who: string;
  title: string;
  detail?: string | null;
  approve: () => void;
  reject: () => void;
}

/** Everything waiting on the signed-in person. Each source appears only with its permission. */
export default function ApprovalsScreen() {
  const { can } = useAuth();
  const leave = useApi<LeaveRequest[]>("/leave/requests", { enabled: can("leave:write") });
  const attendance = useApi<AttendanceRequest[]>("/attendance/requests", { enabled: can("attendance:write", "employees:read") });
  const claims = useApi<ReimbursementClaim[]>("/reimbursements/admin?status=pending", { enabled: can("payroll:write") });
  const [busy, setBusy] = useState<string | null>(null);
  const sources = [leave, attendance, claims];

  const run = async (key: string, action: () => Promise<unknown>, reload: () => Promise<void>) => {
    setBusy(key);
    try {
      await action();
      success();
      await reload();
    } catch (err) {
      Alert.alert("Couldn't update", err instanceof Error ? err.message : "Try again");
    } finally {
      setBusy(null);
    }
  };

  const confirmReject = (what: string, action: () => void) =>
    Alert.alert(`Reject ${what}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: action },
    ]);

  const decideLeave = (id: string, status: RequestStatus) => run(`leave-${id}`, () => api.put(`/leave/requests/${id}/action`, { status }), leave.reload);
  const decideAttendance = (id: string, status: RequestStatus) => run(`att-${id}`, () => api.put(`/attendance/requests/${id}`, { status }), attendance.reload);

  const items: Item[] = [
    ...(leave.data ?? [])
      .filter((r) => r.status === "Pending")
      .map((r) => ({
        key: `leave-${r.id}`,
        kind: "Leave",
        who: r.userName ?? "Someone",
        title: `${r.leaveTypeName} · ${shortDate(r.startDate)}${r.endDate !== r.startDate ? ` – ${shortDate(r.endDate)}` : ""} (${r.days} day${r.days === 1 ? "" : "s"})`,
        detail: r.reason,
        approve: () => void decideLeave(r.id, "Approved"),
        reject: () => confirmReject("this leave", () => void decideLeave(r.id, "Rejected")),
      })),
    ...(attendance.data ?? [])
      .filter((r) => r.status === "Pending")
      .map((r) => ({
        key: `att-${r.id}`,
        kind: "Attendance",
        who: r.userName ?? "Someone",
        title: `${r.type} · ${shortDate(String(r.date).slice(0, 10))}${r.requestedTime ? ` at ${r.requestedTime}` : ""}`,
        detail: r.reason,
        approve: () => void decideAttendance(r.id, "Approved"),
        reject: () => confirmReject("this request", () => void decideAttendance(r.id, "Rejected")),
      })),
    ...(claims.data ?? []).map((c) => ({
      key: `claim-${c.id}`,
      kind: "Reimbursement",
      who: c.employee?.fullName ?? "Someone",
      title: `${money(c.amount)} · ${c.category}`,
      detail: c.description,
      approve: () =>
        Alert.alert("Approve this claim?", "How should it be paid?", [
          { text: "Add to payslip", onPress: () => void run(`claim-${c.id}`, () => api.post(`/reimbursements/admin/${c.id}/approve`, { payout: "payslip" }), claims.reload) },
          { text: "Already paid directly", onPress: () => void run(`claim-${c.id}`, () => api.post(`/reimbursements/admin/${c.id}/approve`, { payout: "direct" }), claims.reload) },
          { text: "Cancel", style: "cancel" },
        ]),
      reject: () => confirmReject("this claim", () => void run(`claim-${c.id}`, () => api.post(`/reimbursements/admin/${c.id}/reject`, {}), claims.reload)),
    })),
  ];

  const loading = sources.some((s) => s.loading);
  const failed = sources.find((s) => s.error)?.error;

  return (
    <ScrollScreen
      detail
      refreshing={sources.some((s) => s.refreshing)}
      onRefresh={() => sources.forEach((s) => void s.refresh())}
      header={<GlassHeader left={<BackButton />} title="Approvals" subtitle={items.length ? `${items.length} waiting` : undefined} />}
    >
      {failed && !!items.length && (
        <Text className="mx-5 mt-3 text-[13px] text-destructive">Some requests couldn't load: {failed}</Text>
      )}
      {loading && !items.length ? (
        <ListSkeleton rows={4} />
      ) : failed && !items.length ? (
        <ErrorState message={failed} onRetry={() => sources.forEach((s) => void s.refresh())} />
      ) : !items.length ? (
        <EmptyState icon={ClipboardCheck} title="All clear" message="Nothing is waiting for your approval." />
      ) : (
        <View className="gap-3 px-4 pt-4">
          {items.map((item) => (
            <Card key={item.key} className="p-4">
              <View className="flex-row items-center gap-3">
                <Avatar name={item.who} size={38} />
                <Text numberOfLines={1} className="flex-1 font-semibold text-[15px]">
                  {item.who}
                </Text>
                <Badge label={item.kind} tone="brand" />
              </View>
              <Text className="mt-3 font-medium text-[14px]">{item.title}</Text>
              {!!item.detail && (
                <Text variant="caption" className="mt-1 text-[13px] leading-[18px]">
                  {item.detail}
                </Text>
              )}
              <View className="mt-3.5 flex-row gap-2.5">
                <Button className="flex-1" variant="secondary" title="Reject" disabled={busy === item.key} onPress={item.reject} />
                <Button className="flex-1" title="Approve" loading={busy === item.key} onPress={item.approve} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollScreen>
  );
}
