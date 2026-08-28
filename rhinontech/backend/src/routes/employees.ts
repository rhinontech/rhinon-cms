import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import multer from "multer";
import { Op } from "sequelize";
import { User, Role, Document } from "../models";
import type { ExitReason } from "../models/User";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { finalizeOffboarding, todayIST } from "../services/offboarding";
import { generateLetterPdf, letterTitle, LetterType, generateOfferLetterPdf, generateNdaPdf, resolveLetterBlocks, applyBlockOverrides } from "../services/letters";
import { sendEmail } from "../services/mailer";
import { welcomeEmail, signDocumentsEmail, resetPasswordEmail } from "../services/emailTemplates";
import { env } from "../config/env";
import { uploadBuffer, deleteObject, getPresignedReadUrl, getPresignedUploadUrl } from "../services/storage";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.use(authenticate);

router.get("/", authorize("employees:read"), async (_req: AuthRequest, res: Response) => {
  const employees = await User.findAll({
    // External collaborators are not employees and must never reach this list —
    // it returns the full HR record, PAN and bank details included.
    where: { userType: "internal" },
    include: [{ model: Role, as: "role" }],
    attributes: { exclude: ["passwordHash"] },
  });
  const withAvatars = await Promise.all(
    employees.map(async (e) => {
      const json = e.toJSON() as any;
      if (json.avatarKey) json.avatarUrl = await getPresignedReadUrl(json.avatarKey);
      return json;
    })
  );
  res.json(withAvatars);
});

router.get("/:id", authorize("employees:read"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id, {
    include: [{ model: Role, as: "role" }],
    attributes: { exclude: ["passwordHash"] },
  });
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }
  const json = employee.toJSON() as any;
  if (json.avatarKey) json.avatarUrl = await getPresignedReadUrl(json.avatarKey);
  res.json(json);
});

const employeeEditableFields = [
  "fullName",
  "personalEmail",
  "roleId",
  "department",
  // "status" is deliberately not editable here — use /:id/offboard and /:id/reactivate
  // so exit metadata and cleanup stay consistent.
  "dateOfBirth",
  "pan",
  "employmentType",
  "compensationType",
  "workSchedule",
  "remotePosition",
  "workLocation",
  "paymentFrequency",
  "legalName",
  "roleTitle",
  "annualCompensation",
  "annualVariablePay",
  "pastPayrollFinancialYear",
  "pastTaxableSalary",
  "pastTdsDeducted",
  "bankAccountNumber",
  "bankIfscCode",
  "bankBeneficiaryName",
  "pfUanNumber",
  "esicIpNumber",
  "labourWelfareFundEnabled",
  "npsEnabled",
  "professionalTaxEnabled",
  "basicSalary",
  "hra",
  "ta",
  "medicalAllowance",
  "otherAllowances",
] as const;

function parseOptionalDate(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "string" && value.trim().toLowerCase() === "invalid date") return null;

  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date;
}

function employeePayload(body: Record<string, any>) {
  const payload: Record<string, any> = {};
  for (const field of employeeEditableFields) {
    if (body[field] !== undefined) payload[field] = body[field];
  }
  const joiningDate = parseOptionalDate(body.joiningDate);
  const dateOfBirth = parseOptionalDate(body.dateOfBirth);
  if (joiningDate !== undefined) payload.joiningDate = joiningDate;
  if (dateOfBirth !== undefined) payload.dateOfBirth = dateOfBirth;
  return payload;
}

