import { NextResponse } from "next/server";
import { generateAIEmailDraft } from "@/lib/gemini";
import dbConnect from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";
import Template from "@/lib/models/Template";
import AiActivity from "@/lib/models/AiActivity";

export async function POST(req: Request) {
  try {
    const { leadId, templateId } = await req.json();
    await dbConnect();

    const [lead, template] = await Promise.all([
      Lead.findById(leadId),
      Template.findById(templateId),
    ]);

    if (!lead) {
      return NextResponse.json({ error: `Lead not found for ID: ${leadId}` }, { status: 404 });
    }
    if (!template) {
      return NextResponse.json({ error: `Template not found for ID: ${templateId}` }, { status: 404 });
    }

    const draft = await generateAIEmailDraft(lead, template);
    
    // Log Activity
    await AiActivity.create({
      leadId: lead._id,
      campaignId: lead.campaignId,
      type: "DraftGenerated",
      content: "Personalized AI outreach draft generated",
      timestamp: new Date()
    });

    return NextResponse.json({ draft });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
