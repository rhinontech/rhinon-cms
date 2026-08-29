import { Router, Response } from "express";
import { Campaign, CampaignTemplate, Lead, CampaignActivity, User, InboxEmail, Unsubscribe } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { env } from "../config/env";
import { generateAIEmailDraft, generateLinkedInPost, generateTemplateWithAI } from "../services/gemini";
import { isLinkedInPostType } from "../config/linkedInPlaybook";
import { postToLinkedIn } from "../services/linkedin";
import { sendEmail } from "../services/mailer";
import { stripHtml, toEmailHtml, BACKEND_URL } from "../services/emailTemplate";
import { Op } from "sequelize";
import { normalizeEmail, isValidEmail } from "../utils/email";

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

  await syncCampaignCounts(campaign);

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

  await syncCampaignCounts(campaign);

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

// Statuses that mean "this lead is done with" — nothing further will be sent to
// them, so they no longer hold a campaign open.
const TERMINAL_LEAD_STATUSES = ["Emailed", "Replied", "Bounced", "Unsubscribed"] as const;

// The exact complement of the above: a lead in any of these still owes the
// campaign a send. These two sets must stay in step with the statuses the draft
// and dispatch queries actually select, or a lead can end up pending forever
// while being invisible to every send path ("Enriched" used to do exactly that).
const PENDING_LEAD_STATUSES = ["New", "Enriched", "Enrolled", "Interested"] as const;
// Pending-but-not-yet-drafted — these are what a send turns into "Interested".
const NEEDS_DRAFT_STATUSES = ["New", "Enriched", "Enrolled"] as const;

type DispatchOutcome = { result: "sent" | "skipped" | "failed"; reason?: string; permanent?: boolean };

/**
 * Whether a transport error means "this address will never work" as opposed to
 * "try again later". Getting this wrong in the permanent direction discards a
 * real lead over a throttle or a network blip, so the match stays narrow and
 * anything unrecognised is treated as retryable.
 */
function isPermanentSendError(err: any): boolean {
  const text = `${err?.name || ""} ${err?.message || ""}`.toLowerCase();
  return /invalid|not a valid|malformed|illegal address|does not exist|rejected|blacklist|suppress/.test(text);
}

/**
 * Sends one lead's email and records the outcome.
 *
 * The important guarantee is that this NEVER leaves a lead parked in a pending
 * status. A permanently undeliverable address (a typo'd domain, a trailing dot)
 * used to be swallowed into a console.error, leaving the lead on "Interested"
 * forever — which silently pinned its campaign short of "Completed" with nothing
 * shown anywhere in the UI. Every failure path here now marks the lead terminal
 * and writes an activity row explaining why.
 *
 * "Bounced" is reused as the terminal failure status rather than adding a new
 * enum value: it already means undeliverable, is already excluded from resends,
 * and avoids a Postgres enum migration. The activity row carries the real reason.
 */
export async function dispatchLeadEmail(
  campaign: Campaign,
  lead: Lead,
  senderName: string,
  fromEmail: string,
  activityNote: string
): Promise<DispatchOutcome> {
  // permanent -> the lead goes terminal ("Bounced") so it can never pin the
  // campaign open again. transient -> it stays sendable and will be retried,
  // but the failure is recorded and reported rather than swallowed.
  const fail = async (reason: string, permanent: boolean): Promise<DispatchOutcome> => {
    if (permanent) await lead.update({ status: "Bounced" });
    await CampaignActivity.create({
      leadId: lead.id,
      campaignId: campaign.id,
      type: "Other",
      content: permanent
        ? `Outreach email failed permanently for ${lead.email} (marked Bounced): ${reason}`
        : `Outreach email failed for ${lead.email} — will retry on the next send: ${reason}`,
    });
    return { result: "failed", reason, permanent };
  };

  if (!lead.aiDraft) return fail("no draft was generated for this lead", true);

  const email = normalizeEmail(lead.email);
  if (!isValidEmail(email)) return fail(`"${lead.email}" is not a valid email address`, true);
  // A recoverable typo (trailing dot, stray case) is repaired in place so the
  // lead is clean for any future campaign, not just this send.
  if (email !== lead.email) await lead.update({ email: email! });

  const isUnsubscribed = await Unsubscribe.findOne({ where: { email: email! } });
  if (isUnsubscribed) {
    await lead.update({ status: "Unsubscribed" });
    await CampaignActivity.create({
      leadId: lead.id,
      campaignId: campaign.id,
      type: "Other",
      content: `Outreach email skipped: ${email} has unsubscribed.`,
    });
    return { result: "skipped", reason: "unsubscribed" };
  }

  const subject = campaign.subject
    ? fillPlaceholders(campaign.subject, lead, senderName)
    : `Optimizing ${lead.company}'s potential`;
  const htmlBody = toEmailHtml(lead.aiDraft, undefined, openTrackingPixelUrl(lead.id, campaign.id), email!);
  const plainText = stripHtml(lead.aiDraft);

  try {
    await sendEmail({ to: email!, from: fromEmail, fromName: senderName, via: "ses", subject, html: htmlBody, text: plainText });
  } catch (err: any) {
    return fail(err.message || "send failed", isPermanentSendError(err));
  }

  await InboxEmail.create({
    threadKey: `outreach-${campaign.id}-${lead.id}`,
    folder: "sent",
    fromName: senderName,
    fromEmail,
    toEmails: [email!],
    subject,
    body: lead.aiDraft,
    snippet: plainText.slice(0, 160),
    ownerEmail: fromEmail,
    isRead: true,
    campaignId: campaign.id,
    leadId: lead.id,
    sentAt: new Date(),
  });

  await lead.update({ status: "Emailed", lastActivityAt: new Date() });
  await CampaignActivity.create({
    leadId: lead.id,
    campaignId: campaign.id,
    type: "OutreachSent",
    content: activityNote,
  });

  return { result: "sent" };
}

