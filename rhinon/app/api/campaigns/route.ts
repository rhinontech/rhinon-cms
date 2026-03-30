import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
import { getRequestUser } from "@/lib/request-auth";
import { serializeCampaign } from "@/lib/serializers";

export async function GET(req: Request) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    return NextResponse.json(campaigns.map(serializeCampaign));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!getRequestUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    const normalizedName = String(body?.name || "").trim();
    const selectedLeadIds = Array.isArray(body?.selectedLeadIds)
      ? Array.from(new Set(body.selectedLeadIds.map((value: string) => String(value))))
      : [];

    if (!normalizedName) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
    }

    const csvLeadsInput = Array.isArray(body?.csvLeads) ? body.csvLeads : [];
    let customLeadIds: string[] = [];

    if (csvLeadsInput.length > 0) {
      const newLeadsData = csvLeadsInput.map((l: any) => ({
        name: l.name || "Unknown",
        email: l.email,
        company: l.company,
        title: l.title,
        source: "CSV Upload",
        status: "New",
      })).filter((l: any) => l.email);

      if (newLeadsData.length > 0) {
        const emails = newLeadsData.map((l: any) => l.email);
        
        // Find existing leads to avoid duplicates
        const existingLeads = await Lead.find({ email: { $in: emails } }).select("_id email");
        const existingEmails = new Set(existingLeads.map(l => l.email));
        const existingIds = existingLeads.map(l => l._id.toString());
        
        // Filter out leads that already exist
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

    const campaign = await Campaign.create({
      name: normalizedName,
      channel: body?.channel || "Email",
      templateId: body?.templateId || null,
      stage: body?.stage || "Draft",
      dailyLimit: Number(body?.dailyLimit ?? 50),
      startDate: body?.startDate ? new Date(body.startDate) : new Date(),
      leadsProcessed: 0,
      leadsTotal: selectedLeads.length,
      audienceGroupName: String(body?.audienceGroupName || "").trim() || undefined,
      objective: String(body?.objective || "").trim() || undefined,
      notes: String(body?.notes || "").trim() || undefined,
      targetCompanies: Array.isArray(body?.targetCompanies) ? body.targetCompanies : [],
      sourceFilters: Array.isArray(body?.sourceFilters) ? body.sourceFilters : [],
      statusFilters: Array.isArray(body?.statusFilters) ? body.statusFilters : [],
      leadIds: selectedLeads.map((lead: any) => lead._id),
      autoEnrollMatchingLeads: Boolean(body?.autoEnrollMatchingLeads),
    });

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
