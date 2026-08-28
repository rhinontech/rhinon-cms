import { Router, Response } from "express";
import { Op } from "sequelize";
import multer from "multer";
import { ClientRequest, Project, Subtask, Task, TaskActivity, TaskAttachment, TaskComment, TaskDependency, TaskTag, TimeEntry, User, WorkflowStatus } from "../models";
import { uploadBuffer, getPresignedReadUrl, deleteObject } from "../services/storage";
import { legacyStatusFor, defaultStatusFor } from "../services/taskStatus";
import { logActivity, logTaskDiff } from "../services/taskActivity";
import { authenticate, authorizeAny, hasPermission, AuthRequest } from "../middleware/authenticate";
import {
  canAccessProject,
  canAccessTaskId,
  canGuestCollaborate,
  getHiddenProjectIds,
  guestTaskWhere,
  isGuest,
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

// unscoped on the people includes: a collaborator can be assigned a task or
// author a comment, and the default scope would blank their name out.
const taskIncludes: any[] = [
  { model: User.unscoped(), as: "assignee", attributes: ["id", "fullName", "companyEmail", "userType"] },
  { model: User.unscoped(), as: "creator", attributes: ["id", "fullName", "userType"] },
  { model: Project, as: "project", attributes: ["id", "name", "status", "visibility", "teamId"] },
  // projectId is selected purely so redactBlockers can tell whether the blocking
  // task sits in a project this user cannot see.
  { model: Task, as: "blocker", attributes: ["id", "title", "status", "projectId", "guestVisible"] },
  { model: Subtask, as: "subtasks", attributes: ["id", "title", "done", "order"], separate: true, order: [["order", "ASC"]] },
  { model: TaskTag, as: "tags", attributes: ["id", "label", "color"] },
  { model: WorkflowStatus, as: "workflowStatus", attributes: ["id", "name", "color", "group", "order"] },
  { model: TaskAttachment, as: "attachments", attributes: ["id", "name", "mimeType", "size", "createdAt"], separate: true },
  { model: TaskDependency, as: "dependsOn", attributes: ["id", "predecessorId", "type", "lagDays"], separate: true },
  { model: Task, as: "children", attributes: ["id", "title", "status", "statusId", "assigneeId", "startDate", "dueDate"], separate: true },
];

/**
 * A visible task can point at a blocker inside a private project, and the
 * `blocker` include would hand over its title. Replace it with a placeholder so
 * the dependency still reads as "blocked" without disclosing what by.
 */
function redactBlockers(tasks: any[], hidden: string[], guest: boolean): any[] {
  if (hidden.length === 0 && !guest) return tasks;
  const hiddenSet = new Set(hidden);
  return tasks.map((task) => {
    const json = typeof task.toJSON === "function" ? task.toJSON() : task;
    const b = json.blocker;
    // A guest may only ever see a blocker that was shared with them explicitly.
    const restricted = b && ((b.projectId && hiddenSet.has(b.projectId)) || (guest && !b.guestVisible));
    if (restricted) {
      json.blocker = { id: b.id, title: "Private task", status: b.status, restricted: true };
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
    // Guests additionally only ever see tasks explicitly shared with them.
    const guestWhere = await guestTaskWhere(req);

    let rows = await Task.findAll({
      where: mergeWhere(mergeWhere(where, scoped), guestWhere),
      include,
      order: [["createdAt", "DESC"]],
    });

    let tasks = redactBlockers(rows, hidden, isGuest(req));

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
    const { title, description, descriptionHtml, assigneeId, projectId, team, guestVisible, startDate, dueDate, status, statusId, parentTaskId, position, customFields, priority, estimatedHours, recurrence, blockedById, leadId, dealId, accountId } = req.body;
    if (!title?.trim()) { res.status(400).json({ message: "title is required" }); return; }

    if (projectId && !(await canAccessProject(projectId, req))) {
      res.status(404).json({ message: "Project not found" }); return;
    }
    if (blockedById && !(await canAccessTaskId(blockedById, req))) {
      res.status(404).json({ message: "Blocking task not found" }); return;
    }

    // A custom status wins; otherwise the project's default column is used. The
    // legacy enum is always derived so nothing downstream has to know about
    // custom workflows.
    let resolvedStatusId: string | null = statusId || null;
    if (!resolvedStatusId) {
      resolvedStatusId = (await defaultStatusFor(projectId || null))?.id ?? null;
    }
    const derivedStatus = await legacyStatusFor(resolvedStatusId);

    if (parentTaskId) {
      const parent = await Task.findByPk(parentTaskId, { attributes: ["id", "projectId"] });
      if (!parent || !(await canAccessProject(parent.projectId, req))) {
        res.status(404).json({ message: "Parent task not found" }); return;
      }
      // A subitem living in a different project would appear in one tree and be
      // filtered by another's visibility rules.
      if ((parent.projectId ?? null) !== (projectId || null)) {
        res.status(400).json({ message: "A subitem must sit in the same project as its parent." }); return;
      }
    }

    const guest = isGuest(req);
    if (guest) {
      // A collaborator's task must live in a project they can actually write to,
      // and must be shared — otherwise they would create work they cannot see.
      if (!projectId) {
        res.status(400).json({ message: "Collaborators must file a task under a project." }); return;
      }
      if (!(await canGuestCollaborate(projectId, req))) {
        res.status(403).json({ message: "You have view-only access to this project." }); return;
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description || undefined,
      // Guests self-assign — they cannot push work onto internal staff.
      assigneeId: guest ? req.user!.userId : (assigneeId || req.user!.userId),
      createdById: req.user!.userId,
      projectId: projectId || undefined,
      team: team || undefined,
      // Guests can only ever create shared work; only internal users choose.
      guestVisible: guest ? true : Boolean(guestVisible),
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      descriptionHtml: descriptionHtml || null,
      parentTaskId: parentTaskId || null,
      position: typeof position === "number" ? position : 0,
      customFields: customFields && typeof customFields === "object" ? customFields : {},
      statusId: resolvedStatusId,
      status: derivedStatus || status || "Pending",
      priority: priority || "Medium",
      estimatedHours: estimatedHours || null,
      recurrence: recurrence || null,
      blockedById: blockedById || null,
      leadId: leadId || null,
      dealId: dealId || null,
      accountId: accountId || null,
    });

    await logActivity(task.id, req.user!.userId, "created", "created this task");
    if (parentTaskId) {
      await logActivity(parentTaskId, req.user!.userId, "subitem_added", `added the subitem "${task.title}"`, { childId: task.id });
    }

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

    const { title, description, descriptionHtml, assigneeId, projectId, team, guestVisible, startDate, dueDate, status, statusId, parentTaskId, position, customFields, priority, estimatedHours, recurrence, blockedById, leadId, dealId, accountId } = req.body;
    const prevStatus = task.status;
    // Snapshot before the update so the audit diff has something to compare to.
    const before = task.toJSON() as Record<string, any>;
    const guest = isGuest(req);

    if (guest) {
      if (!(await canGuestCollaborate(task.projectId!, req))) {
        res.status(403).json({ message: "You have view-only access to this project." }); return;
      }
      // Detaching a task from its project would drop it out of the grant that
      // makes it reachable, stranding it where the collaborator cannot see it.
      if (projectId !== undefined && !projectId) {
        res.status(403).json({ message: "Collaborators cannot remove a task from its project." }); return;
      }
    }

    // Re-filing a task into a project you cannot see would hide it from yourself
    // and, worse, expose it to that project's members.
    if (projectId !== undefined && projectId && !(await canAccessProject(projectId, req))) {
      res.status(404).json({ message: "Project not found" }); return;
    }
    if (blockedById !== undefined && blockedById && !(await canAccessTaskId(blockedById, req))) {
      res.status(404).json({ message: "Blocking task not found" }); return;
    }

    if (parentTaskId !== undefined && parentTaskId) {
      if (parentTaskId === task.id) {
        res.status(400).json({ message: "A task cannot be its own parent." }); return;
      }
      const parent = await Task.findByPk(parentTaskId, { attributes: ["id", "projectId"] });
      if (!parent || !(await canAccessProject(parent.projectId, req))) {
        res.status(404).json({ message: "Parent task not found" }); return;
      }
      if ((parent.projectId ?? null) !== (task.projectId ?? null)) {
        res.status(400).json({ message: "A subitem must sit in the same project as its parent." }); return;
      }
      // Re-parenting onto a descendant would detach the whole branch from the
      // root, making every task in it invisible in the tree.
      const descendants = new Set<string>();
      let frontier = [task.id];
      while (frontier.length) {
        const kids = await Task.findAll({
          where: { parentTaskId: frontier },
          attributes: ["id"],
          raw: true,
        }) as unknown as { id: string }[];
        frontier = kids.map((k) => k.id).filter((id) => !descendants.has(id));
        frontier.forEach((id) => descendants.add(id));
      }
      if (descendants.has(parentTaskId)) {
        res.status(409).json({ message: "That would nest the task inside its own subitem." }); return;
      }
    }

    // Moving between board columns sets statusId; the legacy enum follows it so
    // recurrence, the ClientRequest sync and the dashboard keep working.
    const nextStatusId = statusId !== undefined ? (statusId || null) : undefined;
    const mappedFromCustom = nextStatusId !== undefined ? await legacyStatusFor(nextStatusId) : null;
    const effectiveStatus = mappedFromCustom ?? status;

    await task.update({
      ...(nextStatusId !== undefined && { statusId: nextStatusId }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(descriptionHtml !== undefined && { descriptionHtml: descriptionHtml || null }),
      ...(parentTaskId !== undefined && { parentTaskId: parentTaskId || null }),
      ...(position !== undefined && { position }),
      ...(customFields !== undefined && typeof customFields === "object" && {
        // Merge, so a table cell edit never wipes the other columns.
        customFields: { ...(task.customFields || {}), ...customFields },
      }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(assigneeId !== undefined && !guest && { assigneeId }),
      ...(projectId !== undefined && { projectId: projectId || null }),
      ...(team !== undefined && { team }),
      // Sharing a task with collaborators is an internal decision only.
      ...(guestVisible !== undefined && !guest && { guestVisible: Boolean(guestVisible) }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : (null as unknown as Date) }),
      ...(effectiveStatus !== undefined && effectiveStatus !== null && { status: effectiveStatus }),
      ...(priority !== undefined && { priority }),
      ...(estimatedHours !== undefined && { estimatedHours }),
      ...(recurrence !== undefined && { recurrence: recurrence || null }),
      ...(blockedById !== undefined && { blockedById: blockedById || null }),
      ...(leadId !== undefined && { leadId: leadId || null }),
      ...(dealId !== undefined && { dealId: dealId || null }),
      ...(accountId !== undefined && { accountId: accountId || null }),
    });

    // Sync ClientRequest status
    if (effectiveStatus != null && effectiveStatus !== prevStatus) {
      const mappedStatus = taskStatusToRequestStatus[effectiveStatus];
      if (mappedStatus) {
        await ClientRequest.update({ status: mappedStatus as any }, { where: { convertedTaskId: task.id } });
      }

      // Handle recurring task — create next instance when marked Done
      if (effectiveStatus === "Done" && task.recurrence) {
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

    await logTaskDiff(before, task, req.user!.userId);

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
      include: [{ model: User.unscoped(), as: "author", attributes: ["id", "fullName", "userType"] }],
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
    if (isGuest(req)) {
      const t = await Task.findByPk(req.params.id, { attributes: ["projectId"] });
      if (!t?.projectId || !(await canGuestCollaborate(t.projectId, req))) {
        res.status(403).json({ message: "You have view-only access to this project." }); return;
      }
    }
    const comment = await TaskComment.create({ taskId: req.params.id, userId: req.user!.userId, body: body.trim() });
    const full = await TaskComment.findByPk(comment.id, { include: [{ model: User.unscoped(), as: "author", attributes: ["id", "fullName", "userType"] }] });
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

// --- ACTIVITY FEED ---

// GET /tasks/:id/activity — the audit trail, newest last so it reads as a story.
router.get("/:id/activity", async (req: AuthRequest, res: Response) => {
  try {
    const rows = await TaskActivity.findAll({
      where: { taskId: req.params.id },
      include: [{ model: User.unscoped(), as: "actor", attributes: ["id", "fullName"] }],
      order: [["createdAt", "ASC"]],
      limit: 200,
    });
    res.json(rows);
  } catch { res.status(500).json({ message: "Failed to fetch activity" }); }
});

// --- DEPENDENCIES (Gantt) ---------------------------------------------------

/**
 * Walks the existing edges to see whether adding predecessor->successor would
 * close a loop. A cycle would make the Gantt unschedulable and hang any
 * critical-path walk, so it is refused at write time.
 */
async function wouldCycle(predecessorId: string, successorId: string): Promise<boolean> {
  if (predecessorId === successorId) return true;
  const edges = await TaskDependency.findAll({ attributes: ["predecessorId", "successorId"], raw: true });
  const next = new Map<string, string[]>();
  for (const e of edges as any[]) {
    if (!next.has(e.predecessorId)) next.set(e.predecessorId, []);
    next.get(e.predecessorId)!.push(e.successorId);
  }
  // Can we already get from successor back to predecessor? Then the new edge closes it.
  const seen = new Set<string>();
  const stack = [successorId];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === predecessorId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    stack.push(...(next.get(cur) || []));
  }
  return false;
}

router.get("/:id/dependencies", async (req: AuthRequest, res: Response) => {
  try {
    const rows = await TaskDependency.findAll({
      where: { [Op.or]: [{ successorId: req.params.id }, { predecessorId: req.params.id }] },
      include: [
        { model: Task, as: "predecessor", attributes: ["id", "title", "startDate", "dueDate", "status"] },
        { model: Task, as: "successor", attributes: ["id", "title", "startDate", "dueDate", "status"] },
      ],
    });
    res.json(rows);
  } catch { res.status(500).json({ message: "Failed to fetch dependencies" }); }
});

router.post("/:id/dependencies", async (req: AuthRequest, res: Response) => {
  try {
    const { predecessorId, type, lagDays } = req.body;
    if (!predecessorId) { res.status(400).json({ message: "predecessorId is required" }); return; }
    if (!(await canAccessTaskId(predecessorId, req))) {
      res.status(404).json({ message: "Predecessor task not found" }); return;
    }
    if (await wouldCycle(predecessorId, req.params.id)) {
      res.status(409).json({ message: "That would create a circular dependency." }); return;
    }
    const [dep] = await TaskDependency.findOrCreate({
      where: { predecessorId, successorId: req.params.id },
      defaults: { predecessorId, successorId: req.params.id, type: type || "FS", lagDays: lagDays || 0 },
    });
    const pred = await Task.findByPk(predecessorId, { attributes: ["title"] });
    await logActivity(req.params.id, req.user!.userId, "dependency_added", `made this wait on "${pred?.title ?? "another task"}"`, { predecessorId });
    res.status(201).json(dep);
  } catch { res.status(500).json({ message: "Failed to create dependency" }); }
});

router.delete("/:id/dependencies/:depId", async (req: AuthRequest, res: Response) => {
  try {
    const dep = await TaskDependency.findOne({ where: { id: req.params.depId } });
    if (!dep) { res.status(404).json({ message: "Dependency not found" }); return; }
    await dep.destroy();
    res.json({ message: "Dependency removed" });
  } catch { res.status(500).json({ message: "Failed to remove dependency" }); }
});

// --- ATTACHMENTS (Files tab) ------------------------------------------------

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.get("/:id/attachments", async (req: AuthRequest, res: Response) => {
  try {
    const rows = await TaskAttachment.findAll({
      where: { taskId: req.params.id },
      include: [{ model: User.unscoped(), as: "uploadedBy", attributes: ["id", "fullName"] }],
      order: [["createdAt", "DESC"]],
    });
    // Presigned per request — keys are never public.
    const withUrls = await Promise.all(rows.map(async (r) => ({
      ...r.toJSON(),
      url: await getPresignedReadUrl(r.key).catch(() => null),
    })));
    res.json(withUrls);
  } catch { res.status(500).json({ message: "Failed to fetch attachments" }); }
});

router.post("/:id/attachments", upload.single("file"), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ message: "No file provided" }); return; }
    // uploadBuffer generates its own collision-free key and returns it.
    const key = await uploadBuffer(req.file.buffer, req.file.originalname, "tasks", req.file.mimetype);
    const row = await TaskAttachment.create({
      taskId: req.params.id,
      name: req.file.originalname,
      key,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedById: req.user!.userId,
    });
    await logActivity(req.params.id, req.user!.userId, "file_added", `attached ${req.file.originalname}`, { attachmentId: row.id });
    res.status(201).json({ ...row.toJSON(), url: await getPresignedReadUrl(key).catch(() => null) });
  } catch (err) {
    console.error("Attachment upload failed:", err);
    res.status(500).json({ message: "Failed to upload attachment" });
  }
});

router.delete("/:id/attachments/:attachmentId", async (req: AuthRequest, res: Response) => {
  try {
    const row = await TaskAttachment.findOne({ where: { id: req.params.attachmentId, taskId: req.params.id } });
    if (!row) { res.status(404).json({ message: "Attachment not found" }); return; }
    await deleteObject(row.key).catch(() => {});
    const removedName = row.name;
    await row.destroy();
    await logActivity(req.params.id, req.user!.userId, "file_removed", `removed ${removedName}`);
    res.json({ message: "Attachment deleted" });
  } catch { res.status(500).json({ message: "Failed to delete attachment" }); }
});

// --- TIME TRACKING ----------------------------------------------------------

router.get("/:id/time", async (req: AuthRequest, res: Response) => {
  try {
    const rows = await TimeEntry.findAll({
      where: { taskId: req.params.id },
      include: [{ model: User.unscoped(), as: "user", attributes: ["id", "fullName"] }],
      order: [["spentOn", "DESC"]],
    });
    const totalMinutes = rows.reduce((sum, r) => sum + r.minutes, 0);
    res.json({ entries: rows, totalMinutes });
  } catch { res.status(500).json({ message: "Failed to fetch time entries" }); }
});

router.post("/:id/time", async (req: AuthRequest, res: Response) => {
  try {
    const { minutes, note, spentOn } = req.body;
    const mins = Number(minutes);
    if (!Number.isFinite(mins) || mins <= 0) {
      res.status(400).json({ message: "minutes must be a positive number" }); return;
    }
    const entry = await TimeEntry.create({
      taskId: req.params.id,
      userId: req.user!.userId,
      minutes: Math.round(mins),
      note: note?.trim() || null,
      spentOn: spentOn ? new Date(spentOn) : new Date(),
    });
    await logActivity(req.params.id, req.user!.userId, "time_logged", `logged ${Math.round(mins)} min`, { minutes: Math.round(mins) });
    res.status(201).json(entry);
  } catch { res.status(500).json({ message: "Failed to log time" }); }
});

router.delete("/:id/time/:entryId", async (req: AuthRequest, res: Response) => {
  try {
    const entry = await TimeEntry.findOne({ where: { id: req.params.entryId, taskId: req.params.id } });
    if (!entry) { res.status(404).json({ message: "Time entry not found" }); return; }
    if (entry.userId !== req.user!.userId && !hasPermission(req, "work:write")) {
      res.status(403).json({ message: "You can only remove your own time entries" }); return;
    }
    await entry.destroy();
    res.json({ message: "Time entry deleted" });
  } catch { res.status(500).json({ message: "Failed to delete time entry" }); }
});

export default router;
