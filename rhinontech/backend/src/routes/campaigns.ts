import { Router, Response } from "express";
import { Campaign, CampaignTemplate, Lead, CampaignActivity, User, InboxEmail } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { env } from "../config/env";
import { generateAIEmailDraft, generateAISocialDraft, generateTemplateWithAI } from "../services/gemini";
import { postToLinkedIn } from "../services/linkedin";
import { sendEmail } from "../services/mailer";
import { stripHtml, toEmailHtml, BACKEND_URL } from "../services/emailTemplate";
import { Op } from "sequelize";

const router = Router();

// Internal/Cron auth check helper
const isCronAuthorized = (req: any) => {
  const authHeader = req.headers.get?.("Authorization") || req.headers["authorization"];
  return authHeader === `Bearer ${env.cronSecret}` || process.env.NODE_ENV === "development";
};

router.use((req, res, next) => {
  if (req.path === "/cron/run") {
    if (isCronAuthorized(req)) return next();
    // Also allow JWT-authenticated users to trigger manually
    return authenticate(req as AuthRequest, res as Response, next);
  }
  authenticate(req as AuthRequest, res as Response, next);
});

// GET /campaigns/sender-options - assigned company emails a campaign can send from.
// Sent via SES (domain-verified), so any of these addresses is a real, deliverable "From".
router.get("/sender-options", authorize("outreach:read"), async (_req: AuthRequest, res: Response) => {
  const users = await User.findAll({
    where: { status: "active", companyEmail: { [Op.ne]: null as any } },
    attributes: ["companyEmail", "fullName"],
    order: [["fullName", "ASC"]],
  });
  res.json(users.map((u) => ({ email: u.companyEmail, name: u.fullName })));
});

// GET /campaigns - list all campaigns
router.get("/", authorize("outreach:read"), async (req: AuthRequest, res: Response) => {
  const campaigns = await Campaign.findAll({
    include: [{ model: CampaignTemplate, as: "template", attributes: ["name"] }],
    order: [["createdAt", "DESC"]],
  });
  res.json(campaigns);
});

// Channels the engine can actually deliver on. DM/Connection remain in the DB
// enum (enum removal isn't additive-safe) but can no longer be created.
const SUPPORTED_CHANNELS = ["Email", "Cold Email", "LinkedIn Post", "LinkedIn Video", "LinkedIn Article"];
const isEmailChannel = (channel: string) => channel === "Email" || channel === "Cold Email";

