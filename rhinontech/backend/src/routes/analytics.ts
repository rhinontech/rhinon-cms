import { Router, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import { PageView, Visitor } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";

const router = Router();
router.use(authenticate);
router.use(authorize("analytics:read"));

const DAY_MS = 24 * 60 * 60 * 1000;

// Resolve ?from&to (YYYY-MM-DD) into a [from, to) window, defaulting to the last 30 days.
// Also returns the immediately-preceding window of equal length for period-over-period deltas.
function resolveRange(req: AuthRequest) {
  const now = new Date();
  const toParam = req.query.to ? new Date(String(req.query.to)) : null;
  const fromParam = req.query.from ? new Date(String(req.query.from)) : null;

  const to = toParam && !isNaN(+toParam) ? new Date(+toParam + DAY_MS) : now; // inclusive end day
  const from =
    fromParam && !isNaN(+fromParam)
      ? new Date(+fromParam)
      : new Date(+to - 30 * DAY_MS);

  const spanMs = Math.max(DAY_MS, +to - +from);
  const prevTo = new Date(+from);
  const prevFrom = new Date(+from - spanMs);
  return { from, to, prevFrom, prevTo };
}

const notBot = { isBot: false };

async function countMetrics(from: Date, to: Date) {
  const where = { ...notBot, createdAt: { [Op.gte]: from, [Op.lt]: to } };
  const [pageviews, visitors, sessions] = await Promise.all([
    PageView.count({ where }),
    PageView.count({ where, distinct: true, col: "visitorId" }),
    PageView.count({ where, distinct: true, col: "sessionId" }),
  ]);
  return { pageviews, visitors, sessions };
}

// GET /analytics/overview — totals for the range + previous-period totals for deltas.
router.get("/overview", async (req: AuthRequest, res: Response) => {
  try {
    const { from, to, prevFrom, prevTo } = resolveRange(req);
    const [current, previous] = await Promise.all([
      countMetrics(from, to),
      countMetrics(prevFrom, prevTo),
    ]);
    res.json({ range: { from, to }, current, previous });
  } catch (err) {
    console.error("analytics/overview failed:", err);
    res.status(500).json({ message: "Failed to load analytics overview" });
  }
});

// GET /analytics/timeseries — daily pageviews + unique visitors, zero-filled for a continuous chart.
router.get("/timeseries", async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = resolveRange(req);
    const rows = (await PageView.findAll({
      where: { ...notBot, createdAt: { [Op.gte]: from, [Op.lt]: to } },
      attributes: [
        [fn("date_trunc", "day", col("createdAt")), "day"],
        [fn("COUNT", col("id")), "pageviews"],
        [fn("COUNT", fn("DISTINCT", col("visitorId"))), "visitors"],
      ],
      group: [fn("date_trunc", "day", col("createdAt"))],
      order: [[fn("date_trunc", "day", col("createdAt")), "ASC"]],
      raw: true,
    })) as unknown as Array<{ day: string; pageviews: string; visitors: string }>;

    const byDay = new Map<string, { pageviews: number; visitors: number }>();
    for (const r of rows) {
      const key = new Date(r.day).toISOString().slice(0, 10);
      byDay.set(key, { pageviews: Number(r.pageviews), visitors: Number(r.visitors) });
    }

    // Zero-fill every day in the range so the line chart has no gaps.
    const series: Array<{ date: string; pageviews: number; visitors: number }> = [];
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    while (cursor < to) {
      const key = cursor.toISOString().slice(0, 10);
      series.push({ date: key, ...(byDay.get(key) || { pageviews: 0, visitors: 0 }) });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    res.json({ series });
  } catch (err) {
    console.error("analytics/timeseries failed:", err);
    res.status(500).json({ message: "Failed to load analytics timeseries" });
  }
});

// GET /analytics/sources — breakdown by traffic channel + top UTM campaigns.
router.get("/sources", async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = resolveRange(req);
    const where = { ...notBot, createdAt: { [Op.gte]: from, [Op.lt]: to } };

    const channelsRaw = (await PageView.findAll({
      where,
      attributes: [
        "channel",
        [fn("COUNT", col("id")), "pageviews"],
        [fn("COUNT", fn("DISTINCT", col("visitorId"))), "visitors"],
      ],
      group: ["channel"],
      order: literal("pageviews DESC"),
      raw: true,
    })) as unknown as Array<{ channel: string; pageviews: string; visitors: string }>;

    const campaignsRaw = (await PageView.findAll({
      where: { ...where, utmCampaign: { [Op.ne]: null } },
      attributes: [
        "utmCampaign",
        "utmSource",
        "utmMedium",
        [fn("COUNT", col("id")), "pageviews"],
        [fn("COUNT", fn("DISTINCT", col("visitorId"))), "visitors"],
      ],
      group: ["utmCampaign", "utmSource", "utmMedium"],
      order: literal("pageviews DESC"),
      limit: 15,
      raw: true,
    })) as unknown as Array<{
      utmCampaign: string; utmSource: string | null; utmMedium: string | null;
      pageviews: string; visitors: string;
    }>;

    res.json({
      channels: channelsRaw.map((c) => ({
        channel: c.channel,
        pageviews: Number(c.pageviews),
        visitors: Number(c.visitors),
      })),
      campaigns: campaignsRaw.map((c) => ({
        campaign: c.utmCampaign,
        source: c.utmSource,
        medium: c.utmMedium,
        pageviews: Number(c.pageviews),
        visitors: Number(c.visitors),
      })),
    });
  } catch (err) {
    console.error("analytics/sources failed:", err);
    res.status(500).json({ message: "Failed to load traffic sources" });
  }
});

