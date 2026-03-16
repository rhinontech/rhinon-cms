import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
import { getRequestUser } from "@/lib/request-auth";

export async function GET(req: Request) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const activeCampaigns = await Campaign.countDocuments({ stage: "Active" });
    const leadsProcessedToday = await Lead.countDocuments({ 
      lastActivityAt: { 
        $gte: new Date(new Date().setHours(0,0,0,0)) 
      } 
    });
    const totalLeads = await Lead.countDocuments({});
    
    // Calculate real reply rate
    const repliedLeads = await Lead.countDocuments({ status: { $in: ["Replied", "Interested"] } });
    const contactedLeads = await Lead.countDocuments({ status: { $ne: "New" } });
    const replyRate = contactedLeads > 0 ? (repliedLeads / contactedLeads * 100).toFixed(1) : "0.0";

    // Leads pending AI processing
    const pendingLeads = await Lead.countDocuments({ aiDraft: { $exists: false }, campaignId: { $ne: null } });

    const metrics = [
      { label: "Active Campaigns", value: activeCampaigns.toString(), delta: "Live Data" },
      { label: "Leads Processed Today", value: leadsProcessedToday.toString(), delta: "Live Data" },
      { label: "Total Leads", value: totalLeads.toLocaleString(), delta: "Live Data" },
      { label: "Reply Rate", value: `${replyRate}%`, delta: "Live Data" },
    ];

    return NextResponse.json({
      metrics,
      queueCount: pendingLeads
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
