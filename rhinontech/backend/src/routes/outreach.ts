import { Router, Response } from "express";
import { Op, literal } from "sequelize";
import { Lead, Campaign, CampaignActivity, InboxEmail, Unsubscribe } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { resolveSiteContext } from "../middleware/siteContext";
import { currentSiteFilter } from "../services/siteContext";
import { sendEmail } from "../services/mailer";
import { sequelize } from "../config/database";
import { defaultSenderName, fallbackFromAddress } from "../services/companyProfile";
import { outboundBlockedReason } from "../services/emailVerification";
import { reserveUsage } from "../services/usage";

const router = Router();

router.use(authenticate);
// Brand-split module: the [domain] the admin is showing scopes every read below.
router.use(resolveSiteContext);

/**
 * Which brand an activity belongs to: its campaign's brand, or, for the manual one-off sends that have
 * no campaign, its lead's brand. campaign_activities has no brand column of its own, so every count
 * over it has to say this out loud; the model hooks only cover models that carry a siteId.
 *
 * `alias` is the activities table's alias in the query; `siteIdSql` is the brand to match (already
 * escaped or a bound parameter). Used by the stat cards, the 14-day chart and the recent-activity feed so
 * they can never disagree about what a brand's numbers are.
 */
const activityInBrandSql = (alias: string, siteIdSql: string) =>
  `COALESCE((SELECT c."siteId" FROM campaigns c WHERE c.id = ${alias}."campaignId"), ` +
  `(SELECT l."siteId" FROM leads l WHERE l.id = ${alias}."leadId")) = ${siteIdSql}`;

