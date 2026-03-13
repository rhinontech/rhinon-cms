import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
import AiActivity from "@/lib/models/AiActivity";
import { generateAIEmailDraft } from "@/lib/gemini";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const campaignId = params.id;

    const campaign = await Campaign.findById(campaignId).populate("templateId");
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Find all leads for this campaign that haven't been processed yet
    const leads = await Lead.find({ 
      campaignId, 
      status: { $in: ["New", "Enrolled", "Enriched"] } 
    });
    
    let processedCount = 0;
    for (const lead of leads) {
      try {
        const draft = await generateAIEmailDraft(lead, campaign.templateId);
        
        // Update lead with draft and status
        lead.aiDraft = draft;
        lead.status = "Interested"; // Visual feedback for processed
        await lead.save();

        // Log the activity
        await AiActivity.create({
          leadId: lead._id,
          campaignId: campaign._id,
          type: "Outreach",
          content: "AI personalized outreach draft generated for this campaign.",
          generatedContent: draft,
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
