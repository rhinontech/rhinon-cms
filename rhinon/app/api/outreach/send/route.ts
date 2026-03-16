import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";
import dbConnect from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";
import AiActivity from "@/lib/models/AiActivity";
import { generateEmailHtml } from "@/lib/email-templates";
import { getRequestUser } from "@/lib/request-auth";

export async function POST(req: Request) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { leadId, subject, body } = await req.json();
    await dbConnect();

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!lead.email) {
      return NextResponse.json({ error: "Lead email missing" }, { status: 400 });
    }

    // Send the actual email wrapped in our branded HTML template
    await sendEmail({
      to: lead.email,
      subject: subject || "Scaling your operations",
      text: body,
      html: generateEmailHtml(body),
    });

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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Outreach Send Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
