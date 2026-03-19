import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  fromEmail?: string;
};

export async function sendEmail({ to, subject, text, html, fromEmail }: SendEmailOptions) {
  const ses = new SESv2Client({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const fromAddress = fromEmail || "admin@rhinonlabs.com";
  const fromName = fromEmail ? fromEmail.split('@')[0] : "Admin";
  const senderId = `"${fromName}" <${fromAddress}>`;

  // Sanitize recipient: Handle redundant quotes in display names if present
  const sanitizedTo = to.replace(/\\"/g, '"').replace(/^"/, '').replace(/"$/, '');

  const command = new SendEmailCommand({
    FromEmailAddress: senderId,
    Destination: {
      ToAddresses: [sanitizedTo],
    },
    Content: {
      Simple: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: text },
          Html: { Data: html || text.replace(/\n/g, "<br />") },
        },
      },
    },
  });

  try {
    const result = await ses.send(command);
    return {
      messageId: result.MessageId,
      ...result
    };
  } catch (err: any) {
    console.error("Direct SESv2 Send Error:", err);
    throw err;
  }
}
