import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { sendEmail } from "@/lib/mail";
import { saveEmailToS3 } from "@/lib/s3";
export async function POST(req: Request) {
  const sessionUser = getRequestUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { to, subject, body, fromEmail } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Default to the user's email if not explicitly provided or if not an admin.
    const sender = (sessionUser.roleSlug === "admin" && fromEmail) ? fromEmail : sessionUser.email;

    const info = await sendEmail({
      to,
      fromEmail: sender,
      subject,
      text: body,
      html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${body}</div>`,
    });

    // Save a copy of the sent email as a raw EML to S3 so the Inbox picks it up
    const messageId = info.messageId || `sent-${Date.now()}`;
    const rawEml = [
      `From: "${sessionUser.name}" <${sender}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${messageId}>`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      `<div style="font-family: sans-serif; white-space: pre-wrap;">${body}</div>`
    ].join("\r\n");

    try {
      await saveEmailToS3(sender, "outbound", messageId, rawEml);
    } catch (s3Err) {
      console.error("Failed to save copy to S3:", s3Err);
      // We don't fail the whole request if just the S3 archive fails
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
