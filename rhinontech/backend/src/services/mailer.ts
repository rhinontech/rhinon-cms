import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

type SendEmailPayload = {
  to: string | string[];
  cc?: string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
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
  subject,
  html,
  text,
}: SendEmailPayload) {
  const toAddresses = toArray(to);
  const fromAddress = from || sesFromEmail;

  if (!fromAddress) {
    throw new Error("No sender email configured");
  }

  if (sesClient) {
    await sesClient.send(new SendEmailCommand({
      FromEmailAddress: `"${fromName}" <${fromAddress}>`,
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
      from: `"${fromName}" <${fromAddress}>`,
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
