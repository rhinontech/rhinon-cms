import { Router, Response } from "express";
import { Lead, Campaign, CampaignActivity, InboxEmail } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { sendEmail } from "../services/mailer";

const router = Router();

router.use(authenticate);

// POST /outreach/send - manual 1-to-1 outreach
router.post("/send", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  const { leadId, subject, body } = req.body;

  if (!leadId || !subject || !body) {
    res.status(400).json({ message: "leadId, subject, and body are required" });
    return;
  }

  try {
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    const fromEmail = req.user!.companyEmail || "admin@rhinontech.in";

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
      fromName: req.user!.fullName || "Rhinon Tech",
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
    await lead.update({ status: "Emailed" });

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
    const [totalLeads, activeCampaigns, emailsSent, repliesReceived] = await Promise.all([
      Lead.count(),
      Campaign.count({ where: { stage: "Active" } }),
      CampaignActivity.count({ where: { type: "OutreachSent" } }),
      CampaignActivity.count({ where: { type: "ReplyReceived" } }),
    ]);
    res.json({ totalLeads, activeCampaigns, emailsSent, repliesReceived });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /outreach/activities - fetch recent activity logs
router.get("/activities", authorize("outreach:read"), async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  try {
    const activities = await CampaignActivity.findAll({
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
