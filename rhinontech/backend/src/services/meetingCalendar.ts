import type { ConnectedAccount } from "../models/ConnectedAccount";
import { decryptSecret } from "./totp";
import { hasCalendarAccess } from "./connectedAccounts";
import { accountFor } from "./emailIdentity";
import * as google from "./googleCalendar";
import * as microsoft from "./microsoftCalendar";
import type { EventInput, MeetingEvent } from "./googleCalendar";

/**
 * The calendar the Meetings tab works with for one person, per their
 * Settings → Accounts choice for Meetings:
 *
 *   GOOGLE / MICROSOFT — their own calendar. The provider sends the invites
 *                        (with a Meet / Teams link) from their own address.
 *   platform           — the workspace's shared Google calendar, if one is
 *                        connected; invites go out as .ics from their platform
 *                        address (meetingInvite.ts).
 */
export interface MeetingCalendar {
  source: "workspace" | "GOOGLE" | "MICROSOFT";
  /** The calendar owner's address, for display. */
  email: string | null;
  /** True when the provider emails attendees itself, so we must not send our own .ics. */
  providerSendsInvites: boolean;
  list(from: Date, to: Date): Promise<MeetingEvent[]>;
  create(input: EventInput): Promise<MeetingEvent>;
  update(id: string, input: Partial<EventInput>): Promise<MeetingEvent>;
  get(id: string): Promise<MeetingEvent>;
  remove(id: string): Promise<void>;
}

/** Their chosen mailbox was connected before calendar access was asked for. */
export class CalendarReconnectError extends Error {
  constructor(public provider: "GOOGLE" | "MICROSOFT") {
    super(`Reconnect your ${provider === "GOOGLE" ? "Google" : "Microsoft"} account in Settings → Accounts to give it calendar access.`);
    this.name = "CalendarReconnectError";
  }
}

function personal(account: ConnectedAccount): MeetingCalendar {
  if (!hasCalendarAccess(account)) throw new CalendarReconnectError(account.provider);
  if (account.provider === "GOOGLE") {
    const client = google.clientForGoogleAccount(decryptSecret(account.refreshToken));
    const opts = { client, sendUpdates: "all" as const };
    return {
      source: "GOOGLE",
      email: account.email,
      providerSendsInvites: true,
      list: (from, to) => google.listEvents(from, to, client),
      create: (input) => google.createEvent(input, opts),
      update: (id, input) => google.updateEvent(id, input, opts),
      get: (id) => google.getEvent(id, client),
      remove: (id) => google.deleteEvent(id, opts),
    };
  }
  return {
    source: "MICROSOFT",
    email: account.email,
    providerSendsInvites: true,
    list: (from, to) => microsoft.listEvents(account, from, to),
    create: (input) => microsoft.createEvent(account, input),
    update: (id, input) => microsoft.updateEvent(account, id, input),
    get: (id) => microsoft.getEvent(account, id),
    remove: (id) => microsoft.deleteEvent(account, id),
  };
}

const workspace: MeetingCalendar = {
  source: "workspace",
  email: null,
  providerSendsInvites: false,
  list: (from, to) => google.listEvents(from, to),
  create: (input) => google.createEvent(input),
  update: (id, input) => google.updateEvent(id, input),
  get: (id) => google.getEvent(id),
  remove: (id) => google.deleteEvent(id),
};

export async function calendarFor(userId: string): Promise<MeetingCalendar> {
  const account = await accountFor(userId, "meetings");
  if (account) return personal(account);
  const status = await google.getConnectionStatus();
  return { ...workspace, email: status.connectedEmail };
}
