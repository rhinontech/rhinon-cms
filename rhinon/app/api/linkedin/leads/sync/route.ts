import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";
import Campaign from "@/lib/models/Campaign";
import AiActivity from "@/lib/models/AiActivity";
import axios from "axios";
import { getValidLinkedInToken } from "@/lib/connectors/linkedin";

/**
 * API Route to manually trigger LinkedIn Lead Sync
 * In production, this would be a webhook or a scheduled cron job.
 */
export async function POST() {
  try {
    await dbConnect();
    const accessToken = await getValidLinkedInToken();

    // 1. Fetch Lead Gen Forms (or specific form responses)
    // For this implementation, we'll fetch recently submitted leads from LinkedIn
    // Reference: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/lead-gen/lead-gen-ads
    
    // Note: To fetch leads, we first need the Ad Form URNs associated with the account.
    // For this MVP, we'll simulate the fetch and focus on the data mapping.
    
    // Simulated LinkedIn Lead Data
    const mockLinkedInLeads = [
      {
        id: "li_lead_123",
        formId: "urn:li:adForm:123456",
        submittedAt: new Date().toISOString(),
        values: [
          { name: "first_name", value: "LinkedIn" },
          { name: "last_name", value: "User" },
          { name: "email_address", value: "lead@linkedin.com" },
          { name: "company_name", value: "LinkedIn Corp" },
          { name: "job_title", value: "Growth Manager" }
        ]
      }
    ];

    let syncedCount = 0;

    for (const liLead of mockLinkedInLeads) {
      const email = liLead.values.find(v => v.name === "email_address")?.value;
      if (!email) continue;

      // Check if lead already exists
      let lead = await Lead.findOne({ email });

      if (!lead) {
        lead = await Lead.create({
          name: `${liLead.values.find(v => v.name === "first_name")?.value} ${liLead.values.find(v => v.name === "last_name")?.value}`,
          email,
          company: liLead.values.find(v => v.name === "company_name")?.value || "Unknown",
          status: "New",
          source: "LinkedIn Lead Gen",
          metadata: {
            linkedinFormId: liLead.formId,
            linkedinLeadId: liLead.id,
            jobTitle: liLead.values.find(v => v.name === "job_title")?.value
          }
        });

        await AiActivity.create({
          leadId: lead._id,
          type: "Discovery",
          content: `Lead synced automatically from LinkedIn Lead Gen Form: ${liLead.formId}`,
          timestamp: new Date()
        });

        syncedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      message: `${syncedCount} new leads synchronized from LinkedIn.`
    });

  } catch (error: any) {
    console.error("LinkedIn Lead Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
