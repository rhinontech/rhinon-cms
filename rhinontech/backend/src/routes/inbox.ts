import { Router, Response } from "express";
import { Op, WhereOptions } from "sequelize";
import { InboxEmail } from "../models";
import { InboxEmailFolder } from "../models/InboxEmail";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { sendEmail } from "../services/mailer";

const router = Router();

router.use(authenticate);

const folders = new Set(["inbox", "sent", "drafts", "archive", "trash"]);

router.get("/", authorize("inbox:read"), async (req: AuthRequest, res: Response) => {
  const { folder = "inbox", search, starred } = req.query;
  const where: WhereOptions = { ownerEmail: req.user?.companyEmail || "admin@rhinontech.in" };

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
  });

  res.json(emails);
});

router.get("/:id", authorize("inbox:read"), async (req: AuthRequest, res: Response) => {
  const email = await InboxEmail.findByPk(req.params.id);

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

  res.json({ ...email.toJSON(), isRead: true, thread });
});

router.post("/", authorize("inbox:write"), async (req: AuthRequest, res: Response) => {
  const { toEmails, ccEmails = [], subject, body, folder = "sent" } = req.body;

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
        subject,
        html: body,
        text: body,
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
    hasAttachment: false,
    sentAt,
  });

  res.status(201).json(email);
});

router.post("/:id/reply", authorize("inbox:write"), async (req: AuthRequest, res: Response) => {
  const { body } = req.body;

  if (!body || typeof body !== "string" || !body.trim()) {
    res.status(400).json({ message: "Reply body is required" });
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
    body: body.trim(),
    snippet: body.trim().slice(0, 160),
    ownerEmail: req.user?.companyEmail || "admin@rhinontech.in",
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    sentAt: new Date(),
  });

  try {
    await sendEmail({
      to: reply.toEmails,
      from: reply.fromEmail,
      subject: reply.subject,
      html: reply.body,
      text: reply.body,
    });
  } catch (err) {
    await reply.destroy().catch(() => {});
    res.status(502).json({ message: err instanceof Error ? err.message : "Failed to deliver reply" });
    return;
  }

  res.status(201).json(reply);
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
