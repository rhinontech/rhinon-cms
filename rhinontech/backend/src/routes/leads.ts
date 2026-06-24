import { Router, Response } from "express";
import { Lead, Campaign, CampaignActivity } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { enrichLeadWithAI } from "../services/gemini";
import { draftOutreachForLead } from "../services/salesAgent";
import { fetchWebsiteText } from "../services/research";
import { sequelize } from "../config/database";
import { Op } from "sequelize";

const router = Router();

router.use(authenticate);

// GET /leads - list all leads
router.get("/", authorize("outreach:read"), async (req: AuthRequest, res: Response) => {
  const { status, campaignId, search } = req.query;
  const where: any = {};

  if (status) where.status = status;
  if (campaignId) where.campaignId = campaignId;
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { company: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const leads = await Lead.findAll({
    where,
    include: [{ model: Campaign, as: "campaign", attributes: ["name"] }],
    order: [["addedAt", "DESC"]],
  });

  res.json(leads);
});

// POST /leads - create lead manually
router.post("/", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.create(req.body);
    res.status(201).json(lead);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// POST /leads/import - bulk import leads (rows already mapped client-side from CSV)
router.post("/import", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const incoming: any[] = Array.isArray(req.body?.leads) ? req.body.leads : [];
    if (incoming.length === 0) {
      res.status(400).json({ message: "No leads provided" });
      return;
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
          attributes: ["email", "apolloContactId"],
        })
      : [];
    const existingEmails = new Set(existing.map(e => (e.email || "").toLowerCase()));
    const existingApollo = new Set(existing.map(e => e.apolloContactId).filter(Boolean));

    const toCreate = cleaned.filter(
      c => !existingEmails.has(c.email) && !(c.apolloContactId && existingApollo.has(c.apolloContactId))
    );

    const created = await Lead.bulkCreate(toCreate, { validate: true });

    res.status(201).json({
      total: incoming.length,
      imported: created.length,
      duplicates: incoming.length - errors.length - created.length,
      invalid: errors.length,
      errors: errors.slice(0, 50),
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// POST /leads/bulk-delete - delete many leads by id
router.post("/bulk-delete", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (ids.length === 0) {
    res.status(400).json({ message: "No ids provided" });
    return;
  }
  try {
    const deleted = await sequelize.transaction(async (t) => {
      // Remove dependent activities first (FK has no cascade)
      await CampaignActivity.destroy({ where: { leadId: { [Op.in]: ids } }, transaction: t });
      return Lead.destroy({ where: { id: { [Op.in]: ids } }, transaction: t });
    });
    res.json({ deleted });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// GET /leads/:id - get single lead
router.get("/:id", authorize("outreach:read"), async (req: AuthRequest, res: Response) => {
  const lead = await Lead.findByPk(req.params.id, {
    include: [
      { model: Campaign, as: "campaign" },
      { model: CampaignActivity, as: "activities", order: [["timestamp", "DESC"]] }
    ],
  });

  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }

  res.json(lead);
});

// PUT /leads/:id - update lead
router.put("/:id", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  const lead = await Lead.findByPk(req.params.id);
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }

  await lead.update(req.body);
  res.json(lead);
});

// DELETE /leads/:id - delete lead
router.delete("/:id", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  const lead = await Lead.findByPk(req.params.id);
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }

  await sequelize.transaction(async (t) => {
    await CampaignActivity.destroy({ where: { leadId: lead.id }, transaction: t });
    await lead.destroy({ transaction: t });
  });
  res.json({ message: "Lead deleted" });
});

// POST /leads/:id/enrich - trigger AI enrichment
router.post("/:id/enrich", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
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

// POST /leads/:id/agent-draft - run the sales agent for ONE lead (lets the UI show live, one-at-a-time progress)
router.post("/:id/agent-draft", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  const lead = await Lead.findByPk(req.params.id);
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }
  try {
    const senderName = req.user!.fullName || "Rhinon Labs";
    const result = await draftOutreachForLead(lead, senderName);
    res.json({ lead, result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
