import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
import AiActivity from "@/lib/models/AiActivity";
import { generateAIEmailDraft, generateAISocialDraft } from "@/lib/gemini";
import { getRequestUser } from "@/lib/request-auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id: campaignId } = await params;

    const campaign = await Campaign.findById(campaignId).populate("templateId");
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Branch logic based on Channel
    if (campaign.channel === "Email") {
      // Find all leads for this campaign that haven't been processed yet
      const leads = await Lead.find({ 
        campaignId, 
        status: { $in: ["New", "Enrolled", "Enriched"] } 
      });
      console.log(`[DEBUG_PROCESS] Querying for campaignId = ${campaignId}. Found ${leads.length} leads matching status New/Enrolled/Enriched.`);
      
      let processedCount = 0;
      for (const lead of leads) {
        try {
          const draft = await generateAIEmailDraft(lead, campaign.templateId);
          
          // Update lead with draft and status
          lead.aiDraft = draft.body;
          lead.status = "Interested"; // Visual feedback for processed
          await lead.save();

          // Log the activity
          await AiActivity.create({
            leadId: lead._id,
            campaignId: campaign._id,
            type: "Outreach",
            content: "AI personalized outreach draft generated for this campaign.",
            generatedContent: draft.body,
            timestamp: new Date(),
          });

          processedCount++;
        } catch (err) {
          console.error(`Error processing lead ${lead._id}:`, err);
        }
      }

      // Update campaign processed count
      campaign.leadsProcessed += processedCount;
      await campaign.save();

      return NextResponse.json({ 
        success: true, 
        processed: processedCount,
        total: leads.length 
      });
    } else {
      // Social Broadcast Channels (No Leads)
      try {
        const draft = await generateAISocialDraft(campaign.templateId);
        
        campaign.aiDraft = draft;
        
        // If the template has media attached, ensure it's transferred to the post object
        if ((campaign.templateId as any).mediaUrl) {
          campaign.mediaUrl = (campaign.templateId as any).mediaUrl;
        }

        await campaign.save();

        return NextResponse.json({ 
          success: true, 
          processed: 1,
          total: 1,
          message: "Social draft generated successfully."
        });
      } catch (err) {
        console.error(`Error generating social draft for campaign ${campaign._id}:`, err);
        return NextResponse.json({ error: "Failed to generate social draft." }, { status: 500 });
      }
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
