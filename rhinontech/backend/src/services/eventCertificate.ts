import path from "path";
import fs from "fs";
import { Op, type Transaction } from "sequelize";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { Event, EventGuest, EventCertificateTemplate } from "../models";
import type { CertificateField } from "../models/EventCertificateTemplate";
import { uploadFixedObject, getPresignedReadUrl } from "./storage";
import { sendEmail } from "./mailer";
import {
  capitalizeName,
  cleanHtml,
  eventPublicUrl,
  placeholdersFor,
  replacePlaceholders,
  withEventSite,
  wrapEmailTemplate,
} from "./eventEmail";

/**
 * Certificate fonts are bundled rather than taken from the host, so the PNG a
 * guest receives matches the admin preview exactly — on a Mac in development
 * and on the Linux server alike. The admin loads the same four by name.
 */
export const CERTIFICATE_FONTS: Record<string, string> = {
  "Playfair Display": "PlayfairDisplay-Bold.ttf",
  Inter: "Inter-SemiBold.ttf",
  "JetBrains Mono": "JetBrainsMono-Medium.ttf",
  "Great Vibes": "GreatVibes-Regular.ttf",
};

let fontsRegistered = false;
function registerFonts() {
  if (fontsRegistered) return;
  fontsRegistered = true;
  // dist/services → dist/assets/fonts; src/services → src/assets/fonts under ts-node.
  const dir = path.resolve(__dirname, "../assets/fonts");
  for (const [family, file] of Object.entries(CERTIFICATE_FONTS)) {
    const full = path.join(dir, file);
    if (fs.existsSync(full)) GlobalFonts.registerFromPath(full, family);
    else console.warn(`[Certificate] Font missing: ${full} — falling back to a system font`);
  }
}

/** Product Space's generic family names still render, mapped onto the bundled fonts. */
const LEGACY_FAMILIES: Record<string, string> = {
  serif: "Playfair Display",
  "sans-serif": "Inter",
  monospace: "JetBrains Mono",
  cursive: "Great Vibes",
};

export async function renderCertificate(
  template: Pick<EventCertificateTemplate, "templateImage" | "imageSize" | "fields">,
  values: { name: string; date: string; certificateId: string }
): Promise<Buffer> {
  registerFonts();
  const { width, height } = template.imageSize;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const image = await loadImage(await imageBytes(template.templateImage));
  ctx.drawImage(image, 0, 0, width, height);

  for (const field of template.fields as CertificateField[]) {
    const value = values[field.id];
    if (!value) continue;
    const family = LEGACY_FAMILIES[field.fontFamily] || field.fontFamily || "Playfair Display";
    ctx.font = `${field.fontWeight === "normal" ? "" : "bold "}${field.fontSize}px "${family}"`;
    ctx.fillStyle = field.color || "#111827";
    ctx.textAlign = field.alignment || "center";
    ctx.textBaseline = "middle";
    ctx.fillText(value, (field.x / 100) * width, (field.y / 100) * height);
  }
  return canvas.toBuffer("image/png");
}

