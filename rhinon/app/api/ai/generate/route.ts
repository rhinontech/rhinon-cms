import { NextResponse } from "next/server";
import { generateAIEmailDraft } from "@/lib/gemini";
import dbConnect from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";
import Template from "@/lib/models/Template";
import AiActivity from "@/lib/models/AiActivity";

export async function POST(req: Request) {
  try {
    const { leadId, templateId, customPrompt } = await req.json();
    await dbConnect();

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ error: `Lead not found for ID: ${leadId}` }, { status: 404 });
    }

    let template = null;
    if (templateId) {
      template = await Template.findById(templateId);
    }

    const result = await generateAIEmailDraft(lead, template, customPrompt);
    const draft = typeof result === "string" ? result : result.body;
    const subject = typeof result === "string" ? null : result.subject;
    
    // Log Activity
    await AiActivity.create({
      leadId: lead._id,
      campaignId: lead.campaignId,
      type: "DraftGenerated",
      content: `Personalized AI outreach draft generated ${template ? `using template "${template.name}"` : "using custom prompt"}`,
      timestamp: new Date()
    });

    return NextResponse.json({ draft, subject });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
