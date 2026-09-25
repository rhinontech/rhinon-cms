import { Router, Response } from "express";
import { Op } from "sequelize";
import { sequelize } from "../config/database";
import { AuthRequest } from "../middleware/authenticate";
import { Event, EventGuest, EventEmailTemplate, EventEnrollmentEmail, EventCertificateTemplate, MailboxAddress, User } from "../models";
import {
  EMAIL_TARGET_ROLES,
  EMAIL_TARGET_TYPES,
  type EmailTargetRole,
  type EmailTargetType,
} from "../models/EventEmailTemplate";
import { ENROLLMENT_EMAIL_TYPES, INVITE_EMAIL_TYPES, type EnrollmentEmailType } from "../models/EventEnrollmentEmail";
import type { CertificateField } from "../models/EventCertificateTemplate";
import {
  cleanHtml,
  deliverTemplate,
  placeholdersFor,
  recipientWhere,
  renderForGuest,
  replacePlaceholders,
  sendEnrollmentEmail,
  sendEventEmail,
  eventSender,
  wrapEmailTemplate,
} from "../services/eventEmail";
import {
  CERTIFICATE_FONTS,
  approveCertificate,
  certificateDownloadUrl,
  issueCertificate,
  renderCertificate,
} from "../services/eventCertificate";
import { uploadBuffer, publicUrl } from "../services/storage";
import { brandSender } from "../services/siteSender";
import { mailboxesFor } from "../services/userMailboxes";

/**
 * Everything around an event beyond its own row: guest approval, referrals,
 * reminder and enrollment emails, certificates and feedback. Ported from
 * Product Space's eventController / eventEmailTemplateController /
 * eventCertificateController, adapted to guests-by-email (no accounts),
 * multi-tenancy and this backend's mailer. Mounted inside the events router,
 * so every route here is behind login and the content permissions.
 */
const router = Router();

type Handler = (req: AuthRequest, res: Response) => Promise<unknown>;
const handle = (fn: Handler) => async (req: AuthRequest, res: Response) => {
  try {
    await fn(req, res);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    if (status >= 500) console.error(`[Events] ${req.method} ${req.path} failed:`, err);
    res.status(status).json({ result: "ERROR", message: (err as Error).message || "Internal server error" });
  }
};
const fail = (status: number, message: string) => Object.assign(new Error(message), { status });

async function eventOr404(id: unknown) {
  const event = typeof id === "string" && id ? await Event.findByPk(id) : null;
  if (!event) throw fail(404, "Event not found");
  return event;
}

/* ============================================================ guests ==== */

const GUEST_STATUSES = ["Approved", "Waitlist", "Declined"] as const;

/**
 * Approve / waitlist / decline guests. Approving or declining emails each
 * guest their enrollment email for the new status — in Product Space the
 * admin made a second call (/email/test) to do that; here it's one step, and
 * `notify: false` skips the email.
 */
router.post(
  "/approve-guests",
  handle(async (req, res) => {
    const { userIds, status, eventId, notify = true } = req.body || {};
    if (!Array.isArray(userIds) || userIds.length === 0 || !eventId) throw fail(400, "userIds (array) and eventId are required");
    if (!GUEST_STATUSES.includes(status)) throw fail(400, "status must be Approved, Waitlist or Declined");
    const event = await eventOr404(eventId);

    const guests = await EventGuest.findAll({
      where: { eventId, [Op.or]: [{ id: { [Op.in]: userIds } }, { userId: { [Op.in]: userIds } }] },
    });
    const changed = guests.filter((g) => g.guestType !== status);
    await EventGuest.update({ guestType: status }, { where: { id: { [Op.in]: changed.map((g) => g.id) } } });

    let emailed = 0;
    if (notify && status !== "Waitlist") {
      for (const guest of changed) {
        guest.guestType = status;
        const result = await sendEnrollmentEmail(event, guest, status as EnrollmentEmailType).catch((err) => {
          console.error(`[Events] ${status} email to ${guest.email} failed:`, err.message);
          return { sent: false };
        });
        if (result.sent) emailed += 1;
      }
    }
    res.json({ result: "SUCCESS", message: `${changed.length} guest(s) updated`, updated: changed.length, emailed });
  })
);

