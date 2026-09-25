import { Router, Response } from "express";
import { Op, WhereOptions } from "sequelize";
import { InboxEmail, User, Campaign } from "../models";
import { InboxEmailFolder } from "../models/InboxEmail";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { resolveSiteContext } from "../middleware/siteContext";
import { sendEmail } from "../services/mailer";
import { getPresignedUploadUrl, getPresignedReadUrl, getObjectBuffer } from "../services/storage";
import { brandSender } from "../services/siteSender";
import { findMailbox, mailboxesFor, ownerVariants, type UserMailbox } from "../services/userMailboxes";

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
// Brand-split module: the [domain] the admin is showing scopes every read below.
router.use(resolveSiteContext);

/**
 * Every mailbox the signed-in user reads and sends as: their own company
 * address, then any extra address (hello@, support@) the superadmin assigned
 * them in Team → Email addresses.
 *
 * This used to fall back to a literal "admin@rhinontech.in" in eight places.
 * Under multi-tenancy that is a cross-tenant read: any user without a company
 * address — a collaborator, a half-provisioned account — would have been served
 * Rhinon Tech's own inbox. There is no safe default, so refuse instead.
 */
async function requireMailboxes(req: AuthRequest, res: Response): Promise<UserMailbox[] | null> {
  const user = req.user;
  const mailboxes = user
    ? await mailboxesFor({ id: user.userId, companyEmail: user.companyEmail, fullName: user.fullName, emailDomain: user.emailDomain })
    : [];
  if (!mailboxes.length) {
    res.status(409).json({
      message: "This account has no company email address yet, so it has no mailbox.",
    });
    return null;
  }
  return mailboxes;
}

/**
 * The caller's mailboxes as stored on messages, across every brand.
 *
 * `ownerEmail` records the address a message was actually sent from or
 * delivered to, so once a brand has its own sending domain one person owns
 * prabhat@rhinontech.in AND prabhat@uppercurve.in — and hello@ on both, when
 * hello is theirs. Matching a single address here would hide mail from them
 * while the rows sat right there in the table. The brand filter still narrows
 * this per site.
 */
function ownedBy(mailboxes: UserMailbox[]): string | { [Op.in]: string[] } {
  const variants = ownerVariants(mailboxes);
  return variants.length > 1 ? { [Op.in]: variants } : variants[0];
}

function ownsEmail(mailboxes: UserMailbox[], ownerEmail: string): boolean {
  return ownerVariants(mailboxes).includes((ownerEmail || "").toLowerCase());
}

/**
 * Which mailbox a send goes out from: the one asked for, when it is the
 * caller's; otherwise `fallback`. Asking for someone else's address is refused
 * rather than silently swapped, so nobody believes they sent as hello@ when
 * they did not.
 */
function pickSender(mailboxes: UserMailbox[], requested: unknown, fallback: UserMailbox, res: Response): UserMailbox | null {
  if (requested === undefined || requested === null || requested === "") return fallback;
  const chosen = findMailbox(mailboxes, requested);
  if (!chosen) {
    res.status(403).json({ message: "You can only send from your own addresses." });
    return null;
  }
  return chosen;
}

const folders = new Set(["inbox", "sent", "drafts", "archive", "trash"]);