router.post("/", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const { fullName, personalEmail, roleId, department, joiningDate, emailPrefix } = req.body;

  if (!fullName || !personalEmail || !roleId || !department || !joiningDate || !emailPrefix) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  // Validate emailPrefix format
  if (!/^[a-z0-9._-]+$/.test(emailPrefix.toLowerCase())) {
    res.status(400).json({ message: "Email prefix can only contain letters, numbers, dots, hyphens, and underscores" });
    return;
  }

  const companyEmail = `${emailPrefix.toLowerCase()}@rhinontech.in`;

  // Check companyEmail uniqueness
  const emailTaken = await User.findOne({ where: { companyEmail } });
  if (emailTaken) {
    res.status(409).json({ message: `${companyEmail} is already taken. Choose a different prefix.` });
    return;
  }

  // Enforce one superadmin
  const role = await Role.findByPk(roleId);
  if (role?.slug === "superadmin") {
    const existing = await User.findOne({ include: [{ model: Role, as: "role", where: { slug: "superadmin" } }] });
    if (existing) {
      res.status(400).json({ message: "A Super Admin already exists. Only one superadmin is allowed." });
      return;
    }
  }

  // Auto-generate temp password and onboarding token
  const tempPassword = crypto.randomBytes(8).toString("base64url").slice(0, 12);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const onboardingToken = crypto.randomUUID();
  const onboardingTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const parsedJoiningDate = parseOptionalDate(joiningDate);
  if (!parsedJoiningDate) {
    res.status(400).json({ message: "A valid joining date is required" });
    return;
  }

  const employee = await User.create({
    fullName,
    personalEmail,
    roleId,
    department,
    joiningDate: parsedJoiningDate,
    companyEmail,
    passwordHash,
    status: req.body.status ?? "active",
    onboardingToken,
    onboardingTokenExpiry,
    onboarded: false,
    ...employeePayload(req.body),
  });

  // Onboarding documents — generated as unsigned PDFs, but instead of attaching
  // them we issue a shared signing-session token (see routes/documentSigning.ts)
  // so the new hire reviews and e-signs both in one flow, then downloads them.
  const attachDocs = req.body.attachDocs === true || req.body.attachDocs === "true";
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:4200";
  let signingUrl: string | undefined;

  if (attachDocs) {
    try {
      // Resolve the current template against this employee, then splice in
      // whatever the admin AI-edited (or hand-edited) in the create-member
      // form's live preview — the master template itself is never touched.
      // The merged result is snapshotted on each Document row so it (a) is
      // what actually gets rendered below and (b) survives to the signed PDF
      // (see documentSigning.ts, which renders from this snapshot).
      const [offerResolved, ndaResolved] = await Promise.all([
        resolveLetterBlocks("offer", employee, req.body.offerLetterTemplateKey),
        resolveLetterBlocks("nda", employee),
      ]);
      const offerBlocks = applyBlockOverrides(offerResolved.blocks, req.body.offerLetterOverrides);
      const ndaBlocks = applyBlockOverrides(ndaResolved.blocks, req.body.ndaOverrides);

      const offerLetterPdf = await generateOfferLetterPdf(employee, undefined, offerBlocks);
      const ndaPdf = await generateNdaPdf(employee, undefined, ndaBlocks);

      const offerLetterName = `Offer-Letter-${employee.fullName.replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`;
      const ndaName = `NDA-${employee.fullName.replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`;

      const offerKey = await uploadBuffer(offerLetterPdf, offerLetterName, "documents", "application/pdf");
      const ndaKey = await uploadBuffer(ndaPdf, ndaName, "documents", "application/pdf");

      const signingToken = crypto.randomUUID();
      const signingTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await Document.create({
        employeeId: employee.id,
        uploadedById: req.user!.userId,
        title: `Offer Letter — ${employee.fullName}`,
        category: "offer_letter",
        fileKey: offerKey,
        fileName: offerLetterName,
        fileSize: offerLetterPdf.length,
        mimeType: "application/pdf",
        signingToken,
        signingTokenExpiry,
        contentBlocks: offerBlocks,
        templateVersion: offerResolved.templateVersion,
      });

      await Document.create({
        employeeId: employee.id,
        uploadedById: req.user!.userId,
        title: `NDA — ${employee.fullName}`,
        category: "nda",
        fileKey: ndaKey,
        fileName: ndaName,
        fileSize: ndaPdf.length,
        mimeType: "application/pdf",
        signingToken,
        signingTokenExpiry,
        contentBlocks: ndaBlocks,
        templateVersion: ndaResolved.templateVersion,
      });

      signingUrl = `${frontendUrl}/sign-documents?token=${signingToken}`;
    } catch (docErr) {
      console.error("Failed to generate and upload onboarding documents:", docErr);
    }
  }

  // Send the first onboarding email — non-fatal (the member is already created
  // and the admin can use "Resend invite"), but the response says whether it
  // went out so the failure is never silent.
  //
  // Two-stage flow: when there are documents to sign, this first email is a
  // congratulations + signing link ONLY — the credentials/setup email is
  // triggered automatically once both documents are signed (documentSigning.ts).
  // Without documents (attachDocs off, or generation failed), send the full
  // credentials email immediately so the hire is never left without a way in.
  let welcomeEmailSent = false;
  try {
    const template = signingUrl
      ? signDocumentsEmail({ fullName, roleTitle: employee.roleTitle || undefined, signingUrl })
      : welcomeEmail({
          fullName,
          companyEmail,
          tempPassword,
          onboardingUrl: `${frontendUrl}/onboard?token=${onboardingToken}`,
        });
    await sendEmail({ to: personalEmail, via: "gmail", subject: template.subject, html: template.html, text: template.text });
    welcomeEmailSent = true;
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }

  res.status(201).json({
    ...employee.toJSON(),
    passwordHash: undefined,
    onboardingToken: undefined,
    welcomeEmailSent,
  });
});

