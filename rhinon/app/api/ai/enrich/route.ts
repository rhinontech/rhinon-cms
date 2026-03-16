import { NextResponse } from "next/server";
import { enrichLeadWithAI } from "@/lib/gemini";
import dbConnect from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";
import AiActivity from "@/lib/models/AiActivity";
import { getRequestUser } from "@/lib/request-auth";

export async function POST(req: Request) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { leadId } = await req.json();
    await dbConnect();

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ error: `Lead not found for ID: ${leadId}` }, { status: 404 });
    }

    const enrichment = await enrichLeadWithAI(lead.name, lead.company);
    
    // Log Activity
    await AiActivity.create({
      leadId: lead._id,
      campaignId: lead.campaignId,
      type: "Enrichment",
      content: enrichment.potentialPainPoint || "Lead enriched with AI intel",
      timestamp: new Date()
    });

    return NextResponse.json(enrichment);
  } catch (error: any) {
    console.error("AI Enrichment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
