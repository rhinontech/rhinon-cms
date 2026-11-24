import { Router, Response } from "express";
import { Op } from "sequelize";
import { authenticate, authorizeAny, requireInternal, AuthRequest } from "../middleware/authenticate";
import { Project, Sprint, Task, Team, User } from "../models";
import { canAccessProject, canUseVisibility, getUserTeamIds, isGuest } from "../services/workAccess";

const router = Router();
router.use(authenticate, authorizeAny("work:read"));

const sprintIncludes = [
  { model: Project, as: "project", attributes: ["id", "name", "status"] },
  { model: Team, as: "team", attributes: ["id", "name"] },
  { model: User, as: "creator", attributes: ["id", "fullName"] },
];

function isSuperadmin(req: AuthRequest): boolean {
  return req.user?.roleSlug === "superadmin";
}

/** Whether this sprint is visible to the caller — mirrors project/team visibility. */
async function canAccessSprint(sprint: Sprint, req: AuthRequest): Promise<boolean> {
  if (sprint.projectId) return canAccessProject(sprint.projectId, req);
  // Unattached (company-wide or team-only) sprints are internal-only, same rule
  // as unattached tasks: a guest has no project to be granted access through.
  if (isGuest(req)) return false;
  if (!sprint.teamId) return true;
  if (isSuperadmin(req)) return true;
  return (await getUserTeamIds(req.user!.userId)).includes(sprint.teamId);
}

/** Counts for the sprint list/board — one grouped pass instead of N queries. */
async function attachCounts(sprints: Sprint[]) {
  const ids = sprints.map((s) => s.id);
  if (!ids.length) return [];
  const rows = (await Task.findAll({
    where: { sprintId: { [Op.in]: ids } },
    attributes: ["sprintId", "status"],
    raw: true,
  })) as unknown as Array<{ sprintId: string; status: string }>;

  const counts = new Map<string, { total: number; done: number }>();
  for (const row of rows) {
    const c = counts.get(row.sprintId) ?? { total: 0, done: 0 };
    c.total += 1;
    if (row.status === "Done") c.done += 1;
    counts.set(row.sprintId, c);
  }

  return sprints.map((s) => {
    const json = s.toJSON() as unknown as Record<string, unknown>;
    const c = counts.get(s.id) ?? { total: 0, done: 0 };
    return { ...json, taskCount: c.total, doneCount: c.done };
  });
}

// GET /sprints
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, teamId, status } = req.query;
    const where: Record<string, unknown> = {};
    if (projectId && typeof projectId === "string") where.projectId = projectId;
    if (teamId && typeof teamId === "string") where.teamId = teamId;
    if (status && typeof status === "string") where.status = status;

    const rows = await Sprint.findAll({ where, include: sprintIncludes, order: [["startDate", "DESC"]] });
    const visible: Sprint[] = [];
    for (const row of rows) {
      if (await canAccessSprint(row, req)) visible.push(row);
    }
    res.json(await attachCounts(visible));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sprints" });
  }
});

// GET /sprints/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const sprint = await Sprint.findByPk(req.params.id, { include: sprintIncludes });
    if (!sprint || !(await canAccessSprint(sprint, req))) {
      res.status(404).json({ message: "Sprint not found" }); return;
    }
    const [withCounts] = await attachCounts([sprint]);
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sprint" });
  }
});

// POST /sprints
router.post("/", requireInternal, async (req: AuthRequest, res: Response) => {
  try {
    const { name, goal, projectId, teamId, startDate, endDate, status } = req.body;
    if (!name?.trim()) { res.status(400).json({ message: "name is required" }); return; }
    if (!startDate || !endDate) { res.status(400).json({ message: "startDate and endDate are required" }); return; }
    if (new Date(endDate) < new Date(startDate)) {
      res.status(400).json({ message: "End date must be on or after the start date" }); return;
    }
    if (projectId && !(await canAccessProject(projectId, req))) {
      res.status(404).json({ message: "Project not found" }); return;
    }
    if (teamId) {
      const allowed = await canUseVisibility("team", teamId, req);
      if (!allowed.ok) { res.status(403).json({ message: allowed.message }); return; }
    }

    const sprint = await Sprint.create({
      name: name.trim(),
      goal: goal || null,
      projectId: projectId || null,
      teamId: teamId || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || "planning",
      createdById: req.user!.userId,
    });

    const full = await Sprint.findByPk(sprint.id, { include: sprintIncludes });
    res.status(201).json({ ...(full!.toJSON() as object), taskCount: 0, doneCount: 0 });
  } catch (err) {
    res.status(500).json({ message: "Failed to create sprint" });
  }
});

// PUT /sprints/:id
router.put("/:id", requireInternal, async (req: AuthRequest, res: Response) => {
  try {
    const sprint = await Sprint.findByPk(req.params.id);
    if (!sprint || !(await canAccessSprint(sprint, req))) {
      res.status(404).json({ message: "Sprint not found" }); return;
    }

    const { name, goal, projectId, teamId, startDate, endDate, status } = req.body;
    if (projectId !== undefined && projectId && !(await canAccessProject(projectId, req))) {
      res.status(404).json({ message: "Project not found" }); return;
    }
    if (teamId !== undefined && teamId) {
      const allowed = await canUseVisibility("team", teamId, req);
      if (!allowed.ok) { res.status(403).json({ message: allowed.message }); return; }
    }
    const nextStart = startDate ? new Date(startDate) : sprint.startDate;
    const nextEnd = endDate ? new Date(endDate) : sprint.endDate;
    if (nextEnd < nextStart) {
      res.status(400).json({ message: "End date must be on or after the start date" }); return;
    }

    await sprint.update({
      name: name?.trim() || sprint.name,
      goal: goal !== undefined ? (goal || null) : sprint.goal,
      projectId: projectId !== undefined ? (projectId || null) : sprint.projectId,
      teamId: teamId !== undefined ? (teamId || null) : sprint.teamId,
      startDate: nextStart,
      endDate: nextEnd,
      status: status || sprint.status,
    });

    const full = await Sprint.findByPk(sprint.id, { include: sprintIncludes });
    const [withCounts] = await attachCounts([full!]);
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: "Failed to update sprint" });
  }
});

// DELETE /sprints/:id
router.delete("/:id", requireInternal, authorizeAny("work:write"), async (req: AuthRequest, res: Response) => {
  try {
    const sprint = await Sprint.findByPk(req.params.id);
    if (!sprint || !(await canAccessSprint(sprint, req))) {
      res.status(404).json({ message: "Sprint not found" }); return;
    }
    // Detach rather than cascade — deleting a sprint must never delete work.
    await Task.update({ sprintId: null }, { where: { sprintId: sprint.id } });
    await sprint.destroy();
    res.json({ message: "Sprint deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete sprint" });
  }
});

export default router;