// Live preview of an offer letter / NDA resolved from in-progress form data —
// used by the create/edit member form so the preview always matches the real
// template + token resolution. Nothing is persisted: `User.build` makes an
// in-memory instance only, never written to the database. Returns the
// resolved LetterBlock[] (not a PDF) so the admin panel can render it as
// selectable HTML and offer AI rewrites on it (see LetterBlocksView).
router.post("/preview-documents", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const type = req.body.type === "nda" ? "nda" : "offer";
  const { fullName, legalName, roleTitle, workLocation, employmentType, workSchedule, remotePosition, joiningDate, department, annualCompensation, annualVariablePay } = req.body;

  if (!fullName) {
    res.status(400).json({ message: "Full name is required to preview." });
    return;
  }

  const draft = User.build({
    fullName,
    legalName: legalName || undefined,
    roleTitle: roleTitle || undefined,
    workLocation: workLocation || undefined,
    employmentType: employmentType || undefined,
    workSchedule: workSchedule || undefined,
    remotePosition: remotePosition === true || remotePosition === "true",
    department: department || "",
    joiningDate: parseOptionalDate(joiningDate) || new Date(),
    annualCompensation: annualCompensation ? Number(annualCompensation) : undefined,
    annualVariablePay: annualVariablePay ? Number(annualVariablePay) : undefined,
    personalEmail: "preview@example.com",
    passwordHash: "",
    roleId: "",
  });

  try {
    const templateKey = typeof req.body.templateKey === "string" ? req.body.templateKey : undefined;
    const { blocks, templateVersion, tokens, templateKey: resolvedKey } = await resolveLetterBlocks(type, draft, templateKey);
    res.json({ blocks, templateVersion, tokens, templateKey: resolvedKey });
  } catch (err) {
    console.error("Failed to render document preview:", err);
    res.status(500).json({ message: "Could not render the preview." });
  }
});

router.put("/:id", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }
  // Enforce one superadmin — if changing someone else's role TO superadmin, block it
  if (req.body.roleId) {
    const role = await Role.findByPk(req.body.roleId);
    if (role?.slug === "superadmin" && employee.roleId !== req.body.roleId) {
      const existing = await User.findOne({ include: [{ model: Role, as: "role", where: { slug: "superadmin" } }] });
      if (existing && existing.id !== employee.id) {
        res.status(400).json({ message: "A Super Admin already exists. Only one superadmin is allowed." });
        return;
      }
    }
  }
  await employee.update(employeePayload(req.body));
  res.json({ ...employee.toJSON(), passwordHash: undefined });
});

// Avatar upload
router.put("/:id/avatar", authorize("employees:write"), upload.single("avatar"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id);
  if (!employee) { res.status(404).json({ message: "Employee not found" }); return; }
  if (!req.file) { res.status(400).json({ message: "No file provided" }); return; }

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(req.file.mimetype)) {
    res.status(400).json({ message: "Only JPEG, PNG, and WebP images are allowed" });
    return;
  }

  // Delete old avatar if exists
  if (employee.avatarKey) {
    await deleteObject(employee.avatarKey).catch(() => {});
  }

  const key = await uploadBuffer(req.file.buffer, req.file.originalname, "avatars", req.file.mimetype);
  await employee.update({ avatarKey: key });

  const avatarUrl = await getPresignedReadUrl(key);
  res.json({ avatarUrl });
});

