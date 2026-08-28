import { Router, Response } from "express";
import { Op } from "sequelize";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { Project, Team, TeamMember, User } from "../models";
import { getUserTeamIds } from "../services/workAccess";

const router = Router();
router.use(authenticate, authorize("work:read"));

const memberInclude = [
  {
    model: TeamMember,
    as: "members",
    include: [{ model: User, as: "user", attributes: ["id", "fullName", "companyEmail", "department"] }],
  },
];

function isSuperadmin(req: AuthRequest) {
  return req.user?.roleSlug === "superadmin";
}

/** Team owners manage the roster; superadmin can always step in. */
async function canManage(teamId: string, req: AuthRequest): Promise<boolean> {
  if (isSuperadmin(req)) return true;
  const row = await TeamMember.findOne({ where: { teamId, userId: req.user!.userId } });
  return row?.role === "owner";
}

// GET /teams — the teams you belong to. Teams are not a directory: you should
// not be able to enumerate teams you are not in, or their membership.
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const where: Record<string, unknown> = { isArchived: false };
    if (!isSuperadmin(req)) {
      where.id = { [Op.in]: await getUserTeamIds(req.user!.userId) };
    }

    const teams = await Team.findAll({
      where,
      include: memberInclude,
      order: [["createdAt", "DESC"]],
    });

    const teamIds = teams.map((t) => t.id);
    const projects = teamIds.length
      ? await Project.findAll({ where: { teamId: teamIds }, attributes: ["id", "teamId"], raw: true })
      : [];
    const projectCounts = new Map<string, number>();
    for (const p of projects as any[]) {
      projectCounts.set(p.teamId, (projectCounts.get(p.teamId) ?? 0) + 1);
    }

    res.json(teams.map((team) => ({
      ...team.toJSON(),
      projectCount: projectCounts.get(team.id) ?? 0,
    })));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch teams" });
  }
});

// POST /teams — anyone in the Work module can start a team; the creator owns it.
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, memberIds } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ message: "name is required" });
      return;
    }

    const team = await Team.create({
      name: String(name).trim(),
      description: description?.trim() || null,
      createdById: req.user!.userId,
    });

    const ids: string[] = Array.isArray(memberIds)
      ? memberIds.filter((id: unknown): id is string => typeof id === "string" && id !== req.user!.userId)
      : [];

    await TeamMember.bulkCreate([
      { teamId: team.id, userId: req.user!.userId, role: "owner" as const },
      ...ids.map((userId) => ({ teamId: team.id, userId, role: "member" as const })),
    ]);

    const full = await Team.findByPk(team.id, { include: memberInclude });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ message: "Failed to create team" });
  }
});

// GET /teams/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!isSuperadmin(req)) {
      const teamIds = await getUserTeamIds(req.user!.userId);
      if (!teamIds.includes(req.params.id)) {
        res.status(404).json({ message: "Team not found" });
        return;
      }
    }
    const team = await Team.findByPk(req.params.id, { include: memberInclude });
    if (!team) {
      res.status(404).json({ message: "Team not found" });
      return;
    }
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch team" });
  }
});

// PUT /teams/:id
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) {
      res.status(404).json({ message: "Team not found" });
      return;
    }
    if (!(await canManage(team.id, req))) {
      res.status(403).json({ message: "Only a team owner can change the team" });
      return;
    }

    const { name, description, isArchived } = req.body;
    await team.update({
      ...(name !== undefined && { name: String(name).trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(isArchived !== undefined && { isArchived: Boolean(isArchived) }),
    });

    const full = await Team.findByPk(team.id, { include: memberInclude });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: "Failed to update team" });
  }
});

// DELETE /teams/:id — archived, not destroyed, so projects filed under it keep
// resolving. Refused while team-visible projects still point at it.
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) {
      res.status(404).json({ message: "Team not found" });
      return;
    }
    if (!(await canManage(team.id, req))) {
      res.status(403).json({ message: "Only a team owner can delete the team" });
      return;
    }

    const attached = await Project.count({ where: { teamId: team.id, visibility: "team" } });
    if (attached > 0) {
      res.status(409).json({
        message: `This team still has ${attached} project${attached === 1 ? "" : "s"}. Move or change their visibility first.`,
      });
      return;
    }

    await team.update({ isArchived: true });
    res.json({ message: "Team archived" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete team" });
  }
});

// POST /teams/:id/members  { userIds: string[] }
router.post("/:id/members", async (req: AuthRequest, res: Response) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) {
      res.status(404).json({ message: "Team not found" });
      return;
    }
    if (!(await canManage(team.id, req))) {
      res.status(403).json({ message: "Only a team owner can manage members" });
      return;
    }

    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ message: "userIds array is required" });
      return;
    }

    const existing = await TeamMember.findAll({ where: { teamId: team.id }, attributes: ["userId"], raw: true });
    const already = new Set((existing as any[]).map((r) => r.userId));
    const toAdd = userIds.filter((id: unknown): id is string => typeof id === "string" && !already.has(id));

    if (toAdd.length) {
      await TeamMember.bulkCreate(toAdd.map((userId) => ({ teamId: team.id, userId, role: "member" as const })));
    }

    const full = await Team.findByPk(team.id, { include: memberInclude });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: "Failed to add members" });
  }
});

// PUT /teams/:id/members/:userId  { role }
router.put("/:id/members/:userId", async (req: AuthRequest, res: Response) => {
  try {
    if (!(await canManage(req.params.id, req))) {
      res.status(403).json({ message: "Only a team owner can manage members" });
      return;
    }
    const { role } = req.body;
    if (role !== "owner" && role !== "member") {
      res.status(400).json({ message: "role must be 'owner' or 'member'" });
      return;
    }

    const member = await TeamMember.findOne({ where: { teamId: req.params.id, userId: req.params.userId } });
    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    // Never let the last owner demote themselves — the team would be unmanageable.
    if (member.role === "owner" && role === "member") {
      const owners = await TeamMember.count({ where: { teamId: req.params.id, role: "owner" } });
      if (owners <= 1) {
        res.status(409).json({ message: "A team needs at least one owner" });
        return;
      }
    }

    await member.update({ role });
    const full = await Team.findByPk(req.params.id, { include: memberInclude });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: "Failed to update member" });
  }
});

// DELETE /teams/:id/members/:userId — also how you leave a team yourself.
router.delete("/:id/members/:userId", async (req: AuthRequest, res: Response) => {
  try {
    const isSelf = req.params.userId === req.user!.userId;
    if (!isSelf && !(await canManage(req.params.id, req))) {
      res.status(403).json({ message: "Only a team owner can remove members" });
      return;
    }

    const member = await TeamMember.findOne({ where: { teamId: req.params.id, userId: req.params.userId } });
    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    if (member.role === "owner") {
      const owners = await TeamMember.count({ where: { teamId: req.params.id, role: "owner" } });
      if (owners <= 1) {
        res.status(409).json({ message: "A team needs at least one owner" });
        return;
      }
    }

    await member.destroy();
    res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove member" });
  }
});

export default router;
