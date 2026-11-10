import { View } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/lib/theme";
import { dueLabel } from "@/lib/format";
import type { Task } from "@/lib/types";
import { Badge, Card, Tappable, Text } from "@/components/ui";

const URGENCY_TONE = { overdue: "danger", today: "warning", later: "neutral" } as const;

export function TaskRow({ task }: { task: Task }) {
  const { colors } = useTheme();
  const due = task.dueDate && task.status !== "Done" ? dueLabel(task.dueDate) : null;
  return (
    <Tappable className="mx-4" scale={0.985} onPress={() => router.push({ pathname: "/work/task/[id]", params: { id: task.id, projectId: task.projectId ?? "" } })}>
      <Card className="flex-row items-center gap-3 p-3.5">
        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: task.workflowStatus?.color || colors.brand }} />
        <View className="flex-1">
          <Text numberOfLines={2} className="font-medium text-[15px]">
            {task.title}
          </Text>
          <Text numberOfLines={1} variant="caption" className="mt-0.5 text-[13px]">
            {[task.workflowStatus?.name ?? task.status, task.project?.name].filter(Boolean).join(" · ")}
          </Text>
        </View>
        {due && <Badge label={due.label} tone={URGENCY_TONE[due.urgency]} />}
      </Card>
    </Tappable>
  );
}

