import crypto from "crypto";
import { Op } from "sequelize";
import { Meeting } from "../models/Meeting";
import type { EventInput, MeetingEvent } from "./googleCalendar";

/**
 * Rhinon's built-in calendar: meetings live in our own table, so scheduling works with
 * no Google or Microsoft account. Invites go out as .ics over SES (meetingInvite.ts).
 * It only knows about meetings booked here — a connected calendar also sees outside events.
 */

// Anyone can join without an account. Override to point at a self-hosted room service.
const MEET_BASE = (process.env.NATIVE_MEET_BASE_URL || "https://meet.jit.si").replace(/\/+$/, "");

function newMeetLink(): string {
  return `${MEET_BASE}/rhinon-${crypto.randomBytes(9).toString("base64url")}`;
}

function toEvent(m: Meeting): MeetingEvent {
  return {
    id: m.id,
    iCalUID: `${m.id}@rhinon-meetings`,
    sequence: m.sequence,
    summary: m.summary,
    description: m.description,
    location: m.location,
    start: m.startTime.toISOString(),
    end: m.endTime.toISOString(),
    allDay: false,
    meetLink: m.meetLink,
    htmlLink: null,
    organizer: m.organizerEmail,
    attendees: (m.attendees || []).map((email) => ({ email, responseStatus: null })),
    status: m.status,
  };
}

async function find(id: string): Promise<Meeting> {
  const m = /^[0-9a-f-]{36}$/i.test(id) ? await Meeting.findByPk(id) : null;
  if (!m || m.status === "cancelled") throw Object.assign(new Error("Meeting not found"), { code: 404 });
  return m;
}

export async function listEvents(from: Date, to: Date): Promise<MeetingEvent[]> {
  const rows = await Meeting.findAll({
    where: { status: "confirmed", startTime: { [Op.lt]: to }, endTime: { [Op.gt]: from } },
    order: [["startTime", "ASC"]],
  });
  return rows.map(toEvent);
}

export async function getBusyIntervals(from: Date, to: Date): Promise<{ start: Date; end: Date }[]> {
  const rows = await Meeting.findAll({
    where: { status: "confirmed", startTime: { [Op.lt]: to }, endTime: { [Op.gt]: from } },
    attributes: ["startTime", "endTime"],
  });
  return rows.map((m) => ({ start: m.startTime, end: m.endTime }));
}

export async function createEvent(input: EventInput, organizerEmail: string | null, createdById: string | null): Promise<MeetingEvent> {
  const m = await Meeting.create({
    summary: input.summary,
    description: input.description ?? null,
    location: input.location ?? null,
    startTime: input.startTime,
    endTime: input.endTime,
    attendees: input.attendees ?? [],
    meetLink: input.addMeet ? newMeetLink() : null,
    organizerEmail,
    createdById,
  });
  return toEvent(m);
}

export async function updateEvent(id: string, input: Partial<EventInput>): Promise<MeetingEvent> {
  const m = await find(id);
  await m.update({
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    ...(input.description !== undefined ? { description: input.description ?? null } : {}),
    ...(input.location !== undefined ? { location: input.location ?? null } : {}),
    ...(input.startTime ? { startTime: input.startTime } : {}),
    ...(input.endTime ? { endTime: input.endTime } : {}),
    ...(input.attendees !== undefined ? { attendees: input.attendees } : {}),
    // Bumped on every edit so the re-sent .ics replaces the earlier one in the invitee's calendar.
    sequence: m.sequence + 1,
  });
  return toEvent(m);
}

export async function getEvent(id: string): Promise<MeetingEvent> {
  return toEvent(await find(id));
}

export async function deleteEvent(id: string): Promise<void> {
  const m = await find(id);
  await m.update({ status: "cancelled", sequence: m.sequence + 1 });
}