/** Accepts an https URL (uploaded artwork) or a data: URL (Product Space's format). */
async function imageBytes(source: string): Promise<Buffer> {
  if (source.startsWith("data:")) return Buffer.from(source.split(",")[1] || "", "base64");
  const res = await fetch(source);
  if (!res.ok) throw new Error(`Could not load the certificate artwork (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}

/** Human-readable and stable per guest, e.g. UC-7F3A-19C2. */
export function certificateIdFor(event: Event, guest: EventGuest): string {
  const block = (id: string) => id.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `UC-${block(String(event.id))}-${block(guest.id)}`;
}

const certificateKey = (certificateId: string) => `certificates/${certificateId}.png`;

export async function certificateDownloadUrl(certificateId: string): Promise<string> {
  return getPresignedReadUrl(certificateKey(certificateId), 60 * 60);
}

const formatIssueDate = (date: Date) =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

/**
 * Draws, stores and (optionally) emails one guest's certificate. Mirrors
 * Product Space's generateCertificate: the guest must be Approved and their
 * certificate approved; a second call returns the existing certificate.
 */
export async function issueCertificate(guestId: string, { email = true }: { email?: boolean } = {}) {
  const guest = await EventGuest.findByPk(guestId);
  if (!guest) throw Object.assign(new Error("Guest not found."), { status: 404 });
  const event = await Event.findByPk(guest.eventId);
  if (!event) throw Object.assign(new Error("Event not found."), { status: 404 });

  if (guest.guestType !== "Approved") throw Object.assign(new Error("Only approved guests receive certificates."), { status: 400 });
  if (!guest.certificateApproved) throw Object.assign(new Error("This certificate has not been approved yet."), { status: 400 });
  if (guest.certificateGenerated && guest.certificateId) {
    return { guest, certificateId: guest.certificateId, alreadyIssued: true };
  }

  const template = await EventCertificateTemplate.findOne({ where: { eventId: event.id } });
  if (!template) throw Object.assign(new Error("Design a certificate for this event first."), { status: 404 });

  const issuedAt = new Date();
  const certificateId = certificateIdFor(event, guest);
  const png = await renderCertificate(template, {
    name: capitalizeName(guest.name) || "Participant",
    date: formatIssueDate(issuedAt),
    certificateId,
  });
  await uploadFixedObject(certificateKey(certificateId), png, "image/png");
  await guest.update({
    certificateGenerated: true,
    certificateId,
    certificateName: template.certificateName,
    certificateGeneratedAt: issuedAt,
  });

  if (email && guest.email && template.emailBody) {
    const values = {
      ...(await placeholdersFor(event, guest)),
      recipientName: capitalizeName(guest.name),
      certificateId,
      certificateLink: await certificateDownloadUrl(certificateId),
      verifyLink: await verifyUrl(event, certificateId),
    };
    await withEventSite(event, () =>
      sendEmail({
        to: guest.email!,
        subject: replacePlaceholders(template.emailSubject || `Your certificate — ${event.get("eventTitle")}`, values, { html: false }),
        html: wrapEmailTemplate(cleanHtml(replacePlaceholders(template.emailBody!, values))),
        attachments: [{ filename: `${certificateId}.png`, content: png, contentType: "image/png" }],
      })
    );
  }
  return { guest, certificateId, alreadyIssued: false };
}

async function verifyUrl(event: Event, certificateId: string) {
  const url = await eventPublicUrl(event);
  const origin = url ? new URL(url).origin : "";
  return origin ? `${origin}/certificates/${certificateId}` : "";
}

/**
 * Product Space's approveCertificateService. Workshops approve directly.
 * Teardowns and Hackathons are team submissions: the primary member's feedback
 * carries teamMember2Email, and approving the primary also hands the feedback
 * (and, in bulk, the approval) to that teammate. A secondary member who hasn't
 * submitted anything is matched to their primary by that email.
 *
 * (Product Space built that match by pasting the email into SQL; here it is a
 * bound parameter.)
 */
export async function approveCertificate(guestId: string, transaction?: Transaction, approveTeamMember = false) {
  const guest = await EventGuest.findByPk(guestId, { transaction });
  if (!guest) throw Object.assign(new Error("Guest not found."), { status: 404 });
  if (guest.certificateApproved) return { skipped: true as const };

  const event = await Event.findByPk(guest.eventId, { transaction });
  const team = ["Hackathon", "Teardown"].includes(String(event?.get("eventType")));
  const feedback = (guest.feedbackData || null) as Record<string, any> | null;

  if (!team) {
    await guest.update({ certificateApproved: true }, { transaction });
    return { approved: true as const };
  }

  if (feedback?.isPrimaryMember === true) {
    await guest.update({ certificateApproved: true }, { transaction });
    const mateEmail = String(feedback.teamMember2Email || "").trim().toLowerCase();
    if (mateEmail) {
      const mate = await EventGuest.findOne({ where: { eventId: guest.eventId, email: mateEmail }, transaction });
      if (mate) {
        const shared = { ...feedback };
        delete shared.isPrimaryMember;
        await mate.update(
          {
            feedbackData: shared,
            feedbackSubmittedAt: guest.feedbackSubmittedAt || new Date(),
            ...(approveTeamMember ? { certificateApproved: true } : {}),
          },
          { transaction }
        );
      }
    }
    return { approved: true as const };
  }

  if (!feedback && guest.email) {
    const primaries = await EventGuest.findAll({
      where: {
        eventId: guest.eventId,
        [Op.and]: [
          { feedbackData: { isPrimaryMember: true } },
          { feedbackData: { teamMember2Email: guest.email } },
        ],
      } as never,
      transaction,
    });
    const primary = primaries.length === 1 ? primaries[0] : null;
    if (primary?.feedbackSubmittedAt) {
      const shared = { ...((primary.feedbackData || {}) as Record<string, any>) };
      delete shared.isPrimaryMember;
      await guest.update(
        { feedbackData: shared, feedbackSubmittedAt: primary.feedbackSubmittedAt, certificateApproved: true },
        { transaction }
      );
      return { approved: true as const };
    }
    return { skipped: true as const, reason: "No team submission names this guest yet." };
  }

  if (feedback) {
    await guest.update({ certificateApproved: true }, { transaction });
    return { approved: true as const };
  }
  return { skipped: true as const };
}
