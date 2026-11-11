import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Check } from "lucide-react-native";

import { nameOf, type TaskStatus } from "@/data/mock-data";
import { actions, useApp } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { Avatar, Badge, Button, Card, Chip, Display, Empty, Eyebrow, Field, Screen, SectionLabel, Text, TopBar, toneOfPerson } from "@/ui";

const STATUSES: TaskStatus[] = ["Pending", "In progress", "Done"];

export default function TaskDetail() {
  const t = useTheme();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const task = useApp((s) => s.tasks.find((x) => x.id === taskId));
  const [sub, setSub] = useState("");
  const [comment, setComment] = useState("");
  if (!task) return <Screen><TopBar fallback="/work" /><Empty title="Not found" body="This task was removed." /></Screen>;
  const doneSubs = task.subtasks.filter((s) => s.done).length;

  return (
    <Screen>
      <TopBar title="Task" fallback="/work" />
      <Eyebrow>{task.project} · due {task.due}</Eyebrow>
      <Display size="lg" style={{ marginTop: 10 }}>{task.title}</Display>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <Badge name={task.priority === "High" ? "coral" : task.priority === "Medium" ? "sun" : "sky"}>{task.priority}</Badge>
        {task.tags.map((g) => <Badge key={g}>{g}</Badge>)}
      </View>
      {task.description ? <Text style={{ marginTop: 16, lineHeight: 23, opacity: 0.8 }}>{task.description}</Text> : null}

      <SectionLabel>Status</SectionLabel>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {STATUSES.map((s) => <Chip key={s} name="cobalt" active={task.status === s} onPress={() => actions.setTaskStatus(task.id, s)}>{s}</Chip>)}
      </View>

      <SectionLabel>Subtasks · {doneSubs}/{task.subtasks.length}</SectionLabel>
      <View style={{ gap: 8 }}>
        {task.subtasks.map((s) => (
          <Pressable key={s.id} onPress={() => actions.toggleSubtask(task.id, s.id)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 }}>
            <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: s.done ? t.c.hues.leaf.solid : `${t.c.ink}55`, backgroundColor: s.done ? t.c.hues.leaf.solid : "transparent", alignItems: "center", justifyContent: "center" }}>
              {s.done ? <Check size={14} color={t.c.hues.leaf.on} strokeWidth={3.2} /> : null}
            </View>
            <Text style={{ flex: 1, textDecorationLine: s.done ? "line-through" : "none", opacity: s.done ? 0.5 : 1 }}>{s.title}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ marginTop: 10 }}>
        <Field value={sub} onChangeText={setSub} placeholder="Add a subtask" returnKeyType="done" onSubmitEditing={() => { if (sub.trim()) { actions.addSubtask(task.id, sub.trim()); setSub(""); } }} />
      </View>

      <SectionLabel>Comments</SectionLabel>
      <View style={{ gap: 10 }}>
        {task.comments.map((c) => (
          <Card key={c.id} style={{ flexDirection: "row", gap: 12, padding: 12 }}>
            <Avatar name={nameOf(c.by)} size={34} hue={toneOfPerson(nameOf(c.by))} />
            <View style={{ flex: 1 }}>
              <Text bold>{nameOf(c.by)} <Text style={{ fontSize: 12, opacity: 0.5 }}>{c.at}</Text></Text>
              <Text style={{ marginTop: 3, lineHeight: 21 }}>{c.text}</Text>
            </View>
          </Card>
        ))}
      </View>
      <View style={{ marginTop: 14 }}>
        <Field value={comment} onChangeText={setComment} placeholder="Write a comment" multiline />
        <Button disabled={!comment.trim()} onPress={() => { actions.addComment(task.id, comment.trim()); setComment(""); }}>Post comment</Button>
      </View>
    </Screen>
  );
}