// Document upload (presigned URL — client uploads directly to S3)
router.post("/:id/documents/presign", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const { filename, mimeType } = req.body;
  if (!filename || !mimeType) { res.status(400).json({ message: "filename and mimeType are required" }); return; }

  const employee = await User.findByPk(req.params.id);
  if (!employee) { res.status(404).json({ message: "Employee not found" }); return; }

  const { uploadUrl, key } = await getPresignedUploadUrl("documents", filename, mimeType);
  const readUrl = await getPresignedReadUrl(key);
  res.json({ uploadUrl, key, url: readUrl });
});

const EXIT_REASONS: ExitReason[] = ["Resignation", "Termination", "Contract ended", "Absconded", "Other"];

// Offboard — record last working day + reason. If the last working day is today or
// earlier the employee is deactivated immediately (with cleanup); a future date keeps
// them active until the daily cron finalizes it after that day ends.
router.post("/:id/offboard", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id, { include: [{ model: Role, as: "role" }] });
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }
  if (employee.status === "inactive") {
    res.status(400).json({ message: "This employee is already offboarded." });
    return;
  }
  if (employee.id === req.user!.userId) {
    res.status(400).json({ message: "You cannot offboard your own account." });
    return;
  }
  if ((employee as any).role?.slug === "superadmin") {
    res.status(400).json({ message: "The superadmin account cannot be offboarded." });
    return;
  }

  const today = todayIST();
  let exitDateStr = today;
  if (req.body.exitDate !== undefined && req.body.exitDate !== null && req.body.exitDate !== "") {
    const parsed = parseOptionalDate(req.body.exitDate);
    if (!parsed) {
      res.status(400).json({ message: "exitDate must be a valid date" });
      return;
    }
    exitDateStr = parsed.toISOString().split("T")[0];
  }

  const exitReason: ExitReason = EXIT_REASONS.includes(req.body.exitReason)
    ? req.body.exitReason
    : "Other";
  const exitNotes = typeof req.body.exitNotes === "string"
    ? req.body.exitNotes.trim().slice(0, 2000) || null
    : null;

  await employee.update({ exitDate: exitDateStr as any, exitReason, exitNotes });

  if (exitDateStr <= today) {
    const cleanup = await finalizeOffboarding(employee);
    res.json({
      message: "Employee offboarded",
      id: employee.id,
      effective: "immediate",
      exitDate: exitDateStr,
      cleanup,
    });
    return;
  }

  res.json({
    message: `Exit scheduled — access will be revoked after ${exitDateStr}`,
    id: employee.id,
    effective: "scheduled",
    exitDate: exitDateStr,
  });
});

// Reactivate — cancel a scheduled exit, or restore an offboarded employee.
router.post("/:id/reactivate", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }
  if (employee.status === "active" && !employee.exitDate) {
    res.status(400).json({ message: "This employee is already active." });
    return;
  }

  const wasInactive = employee.status === "inactive";
  await employee.update({ status: "active", exitDate: null, exitReason: null, exitNotes: null });
  res.json({
    message: wasInactive ? "Employee reactivated" : "Scheduled exit cancelled",
    id: employee.id,
  });
});

// Preview a relieving/experience letter — renders the PDF on the fly, no Documents
// row, no email. Lets HR check the content before committing to /letters below.
router.get("/:id/letters/preview", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const type: LetterType = req.query.type === "experience" ? "experience" : "relieving";

  const employee = await User.findByPk(req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }
  if (!employee.exitDate) {
    res.status(400).json({ message: "This member has no exit on record. Offboard them first." });
    return;
  }

  const pdf = await generateLetterPdf(type, employee);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");
  res.send(pdf);
});

