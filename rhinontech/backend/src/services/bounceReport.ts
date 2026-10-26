import { Op, WhereOptions } from "sequelize";
import { InboxEmail } from "../models";
import { htmlToText } from "./emailPreview";

/**
 * Bounce and delay notices come from a mail system, not a person: SES relays
 * every remote bounce as MAILER-DAEMON@<region>.amazonses.com. Matching on the
 * sender lets the Inbox leave them out and the Bounced tab count them, without
 * a folder of their own in the table.
 */
const SYSTEM_SENDERS = ["mailer-daemon@%", "postmaster@%"];

export const bounceNoticeWhere: WhereOptions = {
  [Op.or]: SYSTEM_SENDERS.map((pattern) => ({ fromEmail: { [Op.iLike]: pattern } })),
};

export const notBounceNoticeWhere: WhereOptions = {
  [Op.and]: SYSTEM_SENDERS.map((pattern) => ({ fromEmail: { [Op.notILike]: pattern } })),
};

export interface BounceNotice {
  /** The addresses the mail did not reach. */
  recipients: string[];
  /** failed: it will not arrive. delayed: the receiving side is still retrying. */
  action: "failed" | "delayed";
  /** Enhanced status code such as 5.1.1. 5.x.x is permanent, 4.x.x temporary. */
  status: string | null;
  /** The receiving server's own explanation. */
  reason: string | null;
}

