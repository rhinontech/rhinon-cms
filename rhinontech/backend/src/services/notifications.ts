import { Op } from "sequelize";
import { Notification, Role, Task, User } from "../models";
import { sendEmail } from "./mailer";
import { runAsSystem, runForOrg } from "./tenantContext";
import { emitToUsers } from "./teamChat/realtime";
import { pushToUsers } from "./pushNotifications";

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
  const emailQueue: string[] = [];
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
          void pushToUsers([userId], input.title.slice(0, 100), input.body?.slice(0, 200) ?? null, input.link ? { link: input.link } : undefined);
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
      void pushToUsers([userId], input.title.slice(0, 100), input.body?.slice(0, 200) ?? null, input.link ? { link: input.link } : undefined);
      if (EMAILED_TYPES.has(input.type)) emailQueue.push(userId);
    } catch (err: any) {
      console.error(`[Notify] ${input.type} failed:`, err.message);
    }
  }
  if (emailQueue.length) void emailNotification(emailQueue, input);
}

/**
 * Notifications someone has to act on also go out by email, because the bell
 * only works for people who have the app open: a manager away from the tab
 * never saw a leave request. Only new notifications are emailed (a grouped
 * repeat is not), and the same per-category mutes apply. NOTIFY_EMAIL=off
 * turns the channel off for a whole server.
 */
const EMAILED_TYPES = new Set([
  "task.assigned", "task.mentioned", "leave.requested", "leave.decided",
  "payroll.claim_submitted", "payroll.claim_decided", "chatbot.handoff", "chatbot.ticket_assigned",
  "inbox.assigned", "crm.lead_assigned", "crm.deal_assigned", "hiring.interview_assigned",
  "performance.review_due", "pages.shared",
]);

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function emailNotification(userIds: string[], input: NotifyInput): Promise<void> {
  if (process.env.NOTIFY_EMAIL === "off") return;
  try {
    const people = await User.findAll({
      where: { id: { [Op.in]: userIds }, status: "active" },
      attributes: ["id", "fullName", "personalEmail", "companyEmail"],
      include: [{ model: Role, as: "role", attributes: ["slug"] }],
    });
    const app = (process.env.FRONTEND_URL || "https://rhinontech.in").replace(/\/$/, "");
    for (const person of people) {
      // Personal address first: a company mailbox on a workspace subdomain may not receive mail yet.
      const to = person.personalEmail || person.companyEmail;
      if (!to) continue;
      const role = (person as unknown as { role?: { slug: string } }).role?.slug ?? "employee";
      const url = input.link ? `${app}/${role}${input.link.startsWith("/") ? input.link : `/${input.link}`}` : `${app}/${role}/dashboard`;
      const first = (person.fullName || "").split(" ")[0] || "there";
      const lines = [`Hi ${first},`, "", input.title, ...(input.body ? ["", input.body] : []), "", `Open it: ${url}`];
      await sendEmail({
        to,
        subject: input.title.slice(0, 150),
        text: lines.join("\n"),
        html: `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111">
<p>Hi ${esc(first)},</p><p style="font-size:15px;font-weight:600">${esc(input.title)}</p>
${input.body ? `<p style="color:#444">${esc(input.body)}</p>` : ""}
<p><a href="${esc(url)}" style="display:inline-block;background:#4f46e5;color:#fff;padding:9px 16px;border-radius:8px;text-decoration:none">Open in Rhinon</a></p>
<p style="color:#888;font-size:12px">You can turn these off in your profile's notification settings.</p></div>`,
      }).catch((err: Error) => console.error(`[Notify] email ${input.type} failed:`, err.message));
    }
  } catch (err: any) {
    console.error(`[Notify] email ${input.type} failed:`, err.message);
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
