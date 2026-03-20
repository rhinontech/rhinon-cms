import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-auth";
import { sendEmail } from "@/lib/mail";
import { saveEmailToS3 } from "@/lib/s3";
import { requireCapability } from "@/lib/authorization";
import dbConnect from "@/lib/mongodb";
import OutreachEmail from "@/lib/models/OutreachEmail";
import { writeAuditLog } from "@/lib/audit";
export async function POST(req: Request) {
  const sessionUser = getRequestUser(req);
  const auth = requireCapability(sessionUser, "send_email");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const currentUser = sessionUser!;

  try {
    const { to, subject, body, fromEmail } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const requestedSender = fromEmail || currentUser.activeIdentityEmail;

    if (requestedSender !== currentUser.activeIdentityEmail && !currentUser.capabilities.includes("manage_mailboxes")) {
      return NextResponse.json({ error: "Forbidden sender identity" }, { status: 403 });
    }

    await dbConnect();
    const senderIdentity = await OutreachEmail.findOne({ email: requestedSender, status: "Active" }).lean();
    if (!senderIdentity) {
      return NextResponse.json({ error: "Sender identity is not active" }, { status: 400 });
    }

    const sender = requestedSender;

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
      `From: "${currentUser.name}" <${sender}>`,
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

    await writeAuditLog({
      actor: currentUser,
      action: "email.sent",
      targetType: "outbound_email",
      targetId: messageId,
      metadata: { to, fromEmail: sender, subject },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
