import { Router, Response } from "express";
import { Lead, Campaign, CampaignActivity, ContactGroup, ContactGroupMember, Account, Deal, PipelineStage, Activity, User, Task, InboxEmail, WorkflowEnrollment } from "../models";
import { findOrCreateAccountForLead } from "./accounts";
import { authenticate, authorizeAny, AuthRequest } from "../middleware/authenticate";
import { enrichLeadWithAI } from "../services/gemini";
import { fetchWebsiteText } from "../services/research";
import { sequelize } from "../config/database";
import { Op } from "sequelize";
import { runWorkflowEngineCycle } from "../services/workflowEngine";

const router = Router();

router.use(authenticate);

const OWNER_ATTRS = ["id", "fullName", "companyEmail"];
const LIST_INCLUDES = [
  { model: Campaign, as: "campaign", attributes: ["name"] },
  { model: User, as: "owner", attributes: OWNER_ATTRS },
  { model: Account, as: "account", attributes: ["id", "name", "domain"] },
];

const readAccess = authorizeAny("crm:read", "outreach:read");
const writeAccess = authorizeAny("crm:write", "outreach:write");

/**
 * Clears everything that points at a set of leads, before they're destroyed.
 *
 * Split by intent rather than blanket-deleting: history that only makes sense
 * against the lead goes away with it, while records that stand on their own —
 * a deal worth real money, a task someone still has to do, an email already in
 * the inbox — survive with the link nulled out.
 */
async function detachLeadReferences(ids: string[], transaction: any) {
  const where = { leadId: { [Op.in]: ids } };

  // Sequential, not Promise.all: a transaction is pinned to one connection, so
  // firing these concurrently would interleave statements on it.

  // Lead-scoped history: meaningless once the lead is gone.
  await Activity.destroy({ where, transaction });
  await CampaignActivity.destroy({ where, transaction });
  await ContactGroupMember.destroy({ where, transaction });

  // Independently meaningful: keep the record, drop the pointer.
  await Deal.update({ primaryLeadId: null }, { where: { primaryLeadId: { [Op.in]: ids } }, transaction });
  await Task.update({ leadId: null }, { where, transaction });
  await InboxEmail.update({ leadId: null }, { where, transaction });
  await WorkflowEnrollment.update({ leadId: null }, { where, transaction });
}

// GET /leads - list leads. Supports status/campaignId/source/search filters.
// Pagination (limit/offset) is opt-in: pass `limit` to get `{ rows, count }`;
// omit it to get the legacy plain-array shape used by existing Outreach callers.
router.get("/", readAccess, async (req: AuthRequest, res: Response) => {
  const { status, campaignId, source, search, limit, offset, idsOnly, ownerId, lifecycleStage, accountId } = req.query;
  const where: any = {};

  if (status) where.status = status;
  if (campaignId) where.campaignId = campaignId;
  if (source) where.source = source;
  if (ownerId) where.ownerId = ownerId === "unassigned" ? (null as any) : ownerId;
  if (lifecycleStage) where.lifecycleStage = lifecycleStage;
  if (accountId) where.accountId = accountId;
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
      include: LIST_INCLUDES,
      order: [["addedAt", "DESC"]],
      limit: Math.min(parseInt(limit as string, 10) || 50, 200),
      offset: parseInt((offset as string) || "0", 10) || 0,
    });
    res.json({ rows, count });
    return;
  }

  const leads = await Lead.findAll({
    where,
    include: LIST_INCLUDES,
    order: [["addedAt", "DESC"]],
  });

  res.json(leads);
});

// GET /leads/sources - distinct lead source values, for the CRM filter dropdown
router.get("/sources", readAccess, async (_req: AuthRequest, res: Response) => {
  const rows = await Lead.findAll({
    attributes: [[sequelize.fn("DISTINCT", sequelize.col("source")), "source"]],
    where: { source: { [Op.ne]: null as any } },
    order: [["source", "ASC"]],
    raw: true,
  });
  res.json((rows as any[]).map((r) => r.source).filter(Boolean));
});

