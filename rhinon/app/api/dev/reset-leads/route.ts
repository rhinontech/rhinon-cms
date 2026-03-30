import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
import AiActivity from "@/lib/models/AiActivity";

// ⚠️ Danger: This is a Dev-Only reset route!
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development environment." }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");

    await dbConnect();

    let campaignFilter = {};
    let leadFilter = {};
    
    // If a specific campaign ID is provided, scope it down. Otherwise WARNING: Resets all active campaigns!
    if (campaignId) {
      campaignFilter = { _id: campaignId };
      leadFilter = { campaignId: campaignId };
    }

    // 1. Reset Leads (Wipe drafts and set status back to New)
    const resultLeads = await Lead.updateMany(leadFilter, {
      $set: { 
        status: "New",
        aiDraft: "" 
      }
    });

    // 2. Wipe AiActivities so the daily SES limits mathematically reset to 0
    const resultActivities = await AiActivity.deleteMany(leadFilter);

    // 3. Reset Campaign counters and Stage
    const resultCampaigns = await Campaign.updateMany(campaignFilter, {
      $set: { 
        leadsProcessed: 0,
        stage: "Draft" // Put them back to Draft so you can safely edit them before immediately firing!
      }
    });

    return NextResponse.json({
      success: true,
      message: "Testing reset complete!",
      details: {
        leadsReset: resultLeads.modifiedCount,
        activitiesDeleted: resultActivities.deletedCount,
        campaignsResetToDraft: resultCampaigns.modifiedCount
      }
    });

  } catch (err: any) {
    console.error("Failed to reset testing state:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
