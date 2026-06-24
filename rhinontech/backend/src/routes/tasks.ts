import { Router, Response } from "express";
import { Op } from "sequelize";
import { ClientRequest, Project, Subtask, Task, TaskComment, TaskTag, User } from "../models";
import { authenticate, AuthRequest } from "../middleware/authenticate";

const taskStatusToRequestStatus: Record<string, string> = {
  Pending: "In review",
  "In progress": "In progress",
  Done: "Done",
};

const router = Router();
router.use(authenticate);

const taskIncludes: any[] = [
  { model: User, as: "assignee", attributes: ["id", "fullName", "companyEmail"] },
  { model: User, as: "creator", attributes: ["id", "fullName"] },
  { model: Project, as: "project", attributes: ["id", "name", "status"] },
  { model: Task, as: "blocker", attributes: ["id", "title", "status"] },
  { model: Subtask, as: "subtasks", attributes: ["id", "title", "done", "order"], separate: true, order: [["order", "ASC"]] },
  { model: TaskTag, as: "tags", attributes: ["id", "label", "color"] },
];

function canEdit(task: Task, userId: string, roleSlug: string): boolean {
  return task.assigneeId === userId || task.createdById === userId || roleSlug === "superadmin";
}

// GET /tasks
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { scope = "my", status, projectId, priority, tag } = req.query;
    const where: Record<string, unknown> = {};
    const include = [...taskIncludes];

    if (scope === "my") {
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
      if (!["superadmin", "hr"].includes(req.user!.roleSlug)) {
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

    let tasks = await Task.findAll({ where, include, order: [["createdAt", "DESC"]] });

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
    const { title, description, assigneeId, projectId, team, dueDate, status, priority, estimatedHours, recurrence, blockedById } = req.body;
    if (!title?.trim()) { res.status(400).json({ message: "title is required" }); return; }

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
    const task = await Task.findByPk(req.params.id);
    if (!task) { res.status(404).json({ message: "Task not found" }); return; }
    if (!canEdit(task, req.user!.userId, req.user!.roleSlug)) {
      res.status(403).json({ message: "You can only edit tasks assigned to or created by you" }); return;
    }

    const { title, description, assigneeId, projectId, team, dueDate, status, priority, estimatedHours, recurrence, blockedById } = req.body;
    const prevStatus = task.status;

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
    const task = await Task.findByPk(req.params.id);
    if (!task) { res.status(404).json({ message: "Task not found" }); return; }
    if (!canEdit(task, req.user!.userId, req.user!.roleSlug)) {
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
    if (comment.userId !== req.user!.userId && req.user!.roleSlug !== "superadmin") {
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
