import { useRev } from "@/lib/store";
import { View, Text, Span, Link } from "@/components/rn";
import { Plus } from "@/components/icons";
import { useState } from "react";
import {
  AvatarStack,
  Display,
  Empty,
  Eyebrow,
  Fab,
  ProgressBar,
  Screen,
  SectionLabel,
  Segmented,
  Chip,
  stagger,
} from "@/components/rhinon/ui";
import { AddTaskSheet, TaskRow } from "@/components/rhinon/work";
import { PROJECTS, TEAMS, nameOf, type DueGroup } from "@/lib/mock-data";
import { useApp } from "@/lib/store";
import { TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
type Tab = "mine" | "projects" | "teams";
type Filter = "all" | "overdue" | "today" | "upcoming";
const GROUPS: {
  key: DueGroup;
  label: string;
  filter: Filter;
}[] = [
  {
    key: "overdue",
    label: "Overdue",
    filter: "overdue",
  },
  {
    key: "today",
    label: "Today",
    filter: "today",
  },
  {
    key: "week",
    label: "This week",
    filter: "upcoming",
  },
  {
    key: "later",
    label: "Later",
    filter: "upcoming",
  },
];
export default function WorkPage() {
  useRev();
  const all = useApp((s) => s.tasks);
  const tasks = all.filter((t) => t.assignee === "me");
  const [tab, setTab] = useState<Tab>("mine");
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);
  const todays = tasks.filter((t) => t.group === "overdue" || t.group === "today");
  const done = todays.filter((t) => t.status === "Done").length;
  const dueOpen = todays.length - done;
  const count = (f: Filter) =>
    tasks.filter(
      (t) =>
        t.status !== "Done" &&
        GROUPS.some((g) => g.key === t.group && (f === "all" || g.filter === f)),
    ).length;
  return (
    <Screen fab={tab === "mine"}>
      <View className="animate-rise">
        <Eyebrow tone="cobalt">Work · {dueOpen} due today</Eyebrow>
        <Display size="hero" className="mt-3">
          Get it
          {"\n"}
          done.
        </Display>
      </View>

      <View
        className="mt-6 animate-rise overflow-hidden rounded-[calc(var(--radius)+14px)] bg-cobalt p-5 text-cobalt-foreground"
        style={stagger(1)}
      >
        <View className="flex items-end justify-between">
          <Text className="font-display text-[length:calc(88px*var(--ds))] font-black leading-[0.8]">
            {done}
            <Span className="text-[length:calc(52px*var(--ds))] opacity-60">/{todays.length}</Span>
          </Text>
          <Text className="pb-1 text-right font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] opacity-90">
            done
            {"\n"}
            today
          </Text>
        </View>
        <ProgressBar
          value={todays.length ? done / todays.length : 0}
          tone="paper"
          track="bg-paper/20"
          className="mt-5 h-2.5"
        />
        <Text className="mt-3 text-[14px] opacity-85">
          {dueOpen === 0
            ? "All clear. Take a breath."
            : `${dueOpen} to go — start with the overdue one.`}
        </Text>
      </View>

      <Segmented
        className="mt-6"
        value={tab}
        onChange={setTab}
        options={[
          {
            value: "mine",
            label: "Mine",
          },
          {
            value: "projects",
            label: "Projects",
          },
          {
            value: "teams",
            label: "Teams",
          },
        ]}
      />

      {tab === "mine" ? (
        <View className="mt-5">
          <View className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            <Chip active={filter === "all"} onClick={() => setFilter("all")} count={count("all")}>
              All
            </Chip>
            <Chip
              active={filter === "overdue"}
              onClick={() => setFilter("overdue")}
              count={count("overdue")}
            >
              Overdue
            </Chip>
            <Chip active={filter === "today"} onClick={() => setFilter("today")}>
              Today
            </Chip>
            <Chip active={filter === "upcoming"} onClick={() => setFilter("upcoming")}>
              Upcoming
            </Chip>
          </View>

          {GROUPS.map((g) => {
            if (filter !== "all" && g.filter !== filter) return null;
            const rows = tasks
              .filter((t) => t.group === g.key)
              .sort((a, b) => Number(a.status === "Done") - Number(b.status === "Done"));
            if (rows.length === 0) return null;
            return (
              <View key={g.key} className="mt-6">
                <SectionLabel
                  right={<Span className="font-mono text-[11px] text-ink/50">{rows.length}</Span>}
                  className="mb-3"
                >
                  {g.label}
                </SectionLabel>
                <View className="space-y-2.5">
                  {rows.map((t, i) => (
                    <TaskRow key={t.id} task={t} index={i} />
                  ))}
                </View>
              </View>
            );
          })}

          {tasks.filter(
            (t) => filter === "all" || GROUPS.find((g) => g.key === t.group)?.filter === filter,
          ).length === 0 ? (
            <Empty
              title="Nothing here"
              body="No tasks match this filter. Add one with the plus button."
              tone="cobalt"
            />
          ) : null}
        </View>
      ) : null}

      {tab === "projects" ? (
        <View className="mt-5 space-y-3">
          {PROJECTS.map((p, i) => {
            const light = p.tone === "sun" || p.tone === "rose" || p.tone === "sky";
            return (
              <Link
                key={p.id}
                to="/work/project/$projectId"
                params={{
                  projectId: p.id,
                }}
                className={cn("press block animate-rise rounded-3xl p-5", TONES[p.tone].solid)}
                style={stagger(i)}
              >
                <View className="flex items-center justify-between font-mono text-[11px] font-medium uppercase tracking-[0.16em]">
                  <Span className="opacity-90">{p.status}</Span>
                  <Span>{Math.round(p.progress * 100)}%</Span>
                </View>
                <Display as="h3" size="lg" className="mt-7">
                  {p.name}
                </Display>
                <ProgressBar
                  value={p.progress}
                  tone={light ? "ink" : "paper"}
                  track={light ? "bg-ink/15" : "bg-paper/25"}
                  className="mt-4"
                />
                <View className="mt-4 flex items-center justify-between">
                  <AvatarStack
                    names={p.members.map(nameOf)}
                    size={28}
                    max={3}
                    ring={TONES[p.tone].border}
                  />
                  <Span className="font-mono text-[11px] uppercase tracking-[0.12em] opacity-90">
                    {p.tasks} tasks · due {p.due}
                  </Span>
                </View>
              </Link>
            );
          })}
        </View>
      ) : null}

      {tab === "teams" ? (
        <View className="mt-5 space-y-2.5">
          {TEAMS.map((t, i) => (
            <View
              key={t.id}
              className="flex animate-rise items-center gap-4 rounded-2xl border border-line/70 bg-card p-3.5"
              style={stagger(i)}
            >
              <View
                className={cn(
                  "grid size-14 shrink-0 place-items-center rounded-2xl font-display text-[length:calc(30px*var(--ds))] font-black",
                  TONES[t.tone].solid,
                )}
              >
                {t.name[0]}
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[17px] font-semibold leading-tight">{t.name}</Text>
                <Text className="mt-0.5 text-[13px] text-ink/55">
                  {t.open} open · led by {nameOf(t.lead)}
                </Text>
              </View>
              <AvatarStack names={t.members.map(nameOf)} size={26} max={3} />
            </View>
          ))}
        </View>
      ) : null}

      {tab === "mine" ? <Fab icon={Plus} label="Add task" onClick={() => setAdding(true)} /> : null}
      <AddTaskSheet open={adding} onClose={() => setAdding(false)} />
    </Screen>
  );
}
