import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { oneClickUnsubscribeUrl } from "./unsubscribeToken";

type SendEmailPayload = {
  to: string | string[];
  cc?: string[];
  from?: string;
  fromName?: string;
  replyTo?: string;
  // Transport policy: "ses" = send as a domain address on the authenticated
  // sending domain; "gmail" = the legacy shared Gmail account, which is on an
  // unauthenticated domain and is no longer used by any caller. Default is SES
  // when configured.
  via?: "gmail" | "ses";
  subject: string;
  html?: string;
  text?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
  // A calendar invite. Emitted as a `text/calendar; method=…` alternative part
  // (what makes Gmail/Outlook/Apple Mail show RSVP buttons) plus a .ics attachment
  // for clients that only understand the file.
  icalEvent?: { method: string; content: string; filename?: string };
  /** Send through this specific mailbox instead of the shared transport. */
  smtpAuth?: { user: string; pass: string; host?: string; port?: number };
  /**
   * Marks this as bulk mail and attaches RFC 8058 one-click unsubscribe headers
   * for the given recipient.
   *
   * Gmail and Yahoo require these of bulk senders — a link in the footer does
   * not satisfy it, and mail without them is filtered regardless of how clean
   * the content is. Deliberately opt-in: transactional mail (onboarding,
   * password resets) must NOT carry them.
   */
  unsubscribeFor?: string;
};

const sesRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
// Deliberately does NOT fall back to GMAIL_USER: that account is on a
// different domain, and silently sending as it is how unauthenticated mail
// got out in the first place.
const sesFromEmail = process.env.AWS_SES_FROM_EMAIL || process.env.SMTP_FROM_EMAIL;
const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER;
const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
const fromName = process.env.MAIL_FROM_NAME || "Rhinon Labs";

// Require explicit AWS_SES_FROM_EMAIL to opt into SES — prevents S3-only AWS credentials from hijacking email
const hasSesConfig = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && sesRegion && process.env.AWS_SES_FROM_EMAIL);
const hasGmailConfig = Boolean(smtpUser && smtpPass);

const sesClient = hasSesConfig ? new SESv2Client({ region: sesRegion }) : null;
const smtpTransporter = hasGmailConfig
  ? nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })
  : null;

/**
 * Per-mailbox SMTP transports for outreach rotation.
 *
 * Swapping only the From header still sends every message down one connection,
 * which is not what rotation is for — reputation is per mailbox. Passing
 * `smtpAuth` opens (and reuses) a real transport for that address, so the
 * messages genuinely originate from separate mailboxes.
 */
const extraTransports = new Map<string, nodemailer.Transporter>();

function transportFor(auth: { user: string; pass: string; host?: string; port?: number }) {
  const key = `${auth.host || "gmail"}:${auth.user}`;
  let transport = extraTransports.get(key);
  if (!transport) {
    transport = auth.host
      ? nodemailer.createTransport({
          host: auth.host,
          port: auth.port || 587,
          secure: (auth.port || 587) === 465,
          auth: { user: auth.user, pass: auth.pass },
        })
      : nodemailer.createTransport({ service: "gmail", auth: { user: auth.user, pass: auth.pass } });
    extraTransports.set(key, transport);
  }
  return transport;
}

function toArray(value: string | string[]) {
  return Array.isArray(value) ? value : [value];
}

/**
 * Is this address on a domain we actually authenticate?
 *
 * Only the platform domain and its subdomains are DKIM-signed and SPF-aligned,
 * so a tenant address (aman@swiggy.rhinontech.in) passes and anything else does
 * not. Sending from an unauthenticated domain is what put this system's mail in
 * the spam folder, so it is worth a loud line in the log rather than a silent
 * delivery failure nobody sees.
 */
function isAuthenticatedSender(address: string): boolean {
  const platform = (process.env.PLATFORM_EMAIL_DOMAIN || "rhinontech.in").toLowerCase();
  const domain = address.split("@")[1]?.toLowerCase() ?? "";
  return domain === platform || domain.endsWith(`.${platform}`);
}

