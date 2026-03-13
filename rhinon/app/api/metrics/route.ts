import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";

export async function GET() {
  try {
    await dbConnect();

    const activeCampaigns = await Campaign.countDocuments({ stage: "Active" });
    const leadsProcessedToday = await Lead.countDocuments({ 
      lastActivityAt: { 
        $gte: new Date(new Date().setHours(0,0,0,0)) 
      } 
    });
    const totalLeads = await Lead.countDocuments({});
    
    // For demo/simplicity, we'll return some of these as hardcoded or computed.
    // In a real app, you'd aggregate these.
    
    const metrics = [
      { label: "Active Campaigns", value: activeCampaigns.toString(), delta: "+2 this week" },
      { label: "Leads Processed Today", value: leadsProcessedToday.toString(), delta: "+14.2%" },
      { label: "Total Leads", value: totalLeads.toLocaleString(), delta: "+6.4%" },
      { label: "Reply Rate", value: "22.8%", delta: "+1.7%" },
    ];

    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
