import { ClientRequest, Project, Task, TaskDependency, WorkflowStatus } from "../models";
import { notify, taskLink } from "./notifications";

export interface Actor {
  userId: string;
  fullName: string;
}

/** Fire and forget: runs after the action, and can't delay or fail it. */
const background = (work: () => Promise<void>) => {
  work().catch((err) => console.error("[Notify] Work event failed:", err.message));
};

const MENTION = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;

export function notifyTaskCreated(task: Task, actor: Actor) {
  background(() => notify({
    userIds: [task.assigneeId],
    type: "task.assigned",
    title: `${actor.fullName} assigned you "${task.title}"`,
    link: taskLink(task),
    actorId: actor.userId,
  }));
}

export function notifyTaskChanged(before: Record<string, any>, task: Task, actor: Actor) {
  background(async () => {
    const link = taskLink(task);
    if (task.assigneeId && task.assigneeId !== before.assigneeId) {
      await notify({ userIds: [task.assigneeId], type: "task.assigned", title: `${actor.fullName} assigned you "${task.title}"`, link, actorId: actor.userId });
    }
    if ((task.statusId ?? null) !== (before.statusId ?? null) || task.status !== before.status) {
      const status = task.statusId ? await WorkflowStatus.findByPk(task.statusId, { attributes: ["name"] }) : null;
      await notify({
        userIds: [task.assigneeId, task.createdById],
        type: "task.status_changed",
        title: `${actor.fullName} moved "${task.title}" to ${status?.name ?? task.status}`,
        link,
        actorId: actor.userId,
        groupKey: `status:${task.id}`,
      });
    }
    if (task.status === "Done" && before.status !== "Done") {
      const edges = await TaskDependency.findAll({ where: { predecessorId: task.id }, attributes: ["successorId"] });
      const waiting = await Task.findAll({ where: { blockedById: task.id }, attributes: ["id", "projectId", "assigneeId", "title"] });
      const viaEdges = edges.length
        ? await Task.findAll({ where: { id: edges.map((e) => e.successorId) }, attributes: ["id", "projectId", "assigneeId", "title"] })
        : [];
      for (const w of [...waiting, ...viaEdges]) {
        await notify({
          userIds: [w.assigneeId],
          type: "task.unblocked",
          title: `"${w.title}" is unblocked: "${task.title}" is done`,
          link: taskLink(w),
          actorId: actor.userId,
          groupKey: `unblocked:${w.id}:${task.id}`,
        });
      }
    }
  });
}

export function notifyTaskComment(taskId: string, body: string, actor: Actor) {
  background(async () => {
    const task = await Task.findByPk(taskId, { attributes: ["id", "title", "projectId", "assigneeId", "createdById"] });
    if (!task) return;
    const mentioned = [...new Set([...body.matchAll(MENTION)].map((m) => m[2]))];
    const preview = body.replace(MENTION, "@$1");
    const link = taskLink(task);
    await notify({ userIds: mentioned, type: "task.mentioned", title: `${actor.fullName} mentioned you on "${task.title}"`, body: preview, link, actorId: actor.userId });
    await notify({
      userIds: [task.assigneeId, task.createdById].filter((id) => !mentioned.includes(id as string)),
      type: "task.commented",
      title: `${actor.fullName} commented on "${task.title}"`,
      body: preview,
      link,
      actorId: actor.userId,
      groupKey: `comment:${task.id}`,
    });
  });
}

export function notifyRequestCreated(request: ClientRequest, actor: Actor) {
  background(async () => {
    if (!request.projectId) return;
    const project = await Project.findByPk(request.projectId, { attributes: ["name", "ownerId", "createdById"] });
    await notify({
      userIds: [project?.ownerId ?? project?.createdById],
      type: "request.created",
      title: `New ${request.type.toLowerCase()} on ${project?.name ?? "a project"}: ${request.title}`,
      body: request.description ?? null,
      link: "/work/changes",
      actorId: actor.userId,
    });
  });
}

export function notifyRequestStatus(request: ClientRequest, previous: string, actor: Actor) {
  if (request.status === previous) return;
  background(async () => {
    const project = request.projectId ? await Project.findByPk(request.projectId, { attributes: ["ownerId", "createdById"] }) : null;
    await notify({
      userIds: [request.createdById, project?.ownerId ?? project?.createdById],
      type: "request.status_changed",
      title: `${actor.fullName} moved "${request.title}" to ${request.status}`,
      link: "/work/changes",
      actorId: actor.userId,
      groupKey: `request:${request.id}`,
    });
  });
}

export function notifyTeamAdded(userIds: string[], teamName: string, actor: Actor) {
  background(() => notify({
    userIds,
    type: "team.added",
    title: `${actor.fullName} added you to the team ${teamName}`,
    link: "/work/teams",
    actorId: actor.userId,
  }));
}