// Generate a relieving/experience letter (PDF) — saved to Documents and emailed
// to the member's personal email.
router.post("/:id/letters", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const type: LetterType = req.body.type === "experience" ? "experience" : "relieving";

  const employee = await User.findByPk(req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }
  if (!employee.exitDate) {
    res.status(400).json({ message: "This member has no exit on record. Offboard them first." });
    return;
  }

  const title = letterTitle(type);
  const pdf = await generateLetterPdf(type, employee);
  const fileName = `${title.replace(/ /g, "-")}-${employee.fullName.replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`;

  const fileKey = await uploadBuffer(pdf, fileName, "documents", "application/pdf");
  const document = await Document.create({
    employeeId: employee.id,
    uploadedById: req.user!.userId,
    title: `${title} — ${employee.fullName}`,
    category: "other",
    fileKey,
    fileName,
    fileSize: pdf.length,
    mimeType: "application/pdf",
  });

  let emailedTo: string | null = null;
  const emailTarget = employee.personalEmail || employee.companyEmail;
  if (emailTarget) {
    try {
      await sendEmail({
        to: emailTarget,
        subject: `${title} — Rhinon Tech`,
        html: `<p>Dear ${employee.fullName},</p><p>Please find your ${title.toLowerCase()} from Rhinon Tech attached with this email.</p><p>We wish you the very best.</p><p>— Rhinon Tech</p>`,
        text: `Dear ${employee.fullName},\n\nPlease find your ${title.toLowerCase()} from Rhinon Tech attached with this email.\n\nWe wish you the very best.\n\n— Rhinon Tech`,
        attachments: [{ filename: fileName, content: pdf, contentType: "application/pdf" }],
      });
      emailedTo = emailTarget;
    } catch (err: any) {
      console.error("Failed to email letter:", err.message);
    }
  }

  const url = await getPresignedReadUrl(fileKey);
  res.status(201).json({
    message: emailedTo ? `${title} generated and emailed to ${emailedTo}` : `${title} generated (email could not be sent)`,
    documentId: document.id,
    url,
    emailedTo,
  });
});

const EXIT_CHECKLIST_KEYS = [
  "emailDisabled",
  "assetsReturned",
  "accessRevoked",
  "settlementPaid",
  "lettersIssued",
] as const;

// Update the exit checklist (manual offboarding steps HR tracks per leaver)
router.put("/:id/exit-checklist", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }
  if (!employee.exitDate) {
    res.status(400).json({ message: "This member has no exit on record." });
    return;
  }

  const next: Record<string, boolean> = { ...(employee.exitChecklist ?? {}) };
  for (const key of EXIT_CHECKLIST_KEYS) {
    const value = req.body?.checklist?.[key];
    if (typeof value === "boolean") next[key] = value;
  }
  await employee.update({ exitChecklist: next });
  res.json({ exitChecklist: next });
});

// Resend onboarding invite — regenerate a fresh temp password + onboarding link and re-email it.
// Useful when the original welcome email was lost or the 48h token expired.
router.post("/:id/resend-onboarding", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }

  const tempPassword = crypto.randomBytes(8).toString("base64url").slice(0, 12);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const onboardingToken = crypto.randomUUID();
  const onboardingTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await employee.update({ passwordHash, onboardingToken, onboardingTokenExpiry, onboarded: false });

  // Re-include the e-signing link when unsigned onboarding documents exist —
  // if the original welcome email was lost, this is the hire's only way back
  // into the signing session. The token is reused (previously shared links stay
  // valid); only its expiry is refreshed alongside the new invite.
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:4200";
  let signingUrl: string | undefined;
  const unsignedDoc = await Document.findOne({
    where: { employeeId: employee.id, signedAt: null, signingToken: { [Op.ne]: null } },
    order: [["createdAt", "DESC"]],
  });
  if (unsignedDoc?.signingToken) {
    await Document.update(
      { signingTokenExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000) },
      { where: { signingToken: unsignedDoc.signingToken } }
    );
    signingUrl = `${frontendUrl}/sign-documents?token=${unsignedDoc.signingToken}`;
  }

  try {
    const onboardingUrl = `${frontendUrl}/onboard?token=${onboardingToken}`;
    const { subject, html, text } = welcomeEmail({
      fullName: employee.fullName,
      companyEmail: employee.companyEmail,
      tempPassword,
      onboardingUrl,
      signingUrl,
    });
    await sendEmail({ to: employee.personalEmail, via: "gmail", subject, html, text });
  } catch (err) {
    console.error("Failed to resend welcome email:", err);
    res.status(502).json({ message: "Could not send the invite email. Check email configuration." });
    return;
  }

  res.json({ message: "Invite re-sent", id: employee.id, sentTo: employee.personalEmail });
});

// Signing status for this employee's offer letter / NDA — used by the edit-member
// form to decide whether to show a "Resend for signing" action (only meaningful
// while unsigned; a signed document is a legal record and isn't editable in place).
router.get("/:id/documents/status", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }
  const docs = await Document.findAll({
    where: { employeeId: employee.id, category: ["offer_letter", "nda"] },
    order: [["createdAt", "DESC"]],
  });
  const statusFor = (category: "offer_letter" | "nda") => {
    const doc = docs.find((d) => d.category === category);
    return { exists: !!doc, signed: !!doc?.signedAt, documentId: doc?.id ?? null };
  };
  res.json({ offer_letter: statusFor("offer_letter"), nda: statusFor("nda") });
});

