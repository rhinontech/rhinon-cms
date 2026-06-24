import { Router, Response } from "express";
import { Campaign, CampaignTemplate, Lead, CampaignActivity, User, InboxEmail } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { env } from "../config/env";
import { generateAIEmailDraft, generateAISocialDraft, generateTemplateWithAI } from "../services/gemini";
import { draftOutreachForLead } from "../services/salesAgent";
import { postToLinkedIn } from "../services/linkedin";
import { sendEmail } from "../services/mailer";
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

// GET /campaigns - list all campaigns
router.get("/", authorize("outreach:read"), async (req: AuthRequest, res: Response) => {
  const campaigns = await Campaign.findAll({
    include: [{ model: CampaignTemplate, as: "template", attributes: ["name"] }],
    order: [["createdAt", "DESC"]],
  });
  res.json(campaigns);
});

// POST /campaigns - create campaign
router.post("/", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.create({
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
    { campaignId: campaign.id, status: "Enrolled" },
    { where: { id: { [Op.in]: leadIds } } }
  );

  const newTotal = await Lead.count({ where: { campaignId: campaign.id } });
  await campaign.update({ leadsTotal: newTotal });

  res.json({ message: `${leadIds.length} leads enrolled` });
});

function fillPlaceholders(text: string, lead: any, senderName: string): string {
  return text
    .replace(/\{\{lead\.name\}\}/g, lead.name)
    .replace(/\{\{lead\.company\}\}/g, lead.company)
    .replace(/\{\{lead\.title\}\}/g, lead.title || "colleague")
    .replace(/\{\{sender\.name\}\}/g, senderName)
    .replace(/\[Your Name\]/gi, senderName)
    .replace(/\[your name\]/gi, senderName)
    .replace(/\[Sender Name\]/gi, senderName)
    .replace(/\[AI to fill[^\]]*\]/gi, "");
}

const BRAND_LOGO_URL = process.env.BRAND_LOGO_URL || "https://www.rhinonlabs.com/Logo_Rhinon_Labs_Light.png";
const BRAND_SITE_URL = process.env.BRAND_SITE_URL || "https://www.rhinonlabs.com";
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || ""; // registered address for compliant footer

