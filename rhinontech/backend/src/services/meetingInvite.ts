import { createEvent, DateArray, ParticipationStatus } from "ics";
import { sendEmail } from "./mailer";
import { toEmailHtml, stripHtml } from "./emailTemplate";
import { CALENDAR_TIMEZONE, type MeetingEvent } from "./googleCalendar";

// The calendar these events live on. It's always the ORGANIZER, regardless of which
// teammate created the meeting — they're recorded as SENT-BY instead.
const ORGANIZER_NAME = "Rhinon Labs";
const ORGANIZER_EMAIL = process.env.GOOGLE_CALENDAR_ORGANIZER_EMAIL || "support@rhinon.tech";

export type InviteKind = "request" | "cancel";

export interface InviteSender {
  /** The teammate who made the change — the SES address the mail is actually sent from. */
  email: string;
  name: string;
}

function toUtcArray(d: Date): DateArray {
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()];
}

function formatWhen(start: Date, end: Date): string {
  const date = new Intl.DateTimeFormat("en-IN", {
    timeZone: CALENDAR_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(start);
  const time = (d: Date) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: CALENDAR_TIMEZONE, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  return `${date}, ${time(start)} – ${time(end)} IST`;
}

export function buildMeetingIcs(event: MeetingEvent, kind: InviteKind, sender: InviteSender): string {
  const start = new Date(event.start!);
  const end = new Date(event.end!);
  const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));

  // A CANCEL must outrank the last REQUEST for the same UID, or clients ignore it.
  const sequence = kind === "cancel" ? (event.sequence ?? 0) + 1 : (event.sequence ?? 0);
  const partstat: ParticipationStatus = "NEEDS-ACTION";

  const { error, value } = createEvent({
    // Google's own iCalUID keeps REQUEST and CANCEL pointing at the same event, so an
    // update lands in place instead of creating a duplicate.
    uid: event.iCalUID || `${event.id}@rhinon.tech`,
    method: kind === "cancel" ? "CANCEL" : "REQUEST",
    sequence,
    title: event.summary,
    description: event.meetLink ? `Join with Google Meet: ${event.meetLink}` : event.description || undefined,
    location: event.meetLink || event.location || undefined,
    url: event.meetLink || undefined,
    status: kind === "cancel" ? "CANCELLED" : "CONFIRMED",
    busyStatus: kind === "cancel" ? "FREE" : "BUSY",
    start: toUtcArray(start),
    startInputType: "utc",
    startOutputType: "utc",
    duration: { minutes: durationMinutes },
    productId: "rhinon-cms/meetings",
    organizer: { name: ORGANIZER_NAME, email: ORGANIZER_EMAIL, sentBy: sender.email },
    attendees: event.attendees.map((a) => ({
      // Without a name, `ics` writes CN="Unnamed attendee" — the address reads better.
      name: a.email,
      email: a.email,
      rsvp: kind !== "cancel",
      partstat,
      role: "REQ-PARTICIPANT",
    })),
  });

  if (error || !value) throw error ?? new Error("Could not build the calendar invite");
  return value;
}

function buildBody(event: MeetingEvent, kind: InviteKind, sender: InviteSender) {
  const when = formatWhen(new Date(event.start!), new Date(event.end!));
  const cancelled = kind === "cancel";

  const meetBlock =
    !cancelled && event.meetLink
      ? `<p><strong>Join with Google Meet:</strong> <a href="${event.meetLink}">${event.meetLink}</a></p>`
      : "";
  const locationBlock =
    !cancelled && !event.meetLink && event.location ? `<p><strong>Where:</strong> ${event.location}</p>` : "";
  const notesBlock = !cancelled && event.description ? `<p>${event.description}</p>` : "";

  const html = `
    <h2 style="margin:0 0 16px 0;">${cancelled ? "Meeting cancelled" : event.summary}</h2>
    <p>${
      cancelled
        ? `${sender.name} has cancelled the following meeting:`
        : `${sender.name} has invited you to a meeting.`
    }</p>
    <p style="font-weight:600;">${cancelled ? `${event.summary} — ${when}` : when}</p>
    ${meetBlock}
    ${locationBlock}
    ${notesBlock}
    <p>${
      cancelled
        ? "It has been removed from your calendar."
        : "The invite is attached — accept it to add this to your calendar."
    }</p>
    <p>— ${ORGANIZER_NAME}</p>
  `;

  return {
    subject: cancelled ? `Cancelled: ${event.summary}` : `Invitation: ${event.summary} — ${when}`,
    html: toEmailHtml(html),
    text: stripHtml(html),
  };
}

/**
 * Emails the calendar invite ourselves rather than letting Google do it, so the message comes
 * from the teammate who scheduled it (their rhinontech.in SES address) and lands correctly in
 * Outlook/Yahoo/etc., not just Gmail. Returns false if there was nobody to notify or the send
 * failed — callers surface that instead of failing the whole request.
 */
export async function sendMeetingInvite(
  event: MeetingEvent,
  kind: InviteKind,
  sender: InviteSender
): Promise<boolean> {
  const recipients = event.attendees.map((a) => a.email).filter((e) => e && e !== sender.email);
  if (recipients.length === 0) return false;
  if (!event.start || !event.end) return false;

  const ics = buildMeetingIcs(event, kind, sender);
  const { subject, html, text } = buildBody(event, kind, sender);

  await sendEmail({
    to: recipients,
    from: sender.email,
    fromName: `${sender.name} (${ORGANIZER_NAME})`,
    replyTo: sender.email,
    via: "ses",
    subject,
    html,
    text,
    icalEvent: { method: kind === "cancel" ? "CANCEL" : "REQUEST", content: ics, filename: "invite.ics" },
  });

  return true;
}