/** Re-sends an enrollment email of a given type to chosen guests (Product Space's /email/test). */
router.post(
  "/send-notification",
  handle(async (req, res) => {
    const { type, userIds, eventId } = req.body || {};
    if (!ENROLLMENT_EMAIL_TYPES.includes(type)) throw fail(400, `type must be one of ${ENROLLMENT_EMAIL_TYPES.join(", ")}`);
    if (!Array.isArray(userIds) || !userIds.length) throw fail(400, "userIds (array) is required");
    const event = await eventOr404(eventId);
    const guests = await EventGuest.findAll({ where: { eventId, id: { [Op.in]: userIds } } });
    let sent = 0;
    const skipped: string[] = [];
    for (const guest of guests) {
      const result = await sendEnrollmentEmail(event, guest, type);
      if (result.sent) sent += 1;
      else skipped.push(guest.email || guest.id);
    }
    if (!sent && guests.length) {
      throw fail(400, `No ${type} email is set up for this event yet — add one under Emails → Enrollment.`);
    }
    res.json({ result: "SUCCESS", sent, skipped });
  })
);

/* ========================================================= referrals ==== */

/**
 * Referrers are the guests who OWN a code (ownReferralCode); referees are the
 * guests who registered WITH it. The previous version grouped by the code
 * guests had used and named the first of them the referrer — so the report
 * credited referrals to one of the people who had been referred.
 */
async function referralSummary(eventId: string) {
  const guests = await EventGuest.findAll({ where: { eventId } });
  const owners = new Map(guests.filter((g) => g.ownReferralCode).map((g) => [g.ownReferralCode!.toUpperCase(), g]));
  const groups = new Map<string, EventGuest[]>();
  for (const g of guests) {
    const code = g.referralCode?.toUpperCase();
    if (!code) continue;
    groups.set(code, [...(groups.get(code) ?? []), g]);
  }
  return [...groups.entries()]
    .map(([code, referees]) => {
      const owner = owners.get(code);
      return {
        id: owner?.id ?? null,
        name: owner?.name ?? "Unknown referrer",
        email: owner?.email ?? "",
        phone: owner?.phone ?? "",
        type: owner?.userType ?? "—",
        guestType: owner?.guestType ?? null,
        referralCode: code,
        memberCount: referees.length,
        approvedCount: referees.filter((r) => r.guestType === "Approved").length,
        waitlistCount: referees.filter((r) => r.guestType === "Waitlist").length,
      };
    })
    .sort((a, b) => b.memberCount - a.memberCount);
}

router.get(
  "/referrals/with-referees",
  handle(async (req, res) => {
    const eventId = String(req.query.eventId || "");
    await eventOr404(eventId);
    res.json({ result: "SUCCESS", data: await referralSummary(eventId) });
  })
);

router.post(
  "/referrals/with-referees-by-slug",
  handle(async (req, res) => {
    const event = await Event.findOne({ where: { eventSlug: String(req.body?.slug || "") } });
    if (!event) throw fail(404, "Event not found");
    res.json({ result: "SUCCESS", eventId: event.id, data: await referralSummary(event.id) });
  })
);

router.post(
  "/referrals/by-code",
  handle(async (req, res) => {
    const { eventId, referralCode } = req.body || {};
    if (!eventId || !referralCode) throw fail(400, "eventId and referralCode are required");
    const code = String(referralCode).toUpperCase();
    const [owner, referees] = await Promise.all([
      EventGuest.findOne({ where: { eventId, ownReferralCode: code } }),
      EventGuest.findAll({ where: { eventId, referralCode: code }, order: [["createdAt", "ASC"]] }),
    ]);
    res.json({
      referralCode: code,
      referrer: owner ? { id: owner.id, name: owner.name, email: owner.email, phone: owner.phone } : null,
      referredMembers: referees.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email || "",
        phone: r.phone || "",
        userType: r.userType,
        guestType: r.guestType,
        createdAt: r.createdAt,
      })),
    });
  })
);

