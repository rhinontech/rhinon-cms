import { Router, Response } from "express";
import { Op } from "sequelize";
import { Deal, PipelineStage, Account, Lead, User, Activity, Task } from "../models";
import { authenticate, authorizeAny, AuthRequest } from "../middleware/authenticate";

const router = Router();
router.use(authenticate);

const readAccess = authorizeAny("crm:read", "outreach:read");
const writeAccess = authorizeAny("crm:write", "outreach:write");

const OWNER_ATTRS = ["id", "fullName", "companyEmail"];
const DEAL_INCLUDES = [
  { model: PipelineStage, as: "stage" },
  { model: Account, as: "account", attributes: ["id", "name", "domain"] },
  { model: Lead, as: "primaryLead", attributes: ["id", "name", "email", "title"] },
  { model: User, as: "owner", attributes: OWNER_ATTRS },
];

/**
 * Moving a deal into a Won/Lost stage is what closes it. Keeping `status` and
 * `closedAt` derived from the stage (rather than set independently) means the
 * board can never disagree with the reports.
 */
async function applyStageChange(deal: Deal, stage: PipelineStage, userId: string, lostReason?: string | null) {
  const fromStageId = deal.stageId;
  const isClosing = stage.type !== "Open";

  await deal.update({
    stageId: stage.id,
    status: stage.type,
    closedAt: isClosing ? (deal.closedAt || new Date()) : null,
    ...(stage.type === "Lost" && lostReason !== undefined ? { lostReason } : {}),
    ...(stage.type === "Open" ? { lostReason: null } : {}),
  });

  const from = fromStageId ? await PipelineStage.findByPk(fromStageId) : null;
  await Activity.create({
    dealId: deal.id,
    leadId: deal.primaryLeadId,
    accountId: deal.accountId,
    userId,
    type: "StageChange",
    subject: `${from?.name || "—"} → ${stage.name}`,
    body: stage.type === "Lost" && lostReason ? `Lost reason: ${lostReason}` : null,
    metadata: { fromStageId, toStageId: stage.id, fromStage: from?.name || null, toStage: stage.name, stageType: stage.type },
  });
}

// ---------------------------------------------------------------------------
// Stages  (mounted before /:id so "stages" is never read as a deal id)
// ---------------------------------------------------------------------------

router.get("/stages", readAccess, async (_req: AuthRequest, res: Response) => {
  const stages = await PipelineStage.findAll({ order: [["position", "ASC"]] });
  res.json(stages);
});

router.post("/stages", writeAccess, async (req: AuthRequest, res: Response) => {
  try {
    const max = (await PipelineStage.max("position")) as number | null;
    const stage = await PipelineStage.create({
      ...req.body,
      position: req.body?.position ?? (typeof max === "number" ? max + 1 : 0),
    });
    res.status(201).json(stage);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/stages/reorder", writeAccess, async (req: AuthRequest, res: Response) => {
  const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (!ids.length) {
    res.status(400).json({ message: "No ids provided" });
    return;
  }
  await Promise.all(ids.map((id, i) => PipelineStage.update({ position: i }, { where: { id } })));
  res.json(await PipelineStage.findAll({ order: [["position", "ASC"]] }));
});

router.put("/stages/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const stage = await PipelineStage.findByPk(req.params.id);
  if (!stage) {
    res.status(404).json({ message: "Stage not found" });
    return;
  }
  await stage.update(req.body);
  // Deals sitting in this stage inherit a changed Open/Won/Lost meaning.
  if (req.body?.type) {
    await Deal.update({ status: stage.type }, { where: { stageId: stage.id } });
  }
  res.json(stage);
});

router.delete("/stages/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const stage = await PipelineStage.findByPk(req.params.id);
  if (!stage) {
    res.status(404).json({ message: "Stage not found" });
    return;
  }
  const inUse = await Deal.count({ where: { stageId: stage.id } });
  if (inUse > 0) {
    res.status(409).json({ message: `${inUse} deal(s) are in this stage. Move them first.` });
    return;
  }
  await stage.destroy();
  res.json({ message: "Stage deleted" });
});

// ---------------------------------------------------------------------------
// Board + deals
// ---------------------------------------------------------------------------

