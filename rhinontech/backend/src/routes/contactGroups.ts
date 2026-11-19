import { Router, Response } from "express";
import { ContactGroup, ContactGroupMember, Lead } from "../models";
import { authenticate, authorizeAny, AuthRequest } from "../middleware/authenticate";
import { resolveSiteContext } from "../middleware/siteContext";
import { sequelize } from "../config/database";
import { Op } from "sequelize";
import { runWorkflowEngineCycle } from "../services/workflowEngine";

const router = Router();

router.use(authenticate);
// Brand-split module: the [domain] the admin is showing scopes every read below.
router.use(resolveSiteContext);

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

// The columns a book of people can be split by. A whitelist: the field name goes into the query.
const SPLIT_FIELDS = ["industry", "location", "source", "title", "emailStatus"] as const;
const MAX_LISTS_PER_SPLIT = 60;
const MEMBER_CHUNK = 5000;

/**
 * POST /contact-groups/split — one list per value of a column, filled with the leads that have it.
 *
 *   { field: "industry", values?: ["Real Estate", ...], minCount?: 20, prefix?: "OKC" }
 *
 * This is how one big import becomes several audiences: upload everything once, then split by industry
 * (or location, source, title) and run a campaign per list. Lists are created under the brand being
 * viewed, because lists are outreach and outreach is per brand, while the leads stay one workspace-wide
 * record. Re-running is safe: an existing list of the same name is topped up, and nobody is added twice.
 */
router.post("/split", writeAccess, async (req: AuthRequest, res: Response) => {
  try {
    const field = SPLIT_FIELDS.find((f) => f === req.body?.field);
    if (!field) {
      res.status(400).json({ message: `Pick what to split by: ${SPLIT_FIELDS.join(", ")}` });
      return;
    }
    const prefix = typeof req.body?.prefix === "string" ? req.body.prefix.trim().slice(0, 60) : "";
    const minCount = Math.max(1, Math.floor(Number(req.body?.minCount)) || 1);
    const wanted: string[] | null = Array.isArray(req.body?.values)
      ? req.body.values.filter((v: unknown): v is string => typeof v === "string" && v !== "")
      : null;

    const found = (await Lead.findAll({
      attributes: [[sequelize.col(field), "value"], [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
      where: { [field]: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] } },
      group: [field],
      raw: true,
    })) as unknown as { value: string; count: string }[];
    const groups = found
      .map((r) => ({ value: String(r.value), count: Number(r.count) }))
      .filter((g) => g.count >= minCount && (!wanted || wanted.includes(g.value)))
      .sort((a, b) => b.count - a.count);

    if (groups.length === 0) {
      res.status(400).json({ message: "No leads match, so there is nothing to split." });
      return;
    }
    if (groups.length > MAX_LISTS_PER_SPLIT) {
      res.status(400).json({
        message: `That would create ${groups.length} lists (the limit is ${MAX_LISTS_PER_SPLIT} at a time). Pick fewer values, or raise the minimum number of leads per list.`,
      });
      return;
    }

    const lists: { id: string; name: string; isNew: boolean; leads: number; members: number }[] = [];
    for (const g of groups) {
      const name = (prefix ? `${prefix} · ${g.value}` : g.value).slice(0, 200);
      const [list, isNew] = await ContactGroup.findOrCreate({
        where: { name },
        defaults: { name, description: `Leads whose ${field} is "${g.value}"`, createdById: req.user!.userId } as any,
      });
      const ids = ((await Lead.findAll({ attributes: ["id"], where: { [field]: g.value }, raw: true })) as unknown as { id: string }[]).map((r) => r.id);
      for (let i = 0; i < ids.length; i += MEMBER_CHUNK) {
        await ContactGroupMember.bulkCreate(
          ids.slice(i, i + MEMBER_CHUNK).map((leadId) => ({ contactGroupId: list.id, leadId, addedById: req.user!.userId })),
          { ignoreDuplicates: true }
        );
      }
      lists.push({ id: list.id, name, isNew, leads: ids.length, members: await ContactGroupMember.count({ where: { contactGroupId: list.id } }) });
    }
    res.status(201).json({ lists, created: lists.filter((l) => l.isNew).length, updated: lists.filter((l) => !l.isNew).length });
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
