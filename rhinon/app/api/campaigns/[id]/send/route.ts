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

    if (campaign.channel === "Email") {
      // Find all leads for this campaign that have a draft and haven't been emailed/posted yet
      const leads = await Lead.find({ 
        campaignId, 
        aiDraft: { $exists: true, $ne: "" },
        status: "Interested" 
      });
      
      let sentCount = 0;
      for (const lead of leads) {
        try {
          await sendEmail({
            to: lead.email,
            subject: `Scaling ${lead.company}'s operations`,
            body: lead.aiDraft,
          });
          lead.status = "Emailed";

          await lead.save();

          await AiActivity.create({
            leadId: lead._id,
            campaignId: campaign._id,
            type: "OutreachSent",
            content: `Campaign outreach email delivered via Rhinon Engine.`,
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
    } else {
      // Social Broadcast Channels
      let mediaUrl = campaign.mediaUrl;
      let postContent = campaign.aiDraft;

      // Fallback to template if campaign data is missing
      if (!postContent || !mediaUrl) {
        if (campaign.templateId) {
          const populatedCampaign = await Campaign.findById(campaignId).populate("templateId");
          const template = populatedCampaign?.templateId as any;
          if (template) {
            if (!postContent) postContent = template.body;
            if (!mediaUrl) mediaUrl = template.mediaUrl;
          }
        }
      }

      if (!postContent) {
         return NextResponse.json({ error: "No AI draft or template content found for this social post." }, { status: 400 });
      }

      try {
        const mediaUrls = mediaUrl ? [mediaUrl] : [];
        const result = await postToLinkedIn(postContent, mediaUrls, {
          visibility: campaign.visibility,
          channel: campaign.channel,
          articleUrl: campaign.articleUrl,
          mediaTitle: campaign.mediaTitle,
          mediaDescription: campaign.mediaDescription,
        });
        
        const fs = require('fs');
        fs.appendFileSync('/tmp/rhinon-debug.log', `\n--- Social Post Execution ${new Date().toISOString()} ---\n`);
        fs.appendFileSync('/tmp/rhinon-debug.log', `Campaign: ${campaign._id} (${campaign.name})\n`);
        fs.appendFileSync('/tmp/rhinon-debug.log', `Result: ${JSON.stringify(result, null, 2)}\n`);

        campaign.platformPostId = result.postId;
        campaign.stage = "Completed";
        await campaign.save();
        
        fs.appendFileSync('/tmp/rhinon-debug.log', `Final platformPostId in DB object: ${campaign.platformPostId}\n`);
        
        return NextResponse.json({ 
          success: true, 
          sent: 1,
          total: 1,
          message: "Social post successfully published to LinkedIn."
        });
      } catch (err: any) {
         console.error(`Error publishing social campaign ${campaign._id}:`, err);
         return NextResponse.json({ 
           error: "Failed to publish social post.", 
           details: err.message || "Unknown error"
         }, { status: 500 });
      }
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
