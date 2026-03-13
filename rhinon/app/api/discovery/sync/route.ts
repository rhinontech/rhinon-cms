import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";
import AiActivity from "@/lib/models/AiActivity";
import { mapApolloToLead } from "@/lib/connectors/apollo";
import { enrichLeadWithAI } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { person, campaignId } = await req.json();
    
    // Map Apollo person to our Lead model
    const leadData = {
      ...mapApolloToLead(person),
      campaignId: campaignId || null,
    };
    
    // Create the lead
    const lead = await Lead.create(leadData);

    // Automatically log a discovery activity
    await AiActivity.create({
      leadId: lead._id,
      campaignId: campaignId || undefined,
      type: "Discovery",
      content: `Discovered via Apollo.io: ${person.title} at ${person.organization_name}`,
      timestamp: new Date(),
    });

    // Trigger AI Enrichment in the background (fire and forget for now, or log errors)
    try {
      enrichLeadWithAI(lead.name, lead.company).then(async (enrichedData) => {
        await Lead.findByIdAndUpdate(lead._id, { 
          ...enrichedData,
          status: "Enriched" 
        });
        await AiActivity.create({
          leadId: lead._id,
          type: "Enrichment",
          content: "AI automatically enriched the profile with pain points and tech stack.",
          timestamp: new Date(),
        });
      });
    } catch (aiError) {
      console.error("Auto-Enrichment failed:", aiError);
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
