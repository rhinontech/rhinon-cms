import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, View } from "react-native";
import { CalendarDays, Plus, X } from "lucide-react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { shortDate } from "@/lib/format";
import { success } from "@/lib/haptics";
import type { LeaveBalance, LeaveRequest } from "@/lib/types";
import { Backdrop, BackButton, Badge, Button, Card, Chips, DateField, EmptyState, ErrorState, GlassHeader, HeaderButton, Input, ListSkeleton, ScrollScreen, SectionTitle, Text, type Tone } from "@/components/ui";

const STATUS_TONE: Record<string, Tone> = { Pending: "warning", Approved: "success", Rejected: "danger" };

function ApplySheet({ balances, onClose, onDone }: { balances: LeaveBalance[]; onClose: () => void; onDone: () => void }) {
  const [typeId, setTypeId] = useState(balances[0]?.leaveTypeId ?? "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.post("/leave/requests", { leaveTypeId: typeId, startDate: start, endDate: end, reason: reason.trim() });
      success();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <Backdrop />
        <View className="flex-row items-center justify-between px-5 py-4">
          <Text variant="title">Apply for leave</Text>
          <HeaderButton icon={X} label="Close" onPress={onClose} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, gap: 16, paddingBottom: 40 }}>
          <View className="gap-1.5">
            <Text variant="label">Type</Text>
            <Chips options={balances.map((b) => ({ value: b.leaveTypeId, label: `${b.name} (${b.remaining})` }))} value={typeId} onChange={setTypeId} />
          </View>
          <View className="flex-row gap-3">
            <DateField
              label="From"
              value={start}
              onChange={(v) => {
                setStart(v);
                if (!end || end < v) setEnd(v);
              }}
            />
            <DateField label="To" value={end} onChange={setEnd} min={start || undefined} />
          </View>
          <Input label="Reason" value={reason} onChangeText={setReason} placeholder="Optional" />
          {error && (
            <View className="rounded-xl bg-destructive/10 px-3.5 py-3">
              <Text className="text-[13px] text-destructive">{error}</Text>
            </View>
          )}
          <Button title="Send request" onPress={submit} loading={busy} disabled={!typeId || !start || !end} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function LeaveScreen() {
  const { me } = useAuth();
  const { colors } = useTheme();
  const balance = useApi<LeaveBalance[]>("/leave/balance");
  const requests = useApi<LeaveRequest[]>("/leave/requests");
  const [applying, setApplying] = useState(false);
  const mine = (requests.data ?? []).filter((r) => r.userId === me?.id);

  const cancel = (r: LeaveRequest) =>
    Alert.alert("Cancel this request?", `${r.leaveTypeName} · ${shortDate(r.startDate)}`, [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel request",
        style: "destructive",
        onPress: () =>
          void api.delete(`/leave/requests/${r.id}`).then(
            () => requests.reload(),
            (err) => Alert.alert("Couldn't cancel", err instanceof Error ? err.message : "Try again")
          ),
      },
    ]);

  return (
    <ScrollScreen
      detail
      refreshing={requests.refreshing}
      onRefresh={() => {
        void balance.refresh();
        void requests.refresh();
      }}
      header={<GlassHeader left={<BackButton />} title="Leave" right={balance.data?.length ? <HeaderButton icon={Plus} label="Apply for leave" onPress={() => setApplying(true)} /> : undefined} />}
    >
      <SectionTitle title="Balance" />
      {balance.loading && !balance.data ? (
        <ListSkeleton rows={2} />
      ) : balance.error && !balance.data ? (
        <ErrorState message={balance.error} onRetry={balance.refresh} />
      ) : balance.data?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4, gap: 12 }}>
          {balance.data.map((b) => (
            <Card key={b.leaveTypeId} className="w-40 p-4">
              <Text numberOfLines={1} variant="caption" className="text-[13px]">
                {b.name}
              </Text>
              <Text className="mt-1 font-bold text-[26px] leading-8 tracking-tight">{b.remaining}</Text>
              <Text variant="caption">
                of {b.allocated} days left
              </Text>
              <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <View className="h-1.5 rounded-full" style={{ width: `${b.allocated ? Math.min(100, (b.remaining / b.allocated) * 100) : 0}%`, backgroundColor: colors.brand }} />
              </View>
            </Card>
          ))}
        </ScrollView>
      ) : (
        <Text variant="caption" className="px-5 text-[13px]">
          No leave types are set up yet. Add them in the web panel.
        </Text>
      )}

      <SectionTitle title="My requests" />
      {requests.loading && !requests.data ? (
        <ListSkeleton rows={3} />
      ) : requests.error && !requests.data ? (
        <ErrorState message={requests.error} onRetry={requests.refresh} />
      ) : mine.length ? (
        <Card className="mx-5 overflow-hidden">
          {mine.map((r, i) => (
            <Pressable key={r.id} disabled={r.status !== "Pending"} onPress={() => cancel(r)} className={`flex-row items-center gap-3 px-4 py-3 active:opacity-60 ${i ? "border-t border-border" : ""}`}>
              <View className="flex-1">
                <Text numberOfLines={1} className="font-medium text-[15px]">
                  {r.leaveTypeName}
                </Text>
                <Text variant="caption" className="mt-0.5">
                  {shortDate(r.startDate)}
                  {r.endDate !== r.startDate ? ` – ${shortDate(r.endDate)}` : ""} · {r.days} day{r.days === 1 ? "" : "s"}
                </Text>
                {!!r.managerNote && (
                  <Text variant="caption" className="mt-0.5">
                    {r.managerNote}
                  </Text>
                )}
              </View>
              <Badge label={r.status} tone={STATUS_TONE[r.status] ?? "neutral"} />
            </Pressable>
          ))}
        </Card>
      ) : (
        <EmptyState icon={CalendarDays} title="No requests yet" message="Tap + to apply for leave." />
      )}

      {applying && balance.data && (
        <ApplySheet
          balances={balance.data}
          onClose={() => setApplying(false)}
          onDone={() => {
            setApplying(false);
            void requests.reload();
          }}
        />
      )}
    </ScrollScreen>
  );
}
