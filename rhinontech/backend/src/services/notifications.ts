import { Op } from "sequelize";
import { Notification, Task, User } from "../models";
import { runAsSystem, runForOrg } from "./tenantContext";
import { emitToUsers } from "./teamChat/realtime";

/** What a person can switch off. Keyed by the part of the type before the dot. */
export const NOTIFICATION_CATEGORIES: { key: string; label: string; platformOnly?: boolean; prefixes: string[] }[] = [
  { key: "work", label: "Tasks, teams & client requests", prefixes: ["task", "team", "request"] },
  { key: "people", label: "Leave, attendance, joiners & exits", prefixes: ["leave", "attendance", "people"] },
  { key: "payroll", label: "Payroll & reimbursements", prefixes: ["payroll"] },
  { key: "performance", label: "Performance reviews", prefixes: ["performance"] },
  { key: "hiring", label: "Hiring", prefixes: ["hiring"] },
  { key: "crm", label: "CRM & outreach", prefixes: ["crm", "outreach"] },
  { key: "support", label: "Inbox & chatbot", prefixes: ["inbox", "chatbot"] },
  { key: "content", label: "Events, content & pages", prefixes: ["events", "content", "pages"] },
  { key: "github", label: "GitHub", prefixes: ["github"], platformOnly: true },
  { key: "platform", label: "Platform", prefixes: ["platform"], platformOnly: true },
];

const categoryOf = (type: string) => {
  const prefix = type.split(".")[0];
  return NOTIFICATION_CATEGORIES.find((c) => c.prefixes.includes(prefix))?.key ?? prefix;
};

export interface NotifyInput {
  userIds: (string | null | undefined)[];
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  actorId?: string | null;
  groupKey?: string | null;
  /** Reminders: skip anyone who has ever had this groupKey, even if read. */
  once?: boolean;
}

/**
 * The one way any module notifies someone. Never throws: a failed notification
 * must not fail the action that caused it. The actor is never told about their
 * own action. Must run in the recipients' org context.
 */
export async function notify(input: NotifyInput): Promise<void> {
  const ids = [...new Set(input.userIds.filter(Boolean) as string[])].filter((id) => id !== input.actorId);
  if (!ids.length) return;
  // Scoped to the org, so a forged @mention can't reach another workspace, and
  // honours each person's settings.
  const category = categoryOf(input.type);
  const people = await User.findAll({ where: { id: { [Op.in]: ids } }, attributes: ["id", "notificationMutes"] });
  const recipients = people.filter((u) => !(u.notificationMutes ?? []).includes(category)).map((u) => u.id);
  for (const userId of recipients) {
    try {
      const key = input.groupKey ?? null;
      if (key) {
        const existing = await Notification.findOne({
          where: { userId, groupKey: key, ...(input.once ? {} : { readAt: null }) },
        });
        if (existing && input.once) continue;
        if (existing) {
          await existing.update({
            count: existing.count + 1,
            title: input.title.slice(0, 300),
            body: input.body?.slice(0, 500) ?? null,
            actorId: input.actorId ?? null,
          });
          emitToUsers([userId], "notification", existing);
          continue;
        }
      }
      const row = await Notification.create({
        userId,
        type: input.type,
        title: input.title.slice(0, 300),
        body: input.body?.slice(0, 500) ?? null,
        link: input.link ?? null,
        actorId: input.actorId ?? null,
        groupKey: key,
      });
      emitToUsers([userId], "notification", row);
    } catch (err: any) {
      console.error(`[Notify] ${input.type} failed:`, err.message);
    }
  }
}

export const taskLink = (task: { id: string; projectId?: string | null }) =>
  task.projectId ? `/work/projects/${task.projectId}?task=${task.id}` : "/work/tasks";

const istDay = (offsetDays = 0) => new Date(Date.now() + 330 * 60_000 + offsetDays * 86400_000).toISOString().slice(0, 10);
const istStart = (day: string) => new Date(`${day}T00:00:00+05:30`);

/** Daily: due-tomorrow and overdue reminders, once per task, plus retention. */
export async function runNotificationSweep(): Promise<void> {
  const today = istStart(istDay());
  const tomorrow = istStart(istDay(1));
  const dayAfter = istStart(istDay(2));
  const tasks = await runAsSystem("cron:notifications", () =>
    Task.findAll({
      where: { status: { [Op.ne]: "Done" }, assigneeId: { [Op.ne]: null }, dueDate: { [Op.lt]: dayAfter } } as any,
      attributes: ["id", "title", "assigneeId", "projectId", "dueDate", "organizationId"] as any,
    })
  );
  for (const t of tasks) {
    const due = new Date(t.dueDate!);
    const overdue = due < today;
    if (!overdue && due < tomorrow) continue; // due today: already reminded yesterday
    await runForOrg(t.get("organizationId") as string, () =>
      notify({
        userIds: [t.assigneeId],
        type: overdue ? "task.overdue" : "task.due_soon",
        title: overdue ? `Overdue: ${t.title}` : `Due tomorrow: ${t.title}`,
        link: taskLink(t),
        groupKey: `${overdue ? "overdue" : "due"}:${t.id}:${due.toISOString().slice(0, 10)}`,
        once: true,
      }), { label: "cron:notifications" });
  }
  const cutoff = new Date(Date.now() - 90 * 86400_000);
  await runAsSystem("cron:notifications", () => Notification.destroy({ where: { readAt: { [Op.lt]: cutoff } } }));
}