// POST /outreach/send - manual 1-to-1 outreach
router.post("/send", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  const { leadId, subject, body } = req.body;

  if (!leadId || !subject || !body) {
    res.status(400).json({ message: "leadId, subject, and body are required" });
    return;
  }

  try {
    const blocked = await outboundBlockedReason();
    if (blocked) { res.status(403).json({ message: blocked, code: "EMAIL_NOT_VERIFIED" }); return; }
    const quotaBlock = await reserveUsage("email");
    if (quotaBlock) { res.status(402).json({ message: quotaBlock, code: "PLAN_LIMIT", limit: "emailsPerDay" }); return; }

    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    // Check if lead has unsubscribed
    // const isUnsubscribed = await Unsubscribe.findOne({
    //   where: { email: lead.email.toLowerCase().trim() },
    // });
    // if (isUnsubscribed) {
    //   await lead.update({ status: "Unsubscribed" });
    //   res.status(400).json({ message: "Cannot send email: This recipient is in the unsubscribe list." });
    //   return;
    // }

    const fromEmail = req.user!.companyEmail || (await fallbackFromAddress());

    // Send the email
    await sendEmail({
      to: lead.email,
      from: fromEmail,
      subject,
      html: body,
      text: body,
    });

    // Create InboxEmail record for the 'sent' folder
    await InboxEmail.create({
      threadKey: `manual-outreach-${lead.id}-${Date.now()}`,
      folder: "sent",
      fromName: req.user!.fullName || (await defaultSenderName()),
      fromEmail,
      toEmails: [lead.email],
      subject,
      body,
      snippet: body.slice(0, 160),
      ownerEmail: fromEmail,
      isRead: true,
      sentAt: new Date(),
    });

    // Update lead status
    await lead.update({ status: "Emailed", lastActivityAt: new Date() });

    // Log Activity
    await CampaignActivity.create({
      leadId: lead.id,
      campaignId: lead.campaignId,
      type: "OutreachSent",
      content: `Manual email outreach sent: "${subject}"`,
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /outreach/stats - aggregate outreach metrics
router.get("/stats", authorize("outreach:read"), async (_req: AuthRequest, res: Response) => {
  try {
    // Leads and campaigns are brand-scoped by the model hooks. Activities are not (no siteId column),
    // so sends and replies are counted by hand, per brand, or workspace-wide when no brand is chosen.
    // The CRM is workspace-wide, so "Total Leads" here is this brand's audience: the people in its
    // lists or enrolled in its campaigns. With no brand chosen it is the whole book.
    const brand = currentSiteFilter();
    const [totalLeads, totalCampaigns, activeCampaigns, [counts]] = await Promise.all([
      brand
        ? (sequelize
            .query(
              `SELECT COUNT(*) AS n FROM leads l
                WHERE l."organizationId" = :orgId
                  AND (l."campaignId" IN (SELECT c.id FROM campaigns c WHERE c."siteId" = :siteId::uuid)
                       OR EXISTS (SELECT 1 FROM contact_group_members m JOIN contact_groups g ON g.id = m."contactGroupId"
                                   WHERE m."leadId" = l.id AND g."siteId" = :siteId::uuid))`,
              { replacements: { orgId: _req.user!.organizationId, siteId: brand }, type: (sequelize as any).QueryTypes?.SELECT ?? "SELECT" }
            )
            .then((r: any[]) => parseInt(r[0]?.n, 10) || 0))
        : Lead.count(),
      Campaign.count(),
      Campaign.count({ where: { stage: "Active" } }),
      sequelize.query(
        `SELECT COUNT(*) FILTER (WHERE a.type = 'OutreachSent')   AS sent,
                COUNT(*) FILTER (WHERE a.type = 'ReplyReceived')  AS replied
           FROM campaign_activities a
          WHERE a."organizationId" = :orgId
            AND (:siteId::uuid IS NULL OR ${activityInBrandSql("a", ":siteId::uuid")})`,
        { replacements: { orgId: _req.user!.organizationId, siteId: currentSiteFilter() }, type: (sequelize as any).QueryTypes?.SELECT ?? "SELECT" }
      ) as Promise<any[]>,
    ]);
    res.json({
      totalLeads,
      totalCampaigns,
      activeCampaigns,
      emailsSent: parseInt(counts?.sent, 10) || 0,
      repliesReceived: parseInt(counts?.replied, 10) || 0,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});


/**
 * GET /outreach/timeseries?days=14 — daily drafted/sent/replied totals.
 *
 * Aggregated in SQL rather than by counting rows from /outreach/activities:
 * that endpoint is the capped "recent activity" feed, and a single busy day can
 * run to thousands of rows, so a client-side bucket of the latest N silently
 * reported a fraction of one day and zero for every day before it.
 *
 * Days are bucketed in IST so they line up with the business dates the team
 * actually works to, and the series is gap-filled server-side.
 *
 * Raw SQL bypasses both the tenancy and the site hooks, so the org and brand
 * filters are spelled out here by hand — without them this endpoint counted
 * every workspace's activity, and now every brand's.
 */
router.get("/timeseries", authorize("outreach:read"), async (req: AuthRequest, res: Response) => {
  const days = Math.min(Math.max(parseInt(req.query.days as string, 10) || 14, 1), 90);
  try {
    const rows = (await sequelize.query(
      `
      WITH day_range AS (
        SELECT generate_series(
          (now() AT TIME ZONE 'Asia/Kolkata')::date - make_interval(days => :days - 1),
          (now() AT TIME ZONE 'Asia/Kolkata')::date,
          '1 day'
        )::date AS date
      )
      SELECT
        d.date::text AS date,
        COUNT(a.id) FILTER (WHERE a.type = 'DraftGenerated') AS drafted,
        COUNT(a.id) FILTER (WHERE a.type = 'OutreachSent')   AS sent,
        COUNT(a.id) FILTER (WHERE a.type = 'ReplyReceived')  AS replied
      FROM day_range d
      LEFT JOIN campaign_activities a
        ON a."timestamp" >= (d.date::text || ' 00:00:00')::timestamp AT TIME ZONE 'Asia/Kolkata'
       AND a."timestamp" <  ((d.date + 1)::text || ' 00:00:00')::timestamp AT TIME ZONE 'Asia/Kolkata'
       AND a."organizationId" = :orgId
       AND (:siteId::uuid IS NULL OR ${activityInBrandSql("a", ":siteId::uuid")})
      GROUP BY d.date
      ORDER BY d.date
      `,
      {
        replacements: { days, orgId: req.user!.organizationId, siteId: currentSiteFilter() },
        type: (sequelize as any).QueryTypes?.SELECT ?? "SELECT",
      }
    )) as any[];

    // pg returns COUNT() as a bigint string.
    res.json(
      rows.map((r) => ({
        date: r.date,
        drafted: parseInt(r.drafted, 10) || 0,
        sent: parseInt(r.sent, 10) || 0,
        replied: parseInt(r.replied, 10) || 0,
      }))
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /outreach/activities - fetch recent activity logs (optionally for one campaign)
router.get("/activities", authorize("outreach:read"), async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const campaignId = (req.query.campaignId as string) || null;
  try {
    const siteId = currentSiteFilter();
    const conditions: any[] = [];
    if (campaignId) conditions.push({ campaignId });
    // The include below is not scoped by the site hooks, so the brand is applied here.
    if (siteId) conditions.push(literal(activityInBrandSql('"CampaignActivity"', sequelize.escape(siteId))));
    const activities = await CampaignActivity.findAll({
      ...(conditions.length ? { where: { [Op.and]: conditions } } : {}),
      limit,
      order: [["createdAt", "DESC"]],
      include: [
        { model: Lead, as: "lead", attributes: ["name", "company"] }
      ]
    });
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
