import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
import AiActivity from "@/lib/models/AiActivity";
import { deleteLinkedInPost } from "@/lib/connectors/linkedin";
import { getRequestUser } from "@/lib/request-auth";
import { serializeCampaign } from "@/lib/serializers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id } = await params;
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(serializeCampaign(campaign));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const campaign = await Campaign.findByIdAndUpdate(id, body, { new: true });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(serializeCampaign(campaign));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id: campaignId } = await params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // LinkedIn Sync: Remove post from LinkedIn if it exists
    if (campaign.platformPostId) {
      try {
        await deleteLinkedInPost(campaign.platformPostId);
      } catch (err) {
        console.error("Failed to delete post from LinkedIn during campaign cleanup:", err);
      }
    }

    await Campaign.findByIdAndDelete(campaignId);

    // Preserve leads in the CRM and simply detach them from the deleted campaign.
    await Lead.updateMany(
      { campaignId, status: "Enrolled" },
      { $set: { campaignId: null, status: "New" } }
    );
    await Lead.updateMany(
      { campaignId, status: { $ne: "Enrolled" } },
      { $set: { campaignId: null } }
    );

    // Clean up associated AI Activities
    await AiActivity.deleteMany({ campaignId });

    return NextResponse.json({ success: true, message: "Campaign and associated data deleted." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const selectedLeadIds = Array.isArray(body?.selectedLeadIds) ? body.selectedLeadIds : [];
    const csvLeads = Array.isArray(body?.csvLeads) ? body.csvLeads : [];
    let customLeadIds: string[] = [];

    if (csvLeads.length > 0) {
      const newLeadsData = csvLeads.map((lead: any) => ({
        email: lead.email?.trim()?.toLowerCase(),
        name: lead.name?.trim(),
        company: lead.company?.trim(),
        title: lead.title?.trim(),
        status: "New",
        source: "CSV Import",
        linkedinUrl: lead.linkedinUrl?.trim() || "",
      })).filter((l: any) => l.email);

      if (newLeadsData.length > 0) {
        const emails = newLeadsData.map((l: any) => l.email);
        const existingLeads = await Lead.find({ email: { $in: emails } }).select("_id email");
        const existingEmails = new Set(existingLeads.map(l => l.email));
        const existingIds = existingLeads.map(l => l._id.toString());
        
        const leadsToInsert = newLeadsData.filter((l: any) => !existingEmails.has(l.email));

        let newIds: string[] = [];
        if (leadsToInsert.length > 0) {
          const createdLeads = await Lead.insertMany(leadsToInsert);
          newIds = createdLeads.map((l: any) => l._id.toString());
        }
        customLeadIds = [...existingIds, ...newIds];
      }
    }

    const finalLeadIds = [...selectedLeadIds, ...customLeadIds];

    const selectedLeads = finalLeadIds.length > 0
      ? await Lead.find({ _id: { $in: finalLeadIds } }).select("_id status")
      : [];

    campaign.name = body.name?.trim() || campaign.name;
    campaign.channel = body.channel || campaign.channel;
    campaign.templateId = body.templateId || campaign.templateId;
    campaign.stage = body.stage || campaign.stage;
    campaign.dailyLimit = Number(body.dailyLimit ?? campaign.dailyLimit);
    campaign.startDate = body.startDate ? new Date(body.startDate) : campaign.startDate;
    campaign.leadsTotal = selectedLeads.length;
    campaign.audienceGroupName = String(body.audienceGroupName || "").trim() || undefined;
    campaign.objective = String(body.objective || "").trim() || undefined;
    campaign.notes = String(body.notes || "").trim() || undefined;
    campaign.targetCompanies = Array.isArray(body.targetCompanies) ? body.targetCompanies : [];
    campaign.sourceFilters = Array.isArray(body.sourceFilters) ? body.sourceFilters : [];
    campaign.statusFilters = Array.isArray(body.statusFilters) ? body.statusFilters : [];
    campaign.leadIds = selectedLeads.map((l: any) => l._id);
    campaign.autoEnrollMatchingLeads = Boolean(body.autoEnrollMatchingLeads);
    
    await campaign.save();

    // Detach removed leads
    await Lead.updateMany(
      { campaignId: campaign._id, _id: { $nin: finalLeadIds }, status: "Enrolled" },
      { $set: { campaignId: null, status: "New" } }
    );
    await Lead.updateMany(
      { campaignId: campaign._id, _id: { $nin: finalLeadIds }, status: { $ne: "Enrolled" } },
      { $set: { campaignId: null } }
    );

    // Enroll and attach new/kept leads
    if (selectedLeads.length > 0) {
      await Lead.updateMany(
        { _id: { $in: finalLeadIds }, status: { $in: ["New", "Enriched"] } },
        { $set: { campaignId: campaign._id, status: "Enrolled" } }
      );
      await Lead.updateMany(
        { _id: { $in: finalLeadIds }, status: { $nin: ["New", "Enriched"] } },
        { $set: { campaignId: campaign._id } }
      );
    }

    return NextResponse.json(serializeCampaign(campaign));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

