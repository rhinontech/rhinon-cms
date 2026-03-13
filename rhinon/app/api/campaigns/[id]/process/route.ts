import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
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

    // Find all leads for this campaign
    const leads = await Lead.find({ campaignId });
    
    // In a real production app, we would use a queue like BullMQ
    // For now, we'll process them in small batches or sequentially to avoid timeouts
    let processedCount = 0;
    for (const lead of leads) {
      // Check if lead already has a draft or is processed (simplified check)
      // For this demo, we'll just process everyone who isn't 'Replied'
      if (lead.status === "New" || lead.status === "Enrolled") {
        try {
          const draft = await generateAIEmailDraft(lead, campaign.templateId);
          // Update lead status and store draft (we might need a field for the draft in Lead model)
          // For now, we'll just update the status to show progress
          lead.status = "Interested"; // Dummy status change for visual feedback
          await lead.save();
          processedCount++;
        } catch (err) {
          console.error(`Error processing lead ${lead._id}:`, err);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedCount,
      total: leads.length 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
