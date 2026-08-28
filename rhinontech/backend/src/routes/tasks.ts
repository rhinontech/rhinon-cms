import { Router, Response } from "express";
import { Op } from "sequelize";
import { ClientRequest, Project, Subtask, Task, TaskComment, TaskTag, User } from "../models";
import { authenticate, authorizeAny, hasPermission, AuthRequest } from "../middleware/authenticate";
import {
  canAccessProject,
  canAccessTaskId,
  getHiddenProjectIds,
  mergeWhere,
  projectScopedWhere,
} from "../services/workAccess";

const taskStatusToRequestStatus: Record<string, string> = {
  Pending: "In review",
  "In progress": "In progress",
  Done: "Done",
};

const router = Router();
// Tasks hang off CRM records as well as projects, so either module's read grant opens them.
router.use(authenticate, authorizeAny("work:read", "crm:read"));

const taskIncludes: any[] = [
  { model: User, as: "assignee", attributes: ["id", "fullName", "companyEmail"] },
  { model: User, as: "creator", attributes: ["id", "fullName"] },
  { model: Project, as: "project", attributes: ["id", "name", "status", "visibility", "teamId"] },
  // projectId is selected purely so redactBlockers can tell whether the blocking
  // task sits in a project this user cannot see.
  { model: Task, as: "blocker", attributes: ["id", "title", "status", "projectId"] },
  { model: Subtask, as: "subtasks", attributes: ["id", "title", "done", "order"], separate: true, order: [["order", "ASC"]] },
  { model: TaskTag, as: "tags", attributes: ["id", "label", "color"] },
];

/**
 * A visible task can point at a blocker inside a private project, and the
 * `blocker` include would hand over its title. Replace it with a placeholder so
 * the dependency still reads as "blocked" without disclosing what by.
 */
function redactBlockers(tasks: any[], hidden: string[]): any[] {
  if (hidden.length === 0) return tasks;
  const hiddenSet = new Set(hidden);
  return tasks.map((task) => {
    const json = typeof task.toJSON === "function" ? task.toJSON() : task;
    if (json.blocker?.projectId && hiddenSet.has(json.blocker.projectId)) {
      json.blocker = { id: json.blocker.id, title: "Private task", status: json.blocker.status, restricted: true };
    }
    return json;
  });
}

async function loadVisibleTask(id: string, req: AuthRequest): Promise<Task | null> {
  const task = await Task.findByPk(id);
  if (!task) return null;
  return (await canAccessProject(task.projectId, req)) ? task : null;
}

async function canEdit(task: Task, req: AuthRequest): Promise<boolean> {
  // work:write is a management grant, not a bypass — it never reaches into a
  // project the holder cannot see.
  if (!(await canAccessProject(task.projectId, req))) return false;
  return task.assigneeId === req.user!.userId || task.createdById === req.user!.userId || hasPermission(req, "work:write");
}

/**
 * Every /tasks/:id/* route used to trust the id in the URL — the subtask,
 * comment and tag sub-routes never checked anything at all. Once a task can be
 * private that is an open door straight past the list filter, so the whole
 * `:id` family is gated here in one place.
 */
router.param("id", async (req: AuthRequest, res: Response, next, id: string) => {
  try {
    if (!(await canAccessTaskId(id, req))) {
      res.status(404).json({ message: "Task not found" });
      return;
    }
    next();
  } catch {
    res.status(500).json({ message: "Failed to verify task access" });
  }
});

