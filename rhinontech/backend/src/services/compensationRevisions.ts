import crypto from "crypto";
import { Op } from "sequelize";
import { CompensationRevision, Document, User } from "../models";
import type { CompensationSnapshot } from "../models/CompensationRevision";
import { generateRevisionLetterPdf, revisionLetterTitle } from "./letters";
import { uploadBuffer } from "./storage";
import { sendEmail } from "./mailer";
import { revisionLetterEmail } from "./emailTemplates";
import { todayIST } from "./offboarding";
import { env } from "../config/env";

export function snapshotOf(user: User): CompensationSnapshot {
  return {
    roleTitle: user.roleTitle ?? null,
    department: user.department ?? null,
    basicSalary: Number(user.basicSalary ?? 0),
    hra: Number((user as any).hra ?? 0),
    ta: Number((user as any).ta ?? 0),
    medicalAllowance: Number((user as any).medicalAllowance ?? 0),
    otherAllowances: Number((user as any).otherAllowances ?? 0),
    annualCompensation: Number(user.annualCompensation ?? 0),
  };
}

/** Writes the revision onto the employee; payroll picks it up on the next run. */
export async function applyRevision(rev: CompensationRevision) {
  const user = await User.findByPk(rev.userId);
  if (!user) throw new Error("Employee not found");
  const a = rev.after;
  const before = snapshotOf(user);
  await user.update({
    roleTitle: a.roleTitle ?? undefined,
    department: a.department ?? user.department,
    basicSalary: a.basicSalary,
    hra: a.hra,
    ta: a.ta,
    medicalAllowance: a.medicalAllowance,
    otherAllowances: a.otherAllowances,
    annualCompensation: a.annualCompensation,
  } as any);
  // Re-snapshot "before" at apply time so a scheduled revision diffs against what they really had
  await rev.update({ before, status: "applied", appliedAt: new Date() });
}

/** Daily cron (system context): apply everything whose effective date has arrived. */
export async function applyDueRevisions(): Promise<number> {
  const due = await CompensationRevision.findAll({
    where: { status: "scheduled", effectiveDate: { [Op.lte]: todayIST() } },
    order: [["effectiveDate", "ASC"], ["createdAt", "ASC"]],
  });
  for (const rev of due) {
    try {
      await applyRevision(rev);
      console.log(`[Revisions] Applied ${rev.kind} for ${rev.userId} effective ${rev.effectiveDate}.`);
    } catch (err: any) {
      console.error(`[Revisions] Failed to apply ${rev.id}:`, err.message);
    }
  }
  return due.length;
}

/** Generates the increment / promotion letter, files it as a Document and emails a signing link. */
export async function sendRevisionLetter(rev: CompensationRevision, user: User, sentById: string) {
  const pdf = await generateRevisionLetterPdf(user, rev);
  const title = revisionLetterTitle(rev.kind);
  const fileName = `${title.replace(/\s+/g, "_")}_${user.fullName.replace(/\s+/g, "_")}.pdf`;
  const fileKey = await uploadBuffer(pdf, fileName, "documents", "application/pdf");
  const signingToken = crypto.randomBytes(32).toString("hex");

  const document = await Document.create({
    employeeId: user.id,
    uploadedById: sentById,
    title: `${title} — ${user.fullName}`,
    category: "appraisal",
    fileKey,
    fileName,
    fileSize: pdf.length,
    mimeType: "application/pdf",
    signingToken,
    signingTokenExpiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  } as any);
  await rev.update({ documentId: document.id });

  const to = user.companyEmail || user.personalEmail;
  if (!to) return { document, emailSent: false };
  const mail = revisionLetterEmail({
    fullName: user.fullName,
    kind: rev.kind,
    newTitle: rev.after.roleTitle,
    effectiveDate: rev.effectiveDate,
    signingUrl: `${env.frontendUrl}/sign-documents?token=${signingToken}`,
  });
  try {
    await sendEmail({ to, ...mail });
    return { document, emailSent: true };
  } catch (err: any) {
    console.error("[Revisions] Letter email failed:", err.message);
    return { document, emailSent: false };
  }
}
