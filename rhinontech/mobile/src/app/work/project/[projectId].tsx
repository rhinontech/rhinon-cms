import { useRev } from "@/lib/store";
import { View, Text, Span, Pressable, Link } from "@/components/rn";
import { useLocalSearchParams } from "expo-router";
import { ChevronRight, Upload } from "@/components/icons";
import { useState } from "react";
import { AttachmentRow, AttachSheet, PreviewSheet } from "@/components/rhinon/attach";
import { MonthGrid } from "@/components/rhinon/time";
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Chip,
  Display,
  Empty,
  Eyebrow,
  ProgressBar,
  Screen,
  TopBar,
  stagger,
} from "@/components/rhinon/ui";
import { PRIORITY_TONE, TaskRow } from "@/components/rhinon/work";
import { MONTH_LONG } from "@/lib/format";
import { PROJECTS, TODAY, nameOf, type Task, type TaskStatus } from "@/lib/mock-data";
import { PROJECT_FILES, dueDay, type Attachment } from "@/lib/mock-more";
import { actions, useApp } from "@/lib/store";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
type View = "board" | "list" | "calendar" | "files" | "requests";
const COLUMNS: {
  status: TaskStatus;
  tone: Tone;
}[] = [
  {
    status: "Pending",
    tone: "sun",
  },
  {
    status: "In progress",
    tone: "cobalt",
  },
  {
    status: "Done",
    tone: "leaf",
  },
];
function BoardCard({ task, index }: { task: Task; index: number }) {
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
      <View className="pointer-events-none relative z-10">
        <Text className="text-[15px] font-semibold leading-snug">{task.title}</Text>
        <View className="mt-2.5 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink/55">
          <View className={cn("size-2 rounded-full", TONES[PRIORITY_TONE[task.priority]].dot)} />
          {task.priority}
          <Span className="text-ink/30">·</Span>
          <Span
            className={cn(task.group === "overdue" && task.status !== "Done" && "text-coral-deep")}
          >
            {task.due}
          </Span>
        </View>
        <View className="mt-3 flex items-center justify-between">
          <Avatar name={nameOf(task.assignee)} size={26} />
          {task.status !== "Done" ? (
            <Pressable
              accessibilityLabel={`Move “${task.title}” to the next column`}
              onPress={() => actions.advanceTask(task.id)}
              className="press pointer-events-auto grid size-9 place-items-center rounded-full border border-ink/15 bg-paper"
            >
              <ChevronRight size={18} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
export default function ProjectPage() {
  useRev();
  const { projectId } = useLocalSearchParams<{
    projectId: string;
  }>();
  const project = PROJECTS.find((p) => p.id === projectId);
  const tasks = useApp((s) => s.tasks);
  const requests = useApp((s) => s.clientRequests);
  const [view, setView] = useState<View>("board");
  const [day, setDay] = useState<string>(TODAY.iso);
  const [extra, setExtra] = useState<
    (Attachment & {
      by: string;
      at: string;
    })[]
  >([]);
  const [attaching, setAttaching] = useState(false);
  const [preview, setPreview] = useState<Attachment | null>(null);
  if (!project) {
    return (
      <Screen>
        <TopBar title="Project" fallback="/work" />
        <Empty
          title="Project not found"
          body="It may be private to a team you aren't in."
          tone="cobalt"
        />
      </Screen>
    );
  }
  const mine = tasks.filter((t) => t.project === project.name);
  const reqs = requests.filter((r) => r.projectId === project.id);
  const open = reqs.filter((r) => r.status === "New").length;
  const files = [...extra, ...(PROJECT_FILES[project.id] ?? [])];
  const light = project.tone === "sun" || project.tone === "rose" || project.tone === "sky";
  const marks = Object.fromEntries(
    mine.map((t) => [dueDay(t.due) ?? 0, "present" as const]).filter(([d]) => d !== 0),
  ) as Record<number, "present">;
  const selected = Number(day.slice(8));
  const onDay = mine.filter((t) => dueDay(t.due) === selected);
  return (
    <Screen>
      <TopBar title="Project" fallback="/work" />

      <View className="animate-rise">
        <Badge tone={project.tone}>{project.status}</Badge>
        <Display size="xl" className="mt-3">
          {project.name}
        </Display>
      </View>

      <View
        className={cn("mt-5 animate-rise rounded-3xl p-5", TONES[project.tone].solid)}
        style={stagger(1)}
      >
        <View className="flex items-end justify-between">
          <Text className="font-display text-[length:calc(72px*var(--ds))] leading-[0.8]">
            {Math.round(project.progress * 100)}
            <Span className="text-[length:calc(36px*var(--ds))] opacity-70">%</Span>
          </Text>
          <Text className="pb-1 text-right font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] opacity-90">
            {mine.length} tasks
            {"\n"}
            due {project.due}
          </Text>
        </View>
        <ProgressBar
          value={project.progress}
          tone={light ? "ink" : "paper"}
          track={light ? "bg-ink/15" : "bg-paper/25"}
          className="mt-4"
        />
        <View className="mt-4 flex items-center justify-between">
          <AvatarStack
            names={project.members.map(nameOf)}
            size={28}
            max={4}
            ring={TONES[project.tone].border}
          />
          <Span className="text-[13px] opacity-90">Contact · {project.contact}</Span>
        </View>
      </View>

      <View className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {(
          [
            ["board", "Board"],
            ["list", "List"],
            ["calendar", "Calendar"],
            ["files", "Files"],
            ["requests", "Requests"],
          ] as [View, string][]
        ).map(([v, l]) => (
          <Chip
            key={v}
            tone={project.tone}
            active={view === v}
            onClick={() => setView(v)}
            count={v === "requests" ? open || undefined : undefined}
          >
            {l}
          </Chip>
        ))}
      </View>

      {view === "board" ? (
        <View className="no-scrollbar -mx-5 mt-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-2">
          {COLUMNS.map((col) => {
            const items = mine.filter((t) => t.status === col.status);
            return (
              <View
                key={col.status}
                className="w-[264px] shrink-0 snap-start"
                accessibilityLabel={col.status}
              >
                <View className="mb-3">
                  <View
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-full px-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em]",
                      TONES[col.tone].solid,
                    )}
                  >
                    {col.status}
                    <Span className="opacity-70">{items.length}</Span>
                  </View>
                </View>
                <View className="space-y-2.5">
                  {items.length === 0 ? (
                    <View className="rounded-2xl border-2 border-dashed border-ink/15 px-4 py-8 text-center text-[13px] text-ink/40">
                      Nothing here
                    </View>
                  ) : null}
                  {items.map((t, i) => (
                    <BoardCard key={t.id} task={t} index={i} />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {view === "list" ? (
        <View className="mt-5 space-y-2.5">
          {mine.length === 0 ? (
            <Empty
              title="No tasks yet"
              body="Tasks for this project show up here."
              tone={project.tone}
            />
          ) : null}
          {mine.map((t, i) => (
            <TaskRow key={t.id} task={t} index={i} />
          ))}
        </View>
      ) : null}

      {view === "calendar" ? (
        <View className="mt-5">
          <View className="rounded-3xl border border-line/70 bg-card p-4">
            <Display as="h3" size="md" className="mb-3">
              {MONTH_LONG[TODAY.month]} {TODAY.year}
            </Display>
            <MonthGrid
              year={TODAY.year}
              month={TODAY.month}
              today={TODAY.day}
              marks={marks}
              range={{
                from: day,
                to: day,
              }}
              onPick={setDay}
            />
          </View>
          <Eyebrow tone="muted" className="mb-3 mt-5">
            Due {selected} {MONTH_LONG[TODAY.month]?.slice(0, 3)}
          </Eyebrow>
          <View className="space-y-2.5">
            {onDay.length === 0 ? (
              <Text className="rounded-2xl bg-paper-deep px-4 py-5 text-center text-[14px] text-ink/55">
                Nothing is due this day.
              </Text>
            ) : (
              onDay.map((t, i) => <TaskRow key={t.id} task={t} index={i} />)
            )}
          </View>
        </View>
      ) : null}

      {view === "files" ? (
        <View className="mt-5 space-y-2.5">
          <Button tone="outline" size="md" icon={Upload} onClick={() => setAttaching(true)}>
            Upload a file
          </Button>
          {files.map((f) => (
            <View key={f.id}>
              <AttachmentRow file={f} onOpen={setPreview} />
              <Text className="mt-1 px-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40">
                {nameOf(f.by)} · {f.at}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {view === "requests" ? (
        <View className="mt-5 space-y-3">
          {reqs.length === 0 ? (
            <Empty
              title="No client requests"
              body="Requests from the client portal land here."
              tone={project.tone}
            />
          ) : null}
          {reqs.map((r, i) => (
            <View
              key={r.id}
              className="animate-rise rounded-3xl border border-line/70 bg-card p-4"
              style={stagger(i)}
            >
              <View className="flex items-start justify-between gap-3">
                <Text className="text-[16px] font-semibold leading-snug">{r.title}</Text>
                <Badge tone={r.status === "New" ? "coral" : "leaf"}>{r.status}</Badge>
              </View>
              <Text className="mt-1.5 text-[14px] leading-relaxed text-ink/65">{r.body}</Text>
              <Text className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/45">
                {r.by} · {r.at}
              </Text>
              {r.status === "New" ? (
                <Button
                  tone="ink"
                  size="md"
                  className="mt-3.5"
                  onClick={() => actions.convertRequest(r.id)}
                >
                  Convert to a task
                </Button>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <AttachSheet
        open={attaching}
        onClose={() => setAttaching(false)}
        onPick={(picked) => {
          setExtra((e) => [
            ...picked.map((f) => ({
              ...f,
              by: "me",
              at: "Just now",
            })),
            ...e,
          ]);
          actions.saved("File uploaded", "cobalt");
        }}
      />
      <PreviewSheet file={preview} onClose={() => setPreview(null)} />
    </Screen>
  );
}