// POST /campaigns - create campaign
router.post("/", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const { channel = "Email" } = req.body;
    if (!SUPPORTED_CHANNELS.includes(channel)) {
      res.status(400).json({ message: `Unsupported channel "${channel}". Use one of: ${SUPPORTED_CHANNELS.join(", ")}` });
      return;
    }
    const campaign = await Campaign.create({
      senderEmail: req.user!.companyEmail,
      senderName: req.user!.fullName,
      ...req.body,
      createdById: req.user!.userId,
    });
    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// GET /campaigns/templates - list templates
router.get("/templates", authorize("outreach:read"), async (req: AuthRequest, res: Response) => {
  const templates = await CampaignTemplate.findAll({
    order: [["name", "ASC"]],
  });
  res.json(templates);
});

// POST /campaigns/templates - create template
router.post("/templates", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const template = await CampaignTemplate.create({
      ...req.body,
      createdById: req.user!.userId,
    });
    res.status(201).json(template);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// POST /campaigns/generate - generate AI email draft for a lead
router.post("/generate", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  const { leadId, templateId } = req.body;
  if (!leadId) {
    res.status(400).json({ message: "leadId is required" });
    return;
  }

  try {
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    let template = null;
    if (templateId) {
      template = await CampaignTemplate.findByPk(templateId);
    }

    const senderName = req.user!.fullName || "Rhinon Team";
    const draft = await generateAIEmailDraft(lead, template, "", senderName);
    res.json({ subject: draft.subject, body: draft.body });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /campaigns/:id/enroll - enroll leads
router.post("/:id/enroll", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  const { leadIds } = req.body;
  if (!Array.isArray(leadIds)) {
    res.status(400).json({ message: "leadIds must be an array" });
    return;
  }

  const campaign = await Campaign.findByPk(req.params.id);
  if (!campaign) {
    res.status(404).json({ message: "Campaign not found" });
    return;
  }

  await Lead.update(
    { campaignId: campaign.id, status: "Enrolled", aiDraft: null, emailOpened: false, openedAt: null },
    { where: { id: { [Op.in]: leadIds } } }
  );

  const newTotal = await Lead.count({ where: { campaignId: campaign.id } });
  await campaign.update({ leadsTotal: newTotal });

  res.json({ message: `${leadIds.length} leads enrolled` });
});

// DELETE /campaigns/:id/leads/:leadId - remove a single lead from this campaign
// (unenrolls it back to the general lead pool; does not delete the lead itself).
router.delete("/:id/leads/:leadId", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  const campaign = await Campaign.findByPk(req.params.id);
  if (!campaign) {
    res.status(404).json({ message: "Campaign not found" });
    return;
  }

  const lead = await Lead.findOne({ where: { id: req.params.leadId, campaignId: campaign.id } });
  if (!lead) {
    res.status(404).json({ message: "Lead not found on this campaign" });
    return;
  }

  await lead.update({ campaignId: null, status: "New", aiDraft: null, emailOpened: false, openedAt: null });

  const newTotal = await Lead.count({ where: { campaignId: campaign.id } });
  await campaign.update({ leadsTotal: newTotal });

  res.json({ message: "Lead removed from campaign" });
});

function fillPlaceholders(text: string, lead: any, senderName: string): string {
  return text
    .replace(/\{\{\s*(?:lead\.)?name\s*\}\}/gi, lead.name)
    .replace(/\{\{\s*(?:lead\.)?email\s*\}\}/gi, lead.email || "")
    .replace(/\{\{\s*(?:lead\.)?company\s*\}\}/gi, lead.company)
    .replace(/\{\{\s*(?:lead\.)?title\s*\}\}/gi, lead.title || "colleague")
    .replace(/\{\{\s*sender\.name\s*\}\}/gi, senderName)
    .replace(/\[Your Name\]/gi, senderName)
    .replace(/\[your name\]/gi, senderName)
    .replace(/\[Sender Name\]/gi, senderName)
    .replace(/\[AI to fill[^\]]*\]/gi, "");
}

// 1x1 open-tracking pixel URL for a given lead's send — hits GET /public/track/open,
// which flips Lead.emailOpened/openedAt and logs a CampaignActivity the first time it loads.
function openTrackingPixelUrl(leadId: string, campaignId: string): string {
  return `${BACKEND_URL}/public/track/open?l=${leadId}&c=${campaignId}`;
}

// POST /campaigns/:id/process — generate AI draft (email or social)
router.post("/:id/process", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id, {
      include: [{ model: CampaignTemplate, as: "template" }],
    });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    const isEmail = isEmailChannel(campaign.channel);

    if (isEmail) {
      const leads = await Lead.findAll({
        where: { campaignId: campaign.id, status: ["Enrolled", "New"] },
      });

      const senderName = campaign.senderName || req.user!.fullName || "Rhinon Team";
      let processedCount = 0;

      for (const lead of leads) {
        try {
          const rawBody = campaign.body || "Hi {{lead.name}},\n\nWe'd love to connect.\n\nBest,\n{{sender.name}}";
          const draftBody = fillPlaceholders(rawBody, lead, senderName);
          await lead.update({ aiDraft: draftBody, status: "Interested" });
          await CampaignActivity.create({
            leadId: lead.id,
            campaignId: campaign.id,
            type: "DraftGenerated",
            content: "Template draft prepared (mail-merge).",
            generatedContent: draftBody,
          });
          processedCount++;
        } catch (err: any) {
          console.error(`Draft error for lead ${lead.id}:`, err.message);
        }
      }

      await campaign.increment("leadsProcessed", { by: processedCount });
      res.json({ success: true, processed: processedCount, total: leads.length });
    } else {
      // Social / LinkedIn channel
      try {
        const draft = await generateAISocialDraft((campaign as any).template);
        const updates: any = { aiDraft: draft };
        if ((campaign as any).template?.imageUrl) updates.mediaUrl = (campaign as any).template.imageUrl;
        await campaign.update(updates);
        res.json({ success: true, processed: 1, total: 1, message: "Social draft generated successfully." });
      } catch (err: any) {
        res.status(500).json({ message: "Failed to generate social draft.", details: err.message });
      }
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /campaigns/:id/send — send email campaign or publish LinkedIn post
router.post("/:id/send", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id, {
      include: [{ model: CampaignTemplate, as: "template" }],
    });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    const isEmail = isEmailChannel(campaign.channel);

    if (isEmail) {
      const senderName = campaign.senderName || req.user!.fullName || "Rhinon Team";
      const fromEmail = campaign.senderEmail || req.user!.companyEmail || "admin@rhinontech.in";

      // 1. Auto-generate drafts for any leads that are still Enrolled or missing drafts
      const enrolledLeads = await Lead.findAll({
        where: {
          campaignId: campaign.id,
          status: ["Enrolled", "New"],
        },
      });

      for (const lead of enrolledLeads) {
        try {
          const rawBody = campaign.body || "Hi {{lead.name}},\n\nWe'd love to connect.\n\nBest,\n{{sender.name}}";
          const draftBody = fillPlaceholders(rawBody, lead, senderName);
          await lead.update({ aiDraft: draftBody, status: "Interested" });
          await CampaignActivity.create({
            leadId: lead.id,
            campaignId: campaign.id,
            type: "DraftGenerated",
            content: "Template draft prepared (mail-merge).",
            generatedContent: draftBody,
          });
        } catch (err: any) {
          console.error(`Draft error for lead ${lead.id}:`, err.message);
        }
      }

      // 1b. Explicit resend: re-run the mail-merge from the campaign's current
      // body/subject for already-emailed leads (so template edits made after the
      // first send actually go out), then queue them back up for dispatch. This
      // overwrites any manual per-lead draft edits made since the last send.
      // Deliberately excludes Bounced/Unsubscribed/Replied — those must never
      // be re-emailed regardless of what the caller asks for.
      if (req.body?.resend === true) {
        const emailedLeads = await Lead.findAll({
          where: { campaignId: campaign.id, status: "Emailed" },
        });

        for (const lead of emailedLeads) {
          try {
            const rawBody = campaign.body || "Hi {{lead.name}},\n\nWe'd love to connect.\n\nBest,\n{{sender.name}}";
            const draftBody = fillPlaceholders(rawBody, lead, senderName);
            await lead.update({ aiDraft: draftBody, status: "Interested", emailOpened: false, openedAt: null });
            await CampaignActivity.create({
              leadId: lead.id,
              campaignId: campaign.id,
              type: "DraftGenerated",
              content: "Draft regenerated from campaign template for resend.",
              generatedContent: draftBody,
            });
          } catch (err: any) {
            console.error(`Resend draft error for lead ${lead.id}:`, err.message);
          }
        }
      }

      // 2. Dispatch emails to all ready leads
      const leads = await Lead.findAll({
        where: { campaignId: campaign.id, status: "Interested" },
      });

      let sentCount = 0;

      for (const lead of leads) {
        try {
          if (!lead.aiDraft) continue;
          const subject = campaign.subject
            ? fillPlaceholders(campaign.subject, lead, senderName)
            : `Optimizing ${lead.company}'s potential`;
          const htmlBody = toEmailHtml(lead.aiDraft, undefined, openTrackingPixelUrl(lead.id, campaign.id));
          const plainText = stripHtml(lead.aiDraft);
          await sendEmail({ to: lead.email, from: fromEmail, fromName: senderName, via: "ses", subject, html: htmlBody, text: plainText });

          await InboxEmail.create({
            threadKey: `outreach-${campaign.id}-${lead.id}`,
            folder: "sent",
            fromName: senderName,
            fromEmail,
            toEmails: [lead.email],
            subject,
            body: lead.aiDraft,
            snippet: plainText.slice(0, 160),
            ownerEmail: fromEmail,
            isRead: true,
            campaignId: campaign.id,
            leadId: lead.id,
            sentAt: new Date(),
          });

          await lead.update({ status: "Emailed" });
          await CampaignActivity.create({
            leadId: lead.id,
            campaignId: campaign.id,
            type: "OutreachSent",
            content: "Campaign outreach email delivered via Rhinon Engine.",
          });
          sentCount++;
        } catch (err: any) {
          console.error(`Send error for lead ${lead.id}:`, err.message);
        }
      }

      if (campaign.leadsProcessed < campaign.leadsTotal) {
        await campaign.increment("leadsProcessed", { by: sentCount });
      }
      const completed = await maybeCompleteCampaign(campaign);

      res.json({ success: true, sent: sentCount, total: leads.length, completed });
    } else {
      // Social / LinkedIn broadcast
      let postContent = campaign.aiDraft;
      let mediaUrl = campaign.mediaUrl;

      if (!postContent) {
        const tmpl = (campaign as any).template;
        if (tmpl) {
          postContent = postContent || tmpl.body;
          mediaUrl = mediaUrl || tmpl.imageUrl;
        }
      }

      if (!postContent) {
        res.status(400).json({ message: "No AI draft or template content found for this social post." });
        return;
      }

      // Auto-generate slug for LinkedIn Articles
      let slug = campaign.slug;
      if (!slug && campaign.channel === "LinkedIn Article") {
        slug = campaign.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      try {
        const result = await postToLinkedIn(postContent, mediaUrl ? [mediaUrl] : [], {
          visibility: campaign.visibility || "PUBLIC",
          channel: campaign.channel,
          articleUrl: campaign.articleUrl || undefined,
          mediaTitle: campaign.name || campaign.mediaTitle || undefined,
          mediaDescription: campaign.mediaDescription || undefined,
          campaignId: campaign.id,
          slug: slug || undefined,
          userName: req.user!.fullName || "Prabhat Patra",
          organizationId: campaign.organizationId || null,
        });

        await campaign.update({ platformPostId: result.postId, stage: "Completed", slug: slug || campaign.slug });
        res.json({ success: true, sent: 1, total: 1, message: "Social post successfully published to LinkedIn." });
      } catch (err: any) {
        res.status(500).json({ message: "Failed to publish social post.", details: err.message });
      }
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// When every enrolled lead has been dealt with (sent/replied/bounced/…), an email
// campaign is finished — flip it to Completed so it stops showing as Active.
async function maybeCompleteCampaign(campaign: Campaign): Promise<boolean> {
  if (campaign.stage === "Completed" || !isEmailChannel(campaign.channel)) return false;
  if (campaign.leadsTotal === 0) return false;
  const pending = await Lead.count({
    where: {
      campaignId: campaign.id,
      status: { [Op.in]: ["New", "Enriched", "Enrolled", "Interested"] },
    },
  });
  if (pending > 0) return false;
  await campaign.update({ stage: "Completed" });
  return true;
}

// CRON ENGINE: GET /campaigns/cron/run
router.get("/cron/run", async (req, res) => {
  const logs: string[] = [];
  try {
    const { campaignId } = req.query as { campaignId?: string };
    const where: any = { stage: "Active" };
    if (campaignId) where.id = campaignId;

    const activeCampaigns = await Campaign.findAll({ where });

    logs.push(`Found ${activeCampaigns.length} active campaign(s) ready to process.`);

    for (const campaign of activeCampaigns) {
      logs.push(`\n--- Processing Campaign: ${campaign.name} ---`);

      // PHASE A: Draft generation — mail-merge only, no AI rewrite
      const enrolledLeads = await Lead.findAll({
        where: {
          campaignId: campaign.id,
          status: "Enrolled",
          aiDraft: { [Op.or]: [null, ""] } as any,
        },
      });

      const campaignCreator = await User.findByPk(campaign.createdById);
      const senderName = campaign.senderName || campaignCreator?.fullName || "Rhinon Team";

      for (const lead of enrolledLeads) {
        try {
          const rawBody = campaign.body || "Hi {{lead.name}},\n\nWe'd love to connect.\n\nBest,\n{{sender.name}}";
          const draftBody = fillPlaceholders(rawBody, lead, senderName);

          await lead.update({ aiDraft: draftBody, status: "Interested" });
          await CampaignActivity.create({
            leadId: lead.id,
            campaignId: campaign.id,
            type: "DraftGenerated",
            content: "Template draft prepared (mail-merge).",
            generatedContent: draftBody,
          });
          logs.push(`   [Draft Ready] Template draft for ${lead.email}`);
        } catch (err: any) {
          logs.push(`   [Draft Error] Failed for ${lead.email}: ${err.message}`);
        }
      }

      // PHASE B: Email Dispatch — one-shot, sends the entire ready batch (no daily cap)
      const leadsReadyToSend = await Lead.findAll({
        where: {
          campaignId: campaign.id,
          status: "Interested",
          aiDraft: { [Op.ne]: null } as any,
        },
      });

      // Send from the campaign's chosen sender — SES is domain-verified, so any
      // assigned company email works as a real "From" address.
      const fromEmail = campaign.senderEmail || campaignCreator?.companyEmail || "admin@rhinontech.in";

      for (const lead of leadsReadyToSend) {
        try {
          if (!lead.aiDraft) continue;
          const subject = campaign.subject
            ? fillPlaceholders(campaign.subject, lead, senderName)
            : `Optimizing ${lead.company}'s potential`;
          const htmlBody = toEmailHtml(lead.aiDraft, undefined, openTrackingPixelUrl(lead.id, campaign.id));
          const plainText = stripHtml(lead.aiDraft);
          await sendEmail({
            to: lead.email,
            from: fromEmail,
            fromName: senderName,
            via: "ses",
            subject,
            html: htmlBody,
            text: plainText,
          });

          // Archive to InboxEmail so it shows in "Sent" folder
          await InboxEmail.create({
            threadKey: `outreach-${campaign.id}-${lead.id}`,
            folder: "sent",
            fromName: campaign.senderName || campaignCreator?.fullName || "Rhinon Tech",
            fromEmail,
            toEmails: [lead.email],
            subject,
            body: lead.aiDraft,
            snippet: plainText.slice(0, 160),
            ownerEmail: fromEmail,
            isRead: true,
            campaignId: campaign.id,
            leadId: lead.id,
            sentAt: new Date(),
          });

          await lead.update({ status: "Emailed" });
          if (campaign.leadsProcessed < campaign.leadsTotal) {
            await campaign.increment("leadsProcessed");
          }

          await CampaignActivity.create({
            leadId: lead.id,
            campaignId: campaign.id,
            type: "OutreachSent",
            content: `Automated campaign outreach email delivered.`,
          });

          logs.push(`   [Email Sent] Delivered to ${lead.email}`);
        } catch (sendError: any) {
          logs.push(`   [Email Error] Failed to send to ${lead.email}: ${sendError.message}`);
        }
      }

      const completed = await maybeCompleteCampaign(campaign);
      logs.push(
        completed
          ? `   [Done] All leads processed — campaign marked Completed.`
          : `   [Done] Campaign cycle complete. Staying Active for future runs.`
      );
    }

    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /campaigns/:id/pause — Active → Paused
router.post("/:id/pause", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  const campaign = await Campaign.findByPk(req.params.id);
  if (!campaign) { res.status(404).json({ message: "Campaign not found" }); return; }
  if (campaign.stage !== "Active") {
    res.status(400).json({ message: `Only Active campaigns can be paused (current: ${campaign.stage}).` });
    return;
  }
  await campaign.update({ stage: "Paused" });
  res.json(campaign);
});

// POST /campaigns/:id/resume — Paused/Draft → Active
router.post("/:id/resume", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  const campaign = await Campaign.findByPk(req.params.id);
  if (!campaign) { res.status(404).json({ message: "Campaign not found" }); return; }
  if (campaign.stage !== "Paused" && campaign.stage !== "Draft") {
    res.status(400).json({ message: `Only Paused or Draft campaigns can be activated (current: ${campaign.stage}).` });
    return;
  }
  await campaign.update({ stage: "Active" });
  res.json(campaign);
});

// GET /campaigns/:id/stats — per-campaign funnel + daily activity series
router.get("/:id/stats", authorize("outreach:read"), async (req: AuthRequest, res: Response) => {
  const campaign = await Campaign.findByPk(req.params.id);
  if (!campaign) { res.status(404).json({ message: "Campaign not found" }); return; }

  const leads = await Lead.findAll({
    where: { campaignId: campaign.id },
    attributes: ["status", "aiDraft", "draftApproved", "emailOpened"],
    raw: true,
  });

  const funnel = {
    enrolled: leads.length,
    drafted: leads.filter((l: any) => l.aiDraft).length,
    approved: leads.filter((l: any) => l.draftApproved).length,
    sent: leads.filter((l: any) => ["Emailed", "Replied", "Bounced", "Unsubscribed"].includes(l.status)).length,
    opened: leads.filter((l: any) => l.emailOpened).length,
    replied: leads.filter((l: any) => l.status === "Replied").length,
    bounced: leads.filter((l: any) => l.status === "Bounced").length,
  };

  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);
  const activities = await CampaignActivity.findAll({
    where: { campaignId: campaign.id, timestamp: { [Op.gte]: since } },
    attributes: ["type", "timestamp"],
    raw: true,
  });
  const byDay = new Map<string, { date: string; drafted: number; sent: number; replied: number }>();
  for (const a of activities as any[]) {
    const key = new Date(a.timestamp).toISOString().slice(0, 10);
    const row = byDay.get(key) || { date: key, drafted: 0, sent: 0, replied: 0 };
    if (a.type === "DraftGenerated") row.drafted++;
    else if (a.type === "OutreachSent") row.sent++;
    else if (a.type === "ReplyReceived") row.replied++;
    byDay.set(key, row);
  }
  const series = Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));

  res.json({ funnel, series });
});

// GET /campaigns/:id/inbox - this campaign's own inbox: every sent email + every
// reply it received, tagged at send/receive time so it's scoped regardless of
// which teammate's mailbox actually received the reply.
router.get("/:id/inbox", authorize("outreach:read"), async (req: AuthRequest, res: Response) => {
  const emails = await InboxEmail.findAll({
    where: { campaignId: req.params.id },
    include: [{ model: Lead, as: "lead", attributes: ["id", "name", "company", "email"] }],
    order: [["sentAt", "ASC"]],
  });
  res.json(emails);
});

// GET /campaigns/:id - get single campaign
router.get("/:id", authorize("outreach:read"), async (req: AuthRequest, res: Response) => {
  const campaign = await Campaign.findByPk(req.params.id, {
    include: [{ model: CampaignTemplate, as: "template" }],
  });
  if (!campaign) {
    res.status(404).json({ message: "Campaign not found" });
    return;
  }
  res.json(campaign);
});

// PUT /campaigns/:id - update campaign
router.put("/:id", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }
    await campaign.update(req.body);
    res.json(campaign);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// POST /campaigns/:id/reset - reset campaign to Active and re-enroll leads (for testing)
router.post("/:id/reset", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }
    await campaign.update({ stage: "Active" });
    await Lead.update(
      { status: "Enrolled", aiDraft: undefined },
      { where: { campaignId: campaign.id } }
    );
    res.json({ message: `Campaign "${campaign.name}" reset to Active. Leads re-enrolled.` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /campaigns/:id - delete campaign and unenroll its leads
router.delete("/:id", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }
    // Unenroll leads before deleting
    await Lead.update({ campaignId: null, status: "New", aiDraft: null }, { where: { campaignId: campaign.id } });
    await campaign.destroy();
    res.json({ message: "Campaign deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /campaigns/templates/generate - AI-generate a template from a prompt
router.post("/templates/generate", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  const { prompt, channel } = req.body;
  if (!prompt || !prompt.trim()) {
    res.status(400).json({ message: "prompt is required" });
    return;
  }
  try {
    const result = await generateTemplateWithAI(prompt.trim(), channel || "Email");
    if (result.error) {
      res.status(500).json({ message: result.error });
      return;
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /campaigns/templates/:id - get single template
router.get("/templates/:id", authorize("outreach:read"), async (req: AuthRequest, res: Response) => {
  const template = await CampaignTemplate.findByPk(req.params.id);
  if (!template) {
    res.status(404).json({ message: "Template not found" });
    return;
  }
  res.json(template);
});

// PUT /campaigns/templates/:id - update template
router.put("/templates/:id", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const template = await CampaignTemplate.findByPk(req.params.id);
    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }
    await template.update(req.body);
    res.json(template);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /campaigns/templates/:id - delete template
router.delete("/templates/:id", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const template = await CampaignTemplate.findByPk(req.params.id);
    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }
    await template.destroy();
    res.json({ message: "Template deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
