import { useState } from "react";
import { Pressable, View } from "react-native";
import { Check } from "lucide-react-native";

import { PROJECTS, TEAMS, nameOf, type DueGroup, type Task } from "@/data/mock-data";
import { actions, useApp } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { AvatarStack, Card, Chip, Display, Empty, Eyebrow, ProgressBar, Screen, SectionLabel, Segmented, Text, tone, toneOfPerson, Avatar } from "@/ui";

type Tab = "mine" | "projects" | "teams";
type Filter = "all" | "overdue" | "today" | "upcoming";
const GROUPS: { key: DueGroup; label: string; filter: Filter }[] = [
  { key: "overdue", label: "Overdue", filter: "overdue" },
  { key: "today", label: "Today", filter: "today" },
  { key: "week", label: "This week", filter: "upcoming" },
  { key: "later", label: "Later", filter: "upcoming" },
];

function TaskRow({ task }: { task: Task }) {
  const t = useTheme();
  const done = task.status === "Done";
  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }}>
      <Pressable onPress={() => actions.toggleTask(task.id)} accessibilityLabel="Toggle done" style={{ width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: done ? t.c.hues.leaf.solid : `${t.c.ink}55`, backgroundColor: done ? t.c.hues.leaf.solid : "transparent", alignItems: "center", justifyContent: "center" }}>
        {done ? <Check size={16} color={t.c.hues.leaf.on} strokeWidth={3.2} /> : null}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text bold style={{ fontSize: 16, textDecorationLine: done ? "line-through" : "none", opacity: done ? 0.45 : 1 }}>{task.title}</Text>
        <Eyebrow style={{ marginTop: 4 }}>{task.project} · {task.due}</Eyebrow>
      </View>
    </Card>
  );
}

export default function Work() {
  const t = useTheme();
  const all = useApp((s) => s.tasks);
  const tasks = all.filter((x) => x.assignee === "me");
  const [tab, setTab] = useState<Tab>("mine");
  const [filter, setFilter] = useState<Filter>("all");
  const cobalt = tone(t, "cobalt");

  const todays = tasks.filter((x) => x.group === "overdue" || x.group === "today");
  const done = todays.filter((x) => x.status === "Done").length;
  const dueOpen = todays.length - done;
  const count = (f: Filter) => tasks.filter((x) => x.status !== "Done" && GROUPS.some((g) => g.key === x.group && (f === "all" || g.filter === f))).length;

  return (
    <Screen>
      <Eyebrow color={cobalt.text}>Work · {dueOpen} due today</Eyebrow>
      <Display style={{ marginTop: 12 }}>{"Get it\ndone."}</Display>

      <View style={{ marginTop: 24, padding: 20, borderRadius: t.c.radius + 14, backgroundColor: cobalt.bg }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <Display size="xl" color={cobalt.fg}>{done}<Display size="lg" color={`${cobalt.fg}99`}>/{todays.length}</Display></Display>
          <Eyebrow color={cobalt.fg}>{"done\ntoday"}</Eyebrow>
        </View>
        <View style={{ marginTop: 18 }}><ProgressBar value={todays.length ? done / todays.length : 0} color={cobalt.fg} track={`${cobalt.fg}33`} height={10} /></View>
        <Text style={{ marginTop: 12, color: cobalt.fg, opacity: 0.85 }}>{dueOpen === 0 ? "All clear. Take a breath." : `${dueOpen} to go — start with the overdue one.`}</Text>
      </View>

      <View style={{ marginTop: 24 }}>
        <Segmented value={tab} onChange={setTab} options={[{ value: "mine", label: "Mine" }, { value: "projects", label: "Projects" }, { value: "teams", label: "Teams" }]} />
      </View>

      {tab === "mine" ? (
        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Chip active={filter === "all"} onPress={() => setFilter("all")} count={count("all")}>All</Chip>
            <Chip active={filter === "overdue"} onPress={() => setFilter("overdue")} count={count("overdue")}>Overdue</Chip>
            <Chip active={filter === "today"} onPress={() => setFilter("today")}>Today</Chip>
            <Chip active={filter === "upcoming"} onPress={() => setFilter("upcoming")}>Upcoming</Chip>
          </View>
          {GROUPS.map((g) => {
            if (filter !== "all" && g.filter !== filter) return null;
            const rows = tasks.filter((x) => x.group === g.key).sort((a, b) => Number(a.status === "Done") - Number(b.status === "Done"));
            if (!rows.length) return null;
            return (
              <View key={g.key}>
                <SectionLabel>{g.label} · {rows.length}</SectionLabel>
                <View style={{ gap: 10 }}>{rows.map((x) => <TaskRow key={x.id} task={x} />)}</View>
              </View>
            );
          })}
          {tasks.filter((x) => filter === "all" || GROUPS.find((g) => g.key === x.group)?.filter === filter).length === 0 ? <Empty title="Nothing here" body="No tasks match this filter." /> : null}
        </View>
      ) : null}

      {tab === "projects" ? (
        <View style={{ marginTop: 20, gap: 12 }}>
          {PROJECTS.map((p) => {
            const c = tone(t, p.tone);
            return (
              <View key={p.id} style={{ padding: 20, borderRadius: t.c.radius + 14, backgroundColor: c.bg, borderWidth: t.id === "brutal" ? 2 : 0, borderColor: t.c.ink }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Eyebrow color={c.fg}>{p.status}</Eyebrow>
                  <Eyebrow color={c.fg}>{Math.round(p.progress * 100)}%</Eyebrow>
                </View>
                <Display size="lg" color={c.fg} style={{ marginTop: 26 }}>{p.name}</Display>
                <View style={{ marginTop: 14 }}><ProgressBar value={p.progress} color={c.fg} track={`${c.fg}33`} /></View>
                <View style={{ marginTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <AvatarStack names={p.members.map(nameOf)} />
                  <Eyebrow color={c.fg}>{p.tasks} tasks · due {p.due}</Eyebrow>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {tab === "teams" ? (
        <View style={{ marginTop: 20, gap: 10 }}>
          {TEAMS.map((tm) => (
            <Card key={tm.id} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14 }}>
              <Avatar name={tm.name} size={56} hue={toneOfPerson(tm.name)} />
              <View style={{ flex: 1 }}>
                <Text bold style={{ fontSize: 17 }}>{tm.name}</Text>
                <Text style={{ fontSize: 13, opacity: 0.55, marginTop: 2 }}>{tm.open} open · led by {nameOf(tm.lead)}</Text>
              </View>
              <AvatarStack names={tm.members.map(nameOf)} size={26} />
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
