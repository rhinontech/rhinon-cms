import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowUp, Check, Pencil, Plus, Trash2 } from "lucide-react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { fullDateTime, htmlToText, shortDate } from "@/lib/format";
import { success, tap } from "@/lib/haptics";
import type { Task, TaskComment, WorkflowStatus } from "@/lib/types";
import { Avatar, BackButton, Backdrop, Card, Chips, ComposerTray, ErrorState, GlassHeader, HeaderButton, Input, SectionTitle, Spinner, Text } from "@/components/ui";

export default function TaskScreen() {
  const { id, projectId } = useLocalSearchParams<{ id: string; projectId?: string }>();
  const { colors } = useTheme();
  // There is no single-task route: a task is read from its project's list, or from your own.
  const list = useApi<Task[]>(projectId ? `/tasks?scope=all&projectId=${projectId}` : "/tasks?scope=my");
  const statuses = useApi<WorkflowStatus[]>(`/workflow/statuses${projectId ? `?projectId=${projectId}` : ""}`);
  const comments = useApi<TaskComment[]>(`/tasks/${id}/comments`, { pollMs: 30_000 });
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [subitem, setSubitem] = useState("");
  const task = list.data?.find((t) => t.id === id);

  const fail = (title: string, err: unknown) => Alert.alert(title, err instanceof Error ? err.message : "Try again");

  const move = async (statusId: string) => {
    if (statusId === task?.statusId) return;
    try {
      await api.put(`/tasks/${id}`, { statusId });
      success();
      await list.reload();
    } catch (err) {
      fail("Couldn't change status", err);
    }
  };

  const toggle = async (subId: string, done: boolean) => {
    tap();
    try {
      await api.put(`/tasks/${id}/subtasks/${subId}`, { done });
      await list.reload();
    } catch (err) {
      fail("Couldn't update", err);
    }
  };

  const addSubitem = async () => {
    const title = subitem.trim();
    if (!title) return;
    setSubitem("");
    try {
      await api.post(`/tasks/${id}/subtasks`, { title });
      await list.reload();
    } catch (err) {
      setSubitem(title);
      fail("Couldn't add subitem", err);
    }
  };

  const remove = () =>
    Alert.alert("Delete this task?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          void api.delete(`/tasks/${id}`).then(
            () => router.back(),
            (err) => fail("Couldn't delete", err)
          ),
      },
    ]);

  const send = async () => {
    setSending(true);
    try {
      await api.post(`/tasks/${id}/comments`, { body: draft.trim() });
      setDraft("");
      await comments.reload();
    } catch (err) {
      fail("Comment not sent", err);
    } finally {
      setSending(false);
    }
  };

  const header = (
    <GlassHeader
      left={<BackButton />}
      title="Task"
      subtitle={task?.project?.name}
      right={
        task ? (
          <View className="flex-row gap-2">
            <HeaderButton icon={Pencil} label="Edit task" onPress={() => router.push({ pathname: "/work/task/form", params: { id, projectId: projectId ?? "" } })} />
            <HeaderButton icon={Trash2} label="Delete task" color={colors.destructive} onPress={remove} />
          </View>
        ) : undefined
      }
    />
  );
  if (!task) {
    return (
      <View className="flex-1 bg-background">
        <Backdrop />
        {header}
        {list.loading ? <Spinner /> : <ErrorState message={list.error ?? "This task isn't available to you any more."} onRetry={list.refresh} />}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <Backdrop />
      {header}
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardDismissMode="interactive">
        <View className="px-5 pt-4">
          <Text variant="title">{task.title}</Text>
          <Text variant="caption" className="mt-1 text-[13px]">
            {[task.assignee?.fullName, task.dueDate && `Due ${shortDate(task.dueDate)}`, task.priority].filter(Boolean).join(" · ")}
          </Text>
          {/* Web descriptions are rich text: shown as plain text, never rendered as HTML. */}
          {!!(task.descriptionHtml || task.description) && <Text className="mt-3 leading-[22px]">{htmlToText(task.descriptionHtml) || task.description}</Text>}
        </View>

        {!!statuses.data?.length && (
          <>
            <SectionTitle title="Status" />
            <View className="px-5">
              <Chips options={statuses.data.map((s) => ({ value: s.id, label: s.name }))} value={task.statusId ?? ""} onChange={move} />
            </View>
          </>
        )}

        <SectionTitle title="Subitems" />
        <Card className="mx-5 overflow-hidden">
          {task.subtasks?.map((s, i) => (
            <Pressable key={s.id} accessibilityRole="checkbox" accessibilityState={{ checked: s.done }} onPress={() => toggle(s.id, !s.done)} className={`flex-row items-center gap-3 px-4 py-3 ${i ? "border-t border-border" : ""}`}>
              <View className={`h-5 w-5 items-center justify-center rounded-full ${s.done ? "bg-brand" : "border-2 border-border"}`}>{s.done && <Check size={13} color={colors.brandForeground} strokeWidth={3} />}</View>
              <Text className={`flex-1 text-[15px] ${s.done ? "text-muted-foreground line-through" : ""}`}>{s.title}</Text>
            </Pressable>
          ))}
          <View className={`flex-row items-center gap-2 p-2 ${task.subtasks?.length ? "border-t border-border" : ""}`}>
            <Input className="flex-1" value={subitem} onChangeText={setSubitem} placeholder="Add a subitem" returnKeyType="done" onSubmitEditing={addSubitem} />
            <HeaderButton icon={Plus} label="Add subitem" onPress={addSubitem} />
          </View>
        </Card>

        <SectionTitle title="Comments" />
        <View className="gap-2.5 px-5">
          {comments.data?.length ? (
            comments.data.map((c) => (
              <Card key={c.id} className="flex-row gap-3 p-3.5">
                <Avatar name={c.author?.fullName} size={32} />
                <View className="flex-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text numberOfLines={1} className="flex-1 font-medium text-[14px]">
                      {c.author?.fullName ?? "Someone"}
                    </Text>
                    <Text variant="caption">{fullDateTime(c.createdAt)}</Text>
                  </View>
                  <Text selectable className="mt-1 text-[14px] leading-5">
                    {c.body}
                  </Text>
                </View>
              </Card>
            ))
          ) : (
            <Text variant="caption" className="text-[13px]">
              {comments.loading ? "Loading…" : comments.error ?? "No comments yet."}
            </Text>
          )}
        </View>
      </ScrollView>

      <ComposerTray>
        <View className="flex-row items-end gap-2 rounded-3xl border border-border bg-card py-1.5 pl-4 pr-1.5">
          <TextInput value={draft} onChangeText={setDraft} placeholder="Write a comment…" placeholderTextColor={colors.mutedForeground} multiline className="max-h-32 flex-1 py-2 font-sans text-[15px] text-foreground" />
          <Pressable accessibilityRole="button" accessibilityLabel="Send comment" disabled={!draft.trim() || sending} onPress={send} className="active:opacity-80">
            <View className={`h-[38px] w-[38px] items-center justify-center rounded-full ${draft.trim() ? "bg-primary" : "bg-muted"}`}>
              <ArrowUp size={19} color={draft.trim() ? colors.primaryForeground : colors.mutedForeground} />
            </View>
          </Pressable>
        </View>
      </ComposerTray>
    </KeyboardAvoidingView>
  );
}
