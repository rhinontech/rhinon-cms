import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
import AiActivity from "@/lib/models/AiActivity";
import { sendEmail } from "@/lib/mail";
import { postToLinkedIn } from "@/lib/connectors/linkedin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id: campaignId } = await params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Find all leads for this campaign that have a draft and haven't been emailed/posted yet
    const leads = await Lead.find({ 
      campaignId, 
      aiDraft: { $exists: true, $ne: "" },
      status: "Interested" 
    });
    
    let sentCount = 0;
    
    // If it's a LinkedIn Post campaign, we might just post once or per lead if intended.
    // Usually, "Campaigns" in this context are outbound sequences (per lead).
    // If channel is LinkedIn DM, we'd need a different API, but for now let's handle LinkedIn Post as a broadcast per lead or a single broadcast.
    // The user's referenced controller had `postToLinkedIn`.
    
    for (const lead of leads) {
      try {
        if (campaign.channel === "Email") {
          await sendEmail({
            to: lead.email,
            subject: `Scaling ${lead.company}'s operations`,
            body: lead.aiDraft,
          });
          lead.status = "Emailed";
        } else if (campaign.channel && campaign.channel.startsWith("LinkedIn")) {
          // Send to LinkedIn Post/Article/Video/DM
          // For broadcast channels (Post/Video/Article), we use media if available
          const mediaUrls = (campaign as any).mediaUrl ? [(campaign as any).mediaUrl] : [];
          await postToLinkedIn(lead.aiDraft, mediaUrls);
          lead.status = "Emailed";
        }

        await lead.save();

        await AiActivity.create({
          leadId: lead._id,
          campaignId: campaign._id,
          type: "OutreachSent",
          content: `Campaign outreach ${campaign.channel === "Email" ? "email" : "LinkedIn post"} delivered via Rhinon Engine.`,
          timestamp: new Date(),
        });

        sentCount++;
      } catch (err) {
        console.error(`Error processing lead ${lead._id}:`, err);
      }
    }

    // Update campaign stage if everything is sent
    const remaining = await Lead.countDocuments({ campaignId, status: "Interested" });
    if (remaining === 0) {
      campaign.stage = "Completed";
      await campaign.save();
    }

    return NextResponse.json({ 
      success: true, 
      sent: sentCount,
      total: leads.length 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
