import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
import Template from "@/lib/models/Template";
import AiActivity from "@/lib/models/AiActivity";

/**
 * PURGE ROUTE - DO NOT USE IN PRODUCTION WITHOUT AUTH
 * This route deletes all operational data to allow for a fresh start.
 */
export async function GET() {
  try {
    await dbConnect();

    // Clear operational data
    const campaignResult = await Campaign.deleteMany({});
    const leadResult = await Lead.deleteMany({});
    const templateResult = await Template.deleteMany({});
    const activityResult = await AiActivity.deleteMany({});

    return NextResponse.json({ 
      success: true,
      message: "Database successfully purged for a fresh start.",
      summary: {
        campaignsRemoved: campaignResult.deletedCount,
        leadsRemoved: leadResult.deletedCount,
        templatesRemoved: templateResult.deletedCount,
        activitiesRemoved: activityResult.deletedCount
      }
    });
  } catch (error: any) {
    console.error("Cleanup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
