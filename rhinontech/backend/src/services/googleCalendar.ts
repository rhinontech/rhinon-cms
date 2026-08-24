import { google, calendar_v3 } from "googleapis";
import crypto from "crypto";
import { GoogleCalendarToken, getActiveCalendarToken } from "../models/GoogleCalendarToken";

export const CALENDAR_TIMEZONE = "Asia/Kolkata";

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getOAuthCredentials(): { clientId: string; clientSecret: string; redirectUri: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5002/google-calendar/callback";
  return { clientId, clientSecret, redirectUri };
}

export function buildOAuthClient() {
  const creds = getOAuthCredentials();
  if (!creds) return null;
  return new google.auth.OAuth2(creds.clientId, creds.clientSecret, creds.redirectUri);
}

interface CalendarClient {
  calendar: calendar_v3.Calendar;
  calendarId: string;
}

// Built fresh per call from the stored refresh token, so connecting/disconnecting from
// Settings takes effect immediately without a server restart. googleapis refreshes the
// access token on its own once a refresh_token is set; the `tokens` listener just persists
// the refreshed value so the Settings screen can show when it last renewed.
async function getCalendarClient(): Promise<CalendarClient | null> {
  const creds = getOAuthCredentials();
  if (!creds) return null;

  const stored = await getActiveCalendarToken();
  if (!stored?.refreshToken) return null;

  const oauth2Client = new google.auth.OAuth2(creds.clientId, creds.clientSecret, creds.redirectUri);
  oauth2Client.setCredentials({ refresh_token: stored.refreshToken });

  oauth2Client.on("tokens", (tokens) => {
    if (!tokens.access_token) return;
    void stored
      .update({
        accessToken: tokens.access_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      })
      .catch((err) => console.error("Failed to persist refreshed Google token:", err.message));
  });

  return {
    calendar: google.calendar({ version: "v3", auth: oauth2Client }),
    calendarId: stored.calendarId || "primary",
  };
}

export async function isCalendarConnected(): Promise<boolean> {
  return (await getCalendarClient()) !== null;
}

export interface CalendarConnectionStatus {
  configured: boolean;
  connected: boolean;
  connectedEmail: string | null;
  calendarId: string | null;
  connectedAt: string | null;
}

export async function getConnectionStatus(): Promise<CalendarConnectionStatus> {
  const stored = await getActiveCalendarToken();
  return {
    configured: getOAuthCredentials() !== null,
    connected: Boolean(stored?.refreshToken),
    connectedEmail: stored?.connectedEmail ?? null,
    calendarId: stored?.calendarId ?? null,
    connectedAt: stored?.createdAt ? stored.createdAt.toISOString() : null,
  };
}

export class CalendarNotConnectedError extends Error {
  constructor() {
    super("Google Calendar is not connected. Connect it from Settings → Google Calendar.");
    this.name = "CalendarNotConnectedError";
  }
}

async function requireClient(): Promise<CalendarClient> {
  const client = await getCalendarClient();
  if (!client) throw new CalendarNotConnectedError();
  return client;
}

export interface MeetingEvent {
  id: string;
  /** Stable across updates — used as the .ics UID so REQUEST/CANCEL match up. */
  iCalUID: string | null;
  /** Google bumps this on every edit; the .ics SEQUENCE rides on it. */
  sequence: number;
  summary: string;
  description: string | null;
  location: string | null;
  start: string | null;
  end: string | null;
  allDay: boolean;
  meetLink: string | null;
  htmlLink: string | null;
  organizer: string | null;
  attendees: { email: string; responseStatus: string | null }[];
  status: string | null;
}

function meetLinkOf(event: calendar_v3.Schema$Event): string | null {
  const entry = event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video");
  return entry?.uri ?? event.hangoutLink ?? null;
}

function toMeetingEvent(event: calendar_v3.Schema$Event): MeetingEvent {
  const allDay = Boolean(event.start?.date && !event.start?.dateTime);
  return {
    id: event.id!,
    iCalUID: event.iCalUID ?? null,
    sequence: event.sequence ?? 0,
    summary: event.summary || "(no title)",
    description: event.description ?? null,
    location: event.location ?? null,
    start: event.start?.dateTime ?? event.start?.date ?? null,
    end: event.end?.dateTime ?? event.end?.date ?? null,
    allDay,
    meetLink: meetLinkOf(event),
    htmlLink: event.htmlLink ?? null,
    organizer: event.organizer?.email ?? null,
    attendees: (event.attendees || []).map((a) => ({
      email: a.email || "",
      responseStatus: a.responseStatus ?? null,
    })),
    status: event.status ?? null,
  };
}

