import { Router, Response } from "express";
import { Op, fn, col } from "sequelize";
import { authenticate, authorizeAny, AuthRequest } from "../middleware/authenticate";
import { ClientRequest, Project, Task, Team, User } from "../models";
import {
  canAccessProject,
  canUseVisibility,
  mergeWhere,
  projectScopedWhere,
  projectVisibilityWhere,
} from "../services/workAccess";

const router = Router();
// Projects are created from won deals, so CRM reads them too — hence authorizeAny
// rather than a straight work:read gate.
router.use(authenticate, authorizeAny("work:read", "crm:read"));

const projectIncludes = [
  { model: User, as: "creator", attributes: ["id", "fullName"] },
  { model: User, as: "owner", attributes: ["id", "fullName"] },
  { model: Team, as: "team", attributes: ["id", "name"] },
];

const requestIncludes = [
  { model: Project, as: "project", attributes: ["id", "name", "status"] },
  { model: User, as: "creator", attributes: ["id", "fullName"] },
];

router.get("/overview", async (req: AuthRequest, res: Response) => {
  try {
    // Counts leak the *existence* of private work if they're taken raw, so they
    // run through the same visibility filter as the lists below.
    const [projectWhere, scopedWhere] = await Promise.all([
      projectVisibilityWhere(req),
      projectScopedWhere(req),
    ]);

    const [totalTasks, totalProjects, openRequests, activeProjects, recentRequests] = await Promise.all([
      Task.count({ where: scopedWhere }),
      Project.count({ where: projectWhere }),
      ClientRequest.count({
        where: mergeWhere({ status: { [Op.in]: ["Open", "In review", "In progress"] } }, scopedWhere),
      }),
      Project.count({ where: mergeWhere({ status: "Active" }, projectWhere) }),
      ClientRequest.findAll({
        where: scopedWhere,
        include: requestIncludes,
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
    ]);

    res.json({
      totalTasks,
      totalProjects,
      activeProjects,
      openRequests,
      recentRequests,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch work overview" });
  }
});

router.get("/projects", async (req: AuthRequest, res: Response) => {
  try {
    const projects = await Project.findAll({
      where: await projectVisibilityWhere(req),
      include: projectIncludes,
      order: [["updatedAt", "DESC"]],
    });

    const projectIds = projects.map((project) => project.id);
    const [taskCounts, requestCounts] = projectIds.length === 0
      ? [[], []]
      : await Promise.all([
          Task.findAll({
            attributes: ["projectId", [fn("COUNT", col("id")), "count"]],
            where: { projectId: projectIds },
            group: ["projectId"],
            raw: true,
          }),
          ClientRequest.findAll({
            attributes: ["projectId", [fn("COUNT", col("id")), "count"]],
            where: { projectId: projectIds },
            group: ["projectId"],
            raw: true,
          }),
        ]);

    const taskCountMap = new Map(taskCounts.map((row: any) => [row.projectId, Number(row.count)]));
    const requestCountMap = new Map(requestCounts.map((row: any) => [row.projectId, Number(row.count)]));

    res.json(projects.map((project) => ({
      ...project.toJSON(),
      taskCount: taskCountMap.get(project.id) ?? 0,
      requestCount: requestCountMap.get(project.id) ?? 0,
    })));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

router.post("/projects", async (req: AuthRequest, res: Response) => {
  try {
    const { name, status, pointOfContact, notes, visibility, teamId } = req.body;

    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    const nextVisibility = visibility || "workspace";
    const check = await canUseVisibility(nextVisibility, teamId, req);
    if (!check.ok) {
      res.status(403).json({ message: check.message });
      return;
    }

    const project = await Project.create({
      name: String(name).trim(),
      status: status || "Active",
      pointOfContact: pointOfContact || undefined,
      notes: notes || undefined,
      createdById: req.user!.userId,
      ownerId: req.user!.userId,
      visibility: nextVisibility,
      teamId: nextVisibility === "team" ? teamId : null,
    });

    const full = await Project.findByPk(project.id, { include: projectIncludes });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ message: "Failed to create project" });
  }
});

router.put("/projects/:id", async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findByPk(req.params.id);
    // 404 rather than 403 for a project you cannot see — a 403 would confirm it exists.
    if (!project || !(await canAccessProject(project.id, req))) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const { name, status, pointOfContact, notes, visibility, teamId } = req.body;

    // Only the owner (or superadmin) may re-scope a project; members can edit its
    // contents but must not be able to widen or narrow who else can see it.
    const isOwner = (project.ownerId ?? project.createdById) === req.user!.userId;
    const isSuperadmin = req.user?.roleSlug === "superadmin";
    const reScoping =
      (visibility !== undefined && visibility !== project.visibility) ||
      (teamId !== undefined && teamId !== project.teamId);

    if (reScoping) {
      if (!isOwner && !isSuperadmin) {
        res.status(403).json({ message: "Only the project owner can change who can see this project" });
        return;
      }
      const nextVisibility = visibility ?? project.visibility;
      const nextTeamId = teamId !== undefined ? teamId : project.teamId;
      const check = await canUseVisibility(nextVisibility, nextTeamId, req);
      if (!check.ok) {
        res.status(403).json({ message: check.message });
        return;
      }
    }

    await project.update({
      ...(name !== undefined && { name: String(name).trim() }),
      ...(status !== undefined && { status }),
      ...(pointOfContact !== undefined && { pointOfContact }),
      ...(notes !== undefined && { notes }),
      ...(reScoping && {
        visibility: visibility ?? project.visibility,
        teamId: (visibility ?? project.visibility) === "team"
          ? (teamId !== undefined ? teamId : project.teamId)
          : null,
      }),
    });

    const full = await Project.findByPk(project.id, { include: projectIncludes });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: "Failed to update project" });
  }
});

router.get("/requests", async (req: AuthRequest, res: Response) => {
  try {
    const where: Record<string, unknown> = {};
    const { projectId } = req.query;
    if (projectId && typeof projectId === "string") {
      where.projectId = projectId;
    }

    const requests = await ClientRequest.findAll({
      where: mergeWhere(where, await projectScopedWhere(req)),
      include: requestIncludes,
      order: [["createdAt", "DESC"]],
    });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch client requests" });
  }
});

router.post("/requests", async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, type, status, priority, projectId, reportedBy } = req.body;

    if (!title || !description) {
      res.status(400).json({ message: "Title and description are required" });
      return;
    }

    if (projectId && !(await canAccessProject(projectId, req))) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const request = await ClientRequest.create({
      title: String(title).trim(),
      description: String(description).trim(),
      type: type || "Bug",
      status: status || "Open",
      priority: priority || "Medium",
      projectId: projectId || undefined,
      reportedBy: reportedBy || undefined,
      createdById: req.user!.userId,
    });

    const full = await ClientRequest.findByPk(request.id, { include: requestIncludes });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ message: "Failed to create client request" });
  }
});

