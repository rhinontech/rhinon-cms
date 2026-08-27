import { Router, Response } from "express";
import { Op, fn, col } from "sequelize";
import { Account, Lead, Deal, User, Activity, Task } from "../models";
import { normalizeDomain, domainFromEmail } from "../models/Account";
import { authenticate, authorizeAny, AuthRequest } from "../middleware/authenticate";
import { sequelize } from "../config/database";

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
  // Everything that points at the account is detached, not deleted — the
  // contacts, deals and open tasks all outlive the company record.
  await Lead.update({ accountId: null }, { where: { accountId: account.id } });
  await Deal.update({ accountId: null }, { where: { accountId: account.id } });
  await Activity.update({ accountId: null }, { where: { accountId: account.id } });
  await Task.update({ accountId: null }, { where: { accountId: account.id } });
  await account.destroy();
  res.json({ message: "Account deleted" });
});

/** Leads and accounts are both UUID-keyed; validated before interpolation. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /accounts/backfill - group existing leads into accounts by domain.
//
// Set-based on purpose: the obvious per-lead findOrCreate loop costs 2-3 round
// trips per row, which is minutes of sequential RDS latency on a few thousand
// leads. This resolves every key in memory and touches the database ~6 times
// regardless of volume. Idempotent — leads that already have an accountId are
// never scanned.
router.post("/backfill", writeAccess, async (req: AuthRequest, res: Response) => {
  try {
    const leads = await Lead.findAll({
      where: { accountId: null as any },
      attributes: [
        "id", "company", "email", "website", "industry",
        "employeeCount", "location", "annualRevenue", "companyLinkedinUrl",
      ],
    });

    // 1. Derive each lead's account key. Domain wins; a plain company name is
    //    the fallback, and leads with neither are skipped entirely.
    const keyed = leads.flatMap((lead) => {
      const domain = normalizeDomain(lead.website) || domainFromEmail(lead.email);
      const raw = (lead.company || "").trim();
      const name = raw && raw !== "—" ? raw : null;
      if (!domain && !name) return [];
      return [{ lead, domain, name, key: domain ? `d:${domain}` : `n:${name}` }];
    });

    if (keyed.length === 0) {
      res.json({ scanned: leads.length, linked: 0, createdAccounts: 0, skipped: leads.length });
      return;
    }

    // 2. One read for every account those keys might already match.
    const domains = [...new Set(keyed.map((k) => k.domain).filter(Boolean) as string[])];
    const names = [...new Set(keyed.filter((k) => !k.domain && k.name).map((k) => k.name) as string[])];
    const or: any[] = [];
    if (domains.length) or.push({ domain: { [Op.in]: domains } });
    if (names.length) or.push({ name: { [Op.in]: names }, domain: null as any });

    const existing = or.length ? await Account.findAll({ where: { [Op.or]: or } }) : [];
    const byKey = new Map<string, Account>();
    for (const a of existing) byKey.set(a.domain ? `d:${a.domain}` : `n:${a.name}`, a);

    // 3. Everything still unmatched becomes one new account per key. The first
    //    lead seen for a key donates the firmographics.
    const toCreate = new Map<string, any>();
    for (const k of keyed) {
      if (byKey.has(k.key) || toCreate.has(k.key)) continue;
      toCreate.set(k.key, {
        name: k.name || k.domain!,
        domain: k.domain,
        website: k.lead.website || (k.domain ? `https://${k.domain}` : null),
        industry: k.lead.industry || null,
        employeeCount: k.lead.employeeCount ?? null,
        location: k.lead.location || null,
        annualRevenue: k.lead.annualRevenue || null,
        linkedinUrl: k.lead.companyLinkedinUrl || null,
        createdById: req.user!.userId,
      });
    }

    const created = toCreate.size
      ? await Account.bulkCreate([...toCreate.values()], { returning: true })
      : [];
    for (const a of created) byKey.set(a.domain ? `d:${a.domain}` : `n:${a.name}`, a);

    // 4. Link in bulk. One UPDATE ... FROM (VALUES ...) per chunk beats one
    //    statement per account, which is what the grouping would otherwise cost.
    const pairs = keyed.flatMap((k) => {
      const account = byKey.get(k.key);
      if (!account) return [];
      if (!UUID_RE.test(k.lead.id) || !UUID_RE.test(account.id)) return [];
      return [[k.lead.id, account.id] as const];
    });

    const CHUNK = 1000;
    let linked = 0;
    await sequelize.transaction(async (t) => {
      for (let i = 0; i < pairs.length; i += CHUNK) {
        const chunk = pairs.slice(i, i + CHUNK);
        const values = chunk.map(([l, a]) => `('${l}'::uuid,'${a}'::uuid)`).join(",");
        await sequelize.query(
          `UPDATE leads SET "accountId" = v.account_id, "updatedAt" = NOW()
           FROM (VALUES ${values}) AS v(lead_id, account_id)
           WHERE leads.id = v.lead_id`,
          { transaction: t }
        );
        linked += chunk.length;
      }
    });

    res.json({
      scanned: leads.length,
      linked,
      createdAccounts: created.length,
      skipped: leads.length - keyed.length,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