router.get("/", authorize("inbox:read"), async (req: AuthRequest, res: Response) => {
  const { folder = "inbox", search, starred, mailbox: only } = req.query;
  const mailboxes = await requireMailboxes(req, res);
  if (!mailboxes) return;
  // ?mailbox= narrows to one of the caller's addresses; anything else is ignored.
  const chosen = findMailbox(mailboxes, only);
  const where: WhereOptions = { ownerEmail: ownedBy(chosen ? [chosen] : mailboxes), isInternal: false };

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

/**
 * The addresses the caller can send from, as they appear in the brand being
 * viewed — hello@uppercurve.in while working in Uppercurve.
 */
router.get("/addresses", authorize("inbox:read"), async (req: AuthRequest, res: Response) => {
  const mailboxes = await requireMailboxes(req, res);
  if (!mailboxes) return;
  res.json(
    await Promise.all(
      mailboxes.map(async (m) => ({ address: (await brandSender(m.address)) || m.address, name: m.name, shared: m.shared }))
    )
  );
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
  const mailboxes = await requireMailboxes(req, res);
  if (!mailboxes) return;
  const original = await InboxEmail.findByPk(req.params.id);
  if (!original || !ownsEmail(mailboxes, original.ownerEmail)) {
    res.status(404).json({ message: "Email not found" });
    return;
  }
  const mailbox = mailboxes[0].address;
  const note = await InboxEmail.create({
    threadKey: original.threadKey,
    folder: original.folder,
    fromName: req.user?.fullName || "Rhinon",
    fromEmail: mailbox,
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
  const mailboxes = await requireMailboxes(req, res);
  if (!mailboxes) return;
  const email = await InboxEmail.findByPk(req.params.id, {
    include: [{ model: Campaign, as: "campaign", attributes: ["id", "name"] }],
  });

  if (!email) {
    res.status(404).json({ message: "Email not found" });
    return;
  }

  if (!ownsEmail(mailboxes, email.ownerEmail)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  if (!email.isRead) {
    await email.update({ isRead: true });
  }

  const thread = await InboxEmail.findAll({
    where: { threadKey: email.threadKey, ownerEmail: ownedBy(mailboxes) },
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
    serialized.push({
      ...item.toJSON(),
      attachments: await presignAll(item.attachments),
      senderAvatarUrl,
      // Sent by the viewer from ANY of their addresses — own or shared.
      fromMe: ownsEmail(mailboxes, item.fromEmail),
    });
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
  const mailboxes = await requireMailboxes(req, res);
  if (!mailboxes) return;
  const sender = pickSender(mailboxes, req.body.from, mailboxes[0], res);
  if (!sender) return;
  // Sent from the brand the user is working in — the [domain] in the URL.
  const fromEmail = (await brandSender(sender.address)) || sender.address;
  const isDraft = folder === "drafts";

  if (!isDraft) {
    try {
      await sendEmail({
        to: toEmails,
        cc: ccEmails,
        from: fromEmail,
        fromName: sender.name || req.user?.fullName,
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
    fromName: sender.name || req.user?.fullName || "Rhinon",
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

  const mailboxes = await requireMailboxes(req, res);
  if (!mailboxes) return;
  const original = await InboxEmail.findByPk(req.params.id);
  if (!original || !ownsEmail(mailboxes, original.ownerEmail)) {
    res.status(404).json({ message: "Email not found" });
    return;
  }

  // By default a thread is answered from the address it lives in — mail to
  // hello@ is answered as hello@ — unless the sender picks another of theirs.
  const threadMailbox = findMailbox(mailboxes, original.ownerEmail) ?? mailboxes[0];
  const sender = pickSender(mailboxes, req.body.from, threadMailbox, res);
  if (!sender) return;

  // A reply goes out under the brand it is being answered from, so a thread
  // that arrived at Uppercurve is answered by Uppercurve.
  const replyFrom = (await brandSender(sender.address)) || sender.address;

  const reply = await InboxEmail.create({
    threadKey: original.threadKey,
    folder: "sent",
    fromName: sender.name || req.user?.fullName || "Rhinon",
    fromEmail: replyFrom,
    toEmails: [original.fromEmail],
    ccEmails: [],
    subject: original.subject.startsWith("Re:") ? original.subject : `Re: ${original.subject}`,
    body: (body || "").trim(),
    snippet: (body || "").trim().slice(0, 160),
    ownerEmail: replyFrom,
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
      fromName: reply.fromName,
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
  const mailboxes = await requireMailboxes(req, res);
  if (!mailboxes) return;
  const email = await InboxEmail.findByPk(req.params.id);

  if (!email) {
    res.status(404).json({ message: "Email not found" });
    return;
  }

  if (!ownsEmail(mailboxes, email.ownerEmail)) {
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
