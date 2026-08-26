import { Router, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import { User, Deal, PipelineStage, Lead, Activity, PageView, Account, SavedView } from "../models";
import { isIpCompanyLookupEnabled } from "../services/ipCompany";
import { sequelize } from "../config/database";
import { authenticate, authorizeAny, AuthRequest } from "../middleware/authenticate";

const router = Router();
router.use(authenticate);

const readAccess = authorizeAny("crm:read", "outreach:read");
const writeAccess = authorizeAny("crm:write", "outreach:write");

/**
 * GET /crm/users - assignable record owners.
 *
 * Deliberately not /people: that route requires `people:read` (the HR directory),
 * which a sales user has no reason to hold. This returns only what an owner
 * picker needs, behind the CRM's own permission.
 */
router.get("/users", readAccess, async (_req: AuthRequest, res: Response) => {
  const users = await User.findAll({
    where: { status: "active" },
    attributes: ["id", "fullName", "companyEmail"],
    order: [["fullName", "ASC"]],
  });
  res.json(users);
});

/**
 * GET /crm/reports — the numbers a sales review actually asks for.
 *
 * Everything closed is bounded by `from`/`to` (defaulting to the last 90 days)
 * while the pipeline snapshot is deliberately "as of now" — a forecast is about
 * what's open today, not what was open during a window.
 */
router.get("/reports", readAccess, async (req: AuthRequest, res: Response) => {
  try {
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    const from = req.query.from
      ? new Date(String(req.query.from))
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      res.status(400).json({ message: "Invalid date range" });
      return;
    }

    const closedInRange = { closedAt: { [Op.between]: [from, to] } };

    const [stages, openDeals, closedDeals, repRows, activityRows, monthlyRows] = await Promise.all([
      PipelineStage.findAll({ order: [["position", "ASC"]] }),

      // Pipeline snapshot: open deals as they stand right now.
      Deal.findAll({
        where: { status: "Open" },
        attributes: ["stageId", [fn("COUNT", col("id")), "count"], [fn("COALESCE", fn("SUM", col("value")), 0), "value"]],
        group: ["stageId"],
        raw: true,
      }),

      // Outcomes inside the window, split by result and lead source.
      Deal.findAll({
        where: { status: { [Op.in]: ["Won", "Lost"] }, ...closedInRange },
        attributes: [
          "status", "source",
          [fn("COUNT", col("id")), "count"],
          [fn("COALESCE", fn("SUM", col("value")), 0), "value"],
          // Cycle time only means anything for deals that actually closed.
          [fn("AVG", literal('EXTRACT(EPOCH FROM ("closedAt" - "createdAt")) / 86400')), "avgCycleDays"],
        ],
        group: ["status", "source"],
        raw: true,
      }),

      // Per-owner: open pipeline plus what they closed in the window.
      Deal.findAll({
        attributes: [
          "ownerId", "status",
          [fn("COUNT", col("id")), "count"],
          [fn("COALESCE", fn("SUM", col("value")), 0), "value"],
        ],
        where: { [Op.or]: [{ status: "Open" }, { status: { [Op.in]: ["Won", "Lost"] }, ...closedInRange }] },
        group: ["ownerId", "status"],
        raw: true,
      }),

      // Human effort: system-generated rows have no userId, so they drop out.
      Activity.findAll({
        where: { occurredAt: { [Op.between]: [from, to] }, userId: { [Op.ne]: null as any } },
        attributes: ["userId", "type", [fn("COUNT", col("id")), "count"]],
        group: ["userId", "type"],
        raw: true,
      }),

      // Won value by month, for the trend line.
      Deal.findAll({
        where: { status: "Won", ...closedInRange },
        attributes: [
          [fn("TO_CHAR", col("closedAt"), literal("'YYYY-MM'")), "month"],
          [fn("COUNT", col("id")), "count"],
          [fn("COALESCE", fn("SUM", col("value")), 0), "value"],
        ],
        group: [literal("1") as any],
        order: [literal("1 ASC") as any],
        raw: true,
      }),
    ]);

    const openByStage = new Map(
      (openDeals as any[]).map((r) => [r.stageId, { count: Number(r.count), value: Number(r.value) }])
    );

    const pipeline = stages
      .filter((s) => s.type === "Open")
      .map((s) => {
        const hit = openByStage.get(s.id) || { count: 0, value: 0 };
        return {
          stageId: s.id,
          name: s.name,
          color: s.color,
          probability: s.probability,
          count: hit.count,
          value: hit.value,
          weightedValue: Math.round((hit.value * s.probability) / 100),
        };
      });

    // Outcome totals
    let wonCount = 0, wonValue = 0, lostCount = 0, lostValue = 0;
    let cycleWeight = 0, cycleSum = 0;
    const sourceMap = new Map<string, { source: string; wonCount: number; wonValue: number; lostCount: number }>();

    for (const row of closedDeals as any[]) {
      const count = Number(row.count);
      const value = Number(row.value);
      const source = row.source || "Unknown";
      if (!sourceMap.has(source)) sourceMap.set(source, { source, wonCount: 0, wonValue: 0, lostCount: 0 });
      const bucket = sourceMap.get(source)!;

      if (row.status === "Won") {
        wonCount += count; wonValue += value;
        bucket.wonCount += count; bucket.wonValue += value;
        // Weight the average by deal count so big buckets aren't outvoted.
        if (row.avgCycleDays != null) { cycleSum += Number(row.avgCycleDays) * count; cycleWeight += count; }
      } else {
        lostCount += count; lostValue += value;
        bucket.lostCount += count;
      }
    }

    // Rep leaderboard
    const owners = await User.findAll({ attributes: ["id", "fullName"], raw: true });
    const ownerName = new Map(owners.map((o: any) => [o.id, o.fullName]));
    const reps = new Map<string, any>();
    const repFor = (id: string | null) => {
      const key = id || "unassigned";
      if (!reps.has(key)) {
        reps.set(key, {
          ownerId: id, name: id ? ownerName.get(id) || "Unknown" : "Unassigned",
          openCount: 0, openValue: 0, wonCount: 0, wonValue: 0, lostCount: 0, activities: 0,
        });
      }
      return reps.get(key);
    };

    for (const row of repRows as any[]) {
      const rep = repFor(row.ownerId);
      const count = Number(row.count);
      const value = Number(row.value);
      if (row.status === "Open") { rep.openCount += count; rep.openValue += value; }
      else if (row.status === "Won") { rep.wonCount += count; rep.wonValue += value; }
      else { rep.lostCount += count; }
    }
    for (const row of activityRows as any[]) repFor(row.userId).activities += Number(row.count);

    const activityByType: Record<string, number> = {};
    for (const row of activityRows as any[]) {
      activityByType[row.type] = (activityByType[row.type] || 0) + Number(row.count);
    }

    const decided = wonCount + lostCount;

    res.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      pipeline: {
        stages: pipeline,
        totalValue: pipeline.reduce((sum, s) => sum + s.value, 0),
        weightedValue: pipeline.reduce((sum, s) => sum + s.weightedValue, 0),
        totalCount: pipeline.reduce((sum, s) => sum + s.count, 0),
      },
      outcomes: {
        wonCount, wonValue, lostCount, lostValue,
        // Null rather than 0 when nothing closed — "no data" and "0%" are
        // different answers and the UI renders them differently.
        winRate: decided > 0 ? Math.round((wonCount / decided) * 100) : null,
        avgCycleDays: cycleWeight > 0 ? Math.round(cycleSum / cycleWeight) : null,
        avgDealValue: wonCount > 0 ? Math.round(wonValue / wonCount) : null,
      },
      sources: [...sourceMap.values()].sort((a, b) => b.wonValue - a.wonValue),
      reps: [...reps.values()].sort((a, b) => b.wonValue - a.wonValue || b.openValue - a.openValue),
      activityByType,
      monthly: (monthlyRows as any[]).map((r) => ({
        month: r.month,
        count: Number(r.count),
        value: Number(r.value),
      })),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /crm/intent — companies that have been on the website.
 *
 * Reads the company derived at pageview ingest (see services/ipCompany.ts —
 * the raw IP is never stored), then joins each one to an existing Account or
 * Lead so the answer is "Acme, who you already know, read pricing twice" rather
 * than a bare hostname.
 */
router.get("/intent", readAccess, async (req: AuthRequest, res: Response) => {
  try {
    const days = Math.min(Math.max(parseInt(String(req.query.days || "30"), 10) || 30, 1), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    if (!isIpCompanyLookupEnabled()) {
      res.json({
        enabled: false,
        message:
          "Set IP_COMPANY_API_KEY (and optionally IP_COMPANY_PROVIDER=ipinfo|ipapi) to start resolving visiting companies.",
        companies: [],
      });
      return;
    }

    const rows = await PageView.findAll({
      where: {
        isBot: false,
        companyName: { [Op.ne]: null as any },
        createdAt: { [Op.gte]: since },
      },
      attributes: [
        "companyName",
        "companyDomain",
        [fn("COUNT", col("id")), "views"],
        [fn("COUNT", fn("DISTINCT", col("sessionId"))), "sessions"],
        [fn("MAX", col("createdAt")), "lastSeen"],
      ],
      group: ["companyName", "companyDomain"],
      order: [[literal('COUNT("id")'), "DESC"]],
      limit: 100,
      raw: true,
    });

    const domains = [...new Set((rows as any[]).map((r) => r.companyDomain).filter(Boolean))];
    const names = [...new Set((rows as any[]).map((r) => r.companyName).filter(Boolean))];

    // Match on domain first (exact), then fall back to company name.
    const [accounts, leads] = await Promise.all([
      domains.length || names.length
        ? Account.findAll({
            where: { [Op.or]: [
              ...(domains.length ? [{ domain: { [Op.in]: domains } }] : []),
              ...(names.length ? [{ name: { [Op.in]: names } }] : []),
            ] },
            attributes: ["id", "name", "domain"],
          })
        : [],
      domains.length
        ? Lead.findAll({
            where: { website: { [Op.in]: domains } },
            attributes: ["id", "name", "email", "company"],
            limit: 200,
          })
        : [],
    ]);

    const accountByDomain = new Map(accounts.filter((a) => a.domain).map((a) => [a.domain!, a]));
    const accountByName = new Map(accounts.map((a) => [a.name.toLowerCase(), a]));

    // Top pages per company give the "what were they reading" half of intent.
    const topPages = await PageView.findAll({
      where: { isBot: false, companyName: { [Op.in]: names }, createdAt: { [Op.gte]: since } },
      attributes: ["companyName", "path", [fn("COUNT", col("id")), "views"]],
      group: ["companyName", "path"],
      raw: true,
    });
    const pagesByCompany = new Map<string, { path: string; views: number }[]>();
    for (const row of topPages as any[]) {
      const list = pagesByCompany.get(row.companyName) || [];
      list.push({ path: row.path, views: Number(row.views) });
      pagesByCompany.set(row.companyName, list);
    }

    res.json({
      enabled: true,
      days,
      companies: (rows as any[]).map((r) => {
        const account =
          (r.companyDomain && accountByDomain.get(r.companyDomain)) ||
          accountByName.get(String(r.companyName).toLowerCase()) ||
          null;
        return {
          name: r.companyName,
          domain: r.companyDomain,
          views: Number(r.views),
          sessions: Number(r.sessions),
          lastSeen: r.lastSeen,
          accountId: account?.id ?? null,
          knownContacts: r.companyDomain
            ? leads.filter((l) => l.company && account && l.company === account.name).length
            : 0,
          topPages: (pagesByCompany.get(r.companyName) || [])
            .sort((a, b) => b.views - a.views)
            .slice(0, 3),
        };
      }),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Saved views — named filter sets for the list screens
// ---------------------------------------------------------------------------

// GET /crm/views?entity=lead — shared views plus the caller's own private ones
router.get("/views", readAccess, async (req: AuthRequest, res: Response) => {
  const where: any = {
    [Op.or]: [{ isShared: true }, { createdById: req.user!.userId }],
  };
  if (req.query.entity) where.entity = req.query.entity;

  const views = await SavedView.findAll({
    where,
    include: [{ model: User, as: "creator", attributes: ["id", "fullName"] }],
    order: [["name", "ASC"]],
  });
  res.json(views);
});

router.post("/views", writeAccess, async (req: AuthRequest, res: Response) => {
  try {
    const name = (req.body?.name || "").toString().trim();
    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }
    const view = await SavedView.create({
      name,
      entity: req.body?.entity || "lead",
      filters: req.body?.filters && typeof req.body.filters === "object" ? req.body.filters : {},
      isShared: req.body?.isShared !== false,
      createdById: req.user!.userId,
    });
    res.status(201).json(view);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/views/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const view = await SavedView.findByPk(req.params.id);
  if (!view) {
    res.status(404).json({ message: "View not found" });
    return;
  }
  if (view.createdById !== req.user!.userId) {
    res.status(403).json({ message: "Only the author can change this view" });
    return;
  }
  await view.update({
    ...(req.body?.name !== undefined ? { name: String(req.body.name).trim() } : {}),
    ...(req.body?.filters !== undefined ? { filters: req.body.filters } : {}),
    ...(req.body?.isShared !== undefined ? { isShared: Boolean(req.body.isShared) } : {}),
  });
  res.json(view);
});

router.delete("/views/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const view = await SavedView.findByPk(req.params.id);
  if (!view) {
    res.status(404).json({ message: "View not found" });
    return;
  }
  if (view.createdById !== req.user!.userId) {
    res.status(403).json({ message: "Only the author can delete this view" });
    return;
  }
  await view.destroy();
  res.json({ message: "View deleted" });
});

export default router;
