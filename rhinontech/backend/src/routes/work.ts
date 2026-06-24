import { Router, Response } from "express";
import { Op, fn, col } from "sequelize";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { ClientRequest, Project, Task, User } from "../models";

const router = Router();
router.use(authenticate);

const projectIncludes = [
  { model: User, as: "creator", attributes: ["id", "fullName"] },
];

const requestIncludes = [
  { model: Project, as: "project", attributes: ["id", "name", "status"] },
  { model: User, as: "creator", attributes: ["id", "fullName"] },
];

router.get("/overview", async (_req: AuthRequest, res: Response) => {
  try {
    const [totalTasks, totalProjects, openRequests, activeProjects, recentRequests] = await Promise.all([
      Task.count(),
      Project.count(),
      ClientRequest.count({ where: { status: { [Op.in]: ["Open", "In review", "In progress"] } } }),
      Project.count({ where: { status: "Active" } }),
      ClientRequest.findAll({
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

router.get("/projects", async (_req: AuthRequest, res: Response) => {
  try {
    const projects = await Project.findAll({
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
    const { name, status, pointOfContact, notes } = req.body;

    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    const project = await Project.create({
      name: String(name).trim(),
      status: status || "Active",
      pointOfContact: pointOfContact || undefined,
      notes: notes || undefined,
      createdById: req.user!.userId,
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
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const { name, status, pointOfContact, notes } = req.body;
    await project.update({
      ...(name !== undefined && { name: String(name).trim() }),
      ...(status !== undefined && { status }),
      ...(pointOfContact !== undefined && { pointOfContact }),
      ...(notes !== undefined && { notes }),
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
      where,
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
    if (!request) {
      res.status(404).json({ message: "Client request not found" });
      return;
    }

    const { title, description, type, status, priority, projectId, reportedBy } = req.body;
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
      where: { id: requestIds },
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
