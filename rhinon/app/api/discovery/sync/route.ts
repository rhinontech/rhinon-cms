import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";
import AiActivity from "@/lib/models/AiActivity";
import { mapApolloToLead } from "@/lib/connectors/apollo";
import { enrichLeadWithAI } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    await dbConnect();
    let { person, campaignId } = await req.json();
    
    // If email is missing (common in free search), try to fetch the full profile using the ID
    if (!person.email || person.email.includes("not_unlocked")) {
      const { enrichApolloLead, matchApolloLead } = await import("@/lib/connectors/apollo");
      
      let revealedPerson = null;
      if (person.id) {
        // match with ID is often more reliable than bulk_match for single reveals
        revealedPerson = await matchApolloLead({
          id: person.id,
          first_name: person.first_name,
          last_name: person.last_name,
          reveal_personal_emails: true
        });
      } else {
        revealedPerson = await matchApolloLead({
          first_name: person.first_name,
          last_name: person.last_name,
          organization_name: person.organization_name
        });
      }

      if (revealedPerson && revealedPerson.email && !revealedPerson.email.includes("not_unlocked")) {
        person = { ...person, ...revealedPerson };
      } else {
        return NextResponse.json({ 
          error: "Could not reveal contact details for this lead. This contact might be missing an email in Apollo or your credits are exhausted." 
        }, { status: 400 });
      }
    }

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
      content: `Discovered via Apollo.io: ${lead.title} at ${lead.company}`,
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
