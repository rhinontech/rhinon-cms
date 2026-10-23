import { ConnectedAccount } from "../models/ConnectedAccount";
import { accessToken } from "./connectedAccounts";
import type { EventInput, MeetingEvent } from "./googleCalendar";

/**
 * A person's Outlook / Microsoft 365 calendar through Microsoft Graph, returning
 * the same MeetingEvent shape as the Google side so the Meetings screen doesn't
 * care which one it's looking at. Outlook emails attendees itself whenever an
 * event with attendees is created, changed or cancelled.
 */

const GRAPH = "https://graph.microsoft.com/v1.0/me";

interface GraphEvent {
  id: string;
  iCalUId?: string;
  subject?: string;
  bodyPreview?: string;
  body?: { content?: string; contentType?: string };
  location?: { displayName?: string };
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  isAllDay?: boolean;
  isCancelled?: boolean;
  webLink?: string;
  onlineMeeting?: { joinUrl?: string } | null;
  organizer?: { emailAddress?: { address?: string } };
  attendees?: { emailAddress?: { address?: string }; status?: { response?: string } }[];
}

async function graph<T>(account: ConnectedAccount, path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken(account);
  const res = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Times come back as UTC so they convert cleanly to ISO.
      Prefer: 'outlook.timezone="UTC"',
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    const err: any = new Error(data?.error?.message || `Outlook calendar error (${res.status})`);
    err.response = { status: res.status };
    throw err;
  }
  return data as T;
}

const utc = (dt?: string) => (dt ? (dt.endsWith("Z") ? dt : `${dt}Z`) : null);
const RESPONSE: Record<string, string> = { accepted: "accepted", declined: "declined", tentativelyAccepted: "tentative", none: "needsAction", notResponded: "needsAction" };

function toMeetingEvent(e: GraphEvent): MeetingEvent {
  return {
    id: e.id,
    iCalUID: e.iCalUId ?? null,
    sequence: 0,
    summary: e.subject || "(no title)",
    description: e.bodyPreview || null,
    location: e.location?.displayName || null,
    start: e.isAllDay ? (e.start?.dateTime ?? "").slice(0, 10) || null : utc(e.start?.dateTime),
    end: e.isAllDay ? (e.end?.dateTime ?? "").slice(0, 10) || null : utc(e.end?.dateTime),
    allDay: Boolean(e.isAllDay),
    meetLink: e.onlineMeeting?.joinUrl ?? null,
    htmlLink: e.webLink ?? null,
    organizer: e.organizer?.emailAddress?.address ?? null,
    attendees: (e.attendees || []).map((a) => ({
      email: a.emailAddress?.address || "",
      responseStatus: RESPONSE[a.status?.response ?? ""] ?? null,
    })),
    status: e.isCancelled ? "cancelled" : "confirmed",
  };
}

const when = (d: Date) => ({ dateTime: d.toISOString().replace(/\.\d{3}Z$/, ""), timeZone: "UTC" });

function body(input: Partial<EventInput>) {
  return {
    ...(input.summary !== undefined ? { subject: input.summary } : {}),
    ...(input.description !== undefined ? { body: { contentType: "text", content: input.description || "" } } : {}),
    ...(input.location !== undefined ? { location: { displayName: input.location || "" } } : {}),
    ...(input.startTime ? { start: when(input.startTime) } : {}),
    ...(input.endTime ? { end: when(input.endTime) } : {}),
    ...(input.attendees !== undefined
      ? { attendees: input.attendees.map((address) => ({ emailAddress: { address }, type: "required" })) }
      : {}),
  };
}

export async function listEvents(account: ConnectedAccount, timeMin: Date, timeMax: Date): Promise<MeetingEvent[]> {
  const q = new URLSearchParams({
    startDateTime: timeMin.toISOString(),
    endDateTime: timeMax.toISOString(),
    $top: "500",
    $orderby: "start/dateTime",
  });
  const data = await graph<{ value: GraphEvent[] }>(account, `/calendarView?${q}`);
  return data.value.filter((e) => !e.isCancelled).map(toMeetingEvent);
}

export async function createEvent(account: ConnectedAccount, input: EventInput): Promise<MeetingEvent> {
  const payload = {
    ...body(input),
    // A Teams link when asked for. Personal Outlook accounts can't create Teams
    // meetings; Graph then just creates the event without one.
    ...(input.addMeet ? { isOnlineMeeting: true, onlineMeetingProvider: "teamsForBusiness" } : {}),
  };
  try {
    return toMeetingEvent(await graph<GraphEvent>(account, "/events", { method: "POST", body: JSON.stringify(payload) }));
  } catch (err: any) {
    if (!input.addMeet) throw err;
    // No Teams on this account — create it without the online meeting rather than fail.
    const { isOnlineMeeting: _i, onlineMeetingProvider: _p, ...plain } = payload as any;
    return toMeetingEvent(await graph<GraphEvent>(account, "/events", { method: "POST", body: JSON.stringify(plain) }));
  }
}

export async function updateEvent(account: ConnectedAccount, eventId: string, input: Partial<EventInput>): Promise<MeetingEvent> {
  return toMeetingEvent(
    await graph<GraphEvent>(account, `/events/${encodeURIComponent(eventId)}`, { method: "PATCH", body: JSON.stringify(body(input)) })
  );
}

export async function getEvent(account: ConnectedAccount, eventId: string): Promise<MeetingEvent> {
  return toMeetingEvent(await graph<GraphEvent>(account, `/events/${encodeURIComponent(eventId)}`));
}

/** Cancelling (not deleting) is what sends attendees a cancellation notice. */
export async function deleteEvent(account: ConnectedAccount, eventId: string): Promise<void> {
  const id = encodeURIComponent(eventId);
  try {
    await graph(account, `/events/${id}/cancel`, { method: "POST", body: JSON.stringify({ comment: "This meeting was cancelled." }) });
  } catch (err: any) {
    // Only the organizer can cancel; anything else (e.g. no attendees) is a plain delete.
    if (err.response?.status === 404) throw err;
    await graph(account, `/events/${id}`, { method: "DELETE" });
  }
}

