import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
import Template from "@/lib/models/Template";

export async function GET() {
  try {
    await dbConnect();
    
    const campaigns = await Campaign.find();
    const allLeads = await Lead.find();
    
    const analysis = campaigns.map(camp => {
      const campLeads = allLeads.filter(l => l.campaignId?.toString() === camp._id.toString());
      const enrolled = campLeads.filter(l => ["Enrolled", "New"].includes(l.status)).length;
      const interested = campLeads.filter(l => l.status === "Interested").length;
      
      return {
        id: camp._id,
        name: camp.name,
        dbLeadsTotal: camp.leadsTotal,
        dbLeadsProcessed: camp.leadsProcessed,
        actualConnectedLeads: campLeads.length,
        actualEnrolled: enrolled,
        actualInterested: interested
      };
    });

    // Reset bugged testing state
    await Lead.updateMany({ status: "Interested" }, { $set: { status: "Enrolled", aiDraft: "" } });
    await Campaign.updateMany({}, { $set: { leadsProcessed: 0 } });
    
    return NextResponse.json({
      message: "Database analyzed and testing states reset successfully.",
      campaigns: analysis,
      totalTemplates: await Template.countDocuments(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
