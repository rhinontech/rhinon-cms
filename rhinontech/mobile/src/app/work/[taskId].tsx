import { loadTaskComments, useLoad } from "@/lib/live";
import { useRev } from "@/lib/store";
import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { useLocalSearchParams } from "expo-router";
import { MoreHorizontal, Plus, Send } from "@/components/icons";
import { useState } from "react";
import {
  Avatar,
  AvatarStack,
  Badge,
  Display,
  Empty,
  Eyebrow,
  IconButton,
  Meta,
  ProgressBar,
  Screen,
  SectionLabel,
  TopBar,
  inputClass,
} from "@/components/rhinon/ui";
import { PRIORITY_TONE, STATUS_TONE } from "@/components/rhinon/work";
import { PROJECTS, nameOf, projectTone, type TaskStatus } from "@/lib/mock-data";
import { actions, useApp } from "@/lib/store";
import { TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { Check } from "@/components/icons";
const STATUSES: TaskStatus[] = ["Pending", "In progress", "Done"];
export default function TaskDetail() {
  useRev();
  const { taskId } = useLocalSearchParams<{
    taskId: string;
  }>();
  useLoad(loadTaskComments, taskId);
  const task = useApp((s) => s.tasks.find((t) => t.id === taskId));
  const [comment, setComment] = useState("");
  const [sub, setSub] = useState("");
  if (!task) {
    return (
      <Screen>
        <TopBar title="Task" fallback="/work" />
        <Empty
          title="Task not found"
          body="It may have been deleted or you may not have access."
          tone="cobalt"
        />
      </Screen>
    );
  }
  const tone = projectTone(task.project);
  const project = PROJECTS.find((p) => p.name === task.project);
  const done = task.subtasks.filter((s) => s.done).length;
  const send = () => {
    if (!comment.trim()) return;
    actions.addComment(task.id, comment.trim());
    setComment("");
  };
  const addSub = () => {
    if (!sub.trim()) return;
    actions.addSubtask(task.id, sub.trim());
    setSub("");
  };
  return (
    <Screen>
      <TopBar
        title="Task"
        fallback="/work"
        right={<IconButton icon={MoreHorizontal} label="More" />}
      />

      <View className="flex flex-wrap items-center gap-2">
        <Badge tone={tone}>{task.project}</Badge>
        <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
        {task.tags.map((t) => (
          <Badge key={t} tone="ink" dot={false}>
            #{t}
          </Badge>
        ))}
      </View>

      <Display size="xl" className="mt-4">
        {task.title}
      </Display>

      <View accessibilityLabel="Status" className="mt-6 flex rounded-full bg-paper-deep p-1">
        {STATUSES.map((s) => {
          const active = task.status === s;
          return (
            <Pressable
              key={s}
              onPress={() => actions.setTaskStatus(task.id, s)}
              className={cn(
                "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full font-mono text-[11px] font-medium uppercase tracking-[0.12em] transition-all duration-200",
                active ? cn(TONES[STATUS_TONE[s]].solid, "shadow-sm") : "text-ink/60",
              )}
            >
              {s === "Done" && active ? <Check size={14} strokeWidth={3} /> : null}
              {s}
            </Pressable>
          );
        })}
      </View>

      <View className="mt-4 grid grid-cols-2 gap-2.5">
        <Meta label="Assignee">
          <View className="flex items-center gap-2">
            <Avatar name={nameOf(task.assignee)} size={26} />
            {nameOf(task.assignee).split(" ")[0]}
          </View>
        </Meta>
        <Meta label="Due">
          <Span
            className={cn(task.group === "overdue" && task.status !== "Done" && "text-coral-deep")}
          >
            {task.due}
          </Span>
        </Meta>
        <Meta label="Estimate">{task.est} h</Meta>
        <Meta label="Team">
          {project ? <AvatarStack names={project.members.map(nameOf)} size={24} max={3} /> : "—"}
        </Meta>
      </View>

      {task.description ? (
        <View className="mt-7">
          <SectionLabel className="mb-3">Description</SectionLabel>
          <Text className="text-[16px] leading-relaxed text-ink/80">{task.description}</Text>
        </View>
      ) : null}

      <View className="mt-8">
        <SectionLabel
          className="mb-3"
          right={
            <Span className="font-mono text-[11px] text-ink/50">
              {done}/{task.subtasks.length}
            </Span>
          }
        >
          Subtasks
        </SectionLabel>
        {task.subtasks.length > 0 ? (
          <ProgressBar value={done / task.subtasks.length} tone="cobalt" className="mb-3" />
        ) : null}
        <View className="space-y-1">
          {task.subtasks.map((s) => (
            <View key={s.id}>
              <Pressable
                onPress={() => actions.toggleSubtask(task.id, s.id)}
                className="flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left"
              >
                <View
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors",
                    s.done ? "border-cobalt bg-cobalt text-cobalt-foreground" : "border-ink/25",
                  )}
                >
                  {s.done ? <Check size={14} strokeWidth={3.2} className="animate-pop" /> : null}
                </View>
                <Span className="text-[15.5px]">
                  <Span className="strike">{s.title}</Span>
                </Span>
              </Pressable>
            </View>
          ))}
        </View>
        <View className="mt-2 flex items-center gap-2">
          <Plus size={18} className="ml-1 shrink-0 text-ink/40" />
          <TextInput
            className="h-11 w-full bg-transparent text-[15.5px] outline-none placeholder:text-ink/35"
            placeholder="Add a subtask"
            value={sub}
            onChangeText={(text) => setSub(text)}
            onSubmitEditing={() => addSub()}
          />
        </View>
      </View>

      <View className="mt-8">
        <SectionLabel
          className="mb-4"
          right={<Span className="font-mono text-[11px] text-ink/50">{task.comments.length}</Span>}
        >
          Comments
        </SectionLabel>
        {task.comments.length === 0 ? (
          <Text className="rounded-2xl bg-paper-deep px-4 py-5 text-center text-[14px] text-ink/55">
            No comments yet. Start the thread below.
          </Text>
        ) : (
          <View className="space-y-4">
            {task.comments.map((c) => (
              <View key={c.id} className="flex gap-3">
                <Avatar name={nameOf(c.by)} size={36} />
                <View className="min-w-0 flex-1">
                  <View className="flex items-baseline gap-2">
                    <Span className="text-[14.5px] font-semibold">{nameOf(c.by)}</Span>
                    <Eyebrow tone="muted" className="!text-[10px] !tracking-[0.12em]">
                      {c.at}
                    </Eyebrow>
                  </View>
                  <Text className="mt-1 text-[15px] leading-relaxed text-ink/85">
                    {c.text.split(/(@\w+)/g).map((part, i) =>
                      part.startsWith("@") ? (
                        <Span key={i} className="font-semibold text-cobalt-deep">
                          {part}
                        </Span>
                      ) : (
                        part
                      ),
                    )}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="sticky bottom-0 z-20 -mx-5 mt-auto flex items-center gap-2 bg-gradient-to-t from-paper from-70% to-transparent px-5 pb-1 pt-8">
        <TextInput
          className={cn(inputClass, "rounded-full py-3.5 pl-5")}
          placeholder="Add a comment…"
          value={comment}
          onChangeText={(text) => setComment(text)}
          onSubmitEditing={() => send()}
        />
        <Pressable
          accessibilityLabel="Send comment"
          onPress={send}
          disabled={!comment.trim()}
          className="press grid size-[52px] shrink-0 place-items-center rounded-full bg-ink text-paper disabled:opacity-30"
        >
          <Send size={20} strokeWidth={2.2} />
        </Pressable>
      </View>
    </Screen>
  );
}