// GET /tasks
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { scope = "my", status, projectId, priority, tag, teamId, leadId, dealId, accountId } = req.query;
    const where: Record<string, unknown> = {};
    const include = [...taskIncludes];

    // Asking for a record's tasks is its own scope: return every task attached
    // to it regardless of assignee, and skip the my/team narrowing below.
    const crmScoped = Boolean(leadId || dealId || accountId);
    if (leadId && typeof leadId === "string") where.leadId = leadId;
    if (dealId && typeof dealId === "string") where.dealId = dealId;
    if (accountId && typeof accountId === "string") where.accountId = accountId;

    if (crmScoped) {
      // Deliberately no assignee narrowing.
    } else if (scope === "my") {
      where.assigneeId = req.user!.userId;
    } else if (scope === "focus") {
      const now = new Date();
      where.assigneeId = req.user!.userId;
      where[Op.or as any] = [
        { status: "In progress" },
        { dueDate: { [Op.lt]: now }, status: { [Op.ne]: "Done" } },
      ];
    } else if (scope === "team") {
      where.assigneeId = { [Op.ne]: req.user!.userId };
      if (!hasPermission(req, "work:write", "employees:read")) {
        const currentUser = await User.findByPk(req.user!.userId, { attributes: ["department"] });
        include[0] = {
          model: User,
          as: "assignee",
          attributes: ["id", "fullName", "companyEmail"],
          where: { department: currentUser?.department ?? "" },
        };
      }
    }

    if (status && typeof status === "string") where.status = status;
    if (projectId && typeof projectId === "string") where.projectId = projectId;
    if (priority && typeof priority === "string") where.priority = priority;

    // ?teamId= narrows to work filed under one team's projects. An empty id list
    // is left in place deliberately: a team with no projects must return nothing,
    // not fall back to everything.
    if (teamId && typeof teamId === "string") {
      const teamProjects = await Project.findAll({ where: { teamId }, attributes: ["id"], raw: true });
      const ids = (teamProjects as any[]).map((p) => p.id);
      where.projectId = typeof projectId === "string" && projectId
        ? ids.filter((id) => id === projectId)
        : ids;
    }

    // Project visibility is applied last and on every scope — including the CRM
    // one, which otherwise returns a private project's tasks through a deal.
    const hidden = await getHiddenProjectIds(req);
    const scoped = await projectScopedWhere(req);

    let rows = await Task.findAll({
      where: mergeWhere(where, scoped),
      include,
      order: [["createdAt", "DESC"]],
    });

    let tasks = redactBlockers(rows, hidden);

    if (tag && typeof tag === "string") {
      tasks = tasks.filter((t: any) => t.tags?.some((tg: any) => tg.label === tag));
    }

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// POST /tasks
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, assigneeId, projectId, team, dueDate, status, priority, estimatedHours, recurrence, blockedById, leadId, dealId, accountId } = req.body;
    if (!title?.trim()) { res.status(400).json({ message: "title is required" }); return; }

    if (projectId && !(await canAccessProject(projectId, req))) {
      res.status(404).json({ message: "Project not found" }); return;
    }
    if (blockedById && !(await canAccessTaskId(blockedById, req))) {
      res.status(404).json({ message: "Blocking task not found" }); return;
    }

    const task = await Task.create({
      title: title.trim(),
      description: description || undefined,
      assigneeId: assigneeId || req.user!.userId,
      createdById: req.user!.userId,
      projectId: projectId || undefined,
      team: team || undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: status || "Pending",
      priority: priority || "Medium",
      estimatedHours: estimatedHours || null,
      recurrence: recurrence || null,
      blockedById: blockedById || null,
      leadId: leadId || null,
      dealId: dealId || null,
      accountId: accountId || null,
    });

    const full = await Task.findByPk(task.id, { include: taskIncludes });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ message: "Failed to create task" });
  }
});

// PUT /tasks/:id
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const task = await loadVisibleTask(req.params.id, req);
    if (!task) { res.status(404).json({ message: "Task not found" }); return; }
    if (!(await canEdit(task, req))) {
      res.status(403).json({ message: "You can only edit tasks assigned to or created by you" }); return;
    }

    const { title, description, assigneeId, projectId, team, dueDate, status, priority, estimatedHours, recurrence, blockedById, leadId, dealId, accountId } = req.body;
    const prevStatus = task.status;

    // Re-filing a task into a project you cannot see would hide it from yourself
    // and, worse, expose it to that project's members.
    if (projectId !== undefined && projectId && !(await canAccessProject(projectId, req))) {
      res.status(404).json({ message: "Project not found" }); return;
    }
    if (blockedById !== undefined && blockedById && !(await canAccessTaskId(blockedById, req))) {
      res.status(404).json({ message: "Blocking task not found" }); return;
    }

    await task.update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(assigneeId !== undefined && { assigneeId }),
      ...(projectId !== undefined && { projectId: projectId || null }),
      ...(team !== undefined && { team }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : (undefined as unknown as Date) }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(estimatedHours !== undefined && { estimatedHours }),
      ...(recurrence !== undefined && { recurrence: recurrence || null }),
      ...(blockedById !== undefined && { blockedById: blockedById || null }),
      ...(leadId !== undefined && { leadId: leadId || null }),
      ...(dealId !== undefined && { dealId: dealId || null }),
      ...(accountId !== undefined && { accountId: accountId || null }),
    });

    // Sync ClientRequest status
    if (status !== undefined && status !== prevStatus) {
      const mappedStatus = taskStatusToRequestStatus[status];
      if (mappedStatus) {
        await ClientRequest.update({ status: mappedStatus as any }, { where: { convertedTaskId: task.id } });
      }

      // Handle recurring task — create next instance when marked Done
      if (status === "Done" && task.recurrence) {
        const nextDue = task.dueDate ? new Date(task.dueDate) : new Date();
        if (task.recurrence === "Daily") nextDue.setDate(nextDue.getDate() + 1);
        else if (task.recurrence === "Weekly") nextDue.setDate(nextDue.getDate() + 7);
        else if (task.recurrence === "Monthly") nextDue.setMonth(nextDue.getMonth() + 1);

        await Task.create({
          title: task.title,
          description: task.description,
          assigneeId: task.assigneeId,
          createdById: task.createdById,
          projectId: task.projectId,
          team: task.team,
          dueDate: nextDue,
          status: "Pending",
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          recurrence: task.recurrence,
        });
      }
    }

    const full = await Task.findByPk(task.id, { include: taskIncludes });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: "Failed to update task" });
  }
});

