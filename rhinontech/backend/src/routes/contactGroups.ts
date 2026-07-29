import { Router, Response } from "express";
import { ContactGroup, ContactGroupMember, Lead } from "../models";
import { authenticate, authorizeAny, AuthRequest } from "../middleware/authenticate";
import { sequelize } from "../config/database";
import { Op } from "sequelize";
import { runWorkflowEngineCycle } from "../services/workflowEngine";

const router = Router();

router.use(authenticate);

const readAccess = authorizeAny("crm:read", "outreach:read");
const writeAccess = authorizeAny("crm:write", "outreach:write");

// GET /contact-groups - list all groups with member counts
router.get("/", readAccess, async (_req: AuthRequest, res: Response) => {
  const groups = await ContactGroup.findAll({ order: [["name", "ASC"]] });
  const counts = await ContactGroupMember.findAll({
    attributes: ["contactGroupId", [sequelize.fn("COUNT", sequelize.col("id")), "memberCount"]],
    group: ["contactGroupId"],
    raw: true,
  });
  const countByGroup = new Map((counts as any[]).map((c) => [c.contactGroupId, parseInt(c.memberCount, 10)]));
  res.json(groups.map((g) => ({ ...g.toJSON(), memberCount: countByGroup.get(g.id) || 0 })));
});

// POST /contact-groups - create a group
router.post("/", writeAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ message: "name is required" });
      return;
    }
    const group = await ContactGroup.create({ name: name.trim(), description, createdById: req.user!.userId });
    res.status(201).json({ ...group.toJSON(), memberCount: 0 });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// GET /contact-groups/:id - group detail
router.get("/:id", readAccess, async (req: AuthRequest, res: Response) => {
  const group = await ContactGroup.findByPk(req.params.id);
  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }
  const memberCount = await ContactGroupMember.count({ where: { contactGroupId: group.id } });
  res.json({ ...group.toJSON(), memberCount });
});

// PUT /contact-groups/:id - rename/update description
router.put("/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const group = await ContactGroup.findByPk(req.params.id);
  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }
  const { name, description } = req.body;
  await group.update({
    ...(name !== undefined ? { name: name.trim() } : {}),
    ...(description !== undefined ? { description } : {}),
  });
  res.json(group);
});

// DELETE /contact-groups/:id - delete group + its memberships
router.delete("/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const group = await ContactGroup.findByPk(req.params.id);
  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }
  await sequelize.transaction(async (t) => {
    await ContactGroupMember.destroy({ where: { contactGroupId: group.id }, transaction: t });
    await group.destroy({ transaction: t });
  });
  res.json({ message: "Group deleted" });
});

// GET /contact-groups/:id/members - list leads in this group (search/status/source/pagination/idsOnly)
router.get("/:id/members", readAccess, async (req: AuthRequest, res: Response) => {
  const group = await ContactGroup.findByPk(req.params.id);
  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }

  const memberRows = await ContactGroupMember.findAll({ where: { contactGroupId: group.id }, attributes: ["leadId"] });
  const memberLeadIds = memberRows.map((m) => m.leadId);
  if (memberLeadIds.length === 0) {
    if (req.query.idsOnly) {
      res.json({ ids: [] });
      return;
    }
    res.json(req.query.limit ? { rows: [], count: 0 } : []);
    return;
  }

  const { status, source, search, limit, offset, idsOnly } = req.query;
  const where: any = { id: { [Op.in]: memberLeadIds } };

  if (status) where.status = status;
  if (source) where.source = source;
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { company: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (idsOnly) {
    const ids = await Lead.findAll({ where, attributes: ["id"], order: [["addedAt", "DESC"]] });
    res.json({ ids: ids.map((l) => l.id) });
    return;
  }

  if (limit) {
    const { rows, count } = await Lead.findAndCountAll({
      where,
      order: [["addedAt", "DESC"]],
      limit: Math.min(parseInt(limit as string, 10) || 50, 200),
      offset: parseInt((offset as string) || "0", 10) || 0,
    });
    res.json({ rows, count });
    return;
  }

  const leads = await Lead.findAll({ where, order: [["addedAt", "DESC"]] });
  res.json(leads);
});

// POST /contact-groups/:id/members - bulk add leads to the group
router.post("/:id/members", writeAccess, async (req: AuthRequest, res: Response) => {
  const group = await ContactGroup.findByPk(req.params.id);
  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }
  const leadIds: string[] = Array.isArray(req.body?.leadIds) ? req.body.leadIds : [];
  if (leadIds.length === 0) {
    res.status(400).json({ message: "leadIds must be a non-empty array" });
    return;
  }

  await ContactGroupMember.bulkCreate(
    leadIds.map((leadId) => ({ contactGroupId: group.id, leadId, addedById: req.user!.userId })),
    { ignoreDuplicates: true }
  );

  // Instantly trigger auto-enrollment for active workflows monitoring this list
  runWorkflowEngineCycle().catch((err) => console.error("[ContactGroup] Auto-enrollment error:", err));

  const memberCount = await ContactGroupMember.count({ where: { contactGroupId: group.id } });
  res.json({ message: `${leadIds.length} leads added`, memberCount });
});

// POST /contact-groups/:id/members/remove - bulk remove leads from the group
router.post("/:id/members/remove", writeAccess, async (req: AuthRequest, res: Response) => {
  const group = await ContactGroup.findByPk(req.params.id);
  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }
  const leadIds: string[] = Array.isArray(req.body?.leadIds) ? req.body.leadIds : [];
  if (leadIds.length === 0) {
    res.status(400).json({ message: "leadIds must be a non-empty array" });
    return;
  }

  await ContactGroupMember.destroy({ where: { contactGroupId: group.id, leadId: { [Op.in]: leadIds } } });

  const memberCount = await ContactGroupMember.count({ where: { contactGroupId: group.id } });
  res.json({ message: `${leadIds.length} leads removed`, memberCount });
});

export default router;