/** RFC 8058 headers. Both are required — the URL alone is not enough. */
function unsubscribeHeaders(email?: string): Record<string, string> {
  if (!email) return {};
  return {
    "List-Unsubscribe": `<${oneClickUnsubscribeUrl(email)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export async function sendEmail({
  to,
  cc = [],
  from,
  fromName: customFromName,
  replyTo,
  via,
  subject,
  html,
  text,
  attachments,
  icalEvent,
  smtpAuth,
  unsubscribeFor,
}: SendEmailPayload) {
  const toAddresses = toArray(to);
  if (from && !isAuthenticatedSender(from)) {
    console.warn(
      `[Mailer] Sending as ${from}, which is not on the authenticated sending ` +
        `domain — this mail will not be DKIM-signed or SPF-aligned and is likely to be filtered.`
    );
  }
  const listHeaders = unsubscribeHeaders(unsubscribeFor);
  const hasListHeaders = Object.keys(listHeaders).length > 0;
  const fromAddress = from || sesFromEmail;
  const displayName = customFromName || fromName;
  // A dedicated mailbox is the whole point of rotation, so it overrides the
  // usual SES/SMTP selection rather than being folded into it.
  if (smtpAuth?.user && smtpAuth?.pass) {
    const transport = transportFor(smtpAuth);
    await transport.sendMail({
      from: `"${displayName}" <${fromAddress || smtpAuth.user}>`,
      to: toAddresses.join(", "),
      cc: cc.length ? toArray(cc).join(", ") : undefined,
      replyTo,
      subject,
      html,
      text,
      attachments,
      icalEvent,
      ...(hasListHeaders ? { headers: listHeaders } : {}),
    } as any);
    return;
  }

  const useSes = via === "ses" ? true : via === "gmail" ? false : Boolean(sesClient);
  if (via === "ses" && !sesClient) throw new Error("SES transport requested but not configured (set AWS_SES_FROM_EMAIL).");
  if (via === "gmail" && !smtpTransporter) throw new Error("Gmail transport requested but not configured.");

  if (!fromAddress) {
    throw new Error("No sender email configured");
  }

  // SES's "Simple" content can't carry attachments or a calendar part, so those have to go
  // out as raw MIME. Gmail SMTP stays the default for attachments (unchanged behaviour for
  // existing callers like the letter PDFs); SES raw is used when it's explicitly asked for,
  // or when it's the only transport configured.
  const needsMime = Boolean(attachments?.length || icalEvent);
  if (needsMime) {
    const useSesRaw = sesClient && (via === "ses" || !smtpTransporter);
    if (useSesRaw) {
      const mime = await new MailComposer({
        from: `"${displayName}" <${fromAddress}>`,
        replyTo,
        to: toAddresses,
        cc: cc.length ? cc : undefined,
        subject,
        html,
        text,
        attachments,
        icalEvent,
        ...(hasListHeaders ? { headers: listHeaders } : {}),
      })
        .compile()
        .build();

      await sesClient!.send(new SendEmailCommand({ Content: { Raw: { Data: mime } } }));
      return;
    }

    if (!smtpTransporter) {
      throw new Error("Sending attachments requires SES or SMTP credentials to be configured.");
    }
    await smtpTransporter.sendMail({
      from: `"${displayName}" <${fromAddress}>`,
      replyTo,
      to: toAddresses.join(", "),
      cc: cc.length ? cc.join(", ") : undefined,
      subject,
      html,
      text,
      attachments,
      icalEvent,
      ...(hasListHeaders ? { headers: listHeaders } : {}),
    });
    return;
  }

  if (useSes && sesClient) {
    await sesClient.send(new SendEmailCommand({
      FromEmailAddress: `"${displayName}" <${fromAddress}>`,
      ...(replyTo ? { ReplyToAddresses: [replyTo] } : {}),
      Destination: {
        ToAddresses: toAddresses,
        CcAddresses: cc,
      },
      Content: {
        Simple: {
          ...(hasListHeaders
            ? { Headers: Object.entries(listHeaders).map(([Name, Value]) => ({ Name, Value })) }
            : {}),
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            ...(html ? { Html: { Data: html, Charset: "UTF-8" } } : {}),
            ...(text ? { Text: { Data: text, Charset: "UTF-8" } } : {}),
          },
        },
      },
    }));
    return;
  }

  if (smtpTransporter) {
    await smtpTransporter.sendMail({
      from: `"${displayName}" <${fromAddress}>`,
      replyTo,
      to: toAddresses.join(", "),
      cc: cc.length ? cc.join(", ") : undefined,
      subject,
      html,
      text,
      ...(hasListHeaders ? { headers: listHeaders } : {}),
    });
    return;
  }

  throw new Error("No mail transport configured. Set AWS SES or SMTP credentials.");
}
