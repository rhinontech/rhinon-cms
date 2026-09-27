import crypto from "crypto";
import { Op, type WhereOptions } from "sequelize";
import { createEvent } from "ics";
import { Event, EventGuest, EventEmailTemplate, EventEnrollmentEmail, Organization, Site } from "../models";
import { INVITE_EMAIL_TYPES, type EnrollmentEmailType } from "../models/EventEnrollmentEmail";
import { sendEmail } from "./mailer";
import { brandSender } from "./siteSender";
import { runForSite } from "./siteContext";
import { env } from "../config/env";

/* ------------------------------------------------------------------ helpers */

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ESCAPES[c]);

export function capitalizeName(name?: string | null): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}

/**
 * {{name}}-style substitution. Values are HTML-escaped when the target is HTML:
 * a guest's name is user input, and Product Space pasted it into mail raw — a
 * "name" of <a href=…> would have gone out as a live link under our domain.
 */
export function replacePlaceholders(
  template: string,
  values: Record<string, string | undefined>,
  { html = true }: { html?: boolean } = {}
): string {
  const filled = template.replace(/{{\s*([\w]+)\s*}}/g, (_, key: string) => {
    const value = values[key] ?? "";
    return html ? escapeHtml(value) : value;
  });
  return html ? filled.replace(/\n/g, "<br>") : filled.replace(/\n/g, " ");
}

/** Normalises editor HTML for mail clients (from Product Space's htmlHelpers). */
export function cleanHtml(html: string): string {
  return html
    .replace(/white-space:\s*pre-wrap;?/g, "")
    .replace(/white-space:\s*pre;?/g, "")
    .replace(/<p\b[^>]*>/gi, "<div>")
    .replace(/<\/p>/gi, "</div>")
    .replace(/font-family:[^;"']+;?/gi, "font-family: Arial, Helvetica, sans-serif;");
}

/** The 600px card every event email is sent in. */
export function wrapEmailTemplate(content: string, brandName = "UpperCurve"): string {
  return `<!--[if mso]><style>* { font-family: Arial, sans-serif !important; }</style><![endif]-->
<style>@media only screen and (max-width: 600px) { .ev-pad { padding-left: 16px !important; padding-right: 16px !important; } }</style>
<div style="background-color:#f3f4f6;width:100%;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <div class="ev-pad" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;padding:28px;font-size:14px;color:#111827;line-height:1.6;">
    ${content}
  </div>
  <p style="max-width:600px;margin:16px auto 0;text-align:center;font-size:12px;color:#6b7280;">
    Sent by ${escapeHtml(brandName)} because you registered for one of our events.
  </p>
</div>`;
}

/* -------------------------------------------------------- signed guest links */

/**
 * Guests have no accounts, so their personal pages (registration success,
 * feedback, certificate) are reached through a signed link. The token names
 * the guest; the HMAC means it can't be guessed or edited to another guest.
 */
const tokenSecret = () => process.env.EVENT_LINK_SECRET || env.jwtSecret;

export function guestToken(guestId: string): string {
  const sig = crypto.createHmac("sha256", tokenSecret()).update(`guest:${guestId}`).digest("base64url").slice(0, 32);
  return `${guestId}.${sig}`;
}

export function verifyGuestToken(token: unknown): string | null {
  if (typeof token !== "string") return null;
  const [guestId, sig] = token.split(".");
  if (!guestId || !sig) return null;
  const expected = guestToken(guestId).split(".")[1];
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? guestId : null;
}

/** Short shareable code for a guest's referral link, e.g. "ANANYA-7K2Q". */
export function makeReferralCode(name: string): string {
  const stem = (name.split(/\s+/)[0] || "GUEST").replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 10) || "GUEST";
  const tail = crypto.randomBytes(3).toString("base64url").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 4).padEnd(4, "X");
  return `${stem}-${tail}`;
}

/* ------------------------------------------------------------ event context */

async function siteFor(event: Event) {
  const siteId = event.get("siteId") as string | null;
  return siteId ? Site.findByPk(siteId) : null;
}

/** Runs `fn` as the event's brand, so mail goes out from that site's domain. */
export async function withEventSite<T>(event: Event, fn: () => Promise<T>): Promise<T> {
  const site = await siteFor(event);
  return runForSite(site ? { id: site.id, slug: site.slug } : null, Boolean(site), fn);
}

/**
 * Who an event's emails come from: the address picked in the event's Emails
 * tab (hello@, events@ — see Team → Email addresses), on the brand's domain,
 * under the brand's name. With nothing picked, the mailer's default address is
 * used, still on the brand's domain — but no longer as "Rhinon Labs".
 */
