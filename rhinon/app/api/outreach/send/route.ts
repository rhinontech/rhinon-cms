import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";
import dbConnect from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";
import AiActivity from "@/lib/models/AiActivity";
import { generateEmailHtml } from "@/lib/email-templates";
import { getRequestUser } from "@/lib/request-auth";
import { saveEmailToS3 } from "@/lib/s3";
import { requireCapability } from "@/lib/authorization";
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
    const { leadId, subject, body } = await req.json();
    await dbConnect();

    const senderIdentity = await OutreachEmail.findOne({
      email: currentUser.activeIdentityEmail,
      status: "Active",
    }).lean();
    if (!senderIdentity) {
      return NextResponse.json({ error: "Active sender identity is not available" }, { status: 400 });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!lead.email) {
      return NextResponse.json({ error: "Lead email missing" }, { status: 400 });
    }

    // Send the actual email wrapped in our branded HTML template
    const finalHtml = generateEmailHtml(body);
    const info = await sendEmail({
      to: lead.email,
      subject: subject || "Scaling your operations",
      text: body,
      html: finalHtml,
      fromEmail: currentUser.activeIdentityEmail,
    });

    // Archive a copy to S3 for Inbox history
    const messageId = info.messageId || `outreach-${Date.now()}`;
    const rawEml = [
      `From: "${currentUser.name}" <${currentUser.activeIdentityEmail}>`,
      `To: ${lead.email}`,
      `Subject: ${subject || "Scaling your operations"}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${messageId}>`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      finalHtml
    ].join("\r\n");

    try {
      await saveEmailToS3(currentUser.activeIdentityEmail, "outbound", messageId, rawEml);
    } catch (s3Err) {
      console.error("Failed to archive outreach to S3:", s3Err);
    }

    // Update lead status to Sent
    lead.status = "Interested"; 
    await lead.save();

    // Log Activity
    await AiActivity.create({
      leadId: lead._id,
      campaignId: lead.campaignId,
      type: "OutreachSent",
      content: `Email outreach sent: "${subject}"`,
      timestamp: new Date()
    });

    await writeAuditLog({
      actor: currentUser,
      action: "lead.outreach_sent",
      targetType: "lead",
      targetId: lead._id.toString(),
      metadata: {
        to: lead.email,
        fromEmail: currentUser.activeIdentityEmail,
        subject: subject || "Scaling your operations",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Outreach Send Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
