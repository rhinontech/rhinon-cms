import { Router, Response } from "express";
import { Op, WhereOptions } from "sequelize";
import { InboxEmail, User, Campaign } from "../models";
import { InboxEmailFolder } from "../models/InboxEmail";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { sendEmail } from "../services/mailer";
import { getPresignedUploadUrl, getPresignedReadUrl, getObjectBuffer } from "../services/storage";

type Att = { key: string; name: string; size: number; mimeType: string };

function cleanAttachments(input: unknown): Att[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((a) => a && typeof a.key === "string" && typeof a.name === "string")
    .slice(0, 10)
    .map((a) => ({ key: a.key, name: a.name, size: Number(a.size) || 0, mimeType: a.mimeType || "application/octet-stream" }));
}

// Load S3 buffers so outgoing mail carries the real files (SMTP transport).
async function mailerAttachments(atts: Att[]) {
  const loaded = await Promise.all(atts.map(async (a) => ({
    filename: a.name,
    content: await getObjectBuffer(a.key),
    contentType: a.mimeType,
  })));
  return loaded.filter((a): a is { filename: string; content: Buffer; contentType: string } => a.content !== null);
}

async function presignAll(atts: Att[] | null | undefined) {
  return Promise.all((atts ?? []).map(async (a) => ({ ...a, url: await getPresignedReadUrl(a.key) })));
}

const router = Router();

router.use(authenticate);

const folders = new Set(["inbox", "sent", "drafts", "archive", "trash"]);

router.get("/", authorize("inbox:read"), async (req: AuthRequest, res: Response) => {
  const { folder = "inbox", search, starred } = req.query;
  const where: WhereOptions = { ownerEmail: req.user?.companyEmail || "admin@rhinontech.in", isInternal: false };

  if (typeof folder === "string" && folders.has(folder)) {
    where.folder = folder;
  }

  if (starred === "true") {
    where.isStarred = true;
  }

  if (typeof search === "string" && search.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or as keyof WhereOptions] = [
      { fromName: { [Op.iLike]: term } },
      { fromEmail: { [Op.iLike]: term } },
      { subject: { [Op.iLike]: term } },
      { snippet: { [Op.iLike]: term } },
      { body: { [Op.iLike]: term } },
    ];
  }

  const emails = await InboxEmail.findAll({
    where,
    order: [["sentAt", "DESC"]],
    include: [{ model: Campaign, as: "campaign", attributes: ["id", "name"] }],
  });

  res.json(emails);
});

// Internal directory for the composer's To-field suggestions.
router.get("/contacts", authorize("inbox:read"), async (_req: AuthRequest, res: Response) => {
  const users = await User.findAll({
    where: { status: "active" },
    attributes: ["fullName", "companyEmail"],
    order: [["fullName", "ASC"]],
  });
  res.json(users);
});

// Presigned S3 upload for composer attachments (images, audio, video, files).
router.post("/attachments/presign", authorize("inbox:write"), async (req: AuthRequest, res: Response) => {
  const { filename, mimeType } = req.body;
  if (!filename || !mimeType) {
    res.status(400).json({ message: "filename and mimeType are required" });
    return;
  }
  const { uploadUrl, key } = await getPresignedUploadUrl("inbox", filename, mimeType);
  res.json({ uploadUrl, key });
});

// Internal note — pinned to the thread for the team, never emailed.
router.post("/:id/note", authorize("inbox:write"), async (req: AuthRequest, res: Response) => {
  const body = typeof req.body.body === "string" ? req.body.body.trim() : "";
  const attachments = cleanAttachments(req.body.attachments);
  if (!body && attachments.length === 0) {
    res.status(400).json({ message: "Note body or an attachment is required" });
    return;
  }
  const original = await InboxEmail.findByPk(req.params.id);
  if (!original) {
    res.status(404).json({ message: "Email not found" });
    return;
  }
  const note = await InboxEmail.create({
    threadKey: original.threadKey,
    folder: original.folder,
    fromName: req.user?.fullName || "Rhinon",
    fromEmail: req.user?.companyEmail || "admin@rhinontech.in",
    toEmails: [],
    ccEmails: [],
    subject: original.subject,
    body,
    snippet: body.slice(0, 160),
    ownerEmail: original.ownerEmail,
    isRead: true,
    isStarred: false,
    hasAttachment: attachments.length > 0,
    attachments,
    isInternal: true,
    sentAt: new Date(),
  });
  res.status(201).json({ ...note.toJSON(), attachments: await presignAll(note.attachments) });
});

router.get("/:id", authorize("inbox:read"), async (req: AuthRequest, res: Response) => {
  const email = await InboxEmail.findByPk(req.params.id, {
    include: [{ model: Campaign, as: "campaign", attributes: ["id", "name"] }],
  });

  if (!email) {
    res.status(404).json({ message: "Email not found" });
    return;
  }

  if (email.ownerEmail !== (req.user?.companyEmail || "admin@rhinontech.in")) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  if (!email.isRead) {
    await email.update({ isRead: true });
  }

  const thread = await InboxEmail.findAll({
    where: { threadKey: email.threadKey, ownerEmail: req.user?.companyEmail || "admin@rhinontech.in" },
    order: [["sentAt", "ASC"]],
  });

  // Presign attachment URLs and resolve sender avatars (team members only).
  const avatarCache = new Map<string, string | null>();
  const serialized = [];
  for (const item of thread) {
    let senderAvatarUrl: string | null = null;
    const from = item.fromEmail.toLowerCase();
    if (!avatarCache.has(from)) {
      const sender = await User.findOne({ where: { companyEmail: from }, attributes: ["avatarKey"] });
      avatarCache.set(from, sender?.avatarKey ? await getPresignedReadUrl(sender.avatarKey) : null);
    }
    senderAvatarUrl = avatarCache.get(from) ?? null;
    serialized.push({ ...item.toJSON(), attachments: await presignAll(item.attachments), senderAvatarUrl });
  }

  res.json({ ...email.toJSON(), isRead: true, attachments: await presignAll(email.attachments), thread: serialized });
});