router.put("/requests/:id", async (req: AuthRequest, res: Response) => {
  try {
    const request = await ClientRequest.findByPk(req.params.id);
    if (!request || !(await canAccessProject(request.projectId, req))) {
      res.status(404).json({ message: "Client request not found" });
      return;
    }

    const { title, description, type, status, priority, projectId, reportedBy } = req.body;

    // Moving a request into a project you cannot see would smuggle it out of view.
    if (projectId !== undefined && projectId && !(await canAccessProject(projectId, req))) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    await request.update({
      ...(title !== undefined && { title: String(title).trim() }),
      ...(description !== undefined && { description: String(description).trim() }),
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(projectId !== undefined && { projectId: projectId || null }),
      ...(reportedBy !== undefined && { reportedBy }),
    });

    const full = await ClientRequest.findByPk(request.id, { include: requestIncludes });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: "Failed to update client request" });
  }
});

router.post("/requests/convert-to-tasks", async (req: AuthRequest, res: Response) => {
  try {
    const { requestIds } = req.body;

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      res.status(400).json({ message: "requestIds array is required and must not be empty" });
      return;
    }

    const requests = await ClientRequest.findAll({
      where: mergeWhere({ id: requestIds }, await projectScopedWhere(req)),
    });

    if (requests.length === 0) {
      res.status(404).json({ message: "No requests found" });
      return;
    }

    const createdTasks = await Promise.all(
      requests.map(async (request) => {
        const task = await Task.create({
          title: request.title,
          description: request.description || undefined,
          projectId: request.projectId || undefined,
          createdById: request.createdById,
          status: "Pending",
        });
        await request.update({ convertedTaskId: task.id, status: "In review" });
        return task;
      })
    );

    res.status(201).json(createdTasks);
  } catch (err) {
    console.error("Failed to convert requests to tasks:", err);
    res.status(500).json({ message: "Failed to convert requests to tasks" });
  }
});

export default router;