/**
 * Recomputes leadsTotal/leadsProcessed from the leads themselves.
 *
 * These were previously maintained by incrementing a counter, which drifted out
 * of step with reality whenever a lead was removed or a send partly failed.
 * Deriving them is cheap and self-healing.
 */
export async function syncCampaignCounts(campaign: Campaign): Promise<void> {
  const [leadsTotal, leadsProcessed] = await Promise.all([
    Lead.count({ where: { campaignId: campaign.id } }),
    Lead.count({ where: { campaignId: campaign.id, status: { [Op.in]: [...TERMINAL_LEAD_STATUSES] } } }),
  ]);
  await campaign.update({ leadsTotal, leadsProcessed });
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
      // Social / LinkedIn channel — generated against the five-post-type playbook.
      // The body may override the stored post type/topic/facts so the detail page can
      // retype a draft and regenerate in one call.
      // `undefined` means "not sent, use what's stored"; an explicit null means "cleared".
      const pick = <T,>(key: string, stored: T): T => (key in (req.body || {}) ? req.body[key] : stored);
      const postType = pick("postType", campaign.postType);
      if (!isLinkedInPostType(postType)) {
        res.status(400).json({
          message: "Pick one of the five post types (Storytelling, Framework, Contrarian, Case Study, Direct Offer) before generating.",
        });
        return;
      }

      const audience = pick("postAudience", campaign.postAudience);
      const topic = pick("topic", campaign.topic);
      const sourceFacts = pick("sourceFacts", campaign.sourceFacts);

      try {
        const result = await generateLinkedInPost({
          postType,
          audience: audience ?? null,
          topic: topic ?? null,
          sourceFacts: sourceFacts ?? null,
          templateData: (campaign as any).template,
          customPrompt: req.body?.customPrompt ?? null,
        });

        const body = result.hashtags.length ? `${result.post}\n\n${result.hashtags.join(" ")}` : result.post;
        const updates: any = {
          aiDraft: body,
          postType: result.postType,
          objective: result.objective,
          postMeta: {
            hook: result.hook,
            cta: result.cta,
            hashtags: result.hashtags,
            visualSuggestion: result.visualSuggestion,
            inputNeeded: result.inputNeeded,
            generatedAt: new Date().toISOString(),
          },
        };
        updates.postAudience = audience ?? null;
        updates.topic = topic ?? null;
        updates.sourceFacts = sourceFacts ?? null;
        if (!campaign.mediaUrl && (campaign as any).template?.imageUrl) updates.mediaUrl = (campaign as any).template.imageUrl;

        await campaign.update(updates);
        res.json({ success: true, processed: 1, total: 1, post: result, message: "Draft generated." });
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
          status: [...NEEDS_DRAFT_STATUSES],
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
      let skippedCount = 0;
      const failures: { email: string; reason: string }[] = [];

      for (const lead of leads) {
        const outcome = await dispatchLeadEmail(
          campaign,
          lead,
          senderName,
          fromEmail,
          "Campaign outreach email delivered via Rhinon Engine."
        );
        if (outcome.result === "sent") sentCount++;
        else if (outcome.result === "skipped") skippedCount++;
        else {
          failures.push({ email: lead.email, reason: outcome.reason || "unknown error" });
          console.error(`Send error for lead ${lead.id} (${lead.email}):`, outcome.reason);

        }
      }

      await syncCampaignCounts(campaign);
      const completed = await maybeCompleteCampaign(campaign);

      res.json({
        success: true,
        sent: sentCount,
        skipped: skippedCount,
        failed: failures.length,
        failures,
        total: leads.length,
        completed,
      });
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
export async function maybeCompleteCampaign(campaign: Campaign): Promise<boolean> {
  if (campaign.stage === "Completed" || !isEmailChannel(campaign.channel)) return false;
  // Counted off the leads themselves rather than campaign.leadsTotal, which can
  // lag behind if a lead was removed after the counter was last written.
  const [total, pending] = await Promise.all([
    Lead.count({ where: { campaignId: campaign.id } }),
    Lead.count({ where: { campaignId: campaign.id, status: { [Op.in]: [...PENDING_LEAD_STATUSES] } } }),
  ]);
  if (total === 0 || pending > 0) return false;
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
          status: [...NEEDS_DRAFT_STATUSES],
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
        const outcome = await dispatchLeadEmail(
          campaign,
          lead,
          senderName,
          fromEmail,
          "Automated campaign outreach email delivered."
        );
        if (outcome.result === "sent") logs.push(`   [Email Sent] Delivered to ${lead.email}`);
        else if (outcome.result === "skipped") logs.push(`   [Email Skipped] ${lead.email} is in the unsubscribe list.`);
        else logs.push(
          `   [Email Failed] ${lead.email} — ${outcome.reason}` +
          (outcome.permanent ? " (marked Bounced)" : " (will retry next run)")
        );

      }

      await syncCampaignCounts(campaign);
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
    sent: leads.filter((l: any) => ["Emailed", "Replied", "Bounced"].includes(l.status)).length,
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
    // emailOpened/openedAt/status drive the inbox's engagement tabs — without
    // them the tab is dependent on whatever lead list the caller happens to hold.
    include: [{ model: Lead, as: "lead", attributes: ["id", "name", "company", "email", "emailOpened", "openedAt", "status"] }],
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