router.post("/", authorize("inbox:write"), async (req: AuthRequest, res: Response) => {
  const { toEmails, ccEmails = [], subject, body, folder = "sent" } = req.body;
  const attachments = cleanAttachments(req.body.attachments);

  if (!Array.isArray(toEmails) || toEmails.length === 0 || !subject || !body) {
    res.status(400).json({ message: "To, subject and body are required" });
    return;
  }

  const sentAt = new Date();
  const threadKey = `thread-${sentAt.getTime()}`;
  const fromEmail = req.user?.companyEmail || "admin@rhinontech.in";
  const isDraft = folder === "drafts";

  if (!isDraft) {
    try {
      await sendEmail({
        to: toEmails,
        cc: ccEmails,
        from: fromEmail,
        fromName: req.user?.fullName,
        via: "ses",
        subject,
        html: body,
        text: body,
        attachments: attachments.length ? await mailerAttachments(attachments) : undefined,
      });
    } catch (err) {
      res.status(502).json({ message: err instanceof Error ? err.message : "Failed to deliver email" });
      return;
    }
  }

  const email = await InboxEmail.create({
    threadKey,
    folder: isDraft ? "drafts" : "sent",
    fromName: req.user?.fullName || "Rhinon",
    fromEmail,
    toEmails,
    ccEmails,
    subject,
    body,
    snippet: body.slice(0, 160),
    ownerEmail: fromEmail,
    isRead: true,
    isStarred: false,
    hasAttachment: attachments.length > 0,
    attachments,
    sentAt,
  });

  res.status(201).json({ ...email.toJSON(), attachments: await presignAll(email.attachments) });
});

router.post("/:id/reply", authorize("inbox:write"), async (req: AuthRequest, res: Response) => {
  const { body } = req.body;
  const attachments = cleanAttachments(req.body.attachments);

  if ((!body || typeof body !== "string" || !body.trim()) && attachments.length === 0) {
    res.status(400).json({ message: "Reply body or an attachment is required" });
    return;
  }

  const original = await InboxEmail.findByPk(req.params.id);
  if (!original) {
    res.status(404).json({ message: "Email not found" });
    return;
  }

  const reply = await InboxEmail.create({
    threadKey: original.threadKey,
    folder: "sent",
    fromName: req.user?.fullName || "Rhinon",
    fromEmail: req.user?.companyEmail || "admin@rhinontech.in",
    toEmails: [original.fromEmail],
    ccEmails: [],
    subject: original.subject.startsWith("Re:") ? original.subject : `Re: ${original.subject}`,
    body: (body || "").trim(),
    snippet: (body || "").trim().slice(0, 160),
    ownerEmail: req.user?.companyEmail || "admin@rhinontech.in",
    isRead: true,
    isStarred: false,
    hasAttachment: attachments.length > 0,
    attachments,
    // Keep the whole thread tagged to the same campaign/lead so replying-back
    // from the shared Inbox still shows up inside the campaign's own inbox.
    campaignId: original.campaignId,
    leadId: original.leadId,
    sentAt: new Date(),
  });

  try {
    await sendEmail({
      to: reply.toEmails,
      from: reply.fromEmail,
      fromName: req.user?.fullName,
      via: "ses",
      subject: reply.subject,
      html: reply.body || `${attachments.length} attachment(s)`,
      text: reply.body || `${attachments.length} attachment(s)`,
      attachments: attachments.length ? await mailerAttachments(attachments) : undefined,
    });
  } catch (err) {
    await reply.destroy().catch(() => {});
    res.status(502).json({ message: err instanceof Error ? err.message : "Failed to deliver reply" });
    return;
  }

  res.status(201).json({ ...reply.toJSON(), attachments: await presignAll(reply.attachments) });
});

router.patch("/:id", authorize("inbox:write"), async (req: AuthRequest, res: Response) => {
  const email = await InboxEmail.findByPk(req.params.id);

  if (!email) {
    res.status(404).json({ message: "Email not found" });
    return;
  }

  if (email.ownerEmail !== (req.user?.companyEmail || "admin@rhinontech.in")) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const updates: {
    folder?: InboxEmailFolder;
    isRead?: boolean;
    isStarred?: boolean;
  } = {};

  if (typeof req.body.folder === "string") {
    if (!folders.has(req.body.folder)) {
      res.status(400).json({ message: "Invalid folder" });
      return;
    }
    updates.folder = req.body.folder;
  }

  if (typeof req.body.isRead === "boolean") {
    updates.isRead = req.body.isRead;
  }

  if (typeof req.body.isStarred === "boolean") {
    updates.isStarred = req.body.isStarred;
  }

  await email.update(updates);
  res.json(email);
});

export default router;
