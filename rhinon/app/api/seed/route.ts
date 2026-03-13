import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
import Template from "@/lib/models/Template";
import AiActivity from "@/lib/models/AiActivity";
import { dummyUsers, dummyCampaigns, dummyLeads, dummyTemplates, dummyAiActivities } from "@/lib/dummy-data";

export async function GET() {
  try {
    await dbConnect();

    // Clear existing data
    await User.deleteMany({});
    await Campaign.deleteMany({});
    await Lead.deleteMany({});
    await Template.deleteMany({});
    await AiActivity.deleteMany({});

    // Seed Templates first to get IDs
    const createdTemplates = await Template.insertMany(
      dummyTemplates.map(({ id, ...rest }) => rest)
    );

    // Seed Users
    await User.insertMany(
      dummyUsers.map(({ id, ...rest }) => rest)
    );

    // Seed Campaigns
    const createdCampaigns = await Campaign.insertMany(
      dummyCampaigns.map(({ id, templateId, ...rest }) => {
        // Map dummy templateId to actual Mongo ID if possible, otherwise null
        const template = createdTemplates.find((t, index) => dummyTemplates[index].id === templateId);
        return {
          ...rest,
          templateId: template ? template._id : null
        };
      })
    );

    // Seed Leads
    const createdLeads = await Lead.insertMany(
      dummyLeads.map(({ id, campaignId, ...rest }) => {
        const campaignIdx = dummyCampaigns.findIndex(c => c.id === campaignId);
        return {
          ...rest,
          campaignId: campaignIdx !== -1 ? createdCampaigns[campaignIdx]._id : null
        };
      })
    );

    // Seed AiActivities
    await AiActivity.insertMany(
      dummyAiActivities.map(({ id, leadId, campaignId, ...rest }) => {
        const leadIdx = dummyLeads.findIndex(l => l.id === leadId);
        const campaignIdx = dummyCampaigns.findIndex(c => c.id === campaignId);
        return {
          ...rest,
          leadId: leadIdx !== -1 ? createdLeads[leadIdx]._id : null,
          campaignId: campaignIdx !== -1 ? createdCampaigns[campaignIdx]._id : null,
        };
      })
    );

    return NextResponse.json({ message: "Database seeded successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
