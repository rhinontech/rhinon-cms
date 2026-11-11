import { View, Text, Span, Pressable, TextInput, Link } from "@/components/rn";
import { Check, ChevronRight } from "@/components/icons";
import { useState } from "react";
import { PROJECTS, projectTone, type Priority, type Task, type TaskStatus } from "@/lib/mock-data";
import { actions } from "@/lib/store";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { Button, Chip, Field, Sheet, inputClass, stagger } from "./ui";
export const PRIORITY_TONE: Record<Priority, Tone> = {
  High: "coral",
  Medium: "sun",
  Low: "sky",
};
const PRIORITY_RING: Record<Priority, string> = {
  High: "border-coral",
  Medium: "border-sun",
  Low: "border-sky",
};
export const STATUS_TONE: Record<TaskStatus, Tone> = {
  Pending: "ink",
  "In progress": "cobalt",
  Done: "leaf",
};

/** One task. The whole row opens the detail; the circle on the left completes it. */
export function TaskRow({ task, index = 0 }: { task: Task; index?: number }) {
  const done = task.status === "Done";
  const subDone = task.subtasks.filter((s) => s.done).length;
  return (
    <View
      className="press relative animate-rise rounded-2xl border border-line/70 bg-card p-3.5"
      style={stagger(index)}
    >
      <Link
        to="/work/$taskId"
        params={{
          taskId: task.id,
        }}
        aria-label={task.title}
        className="absolute inset-0 z-0 rounded-2xl"
      />
      <View className="pointer-events-none relative z-10 flex items-start gap-3">
        <Pressable
          accessibilityLabel={done ? "Mark as not done" : "Mark as done"}
          onPress={() => actions.toggleTask(task.id)}
          className={cn(
            "pointer-events-auto mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors",
            done
              ? "border-leaf bg-leaf text-leaf-foreground"
              : cn("bg-transparent", PRIORITY_RING[task.priority]),
          )}
        >
          {done ? <Check size={16} strokeWidth={3} className="animate-pop" /> : null}
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-[16px] font-semibold leading-snug">
            <Span className="strike">{task.title}</Span>
          </Text>
          <View className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink/60">
            <View className="inline-flex items-center gap-1.5">
              <View className={cn("size-2 rounded-full", TONES[projectTone(task.project)].dot)} />
              {task.project}
            </View>
            <Span
              className={cn(
                "font-mono text-[11px] uppercase tracking-[0.08em]",
                task.group === "overdue" && !done && "font-medium text-coral-deep",
              )}
            >
              {task.due}
            </Span>
            {task.subtasks.length > 0 ? (
              <Span className="font-mono text-[11px]">
                {subDone}/{task.subtasks.length}
              </Span>
            ) : null}
          </View>
        </View>
        <ChevronRight size={18} className="mt-1 shrink-0 text-ink/30" />
      </View>
    </View>
  );
}
type When = "today" | "tomorrow" | "week";
export function AddTaskSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [project, setProject] = useState(PROJECTS[0]?.name ?? "");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [when, setWhen] = useState<When>("today");
  const submit = () => {
    if (!title.trim()) return;
    actions.addTask({
      title: title.trim(),
      project,
      priority,
      due: when === "today" ? "Today · EOD" : when === "tomorrow" ? "Thu 12 Nov" : "This week",
      group: when === "today" ? "today" : "week",
    });
    setTitle("");
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} eyebrow="New task" title="What needs doing?">
      <View className="space-y-5">
        <Field label="Title">
          <TextInput
            className={inputClass}
            value={title}
            onChangeText={(text) => setTitle(text)}
            onSubmitEditing={() => submit()}
            placeholder="e.g. Review the signature pad flow"
            autoFocus
          />
        </Field>
        <Field label="Project">
          <View className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {PROJECTS.map((p) => (
              <Chip
                key={p.id}
                tone={p.tone}
                active={project === p.name}
                onClick={() => setProject(p.name)}
              >
                {p.name}
              </Chip>
            ))}
          </View>
        </Field>
        <Field label="Priority">
          <View className="flex gap-2">
            {(["High", "Medium", "Low"] as Priority[]).map((p) => (
              <Chip
                key={p}
                tone={PRIORITY_TONE[p]}
                active={priority === p}
                onClick={() => setPriority(p)}
              >
                {p}
              </Chip>
            ))}
          </View>
        </Field>
        <Field label="Due">
          <View className="flex gap-2">
            {(
              [
                ["today", "Today"],
                ["tomorrow", "Tomorrow"],
                ["week", "This week"],
              ] as [When, string][]
            ).map(([v, l]) => (
              <Chip key={v} active={when === v} onClick={() => setWhen(v)}>
                {l}
              </Chip>
            ))}
          </View>
        </Field>
        <Button tone="ink" onClick={submit} disabled={!title.trim()}>
          Add task
        </Button>
      </View>
    </Sheet>
  );
}
