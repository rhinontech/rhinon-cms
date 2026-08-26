import { Op } from "sequelize";
import { Activity, Lead } from "../models";

/**
 * Puts a booked meeting onto the timeline of any lead among its attendees.
 *
 * Meetings live in Google Calendar, not in our database, so there is no local
 * meeting row to hang a foreign key off. Matching attendee emails to leads and
 * writing an Activity gets the thing people actually want — the call shows up
 * on the lead — without inventing a join table that would need its own sync.
 *
 * Never throws: a calendar booking must not fail because CRM logging did.
 */
export async function logMeetingOnLeads(opts: {
  attendees: string[];
  summary: string;
  startTime: Date | string;
  endTime?: Date | string | null;
  description?: string | null;
  meetingLink?: string | null;
  eventId?: string | null;
  userId?: string | null;
}): Promise<number> {
  try {
    const emails = [...new Set(
      (opts.attendees || [])
        .map((a) => (a || "").trim().toLowerCase())
        .filter(Boolean)
    )];
    if (emails.length === 0) return 0;

    const leads = await Lead.findAll({
      where: { email: { [Op.in]: emails } },
      attributes: ["id", "accountId"],
    });
    if (leads.length === 0) return 0;

    const start = new Date(opts.startTime);
    const durationMinutes = opts.endTime
      ? Math.max(0, Math.round((new Date(opts.endTime).getTime() - start.getTime()) / 60000))
      : null;

    await Activity.bulkCreate(
      leads.map((lead) => ({
        leadId: lead.id,
        accountId: lead.accountId,
        userId: opts.userId || null,
        type: "Meeting" as const,
        subject: opts.summary,
        body: opts.description || null,
        durationMinutes,
        occurredAt: start,
        metadata: {
          source: "calendar",
          ...(opts.eventId ? { eventId: opts.eventId } : {}),
          ...(opts.meetingLink ? { meetingLink: opts.meetingLink } : {}),
        },
      }))
    );

    await Lead.update(
      { lastActivityAt: start },
      { where: { id: { [Op.in]: leads.map((l) => l.id) } } }
    );

    return leads.length;
  } catch (err: any) {
    console.error("[CRM] Failed to log meeting on leads:", err.message);
    return 0;
  }
}