const ADDRESS = /[a-z0-9._%+'-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi;
const SYSTEM_ADDRESS = /^(?:mailer-daemon|postmaster)@|@(?:[a-z0-9-]+\.)*amazonses\.com$/i;

const tidy = (address: string) => address.toLowerCase().replace(/^['"<]+|['">.,;:]+$/g, "");

/**
 * Reads one notice. RFC 3464 fields (Final-Recipient, Action, Status,
 * Diagnostic-Code) are in nearly everything SES relays; free-form notices
 * (Exchange's "Delivery has failed to these recipients") name the address near
 * the top instead, where our own sending address can appear too.
 */
export function parseBounceNotice(subject: string, body: string, isOurs: (address: string) => boolean): BounceNotice {
  const text = htmlToText(body).replace(/[ \t\r]+/g, " ");

  let recipients = [...text.matchAll(/Final-Recipient:\s*rfc822;\s*<?\s*([^\s<>;]+@[^\s<>;]+)/gi)]
    .map((m) => tidy(m[1]))
    .filter((address) => !SYSTEM_ADDRESS.test(address));
  if (!recipients.length) {
    recipients = (text.match(ADDRESS) ?? [])
      .map(tidy)
      .filter((address) => !SYSTEM_ADDRESS.test(address) && !isOurs(address))
      .slice(0, 1);
  }

  const delayed =
    /Action:\s*delayed/i.test(text) ||
    /^delivery (?:delayed|status notification \(delay\))/i.test(subject.trim()) ||
    /delivery is delayed|will continue to be attempted/i.test(text);

  const status =
    text.match(/Status:\s*([245]\.\d{1,3}\.\d{1,3})/i)?.[1] ?? text.match(/\b([45]\.\d{1,3}\.\d{1,3})\b/)?.[1] ?? null;
  const diagnostic = text.match(/Diagnostic-Code:\s*(?:smtp;\s*)?([^\n]+)/i)?.[1];
  // Without a Diagnostic-Code, the first line quoting an SMTP reply ("550 5.4.1 …").
  const smtpReply = diagnostic ? null : text.match(/\b[45]\d\d[\s-][45]\.\d{1,3}\.\d{1,3}[^\n]*/)?.[0];
  // SES writes the remote server's line breaks out as a literal "<CRLF>".
  const reason = (diagnostic ?? smtpReply ?? "").replace(/<CRLF>|\s+/gi, " ").trim().slice(0, 300) || null;

  return { recipients: [...new Set(recipients)], action: delayed ? "delayed" : "failed", status, reason };
}

export interface BouncedAddress {
  address: string;
  /** Notices saying the mail will not arrive. */
  bounced: number;
  /** Notices saying delivery is still being retried. */
  delayed: number;
  /** Mail these mailboxes sent to the address. */
  sent: number;
  lastNoticeAt: string;
  lastSentAt: string | null;
  /** From the latest failure, or the latest delay when nothing has failed. */
  status: string | null;
  reason: string | null;
  /** Newest first, capped. */
  notices: Array<{ at: string; action: BounceNotice["action"]; status: string | null; reason: string | null }>;
  sends: Array<{ at: string; subject: string }>;
}

export interface BounceReport {
  addresses: BouncedAddress[];
  /** Notices read, matched or not. */
  notices: number;
  /** Notices that named no address we could read. */
  unmatched: number;
}

const HISTORY_LIMIT = 25;

/**
 * Every address that bounced mail from these mailboxes, newest bounce first,
 * with how often it was written to. Trash is left out: a notice someone deleted
 * is one they meant to be rid of.
 */
export async function bounceReport(
  owners: string | { [Op.in]: string[] },
  isOurs: (address: string) => boolean
): Promise<BounceReport> {
  const rows = await InboxEmail.findAll({
    where: { [Op.and]: [{ ownerEmail: owners, isInternal: false, folder: { [Op.ne]: "trash" } }, bounceNoticeWhere] },
    attributes: ["subject", "body", "sentAt", "messageId"],
    order: [["sentAt", "DESC"]],
  });

  const byAddress = new Map<string, BouncedAddress>();
  const seen = new Set<string>();
  let notices = 0;
  let unmatched = 0;
  for (const row of rows) {
    // Inbound mail stored twice (a webhook delivery race, mostly Aug–Sep 2026)
    // is one notice, not two bounces.
    if (row.messageId) {
      if (seen.has(row.messageId)) continue;
      seen.add(row.messageId);
    }
    notices++;
    const notice = parseBounceNotice(row.subject, row.body, isOurs);
    if (!notice.recipients.length) {
      unmatched++;
      continue;
    }
    const at = row.sentAt.toISOString();
    for (const address of notice.recipients) {
      let entry = byAddress.get(address);
      if (!entry) {
        entry = { address, bounced: 0, delayed: 0, sent: 0, lastNoticeAt: at, lastSentAt: null, status: null, reason: null, notices: [], sends: [] };
        byAddress.set(address, entry);
      }
      if (notice.action === "failed") entry.bounced++;
      else entry.delayed++;
      // Rows arrive newest first: the first failure seen is the latest, and it
      // outranks any newer delay notice.
      const firstFailure = notice.action === "failed" && entry.bounced === 1;
      const firstDelayBeforeAnyFailure = notice.action === "delayed" && entry.delayed === 1 && entry.bounced === 0;
      if (firstFailure || firstDelayBeforeAnyFailure) {
        entry.status = notice.status;
        entry.reason = notice.reason;
      }
      if (entry.notices.length < HISTORY_LIMIT) {
        entry.notices.push({ at, action: notice.action, status: notice.status, reason: notice.reason });
      }
    }
  }

  // Recipients are stored lowercase on every send path, so an array overlap
  // finds each send exactly.
  if (byAddress.size) {
    const sent = await InboxEmail.findAll({
      where: { ownerEmail: owners, folder: "sent", isInternal: false, toEmails: { [Op.overlap]: [...byAddress.keys()] } },
      attributes: ["toEmails", "subject", "sentAt"],
      order: [["sentAt", "DESC"]],
    });
    for (const row of sent) {
      const at = row.sentAt.toISOString();
      for (const to of new Set(row.toEmails.map((t) => t.toLowerCase()))) {
        const entry = byAddress.get(to);
        if (!entry) continue;
        entry.sent++;
        if (!entry.lastSentAt) entry.lastSentAt = at;
        if (entry.sends.length < HISTORY_LIMIT) entry.sends.push({ at, subject: row.subject });
      }
    }
  }

  return { addresses: [...byAddress.values()], notices, unmatched };
}