export async function eventSender(event: Event): Promise<{ from?: string; fromName?: string }> {
  const site = await siteFor(event);
  const fromName = (event.get("emailFromName") as string | null) || site?.name || undefined;
  const localPart = event.get("emailFromLocalPart") as string | null;
  if (!localPart) return { fromName };
  const org = await Organization.findByPk(event.get("organizationId") as string, { attributes: ["emailDomain"] });
  if (!org?.emailDomain) return { fromName };
  const base = `${localPart}@${org.emailDomain}`;
  return { from: (await brandSender(base, site?.id ?? null)) || base, fromName };
}

type EventMail = Parameters<typeof sendEmail>[0];

/** Sends one email as the event: its brand, its chosen sender. */
export async function sendEventEmail(event: Event, message: EventMail) {
  const sender = await eventSender(event);
  return withEventSite(event, () => sendEmail({ ...message, ...sender }));
}

export async function eventPublicUrl(event: Event): Promise<string> {
  const site = await siteFor(event);
  const base = (site?.siteUrl || process.env.UPPERCURVE_SITE_URL || "").replace(/\/$/, "");
  return base ? `${base}/events/${event.get("eventSlug")}` : "";
}

function formatEventDate(event: Event): string {
  const start = String(event.get("eventStartDate") || "");
  const end = String(event.get("eventEndDate") || "");
  const fmt = (v: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
    return m
      ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : v;
  };
  return end && end !== start ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

/**
 * Every placeholder an event email may use. {{name}} is Product Space's only
 * one; the rest let an admin write a useful reminder without pasting links.
 */
export async function placeholdersFor(event: Event, guest?: EventGuest | null, recipientName?: string) {
  const url = await eventPublicUrl(event);
  const details = (event.get("eventDetails") || {}) as Record<string, any>;
  const start = event.get("eventStartTime") as string | null;
  const end = event.get("eventEndTime") as string | null;
  const token = guest ? guestToken(guest.id) : "";
  return {
    name: capitalizeName(recipientName || guest?.name || "there"),
    eventTitle: String(event.get("eventTitle") || ""),
    eventDate: formatEventDate(event),
    eventTime: start && end ? `${start} – ${end} IST` : start ? `${start} IST` : "",
    location: String(event.get("location") || ""),
    eventLink: url,
    whatsappLink: String(details?.whatsappLink?.Link || ""),
    feedbackLink: url && token ? `${url}/feedback?token=${token}` : "",
    registrationLink: url && token ? `${url}/registered?token=${token}` : "",
    referralLink: url && guest?.ownReferralCode ? `${url}?ref=${guest.ownReferralCode}` : "",
  };
}

/* -------------------------------------------------------- reminder delivery */

/** Guests a reminder template is aimed at, by status and role. */
export function recipientWhere(template: EventEmailTemplate): WhereOptions {
  const where: Record<string, unknown> = { eventId: template.eventId, email: { [Op.ne]: null } };
  if (template.targetGuestType !== "All") where.guestType = template.targetGuestType;
  if (template.targetGuestRole !== "All") where.userType = template.targetGuestRole;
  return where as WhereOptions;
}

export async function renderForGuest(template: { subject: string; body: string }, event: Event, guest?: EventGuest | null, name?: string) {
  const values = await placeholdersFor(event, guest, name);
  return {
    subject: replacePlaceholders(template.subject, values, { html: false }),
    html: wrapEmailTemplate(cleanHtml(replacePlaceholders(template.body, values))),
  };
}

/**
 * Sends a reminder to every guest it targets that it hasn't reached yet,
 * recording each delivery as it goes. Safe to call again after a partial
 * failure — it resumes instead of re-sending.
 */
export async function deliverTemplate(template: EventEmailTemplate) {
  const event = await Event.findByPk(template.eventId);
  if (!event) throw new Error("The event for this email no longer exists.");

  const guests = await EventGuest.findAll({ where: recipientWhere(template) });
  const delivered = new Set((template.deliveredTo || []).map((e) => e.toLowerCase()));
  const failed: string[] = [];
  let sentNow = 0;
  const sender = await eventSender(event);

  await withEventSite(event, async () => {
    for (const guest of guests) {
      const email = (guest.email || "").toLowerCase();
      if (!email || delivered.has(email)) continue;
      try {
        const { subject, html } = await renderForGuest(template, event, guest);
        await sendEmail({ to: email, subject, html, ...sender });
        delivered.add(email);
        sentNow += 1;
        // Persist progress as we go, so a crash mid-run doesn't forget who was reached.
        if (sentNow % 10 === 0) await template.update({ deliveredTo: [...delivered] });
      } catch (err) {
        failed.push(email);
        console.error(`[EventEmail] ${template.templateName} → ${email} failed:`, (err as Error).message);
      }
    }
  });

  await template.update({ deliveredTo: [...delivered], failedRecipients: failed });
  return { total: guests.length, sent: sentNow, alreadyDelivered: delivered.size - sentNow, failed };
}

/* ------------------------------------------------------- enrollment emails */

/** Product Space's triggerEventCreatedEmail: which enrollment email a guest gets. */
export function enrollmentTypeFor(event: Event, guest: EventGuest): EnrollmentEmailType {
  if (guest.guestType === "Declined") return "Declined";
  if (["Teardown", "Hackathon"].includes(String(event.get("eventType")))) return "Registered";
  return guest.guestType === "Approved" ? "Approved" : "Pending";
}

function toUtcParts(date: string, time: string): [number, number, number, number, number] {
  // Event times are IST (+05:30); the invite is written in UTC.
  const instant = new Date(`${date}T${time}:00+05:30`);
  return [instant.getUTCFullYear(), instant.getUTCMonth() + 1, instant.getUTCDate(), instant.getUTCHours(), instant.getUTCMinutes()];
}

function buildEventIcs(event: Event, template: EventEnrollmentEmail, attendee: string, url: string): string | null {
  if (!template.date || !template.startTime) return null;
  const start = toUtcParts(template.date, template.startTime);
  const endTime = template.endTime || template.startTime;
  const minutes = Math.max(
    15,
    Math.round((new Date(`${template.date}T${endTime}:00+05:30`).getTime() - new Date(`${template.date}T${template.startTime}:00+05:30`).getTime()) / 60000)
  );
  const { error, value } = createEvent({
    uid: `${event.id}-${template.type}@events`,
    method: "REQUEST",
    title: String(event.get("eventTitle") || "Event"),
    description: [String(event.get("eventSubtitle") || ""), url].filter(Boolean).join("\n\n"),
    location: String(event.get("location") || "") || undefined,
    url: url || undefined,
    start,
    startInputType: "utc",
    startOutputType: "utc",
    duration: { minutes },
    status: "CONFIRMED",
    busyStatus: "BUSY",
    productId: "rhinon-cms/events",
    attendees: [{ name: attendee, email: attendee, rsvp: true, partstat: "NEEDS-ACTION", role: "REQ-PARTICIPANT" }],
  });
  return error || !value ? null : value;
}

/**
 * Sends the enrollment email for a guest's current status. Silently skips when
 * the event has no template for that status — admins opt in per status, as in
 * Product Space. Registered emails prefer a Student / Professional variant.
 */
export async function sendEnrollmentEmail(event: Event, guest: EventGuest, typeOverride?: EnrollmentEmailType) {
  if (!guest.email) return { sent: false, reason: "no-email" as const };
  const type = typeOverride ?? enrollmentTypeFor(event, guest);

  let template: EventEnrollmentEmail | null = null;
  if (type === "Registered" && ["Student", "Professional"].includes(String(guest.userType))) {
    template = await EventEnrollmentEmail.findOne({ where: { eventId: event.id, type: `Registered_${guest.userType}` } });
  }
  template ??= await EventEnrollmentEmail.findOne({ where: { eventId: event.id, type } });
  if (!template) return { sent: false, reason: "no-template" as const, type };

  const values = await placeholdersFor(event, guest);
  const html = wrapEmailTemplate(cleanHtml(replacePlaceholders(template.body, values)));
  const subject = replacePlaceholders(template.subject || String(event.get("eventTitle")), values, { html: false });
  const ics = INVITE_EMAIL_TYPES.includes(template.type) ? buildEventIcs(event, template, guest.email, values.eventLink) : null;

  await sendEventEmail(event, {
      to: guest.email!,
      subject,
      html,
      ...(ics ? { icalEvent: { method: "REQUEST", content: ics, filename: "invite.ics" } } : {}),
    }
  );
  return { sent: true as const, type: template.type };
}

/** Fires the enrollment email without holding up the HTTP response. */
export function sendEnrollmentEmailInBackground(event: Event, guest: EventGuest, type?: EnrollmentEmailType) {
  setImmediate(() => {
    sendEnrollmentEmail(event, guest, type).catch((err) =>
      console.error(`[EventEmail] enrollment email to ${guest.email} failed:`, err.message)
    );
  });
}