// Regenerates this employee's offer letter and/or NDA from their current
// field values + template selection + AI/manual overrides, and re-sends ONE
// signing email — mirroring the original attachDocs flow in POST /employees
// (one combined email, one shared signing session covering both documents),
// not a separate email per document. Any already-signed document is silently
// left untouched (it's a legal record); only unsigned ones are regenerated.
router.post("/:id/documents/resend", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }

  const docs = await Document.findAll({
    where: { employeeId: employee.id, category: ["offer_letter", "nda"] },
    order: [["createdAt", "DESC"]],
  });
  const offerDoc = docs.find((d) => d.category === "offer_letter");
  const ndaDoc = docs.find((d) => d.category === "nda");
  if (!offerDoc && !ndaDoc) {
    res.status(404).json({ message: "No documents have been generated for this employee yet." });
    return;
  }

  const targets = [offerDoc, ndaDoc].filter((d): d is NonNullable<typeof d> => !!d && !d.signedAt);
  if (targets.length === 0) {
    res.status(400).json({ message: "Both documents have already been signed — nothing to resend." });
    return;
  }

  try {
    const regenerated: string[] = [];
    let signingToken: string | null = null;

    for (const doc of targets) {
      const category = doc.category as "offer_letter" | "nda";
      const type = category === "nda" ? "nda" : "offer";
      const resolved = await resolveLetterBlocks(type, employee, category === "offer_letter" ? req.body.offerLetterTemplateKey : undefined);
      const overrides = category === "offer_letter" ? req.body.offerLetterOverrides : req.body.ndaOverrides;
      const blocks = applyBlockOverrides(resolved.blocks, overrides);
      const pdf = category === "nda" ? await generateNdaPdf(employee, undefined, blocks) : await generateOfferLetterPdf(employee, undefined, blocks);

      const fileName = doc.fileName || `${category === "nda" ? "NDA" : "Offer-Letter"}-${employee.fullName.replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`;
      const newKey = await uploadBuffer(pdf, fileName, "documents", "application/pdf");
      const oldKey = doc.fileKey;

      await doc.update({
        fileKey: newKey,
        fileName,
        fileSize: pdf.length,
        contentBlocks: blocks,
        templateVersion: resolved.templateVersion,
        signingTokenExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });
      if (oldKey) await deleteObject(oldKey).catch(() => {});

      signingToken = doc.signingToken;
      regenerated.push(category);
    }

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:4200";
    const signingUrl = `${frontendUrl}/sign-documents?token=${signingToken}`;
    const { subject, html, text } = signDocumentsEmail({
      fullName: employee.fullName,
      roleTitle: employee.roleTitle || undefined,
      signingUrl,
      updated: true,
    });
    await sendEmail({ to: employee.personalEmail, via: "gmail", subject, html, text });

    res.json({ message: "Documents updated and re-sent for signing.", regenerated, sentTo: employee.personalEmail });
  } catch (err) {
    console.error("Failed to regenerate/resend documents:", err);
    res.status(500).json({ message: "Could not regenerate and resend the documents." });
  }
});

// Admin-triggered password reset — emails a reset link without overwriting the current password.
// Best for members who have already onboarded but are locked out.
router.post("/:id/send-reset", authorize("employees:write"), async (req: AuthRequest, res: Response) => {
  const employee = await User.findByPk(req.params.id);
  if (!employee) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }

  const resetToken = crypto.randomUUID();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await employee.update({ resetToken, resetTokenExpiry });

  try {
    const resetUrl = `${env.frontendUrl}/auth/reset-password?token=${resetToken}`;
    const { subject, html, text } = resetPasswordEmail({ fullName: employee.fullName, resetUrl });
    await sendEmail({ to: employee.personalEmail, via: "gmail", subject, html, text });
  } catch (err) {
    console.error("Failed to send reset email:", err);
    res.status(502).json({ message: "Could not send the reset email. Check email configuration." });
    return;
  }

  res.json({ message: "Reset link sent", id: employee.id, sentTo: employee.personalEmail });
});

export default router;