/* ================================================= reminder templates ==== */

function validateTargets(body: Record<string, unknown>) {
  if (body.targetGuestType && !EMAIL_TARGET_TYPES.includes(body.targetGuestType as EmailTargetType)) {
    throw fail(400, "Invalid 'targetGuestType'");
  }
  if (body.targetGuestRole && !EMAIL_TARGET_ROLES.includes(body.targetGuestRole as EmailTargetRole)) {
    throw fail(400, "Invalid 'targetGuestRole'");
  }
}

function futureDate(value: unknown): Date {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw fail(400, "scheduledAt is not a valid date");
  if (date.getTime() < Date.now() - 60_000) throw fail(400, "Pick a time in the future");
  return date;
}

async function templateOr404(id: unknown) {
  const template = typeof id === "string" ? await EventEmailTemplate.findByPk(id) : null;
  if (!template) throw fail(404, "Template not found");
  return template;
}

/* ====================================================== email sender ==== */

/**
 * The addresses someone may send an event's emails from: their own company
 * address and any extra address assigned to them — and, for the Super Admin,
 * every extra address in the workspace. Each is shown on the event's brand
 * domain (hello@uppercurve.in for an Uppercurve event).
 */
async function senderOptions(req: AuthRequest, event: Event) {
  const user = req.user!;
  const siteId = (event.get("siteId") as string | null) ?? null;
  const own = await mailboxesFor({ id: user.userId, companyEmail: user.companyEmail, fullName: user.fullName, emailDomain: user.emailDomain });
  const options = new Map<string, { localPart: string; label: string; name: string | null }>();
  for (const m of own) {
    options.set(m.address.split("@")[0], { localPart: m.address.split("@")[0], label: m.shared ? "Assigned to you" : "Your address", name: m.shared ? m.name : null });
  }
  if (user.roleSlug === "superadmin") {
    const shared = await MailboxAddress.findAll({ include: [{ model: User, as: "assignee", attributes: ["fullName"] }], order: [["localPart", "ASC"]] });
    for (const row of shared) {
      if (options.has(row.localPart)) continue;
      const owner = (row.get("assignee") as User | null)?.fullName;
      options.set(row.localPart, { localPart: row.localPart, label: owner ? `Shared · ${owner}` : "Shared · unassigned", name: row.displayName });
    }
  }
  return Promise.all(
    [...options.values()].map(async (o) => {
      const base = `${o.localPart}@${user.emailDomain}`;
      return { ...o, address: (await brandSender(base, siteId)) || base };
    })
  );
}

router.get(
  "/:eventId/email/sender",
  handle(async (req, res) => {
    const event = await eventOr404(String(req.params.eventId));
    const current = await eventSender(event);
    const fallback = process.env.AWS_SES_FROM_EMAIL || "";
    res.json({
      localPart: (event.get("emailFromLocalPart") as string | null) ?? null,
      name: (event.get("emailFromName") as string | null) ?? null,
      current: { address: current.from || (await brandSender(fallback, (event.get("siteId") as string | null) ?? null)) || fallback, name: current.fromName ?? null },
      options: await senderOptions(req, event),
    });
  })
);

