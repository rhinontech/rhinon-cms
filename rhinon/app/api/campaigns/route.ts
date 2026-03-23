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

    const selectedLeads = selectedLeadIds.length > 0
      ? await Lead.find({ _id: { $in: selectedLeadIds } }).select("_id status")
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
        { _id: { $in: selectedLeadIds }, status: { $in: ["New", "Enriched"] } },
        { $set: { campaignId: campaign._id, status: "Enrolled" } }
      );

      await Lead.updateMany(
        { _id: { $in: selectedLeadIds }, status: { $nin: ["New", "Enriched"] } },
        { $set: { campaignId: campaign._id } }
      );
    }

    return NextResponse.json(serializeCampaign(campaign));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