export async function listEvents(timeMin: Date, timeMax: Date): Promise<MeetingEvent[]> {
  const { calendar, calendarId } = await requireClient();
  const { data } = await calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true, // expand recurring series into individual instances
    orderBy: "startTime",
    maxResults: 2500,
  });
  return (data.items || []).filter((e) => e.status !== "cancelled").map(toMeetingEvent);
}

/**
 * Busy windows on the shared calendar, used to grey out slots on the public booking page.
 * Built from events.list rather than freebusy.query because freebusy needs a broader scope
 * (calendar.readonly) than the calendar.events one this integration consents to.
 * Events explicitly marked "Free" (transparent) don't block — matching Google's own semantics.
 */
export async function getBusyIntervals(timeMin: Date, timeMax: Date): Promise<{ start: Date; end: Date }[]> {
  const { calendar, calendarId } = await requireClient();
  const { data } = await calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 2500,
  });

  const busy: { start: Date; end: Date }[] = [];
  for (const e of data.items || []) {
    if (e.status === "cancelled" || e.transparency === "transparent") continue;

    // All-day entries (a holiday, an offsite) carry `date` not `dateTime` and block the
    // whole IST day; `end.date` is exclusive per the API.
    const start = e.start?.dateTime ? new Date(e.start.dateTime) : e.start?.date ? new Date(`${e.start.date}T00:00:00+05:30`) : null;
    const end = e.end?.dateTime ? new Date(e.end.dateTime) : e.end?.date ? new Date(`${e.end.date}T00:00:00+05:30`) : null;
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) continue;

    busy.push({ start, end });
  }
  return busy;
}

export interface EventInput {
  summary: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  addMeet?: boolean;
}

export async function createEvent(input: EventInput): Promise<MeetingEvent> {
  const { calendar, calendarId } = await requireClient();
  const { data } = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: input.addMeet ? 1 : 0,
    sendUpdates: "none", // we email the .ics ourselves (see meetingInvite.ts) — Google must not double-send
    requestBody: {
      summary: input.summary,
      description: input.description || undefined,
      location: input.location || undefined,
      start: { dateTime: input.startTime.toISOString(), timeZone: CALENDAR_TIMEZONE },
      end: { dateTime: input.endTime.toISOString(), timeZone: CALENDAR_TIMEZONE },
      attendees: input.attendees?.length ? input.attendees.map((email) => ({ email })) : undefined,
      ...(input.addMeet
        ? {
            conferenceData: {
              createRequest: {
                requestId: crypto.randomUUID(),
                conferenceSolutionKey: { type: "hangoutsMeet" },
              },
            },
          }
        : {}),
    },
  });
  return toMeetingEvent(data);
}

// Used for both edits and reschedules — a reschedule is just a time-only patch. PATCH (not
// update) so unspecified fields keep their existing values instead of being wiped.
export async function updateEvent(eventId: string, input: Partial<EventInput>): Promise<MeetingEvent> {
  const { calendar, calendarId } = await requireClient();
  const { data } = await calendar.events.patch({
    calendarId,
    eventId,
    sendUpdates: "none",
    requestBody: {
      ...(input.summary !== undefined ? { summary: input.summary } : {}),
      ...(input.description !== undefined ? { description: input.description || undefined } : {}),
      ...(input.location !== undefined ? { location: input.location || undefined } : {}),
      ...(input.startTime ? { start: { dateTime: input.startTime.toISOString(), timeZone: CALENDAR_TIMEZONE } } : {}),
      ...(input.endTime ? { end: { dateTime: input.endTime.toISOString(), timeZone: CALENDAR_TIMEZONE } } : {}),
      ...(input.attendees !== undefined ? { attendees: input.attendees.map((email) => ({ email })) } : {}),
    },
  });
  return toMeetingEvent(data);
}

export async function getEvent(eventId: string): Promise<MeetingEvent> {
  const { calendar, calendarId } = await requireClient();
  const { data } = await calendar.events.get({ calendarId, eventId });
  return toMeetingEvent(data);
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { calendar, calendarId } = await requireClient();
  await calendar.events.delete({ calendarId, eventId, sendUpdates: "none" });
}
