import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

type SendEmailPayload = {
  to: string | string[];
  cc?: string[];
  from?: string;
  fromName?: string;
  replyTo?: string;
  // Transport policy: "gmail" = the shared info@ Gmail account (onboarding
  // emails only); "ses" = send as the user's own domain address. Default keeps
  // the old preference (SES when configured, else Gmail).
  via?: "gmail" | "ses";
  subject: string;
  html?: string;
  text?: string;
  // Attachments only go out over SMTP (SES "Simple" content doesn't support them)
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
};

const sesRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
const sesFromEmail = process.env.AWS_SES_FROM_EMAIL || process.env.GMAIL_USER || process.env.SMTP_FROM_EMAIL;
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

function toArray(value: string | string[]) {
  return Array.isArray(value) ? value : [value];
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
}: SendEmailPayload) {
  const toAddresses = toArray(to);
  const fromAddress = from || sesFromEmail;
  const displayName = customFromName || fromName;
  const useSes = via === "ses" ? true : via === "gmail" ? false : Boolean(sesClient);
  if (via === "ses" && !sesClient) throw new Error("SES transport requested but not configured (set AWS_SES_FROM_EMAIL).");
  if (via === "gmail" && !smtpTransporter) throw new Error("Gmail transport requested but not configured.");

  if (!fromAddress) {
    throw new Error("No sender email configured");
  }

  if (attachments?.length) {
    if (!smtpTransporter) {
      throw new Error("Attachments require an SMTP transport (Gmail). Configure GMAIL_USER/GMAIL_APP_PASSWORD.");
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
    });
    return;
  }

  throw new Error("No mail transport configured. Set AWS SES or SMTP credentials.");
}