// DELETE /tasks/:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const task = await loadVisibleTask(req.params.id, req);
    if (!task) { res.status(404).json({ message: "Task not found" }); return; }
    if (!(await canEdit(task, req))) {
      res.status(403).json({ message: "You can only delete tasks assigned to or created by you" }); return;
    }
    await ClientRequest.update({ convertedTaskId: undefined, status: "Open" } as any, { where: { convertedTaskId: task.id } });
    await Subtask.destroy({ where: { taskId: task.id } });
    await TaskComment.destroy({ where: { taskId: task.id } });
    await TaskTag.destroy({ where: { taskId: task.id } });
    await task.destroy();
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete task" });
  }
});

// --- SUBTASKS ---

// GET /tasks/:id/subtasks
router.get("/:id/subtasks", async (req: AuthRequest, res: Response) => {
  try {
    const subtasks = await Subtask.findAll({ where: { taskId: req.params.id }, order: [["order", "ASC"]] });
    res.json(subtasks);
  } catch { res.status(500).json({ message: "Failed to fetch subtasks" }); }
});

// POST /tasks/:id/subtasks
router.post("/:id/subtasks", async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    if (!title?.trim()) { res.status(400).json({ message: "title is required" }); return; }
    const count = await Subtask.count({ where: { taskId: req.params.id } });
    const subtask = await Subtask.create({ taskId: req.params.id, title: title.trim(), done: false, order: count });
    res.status(201).json(subtask);
  } catch { res.status(500).json({ message: "Failed to create subtask" }); }
});

// PUT /tasks/:id/subtasks/:subId
router.put("/:id/subtasks/:subId", async (req: AuthRequest, res: Response) => {
  try {
    const subtask = await Subtask.findOne({ where: { id: req.params.subId, taskId: req.params.id } });
    if (!subtask) { res.status(404).json({ message: "Subtask not found" }); return; }
    const { title, done, order } = req.body;
    await subtask.update({
      ...(title !== undefined && { title }),
      ...(done !== undefined && { done }),
      ...(order !== undefined && { order }),
    });
    res.json(subtask);
  } catch { res.status(500).json({ message: "Failed to update subtask" }); }
});

// DELETE /tasks/:id/subtasks/:subId
router.delete("/:id/subtasks/:subId", async (req: AuthRequest, res: Response) => {
  try {
    const subtask = await Subtask.findOne({ where: { id: req.params.subId, taskId: req.params.id } });
    if (!subtask) { res.status(404).json({ message: "Subtask not found" }); return; }
    await subtask.destroy();
    res.json({ message: "Subtask deleted" });
  } catch { res.status(500).json({ message: "Failed to delete subtask" }); }
});

// --- COMMENTS ---

// GET /tasks/:id/comments
router.get("/:id/comments", async (req: AuthRequest, res: Response) => {
  try {
    const comments = await TaskComment.findAll({
      where: { taskId: req.params.id },
      include: [{ model: User, as: "author", attributes: ["id", "fullName"] }],
      order: [["createdAt", "ASC"]],
    });
    res.json(comments);
  } catch { res.status(500).json({ message: "Failed to fetch comments" }); }
});

// POST /tasks/:id/comments
router.post("/:id/comments", async (req: AuthRequest, res: Response) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) { res.status(400).json({ message: "body is required" }); return; }
    const comment = await TaskComment.create({ taskId: req.params.id, userId: req.user!.userId, body: body.trim() });
    const full = await TaskComment.findByPk(comment.id, { include: [{ model: User, as: "author", attributes: ["id", "fullName"] }] });
    res.status(201).json(full);
  } catch { res.status(500).json({ message: "Failed to create comment" }); }
});

// DELETE /tasks/:id/comments/:commentId
router.delete("/:id/comments/:commentId", async (req: AuthRequest, res: Response) => {
  try {
    const comment = await TaskComment.findOne({ where: { id: req.params.commentId, taskId: req.params.id } });
    if (!comment) { res.status(404).json({ message: "Comment not found" }); return; }
    if (comment.userId !== req.user!.userId && !hasPermission(req, "work:write")) {
      res.status(403).json({ message: "You can only delete your own comments" }); return;
    }
    await comment.destroy();
    res.json({ message: "Comment deleted" });
  } catch { res.status(500).json({ message: "Failed to delete comment" }); }
});

// --- TAGS ---

// POST /tasks/:id/tags
router.post("/:id/tags", async (req: AuthRequest, res: Response) => {
  try {
    const { label, color } = req.body;
    if (!label?.trim()) { res.status(400).json({ message: "label is required" }); return; }
    const tag = await TaskTag.create({ taskId: req.params.id, label: label.trim(), color: color || "blue" });
    res.status(201).json(tag);
  } catch { res.status(500).json({ message: "Failed to create tag" }); }
});

// DELETE /tasks/:id/tags/:tagId
router.delete("/:id/tags/:tagId", async (req: AuthRequest, res: Response) => {
  try {
    const tag = await TaskTag.findOne({ where: { id: req.params.tagId, taskId: req.params.id } });
    if (!tag) { res.status(404).json({ message: "Tag not found" }); return; }
    await tag.destroy();
    res.json({ message: "Tag deleted" });
  } catch { res.status(500).json({ message: "Failed to delete tag" }); }
});

export default router;