router.put(
  "/:eventId/email/sender",
  handle(async (req, res) => {
    const event = await eventOr404(String(req.params.eventId));
    const raw = req.body?.localPart;
    const localPart = typeof raw === "string" && raw.trim() ? raw.trim().toLowerCase() : null;
    // Only an address the person may actually use — nobody sends as support@
    // just by typing it here.
    if (localPart && !(await senderOptions(req, event)).some((o) => o.localPart === localPart)) {
      throw fail(403, "You can only choose one of your own addresses.");
    }
    const name = typeof req.body?.name === "string" ? req.body.name.replace(/[\r\n<>"]/g, "").trim().slice(0, 120) || null : null;
    await event.update({ emailFromLocalPart: localPart, emailFromName: name });
    const current = await eventSender(event);
    res.json({ result: "SUCCESS", localPart, name, current: { address: current.from ?? null, name: current.fromName ?? null } });
  })
);

/** Counts per audience, so the editor can say "goes to 42 guests". */
router.get(
  "/:eventId/email/audience",
  handle(async (req, res) => {
    const eventId = String(req.params.eventId);
    await eventOr404(eventId);
    const rows = await EventGuest.findAll({
      attributes: ["guestType", "userType", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
      where: { eventId, email: { [Op.ne]: null } },
      group: ["guestType", "userType"],
      raw: true,
    });
    res.json({ result: "SUCCESS", breakdown: rows });
  })
);

router.post(
  "/:eventId/email/template",
  handle(async (req, res) => {
    const eventId = String(req.params.eventId);
    await eventOr404(eventId);
    const { templateName, subject, body, targetGuestType, targetGuestRole, scheduledAt } = req.body || {};
    if (!templateName?.trim() || !subject?.trim() || !body?.trim()) throw fail(400, "templateName, subject and body are required");
    validateTargets(req.body);
    const template = await EventEmailTemplate.create({
      eventId,
      templateName: templateName.trim(),
      subject: subject.trim(),
      body,
      targetGuestType: targetGuestType || "All",
      targetGuestRole: targetGuestRole || "All",
      scheduledAt: scheduledAt ? futureDate(scheduledAt) : null,
      status: scheduledAt ? "scheduled" : "draft",
    });
    res.status(201).json({ message: "Email template created successfully", template });
  })
);

router.get(
  "/:eventId/email/templates",
  handle(async (req, res) => {
    const templates = await EventEmailTemplate.findAll({
      where: { eventId: String(req.params.eventId) },
      order: [["createdAt", "DESC"]],
    });
    res.json({ message: "Templates fetched successfully", templates });
  })
);

router.get(
  "/email/template/:templateId",
  handle(async (req, res) => {
    res.json({ message: "Template fetched successfully", template: await templateOr404(req.params.templateId) });
  })
);

router.put(
  "/email/template/:templateId",
  handle(async (req, res) => {
    const template = await templateOr404(req.params.templateId);
    if (template.status === "sending") throw fail(409, "This email is being sent right now.");
    if (template.status === "sent") throw fail(409, "This email has already been sent. Duplicate it to send again.");
    validateTargets(req.body || {});
    const { templateName, subject, body, targetGuestType, targetGuestRole } = req.body || {};
    await template.update({
      templateName: templateName?.trim() || template.templateName,
      subject: subject?.trim() || template.subject,
      body: body || template.body,
      targetGuestType: targetGuestType || template.targetGuestType,
      targetGuestRole: targetGuestRole || template.targetGuestRole,
    });
    res.json({ message: "Template updated successfully", template });
  })
);

router.delete(
  "/email/template/:templateId",
  handle(async (req, res) => {
    const template = await templateOr404(req.params.templateId);
    if (template.status === "sending") throw fail(409, "This email is being sent right now.");
    await template.destroy();
    res.json({ message: "Template deleted successfully" });
  })
);

router.post(
  "/email/template/:templateId/schedule",
  handle(async (req, res) => {
    const template = await templateOr404(req.params.templateId);
    if (["sending", "sent"].includes(template.status)) throw fail(409, `This email is already ${template.status}.`);
    const scheduledAt = futureDate(req.body?.scheduledAt);
    await template.update({ scheduledAt, status: "scheduled", attempts: 0, lastError: null });
    res.json({ message: "Template scheduled successfully", scheduledAt, template });
  })
);

router.post(
  "/email/template/:templateId/cancel",
  handle(async (req, res) => {
    const template = await templateOr404(req.params.templateId);
    if (template.status !== "scheduled") throw fail(400, "Template is not scheduled");
    await template.update({ status: "draft", scheduledAt: null, sentAt: null });
    res.json({ message: "Scheduled email cancelled successfully", template });
  })
);

router.post(
  "/email/template/:templateId/test",
  handle(async (req, res) => {
    const { email, name } = req.body || {};
    if (!email) throw fail(400, "Test email address is required");
    const template = await templateOr404(req.params.templateId);
    const event = await eventOr404(template.eventId);
    const { subject, html } = await renderForGuest(template, event, null, name || "there");
    await sendEventEmail(event, { to: email, subject: `[Test] ${subject}`, html });
    res.json({ message: "Test email sent successfully" });
  })
);

/**
 * Sends now. Product Space's version referenced an `agenda` it never
 * imported, so it threw after mailing everyone and left the template unsent.
 */
router.post(
  "/email/template/sendEmailNow",
  handle(async (req, res) => {
    const template = await templateOr404(req.body?.templateId);
    if (template.status === "sending") throw fail(409, "This email is being sent right now.");
    const recipients = await EventGuest.count({ where: recipientWhere(template) });
    if (!recipients) throw fail(400, "No guests match this email's audience");
    await template.update({ status: "sending", attempts: template.attempts + 1 });
    const result = await deliverTemplate(template);
    await template.update({
      status: result.sent + result.alreadyDelivered > 0 ? "sent" : "failed",
      sentAt: new Date(),
      scheduledAt: null,
      lastError: result.failed.length ? `${result.failed.length} recipient(s) could not be reached.` : null,
    });
    res.json({
      message: "Template sent successfully",
      totalGuests: result.total,
      sent: result.sent,
      failedEmails: result.failed,
      template,
    });
  })
);

/* ================================================== enrollment emails ==== */

router.get(
  "/:eventId/enrollment-emails",
  handle(async (req, res) => {
    const eventId = String(req.params.eventId);
    await eventOr404(eventId);
    const templates = await EventEnrollmentEmail.findAll({ where: { eventId } });
    res.json({ result: "SUCCESS", templates, types: ENROLLMENT_EMAIL_TYPES, inviteTypes: INVITE_EMAIL_TYPES });
  })
);

router.put(
  "/:eventId/enrollment-emails/:type",
  handle(async (req, res) => {
    const eventId = String(req.params.eventId);
    const type = String(req.params.type) as EnrollmentEmailType;
    if (!ENROLLMENT_EMAIL_TYPES.includes(type)) throw fail(400, "Unknown enrollment email type");
    await eventOr404(eventId);
    const { subject, body, date, startTime, endTime } = req.body || {};
    if (!String(body || "").trim()) throw fail(400, "body is required");
    const invite = INVITE_EMAIL_TYPES.includes(type);
    const time = (v: unknown) => (typeof v === "string" && /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : null);
    const values = {
      subject: subject?.trim() || null,
      body,
      date: invite && typeof date === "string" && date ? date.slice(0, 10) : null,
      startTime: invite ? time(startTime) : null,
      endTime: invite ? time(endTime) : null,
    };
    const existing = await EventEnrollmentEmail.findOne({ where: { eventId, type } });
    const template = existing ? await existing.update(values) : await EventEnrollmentEmail.create({ eventId, type, ...values });
    res.json({ result: existing ? "UPDATED" : "CREATED", template });
  })
);

router.delete(
  "/:eventId/enrollment-emails/:type",
  handle(async (req, res) => {
    const removed = await EventEnrollmentEmail.destroy({
      where: { eventId: String(req.params.eventId), type: String(req.params.type) },
    });
    res.json({ result: "SUCCESS", removed });
  })
);

router.post(
  "/:eventId/enrollment-emails/:type/test",
  handle(async (req, res) => {
    const email = String(req.body?.email || "").trim();
    if (!email) throw fail(400, "email is required");
    const event = await eventOr404(String(req.params.eventId));
    const template = await EventEnrollmentEmail.findOne({ where: { eventId: event.id, type: String(req.params.type) } });
    if (!template) throw fail(404, "Save this email before sending a test");
    const values = await placeholdersFor(event, null, req.body?.name || "there");
    await sendEventEmail(event, {
      to: email,
      subject: `[Test] ${replacePlaceholders(template.subject || String(event.get("eventTitle")), values, { html: false })}`,
      html: wrapEmailTemplate(cleanHtml(replacePlaceholders(template.body, values))),
    });
    res.json({ result: "SUCCESS", message: "Test email sent" });
  })
);

/* ======================================================= certificates ==== */

function validFields(fields: unknown): CertificateField[] {
  if (!Array.isArray(fields)) throw fail(400, "fields must be an array");
  return fields.map((f) => {
    const field = f as Partial<CertificateField>;
    if (!["name", "date", "certificateId"].includes(String(field.id))) throw fail(400, `Unknown certificate field "${field.id}"`);
    return {
      id: field.id as CertificateField["id"],
      x: Math.min(100, Math.max(0, Number(field.x) || 0)),
      y: Math.min(100, Math.max(0, Number(field.y) || 0)),
      fontSize: Math.min(400, Math.max(6, Number(field.fontSize) || 32)),
      fontFamily: String(field.fontFamily || "Playfair Display"),
      color: /^#[0-9a-f]{3,8}$/i.test(String(field.color)) ? String(field.color) : "#111827",
      alignment: (["left", "center", "right"].includes(String(field.alignment)) ? field.alignment : "center") as CertificateField["alignment"],
      fontWeight: field.fontWeight === "normal" ? "normal" : "bold",
    };
  });
}

/** Artwork arrives as a data URL from the editor; it's stored as an upload, not in the row. */
async function storeArtwork(image: unknown): Promise<string> {
  const value = String(image || "");
  const match = /^data:(image\/(png|jpe?g|webp));base64,(.+)$/i.exec(value);
  if (match) {
    const key = await uploadBuffer(Buffer.from(match[3], "base64"), `certificate.${match[2].replace("jpeg", "jpg")}`, "content", match[1]);
    return publicUrl(key);
  }
  if (/^https:\/\//.test(value)) return value;
  throw fail(400, "templateImage must be an uploaded image");
}

router.get(
  "/certificate/fonts",
  handle(async (_req, res) => {
    res.json({ result: "SUCCESS", fonts: Object.keys(CERTIFICATE_FONTS) });
  })
);

router.post(
  "/certificate/save",
  handle(async (req, res) => {
    const { eventId, certificateName, imageSize, fields, templateImage } = req.body || {};
    await eventOr404(eventId);
    if (!certificateName?.trim()) throw fail(400, "certificateName is required");
    const width = Number(imageSize?.width);
    const height = Number(imageSize?.height);
    if (!(width > 0 && height > 0 && width <= 8000 && height <= 8000)) throw fail(400, "imageSize must be the artwork's width and height");
    const values = {
      certificateName: certificateName.trim(),
      imageSize: { width, height },
      fields: validFields(fields),
      templateImage: await storeArtwork(templateImage),
    };
    const existing = await EventCertificateTemplate.findOne({ where: { eventId } });
    const template = existing ? await existing.update(values) : await EventCertificateTemplate.create({ eventId, ...values });
    res.json({ success: true, message: existing ? "Template updated" : "Template created", data: template });
  })
);

router.get(
  "/certificate/email-template/:eventId",
  handle(async (req, res) => {
    const template = await EventCertificateTemplate.findOne({ where: { eventId: String(req.params.eventId) } });
    res.json({ success: true, data: template ? { emailSubject: template.emailSubject, emailBody: template.emailBody } : null });
  })
);

router.get(
  "/certificate/:eventId",
  handle(async (req, res) => {
    const template = await EventCertificateTemplate.findOne({ where: { eventId: String(req.params.eventId) } });
    res.json({ success: true, data: template });
  })
);

/** Server-rendered sample, so the admin sees exactly what guests will receive. */
router.post(
  "/certificate/preview",
  handle(async (req, res) => {
    const { eventId, name } = req.body || {};
    const template = await EventCertificateTemplate.findOne({ where: { eventId } });
    if (!template) throw fail(404, "Save the certificate design first");
    const png = await renderCertificate(template, {
      name: name || "Priya Sharma",
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      certificateId: "UC-SAMP-LE01",
    });
    res.json({ success: true, image: `data:image/png;base64,${png.toString("base64")}` });
  })
);

router.post(
  "/certificate/save-email-template",
  handle(async (req, res) => {
    const { eventId, emailSubject, emailBody } = req.body || {};
    const template = await EventCertificateTemplate.findOne({ where: { eventId } });
    if (!template) throw fail(404, "Design the certificate before writing its email");
    await template.update({ emailSubject: emailSubject?.trim() || null, emailBody: emailBody || null });
    res.json({ success: true, message: "Certificate email saved", data: template });
  })
);

router.post(
  "/send-certificate-test-email",
  handle(async (req, res) => {
    const { eventId, email } = req.body || {};
    if (!email) throw fail(400, "email is required");
    const event = await eventOr404(eventId);
    const template = await EventCertificateTemplate.findOne({ where: { eventId } });
    if (!template?.emailBody) throw fail(400, "Write and save the certificate email first");
    const sample = { name: "Priya Sharma", date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), certificateId: "UC-SAMP-LE01" };
    const png = await renderCertificate(template, sample);
    const values = { ...(await placeholdersFor(event, null, sample.name)), recipientName: sample.name, certificateId: sample.certificateId, certificateLink: "#", verifyLink: "#" };
    await sendEventEmail(event, {
        to: email,
        subject: `[Test] ${replacePlaceholders(template.emailSubject || `Your certificate — ${event.get("eventTitle")}`, values, { html: false })}`,
        html: wrapEmailTemplate(cleanHtml(replacePlaceholders(template.emailBody!, values))),
        attachments: [{ filename: "certificate-sample.png", content: png, contentType: "image/png" }],
      });
    res.json({ success: true, message: "Test email sent" });
  })
);

router.put(
  "/certificate/approve",
  handle(async (req, res) => {
    const { guestId } = req.body || {};
    if (!guestId) throw fail(400, "guestId is required");
    const result = await sequelize.transaction((transaction) => approveCertificate(guestId, transaction));
    res.json({ success: true, message: "skipped" in result ? "Certificate already approved or not eligible yet" : "Certificate approved", result });
  })
);

/** Workshops need feedback submitted before bulk approval (Product Space's rule). */
router.put(
  "/certificate/bulk-approve",
  handle(async (req, res) => {
    const event = await eventOr404(req.body?.eventId);
    const where: Record<string, unknown> = { eventId: event.id, guestType: "Approved", certificateApproved: false };
    if (event.get("eventType") === "Workshop") where.feedbackData = { [Op.ne]: null };
    const guests = await EventGuest.findAll({ attributes: ["id"], where });
    let approved = 0;
    let skipped = 0;
    for (const guest of guests) {
      const result = await sequelize.transaction((transaction) => approveCertificate(guest.id, transaction, true));
      if ("approved" in result) approved += 1;
      else skipped += 1;
    }
    res.json({ success: true, message: `${approved} certificate(s) approved`, stats: { considered: guests.length, approved, skipped } });
  })
);

router.post(
  "/certificate/generate",
  handle(async (req, res) => {
    const { guestId } = req.body || {};
    if (!guestId) throw fail(400, "guestId is required");
    const { certificateId, alreadyIssued } = await issueCertificate(guestId);
    res.json({
      success: true,
      message: alreadyIssued ? "Certificate already generated" : "Certificate generated and emailed",
      data: { certificateId, certificateUrl: await certificateDownloadUrl(certificateId) },
    });
  })
);

/**
 * Issues certificates in batches. Each call does up to `limit` and reports
 * what's left, so the admin UI can show progress and no single request runs
 * long enough to hit a proxy timeout.
 */
router.post(
  "/certificate/bulk-generate",
  handle(async (req, res) => {
    const event = await eventOr404(req.body?.eventId);
    const limit = Math.min(50, Math.max(1, Number(req.body?.limit) || 15));
    const where = { eventId: event.id, guestType: "Approved", certificateApproved: true, certificateGenerated: { [Op.not]: true } };
    const batch = await EventGuest.findAll({ where, limit, order: [["createdAt", "ASC"]] });
    const issued: string[] = [];
    const failed: { guestId: string; name: string; error: string }[] = [];
    for (const guest of batch) {
      try {
        const { certificateId } = await issueCertificate(guest.id);
        issued.push(certificateId);
      } catch (err) {
        failed.push({ guestId: guest.id, name: guest.name, error: (err as Error).message });
      }
    }
    const remaining = await EventGuest.count({ where });
    res.json({ success: true, issued: issued.length, failed, remaining: Math.max(0, remaining - failed.length) });
  })
);

router.post(
  "/certificate/download-url",
  handle(async (req, res) => {
    const guest = await EventGuest.findByPk(String(req.body?.guestId || ""));
    if (!guest?.certificateId) throw fail(404, "No certificate has been issued to this guest");
    res.json({ success: true, certificateUrl: await certificateDownloadUrl(guest.certificateId) });
  })
);

/* =========================================================== feedback ==== */

async function feedbackRows(eventId: string) {
  const guests = await EventGuest.findAll({
    where: { eventId, feedbackSubmittedAt: { [Op.ne]: null } },
    order: [["feedbackSubmittedAt", "DESC"]],
  });
  return guests.map((g) => ({
    id: g.id,
    name: g.name,
    email: g.email,
    phone: g.phone,
    userType: g.userType,
    guestType: g.guestType,
    feedbackData: g.feedbackData,
    feedbackSubmittedAt: g.feedbackSubmittedAt,
    certificateApproved: g.certificateApproved,
    certificateGenerated: g.certificateGenerated,
    certificateId: g.certificateId,
  }));
}

router.get(
  "/feedback/:eventId/export",
  handle(async (req, res) => {
    const event = await eventOr404(String(req.params.eventId));
    const rows = await feedbackRows(event.id);
    const feedbackKeys = [...new Set(rows.flatMap((r) => Object.keys((r.feedbackData || {}) as object)))].filter(
      (k) => k !== "isPrimaryMember"
    );
    const columns = ["Name", "Email", "Phone", "Role", "Status", "Submitted at", "Certificate", ...feedbackKeys];
    // Leading = + - @ turn a cell into a formula in Excel; prefix them so a
    // guest's answer can't execute when an admin opens the export.
    const cell = (v: unknown) => {
      let s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [
      columns.map(cell).join(","),
      ...rows.map((r) =>
        [
          r.name, r.email, r.phone, r.userType, r.guestType,
          r.feedbackSubmittedAt ? new Date(r.feedbackSubmittedAt).toISOString() : "",
          r.certificateGenerated ? r.certificateId : r.certificateApproved ? "Approved" : "",
          ...feedbackKeys.map((k) => ((r.feedbackData || {}) as Record<string, unknown>)[k]),
        ].map(cell).join(",")
      ),
    ];
    const name = String(event.get("eventSlug") || "event").replace(/[^a-z0-9-]/gi, "");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${name}-feedback.csv"`);
    res.send("﻿" + lines.join("\n"));
  })
);

router.get(
  "/feedback/:eventId",
  handle(async (req, res) => {
    const event = await eventOr404(String(req.params.eventId));
    res.json({ success: true, eventType: event.get("eventType"), data: await feedbackRows(event.id) });
  })
);

/* ============================================================ lookups ==== */

router.get(
  "/type/:slug",
  handle(async (req, res) => {
    const event = await Event.findOne({
      where: { eventSlug: String(req.params.slug) },
      attributes: ["id", "eventTitle", "eventType", "eventSlug", "eventCategory"],
    });
    if (!event) throw fail(404, "Event not found");
    res.json({
      result: "SUCCESS",
      eventId: event.id,
      eventTitle: event.get("eventTitle"),
      eventType: event.get("eventType"),
      eventSlug: event.get("eventSlug"),
      eventCategory: event.get("eventCategory"),
    });
  })
);

export default router;
