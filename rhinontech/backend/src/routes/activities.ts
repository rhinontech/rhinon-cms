import { Router, Response } from "express";
import { Activity, CampaignActivity, InboxEmail, Lead, User } from "../models";
import { authenticate, authorizeAny, AuthRequest } from "../middleware/authenticate";

const router = Router();
router.use(authenticate);

const readAccess = authorizeAny("crm:read", "outreach:read");
const writeAccess = authorizeAny("crm:write", "outreach:write");

const USER_ATTRS = ["id", "fullName", "companyEmail"];

/** One shape for the merged feed, so the UI renders a single list. */
interface TimelineEntry {
  id: string;
  kind: "activity" | "campaign" | "email";
  type: string;
  subject: string | null;
  body: string | null;
  occurredAt: string;
  direction?: string | null;
  durationMinutes?: number | null;
  user?: { id: string; fullName: string } | null;
  metadata?: Record<string, any> | null;
}

// GET /activities/timeline?leadId=|dealId=|accountId=
// Merges the human timeline with the outreach engine's own log and any inbox
// email tied to the lead, newest first.
router.get("/timeline", readAccess, async (req: AuthRequest, res: Response) => {
  const { leadId, dealId, accountId, limit } = req.query;
  if (!leadId && !dealId && !accountId) {
    res.status(400).json({ message: "Provide leadId, dealId or accountId" });
    return;
  }

  const cap = Math.min(parseInt((limit as string) || "100", 10) || 100, 300);
  const where: any = {};
  if (leadId) where.leadId = leadId;
  if (dealId) where.dealId = dealId;
  if (accountId) where.accountId = accountId;

  const activities = await Activity.findAll({
    where,
    include: [{ model: User, as: "user", attributes: USER_ATTRS }],
    order: [["occurredAt", "DESC"]],
    limit: cap,
  });

  const entries: TimelineEntry[] = activities.map((a) => {
    const json: any = a.toJSON();
    return {
      id: a.id,
      kind: "activity",
      type: a.type,
      subject: a.subject,
      body: a.body,
      occurredAt: new Date(a.occurredAt).toISOString(),
      direction: a.direction,
      durationMinutes: a.durationMinutes,
      user: json.user ? { id: json.user.id, fullName: json.user.fullName } : null,
      metadata: a.metadata,
    };
  });

  // Machine-side history only exists per lead.
  const leadKey = typeof leadId === "string" ? leadId : null;
  if (leadKey) {
    const [campaignActivities, emails] = await Promise.all([
      CampaignActivity.findAll({ where: { leadId: leadKey }, order: [["timestamp", "DESC"]], limit: cap }),
      InboxEmail.findAll({ where: { leadId: leadKey }, order: [["createdAt", "DESC"]], limit: cap }),
    ]);

    for (const c of campaignActivities) {
      entries.push({
        id: c.id,
        kind: "campaign",
        type: c.type,
        subject: c.content,
        body: c.generatedContent || null,
        occurredAt: new Date(c.timestamp).toISOString(),
        user: null,
      });
    }

    for (const e of emails) {
      entries.push({
        id: e.id,
        kind: "email",
        type: "Email",
        subject: e.subject,
        body: e.snippet || null,
        occurredAt: new Date((e as any).createdAt).toISOString(),
        direction: e.folder === "sent" ? "Outbound" : "Inbound",
        user: null,
        metadata: { folder: e.folder, fromEmail: e.fromEmail },
      });
    }
  }

  entries.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  res.json(entries.slice(0, cap));
});

// POST /activities - log a note / call / meeting against a record
router.post("/", writeAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { leadId, dealId, accountId, type, subject, body, direction, durationMinutes, occurredAt } = req.body || {};
    if (!leadId && !dealId && !accountId) {
      res.status(400).json({ message: "Provide leadId, dealId or accountId" });
      return;
    }

    const activity = await Activity.create({
      leadId: leadId || null,
      dealId: dealId || null,
      accountId: accountId || null,
      userId: req.user!.userId,
      type: type || "Note",
      subject: subject || null,
      body: body || null,
      direction: direction || null,
      durationMinutes: durationMinutes ?? null,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    });

    // Staleness ("no touch in 30 days") is the point of this column.
    if (leadId) await Lead.update({ lastActivityAt: activity.occurredAt }, { where: { id: leadId } });

    res.status(201).json(
      await Activity.findByPk(activity.id, { include: [{ model: User, as: "user", attributes: USER_ATTRS }] })
    );
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /activities/:id - only the author may edit their own entry
router.put("/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const activity = await Activity.findByPk(req.params.id);
  if (!activity) {
    res.status(404).json({ message: "Activity not found" });
    return;
  }
  if (activity.userId && activity.userId !== req.user!.userId) {
    res.status(403).json({ message: "You can only edit your own activity entries" });
    return;
  }
  const { subject, body, direction, durationMinutes, occurredAt, type } = req.body || {};
  await activity.update({
    ...(subject !== undefined ? { subject } : {}),
    ...(body !== undefined ? { body } : {}),
    ...(direction !== undefined ? { direction } : {}),
    ...(durationMinutes !== undefined ? { durationMinutes } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(occurredAt !== undefined ? { occurredAt: new Date(occurredAt) } : {}),
  });
  res.json(activity);
});

// DELETE /activities/:id - system-generated entries are part of the audit trail
router.delete("/:id", writeAccess, async (req: AuthRequest, res: Response) => {
  const activity = await Activity.findByPk(req.params.id);
  if (!activity) {
    res.status(404).json({ message: "Activity not found" });
    return;
  }
  if (!activity.userId) {
    res.status(403).json({ message: "System activity cannot be deleted" });
    return;
  }
  if (activity.userId !== req.user!.userId) {
    res.status(403).json({ message: "You can only delete your own activity entries" });
    return;
  }
  await activity.destroy();
  res.json({ message: "Activity deleted" });
});

export default router;