// GET /deals/board - stages, each with its open deals and a value subtotal
router.get("/board", readAccess, async (req: AuthRequest, res: Response) => {
  const { ownerId, includeClosed } = req.query;
  const where: any = {};
  if (ownerId) where.ownerId = ownerId;
  if (!includeClosed) where.status = "Open";

  const [stages, deals] = await Promise.all([
    PipelineStage.findAll({ order: [["position", "ASC"]] }),
    Deal.findAll({ where, include: DEAL_INCLUDES, order: [["updatedAt", "DESC"]] }),
  ]);

  const byStage = new Map<string, Deal[]>();
  for (const d of deals) {
    if (!d.stageId) continue;
    if (!byStage.has(d.stageId)) byStage.set(d.stageId, []);
    byStage.get(d.stageId)!.push(d);
  }

  res.json({
    stages: stages.map((s) => {
      const list = byStage.get(s.id) || [];
      const value = list.reduce((sum, d) => sum + Number(d.value || 0), 0);
      return {
        ...s.toJSON(),
        deals: list,
        dealCount: list.length,
        totalValue: value,
        // Value discounted by the stage's probability — a crude forecast, but
        // the same one every CRM shows.
        weightedValue: Math.round((value * s.probability) / 100),
      };
    }),
    // Deals with no stage yet would otherwise be invisible on the board.
    unstaged: deals.filter((d) => !d.stageId),
  });
});

// GET /deals
router.get("/", readAccess, async (req: AuthRequest, res: Response) => {
  const { status, ownerId, accountId, leadId, stageId, search, limit, offset } = req.query;
  const where: any = {};
  if (status) where.status = status;
  if (ownerId) where.ownerId = ownerId;
  if (accountId) where.accountId = accountId;
  if (leadId) where.primaryLeadId = leadId;
  if (stageId) where.stageId = stageId;
  if (search) where.title = { [Op.iLike]: `%${search}%` };

  const { rows, count } = await Deal.findAndCountAll({
    where,
    include: DEAL_INCLUDES,
    order: [["updatedAt", "DESC"]],
    limit: Math.min(parseInt((limit as string) || "100", 10) || 100, 200),
    offset: parseInt((offset as string) || "0", 10) || 0,
  });
  res.json({ rows, count });
});

// GET /deals/:id
router.get("/:id", readAccess, async (req: AuthRequest, res: Response) => {
  const deal = await Deal.findByPk(req.params.id, {
    include: [
      ...DEAL_INCLUDES,
      { model: Task, as: "tasks" },
      { model: Activity, as: "timeline", include: [{ model: User, as: "user", attributes: OWNER_ATTRS }] },
    ],
    order: [[{ model: Activity, as: "timeline" }, "occurredAt", "DESC"]],
  });
  if (!deal) {
    res.status(404).json({ message: "Deal not found" });
    return;
  }
  res.json(deal);
});

// POST /deals
router.post("/", writeAccess, async (req: AuthRequest, res: Response) => {
  try {
    // Default to the first stage so a new deal always lands on the board.
    let stageId = req.body?.stageId;
    if (!stageId) {
      const first = await PipelineStage.findOne({ where: { type: "Open" }, order: [["position", "ASC"]] });
      stageId = first?.id ?? null;
    }
    const stage = stageId ? await PipelineStage.findByPk(stageId) : null;

    const deal = await Deal.create({
      ...req.body,
      stageId,
      status: stage?.type || "Open",
      ownerId: req.body?.ownerId ?? req.user!.userId,
      createdById: req.user!.userId,
    });

    await Activity.create({
      dealId: deal.id,
      leadId: deal.primaryLeadId,
      accountId: deal.accountId,
      userId: req.user!.userId,
      type: "System",
      subject: `Deal created: ${deal.title}`,
      metadata: { value: Number(deal.value || 0), currency: deal.currency },
    });

    res.status(201).json(await Deal.findByPk(deal.id, { include: DEAL_INCLUDES }));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /deals/:id
router.put("/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const deal = await Deal.findByPk(req.params.id);
  if (!deal) {
    res.status(404).json({ message: "Deal not found" });
    return;
  }
  try {
    const { stageId, lostReason, ...rest } = req.body || {};

    if (stageId && stageId !== deal.stageId) {
      const stage = await PipelineStage.findByPk(stageId);
      if (!stage) {
        res.status(400).json({ message: "Unknown stage" });
        return;
      }
      await applyStageChange(deal, stage, req.user!.userId, lostReason);
    } else if (lostReason !== undefined) {
      await deal.update({ lostReason });
    }

    if (Object.keys(rest).length) {
      // status/closedAt are derived from the stage — never taken from the client.
      delete rest.status;
      delete rest.closedAt;
      await deal.update(rest);
    }

    res.json(await Deal.findByPk(deal.id, { include: DEAL_INCLUDES }));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /deals/:id
router.delete("/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const deal = await Deal.findByPk(req.params.id);
  if (!deal) {
    res.status(404).json({ message: "Deal not found" });
    return;
  }
  await Activity.destroy({ where: { dealId: deal.id } });
  await Task.update({ dealId: null }, { where: { dealId: deal.id } });
  await deal.destroy();
  res.json({ message: "Deal deleted" });
});

export default router;