// POST /leads - create lead manually
router.post("/", writeAccess, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.create({ ...req.body, ownerId: req.body?.ownerId ?? req.user!.userId });

    // Group the new contact under its company automatically.
    if (!lead.accountId) {
      const account = await findOrCreateAccountForLead(lead, req.user!.userId);
      if (account) await lead.update({ accountId: account.id });
    }

    res.status(201).json(await Lead.findByPk(lead.id, { include: LIST_INCLUDES }));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// POST /leads/import - bulk import leads (rows already mapped client-side from CSV)
router.post("/import", writeAccess, async (req: AuthRequest, res: Response) => {
  try {
    const incoming: any[] = Array.isArray(req.body?.leads) ? req.body.leads : [];
    if (incoming.length === 0) {
      res.status(400).json({ message: "No leads provided" });
      return;
    }

    // Optional: land the imported rows directly into a contact group ("contact list import")
    let targetGroup: ContactGroup | null = null;
    if (req.body?.contactGroupId) {
      targetGroup = await ContactGroup.findByPk(req.body.contactGroupId);
      if (!targetGroup) {
        res.status(404).json({ message: "Contact group not found" });
        return;
      }
    } else if (req.body?.newGroupName && req.body.newGroupName.trim()) {
      [targetGroup] = await ContactGroup.findOrCreate({
        where: { name: req.body.newGroupName.trim() },
        defaults: { name: req.body.newGroupName.trim(), createdById: req.user!.userId },
      });
    }

    const str = (v: any): string | null => {
      const s = (v ?? "").toString().trim();
      return s === "" ? null : s;
    };
    const int = (v: any): number | null => {
      const n = parseInt((v ?? "").toString().replace(/[^0-9]/g, ""), 10);
      return Number.isFinite(n) ? n : null;
    };

    const errors: { row: number; reason: string }[] = [];
    const seenEmails = new Set<string>();
    const cleaned: any[] = [];

    incoming.forEach((raw, i) => {
      const name = str(raw.name);
      const email = str(raw.email);
      if (!email) { errors.push({ row: i + 1, reason: "Missing email" }); return; }
      if (!name) { errors.push({ row: i + 1, reason: "Missing name" }); return; }

      const key = email.toLowerCase();
      if (seenEmails.has(key)) return; // duplicate within the uploaded file
      seenEmails.add(key);

      cleaned.push({
        name,
        email: key,
        company: str(raw.company) ?? "—",
        title: str(raw.title),
        linkedinUrl: str(raw.linkedinUrl),
        phone: str(raw.phone),
        seniority: str(raw.seniority),
        department: str(raw.department),
        industry: str(raw.industry),
        employeeCount: int(raw.employeeCount),
        location: str(raw.location),
        website: str(raw.website),
        companyLinkedinUrl: str(raw.companyLinkedinUrl),
        emailStatus: str(raw.emailStatus),
        emailConfidence: str(raw.emailConfidence),
        keywords: str(raw.keywords),
        technologies: str(raw.technologies),
        annualRevenue: str(raw.annualRevenue),
        apolloContactId: str(raw.apolloContactId),
        raw: raw.raw && typeof raw.raw === "object" ? raw.raw : null,
        source: str(raw.source) ?? "CSV Import",
        status: "New",
      });
    });

    // Skip rows that already exist (match on email or Apollo contact id)
    const apolloIds = cleaned.map(c => c.apolloContactId).filter(Boolean) as string[];
    const existing = cleaned.length
      ? await Lead.findAll({
          where: {
            [Op.or]: [
              { email: { [Op.in]: cleaned.map(c => c.email) } },
              ...(apolloIds.length ? [{ apolloContactId: { [Op.in]: apolloIds } }] : []),
            ],
          },
          attributes: ["id", "email", "apolloContactId"],
        })
      : [];
    const existingEmails = new Set(existing.map(e => (e.email || "").toLowerCase()));
    const existingApollo = new Set(existing.map(e => e.apolloContactId).filter(Boolean));

    const toCreate = cleaned.filter(
      c => !existingEmails.has(c.email) && !(c.apolloContactId && existingApollo.has(c.apolloContactId))
    );

    const created = await Lead.bulkCreate(toCreate, { validate: true });

    const allImportedIds = [...created.map(l => l.id), ...existing.map(e => e.id)];

    if (req.body?.campaignId && allImportedIds.length) {
      const campaign = await Campaign.findByPk(req.body.campaignId);
      if (campaign) {
        await Lead.update(
          { campaignId: campaign.id, status: "Enrolled", aiDraft: null },
          { where: { id: { [Op.in]: allImportedIds } } }
        );
        const newTotal = await Lead.count({ where: { campaignId: campaign.id } });
        await campaign.update({ leadsTotal: newTotal });
      }
    }

    let addedToGroup = 0;
    if (targetGroup) {
      // Rows that matched an already-existing lead should still land in the target
      // list, not be silently dropped, so the "list" reflects everything in the CSV.
      if (allImportedIds.length) {
        await ContactGroupMember.bulkCreate(
          allImportedIds.map(leadId => ({ contactGroupId: targetGroup!.id, leadId, addedById: req.user!.userId })),
          { ignoreDuplicates: true }
        );
        addedToGroup = allImportedIds.length;
        runWorkflowEngineCycle().catch((err) => console.error("[Leads Import] Auto-enrollment error:", err));
      }
    }

    res.status(201).json({
      total: incoming.length,
      imported: created.length,
      duplicates: incoming.length - errors.length - created.length,
      invalid: errors.length,
      errors: errors.slice(0, 50),
      ...(targetGroup ? { contactGroupId: targetGroup.id, addedToGroup } : {}),
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// POST /leads/bulk-delete - delete many leads by id
router.post("/bulk-delete", writeAccess, async (req: AuthRequest, res: Response) => {
  const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (ids.length === 0) {
    res.status(400).json({ message: "No ids provided" });
    return;
  }
  try {
    const deleted = await sequelize.transaction(async (t) => {
      // Dependents first — the FKs have no cascade.
      await detachLeadReferences(ids, t);
      return Lead.destroy({ where: { id: { [Op.in]: ids } }, transaction: t });
    });
    res.json({ deleted });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// GET /leads/:id - get single lead
router.get("/:id", readAccess, async (req: AuthRequest, res: Response) => {
  const lead = await Lead.findByPk(req.params.id, {
    include: [
      { model: Campaign, as: "campaign" },
      { model: CampaignActivity, as: "activities", order: [["timestamp", "DESC"]] },
      { model: User, as: "owner", attributes: OWNER_ATTRS },
      { model: Account, as: "account" },
      { model: Deal, as: "deals", include: [{ model: PipelineStage, as: "stage" }] },
      { model: Task, as: "tasks" },
    ],
  });

  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }

  res.json(lead);
});

// PUT /leads/:id - update lead
router.put("/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const lead = await Lead.findByPk(req.params.id);
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }

  const before = { lifecycleStage: lead.lifecycleStage, ownerId: lead.ownerId };
  await lead.update(req.body);

  // Ownership and qualification changes are the two things a sales manager
  // asks "who did that, and when" about, so both are written to the timeline.
  if (req.body?.lifecycleStage && req.body.lifecycleStage !== before.lifecycleStage) {
    await Activity.create({
      leadId: lead.id,
      accountId: lead.accountId,
      userId: req.user!.userId,
      type: "LifecycleChange",
      subject: `${before.lifecycleStage} \u2192 ${lead.lifecycleStage}`,
      metadata: { from: before.lifecycleStage, to: lead.lifecycleStage },
    });
  }
  if (req.body?.ownerId !== undefined && req.body.ownerId !== before.ownerId) {
    const [fromUser, toUser] = await Promise.all([
      before.ownerId ? User.findByPk(before.ownerId, { attributes: OWNER_ATTRS }) : null,
      lead.ownerId ? User.findByPk(lead.ownerId, { attributes: OWNER_ATTRS }) : null,
    ]);
    await Activity.create({
      leadId: lead.id,
      accountId: lead.accountId,
      userId: req.user!.userId,
      type: "OwnerChange",
      subject: `${fromUser?.fullName || "Unassigned"} \u2192 ${toUser?.fullName || "Unassigned"}`,
      metadata: { from: before.ownerId, to: lead.ownerId },
    });
  }

  res.json(await Lead.findByPk(lead.id, { include: LIST_INCLUDES }));
});

// DELETE /leads/:id - delete lead
router.delete("/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const lead = await Lead.findByPk(req.params.id);
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }

  await sequelize.transaction(async (t) => {
    await detachLeadReferences([lead.id], t);
    await lead.destroy({ transaction: t });
  });
  res.json({ message: "Lead deleted" });
});

// POST /leads/:id/enrich - trigger AI enrichment
router.post("/:id/enrich", writeAccess, async (req: AuthRequest, res: Response) => {
  const lead = await Lead.findByPk(req.params.id);
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }

  try {
    const websiteText = await fetchWebsiteText(lead.website);
    const enrichment = await enrichLeadWithAI(lead.name, lead.company, {
      title: lead.title,
      industry: lead.industry,
      keywords: lead.keywords,
      technologies: lead.technologies,
      website: lead.website,
      websiteText,
    });

    if (enrichment.error) {
      res.status(502).json({ message: "Enrichment failed", detail: enrichment.error });
      return;
    }

    // Log Activity
    await CampaignActivity.create({
      leadId: lead.id,
      campaignId: lead.campaignId,
      type: "Enrichment",
      content: enrichment.potentialPainPoint || "Lead enriched with AI intel",
      generatedContent: JSON.stringify(enrichment),
    });

    // Persist enrichment on the lead so it shows without re-running; bump status if New
    await lead.update({
      enrichment,
      ...(lead.status === "New" ? { status: "Enriched" as const } : {}),
    });

    res.json(enrichment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /leads/:id/convert - turn a qualified lead into a deal.
 *
 * This is the step the app previously had no way to express: a won lead was
 * re-typed into a Project by hand. Creating the deal also ensures the lead has
 * an account, and marks it Qualified.
 */
router.post("/:id/convert", writeAccess, async (req: AuthRequest, res: Response) => {
  const lead = await Lead.findByPk(req.params.id);
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }

  try {
    let accountId = lead.accountId;
    if (!accountId) {
      const account = await findOrCreateAccountForLead(lead, req.user!.userId);
      accountId = account?.id ?? null;
      if (accountId) await lead.update({ accountId });
    }

    const stageId =
      req.body?.stageId ||
      (await PipelineStage.findOne({ where: { type: "Open" }, order: [["position", "ASC"]] }))?.id ||
      null;
    const stage = stageId ? await PipelineStage.findByPk(stageId) : null;

    const deal = await Deal.create({
      title: req.body?.title || `${lead.company} — ${lead.name}`,
      accountId,
      primaryLeadId: lead.id,
      ownerId: req.body?.ownerId || lead.ownerId || req.user!.userId,
      value: req.body?.value ?? 0,
      currency: req.body?.currency || "INR",
      stageId,
      status: stage?.type || "Open",
      expectedCloseDate: req.body?.expectedCloseDate || null,
      source: lead.source,
      notes: req.body?.notes || null,
      createdById: req.user!.userId,
    });

    // Converting is itself a qualification decision, so record it.
    if (lead.lifecycleStage !== "Customer") {
      await lead.update({ lifecycleStage: "Qualified" });
    }

    await Activity.create({
      leadId: lead.id,
      dealId: deal.id,
      accountId,
      userId: req.user!.userId,
      type: "System",
      subject: `Converted to deal: ${deal.title}`,
      metadata: { dealId: deal.id, value: Number(deal.value || 0), currency: deal.currency },
    });

    res.status(201).json(
      await Deal.findByPk(deal.id, {
        include: [
          { model: PipelineStage, as: "stage" },
          { model: Account, as: "account", attributes: ["id", "name", "domain"] },
          { model: Lead, as: "primaryLead", attributes: ["id", "name", "email", "title"] },
          { model: User, as: "owner", attributes: OWNER_ATTRS },
        ],
      })
    );
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
