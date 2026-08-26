import { Router, Response } from "express";
import { Op, fn, col } from "sequelize";
import { Account, Lead, Deal, User, Activity } from "../models";
import { normalizeDomain, domainFromEmail } from "../models/Account";
import { authenticate, authorizeAny, AuthRequest } from "../middleware/authenticate";

const router = Router();
router.use(authenticate);

const readAccess = authorizeAny("crm:read", "outreach:read");
const writeAccess = authorizeAny("crm:write", "outreach:write");

const OWNER_ATTRS = ["id", "fullName", "companyEmail"];

/**
 * Finds an account by normalized domain, or creates one. Used by the "group
 * existing leads into accounts" backfill and by lead create/update.
 */
export async function findOrCreateAccountForLead(
  lead: { company?: string | null; email?: string | null; website?: string | null; industry?: string | null; employeeCount?: number | null; location?: string | null; annualRevenue?: string | null; companyLinkedinUrl?: string | null },
  createdById?: string | null
): Promise<Account | null> {
  const domain = normalizeDomain(lead.website) || domainFromEmail(lead.email);
  const name = (lead.company || "").trim();

  // With no domain and no usable company name there is nothing to key on.
  if (!domain && (!name || name === "—")) return null;

  if (domain) {
    const existing = await Account.findOne({ where: { domain } });
    if (existing) return existing;
  } else {
    const existing = await Account.findOne({ where: { name, domain: null as any } });
    if (existing) return existing;
  }

  return Account.create({
    name: name && name !== "—" ? name : domain!,
    domain,
    website: lead.website || (domain ? `https://${domain}` : null),
    industry: lead.industry || null,
    employeeCount: lead.employeeCount ?? null,
    location: lead.location || null,
    annualRevenue: lead.annualRevenue || null,
    linkedinUrl: lead.companyLinkedinUrl || null,
    createdById: createdById || null,
  });
}

// GET /accounts - list with contact/deal rollups
router.get("/", readAccess, async (req: AuthRequest, res: Response) => {
  const { search, ownerId, limit, offset } = req.query;
  const where: any = {};
  if (ownerId) where.ownerId = ownerId;
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { domain: { [Op.iLike]: `%${search}%` } },
      { industry: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await Account.findAndCountAll({
    where,
    include: [{ model: User, as: "owner", attributes: OWNER_ATTRS }],
    order: [["name", "ASC"]],
    limit: Math.min(parseInt((limit as string) || "100", 10) || 100, 200),
    offset: parseInt((offset as string) || "0", 10) || 0,
  });

  const ids = rows.map((a) => a.id);
  // Two grouped aggregates beat N+1 per-account counts.
  const [contactCounts, dealAgg] = await Promise.all([
    ids.length
      ? Lead.findAll({
          where: { accountId: { [Op.in]: ids } },
          attributes: ["accountId", [fn("COUNT", col("id")), "count"]],
          group: ["accountId"],
          raw: true,
        })
      : [],
    ids.length
      ? Deal.findAll({
          where: { accountId: { [Op.in]: ids }, status: "Open" },
          attributes: ["accountId", [fn("COUNT", col("id")), "count"], [fn("SUM", col("value")), "value"]],
          group: ["accountId"],
          raw: true,
        })
      : [],
  ]);

  const contactMap = new Map((contactCounts as any[]).map((r) => [r.accountId, Number(r.count)]));
  const dealMap = new Map((dealAgg as any[]).map((r) => [r.accountId, { count: Number(r.count), value: Number(r.value || 0) }]));

  res.json({
    rows: rows.map((a) => ({
      ...a.toJSON(),
      contactCount: contactMap.get(a.id) || 0,
      openDealCount: dealMap.get(a.id)?.count || 0,
      openDealValue: dealMap.get(a.id)?.value || 0,
    })),
    count,
  });
});

// GET /accounts/:id - single account with its contacts and deals
router.get("/:id", readAccess, async (req: AuthRequest, res: Response) => {
  const account = await Account.findByPk(req.params.id, {
    include: [
      { model: User, as: "owner", attributes: OWNER_ATTRS },
      { model: Lead, as: "contacts", attributes: ["id", "name", "email", "title", "status", "lifecycleStage"] },
      { model: Deal, as: "deals" },
    ],
  });
  if (!account) {
    res.status(404).json({ message: "Account not found" });
    return;
  }
  res.json(account);
});

// POST /accounts
router.post("/", writeAccess, async (req: AuthRequest, res: Response) => {
  try {
    const domain = normalizeDomain(req.body?.domain || req.body?.website);
    if (domain) {
      const clash = await Account.findOne({ where: { domain } });
      if (clash) {
        res.status(409).json({ message: `An account already exists for ${domain}`, accountId: clash.id });
        return;
      }
    }
    const account = await Account.create({ ...req.body, domain, createdById: req.user!.userId });
    res.status(201).json(account);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /accounts/:id
router.put("/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const account = await Account.findByPk(req.params.id);
  if (!account) {
    res.status(404).json({ message: "Account not found" });
    return;
  }
  try {
    const patch: any = { ...req.body };
    if (patch.domain !== undefined || patch.website !== undefined) {
      patch.domain = normalizeDomain(patch.domain ?? account.domain ?? patch.website);
      if (patch.domain && patch.domain !== account.domain) {
        const clash = await Account.findOne({ where: { domain: patch.domain, id: { [Op.ne]: account.id } } });
        if (clash) {
          res.status(409).json({ message: `Another account already uses ${patch.domain}`, accountId: clash.id });
          return;
        }
      }
    }
    await account.update(patch);
    res.json(account);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /accounts/:id - detaches contacts/deals rather than cascading them away
router.delete("/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const account = await Account.findByPk(req.params.id);
  if (!account) {
    res.status(404).json({ message: "Account not found" });
    return;
  }
  await Lead.update({ accountId: null }, { where: { accountId: account.id } });
  await Deal.update({ accountId: null }, { where: { accountId: account.id } });
  await Activity.update({ accountId: null }, { where: { accountId: account.id } });
  await account.destroy();
  res.json({ message: "Account deleted" });
});

// POST /accounts/backfill - group existing leads into accounts by domain.
// Idempotent: leads that already have an accountId are skipped.
router.post("/backfill", writeAccess, async (req: AuthRequest, res: Response) => {
  try {
    const leads = await Lead.findAll({ where: { accountId: null as any } });
    let linked = 0;
    let createdAccounts = 0;
    const before = await Account.count();

    for (const lead of leads) {
      const account = await findOrCreateAccountForLead(lead, req.user!.userId);
      if (!account) continue;
      await lead.update({ accountId: account.id });
      linked++;
    }

    createdAccounts = (await Account.count()) - before;
    res.json({ scanned: leads.length, linked, createdAccounts });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
