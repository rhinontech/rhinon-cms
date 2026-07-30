import { Router, Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { Document, User } from "../models";
import { generateOfferLetterPdf, generateNdaPdf, LetterSignature } from "../services/letters";
import { uploadBuffer, deleteObject, getPresignedReadUrl } from "../services/storage";
import { sendEmail } from "../services/mailer";
import { welcomeEmail } from "../services/emailTemplates";

const router = Router();

// Offer letter is reviewed/signed before the NDA, regardless of DB row order —
// alphabetically "nda" < "offer_letter", so this must be explicit.
const CATEGORY_ORDER: Record<string, number> = { offer_letter: 0, nda: 1 };

function validSession(token: string) {
  return {
    signingToken: token,
    signingTokenExpiry: { [Op.gt]: new Date() },
  };
}

// GET /document-signing/:token — public, read-only. Lists the documents in this
// signing session (offer letter + NDA created together for one new hire).
router.get("/:token", async (req: Request, res: Response) => {
  const docs = await Document.findAll({
    where: validSession(req.params.token),
    include: [{ model: User, as: "employee", attributes: ["id", "fullName", "companyEmail"] }],
  });

  if (docs.length === 0) {
    res.status(404).json({ message: "This signing link has expired or is invalid." });
    return;
  }

  docs.sort((a, b) => (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99));

  const employee = (docs[0] as any).employee;
  const documents = await Promise.all(
    docs.map(async (doc) => ({
      id: doc.id,
      category: doc.category,
      title: doc.title,
      fileName: doc.fileName,
      signed: !!doc.signedAt,
      signedAt: doc.signedAt,
      signatureType: doc.signatureType,
      viewUrl: doc.fileKey ? await getPresignedReadUrl(doc.fileKey) : null,
    }))
  );

  res.json({
    employeeId: employee?.id,
    employeeName: employee?.fullName,
    companyEmail: employee?.companyEmail,
    documents,
    allSigned: docs.every((d) => !!d.signedAt),
  });
});

// POST /document-signing/:token/documents/:documentId/sign — public.
// Body: { type: "typed", fullName } | { type: "drawn", signatureImageBase64 }
router.post("/:token/documents/:documentId/sign", async (req: Request, res: Response) => {
  const doc = await Document.findOne({
    where: { id: req.params.documentId, ...validSession(req.params.token) },
  });
  if (!doc) {
    res.status(404).json({ message: "This signing link has expired or is invalid." });
    return;
  }
  if (doc.signedAt) {
    res.status(409).json({ message: "This document has already been signed." });
    return;
  }

  const user = await User.findByPk(doc.employeeId);
  if (!user) {
    res.status(404).json({ message: "Employee record not found." });
    return;
  }

  const body = req.body ?? {};
  const signedAt = new Date();
  let signature: LetterSignature;
  let signedName: string;
  let signatureImageBuffer: Buffer | null = null;

  if (body.type === "typed") {
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    if (!fullName || fullName.length > 120) {
      res.status(400).json({ message: "A valid full name is required." });
      return;
    }
    signature = { type: "typed", fullName, signedAt };
    signedName = fullName;
  } else if (body.type === "drawn") {
    const raw = typeof body.signatureImageBase64 === "string" ? body.signatureImageBase64 : "";
    const base64 = raw.replace(/^data:image\/\w+;base64,/, "");
    let decoded: Buffer;
    try {
      decoded = Buffer.from(base64, "base64");
    } catch {
      res.status(400).json({ message: "Invalid signature image." });
      return;
    }
    if (decoded.length < 100 || decoded.length > 2 * 1024 * 1024) {
      res.status(400).json({ message: "Signature image is empty or too large." });
      return;
    }
    signatureImageBuffer = decoded;
    signature = { type: "drawn", imageBuffer: decoded, signedAt };
    signedName = user.legalName || user.fullName;
  } else {
    res.status(400).json({ message: `type must be "typed" or "drawn"` });
    return;
  }

  // Render from the snapshot taken at document-creation time (contentBlocks)
  // rather than regenerating from live User fields — that snapshot is what
  // any pre-send AI edit was applied to, and re-deriving from `user` here
  // would silently discard those edits. Legacy documents created before this
  // column existed (contentBlocks null) fall back to a fresh generation.
  const blocks = doc.contentBlocks ?? undefined;
  const newPdf = doc.category === "nda"
    ? await generateNdaPdf(user, signature, blocks)
    : await generateOfferLetterPdf(user, signature, blocks);

  const newKey = await uploadBuffer(newPdf, doc.fileName || `${doc.category}.pdf`, "documents", "application/pdf");

  let signatureImageKey: string | null = doc.signatureImageKey;
  if (signatureImageBuffer) {
    signatureImageKey = await uploadBuffer(signatureImageBuffer, "signature.png", "documents", "image/png");
  }

  const oldKey = doc.fileKey;
  await doc.update({
    fileKey: newKey,
    fileSize: newPdf.length,
    signedAt,
    signatureType: signature.type,
    signedName,
    signatureImageKey,
  });
  if (oldKey) await deleteObject(oldKey).catch(() => {});

  const sibling = await Document.findOne({
    where: { signingToken: doc.signingToken, id: { [Op.ne]: doc.id } },
  });
  const allSigned = !!doc.signedAt && (!sibling || !!sibling.signedAt);

  // Stage 2 of onboarding: the first email (on member creation) carried only
  // the congratulations + signing link. Once BOTH documents are signed, the
  // credentials/account-setup email fires automatically. Fresh temp password +
  // onboarding token are issued here — the hire has never logged in yet
  // (guarded by !onboarded), so nothing is overwritten that they chose.
  let setupEmailSent: boolean | undefined;
  if (allSigned && !user.onboarded) {
    try {
      const tempPassword = crypto.randomBytes(8).toString("base64url").slice(0, 12);
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const onboardingToken = crypto.randomUUID();
      const onboardingTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await user.update({ passwordHash, onboardingToken, onboardingTokenExpiry });

      const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:4200";
      const { subject, html, text } = welcomeEmail({
        fullName: user.fullName,
        companyEmail: user.companyEmail,
        tempPassword,
        onboardingUrl: `${frontendUrl}/onboard?token=${onboardingToken}`,
      });
      await sendEmail({ to: user.personalEmail, via: "gmail", subject, html, text });
      setupEmailSent = true;
    } catch (err) {
      // Signing itself succeeded — never fail the request over the email. The
      // admin's "Resend invite" remains the manual fallback.
      console.error("Failed to send account-setup email after signing:", err);
      setupEmailSent = false;
    }
  }

  res.json({
    documentId: doc.id,
    signed: true,
    signedAt,
    downloadUrl: await getPresignedReadUrl(newKey),
    allSigned,
    setupEmailSent,
  });
});

export default router;