// Premium, responsive, light/dark-aware HTML email (bulletproof table layout).
function toEmailHtml(plainText: string, imageUrl?: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const paragraphs = esc(plainText)
    .split(/\n\n+/)
    .map(p => `<p class="text" style="margin:0 0 18px 0;line-height:1.65;color:#1f2937;font-size:15px;mso-line-height-rule:exactly">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  // Hidden inbox preview text (first real line of the email)
  const preheader = esc((plainText.split(/\n/).find(l => l.trim()) || "A quick note from Rhinon Labs").slice(0, 120));

  const imageBlock = imageUrl
    ? `<tr><td style="padding:0"><img src="${imageUrl}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0" /></td></tr>`
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Rhinon Labs</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body,table,td,p,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    a { color:#4f46e5; }
    @media only screen and (max-width:620px) {
      .container { width:100% !important; border-radius:0 !important; }
      .px { padding-left:24px !important; padding-right:24px !important; }
      .logo { width:150px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .email-bg { background:#0b0b0c !important; }
      .card { background:#161618 !important; box-shadow:none !important; }
      .text { color:#e5e7eb !important; }
      .muted { color:#8b8f98 !important; }
      .divider { border-color:#27272a !important; }
      a { color:#a5b4fc !important; }
    }
  </style>
</head>
<body class="email-bg" style="margin:0;padding:0;width:100%;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background:#f4f4f5">
    <tr><td align="center" style="padding:40px 16px">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="container card" style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 10px 28px rgba(0,0,0,0.06)">
        <tr><td align="center" style="background:#0f0f0f;padding:30px 32px">
          <img class="logo" src="${BRAND_LOGO_URL}" alt="Rhinon Labs" width="170" style="display:block;width:170px;max-width:170px;height:auto;border:0" />
        </td></tr>
        <tr><td style="height:3px;line-height:3px;font-size:0;background:#4f46e5">&nbsp;</td></tr>
        ${imageBlock}
        <tr><td class="px" style="padding:38px 40px 8px">
          ${paragraphs}
        </td></tr>
        <tr><td class="px" style="padding:0 40px 32px">
          <p class="text" style="margin:0;font-size:14px;line-height:1.5;color:#111827">
            <strong style="font-weight:600">Rhinon Labs</strong><br>
            <a href="${BRAND_SITE_URL}" target="_blank" rel="noopener noreferrer" style="color:#4f46e5;text-decoration:none">rhinonlabs.com</a>
          </p>
        </td></tr>
        <tr><td class="px divider" style="padding:18px 40px 32px;border-top:1px solid #ececed">
          <p class="muted" style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af">
            Rhinon Labs is a product of Rhinon Tech Pvt&nbsp;Ltd${COMPANY_ADDRESS ? ` &middot; ${esc(COMPANY_ADDRESS)}` : ""}.<br>
            You received this because we believe Rhinon Labs may be a fit for your operations. Not interested? Just reply &ldquo;unsubscribe&rdquo; and we&rsquo;ll remove you.
          </p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
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

    const isEmail = campaign.channel === "Email" || campaign.channel === "Cold Email";

    if (isEmail) {
      const leads = await Lead.findAll({
        where: { campaignId: campaign.id, status: ["Enrolled", "New"] },
      });

      const senderName = req.user!.fullName || "Rhinon Team";
      let processedCount = 0;

      for (const lead of leads) {
        try {
          const draft = await generateAIEmailDraft(lead, (campaign as any).template, "", senderName);
          await lead.update({ aiDraft: fillPlaceholders(draft.body, lead, senderName), status: "Interested" });
          await CampaignActivity.create({
            leadId: lead.id,
            campaignId: campaign.id,
            type: "DraftGenerated",
            content: "AI personalized outreach draft generated for this campaign.",
            generatedContent: draft.body,
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

    const isEmail = campaign.channel === "Email" || campaign.channel === "Cold Email";

    if (isEmail) {
      const leads = await Lead.findAll({
        where: { campaignId: campaign.id, status: "Interested" },
      });

      const senderName = req.user!.fullName || "Rhinon Team";
      const fromEmail = process.env.GMAIL_USER || process.env.SMTP_FROM_EMAIL || "admin@rhinontech.in";
      let sentCount = 0;

      for (const lead of leads) {
        try {
          if (!lead.aiDraft) continue;
          const tmpl = (campaign as any).template;
          const subject = tmpl?.subject
            ? fillPlaceholders(tmpl.subject, lead, senderName)
            : `Optimizing ${lead.company}'s potential`;
          const htmlBody = toEmailHtml(lead.aiDraft, tmpl?.imageUrl);
          await sendEmail({ to: lead.email, from: fromEmail, subject, html: htmlBody, text: lead.aiDraft });

          await InboxEmail.create({
            threadKey: `outreach-${campaign.id}-${lead.id}`,
            folder: "sent",
            fromName: senderName,
            fromEmail,
            toEmails: [lead.email],
            subject,
            body: lead.aiDraft,
            snippet: lead.aiDraft.slice(0, 160),
            ownerEmail: fromEmail,
            isRead: true,
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

      res.json({ success: true, sent: sentCount, total: leads.length });
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

// POST /campaigns/:id/agent-draft — sales agent researches + drafts (Stage 0–5) for approval. Never sends.
router.post("/:id/agent-draft", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    const senderName = req.user!.fullName || "Rhinon Labs";
    const leads = await Lead.findAll({
      where: { campaignId: campaign.id, draftApproved: false },
      limit: 50,
    });

    let drafted = 0;
    const skipped: { lead: string; reason: string }[] = [];
    for (const lead of leads) {
      try {
        const result = await draftOutreachForLead(lead, senderName);
        if (result.skipped) skipped.push({ lead: lead.name, reason: result.reason });
        else drafted++;
      } catch (err: any) {
        skipped.push({ lead: lead.name, reason: err.message });
      }
    }

    res.json({ success: true, drafted, skipped: skipped.length, total: leads.length, details: skipped.slice(0, 50) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /campaigns/:id/send-approved — send ONLY leads whose draft was approved
router.post("/:id/send-approved", authorize("outreach:write"), async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    const senderName = req.user!.fullName || "Rhinon Labs";
    const fromEmail = process.env.GMAIL_USER || process.env.SMTP_FROM_EMAIL || "admin@rhinontech.in";
    const leads = await Lead.findAll({
      where: { campaignId: campaign.id, draftApproved: true, aiDraft: { [Op.ne]: null } as any },
    });

    let sent = 0;
    for (const lead of leads) {
      try {
        const subject = lead.draftSubject || `A quick thought on ${lead.company}'s operations`;
        const htmlBody = toEmailHtml(lead.aiDraft);
        await sendEmail({ to: lead.email, from: fromEmail, subject, html: htmlBody, text: lead.aiDraft });

        await InboxEmail.create({
          threadKey: `outreach-${campaign.id}-${lead.id}`,
          folder: "sent",
          fromName: senderName,
          fromEmail,
          toEmails: [lead.email],
          subject,
          body: lead.aiDraft,
          snippet: lead.aiDraft.slice(0, 160),
          ownerEmail: fromEmail,
          isRead: true,
          sentAt: new Date(),
        });

        await lead.update({ status: "Emailed", draftApproved: false });
        await CampaignActivity.create({
          leadId: lead.id,
          campaignId: campaign.id,
          type: "OutreachSent",
          content: `Approved agent draft sent (${subject}).`,
        });
        sent++;
      } catch (err: any) {
        console.error(`Send-approved error for lead ${lead.id}:`, err.message);
      }
    }

    if (campaign.leadsProcessed < campaign.leadsTotal) {
      await campaign.increment("leadsProcessed", { by: sent });
    }

    res.json({ success: true, sent, total: leads.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// CRON ENGINE: GET /campaigns/cron/run
router.get("/cron/run", async (req, res) => {
  const logs: string[] = [];
  try {
    const activeCampaigns = await Campaign.findAll({
      where: { stage: "Active" },
      include: [{ model: CampaignTemplate, as: "template" }],
    });

    const allCampaigns = await Campaign.findAll({ attributes: ["id", "name", "stage"] });
    logs.push(`Total campaigns in DB: ${allCampaigns.length} — ${allCampaigns.map(c => `${c.name}(${c.stage})`).join(", ")}`);
    logs.push(`Found ${activeCampaigns.length} active campaigns ready to process.`);

    for (const campaign of activeCampaigns) {
      logs.push(`\n--- Processing Campaign: ${campaign.name} ---`);

      // PHASE A: AI Draft Generation
      const enrolledLeads = await Lead.findAll({
        where: {
          campaignId: campaign.id,
          status: "Enrolled",
          aiDraft: { [Op.or]: [null, ""] } as any,
        },
        limit: 10,
      });

      const campaignCreator = await User.findByPk(campaign.createdById);
      const senderName = campaignCreator?.fullName || "Rhinon Team";

      for (const lead of enrolledLeads) {
        try {
          let draftBody: string;
          let draftSubject: string;
          let usedAI = false;

          try {
            const aiDraft = await generateAIEmailDraft(lead, (campaign as any).template, "", senderName);
            draftBody = fillPlaceholders(aiDraft.body, lead, senderName);
            draftSubject = fillPlaceholders(aiDraft.subject, lead, senderName);
            usedAI = true;
          } catch (aiError: any) {
            logs.push(`   [AI Draft Skipped] Rate limit or error for ${lead.email} — using template fallback.`);
            const tmpl = (campaign as any).template;
            const rawBody = tmpl?.body || "Hi {{lead.name}},\n\nWe'd love to connect.\n\nBest,\n{{sender.name}}";
            draftBody = fillPlaceholders(rawBody, lead, senderName);
            draftSubject = fillPlaceholders(tmpl?.subject || `Optimizing ${lead.company}'s potential`, lead, senderName);
          }

          await lead.update({ aiDraft: draftBody, status: "Interested" });
          await CampaignActivity.create({
            leadId: lead.id,
            campaignId: campaign.id,
            type: "DraftGenerated",
            content: usedAI ? "AI personalized outreach draft generated." : "Template-based draft prepared (AI fallback).",
            generatedContent: draftBody,
          });
          logs.push(`   [Draft Ready] ${usedAI ? "AI" : "Template"} draft for ${lead.email}`);
        } catch (err: any) {
          logs.push(`   [Draft Error] Failed for ${lead.email}: ${err.message}`);
        }
      }

      // PHASE B: Email Dispatch
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const sentTodayCount = await CampaignActivity.count({
        where: {
          campaignId: campaign.id,
          type: "OutreachSent",
          timestamp: { [Op.gte]: startOfDay },
        },
      });

      const remainingDailyQuota = Math.max(0, campaign.dailyLimit - sentTodayCount);
      logs.push(`Daily Limit Check: ${sentTodayCount} sent today. Remaining: ${remainingDailyQuota}.`);

      if (remainingDailyQuota > 0) {
        const leadsReadyToSend = await Lead.findAll({
          where: {
            campaignId: campaign.id,
            status: "Interested",
            aiDraft: { [Op.ne]: null } as any,
          },
          limit: Math.min(20, remainingDailyQuota),
        });

        // Always send from the configured SMTP account — Gmail rejects mismatched senders
        const creator = await User.findByPk(campaign.createdById);
        const fromEmail = process.env.GMAIL_USER || process.env.SMTP_FROM_EMAIL || "admin@rhinontech.in";

        for (const lead of leadsReadyToSend) {
          try {
            const tmpl = (campaign as any).template;
            const subject = tmpl?.subject
              ? tmpl.subject.replace(/\{\{lead\.name\}\}/g, lead.name).replace(/\{\{lead\.company\}\}/g, lead.company)
              : `Optimizing ${lead.company}'s potential`;
            const htmlBody = toEmailHtml(lead.aiDraft, tmpl?.imageUrl);
            await sendEmail({
              to: lead.email,
              from: fromEmail,
              subject,
              html: htmlBody,
              text: lead.aiDraft,
            });

            // Archive to InboxEmail so it shows in "Sent" folder
            await InboxEmail.create({
              threadKey: `outreach-${campaign.id}-${lead.id}`,
              folder: "sent",
              fromName: creator?.fullName || "Rhinon Tech",
              fromEmail,
              toEmails: [lead.email],
              subject,
              body: lead.aiDraft,
              snippet: lead.aiDraft.slice(0, 160),
              ownerEmail: fromEmail,
              isRead: true,
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
      }

      logs.push(`   [Done] Campaign cycle complete. Staying Active for future runs.`);
    }

    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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
    await Lead.update({ campaignId: null, status: "New" }, { where: { campaignId: campaign.id } });
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