// GET /analytics/top-pages — most-visited paths with a representative title.
router.get("/top-pages", async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = resolveRange(req);
    const rows = (await PageView.findAll({
      where: { ...notBot, createdAt: { [Op.gte]: from, [Op.lt]: to } },
      attributes: [
        "path",
        [fn("MAX", col("title")), "title"],
        [fn("COUNT", col("id")), "pageviews"],
        [fn("COUNT", fn("DISTINCT", col("visitorId"))), "visitors"],
      ],
      group: ["path"],
      order: literal("pageviews DESC"),
      limit: 20,
      raw: true,
    })) as unknown as Array<{ path: string; title: string | null; pageviews: string; visitors: string }>;

    res.json({
      pages: rows.map((r) => ({
        path: r.path,
        title: r.title,
        pageviews: Number(r.pageviews),
        visitors: Number(r.visitors),
      })),
    });
  } catch (err) {
    console.error("analytics/top-pages failed:", err);
    res.status(500).json({ message: "Failed to load top pages" });
  }
});

// GET /analytics/visitors — list recorded email visitors with IP and location
router.get("/visitors", async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = resolveRange(req);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const visitors = await Visitor.findAll({
      where: {
        visitedAt: { [Op.gte]: from, [Op.lt]: to },
      },
      order: [["visitedAt", "DESC"]],
      limit,
    });
    res.json({ visitors });
  } catch (err) {
    console.error("analytics/visitors failed:", err);
    res.status(500).json({ message: "Failed to load visitors" });
  }
});

// GET /analytics/visitor-map — every located visitor, for the full-page world map.
//
// Two sources, deliberately kept distinct:
//   - PageView : ALL site traffic (anonymous). Geo resolved from IP at capture time.
//   - Visitor  : the email-identified subset (?email=... links), which has had geo all along.
// PageViews are collapsed to one point per visitorId so a visitor reading ten pages is one
// dot, not ten. Bots are excluded unless ?includeBots=true.
router.get("/visitor-map", async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = resolveRange(req);
    const includeBots = String(req.query.includeBots || "") === "true";
    const limit = Math.min(20000, Math.max(1, Number(req.query.limit) || 5000));

    const pvWhere: any = {
      createdAt: { [Op.gte]: from, [Op.lt]: to },
      latitude: { [Op.ne]: null },
    };
    if (!includeBots) pvWhere.isBot = false;

    const [rawViews, identified, totalViews, locatedViews] = await Promise.all([
      PageView.findAll({
        where: pvWhere,
        attributes: [
          "visitorId", "country", "region", "city",
          "latitude", "longitude", "channel", "companyName", "createdAt",
        ],
        order: [["createdAt", "DESC"]],
        limit,
        raw: true,
      }),
      Visitor.findAll({
        where: { visitedAt: { [Op.gte]: from, [Op.lt]: to }, latitude: { [Op.ne]: null } },
        attributes: [
          "id", "email", "country", "region", "city", "location",
          "latitude", "longitude", "visitedAt",
        ],
        order: [["visitedAt", "DESC"]],
        limit,
        raw: true,
      }),
      PageView.count({ where: includeBots ? { createdAt: { [Op.gte]: from, [Op.lt]: to } } : { createdAt: { [Op.gte]: from, [Op.lt]: to }, isBot: false } }),
      PageView.count({ where: pvWhere }),
    ]);

    // One dot per visitor, keeping their most recent located pageview.
    const byVisitor = new Map<string, any>();
    for (const v of rawViews as any[]) {
      if (!byVisitor.has(v.visitorId)) byVisitor.set(v.visitorId, v);
    }

    const points = [
      ...Array.from(byVisitor.values()).map((v) => ({
        id: `pv:${v.visitorId}`,
        identified: false,
        email: null as string | null,
        country: v.country,
        region: v.region,
        city: v.city,
        location: [v.city, v.region, v.country].filter(Boolean).join(", ") || null,
        latitude: v.latitude,
        longitude: v.longitude,
        channel: v.channel,
        company: v.companyName,
        visitedAt: v.createdAt,
      })),
      ...(identified as any[]).map((v) => ({
        id: `id:${v.id}`,
        identified: true,
        email: v.email,
        country: v.country,
        region: v.region,
        city: v.city,
        location: v.location || [v.city, v.region, v.country].filter(Boolean).join(", ") || null,
        latitude: v.latitude,
        longitude: v.longitude,
        channel: null as string | null,
        company: null as string | null,
        visitedAt: v.visitedAt,
      })),
    ];

    // Country tallies for the side list.
    const byCountry = new Map<string, number>();
    for (const p of points) {
      if (!p.country) continue;
      byCountry.set(p.country, (byCountry.get(p.country) || 0) + 1);
    }
    const countries = Array.from(byCountry, ([country, count]) => ({ country, count })).sort(
      (a, b) => b.count - a.count
    );

    res.json({
      range: { from, to },
      points,
      countries,
      stats: {
        anonymous: byVisitor.size,
        identified: identified.length,
        // How much of the traffic in this window could be placed on the map at all.
        totalPageviews: totalViews,
        locatedPageviews: locatedViews,
      },
    });
  } catch (err) {
    console.error("analytics/visitor-map failed:", err);
    res.status(500).json({ message: "Failed to load visitor map" });
  }
});

export default router;
