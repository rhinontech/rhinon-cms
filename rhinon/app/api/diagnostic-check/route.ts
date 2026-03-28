import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
import OutreachEmail from "@/lib/models/OutreachEmail";
import User from "@/lib/models/User";
import { sendEmail } from "@/lib/mail";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    let result = "";
    result += "--- LATEST CAMPAIGN ---\n";
    const c = await Campaign.find().sort({createdAt: -1}).limit(1).lean();
    if (c.length > 0) {
      const campaign = c[0] as any;
      result += `Campaign ID: ${campaign._id}, Name: ${campaign.name}, Channel: ${campaign.channel}, Stage: ${campaign.stage}\n`;
      
      result += "\n--- LEADS IN CAMPAIGN ---\n";
      const leads = await Lead.find({ campaignId: campaign._id }).lean() as any[];
      result += `Total Leads: ${leads.length}\n`;
      const interestingLeads = leads.filter(l => l.status === "Interested");
      result += `Leads with status='Interested': ${interestingLeads.length}\n`;
      const draftLeads = leads.filter((l: any) => l.aiDraft && l.aiDraft.length > 0);
      result += `Leads with aiDraft populated: ${draftLeads.length}\n`;
      const emailedLeads = leads.filter(l => l.status === "Emailed");
      result += `Leads with status='Emailed': ${emailedLeads.length}\n`;
      if (leads.length > 0) {
        result += `Sample Lead: email=${leads[0].email}, status=${leads[0].status}, hasDraft=${!!leads[0].aiDraft}\n`;
      }
    } else {
      result += "No campaigns found.\n";
    }

    result += "\n--- OUTREACH EMAILS (Sender Identities) ---\n";
    const identities = await OutreachEmail.find().lean() as any[];
    result += JSON.stringify(identities.map(i => ({ email: i.email, status: i.status }))) + "\n";

    result += "\n--- USERS ---\n";
    const users = await User.find().lean() as any[];
    result += JSON.stringify(users.map(u => ({ email: u.email, roleId: u.roleId }))) + "\n";
    
    result += "\n--- TESTING AWS SES ---\n";
    try {
      const activeIdentity = identities.find(i => i.status === "Active");
      if (!activeIdentity) {
        result += "WARNING: No active sender identity found. Campaigns will not send!\n";
      } else {
        result += `Attempting test send from ${activeIdentity.email}...\n`;
        const res = await sendEmail({
          to: "prabhat@rhinon.tech",
          subject: "AWS SES Diagnostic Test",
          text: "If this goes through without throwing, AWS SES is configured correctly (or at least keys are valid).",
          fromEmail: activeIdentity.email
        });
        result += `Test Send SUCCESS! MessageId: ${res.messageId}\n`;
      }
    } catch(e: any) {
      result += `Test Send FAILED Error: ${e.message}\n`;
    }

    return new NextResponse(result, { status: 200, headers: { 'Content-Type': 'text/plain' }});
  } catch(e: any) {
    return new NextResponse(e.message, { status: 500 });
  }
}
